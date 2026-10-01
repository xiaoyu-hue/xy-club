'use strict';
/**
 * 测试脚手架
 *
 * 设计原则（与项目取舍一致）：
 * - 零新增依赖：只用 Node 内置的 node:test / http / fs
 * - 强隔离：每个测试文件跑在独立进程里，各自拿一份临时 data/ 与 uploads/，
 *   绝不去碰开发者真实的 data/db.json
 *
 * 用法：在测试文件顶部 `const { server, request, tmp } = require('./harness');`
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');

// 使用计数器确保每个 require 的 TMP 目录唯一（防止模块缓存导致复用）
let tmpCounter = 0;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'xy-club-test-' + (++tmpCounter) + '-'));
process.env.DATA_DIR = path.join(TMP, 'data');
process.env.UPLOAD_DIR = path.join(TMP, 'uploads');

// 测试用固定密码（TEST_PASSWORD）。
// v1.7.0 起 defaults.js 不再内置任何密码，数据库密码由 server.js 生成；
// 这里走 ADMIN_PASSWORD 环境变量通道把它固定成已知值，既让旧用例继续可用，
// 也顺带覆盖了「环境变量设定密码」这条新路径。
// 注意：必须在 require('../server.js') **之前** 设置，服务端只在启动时读一次。
const TEST_PASSWORD = 'test-pw-12345';
process.env.ADMIN_PASSWORD = TEST_PASSWORD;

const server = require('../server.js');

let srv = null;
let listening = null;

/**
 * 惰性启动服务（端口 0 = 系统分配，避免与本地 3000 冲突）
 * 返回 Promise，等 'listening' 之后再发请求，否则会 connection refused。
 * unref() 让进程不被这个 handle 吊住 —— 否则 node --test 跑完不会退出。
 */
function listen() {
  if (listening) return listening;
  listening = new Promise((resolve, reject) => {
    srv = server.app.listen(0, '127.0.0.1');
    srv.unref();
    srv.once('listening', () => resolve(srv));
    srv.once('error', reject);
  });
  return listening;
}

async function port() {
  return (await listen()).address().port;
}

/**
 * 发起一次 HTTP 请求
 * @param {string} method
 * @param {string} urlPath 例如 /api/content
 * @param {{body?: any, token?: string, headers?: object}} [opts]
 * @returns {Promise<{status:number, headers:object, text:string, body:any}>}
 */
async function request(method, urlPath, opts) {
  const { body, token, headers = {} } = opts || {};
  const portNum = (await listen()).address().port;
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
    const h = Object.assign({}, headers);
    if (payload) {
      h['Content-Type'] = 'application/json';
      h['Content-Length'] = payload.length;
    }
    if (token) h['x-token'] = token;
    // 测试模式下自动注入 CSRF token（仅当未显式指定 x-csrf-token 时）
    if (token && !h['x-csrf-token']) {
      const csrf = server.csrfTokens && server.csrfTokens.get(token);
      if (csrf) h['x-csrf-token'] = csrf.token;
    }

    const r = http.request(
      { host: '127.0.0.1', port: portNum, path: urlPath, method, headers: h },
      (res) => {
        let text = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (text += c));
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(text); } catch (_) { /* 非 JSON 响应（如 404 HTML）留作 text */ }
          resolve({ status: res.statusCode, headers: res.headers, text, body: json });
        });
      }
    );
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

/** 登录并返回 token（默认用测试固定密码，不再是出厂弱密码） */
async function login(password) {
  const res = await request('POST', '/api/login', { body: { password: password || TEST_PASSWORD } });
  if (res.status !== 200) throw new Error('登录失败：' + res.text);
  const token = res.body.token;
  // 登录后自动获取 CSRF token 并存入 server
  try {
    const csrfRes = await request('GET', '/api/csrf-token', { token });
    if (csrfRes.status === 200 && csrfRes.body.csrfToken) {
      server.csrfTokens.set(token, {
        token: csrfRes.body.csrfToken,
        expiresAt: Date.now() + 7 * 24 * 3600 * 1000
      });
    }
  } catch (e) {
    console.warn('CSRF token 获取失败:', e.message);
  }
  return token;
}

/** 直接读临时库文件（绕开 readDB，用于断言落盘结果） */
function readDBFile() {
  return JSON.parse(fs.readFileSync(server.DB_FILE, 'utf8'));
}

function writeDBFile(db) {
  fs.writeFileSync(server.DB_FILE, JSON.stringify(db, null, 2));
}

/** 列出临时上传目录里的文件 */
function uploadedFiles() {
  return fs.existsSync(server.UPLOAD_DIR) ? fs.readdirSync(server.UPLOAD_DIR) : [];
}

function cleanup() {
  try { if (srv) srv.close(); } catch (_) { /* 已关闭 */ }
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* 忽略 */ }
}

process.on('exit', cleanup);

module.exports = {
  server,
  request,
  login,
  readDBFile,
  writeDBFile,
  uploadedFiles,
  cleanup,
  TEST_PASSWORD,
  root: ROOT,
  tmp: TMP
};
