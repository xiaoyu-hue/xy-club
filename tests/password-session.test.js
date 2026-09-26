'use strict';
/**
 * 修改密码应令其它会话失效（S2）
 *
 * 改密码的典型安全语义是"令其余会话失效"，旧 token 不应在 7 天过期前始终有效。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { request, login } = require('./harness');

describe('POST /api/password · 会话失效', () => {
  test('改密码后其它会话失效、当前会话保留', async () => {
    const tokenA = await login();
    const tokenB = await login(); // 第二个并发会话

    const res = await request('POST', '/api/password', {
      token: tokenA,
      body: { oldPassword: 'xy888888', newPassword: 'session-new-pw' }
    });
    assert.equal(res.status, 200);

    // 当前 token 应被保留
    const checkA = await request('GET', '/api/check', { token: tokenA });
    assert.equal(checkA.body.ok, true, '发起改密码的当前会话应保留有效');

    // 另一个会话应失效
    const checkB = await request('GET', '/api/check', { token: tokenB });
    assert.equal(checkB.body.ok, false, '其它会话应被令失效');

    // 旧密码失效、新密码可登录
    const oldLogin = await request('POST', '/api/login', { body: { password: 'xy888888' } });
    assert.equal(oldLogin.status, 401, '旧密码应失效');
    const newLogin = await request('POST', '/api/login', { body: { password: 'session-new-pw' } });
    assert.equal(newLogin.status, 200, '新密码应能登录');

    // 还原出厂密码，避免影响其它用例
    await request('POST', '/api/password', {
      token: newLogin.body.token,
      body: { oldPassword: 'session-new-pw', newPassword: 'xy888888' }
    });
  });
});
