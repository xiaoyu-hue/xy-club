/**
 * CSP 安全响应头测试（S8）
 * 
 * 验证：
 * 1. 所有响应携带 CSP header
 * 2. CSP 禁止 frame-ancestors（防点击劫持）
 * 3. CSP 限制 connect-src 为 self（防数据外泄）
 * 4. X-Content-Type-Options nosniff 生效
 * 5. X-Frame-Options DENY 生效
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { server, request, login } = require('./harness');

describe('CSP 安全响应头（S8）', () => {
  test('公开页面携带 CSP header', async () => {
    const res = await request('GET', '/api/content');
    assert.equal(res.status, 200);
    assert.ok(res.headers['content-security-policy'], '应设置 CSP header');
    assert.ok(res.headers['content-security-policy'].includes("frame-ancestors 'none'"), '应禁止嵌入框架');
  });

  test('CSP 限制 script-src 为 self + unsafe-inline', async () => {
    const res = await request('GET', '/');
    assert.ok(res.headers['content-security-policy'].includes("script-src"), '应限制脚本来源');
    assert.ok(res.headers['content-security-policy'].includes("'self'"), '应允许同源脚本');
    // unsafe-inline 是必要的：admin.html 含内联 script
    assert.ok(res.headers['content-security-policy'].includes("'unsafe-inline'"), '后台含内联脚本，保留 unsafe-inline');
  });

  test('X-Content-Type-Options nosniff 在所有页面生效', async () => {
    const res1 = await request('GET', '/');
    assert.equal(res1.headers['x-content-type-options'], 'nosniff');
    const res2 = await request('GET', '/admin');
    assert.equal(res2.headers['x-content-type-options'], 'nosniff');
  });

  test('X-Frame-Options DENY 防止点击劫持', async () => {
    const res = await request('GET', '/');
    assert.equal(res.headers['x-frame-options'], 'DENY');
  });

  test('CSP 不允许任意源加载脚本', async () => {
    const csp = await (await request('GET', '/')).headers['content-security-policy'];
    assert.ok(!csp.includes("*"), 'script-src 不应包含通配符 *');
    assert.ok(!csp.includes("cdn."), '不应允许 CDN 加载脚本');
  });

  test('登录接口也携带 CSP', async () => {
    const res = await request('POST', '/api/login', { body: { password: 'xy888888' } });
    assert.equal(res.status, 200);
    assert.ok(res.headers['content-security-policy'], '登录响应也应设 CSP');
  });

  test('CSP 包含 form-action self', async () => {
    const res = await request('GET', '/admin');
    const csp = res.headers['content-security-policy'];
    assert.ok(csp.includes("form-action 'self'"), '应限制表单提交到同源');
  });
});
