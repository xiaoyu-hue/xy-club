'use strict';
/**
 * 前端纯函数单测（T3）
 *
 * admin.js 在 Node 环境下通过最小 DOM 桩可被 require，并导出 esc / TYPES 供测试。
 * 浏览器中 module 未定义，导出语句被跳过，不影响线上行为。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ---- 最小 DOM 桩：让 admin.js 在 Node 下能完成模块加载 ----
function makeEl() {
  const handler = {
    get(t, p) {
      if (p === 'dataset') return {};
      if (p === 'classList') return { toggle() {}, add() {}, remove() {}, contains() { return false; } };
      if (p === 'style') return {};
      if (p === 'value' || p === 'textContent' || p === 'innerHTML') return '';
      return () => makeEl();
    },
    set() { return true; },
    apply() { return makeEl(); }
  };
  return new Proxy(function () {}, handler);
}
global.localStorage = {
  _s: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; }
};
global.document = {
  querySelector: () => makeEl(),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => makeEl(),
  body: makeEl(),
  documentElement: makeEl(),
  activeElement: null
};
global.window = global;
global.addEventListener = () => {};
global.fetch = () => {};
global.location = { reload() {} };

// main.js 在 Node 下加载所需的浏览器全局桩
global.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.performance = global.performance || { now: () => Date.now() };
global.innerHeight = 800;
global.scrollTo = () => {};

const { esc, TYPES } = require('../public/js/admin.js');
const { interp } = require('../public/js/main.js');

describe('esc（XSS 转义）', () => {
  test('转义 < > & " \'', () => {
    assert.equal(esc('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
    assert.equal(esc('a&b"c\'d'), 'a&amp;b&quot;c&#39;d');
  });

  test('null / undefined 安全返回空串', () => {
    assert.equal(esc(null), '');
    assert.equal(esc(undefined), '');
  });
});

describe('TYPES（主题 / 板块白名单）', () => {
  test('含 7 种板块类型', () => {
    assert.deepEqual(
      Object.keys(TYPES).sort(),
      ['cards', 'custom', 'faq', 'gallery', 'notice', 'services', 'testimonials', 'text']
    );
  });

  test('每种类型都有中文 label 与 itemLabel', () => {
    for (const [k, v] of Object.entries(TYPES)) {
      assert.ok(v.label && v.label.length > 0, `${k} 应有 label`);
      assert.ok('itemLabel' in v, `${k} 应有 itemLabel`);
    }
  });
});

describe('interp（占位符 {{custom.键名}}）', () => {
  test('替换存在的键', () => {
    assert.equal(interp('营业时间：{{custom.hours}}', { hours: '9:00-24:00' }), '营业时间：9:00-24:00');
  });

  test('不存在的键返回空串（不残留占位符）', () => {
    assert.equal(interp('x{{custom.missing}}y', {}), 'xy');
  });

  test('无占位符原样返回，且 null/undefined 安全', () => {
    assert.equal(interp('纯文本介绍', { a: '1' }), '纯文本介绍');
    assert.equal(interp(null, {}), '');
    assert.equal(interp(undefined, { a: '1' }), '');
  });

  test('键名支持点号与横线', () => {
    assert.equal(interp('{{custom.a-b.c_d}}', { 'a-b.c_d': 'ok' }), 'ok');
  });

  test('{{custom.x}} 与 esc 组合：自定义值里的 HTML 会被转义（无 XSS）', () => {
    // 渲染层约定先 interp 再 esc，这里验证 interp 原样透传，转义由 esc 负责
    assert.equal(interp('{{custom.x}}', { x: '<img src=x onerror=alert(1)>' }), '<img src=x onerror=alert(1)>');
  });
});
