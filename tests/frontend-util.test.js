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

const { esc, TYPES } = require('../public/js/admin.js');

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
      ['cards', 'faq', 'gallery', 'notice', 'services', 'testimonials', 'text']
    );
  });

  test('每种类型都有中文 label 与 itemLabel', () => {
    for (const [k, v] of Object.entries(TYPES)) {
      assert.ok(v.label && v.label.length > 0, `${k} 应有 label`);
      assert.ok('itemLabel' in v, `${k} 应有 itemLabel`);
    }
  });
});
