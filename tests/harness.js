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

// 必须在 require('../server.js') 之前设置，服务端启动时才会用到这些目录
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'xy-club-test-'));
process.env.DATA_DIR = path.join(TMP, 'data');
process.env.UPLOAD_DIR = path.join(TMP, 'uploads');

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

/** 登录并返回 token（默认用出厂密码） */
async function login(password) {
  const res = await request('POST', '/api/login', { body: { password: password || 'xy888888' } });
  if (res.status !== 200) throw new Error('登录失败：' + res.text);
  return res.body.token;
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
  root: ROOT,
  tmp: TMP
};
