'use strict';
/**
 * 首页运行期注入（v1.11.0）
 *
 * 静态托管靠 scripts/build-static.js 预渲染；Node 部署则每次请求 GET / 时
 * 用当前内容即时注入，保证后台改完刷新就能被抓取，不会停留在构建时的旧内容。
 */
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const { server, request } = require('./harness');

const PASSWORD = 'test-pw-12345';
let token = '';

async function login() {
  const res = await request('POST', '/api/login', { body: { password: PASSWORD } });
  assert.strictEqual(res.status, 200, '登录应成功');
  // 取一次 CSRF token，harness 之后会自动带上 x-csrf-token
  await request('GET', '/api/csrf-token', { token: res.body.token });
  return res.body.token;
}

describe('首页运行期注入', () => {
  before(async () => {
    token = await login();
  });

  test('GET / 直接返回正文与社交卡片，而不是空壳', async () => {
    const res = await request('GET', '/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
    // 板块内容由 render.js 生成：默认模板第一个板块是 s-features
    assert.ok(/id="app"[^>]*>[\s\S]*<section/.test(res.text), '#app 里应有板块 HTML');
    assert.ok(/property="og:title"[^>]*content="[^"]+"/.test(res.text), 'og:title 应有值');
    assert.ok(!/<\/main>\s*<\/body>/.test(res.text), '#app 不该是空标签');
  });

  test('/index.html 与 / 一致（都走注入）', async () => {
    const a = await request('GET', '/');
    const b = await request('GET', '/index.html');
    assert.strictEqual(b.status, 200);
    assert.strictEqual(b.text.length, a.text.length);
  });

  test('后台改了内容，GET / 立刻反映，不用重新构建', async () => {
    const current = await request('GET', '/api/content');
    const payload = JSON.parse(JSON.stringify(current.body));
    payload.settings.siteName = '注入验证站点';
    payload.settings.slogan = '改完刷新就能被看到';
    const put = await request('PUT', '/api/content', { token, body: payload });
    assert.strictEqual(put.status, 200);

    const res = await request('GET', '/');
    assert.ok(res.text.includes('注入验证站点'), '站点名应即时出现在 HTML 里');
    assert.ok(res.text.includes('改完刷新就能被看到'), '文案应即时出现');
    assert.ok(!res.text.includes('adminPassword'), '注入结果不得泄露密码字段');
  });

  test('注入不破坏安全响应头', async () => {
    const res = await request('GET', '/');
    assert.ok(res.headers['content-security-policy'], '应有 CSP');
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
  });
});
