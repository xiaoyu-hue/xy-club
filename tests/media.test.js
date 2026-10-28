'use strict';
/**
 * 媒体库（v1.11.0）
 *
 * 覆盖：列表 / 用量 / 引用计数 / 删除 / 名字白名单（防路径穿越）/ 未登录拒绝。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { server, request, login } = require('./harness');

// 16 字节的 PNG 文件头：足够让 sniffImageType 认成 png，又不用背一张真图
const PNG_HEAD = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const PNG_DATA = 'data:image/png;base64,' + PNG_HEAD.toString('base64');

async function upload(token) {
  const res = await request('POST', '/api/upload', { token, body: { data: PNG_DATA } });
  assert.equal(res.status, 200, res.text);
  return res.body.url.replace('/uploads/', '');
}

describe('媒体库', () => {
  test('上传的图片会出现在列表里，并带有用量与配额', async () => {
    const token = await login();
    const name = await upload(token);

    const res = await request('GET', '/api/media', { token });
    assert.equal(res.status, 200);
    const item = res.body.files.find((f) => f.name === name);
    assert.ok(item, '列表里应包含刚上传的图');
    assert.equal(item.url, '/uploads/' + name);
    assert.equal(item.refs, 0);
    assert.ok(res.body.totalBytes >= item.bytes);
    assert.ok(res.body.quotaBytes > 0);
  });

  test('内容里引用过的图，引用计数会 > 0', async () => {
    const token = await login();
    const name = await upload(token);
    const c = await request('GET', '/api/content', { token });
    const settings = Object.assign({}, c.body.settings, { qrImage: '/uploads/' + name });
    await request('PUT', '/api/content', { token, body: { settings, sections: c.body.sections } });

    const res = await request('GET', '/api/media', { token });
    const item = res.body.files.find((f) => f.name === name);
    assert.equal(item.refs, 1, '二维码引用了一次，引用计数应为 1');
  });

  test('可以删除，文件真的从磁盘消失', async () => {
    const token = await login();
    const name = await upload(token);
    const del = await request('DELETE', '/api/media/' + name, { token });
    assert.equal(del.status, 200, del.text);
    assert.equal(fs.existsSync(path.join(server.UPLOAD_DIR, name)), false);
  });

  test('非法文件名一律拒绝（防路径穿越）', async () => {
    const token = await login();
    for (const bad of ['..%2Fdb.json', 'a.svg', 'x%00.png', '.hidden.png']) {
      const res = await request('DELETE', '/api/media/' + bad, { token });
      assert.ok(res.status === 400 || res.status === 404, `${bad} 应被拒绝，实际 ${res.status}`);
    }
  });

  test('未登录不能列媒体库', async () => {
    const res = await request('GET', '/api/media');
    assert.equal(res.status, 401);
  });
});
