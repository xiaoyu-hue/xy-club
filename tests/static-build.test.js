'use strict';
/**
 * 静态快照与静态托管兼容性
 *
 * GitHub Pages 只有静态托管，这两条一旦破了，线上就是白屏或密码泄露。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
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

  test('构建脚本同时校验多案例资产（v1.8.0 / ADR-005）', () => {
    // build-static.js 除生成快照外，还负责在 CI 阶段拦截坏案例资产。
    // 这里验证它确实读并检查了 cases 目录，且失败时会以非 0 退出。
    const src = fs.readFileSync(path.join(ROOT, 'scripts', 'build-static.js'), 'utf8');
    assert.match(src, /cases/, '构建脚本应处理 public/cases/');
    assert.match(src, /manifest\.json/, '构建脚本应校验 manifest.json');
    assert.match(src, /process\.exit\(1\)/, '校验失败必须以退出码 1 阻断 CI');
  });

  test('构建脚本在案例资产损坏时确实报错退出（负向用例）', () => {
    // 造一份坏 manifest，确认脚本会拒绝构建 —— 防止校验逻辑沦为摆设。
    const CASES = path.join(ROOT, 'public', 'cases');
    const manifestPath = path.join(CASES, 'manifest.json');
    const backup = fs.readFileSync(manifestPath, 'utf8');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xy-build-neg-'));
    try {
      // 指向一个不存在的案例文件
      fs.writeFileSync(manifestPath, JSON.stringify({
        cases: [{ id: 'definitely-not-exist', name: 'X', industry: 'X', emoji: 'X', theme: 'aurora' }]
      }, null, 2));

      let code = 0;
      try {
        execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build-static.js')], {
          cwd: ROOT, stdio: 'pipe'
        });
      } catch (e) {
        code = e.status;
      }
      assert.equal(code, 1, '坏 manifest 应导致构建失败（退出码 1）');
    } finally {
      fs.writeFileSync(manifestPath, backup);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('多案例 · 静态托管产物完整性', () => {
  test('部署需要的案例资产都在 public/ 内（相对 public 根可寻址）', () => {
    const manifestPath = path.join(ROOT, 'public', 'cases', 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'cases/manifest.json 应随 public/ 一起部署');
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const c of m.cases) {
      assert.ok(
        fs.existsSync(path.join(ROOT, 'public', 'cases', c.id + '.json')),
        `${c.id}.json 应随 public/ 一起部署`
      );
    }
  });

  test('图片授权台账随产物部署（对外可查）', () => {
    assert.ok(
      fs.existsSync(path.join(ROOT, 'public', 'cases', 'CREDITS.md')),
      'CREDITS.md 需放在 public/ 内，部署后用户可查图片来源'
    );
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
