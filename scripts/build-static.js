#!/usr/bin/env node
/**
 * 生成静态站点产物校验（v1.8.0 起含多案例）
 *
 * 用途：把模板默认内容导出成一份纯 JSON，供 GitHub Pages 等「只有静态托管」的
 * 环境使用。官网前端在拿不到 /api/content 时会自动回退读取这份快照。
 *
 * v1.8.0 变化（ADR-005）：
 *   - 除 content.json（默认案例快照）外，**校验** public/cases/ 下的多案例资产：
 *     ① 每个案例 JSON 可解析、板块类型合法、不含凭据字段
 *     ② manifest.json 里每个 id 都有对应文件
 *     ③ 案例引用的本地图片真实存在
 *   校验失败即退出码 1，阻断 CI 部署（避免把坏产物发到线上）。
 *
 * 用法：node scripts/build-static.js
 */
const fs = require('fs');
const path = require('path');
const { DEFAULT_DB } = require('../defaults');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const CASES_DIR = path.join(PUBLIC_DIR, 'cases');

/* ---------------- 1. 生成默认案例快照 ---------------- */

// 优先使用站点真实内容（管理员可能已在后台自定义）；不存在时回退默认模板内容。
const liveDbPath = path.join(__dirname, '..', 'data', 'db.json');
let db;
if (fs.existsSync(liveDbPath)) {
  try {
    db = JSON.parse(fs.readFileSync(liveDbPath, 'utf8'));
    console.log('  检测到 data/db.json，以站点当前内容生成快照。');
  } catch (e) {
    db = JSON.parse(JSON.stringify(DEFAULT_DB));
    console.log('  data/db.json 解析失败，回退默认内容。');
  }
} else {
  db = JSON.parse(JSON.stringify(DEFAULT_DB));
  console.log('  未检测到 data/db.json，使用默认模板内容生成快照。');
}

// 静态快照里不应携带任何凭据
if (db.settings) delete db.settings.adminPassword;

const outFile = path.join(PUBLIC_DIR, 'content.json');
fs.writeFileSync(outFile, JSON.stringify(db, null, 2) + '\n');
const size = (fs.statSync(outFile).size / 1024).toFixed(1);
console.log(`✓ 已生成静态快照: public/content.json (${size} KB)`);

/* ---------------- 2. 校验多案例资产 ---------------- */

const ALLOWED_TYPES = new Set(['cards', 'services', 'testimonials', 'notice', 'faq', 'text', 'gallery', 'custom']);
const FORBIDDEN_KEYS = ['adminPassword', 'password', 'secret', 'token'];

let errors = 0;
function fail(msg) { console.error('  ✗ ' + msg); errors++; }

if (!fs.existsSync(CASES_DIR)) {
  fail('缺少 public/cases/ 目录（多案例资产）');
} else {
  // 2.1 manifest
  const manifestPath = path.join(CASES_DIR, 'manifest.json');
  let manifest = null;
  if (!fs.existsSync(manifestPath)) {
    fail('缺少 public/cases/manifest.json');
  } else {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (!Array.isArray(manifest.cases) || !manifest.cases.length) fail('manifest.json 的 cases 为空');
    } catch (e) { fail('manifest.json 解析失败: ' + e.message); }
  }

  // 2.2 逐个案例
  if (manifest && Array.isArray(manifest.cases)) {
    for (const c of manifest.cases) {
      const p = path.join(CASES_DIR, c.id + '.json');
      if (!fs.existsSync(p)) { fail(`manifest 中的案例「${c.id}」缺少对应文件 ${c.id}.json`); continue; }
      let data;
      try { data = JSON.parse(fs.readFileSync(p, 'utf8')); }
      catch (e) { fail(`${c.id}.json 解析失败: ${e.message}`); continue; }

      if (!data.settings || !Array.isArray(data.sections)) { fail(`${c.id}.json 结构非法（需 settings + sections）`); continue; }
      for (const s of data.sections) {
        if (!ALLOWED_TYPES.has(s.type)) fail(`${c.id}.json 含非法板块类型: ${s.type}`);
      }
      // 凭据零容忍
      const raw = JSON.stringify(data);
      for (const k of FORBIDDEN_KEYS) {
        if (new RegExp(`"${k}"\\s*:`).test(raw)) fail(`${c.id}.json 含禁止字段「${k}」`);
      }
      // 图片存在性
      const urls = [];
      const scan = (v) => {
        if (typeof v === 'string') { if (v.startsWith('./cases/') || v.startsWith('/cases/')) urls.push(v); return; }
        if (Array.isArray(v)) return v.forEach(scan);
        if (v && typeof v === 'object') return Object.values(v).forEach(scan);
      };
      scan(data);
      for (const u of urls) {
        const rel = u.replace(/^\.?\/cases\//, '');
        if (!fs.existsSync(path.join(CASES_DIR, rel))) fail(`${c.id}.json 引用的图片不存在: ${u}`);
      }
    }
  }
}

if (errors) {
  console.error(`\n✗ 静态构建校验失败：${errors} 处问题（已阻断部署）`);
  process.exit(1);
}
console.log('✓ 多案例资产校验通过（结构 / 类型 / 凭据 / 图片引用）');
console.log('  纯静态托管（如 GitHub Pages）会把 content.json 与 cases/ 一并作为内容来源。');
