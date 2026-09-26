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
// 目录可用环境变量覆盖 —— 测试要用临时目录，避免污染真实的 data/db.json
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(ROOT, 'public', 'uploads');

// 允许上传的图片格式（不含 svg —— SVG 可内嵌脚本，直接访问会被浏览器当文档渲染）
const ALLOWED_EXTS = ['jpg', 'png', 'webp', 'gif'];

/* ---------------- 全局配置常量（避免魔法数字散落，C2） ---------------- */
const UPLOAD_MAX_BYTES = 8 * 1024 * 1024;     // 单张上传上限 8MB（唯一事实来源）
const BODY_JSON_LIMIT = process.env.BODY_JSON_LIMIT || '1mb'; // 普通 JSON 接口上限（S6：由 64mb 下调）
const UPLOAD_JSON_LIMIT = '16mb';             // 上传接口单独放宽，容纳 base64 单图（业务上限仍是 8MB，路由内校验）
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;  // token 有效期 7 天
const MAX_ATTEMPTS = 5;                        // 登录限流：连续错误次数
const LOCK_MS = 5 * 60 * 1000;                // 登录限流：锁定时长 5 分钟

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
}

/* ---------------- 反向代理信任（S3） ---------------- */
// 部署在 Nginx / Cloudflare / Render 之后，必须从 X-Forwarded-For 取真实客户端 IP 限流，
// 否则限流会锁在代理 IP 上：要么限流失效、要么一次误锁全站。
// 可用环境变量覆盖：TRUST_PROXY=false / true / 跳数数字；不设置时默认信任 1 跳（最常见场景）。
const tp = process.env.TRUST_PROXY;
app.set('trust proxy', tp === undefined ? 1 : (tp === 'false' ? false : tp === 'true' ? true : Number(tp) || 1));

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
// 进程内缓存 + 基于文件 mtime 的失效（Q2）：公开高频读 GET /api/content 不必每次全量解析 + 读盘。
let dbCache = { mtime: 0, data: null };

function readDB() {
  try {
    const stat = fs.statSync(DB_PATH);
    if (dbCache.data && dbCache.mtime === stat.mtimeMs) return JSON.parse(JSON.stringify(dbCache.data)); // 返回副本，避免调用方改动污染缓存
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    dbCache = { mtime: stat.mtimeMs, data };
    return data;
  } catch (e) {
    // 解析失败时先留一份现场，别让真实数据悄无声息地消失
    try {
      if (fs.existsSync(DB_PATH)) {
        fs.copyFileSync(DB_PATH, `${DB_PATH}.corrupt-${Date.now()}`);
        console.error('⚠️  data/db.json 解析失败，已备份原文件为 .corrupt-*，当前回退到默认内容');
      }
    } catch (_) { /* 备份失败也不影响启动 */ }
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
}

function writeDB(db) {
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_PATH);
  dbCache = { mtime: 0, data: null }; // 失效缓存，下次读重新落盘
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

/* ---------------- 写锁（Q1） ---------------- */
// 串行化各写接口的 read-modify-write 临界区，避免并发 PUT /api/content 互相覆盖。
let dbWriteChain = Promise.resolve();
function withDBLock(fn) {
  const run = dbWriteChain.then(() => fn(), () => fn());
  dbWriteChain = run.then(() => {}, () => {});
  return run;
}

/* ---------------- 登录限流 ---------------- */
const loginAttempts = new Map(); // ip -> { count, until }

function clientIp(req) {
  // 配合 trust proxy，req.ip 在反向代理后已是真实客户端 IP（而非代理 IP）
  return req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
}

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
    if (buf.length > UPLOAD_MAX_BYTES) return null;
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
// 按路由分别设置 JSON 上限（S6）：content/password/reset 限 1mb，upload 单独放宽到 12mb
const jsonSmall = express.json({ limit: BODY_JSON_LIMIT });
const jsonUpload = express.json({ limit: UPLOAD_JSON_LIMIT });

// 上传目录：禁止浏览器嗅探类型，降低把上传文件当 HTML 执行的风险
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use(express.static(path.join(ROOT, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(ROOT, 'public', 'admin.html')));

/* ---------------- 登录鉴权 ---------------- */
const sessions = new Map(); // token -> 过期时间

app.post('/api/login', jsonSmall, (req, res) => {
  const ip = clientIp(req);
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
  sessions.set(token, Date.now() + SESSION_TTL_MS);
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

app.put('/api/content', jsonSmall, (req, res) => {
  const { settings, sections } = req.body || {};
  if (!settings || !Array.isArray(sections)) return res.status(400).json({ error: '数据格式错误' });

  // 字段级校验（Q5）：畸形板块写入后前端渲染可能崩溃
  for (const s of sections) {
    if (!s || typeof s !== 'object' || typeof s.type !== 'string') {
      return res.status(400).json({ error: '板块结构非法：缺少 type' });
    }
    if (!Array.isArray(s.items || [])) {
      return res.status(400).json({ error: `板块「${s.id || s.type}」的 items 必须为数组` });
    }
  }

  withDBLock(() => {
    // 导入的配置可能带着内联图片，先还原成文件
    const s1 = extractInlineImages(settings);
    const s2 = extractInlineImages(sections);

    const db = readDB();
    db.settings = { ...db.settings, ...s1.value, adminPassword: db.settings.adminPassword };
    db.sections = s2.value;
    db.updatedAt = new Date().toISOString();
    writeDB(db);
    return { settings: safeSettings(db), sections: db.sections, restoredImages: s1.changed || s2.changed };
  }).then(r => res.json({ ok: true, ...r }))
    .catch(() => res.status(500).json({ error: '保存失败，请重试' }));
});

app.post('/api/password', jsonSmall, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  withDBLock(() => {
    const db = readDB();
    const stored = db.settings && db.settings.adminPassword;
    if (!verifyPassword(oldPassword, stored)) return { status: 400, error: '原密码错误' };
    if (!newPassword || String(newPassword).length < 6) return { status: 400, error: '新密码至少 6 位' };
    db.settings.adminPassword = hashPassword(newPassword);
    db.updatedAt = new Date().toISOString();
    writeDB(db);

    // S2：改密码后令其它会话失效，仅保留"本次" token，避免旧 token 在 7 天内始终有效
    const current = req.headers['x-token'];
    sessions.clear();
    if (current) sessions.set(current, Date.now() + SESSION_TTL_MS);
    return { status: 200 };
  }).then(r => {
    if (r.status === 200) res.json({ ok: true });
    else res.status(r.status).json({ error: r.error });
  }).catch(() => res.status(500).json({ error: '修改失败，请重试' }));
});

// 恢复为模板默认内容（换俱乐部复用时可用：先恢复默认，再改内容）
// S1 修复：①必须校验当前管理密码（防止被 XSS/已登录用户当后门调用）；
//        ②只恢复内容与设置，绝不把登录密码改回已知的弱密码 xy888888。
app.post('/api/reset', jsonSmall, (req, res) => {
  const { currentPassword } = req.body || {};
  withDBLock(() => {
    const db = readDB();
    const stored = db.settings && db.settings.adminPassword;
    if (!verifyPassword(currentPassword, stored)) {
      return { status: 400, error: '管理密码错误，无法恢复默认内容' };
    }
    const fresh = JSON.parse(JSON.stringify(DEFAULT_DB));
    fresh.settings.adminPassword = db.settings.adminPassword; // 保留当前登录密码
    fresh.updatedAt = new Date().toISOString();
    writeDB(fresh);
    return { status: 200, settings: safeSettings(fresh), sections: fresh.sections };
  }).then(r => {
    if (r.status === 200) res.json({ ok: true, settings: r.settings, sections: r.sections });
    else res.status(r.status).json({ error: r.error });
  }).catch(() => res.status(500).json({ error: '恢复失败，请重试' }));
});

/* ---------------- 图片上传（base64） ---------------- */
app.post('/api/upload', jsonUpload, (req, res) => {
  const { data } = req.body || {};
  if (!data || !/^data:image\//.test(data)) return res.status(400).json({ error: '仅支持图片文件' });
  const m = /^data:image\/([\w+.-]+);base64,(.+)$/.exec(data);
  if (!m) return res.status(400).json({ error: '图片解析失败' });
  let ext = m[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  if (!ALLOWED_EXTS.includes(ext)) return res.status(400).json({ error: `仅支持 ${ALLOWED_EXTS.join(' / ')} 格式` });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > UPLOAD_MAX_BYTES) return res.status(400).json({ error: '图片不能超过 8MB' });
  const file = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + '.' + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, file), buf);
  res.json({ ok: true, url: '/uploads/' + file });
});

/* ---------------- 全局错误处理（Q4） ---------------- */
// 路由内抛出的异常统一捕获，避免异步异常泄漏为挂起连接或进程级未处理
app.use((err, req, res, next) => {
  console.error('⚠️ 未处理的请求异常：', err && err.message);
  if (!res.headersSent) res.status(500).json({ error: '服务器内部错误' });
});

/* ---------------- 导出（供测试使用；直接运行时不影响任何行为） ---------------- */
module.exports = {
  app,
  hashPassword,
  verifyPassword,
  extractInlineImages,
  readDB,
  writeDB,
  safeSettings,
  isLocked,
  noteFailure,
  clientIp,
  loginAttempts,
  sessions,
  ALLOWED_EXTS,
  HASH_PREFIX,
  MAX_ATTEMPTS,
  LOCK_MS,
  UPLOAD_MAX_BYTES,
  SESSION_TTL_MS,
  ROOT,
  DATA_DIR,
  UPLOAD_DIR,
  DB_FILE: DB_PATH
};

// 仅当直接 `node server.js` 时才监听端口；被测试 require 时不占端口
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`✦ 俱乐部官网已启动: http://localhost:${PORT}  （管理后台: /admin）`);
  });
}
