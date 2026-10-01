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

// 四类格式的真实 1×1 图片（用 Pillow 生成，文件头真实）。
// v1.7.0 起服务端会校验文件头魔数，所以测试载荷不能再"拿 PNG 的字节冒充 jpg"，
// 必须用与扩展名一致的真实图片。
const REAL_IMAGES = {
  png: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
  jpeg: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDi6KKK+ZP3E//Z',
  gif: 'R0lGODdhAQABAIEAAP8AAAAAAAAAAAAAACwAAAAAAQABAAAIBAABBAQAOw==',
  webp: 'UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoBAAEAAUAmJaACdLoB+AADsAD+8ut//NgVzXPv9//S4P0uD9Lg/9KQAAA='
};
const dataUri = (ext) => `data:image/${ext};base64,${REAL_IMAGES[ext]}`;
const PNG_1PX = dataUri('png');

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
      const res = await upload(dataUri(ext), token);
      assert.equal(res.status, 200, `${ext} 应被允许（实际：${JSON.stringify(res.body)}）`);
      assert.match(res.body.url, /^\/uploads\/[\w-]+\.(png|jpg|webp|gif)$/);
      assert.ok(uploadedFiles().includes(path.basename(res.body.url)), '文件应真实落盘');
    }
  });

  test('jpeg 统一归一为 jpg 扩展名', async () => {
    const token = await login();
    const res = await upload(dataUri('jpeg'), token);
    assert.equal(res.status, 200);
    assert.match(res.body.url, /\.jpg$/);
  });

  // v1.7.0 新增：只看扩展名是不够的，扩展名是客户端说了算的
  test('文件头与声明格式不符时被拒绝（防伪装）', async () => {
    const token = await login();
    // 声明是 png，实际内容是 GIF —— 旧实现会照单全收
    const res = await upload(`data:image/png;base64,${REAL_IMAGES.gif}`, token);
    assert.equal(res.status, 400, '扩展名与真实内容不符必须拒绝');
    assert.match(res.body.error, /不符|不是有效/);
  });

  test('把 HTML / 脚本伪装成 png 上传时被拒绝', async () => {
    const token = await login();
    const html = Buffer.from('<script>alert(1)</script>'.padEnd(64, ' ')).toString('base64');
    const res = await upload(`data:image/png;base64,${html}`, token);
    assert.equal(res.status, 400);
    assert.match(res.body.error, /不是有效的图片/);
  });

  test('sniffImageType 能正确识别四类格式', () => {
    assert.equal(server.sniffImageType(Buffer.from(REAL_IMAGES.png, 'base64')), 'png');
    assert.equal(server.sniffImageType(Buffer.from(REAL_IMAGES.jpeg, 'base64')), 'jpg');
    assert.equal(server.sniffImageType(Buffer.from(REAL_IMAGES.gif, 'base64')), 'gif');
    assert.equal(server.sniffImageType(Buffer.from(REAL_IMAGES.webp, 'base64')), 'webp');
    assert.equal(server.sniffImageType(Buffer.from('<html></html>')), null);
  });

  test('上传频率超限后返回 429（防磁盘被打满）', async () => {
    const token = await login();
    server.uploadLog.clear(); // 本用例独占计数，避免受前面用例影响
    let last = null;
    for (let i = 0; i < server.UPLOAD_MAX_PER_WINDOW + 1; i++) {
      last = await upload(PNG_1PX, token);
    }
    assert.equal(last.status, 429, '超过窗口上限应被限流');
    server.uploadLog.clear(); // 还原，避免影响后续用例
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

  test('nosniff 作用于所有静态资源（Phase 0 全局安全头）', async () => {
    // Phase 0: 全局安全头，所有静态资源都包含 nosniff
    const res = await request('GET', '/css/style.css');
    assert.equal(res.status, 200);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
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
