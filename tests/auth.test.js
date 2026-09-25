'use strict';
/**
 * 登录与鉴权
 *
 * 这是本项目唯一的安全边界，任何一条失败都意味着后台门户大开。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { server, request, login, readDBFile, writeDBFile } = require('./harness');

describe('POST /api/login', () => {
  test('密码正确时返回 token', async () => {
    const res = await request('POST', '/api/login', { body: { password: 'xy888888' } });
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.match(res.body.token, /^[0-9a-f]{48}$/, 'token 应为 24 字节随机 hex');
  });

  test('密码错误时返回 401，且不回显密码', async () => {
    const res = await request('POST', '/api/login', { body: { password: 'wrong-pw' } });
    assert.equal(res.status, 401);
    assert.equal(res.body.ok, false);
    assert.equal(res.text.includes('wrong-pw'), false, '响应体不得回显用户输入的密码');
  });

  test('命中遗留明文密码时顺手升级为哈希', async () => {
    const before = readDBFile();
    const legacy = JSON.parse(JSON.stringify(before));
    legacy.settings.adminPassword = 'legacy-plain-pw';
    writeDBFile(legacy);

    try {
      const res = await request('POST', '/api/login', { body: { password: 'legacy-plain-pw' } });
      assert.equal(res.status, 200);

      const after = readDBFile();
      assert.ok(
        after.settings.adminPassword.startsWith('scrypt$'),
        '登录成功后明文密码应已被改写为哈希'
      );
      assert.notEqual(after.settings.adminPassword, 'legacy-plain-pw');
    } finally {
      writeDBFile(before); // 还原，避免影响后续用例
    }
  });
});

describe('GET /api/check', () => {
  test('未带 token 时返回未登录', async () => {
    const res = await request('GET', '/api/check');
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, false);
  });

  test('带有效 token 时返回已登录', async () => {
    const token = await login();
    const res = await request('GET', '/api/check', { token });
    assert.equal(res.body.ok, true);
  });

  test('伪造 token 一律视为未登录', async () => {
    const res = await request('GET', '/api/check', { token: 'forged-token' });
    assert.equal(res.body.ok, false);
  });

  test('过期会话视为未登录', async () => {
    const token = await login();
    server.sessions.set(token, Date.now() - 1000); // 手动把过期时间拨到过去
    const res = await request('GET', '/api/check', { token });
    assert.equal(res.body.ok, false);
  });
});

describe('鉴权中间件', () => {
  test('写接口无 token 时拒绝', async () => {
    for (const [method, p] of [['PUT', '/api/content'], ['POST', '/api/password'], ['POST', '/api/reset'], ['POST', '/api/upload']]) {
      const res = await request(method, p, { body: {} });
      assert.equal(res.status, 401, `${method} ${p} 未鉴权应返回 401`);
    }
  });

  test('公开读接口无需 token', async () => {
    const res = await request('GET', '/api/content');
    assert.equal(res.status, 200);
  });

  test('/api/health 无需鉴权', async () => {
    const res = await request('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });
});

describe('POST /api/password', () => {
  test('原密码错误时拒绝修改', async () => {
    const token = await login();
    const res = await request('POST', '/api/password', {
      token,
      body: { oldPassword: 'definitely-wrong', newPassword: 'newpass123' }
    });
    assert.equal(res.status, 400);
  });

  test('新密码不足 6 位时拒绝', async () => {
    const token = await login();
    const res = await request('POST', '/api/password', {
      token,
      body: { oldPassword: 'xy888888', newPassword: '123' }
    });
    assert.equal(res.status, 400);
  });

  test('修改成功后新密码可登录、旧密码失效', async () => {
    const token = await login();
    const original = readDBFile();

    try {
      const res = await request('POST', '/api/password', {
        token,
        body: { oldPassword: 'xy888888', newPassword: 'brand-new-pw' }
      });
      assert.equal(res.status, 200);

      const ok = await request('POST', '/api/login', { body: { password: 'brand-new-pw' } });
      assert.equal(ok.status, 200, '新密码应能登录');

      const old = await request('POST', '/api/login', { body: { password: 'xy888888' } });
      assert.equal(old.status, 401, '旧密码应失效');
    } finally {
      writeDBFile(original); // 还原出厂密码
    }
  });
});
