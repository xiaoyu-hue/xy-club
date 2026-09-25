#!/usr/bin/env node
/**
 * 重置后台管理密码。
 *
 * 密码以 scrypt 哈希存储，无法直接手写成明文，所以改用这个脚本。
 *
 * 用法：
 *   node scripts/reset-password.js 新密码
 *   node scripts/reset-password.js            （不加参数则重置为默认密码 xy888888）
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');
const DEFAULT_PASSWORD = 'xy888888';

const newPassword = process.argv[2] || DEFAULT_PASSWORD;

if (String(newPassword).length < 6) {
  console.error('✗ 密码至少 6 位');
  process.exit(1);
}

if (!fs.existsSync(DB_FILE)) {
  console.error(`✗ 找不到 ${DB_FILE}，请先启动一次服务以生成它`);
  process.exit(1);
}

let db;
try {
  db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
} catch (e) {
  console.error('✗ data/db.json 解析失败，请先修复或备份后重建该文件');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const key = crypto.scryptSync(String(newPassword), salt, 64).toString('hex');

db.settings = db.settings || {};
db.settings.adminPassword = `scrypt$${salt}$${key}`;
db.updatedAt = new Date().toISOString();

const tmp = DB_FILE + '.tmp';
fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
fs.renameSync(tmp, DB_FILE);

console.log(`✓ 管理密码已重置为：${newPassword}`);
console.log('  即时生效 —— 服务每次校验都会重新读取 db.json，无需重启。');
