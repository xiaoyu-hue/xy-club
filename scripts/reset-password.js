#!/usr/bin/env node
/**
 * 重置后台管理密码。
 *
 * 密码以 scrypt 哈希存储，无法直接手写成明文，所以改用这个脚本。
 *
 * 用法：
 *   node scripts/reset-password.js 新密码      （推荐：自己指定）
 *   node scripts/reset-password.js --generate  （自动生成强随机密码）
 *
 * ⚠️ 安全变更（v1.7.0）：
 *   1. 不再支持「不传参数 = 重置为 xy888888」。旧行为会把公开仓库里的弱密码写回数据库，
 *      等于给所有人留后门。现在不传参数直接报错退出。
 *   2. 不再把密码明文打印到终端（会进 shell history / CI 日志），只提示设置成功。
 *   3. 遵守 DATA_DIR 环境变量，与服务端的数据库路径保持一致（旧版硬编码 ../data/db.json）。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = process.env.DATA_DIR
  ? path.join(path.resolve(process.env.DATA_DIR), 'db.json')
  : path.join(__dirname, '..', 'data', 'db.json');

const arg = process.argv[2] || '';

if (!arg) {
  console.error('✗ 请提供新密码，或使用 --generate 自动生成');
  console.error('  用法: node scripts/reset-password.js 新密码');
  console.error('       node scripts/reset-password.js --generate');
  process.exit(1);
}

const generate = arg === '--generate';
const newPassword = generate ? crypto.randomBytes(9).toString('base64url').slice(0, 12) : arg;

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

// 安全：不回显密码明文（会进 shell history / CI 日志）。自动生成时才展示一次，
// 因为不展示用户就永远拿不到 —— 这是唯一必须打印的例外。
if (generate) {
  console.log(`✓ 已生成并写入新的随机管理密码：${newPassword}`);
  console.log('  请立即保存，此密码不会再显示。');
} else {
  console.log('✓ 管理密码已重置为你指定的新密码（不回显，请牢记）。');
}
console.log('  即时生效 —— 服务每次校验都会重新读取 db.json，无需重启。');
