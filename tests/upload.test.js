'use strict';
/**
 * 图片上传
 *
 * 上传是本项目唯一"把外部字节写进磁盘"的入口，白名单必须严格。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { server, request, login, uploadedFiles } = require('./harness');

const PNG_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function upload(data, token) {
  return request('POST', '/api/upload', { token, body: { data } });
}

describe('上传鉴权', () => {
  test('未登录时 401', async () => {
    const res = await upload(PNG_1PX, undefined);
    assert.equal(res.status, 401);
  });
});

describe('上传白名单', () => {
  test('png / jpg / webp / gif 允许', async () => {
    const token = await login();
    for (const ext of ['png', 'jpeg', 'webp', 'gif']) {
      const data = `data:image/${ext};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==`;
      const res = await upload(data, token);
      assert.equal(res.status, 200, `${ext} 应被允许`);
      assert.match(res.body.url, /^\/uploads\/[\w-]+\.(png|jpg|webp|gif)$/);
      assert.ok(uploadedFiles().includes(path.basename(res.body.url)), '文件应真实落盘');
    }
  });

  test('jpeg 统一归一为 jpg 扩展名', async () => {
    const token = await login();
    const res = await upload('data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', token);
    assert.equal(res.status, 200);
    assert.match(res.body.url, /\.jpg$/);
  });

  test('SVG 被拒绝（可内嵌脚本，属于 XSS 载体）', async () => {
    const token = await login();
    const res = await upload(
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=',
      token
    );
    assert.equal(res.status, 400);
    assert.match(res.body.error, /仅支持/, `实际返回：${JSON.stringify(res.body)}`);
    assert.equal(uploadedFiles().some((f) => f.endsWith('.svg')), false);
  });

  test('非图片被拒绝', async () => {
    const token = await login();
    for (const data of [
      'data:text/html;base64,PGgxPmhpPC9oMT4=',
      'not-a-data-uri',
      ''
    ]) {
      const res = await upload(data, token);
      assert.equal(res.status, 400, `${String(data).slice(0, 24)} 应被拒绝`);
    }
  });

  test('超过 8MB 被拒绝', async () => {
    const token = await login();
    const big = 'data:image/png;base64,' + Buffer.alloc(9 * 1024 * 1024, 0x41).toString('base64');
    const res = await upload(big, token);
    assert.equal(res.status, 400);
    assert.match(res.body.error, /8MB/);
  });
});

describe('上传目录安全响应头', () => {
  test('/uploads 下的响应带 nosniff', async () => {
    const res = await request('GET', '/uploads/does-not-exist.png');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
  });

  test('nosniff 只作用于上传目录，不污染其它静态资源', async () => {
    const res = await request('GET', '/css/style.css');
    assert.equal(res.status, 200);
    assert.equal(res.headers['x-content-type-options'], undefined);
  });

  test('落盘文件确实在受控目录内（不发生路径穿越）', async () => {
    const token = await login();
    const res = await upload(PNG_1PX, token);
    const name = path.basename(res.body.url);
    assert.equal(name.includes('/'), false);
    assert.equal(name.includes('..'), false);
    assert.ok(fs.existsSync(path.join(server.UPLOAD_DIR, name)));
  });
});
