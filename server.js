// NX俱乐部官网 · 后端服务（Express + JSON 文件存储）
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DEFAULT_DB } = require('./defaults');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOAD_DIR = path.join(ROOT, 'public', 'uploads');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
}

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
}

function writeDB(db) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function safeSettings(db) {
  const { adminPassword, ...settings } = db.settings;
  return settings;
}

app.use(express.json({ limit: '30mb' }));
app.use(express.static(path.join(ROOT, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(ROOT, 'public', 'admin.html')));

/* ---------------- 登录鉴权 ---------------- */
const sessions = new Map(); // token -> 过期时间

app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  const db = readDB();
  if (password && password === db.settings.adminPassword) {
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, Date.now() + 7 * 24 * 3600 * 1000);
    res.json({ ok: true, token });
  } else {
    res.status(401).json({ ok: false, error: '密码错误，请重试' });
  }
});

app.use('/api', (req, res, next) => {
  if (req.path === '/login' || (req.path === '/content' && req.method === 'GET')) return next();
  const token = req.headers['x-token'];
  const exp = token && sessions.get(token);
  if (exp && exp > Date.now()) return next();
  res.status(401).json({ error: '登录已过期，请重新登录' });
});

/* ---------------- 内容 API ---------------- */
app.get('/api/content', (req, res) => {
  const db = readDB();
  res.json({ settings: safeSettings(db), sections: db.sections, updatedAt: db.updatedAt || '' });
});

app.put('/api/content', (req, res) => {
  const { settings, sections } = req.body || {};
  if (!settings || !Array.isArray(sections)) return res.status(400).json({ error: '数据格式错误' });
  const db = readDB();
  db.settings = { ...db.settings, ...settings, adminPassword: db.settings.adminPassword };
  db.sections = sections;
  db.updatedAt = new Date().toISOString();
  writeDB(db);
  res.json({ ok: true, settings: safeSettings(db), sections: db.sections });
});

app.post('/api/password', (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  const db = readDB();
  if (oldPassword !== db.settings.adminPassword) return res.status(400).json({ error: '原密码错误' });
  if (!newPassword || String(newPassword).length < 6) return res.status(400).json({ error: '新密码至少 6 位' });
  db.settings.adminPassword = String(newPassword);
  writeDB(db);
  res.json({ ok: true });
});

app.get('/api/check', (req, res) => res.json({ ok: true }));

// 恢复为模板默认内容（换俱乐部复用时可用：先恢复默认，再改内容）
app.post('/api/reset', (req, res) => {
  const db = JSON.parse(JSON.stringify(DEFAULT_DB));
  db.updatedAt = new Date().toISOString();
  writeDB(db);
  res.json({ ok: true, settings: safeSettings(db), sections: db.sections });
});

/* ---------------- 图片上传（base64） ---------------- */
app.post('/api/upload', (req, res) => {
  const { name, data } = req.body || {};
  if (!data || !/^data:image\//.test(data)) return res.status(400).json({ error: '仅支持图片文件' });
  const m = data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) return res.status(400).json({ error: '图片解析失败' });
  let ext = m[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  if (!['jpg', 'png', 'webp', 'gif', 'svg'].includes(ext)) ext = 'png';
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 8 * 1024 * 1024) return res.status(400).json({ error: '图片不能超过 8MB' });
  const file = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + '.' + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, file), buf);
  res.json({ ok: true, url: '/uploads/' + file });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, HOST, () => {
  console.log(`✦ NX俱乐部官网已启动: http://localhost:${PORT}  （管理后台: /admin）`);
});
