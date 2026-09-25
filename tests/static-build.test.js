'use strict';
/**
 * 静态快照与静态托管兼容性
 *
 * GitHub Pages 只有静态托管，这两条一旦破了，线上就是白屏或密码泄露。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CONTENT_JSON = path.join(ROOT, 'public', 'content.json');

describe('scripts/build-static.js', () => {
  test('生成的快照不含任何凭据', () => {
    if (fs.existsSync(CONTENT_JSON)) fs.unlinkSync(CONTENT_JSON);

    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build-static.js')], {
      cwd: ROOT,
      stdio: 'pipe'
    });

    assert.ok(fs.existsSync(CONTENT_JSON), '应生成 public/content.json');
    const raw = fs.readFileSync(CONTENT_JSON, 'utf8');
    const db = JSON.parse(raw);

    assert.equal('adminPassword' in (db.settings || {}), false, '快照不得携带 adminPassword');
    assert.equal(raw.includes('adminPassword'), false);
    assert.equal(raw.includes('scrypt$'), false);
    assert.ok(Array.isArray(db.sections) && db.sections.length > 0, '快照应含板块内容');
  });

  test('快照已被 gitignore（不会误提交）', () => {
    const gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    assert.match(gi, /public\/content\.json/);
  });
});

describe('静态托管兼容性（相对路径）', () => {
  test('index.html 不引用站点根绝对路径', () => {
    const html = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
    assert.equal(/href="\/css\//.test(html), false, 'css 必须用相对路径');
    assert.equal(/src="\/js\//.test(html), false, 'js 必须用相对路径');
    assert.equal(/href="\/admin"/.test(html), false, '后台入口应指向 admin.html');
  });

  test('admin.html 不引用站点根绝对路径', () => {
    const html = fs.readFileSync(path.join(ROOT, 'public', 'admin.html'), 'utf8');
    assert.equal(/href="\/css\//.test(html), false);
    assert.equal(/src="\/js\//.test(html), false);
    assert.equal(/href="\/"/.test(html), false, '返回官网应指向 index.html');
  });

  test('官网具备静态回退能力（读不到 API 时读 content.json）', () => {
    const js = fs.readFileSync(path.join(ROOT, 'public', 'js', 'main.js'), 'utf8');
    assert.match(js, /content\.json/, 'main.js 应保留静态快照回退分支');
    assert.match(js, /static-mode/, '静态模式应给 <html> 打标记以隐藏后台入口');
  });

  test('静态模式下隐藏后台入口', () => {
    const css = fs.readFileSync(path.join(ROOT, 'public', 'css', 'style.css'), 'utf8');
    assert.match(css, /static-mode[\s\S]{0,200}admin-link[\s\S]{0,200}display:\s*none/);
  });
});
