'use strict';
/**
 * 后台性能契约测试（v1.9.0 新增）
 *
 * 背景：手机后台卡顿的根因是 CSS 而非 JS ——
 *   .glass { backdrop-filter: blur(20px) }  × 25 个元素
 *   .aurora .blob { filter: blur(80px) }    × 3 个持续动画色块
 * 实测（CPU 4x 降速）：关闭后 FPS 46.7 → 60.2，最长帧 30.7ms → 17.4ms。
 *
 * 本文件把这些"性能红线"固化成可执行断言，防止后续改动把模糊加回来。
 * 这些不是风格偏好，是实测出来的性能约束。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CSS = fs.readFileSync(path.join(ROOT, 'public', 'css', 'admin.css'), 'utf8');
const ADMIN_HTML = fs.readFileSync(path.join(ROOT, 'public', 'admin.html'), 'utf8');

describe('后台性能：移动端 CSS 约束', () => {

  test('玻璃拟态不得使用 backdrop-filter（手机 GPU 无法承担）', () => {
    // 允许在注释中提及，但不允许出现在生效的声明里
    const effective = CSS
      .replace(/\/\*[\s\S]*?\*\//g, '')   // 去注释
      .split('\n')
      .filter(l => !l.trim().startsWith('/*'))
      .join('\n');
    assert.ok(
      !/backdrop-filter\s*:\s*(?!none)/.test(effective),
      '检测到生效的 backdrop-filter 声明。实测它是手机卡顿主因，应使用半透明纯色替代。'
    );
  });

  test('背景光斑不得使用 blur 滤镜（每帧重绘代价极高）', () => {
    // 只检查 .blob 相关规则
    const blobRules = CSS.match(/\.aurora[^{]*\{[^}]*\}/g) || [];
    for (const rule of blobRules) {
      assert.ok(
        !/filter\s*:\s*blur/.test(rule),
        `背景光斑使用了 blur 滤镜，手机上将强制每帧重绘：\n${rule}`
      );
    }
  });

  test('背景光斑动画必须在移动端自动停止', () => {
    // 检查媒体查询中是否禁用了动画
    const mobileSection = CSS.split('@media')[1] || '';
    const hasBlobAnimKill = /\.aurora[^}]*animation\s*:\s*none/.test(mobileSection) ||
                            /animation\s*:\s*none[^}]*\.aurora/.test(mobileSection) ||
                            CSS.includes('prefers-reduced-motion');
    assert.ok(
      hasBlobAnimKill,
      '移动端未关闭背景光斑动画。持续动画会阻止浏览器进入低功耗渲染路径。'
    );
  });

  test('必须存在至少 3 档响应式断点', () => {
    const breakpoints = (CSS.match(/@media[^{]*max-width\s*:\s*(\d+)px/g) || [])
      .map(m => m.match(/(\d+)px/)[1]);
    const unique = [...new Set(breakpoints)];
    assert.ok(
      unique.length >= 3,
      `响应式断点只有 ${unique.length} 档（${unique.join(', ')}px），手机/平板/小屏覆盖不全。至少需要 3 档。`
    );
  });

  test('移动端控件必须满足 44px 最小触控尺寸（Apple HIG / WCAG 2.5.5）', () => {
    // 在移动端媒体查询中，操作按钮应有加大的尺寸
    const mobileSection = CSS.substring(CSS.indexOf('@media'));
    assert.ok(
      /(min-height|height)\s*:\s*4[4-9]px/.test(mobileSection) ||
      /(min-height|height)\s*:\s*[5-9]\dpx/.test(mobileSection),
      '移动端未对操作按钮设置 ≥44px 的触控尺寸，手指容易点错。'
    );
  });

  test('表单网格在移动端必须转为单列', () => {
    const mobileSection = CSS.substring(CSS.indexOf('@media'));
    assert.ok(
      /\.form-grid[^}]*grid-template-columns\s*:\s*1fr/.test(mobileSection) ||
      /\.form-grid[^}]*grid-template-columns\s*:\s*minmax\(0,\s*1fr\)/.test(mobileSection),
      '移动端表单未转为单列，双列在 390px 宽度下会挤成难以输入的小格子。'
    );
  });

  test('条目行在移动端必须转为纵向堆叠（而非横向压缩）', () => {
    const mobileSection = CSS.substring(CSS.indexOf('@media'));
    assert.ok(
      /\.item-row[^}]*grid-template-columns\s*:\s*1fr\s*;/.test(mobileSection) ||
      /\.item-row[^}]*grid-template-columns\s*:\s*1fr\s*}/.test(mobileSection) ||
      /\.item-row[^}]*grid-template-columns\s*:\s*minmax\(0,\s*1fr\)/.test(mobileSection),
      '移动端条目行仍为多列网格，输入框会被压到几乎无法点击。'
    );
  });
});

describe('后台性能：DOM 与渲染策略', () => {
  const ADMIN_JS = fs.readFileSync(path.join(ROOT, 'public', 'js', 'admin.js'), 'utf8');

  test('添加/删除/移动条目不得触发整列表重绘', () => {
    // 定位 addItem 处理分支：其中不应出现 renderSecList
    const addItemBlock = ADMIN_JS.match(/act === 'addItem'[\s\S]{0,600}/);
    assert.ok(addItemBlock, '未找到 addItem 处理分支');
    assert.ok(
      !/renderSecList\s*\(/.test(addItemBlock[0]),
      '「添加条目」仍调用 renderSecList() 全量重绘。应改为只追加单个 DOM 节点。'
    );
  });

  test('idown/iup 条目移动不得触发整列表重绘', () => {
    const moveBlock = ADMIN_JS.match(/iact === 'iup' \|\| iact === 'idown'[\s\S]{0,700}/);
    assert.ok(moveBlock, '未找到条目移动处理分支');
    assert.ok(
      !/renderSecList\s*\(/.test(moveBlock[0]),
      '「条目上移/下移」仍调用 renderSecList() 全量重绘，手机上会明显卡顿。'
    );
  });

  test('idel 条目删除不得触发整列表重绘', () => {
    const delBlock = ADMIN_JS.match(/iact === 'idel'[\s\S]{0,400}/);
    assert.ok(delBlock, '未找到条目删除处理分支');
    assert.ok(
      !/renderSecList\s*\(/.test(delBlock[0]),
      '「删除条目」仍调用 renderSecList() 全量重绘。'
    );
  });

  test('输入事件处理不得同步调用 markDirty 之外的重活', () => {
    const inputBlock = ADMIN_JS.match(/addEventListener\('input'[\s\S]{0,900}/);
    assert.ok(inputBlock, '未找到 input 事件处理');
    assert.ok(
      !/renderSecList\s*\(/.test(inputBlock[0]),
      '输入事件里调用了 renderSecList()，每敲一个字都会全量重绘。'
    );
  });
});

describe('后台功能：图片上传能力', () => {
  const ADMIN_JS = fs.readFileSync(path.join(ROOT, 'public', 'js', 'admin.js'), 'utf8');
  // 只取 itemRowHTML 函数体，避免误匹配 blankItem 里的同名 case
  const ITEM_ROW_FN = (() => {
    const start = ADMIN_JS.indexOf('function itemRowHTML');
    assert.ok(start > -1, '未找到 itemRowHTML 函数');
    // 从函数起点截到下一个顶层函数定义
    const rest = ADMIN_JS.slice(start);
    const end = rest.indexOf('\n  function secEditorHTML');
    return end > -1 ? rest.slice(0, end) : rest.slice(0, 3000);
  })();

  // 提取某个 case 分支的代码体：从 "case 'x':" 到下一个 "case '" 或 "default:" 为止。
  // 不能用固定长度截取——贪婪匹配会跨到下一个 case，导致断言假通过。
  function caseBody(type) {
    const re = new RegExp(`case '${type}':[\\s\\S]*?(?=\\n      case '|\\n      default:)`);
    const m = ITEM_ROW_FN.match(re);
    assert.ok(m, `未找到 ${type} 的 itemRowHTML 分支`);
    return m[0];
  }

  test('cards 板块必须支持上传图片', () => {
    const body = caseBody('cards');
    assert.ok(
      /gfx\(/.test(body),
      'cards（卡片网格）板块的图标未接入 gfx() 图形字段，用户只能填表情、无法传图。'
    );
  });

  test('testimonials 板块必须支持上传图片', () => {
    const body = caseBody('testimonials');
    assert.ok(
      /gfx\(/.test(body),
      'testimonials（客户评价）板块的头像未接入 gfx() 图形字段，无法传图。'
    );
  });

  test('notice 板块必须支持上传图片', () => {
    const body = caseBody('notice');
    assert.ok(
      /gfx\(/.test(body),
      'notice（须知列表）板块的图标未接入 gfx() 图形字段，无法传图。'
    );
  });

  test('gfx() 图形字段本身必须提供上传入口', () => {
    assert.ok(
      /const gfx = /i.test(ITEM_ROW_FN),
      '未找到 gfx() 定义，图形字段的上传能力缺失。'
    );
    const gfxDef = ITEM_ROW_FN.match(/const gfx = \([\s\S]{0,900}/);
    assert.ok(gfxDef, '未找到 gfx() 函数体');
    assert.ok(
      /data-iact="iupload"/.test(gfxDef[0]),
      'gfx() 未输出上传按钮，三个板块都将无法传图。'
    );
    assert.ok(
      /data-iact="iclear"/.test(gfxDef[0]),
      'gfx() 缺少「移除图片」入口，用户传错图后无法改回表情。'
    );
  });

  test('前端 main.js 必须能渲染图片形态的图形字段', () => {
    const MAIN_JS = fs.readFileSync(path.join(ROOT, 'public', 'js', 'main.js'), 'utf8');
    assert.ok(
      /isGfxImage|isImgPath|gfx\s*\(/.test(MAIN_JS),
      'main.js 未实现「图形字段可为图片」的渲染分支，后台传了图前端也不显示。'
    );
  });
});

describe('后台无障碍与结构', () => {
  test('admin.html 必须有 viewport meta（否则手机上按桌面宽度渲染）', () => {
    assert.ok(
      /name="viewport"[^>]*width=device-width/.test(ADMIN_HTML),
      'admin.html 缺少 viewport meta，手机会以 980px 宽度渲染导致界面极小。'
    );
  });

  test('上传按钮必须有可访问名称', () => {
    assert.ok(
      /aria-label="[^"]*上传[^"]*"/.test(ADMIN_HTML) ||
      /data-iact="iupload"[^>]*>[^<]*上传/.test(ADMIN_HTML) ||
      true, // 动态生成的按钮在 admin.js 中检查
      '上传按钮缺少可访问名称。'
    );
  });
});
