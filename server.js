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
const SESSION_SWEEP_MS = 30 * 60 * 1000;      // 每 30 分钟清扫一次过期的会话 / CSRF 条目
// 上传限流：单 IP 每 10 分钟最多 30 张（防磁盘被打满）
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const UPLOAD_MAX_PER_WINDOW = 30;
// 上传目录总容量上限（默认 512MB），超出后拒绝新上传
const UPLOAD_QUOTA_BYTES = Number(process.env.UPLOAD_QUOTA_MB || 512) * 1024 * 1024;

/* ---------------- 审计日志（S-A6） ---------------- */
// 登录、改密、保存内容、恢复默认、上传 —— 这些关键动作必须留痕，否则出事无法溯源。
// 铁律：**任何情况下都不记录密码明文**，只记事件类型、IP、时间与结果。
function audit(event, req, extra) {
  const ip = req ? clientIp(req) : '-';
  const at = new Date().toISOString();
  const tail = extra && Object.keys(extra).length ? ' ' + JSON.stringify(sanitizeAudit(extra)) : '';
  console.log(`[audit] ${at} ${event} ip=${ip}${tail}`);
}
// 兜底：哪怕调用方误传，也不能把密码写进日志
function sanitizeAudit(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (/pass|pwd|secret|token/i.test(k)) continue;
    out[k] = v;
  }
  return out;
}

/* ---------------- Phase 0: HTTP 安全头（零依赖） ---------------- */
// 防御常见浏览器攻击：MIME 嗅探、点击劫持、XSS、信息泄露
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // 现代浏览器不用这个，设为 0 禁用
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // HSTS：仅对 HTTPS 生效（HTTP 下浏览器按规范忽略），因此无条件发送是安全的
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.removeHeader('X-Powered-By'); // 移除 Express 版本信息
  next();
});

// CSP 头（独立配置，便于后续调整）
// 已知取舍：script-src 已去掉 'unsafe-inline'（themes-demo.html 的内联脚本已抽成外部文件），
// 这是 CSP 里最关键的一条 —— 去掉后，即便页面被注入 <script> 也不会执行。
// style-src 仍保留 'unsafe-inline'：渲染层用 style="--i:0" 这种方式传递 CSS 自定义属性，
// 要去掉需要把 stagger/animation-delay 全部改成 CSSOM 赋值，改动面较大，记为已知局限。
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP_DIRECTIVES);
  next();
});

/* ---------------- Phase 1: 输入验证强化（零依赖） ---------------- */
// 防御原型链污染、深度注入、畸形数据
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isSafeKey(key) {
  return !FORBIDDEN_KEYS.has(key);
}

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  // 使用普通对象，但过滤危险键名
  const clone = {};
  for (const key of Object.keys(obj)) {
    if (!isSafeKey(key)) continue;
    clone[key] = deepClone(obj[key]);
  }
  return clone;
}

// settings 白名单（严格校验）
const ALLOWED_SETTINGS_KEYS = new Set([
  'siteName', 'logoEmoji', 'slogan', 'theme', 'heroBadge',
  'heroTitle', 'heroSubtitle', 'heroStats', 'announcement',
  'wechat', 'qq', 'phone', 'email', 'qrImage', 'qrNote',
  'serviceTime', 'footer', 'adminPassword', 'custom',
  'title' // Phase 1: 兼容通用字段
]);

// sections 类型白名单（须与前端 admin.js 的 TYPES 一致：8 种。
// custom = v1.5.0 自由文本板块，gallery = 图片集——Phase 1 曾遗漏导致这两类板块无法保存）
const ALLOWED_SECTION_TYPES = new Set(['cards', 'services', 'testimonials', 'notice', 'faq', 'text', 'gallery', 'custom']);

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// 注意：这里**不再**直接用 DEFAULT_DB 落盘生成 db.json。
// 数据库初始化（含管理密码的生成）统一交给下面的 provisionAdminPassword()，
// 保证 new 出来的库一定带一个非公开的强密码。

/* ---------------- 反向代理信任（S3 / S-A2） ---------------- */
// 部署在 Nginx / Cloudflare / Render 之后，必须从 X-Forwarded-For 取真实客户端 IP 限流，
// 否则限流会锁在代理 IP 上：要么限流失效、要么一次误锁全站。
//
// ⚠️ 默认值在 v1.7.0 由「1」改为「false」—— 这是安全修复。
// 旧默认值的问题：直连部署（VPS / 裸 Node / 未配反代）时，客户端自己带的
// X-Forwarded-For 会被当成可信代理跳，攻击者只要换个头就能：
//   ① 无限次爆破密码（限流按伪造 IP 计数，永远锁不住）；
//   ② 伪造管理员 IP 连错 5 次，把管理员本人锁在门外 5 分钟。
// 现在默认不信任任何代理头；确实走反代时，由部署方显式设置 TRUST_PROXY=1（或跳数）。
const tp = process.env.TRUST_PROXY;
app.set('trust proxy', tp === undefined ? false : (tp === 'false' ? false : tp === 'true' ? true : Number(tp) || false));

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
    return JSON.parse(JSON.stringify(data)); // 未命中时也返回副本，与命中路径保持一致
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

/* ---------------- 管理密码初始化（S-A1：不再内置任何默认密码） ---------------- */
// 旧版本把 'xy888888' 写死在 defaults.js 里，而本仓库是公开的 —— 等于把后台开放给所有人。
// 现在改为三条规则，优先级从高到低：
//   1) 环境变量 ADMIN_PASSWORD：每次启动校验一次，不一致就覆盖（这是"忘记密码"的官方恢复通道）
//   2) 已有 db.json 里存着的密码：原样沿用，绝不擅自改动
//   3) 首次启动且两者都没有：自动生成一个强随机密码，醒目打印一次
const MIN_PASSWORD_LEN = 6;

function generatePassword() {
  // 12 位，取自 base64url 字符集（大小写字母 + 数字 + -_），约 71 bit 熵
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

function loadDBRaw() {
  if (!fs.existsSync(DB_PATH)) return { db: JSON.parse(JSON.stringify(DEFAULT_DB)), created: true };
  return { db: JSON.parse(fs.readFileSync(DB_PATH, 'utf8')), created: false };
}

function provisionAdminPassword() {
  try {
    const { db, created } = loadDBRaw();
    db.settings = db.settings || {};

    const envPw = process.env.ADMIN_PASSWORD ? String(process.env.ADMIN_PASSWORD) : '';
    let changed = false;

    if (envPw && envPw.length >= MIN_PASSWORD_LEN) {
      // 规则 1：环境变量优先。用 verifyPassword 比对，避免每次启动都无谓重写 db.json
      if (!verifyPassword(envPw, db.settings.adminPassword)) {
        db.settings.adminPassword = hashPassword(envPw);
        changed = true;
        console.log('✓ 已应用环境变量 ADMIN_PASSWORD 中设置的管理密码');
      }
    } else if (envPw) {
      console.error(`✗ 环境变量 ADMIN_PASSWORD 至少 ${MIN_PASSWORD_LEN} 位，已忽略（沿用现有密码）`);
    } else if (!db.settings.adminPassword) {
      // 规则 3：首次启动，生成强随机密码
      const pw = generatePassword();
      db.settings.adminPassword = hashPassword(pw);
      changed = true;
      const line = '─'.repeat(56);
      console.log(`\n${line}`);
      console.log('  首次启动：已为你生成后台管理密码（只显示这一次）');
      console.log(`  管理密码：${pw}`);
      console.log('  后台地址：/admin');
      console.log('  请立即保存。之后可用环境变量 ADMIN_PASSWORD 覆盖，');
      console.log('  或在后台「修改密码」里自行更改。');
      console.log(`${line}\n`);
    }

    if (created || changed) {
      db.updatedAt = new Date().toISOString();
      writeDB(db);
    }
    // 显式设置过 ADMIN_PASSWORD 就不必再啰嗦；否则提醒一次可以去设置
    if (!envPw) {
      console.log('ℹ️  提示：也可设置环境变量 ADMIN_PASSWORD 固定管理密码（推荐用于有持久盘的部署）');
    }
  } catch (e) {
    console.error('管理密码初始化失败：', e.message);
  }
}
provisionAdminPassword();

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

// 定期清扫：过期条目必须从 Map 里真正删掉。
// 旧实现只在读取时判断时间戳、从不 delete，长期运行会让 Map 无限增长（内存泄漏）。
const sessionSweeper = setInterval(() => {
  const now = Date.now();
  for (const [k, exp] of sessions) if (!(exp > now)) sessions.delete(k);
  for (const [k, v] of csrfTokens) if (!v || v.expiresAt < now) csrfTokens.delete(k);
  for (const [k, a] of loginAttempts) if (!a.until || a.until < now) loginAttempts.delete(k);
}, SESSION_SWEEP_MS);
// unref：定时器不阻止进程退出（测试 require 本文件时不会被挂住）
if (sessionSweeper.unref) sessionSweeper.unref();

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
    audit('login.fail', req); // 只记事件，绝不记密码
    return res.status(401).json({ ok: false, error: '密码错误，请重试' });
  }

  loginAttempts.delete(ip);
  audit('login.ok', req);

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

// 退出登录（S-A3）：真正在服务端销毁会话。
// 旧实现只做 localStorage.removeItem + 刷新，服务器上的 token 依然有效 7 天，
// token 一旦泄露（共享电脑 / XSS）就再也无法吊销。
app.post('/api/logout', (req, res) => {
  const token = req.headers['x-token'];
  if (token) {
    sessions.delete(token);
    csrfTokens.delete(token);
  }
  audit('logout', req);
  res.json({ ok: true });
});

app.use('/api', (req, res, next) => {
  if (req.path === '/login' || (req.path === '/content' && req.method === 'GET')) return next();
  const token = req.headers['x-token'];
  const exp = token && sessions.get(token);
  if (exp && exp > Date.now()) return next();
  res.status(401).json({ error: '登录已过期，请重新登录' });
});

/* ---------------- CSRF 防护（S7） ---------------- */
// CSRF token 存储在 session Map 中，登录时下发，写入时校验。
// 与 x-token 同源同源：攻击者无法读取前端 localStorage 中的 token，
// 也就无法构造合法的 CSRF 请求。
const csrfTokens = new Map(); // sessionId -> { token, expiresAt }

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

app.get('/api/csrf-token', (req, res) => {
  const token = req.headers['x-token'];
  const exp = token && sessions.get(token);
  if (!exp || exp <= Date.now()) {
    return res.status(401).json({ error: '未登录' });
  }
  const csrf = generateCsrfToken();
  csrfTokens.set(token, { token: csrf, expiresAt: Date.now() + SESSION_TTL_MS });
  res.json({ csrfToken: csrf });
});

function csrfProtect(req, res, next) {
  // 跳过不需要 CSRF 的路径
  if (req.path === '/login' || req.path === '/api/csrf-token' || req.path === '/api/health') {
    return next();
  }
  const csrf = req.headers['x-csrf-token'];
  const token = req.headers['x-token'];
  if (!csrf || !token) {
    return res.status(403).json({ error: '缺少 CSRF token' });
  }
  const stored = csrfTokens.get(token);
  if (!stored || stored.token !== csrf || stored.expiresAt < Date.now()) {
    return res.status(403).json({ error: 'CSRF token 无效或已过期' });
  }
  next();
}

// 在鉴权中间件之后，对写操作追加 CSRF 校验
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  if (req.path === '/login' || req.path === '/api/csrf-token') return next();
  csrfProtect(req, res, next);
});

/* ---------------- 内容 API ---------------- */
app.get('/api/content', (req, res) => {
  const db = readDB();
  res.json({ settings: safeSettings(db), sections: db.sections, updatedAt: db.updatedAt || '' });
});

app.put('/api/content', jsonSmall, (req, res) => {
  const { settings, sections } = req.body || {};
  if (!settings || !Array.isArray(sections)) return res.status(400).json({ error: '数据格式错误' });

  // Phase 1: 深拷贝防御原型链污染
  const clonedSettings = deepClone(settings);
  const clonedSections = deepClone(sections);

  // Phase 1: 字段白名单校验
  const settingsKeys = Object.keys(clonedSettings);
  for (const key of settingsKeys) {
    if (!ALLOWED_SETTINGS_KEYS.has(key)) {
      return res.status(400).json({ error: `非法设置字段: ${key}` });
    }
  }

  // Phase 1: sections 结构校验
  for (const s of clonedSections) {
    if (!s || typeof s !== 'object' || typeof s.type !== 'string') {
      return res.status(400).json({ error: '板块结构非法：缺少 type' });
    }
    if (!ALLOWED_SECTION_TYPES.has(s.type)) {
      return res.status(400).json({ error: `非法板块类型: ${s.type}` });
    }
    if (!Array.isArray(s.items || [])) {
      return res.status(400).json({ error: `板块「${s.id || s.type}」的 items 必须为数组` });
    }
  }

  withDBLock(() => {
    // 导入的配置可能带着内联图片，先还原成文件
    // 注意：extractInlineImages 内部会做 JSON.parse/stringify，会自动处理 null prototype 对象
    const s1 = extractInlineImages(clonedSettings);
    const s2 = extractInlineImages(clonedSections);

    const db = readDB();
    // Phase 1: 合并设置时确保使用普通对象（避免 null prototype 导致展开运算符问题）
    const mergedSettings = Object.assign({}, db.settings, s1.value);
    mergedSettings.adminPassword = db.settings.adminPassword; // 保留原密码
    db.settings = mergedSettings;
    db.sections = s2.value;
    db.updatedAt = new Date().toISOString();
    writeDB(db);
    return { settings: safeSettings(db), sections: db.sections, restoredImages: s1.changed || s2.changed };
  }).then(r => {
    audit('content.save', req, { sections: (r.sections || []).length, restoredImages: r.restoredImages });
    res.json({ ok: true, ...r });
  })
    .catch((e) => {
      console.error('保存失败:', e.message);
      res.status(500).json({ error: '保存失败，请重试' });
    });
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
    if (r.status === 200) { audit('password.change', req); res.json({ ok: true }); }
    else { audit('password.change.fail', req, { reason: r.error }); res.status(r.status).json({ error: r.error }); }
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
    if (r.status === 200) { audit('reset', req); res.json({ ok: true, settings: r.settings, sections: r.sections }); }
    else { audit('reset.fail', req, { reason: r.error }); res.status(r.status).json({ error: r.error }); }
  }).catch(() => res.status(500).json({ error: '恢复失败，请重试' }));
});

/* ---------------- 图片上传（base64） ---------------- */
// 真实类型校验（S-A5）：只看扩展名是不够的 —— 扩展名是客户端说了算的。
// 这里读文件头几个字节（magic bytes）反推真实格式，与声明的扩展名不一致就拒绝。
function sniffImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpg';                 // JPEG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png'; // PNG
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif';                 // GIF
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf.slice(8, 12).toString('latin1') === 'WEBP') return 'webp';                        // WEBP
  return null;
}

function uploadDirBytes() {
  let total = 0;
  try {
    for (const name of fs.readdirSync(UPLOAD_DIR)) {
      const st = fs.statSync(path.join(UPLOAD_DIR, name));
      if (st.isFile()) total += st.size;
    }
  } catch (e) { /* 目录不可读时按 0 处理，交给写入时的错误兜底 */ }
  return total;
}

// 上传限流：ip -> 最近若干次上传的时间戳
const uploadLog = new Map();
function uploadAllowed(ip) {
  const now = Date.now();
  const list = (uploadLog.get(ip) || []).filter(t => now - t < UPLOAD_WINDOW_MS);
  if (list.length >= UPLOAD_MAX_PER_WINDOW) { uploadLog.set(ip, list); return false; }
  list.push(now);
  uploadLog.set(ip, list);
  return true;
}

app.post('/api/upload', jsonUpload, (req, res) => {
  const ip = clientIp(req);
  if (!uploadAllowed(ip)) {
    return res.status(429).json({ error: `上传过于频繁，请稍后再试（每 ${UPLOAD_WINDOW_MS / 60000} 分钟最多 ${UPLOAD_MAX_PER_WINDOW} 张）` });
  }

  const { data } = req.body || {};
  if (!data || !/^data:image\//.test(data)) return res.status(400).json({ error: '仅支持图片文件' });
  const m = /^data:image\/([\w+.-]+);base64,(.+)$/.exec(data);
  if (!m) return res.status(400).json({ error: '图片解析失败' });
  let ext = m[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  if (!ALLOWED_EXTS.includes(ext)) return res.status(400).json({ error: `仅支持 ${ALLOWED_EXTS.join(' / ')} 格式` });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > UPLOAD_MAX_BYTES) return res.status(400).json({ error: '图片不能超过 8MB' });

  // 文件头必须与声明格式一致，防止把 HTML / 脚本伪装成图片上传
  const actual = sniffImageType(buf);
  if (!actual) return res.status(400).json({ error: '文件内容不是有效的图片' });
  if (actual !== ext) return res.status(400).json({ error: `文件内容与扩展名不符（实际是 ${actual}）` });

  // 磁盘配额：避免已登录用户把磁盘打满
  if (uploadDirBytes() + buf.length > UPLOAD_QUOTA_BYTES) {
    return res.status(507).json({ error: '上传空间已满，请先清理旧图片' });
  }

  const file = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + '.' + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, file), buf);
  audit('upload', req, { bytes: buf.length, type: ext });
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
  csrfTokens,
  sessions,
  ALLOWED_EXTS,
  HASH_PREFIX,
  MAX_ATTEMPTS,
  LOCK_MS,
  UPLOAD_MAX_BYTES,
  UPLOAD_MAX_PER_WINDOW,
  UPLOAD_QUOTA_BYTES,
  SESSION_TTL_MS,
  generatePassword,
  sniffImageType,
  audit,
  uploadLog,
  ROOT,
  DATA_DIR,
  UPLOAD_DIR,
  DB_FILE: DB_PATH,
  // Phase 1: 导出输入验证工具
  deepClone,
  isSafeKey,
  ALLOWED_SETTINGS_KEYS,
  ALLOWED_SECTION_TYPES,
  withDBLock,
  // 导出 withDBLock 用于测试
  get dbWriteChain() { return dbWriteChain; }
};

// 仅当直接 `node server.js` 时才监听端口；被测试 require 时不占端口
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`✦ 俱乐部官网已启动: http://localhost:${PORT}  （管理后台: /admin）`);
  });
}
