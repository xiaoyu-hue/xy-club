'use strict';
/**
 * 服务端加固回归测试（v1.7.0）
 *
 * 覆盖安全修复后必须保持的行为，专门堵住审查报告里点名的「变异盲区」：
 *   1. 登出必须让 token 立即失效（否则登出形同虚设，session 仍有效 7 天）
 *   2. 未登录不能上传（上传接口必须强制鉴权）
 *   3. CSRF token 必须与登录会话严格绑定（A 的 csrf 不能用在 B 的 token 上）
 *   4. 会话过期后 /api/check 必须返回未登录
 *   5. 并发写入必须串行化（withDBLock 真正排队，而非各跑各的）
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { server, request, login } = require('./harness');
const { withDBLock, sessions } = require('../server');

const PNG_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC';

describe('服务端加固回归（v1.7.0）', () => {
  test('登出后 token 立即失效', async () => {
    const token = await login();
    assert.equal((await request('GET', '/api/check', { token })).body.ok, true, '登录后 check 应为 true');

    const out = await request('POST', '/api/logout', { token });
    assert.equal(out.status, 200, '登出应返回 200');

    const after = await request('GET', '/api/check', { token });
    assert.equal(after.body.ok, false, '登出后 check 必须为 false（旧实现会仍为 true）');
  });

  test('未登录不能上传图片（强制鉴权）', async () => {
    const res = await request('POST', '/api/upload', { body: { data: PNG_1PX } });
    assert.equal(res.status, 401, '未登录上传应被拒绝');
  });

  test('CSRF token 与登录会话严格绑定：A 的 csrf 不能用于 B 的 token', async () => {
    const tokenA = await login();
    const tokenB = await login();
    const csrfA = (await request('GET', '/api/csrf-token', { token: tokenA })).body.csrfToken;

    // 显式用 B 的 token + A 的 csrf（会覆盖 harness 的自动注入）
    const res = await request('PUT', '/api/content', {
      token: tokenB,
      headers: { 'x-csrf-token': csrfA },
      body: { settings: { siteName: 'X' }, sections: [] }
    });
    assert.equal(res.status, 403, '跨会话复用 CSRF token 必须被拒绝');
  });

  test('会话过期后 /api/check 返回未登录', async () => {
    const token = await login();
    sessions.set(token, Date.now() - 1000); // 手动改为已过期

    const res = await request('GET', '/api/check', { token });
    assert.equal(res.body.ok, false, '过期会话 check 必须为 false');
  });

  test('withDBLock 保证写入串行化（后发任务不会在前序临界区内交错）', async () => {
    const events = [];
    const slow = withDBLock(async () => {
      events.push('slow-enter');
      await new Promise(r => setTimeout(r, 30));
      events.push('slow-exit');
    });
    const fast = withDBLock(() => {
      events.push('fast-enter');
      events.push('fast-exit');
    });
    await Promise.all([slow, fast]);

    // 严格串行：fast 的进入点必须在 slow 完全退出之后
    assert.ok(
      events.indexOf('fast-enter') > events.indexOf('slow-exit'),
      `写锁未串行化，事件顺序异常：${events.join(' -> ')}`
    );
  });
});
