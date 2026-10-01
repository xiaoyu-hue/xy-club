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
    assert.ok(csp.includes("style-src 'self' 'unsafe-inline'"));
    assert.ok(csp.includes("frame-ancestors 'none'"));
    assert.ok(csp.includes("object-src 'none'"));
  });

  // v1.7.0：内联脚本已全部抽成外部文件，因此 script-src 不再需要 'unsafe-inline'。
  // 这是 CSP 里最关键的一条 —— 放开它等于放弃 XSS 的主防线，必须钉死。
  test('script-src **不允许** unsafe-inline（XSS 主防线）', async () => {
    const res = await request('GET', '/api/content');
    const csp = res.headers['content-security-policy'];
    const scriptSrc = csp.split(';').map((s) => s.trim()).find((s) => s.startsWith('script-src')) || '';
    assert.equal(/'unsafe-inline'/.test(scriptSrc), false, `script-src 不应含 unsafe-inline，实际：${scriptSrc}`);
    assert.ok(scriptSrc.includes("'self'"));
  });

  test('前端页面里没有内联 <script>（否则 CSP 会拦掉）', () => {
    const fs = require('fs');
    const path = require('path');
    for (const f of ['index.html', 'admin.html', 'themes-demo.html']) {
      const html = fs.readFileSync(path.join(__dirname, '..', 'public', f), 'utf8');
      assert.equal(/<script(?![^>]*\bsrc=)[^>]*>/.test(html), false, `${f} 含内联 script`);
    }
  });

  test('响应带 HSTS 头', async () => {
    const res = await request('GET', '/api/content');
    const hsts = res.headers['strict-transport-security'];
    assert.ok(hsts, '应设置 Strict-Transport-Security');
    assert.match(hsts, /max-age=\d+/);
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
