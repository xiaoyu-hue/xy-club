// 俱乐部官网模板 · 后端服务（Express + JSON 文件存储）
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

// 允许上传的图片格式（不含 svg —— SVG 可内嵌脚本，直接访问会被浏览器当文档渲染）
const ALLOWED_EXTS = ['jpg', 'png', 'webp', 'gif'];

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
}

/* ---------------- 密码哈希（Node 内置 scrypt，零新增依赖） ---------------- */
const HASH_PREFIX = 'scrypt$';

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return `${HASH_PREFIX}${salt}$${key}`;
}

function verifyPassword(pw, stored) {
  if (typeof stored !== 'string' || !pw) return false;
  // 兼容旧版本遗留的明文密码
  if (!stored.startsWith(HASH_PREFIX)) return stored === String(pw);
  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  const [, salt, key] = parts;
  try {
    const calc = crypto.scryptSync(String(pw), salt, 64);
    const expected = Buffer.from(key, 'hex');
    if (calc.length !== expected.length) return false;
    return crypto.timingSafeEqual(calc, expected);
  } catch (e) {
    return false;
  }
}

/* ---------------- 数据读写 ---------------- */
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    // 解析失败时先留一份现场，别让真实数据悄无声息地消失
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.copyFileSync(DB_FILE, `${DB_FILE}.corrupt-${Date.now()}`);
        console.error('⚠️  data/db.json 解析失败，已备份原文件为 .corrupt-*，当前回退到默认内容');
      }
    } catch (_) { /* 备份失败也不影响启动 */ }
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

// 启动时把遗留的明文密码自动升级为哈希
(function migratePlainPassword() {
  try {
    const db = readDB();
    const pw = db.settings && db.settings.adminPassword;
    if (typeof pw === 'string' && !pw.startsWith(HASH_PREFIX)) {
      db.settings.adminPassword = hashPassword(pw);
      db.updatedAt = new Date().toISOString();
      writeDB(db);
      console.log('✓ 管理密码已升级为哈希存储');
    }
  } catch (e) {
    console.error('密码升级失败：', e.message);
  }
})();

/* ---------------- 登录限流 ---------------- */
const loginAttempts = new Map(); // ip -> { count, until }
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;

function isLocked(ip) {
  const a = loginAttempts.get(ip);
  return !!(a && a.until > Date.now());
}

function noteFailure(ip) {
  const a = loginAttempts.get(ip) || { count: 0, until: 0 };
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) {
    a.until = Date.now() + LOCK_MS;
    a.count = 0;
  }
  loginAttempts.set(ip, a);
  // 防止 Map 无限增长
  if (loginAttempts.size > 1000) {
    const now = Date.now();
    for (const [k, v] of loginAttempts) {
      if (!v.until || v.until < now) loginAttempts.delete(k);
    }
  }
}

/* ---------------- 内联图片还原（配置导入用） ---------------- */
/**
 * 导出的配置会把图片内联成 data URI，好让配置自包含、能搬去另一个站点。
 * 保存时再把 data URI 还原成 uploads/ 下的真实文件，避免把大段 base64 写进 db.json。
 */
function extractInlineImages(value) {
  let changed = false;

  const saveImage = (dataUri) => {
    const m = /^data:image\/([\w+.-]+);base64,(.+)$/.exec(dataUri);
    if (!m) return null;
    let ext = m[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    if (!ALLOWED_EXTS.includes(ext)) return null;
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 8 * 1024 * 1024) return null;
    const file = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + '.' + ext;
    fs.writeFileSync(path.join(UPLOAD_DIR, file), buf);
    return '/uploads/' + file;
  };

  const walk = (v) => {
    if (typeof v === 'string') {
      if (v.startsWith('data:image/')) {
        const url = saveImage(v);
        if (url) { changed = true; return url; }
      }
      return v;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) v[k] = walk(v[k]);
      return v;
    }
    return v;
  };

  const out = walk(JSON.parse(JSON.stringify(value || null)));
  return { value: changed ? out : value, changed };
}

/* ---------------- 中间件 ---------------- */
app.use(express.json({ limit: '64mb' }));

// 上传目录：禁止浏览器嗅探类型，降低把上传文件当 HTML 执行的风险
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use(express.static(path.join(ROOT, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(ROOT, 'public', 'admin.html')));

/* ---------------- 登录鉴权 ---------------- */
const sessions = new Map(); // token -> 过期时间

app.post('/api/login', (req, res) => {
  const ip = req.ip || 'unknown';
  if (isLocked(ip)) {
    return res.status(429).json({ ok: false, error: '尝试次数过多，请 5 分钟后再试' });
  }

  const { password } = req.body || {};
  const db = readDB();
  const stored = db.settings && db.settings.adminPassword;

  if (!verifyPassword(password, stored)) {
    noteFailure(ip);
    return res.status(401).json({ ok: false, error: '密码错误，请重试' });
  }

  loginAttempts.delete(ip);

  // 命中遗留明文密码时顺手升级为哈希
  if (typeof stored === 'string' && !stored.startsWith(HASH_PREFIX)) {
    db.settings.adminPassword = hashPassword(password);
    db.updatedAt = new Date().toISOString();
    writeDB(db);
  }

  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, Date.now() + 7 * 24 * 3600 * 1000);
  res.json({ ok: true, token });
});

// 健康检查（监控 / 探活用，同样不需要登录，放在鉴权中间件之前）
app.get('/api/health', (req, res) => res.json({ ok: true }));

// 校验登录态（不需要先登录才能问，所以放在鉴权中间件之前）
app.get('/api/check', (req, res) => {
  const token = req.headers['x-token'];
  const exp = token && sessions.get(token);
  res.json({ ok: !!(exp && exp > Date.now()) });
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

  // 导入的配置可能带着内联图片，先还原成文件
  const s1 = extractInlineImages(settings);
  const s2 = extractInlineImages(sections);

  const db = readDB();
  db.settings = { ...db.settings, ...s1.value, adminPassword: db.settings.adminPassword };
  db.sections = s2.value;
  db.updatedAt = new Date().toISOString();
  writeDB(db);
  res.json({ ok: true, settings: safeSettings(db), sections: db.sections, restoredImages: s1.changed || s2.changed });
});

app.post('/api/password', (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  const db = readDB();
  const stored = db.settings && db.settings.adminPassword;
  if (!verifyPassword(oldPassword, stored)) return res.status(400).json({ error: '原密码错误' });
  if (!newPassword || String(newPassword).length < 6) return res.status(400).json({ error: '新密码至少 6 位' });
  db.settings.adminPassword = hashPassword(newPassword);
  db.updatedAt = new Date().toISOString();
  writeDB(db);
  res.json({ ok: true });
});

// 恢复为模板默认内容（换俱乐部复用时可用：先恢复默认，再改内容）
app.post('/api/reset', (req, res) => {
  const db = JSON.parse(JSON.stringify(DEFAULT_DB));
  db.settings.adminPassword = hashPassword(db.settings.adminPassword);
  db.updatedAt = new Date().toISOString();
  writeDB(db);
  res.json({ ok: true, settings: safeSettings(db), sections: db.sections });
});

/* ---------------- 图片上传（base64） ---------------- */
app.post('/api/upload', (req, res) => {
  const { data } = req.body || {};
  if (!data || !/^data:image\//.test(data)) return res.status(400).json({ error: '仅支持图片文件' });
  const m = /^data:image\/([\w+.-]+);base64,(.+)$/.exec(data);
  if (!m) return res.status(400).json({ error: '图片解析失败' });
  let ext = m[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  if (!ALLOWED_EXTS.includes(ext)) return res.status(400).json({ error: `仅支持 ${ALLOWED_EXTS.join(' / ')} 格式` });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 8 * 1024 * 1024) return res.status(400).json({ error: '图片不能超过 8MB' });
  const file = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + '.' + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, file), buf);
  res.json({ ok: true, url: '/uploads/' + file });
});

app.listen(PORT, HOST, () => {
  console.log(`✦ 俱乐部官网已启动: http://localhost:${PORT}  （管理后台: /admin）`);
});
