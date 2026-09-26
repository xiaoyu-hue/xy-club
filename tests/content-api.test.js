'use strict';
/**
 * 内容读写 API
 *
 * 关注两件事：数据能不能正确落盘，以及有没有把不该外泄的东西写回去。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { server, request, login, readDBFile, writeDBFile, uploadedFiles } = require('./harness');

// 1×1 PNG，够小且能被当成合法图片落盘
const PNG_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('GET /api/content', () => {
  test('返回 settings / sections / updatedAt', async () => {
    const res = await request('GET', '/api/content');
    assert.equal(res.status, 200);
    assert.ok(res.body.settings && typeof res.body.settings === 'object');
    assert.ok(Array.isArray(res.body.sections));
    assert.ok(res.body.sections.length > 0);
    assert.equal(typeof res.body.updatedAt, 'string');
  });

  test('绝不外泄管理密码', async () => {
    const res = await request('GET', '/api/content');
    assert.equal('adminPassword' in res.body.settings, false);
    assert.equal(res.text.includes('adminPassword'), false);
    assert.equal(res.text.includes('scrypt$'), false);
  });
});

describe('PUT /api/content', () => {
  test('未登录时 401', async () => {
    const res = await request('PUT', '/api/content', { body: { settings: {}, sections: [] } });
    assert.equal(res.status, 401);
  });

  test('数据格式错误时 400', async () => {
    const token = await login();
    for (const bad of [{}, { settings: {} }, { sections: [] }, { settings: {}, sections: 'nope' }]) {
      const res = await request('PUT', '/api/content', { token, body: bad });
      assert.equal(res.status, 400, `非法负载 ${JSON.stringify(bad)} 应返回 400`);
    }
  });

  test('保存后能读回来（内容真的落盘了）', async () => {
    const token = await login();
    const current = await request('GET', '/api/content');
    const settings = Object.assign({}, current.body.settings, { siteName: '测试俱乐部' });
    const sections = current.body.sections.map((s, i) =>
      i === 0 ? Object.assign({}, s, { title: '被测试改过的标题' }) : s
    );

    const save = await request('PUT', '/api/content', { token, body: { settings, sections } });
    assert.equal(save.status, 200);
    assert.equal(save.body.ok, true);

    const again = await request('GET', '/api/content');
    assert.equal(again.body.settings.siteName, '测试俱乐部');
    assert.equal(again.body.sections[0].title, '被测试改过的标题');

    assert.equal(readDBFile().settings.siteName, '测试俱乐部', '应已写入 data/db.json');
  });

  test('不能通过保存接口篡改管理密码', async () => {
    const token = await login();
    const before = readDBFile().settings.adminPassword;

    const res = await request('PUT', '/api/content', {
      token,
      body: {
        settings: { siteName: 'X', adminPassword: 'attacker-takeover' },
        sections: []
      }
    });
    assert.equal(res.status, 200);

    const after = readDBFile().settings.adminPassword;
    assert.equal(after, before, '客户端传来的 adminPassword 必须被丢弃');
    assert.ok(after.startsWith('scrypt$'));
  });

  test('内置图片会被还原成 uploads 文件，不把 base64 写进 db.json', async () => {
    const token = await login();
    const res = await request('PUT', '/api/content', {
      token,
      body: {
        settings: { siteName: '内联图片测试', qrImage: PNG_1PX },
        sections: [{ id: 's1', type: 'text', title: 'T', visible: true, items: [{ image: PNG_1PX }] }]
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.restoredImages, true, '应标记发生了图片还原');

    const db = readDBFile();
    const dump = JSON.stringify(db);
    assert.equal(dump.includes('data:image/'), false, 'db.json 里不应残留 base64');
    assert.match(db.settings.qrImage, /^\/uploads\/[\w-]+\.png$/);
    assert.match(db.sections[0].items[0].image, /^\/uploads\/[\w-]+\.png$/);

    // 文件确实写到了上传目录
    const file = path.join(server.UPLOAD_DIR, path.basename(db.settings.qrImage));
    assert.ok(fs.existsSync(file), '还原出的文件应真实存在于上传目录');
    assert.ok(uploadedFiles().length >= 2);
  });

  test('不支持的图片格式（如 svg）不会被还原，原样保留', async () => {
    const token = await login();
    const svg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=';
    await request('PUT', '/api/content', {
      token,
      body: { settings: { siteName: 'Y', qrImage: svg }, sections: [] }
    });
    const db = readDBFile();
    assert.equal(db.settings.qrImage, svg, 'svg 应原样保留而非落盘');
  });
});

describe('POST /api/reset', () => {
  test('需当前密码：缺密码被拒、密码正确才恢复默认内容', async () => {
    const token = await login();
    // 安全修复（S1）：未提供当前密码应被拒，防止被当后门直接调用
    const denied = await request('POST', '/api/reset', { token, body: {} });
    assert.equal(denied.status, 400);

    // 提供正确密码才恢复默认内容
    const res = await request('POST', '/api/reset', { token, body: { currentPassword: 'xy888888' } });
    assert.equal(res.status, 200);
    assert.equal(res.body.settings.siteName, 'XY俱乐部');

    const db = readDBFile();
    assert.ok(db.settings.adminPassword.startsWith('scrypt$'), '密码应仍是哈希，未被重置为明文弱密码');
    assert.equal(db.sections.length > 0, true);
  });
});
