'use strict';
/**
 * 会话持久化（v1.11.0）
 *
 * 会话原本只在内存 Map 里，进程重启 = 所有人被强制登出（部署/重启很频繁）。
 * 现在落盘到 DATA_DIR/sessions.json：覆盖「写入 / 重启可恢复 / 登出即清除 / 过期不复活」。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { server, request, login } = require('./harness');

const readFile = () => JSON.parse(fs.readFileSync(server.SESSIONS_FILE, 'utf8'));

describe('会话持久化', () => {
  test('登录后 token 会落盘', async () => {
    const token = await login();
    const raw = readFile();
    assert.ok(raw.sessions[token] > Date.now(), '登录后 token 应写入 sessions.json 且未过期');
    assert.equal(fs.statSync(server.SESSIONS_FILE).mode & 0o777, 0o600, '会话文件应为 0600，避免同机其他用户读取');
  });

  test('模拟重启：清空内存后能从磁盘恢复登录态', async () => {
    const token = await login();
    server.sessions.clear();
    assert.equal((await request('GET', '/api/check', { token })).body.ok, false);

    server.loadSessions();
    const check = await request('GET', '/api/check', { token });
    assert.equal(check.body.ok, true, '重启后应凭磁盘里的会话恢复登录');
  });

  test('登出后从磁盘清除', async () => {
    const token = await login();
    await request('POST', '/api/logout', { token });
    assert.equal(readFile().sessions[token], undefined);
  });

  test('已过期的条目不会被恢复', async () => {
    const token = await login();
    const raw = readFile();
    raw.sessions[token] = Date.now() - 1000;
    fs.writeFileSync(server.SESSIONS_FILE, JSON.stringify(raw));
    server.sessions.clear();
    server.loadSessions();
    assert.equal(server.sessions.has(token), false, '过期会话不应被加载回来');
  });

  test('文件损坏时按「无会话」处理，不抛异常', async () => {
    fs.writeFileSync(server.SESSIONS_FILE, '{ 坏掉的 json');
    server.sessions.clear();
    assert.doesNotThrow(() => server.loadSessions());
    assert.equal(server.sessions.size, 0);
  });
});
