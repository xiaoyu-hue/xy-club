'use strict';
/**
 * 登录限流
 *
 * 单独一个文件：node --test 每个文件一个进程，
 * 这样失败计数不会污染其它用例的真实登录。
 */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { server, request } = require('./harness');

const { MAX_ATTEMPTS, loginAttempts } = server;

beforeEach(() => {
  loginAttempts.clear();
});

describe('登录失败计数', () => {
  test('连续失败达到阈值前仍返回 401（不提前暴露限流状态）', async () => {
    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      const res = await request('POST', '/api/login', { body: { password: 'bad-' + i } });
      assert.equal(res.status, 401, `第 ${i} 次失败应返回 401`);
    }
  });

  test('超过阈值后锁定，正确密码也被挡在门外（429）', async () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await request('POST', '/api/login', { body: { password: 'bad-' + i } });
    }
    const res = await request('POST', '/api/login', { body: { password: 'xy888888' } });
    assert.equal(res.status, 429);
    assert.match(res.body.error, /5\s*分钟/, '应提示锁定时长');
  });

  test('锁定期间 /api/check 不受影响', async () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await request('POST', '/api/login', { body: { password: 'bad-' + i } });
    }
    const res = await request('GET', '/api/check');
    assert.equal(res.status, 200);
  });

  test('登录成功后计数清零', async () => {
    await request('POST', '/api/login', { body: { password: 'bad-1' } });
    await request('POST', '/api/login', { body: { password: 'bad-2' } });
    const ok = await request('POST', '/api/login', { body: { password: 'xy888888' } });
    assert.equal(ok.status, 200);
    assert.equal(loginAttempts.size, 0, '成功后应清除该 IP 的失败记录');
  });

  test('锁定会在 LOCK_MS 后自动解除', async () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await request('POST', '/api/login', { body: { password: 'bad-' + i } });
    }
    // 不硬编码 IP：直接取实际被记录的那条
    const ip = Array.from(loginAttempts.keys())[0];
    assert.ok(ip, '限流表里应有记录');
    assert.equal(server.isLocked(ip), true);

    // 直接把锁定时间拨到过去，避免真的等 5 分钟
    loginAttempts.get(ip).until = Date.now() - 1;
    assert.equal(server.isLocked(ip), false);
    const res = await request('POST', '/api/login', { body: { password: 'xy888888' } });
    assert.equal(res.status, 200);
  });
});

describe('限流参数', () => {
  test('阈值 5 次、锁定时长 5 分钟', () => {
    assert.equal(server.MAX_ATTEMPTS, 5);
    assert.equal(server.LOCK_MS, 5 * 60 * 1000);
  });
});
