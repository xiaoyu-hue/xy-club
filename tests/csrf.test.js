/**
 * CSRF 防护测试（S7）
 * 
 * 验证：
 * 1. /api/csrf-token 返回有效的 token
 * 2. 未登录无法获取 CSRF token
 * 3. 写入接口需要携带有效的 CSRF token
 * 4. 缺少/错误的 CSRF token 被拒绝（403）
 * 5. 改密码后旧 CSRF token 失效
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { server, request, login, readDBFile, writeDBFile, TEST_PASSWORD } = require('./harness');

describe('CSRF 防护（S7）', () => {
  describe('GET /api/csrf-token', () => {
    test('未登录时返回 401', async () => {
      const res = await request('GET', '/api/csrf-token');
      assert.equal(res.status, 401);
    });

    test('已登录时返回 csrfToken', async () => {
      const token = await login();
      const res = await request('GET', '/api/csrf-token', { token });
      assert.equal(res.status, 200);
      assert.ok(res.body.csrfToken && typeof res.body.csrfToken === 'string');
      assert.ok(res.body.csrfToken.length >= 32);
    });

    test('每次请求生成不同的 token', async () => {
      const token = await login();
      const r1 = await request('GET', '/api/csrf-token', { token });
      const r2 = await request('GET', '/api/csrf-token', { token });
      assert.notEqual(r1.body.csrfToken, r2.body.csrfToken);
    });
  });

  describe('写入接口 CSRF 校验', () => {
    test('PUT /api/content 缺少 CSRF token 时返回 403', async () => {
      const token = await login();
      // 清空 CSRF 缓存，让请求不携带 token
      server.csrfTokens.delete(token);
      const res = await request('PUT', '/api/content', {
        token,
        body: { settings: { title: 'Test' }, sections: [] }
      });
      assert.equal(res.status, 403);
    });

    test('PUT /api/content 错误 CSRF token 时返回 403', async () => {
      const token = await login();
      // 清空 CSRF 缓存，然后手动传入错误 token
      server.csrfTokens.delete(token);
      const res = await request('PUT', '/api/content', {
        token,
        headers: { 'x-csrf-token': 'invalid-csrf' },
        body: { settings: { title: 'Test' }, sections: [] }
      });
      assert.equal(res.status, 403);
    });

    test('POST /api/password 缺少 CSRF token 时返回 403', async () => {
      const token = await login();
      server.csrfTokens.delete(token);
      const res = await request('POST', '/api/password', {
        token,
        body: { oldPassword: TEST_PASSWORD, newPassword: 'newpass123' }
      });
      assert.equal(res.status, 403);
    });

    test('POST /api/reset 缺少 CSRF token 时返回 403', async () => {
      const token = await login();
      server.csrfTokens.delete(token);
      const res = await request('POST', '/api/reset', {
        token,
        body: { password: TEST_PASSWORD }
      });
      assert.equal(res.status, 403);
    });

    test('带有效 CSRF token 时 PUT /api/content 成功', async () => {
      const token = await login();
      const csrfRes = await request('GET', '/api/csrf-token', { token });
      const res = await request('PUT', '/api/content', {
        token,
        headers: { 'x-csrf-token': csrfRes.body.csrfToken },
        body: { settings: { title: 'CSRF Test' }, sections: [] }
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.ok);
    });

    test('GET 请求不需要 CSRF token', async () => {
      const res = await request('GET', '/api/content');
      assert.equal(res.status, 200);
    });

    test('改密码后旧 CSRF token 失效', async () => {
      const original = readDBFile();
      try {
        const token = await login();
        const csrfRes = await request('GET', '/api/csrf-token', { token });
        const csrfToken = csrfRes.body.csrfToken;

        // 改密码（需要 CSRF token）
        const pwRes = await request('POST', '/api/password', {
          token,
          headers: { 'x-csrf-token': csrfToken },
          body: { oldPassword: TEST_PASSWORD, newPassword: 'newpassword123' }
        });
        assert.equal(pwRes.status, 200, '改密码应成功');

        // 改密码后原 token 的会话仍有效（服务端保留了当前会话），
        // 但 CSRF token 已过期（因为服务端不清理 csrfTokens，需要重新获取）
        const newCsrfRes = await request('GET', '/api/csrf-token', { token });
        assert.equal(newCsrfRes.status, 200, '当前会话仍有效，可获取新 CSRF token');
        assert.notEqual(newCsrfRes.body.csrfToken, csrfToken, '新 CSRF token 应与旧的不同');

        // 旧 CSRF token 对新请求无效
        const putRes = await request('PUT', '/api/content', {
          token,
          headers: { 'x-csrf-token': csrfToken },
          body: { settings: { title: 'Test' }, sections: [] }
        });
        assert.equal(putRes.status, 403, '旧 CSRF token 应失效');
      } finally {
        writeDBFile(original);
      }
    });
  });

  describe('CSRF token 与 session 绑定', () => {
    test('不同 session 的 CSRF token 不能互相使用', async () => {
      const login1 = await login();
      const login2 = await login();
      const csrf1 = await request('GET', '/api/csrf-token', { token: login1 });

      // 清空 login2 的 CSRF 缓存，确保不会自动注入
      server.csrfTokens.delete(login2);

      // 用 token2 + csrfToken1 尝试写入
      const res = await request('PUT', '/api/content', {
        token: login2,
        headers: { 'x-csrf-token': csrf1.body.csrfToken },
        body: { settings: { title: 'Test' }, sections: [] }
      });
      assert.equal(res.status, 403);
    });
  });
});
