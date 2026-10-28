'use strict';
/**
 * 内容版本历史（v1.11.0）
 *
 * 覆盖：保存前留快照 / 列表 / 读取 / 回滚 / 回滚本身可撤销 / 快照不含密码 / id 校验。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { server, request, login, readDBFile } = require('./harness');

const readHistoryFile = (id) => JSON.parse(
  require('fs').readFileSync(require('path').join(server.HISTORY_DIR, id + '.json'), 'utf8')
);

describe('内容版本历史', () => {
  test('保存内容会留下上一版快照，且不含密码', async () => {
    const token = await login();
    const before = await request('GET', '/api/content', { token });
    const next = {
      settings: Object.assign({}, before.body.settings, { slogan: '第一版改动的标语' }),
      sections: before.body.sections
    };
    const put = await request('PUT', '/api/content', { token, body: next });
    assert.equal(put.status, 200, put.text);

    const list = await request('GET', '/api/history', { token });
    assert.equal(list.status, 200);
    assert.ok(list.body.versions.length >= 1, '保存后应至少有一个历史版本');
    assert.equal(list.body.max, 30);

    const first = list.body.versions[list.body.versions.length - 1];
    const raw = readHistoryFile(first.id);
    assert.equal(raw.settings.adminPassword, undefined, '历史快照里绝不能出现密码');
    assert.ok(!JSON.stringify(raw).includes('scrypt$'), '历史快照里不能有密码哈希');
  });

  test('可以读回某个版本，并直接用于回滚', async () => {
    const token = await login();
    const list = await request('GET', '/api/history', { token });
    const id = list.body.versions[0].id;

    const one = await request('GET', '/api/history/' + id, { token });
    assert.equal(one.status, 200);
    assert.ok(one.body.settings && Array.isArray(one.body.sections));
    assert.equal(one.body.settings.adminPassword, undefined);

    const restored = await request('POST', '/api/history/restore', { token, body: { id } });
    assert.equal(restored.status, 200, restored.text);
    assert.equal(readDBFile().settings.slogan, one.body.settings.slogan);

    // 回滚本身也要可撤销：恢复前后都应该多出快照
    const after = await request('GET', '/api/history', { token });
    assert.ok(after.body.versions.some((v) => v.reason === 'before-restore'),
      '回滚前应留一份 before-restore 快照');
  });

  test('非法或过期 id 返回 404，不泄露目录信息', async () => {
    const token = await login();
    const bad = await request('GET', '/api/history/..%2F..%2Fdb', { token });
    assert.equal(bad.status, 404);
    const missing = await request('POST', '/api/history/restore', { token, body: { id: '2026-01-01T00-00-00-000Z-ffffff' } });
    assert.equal(missing.status, 404);
  });

  test('未登录不能访问历史接口', async () => {
    const res = await request('GET', '/api/history');
    assert.equal(res.status, 401);
  });

  test('恢复默认内容也会留快照（误点可回滚）', async () => {
    const token = await login();
    const res = await request('POST', '/api/reset', { token, body: { currentPassword: require('./harness').TEST_PASSWORD } });
    assert.equal(res.status, 200, res.text);
    const list = await request('GET', '/api/history', { token });
    assert.ok(list.body.versions.some((v) => v.reason === 'before-reset'));
  });
});
