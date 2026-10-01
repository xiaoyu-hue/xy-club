#!/usr/bin/env node
/**
 * 生成静态快照 public/content.json
 *
 * 用途：把模板默认内容导出成一份纯 JSON，供 GitHub Pages 等「只有静态托管」的
 * 环境使用。官网前端在拿不到 /api/content 时会自动回退读取这份快照，
 * 于是纯静态托管也能完整展示官网（后台需要 Node 服务，静态环境不可用）。
 *
 * 用法：node scripts/build-static.js
 */
const fs = require('fs');
const path = require('path');
const { DEFAULT_DB } = require('../defaults');

// 优先使用站点真实内容（管理员可能已在后台自定义）；不存在时回退默认模板内容。
// 这样本地跑 build-static 能导出管理员改过的当前内容，CI 纯静态部署无 db.json 时仍用默认。
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
if (db.settings) {
  delete db.settings.adminPassword;
}

const outFile = path.join(__dirname, '..', 'public', 'content.json');
fs.writeFileSync(outFile, JSON.stringify(db, null, 2) + '\n');

const size = (fs.statSync(outFile).size / 1024).toFixed(1);
console.log(`✓ 已生成静态快照: public/content.json (${size} KB)`);
console.log('  纯静态托管（如 GitHub Pages）会把这份快照作为官网内容来源。');
