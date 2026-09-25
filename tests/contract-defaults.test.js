'use strict';
/**
 * 契约测试：出厂数据 ↔ 渲染代码 ↔ 主题样式 ↔ 后台界面
 *
 * 这些文件平时各改各的，最容易出现的破版是"加了类型但忘了渲染"或"加了主题但后台没选项"。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { DEFAULT_DB } = require(path.join(ROOT, 'defaults'));

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const serverSrc = read('server.js');
const mainJs = read('public/js/main.js');
const styleCss = read('public/css/style.css');
const adminHtml = read('public/admin.html');
const sectionsDoc = read('docs/SECTIONS.md');

describe('板块类型契约', () => {
  const renderedTypes = new Set(
    [...mainJs.matchAll(/case '([\w-]+)':/g)].map((m) => m[1])
  );

  test('出厂内容里出现的每种板块，main.js 都有对应渲染分支', () => {
    const used = new Set(DEFAULT_DB.sections.map((s) => s.type));
    for (const t of used) {
      assert.ok(renderedTypes.has(t), `main.js 缺少 "${t}" 的渲染分支`);
    }
  });

  test('docs/SECTIONS.md 覆盖了所有出厂板块类型', () => {
    for (const t of new Set(DEFAULT_DB.sections.map((s) => s.type))) {
      assert.ok(sectionsDoc.includes(t), `docs/SECTIONS.md 未说明 "${t}"`);
    }
  });

  test('每个板块都有 id / type / visible，且 id 不重复', () => {
    const ids = new Set();
    for (const s of DEFAULT_DB.sections) {
      assert.ok(s.id, '板块缺少 id');
      assert.ok(s.type, '板块缺少 type');
      assert.equal(typeof s.visible, 'boolean', `${s.id} 的 visible 必须是布尔值`);
      assert.equal(ids.has(s.id), false, `板块 id 重复：${s.id}`);
      ids.add(s.id);
    }
  });

  test('至少覆盖 6 种板块类型', () => {
    assert.ok(new Set(DEFAULT_DB.sections.map((s) => s.type)).size >= 6);
  });
});

describe('主题契约', () => {
  const cssThemes = new Set(
    [...styleCss.matchAll(/html\[data-theme="([a-z]+)"\]/g)].map((m) => m[1])
  );
  const pickerThemes = new Set(
    [...adminHtml.matchAll(/data-theme="([a-z]+)"/g)].map((m) => m[1])
  );

  test('CSS 与后台主题选择器一一对应，不得缺项', () => {
    assert.deepEqual(
      [...cssThemes].sort(),
      [...pickerThemes].sort(),
      'CSS 定义了的主题后台必须能选，反之亦然'
    );
  });

  test('四套主题全部在位', () => {
    assert.deepEqual([...cssThemes].sort(), ['aurora', 'mist', 'ocean', 'sunset']);
  });

  test('出厂默认主题是合法值', () => {
    assert.ok(cssThemes.has(DEFAULT_DB.settings.theme), `默认主题 ${DEFAULT_DB.settings.theme} 未定义`);
  });
});

describe('出厂设置', () => {
  test('默认密码长度不低于 6 位（与服务端的校验一致）', () => {
    assert.ok(DEFAULT_DB.settings.adminPassword.length >= 6);
  });

  test('上传白名单不含 svg', () => {
    // 只从源码解析，不 require server.js —— 那会在真实仓库里创建 data/db.json
    const m = /const ALLOWED_EXTS = \[([^\]]+)\]/.exec(serverSrc);
    assert.ok(m, 'server.js 里应能找到 ALLOWED_EXTS');
    const exts = m[1].split(',').map((s) => s.trim().replace(/'/g, ''));
    assert.deepEqual(exts, ['jpg', 'png', 'webp', 'gif']);
    assert.equal(exts.includes('svg'), false);
  });
});
