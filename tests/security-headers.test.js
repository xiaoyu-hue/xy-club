/**
 * HTTP 安全头测试
 * 
 * 验证：
 * 1. 响应包含必要的安全头
 * 2. X-Powered-By 被移除
 * 3. CSP 头正确配置
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { server, request } = require('./harness');

describe('HTTP 安全头（Phase 0）', () => {
  test('所有响应包含 X-Content-Type-Options: nosniff', async () => {
    const res = await request('GET', '/api/content');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
  });

  test('所有响应包含 X-Frame-Options: DENY', async () => {
    const res = await request('GET', '/api/content');
    assert.equal(res.headers['x-frame-options'], 'DENY');
  });

  test('X-XSS-Protection 设为 0（禁用旧式防护）', async () => {
    const res = await request('GET', '/api/content');
    assert.equal(res.headers['x-xss-protection'], '0');
  });

  test('包含 Referrer-Policy', async () => {
    const res = await request('GET', '/api/content');
    assert.equal(res.headers['referrer-policy'], 'strict-origin-when-cross-origin');
  });

  test('包含 Permissions-Policy（限制敏感 API 访问）', async () => {
    const res = await request('GET', '/api/content');
    assert.ok(res.headers['permissions-policy'].includes('camera=()'));
    assert.ok(res.headers['permissions-policy'].includes('microphone=()'));
  });

  test('移除 X-Powered-By 头（不暴露 Express 版本）', async () => {
    const res = await request('GET', '/api/content');
    assert.equal(res.headers['x-powered-by'], undefined);
  });

  test('CSP 头包含必要指令', async () => {
    const res = await request('GET', '/api/content');
    const csp = res.headers['content-security-policy'];
    assert.ok(csp.includes("default-src 'self'"));
    assert.ok(csp.includes("script-src 'self' 'unsafe-inline'"));
    assert.ok(csp.includes("style-src 'self' 'unsafe-inline'"));
    assert.ok(csp.includes("frame-ancestors 'none'"));
  });

  test('静态文件也包含安全头', async () => {
    const res = await request('GET', '/index.html');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'DENY');
  });

  test('健康检查端点包含安全头', async () => {
    const res = await request('GET', '/api/health');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'DENY');
  });
});
