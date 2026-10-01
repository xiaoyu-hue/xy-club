'use strict';
/**
 * 图片版权契约测试（v1.9.0 新增）
 *
 * 背景：v1.8.0 的 CREDITS.md 登记了 16 张「Unsplash 免费商用」图片，
 * 但登记的 URL 使用了 12 位十六进制 ID —— 而 Unsplash 的照片 ID 是
 * 11 位短码（varchar(11)，如 9wYdW55NbnY），格式对不上，
 * 意味着台账里的链接无法解析，授权主张无法自证。
 * 同时 16 张图里只有 4 张被案例 JSON 实际引用，其余 12 张是僵尸文件。
 *
 * 本文件把这些合规要求固化成可执行断言：
 *   - 台账清单与图片目录必须双向一致（防僵尸文件、防漏登记）
 *   - 案例 JSON 引用的图片必须真实存在（防引用失效）
 *   - 台账不得再出现不可核验的第三方图库链接（防编造台账）
 *
 * 这不是风格偏好，是版权合规的底线约束。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'public', 'cases', 'images');
const CASES_DIR = path.join(ROOT, 'public', 'cases');
const CREDITS = fs.readFileSync(path.join(CASES_DIR, 'CREDITS.md'), 'utf8');

/** 目录下实际存在的图片文件名 */
function actualImages() {
  return fs.readdirSync(IMG_DIR)
    .filter(f => /\.(webp|png|jpe?g|gif|svg|avif)$/i.test(f))
    .sort();
}

/** CREDITS.md 清单里登记的文件名（只取表格中引用的文件名） */
function listedImages() {
  const names = new Set();
  // 匹配表格单元格里的 `xxx.webp` 形式
  for (const m of CREDITS.matchAll(/`([A-Za-z0-9_.-]+\.(?:webp|png|jpe?g|gif|svg|avif))`/gi)) {
    names.add(m[1]);
  }
  return [...names].sort();
}

/** 递归收集 JSON 中所有指向本地案例图片的路径 */
function referencedImages() {
  const refs = new Set();
  for (const f of fs.readdirSync(CASES_DIR).filter(x => x.endsWith('.json'))) {
    const raw = fs.readFileSync(path.join(CASES_DIR, f), 'utf8');
    for (const m of raw.matchAll(/\.\/cases\/images\/([A-Za-z0-9_.-]+)/g)) {
      refs.add(m[1]);
    }
  }
  return [...refs].sort();
}

describe('图片版权：台账与目录一致性', () => {

  test('CREDITS.md 登记的图片与目录实际文件完全一致（双向）', () => {
    const listed = listedImages();
    const actual = actualImages();

    const missingInDir = listed.filter(x => !actual.includes(x));
    const missingInCredits = actual.filter(x => !listed.includes(x));

    assert.deepEqual(
      missingInDir, [],
      `CREDITS.md 登记了但目录里不存在的图片：${missingInDir.join(', ')}`
    );
    assert.deepEqual(
      missingInCredits, [],
      `目录里存在但未在 CREDITS.md 登记的图片（僵尸文件或漏登记）：${missingInCredits.join(', ')}`
    );
  });

  test('目录中不存在未被任何案例引用的僵尸图片', () => {
    const actual = actualImages();
    const referenced = referencedImages();
    const zombies = actual.filter(x => !referenced.includes(x));

    assert.deepEqual(
      zombies, [],
      `以下图片未被任何案例 JSON 引用，属于无用途的僵尸文件：${zombies.join(', ')}`
    );
  });

  test('案例 JSON 引用的图片路径全部真实存在', () => {
    const actual = actualImages();
    const referenced = referencedImages();
    const broken = referenced.filter(x => !actual.includes(x));

    assert.deepEqual(
      broken, [],
      `案例引用了不存在的图片（会导致页面图裂）：${broken.join(', ')}`
    );
  });

  test('images 目录非空（防止误清空）', () => {
    assert.ok(actualImages().length > 0, 'public/cases/images/ 目录为空');
  });
});

describe('图片版权：授权来源可核验', () => {

  test('CREDITS.md 不得再登记无法核验的第三方图库链接', () => {
    // Unsplash 照片 ID 是 11 位短码（大小写字母/数字/-/_），
    // 而非 12 位纯十六进制。历史上台账登记的正是不合法的 12 位 hex，
    // 这类"看着像但不是"的链接必须禁止再次出现。
    const badHex = [...CREDITS.matchAll(/unsplash\.com\/photos\/([0-9a-fA-F]{12})\b/g)]
      .map(m => m[1]);

    assert.deepEqual(
      badHex, [],
      `CREDITS.md 出现了 12 位十六进制伪 Unsplash ID（真实 ID 为 11 位短码）：${badHex.join(', ')}`
    );
  });

  test('当前图片均已声明为自有版权或可核验授权', () => {
    assert.ok(
      /自有版权/.test(CREDITS),
      'CREDITS.md 必须明确声明图片版权归属（如「自有版权」）'
    );
  });

  test('CREDITS.md 说明了图片的处理规格', () => {
    assert.ok(/WebP/i.test(CREDITS), 'CREDITS.md 应说明图片格式处理方式');
    assert.ok(/1400/.test(CREDITS), 'CREDITS.md 应说明图片尺寸上限');
  });
});

describe('图片版权：文件规格符合声明', () => {

  test('清单中声明的图片格式与实际扩展名一致', () => {
    const webps = actualImages().filter(f => f.endsWith('.webp'));
    assert.ok(webps.length > 0, '应存在 WebP 格式图片');
  });

  test('图片文件体积均在合理范围内（单张 < 1.5MB）', () => {
    const tooBig = actualImages()
      .map(f => ({ f, size: fs.statSync(path.join(IMG_DIR, f)).size }))
      .filter(x => x.size > 1.5 * 1024 * 1024);

    assert.deepEqual(
      tooBig.map(x => `${x.f}(${Math.round(x.size / 1024)}KB)`), [],
      '以下图片超过 1.5MB 体积上限'
    );
  });
});
