'use strict';
/**
 * POST /api/reset 安全契约（S1 修复）
 *
 * reset 曾把全站密码重置为硬编码弱密码且无二次校验 —— 等价于无需原密码的后门。
 * 修复后：①必须校验当前管理密码；②只恢复内容与设置，绝不改动登录密码。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { request, login, readDBFile, writeDBFile } = require('./harness');

describe('POST /api/reset', () => {
  test('未带 token 时拒绝', async () => {
    const res = await request('POST', '/api/reset', { body: { currentPassword: 'xy888888' } });
    assert.equal(res.status, 401);
  });

  test('未提供当前密码时拒绝（防后门被直接调用）', async () => {
    const token = await login();
    const res = await request('POST', '/api/reset', { token, body: {} });
    assert.equal(res.status, 400);
  });

  test('当前密码错误时拒绝', async () => {
    const token = await login();
    const res = await request('POST', '/api/reset', { token, body: { currentPassword: 'not-the-pw' } });
    assert.equal(res.status, 400);
  });

  test('密码正确时内容回退默认，且登录密码不被改成弱密码', async () => {
    const token = await login();
    const before = readDBFile();
    try {
      // 先制造一些"已修改"的内容
      const mod = JSON.parse(JSON.stringify(before));
      mod.settings.siteName = '被改过的站名';
      mod.sections = mod.sections.slice(0, 1);
      writeDBFile(mod);

      const res = await request('POST', '/api/reset', { token, body: { currentPassword: 'xy888888' } });
      assert.equal(res.status, 200, '密码正确应成功');
      assert.equal(res.body.ok, true);

      const after = readDBFile();
      assert.equal(after.settings.siteName, 'XY俱乐部', '站名应回退默认');
      assert.equal(after.sections.length, before.sections.length, '板块数量应回退默认');

      // 关键安全断言：reset 后原密码仍可用，且落盘的是哈希（未被改回明文弱密码）
      const loginOld = await request('POST', '/api/login', { body: { password: 'xy888888' } });
      assert.equal(loginOld.status, 200, 'reset 后原密码仍可登录（密码未被重置）');
      assert.ok(after.settings.adminPassword.startsWith('scrypt$'), '密码应仍是哈希，未被改回明文弱密码');
    } finally {
      writeDBFile(before); // 还原，避免影响其它用例
    }
  });
});
