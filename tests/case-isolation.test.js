'use strict';
/**
 * 静态案例与服务端内容的「隔离性」保护测试
 *
 * 背景：
 * v1.8.0（ADR-005）引入了两套内容来源，它们必须**永不交叉**：
 *
 *   【服务端部署】后台编辑器  ──►  data/db.json  ──► GET /api/content
 *   【静态部署】  只读快照     ──►  public/cases/*.json 或 public/content.json
 *
 * 这两条路径在架构上天然分离（server.js 完全不认识 cases/ 目录），
 * 但那是**隐式约定**，没有代码守着。一旦有人（包括未来的我）不小心：
 *   - 让服务端去读 cases/ 当内容源
 *   - 把 DATA_DIR 指到 cases/ 下
 *   - 调换前端回退顺序，让静态案例抢占服务端内容
 * 就可能出现「后台改的内容被静态站覆盖」这类难查的问题。
 *
 * 本文件把这些约定固化成测试，分为两层：
 *   A. 静态检查（读源码，快速定位）
 *   B. 行为检查（真跑一遍服务端，验证隔离确实成立）
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { server, request, login, root: ROOT } = require('./harness');

const SERVER_SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const MAIN_SRC = fs.readFileSync(path.join(ROOT, 'public', 'js', 'main.js'), 'utf8');
const CASES_DIR = path.join(ROOT, 'public', 'cases');

/* ============================================================
 * A. 静态检查：读源码，确认约定没被破坏
 * ============================================================ */

describe('隔离性 · 服务端不得触碰 cases/ 目录', () => {
  test('server.js 源码中不出现 cases 路径引用', () => {
    // 允许注释里提到（解释设计），但不允许出现拼接 cases 路径的代码。
    // 判定方式：找 'cases' 且该行不是纯注释行。
    const lines = SERVER_SRC.split('\n');
    const offenders = [];
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      // 跳过纯注释行（// 或 * 开头）
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
      if (/['"`][^'"`]*cases/.test(line) || /cases[\\/]/.test(line)) {
        offenders.push(`${i + 1}: ${trimmed.slice(0, 90)}`);
      }
    });
    assert.deepEqual(
      offenders, [],
      'server.js 出现 cases 路径引用，服务端不应认识静态案例目录：\n  ' + offenders.join('\n  ')
    );
  });

  test('服务端的数据真源（DB_FILE）不在 cases/ 目录下', () => {
    const dbFile = path.resolve(server.DB_FILE);
    const casesDir = path.resolve(CASES_DIR);
    assert.equal(
      dbFile.startsWith(casesDir + path.sep), false,
      `DB_FILE 落在了 cases/ 下：${dbFile}。服务端写入会污染静态案例`
    );
  });

  test('服务端的上传目录不在 cases/ 目录下', () => {
    const up = path.resolve(server.UPLOAD_DIR);
    const casesDir = path.resolve(CASES_DIR);
    assert.equal(
      up.startsWith(casesDir + path.sep), false,
      `UPLOAD_DIR 落在了 cases/ 下：${up}`
    );
  });

  test('GET /api/content 的实现只读 readDB()，不读磁盘上的案例文件', () => {
    // 抓出该路由的处理函数体，确认没有出现 fs.readFileSync 之类直接读文件
    const idx = SERVER_SRC.indexOf("app.get('/api/content'");
    assert.ok(idx > -1, '应存在 GET /api/content 路由');
    const body = SERVER_SRC.slice(idx, idx + 400);
    assert.match(body, /readDB\(\)/, 'GET /api/content 应通过 readDB() 取数据');
    assert.equal(
      /readFileSync/.test(body), false,
      'GET /api/content 不应直接读文件（会绕过 readDB 的唯一真源约定）'
    );
  });
});

describe('隔离性 · 前端回退顺序必须「API 优先」', () => {
  test('loadContent 中 /api/content 先于 cases/ 与 content.json', () => {
    const fnStart = MAIN_SRC.indexOf('async function loadContent');
    assert.ok(fnStart > -1, '应存在 loadContent 函数');
    const fnBody = MAIN_SRC.slice(fnStart, fnStart + 1400);

    const posApi = fnBody.indexOf('/api/content');
    const posCases = fnBody.indexOf('loadCase(');
    const posSnapshot = fnBody.indexOf("./content.json");

    assert.ok(posApi > -1, '应请求 /api/content');
    assert.ok(posCases > -1, '应有案例回退分支');
    assert.ok(posSnapshot > -1, '应有 content.json 兜底分支');

    assert.ok(
      posApi < posCases,
      `/api/content（位置 ${posApi}）必须先于 loadCase（位置 ${posCases}）。` +
      '顺序颠倒会让静态案例抢占服务端内容，导致「后台改了但页面不变」'
    );
    assert.ok(
      posCases < posSnapshot,
      `loadCase（${posCases}）必须先于 content.json（${posSnapshot}）`
    );
  });

  test('成功拿到 API 内容后立即 return，不继续走静态分支', () => {
    const fnStart = MAIN_SRC.indexOf('async function loadContent');
    const fnBody = MAIN_SRC.slice(fnStart, fnStart + 1400);
    const apiBlock = fnBody.slice(0, fnBody.indexOf('STATIC_MODE = true'));
    assert.match(
      apiBlock, /return data/,
      'API 分支必须 return，否则拿到服务端内容后仍会继续覆盖'
    );
  });

  test('STATIC_MODE 只在 API 失败后才置位', () => {
    const fnStart = MAIN_SRC.indexOf('async function loadContent');
    const fnBody = MAIN_SRC.slice(fnStart, fnStart + 1400);
    const posApi = fnBody.indexOf('/api/content');
    const posStatic = fnBody.indexOf('STATIC_MODE = true');
    assert.ok(
      posApi < posStatic,
      'STATIC_MODE 必须在 /api/content 尝试失败之后才置位（否则会被误判为静态站）'
    );
  });
});

describe('隔离性 · 案例板块类型必须落在服务端白名单内', () => {
  test('所有案例用到的板块类型都属于 ALLOWED_SECTION_TYPES', () => {
    // 意义：案例是「用同一套数据结构拼出来的」。
    // 若某个案例用了服务端不认识的新类型，说明数据结构已经漂移，
    // 后台编辑器将无法正确编辑该案例（ADR-005 的核心前提被破坏）。
    const allowed = server.ALLOWED_SECTION_TYPES;
    const manifest = JSON.parse(fs.readFileSync(path.join(CASES_DIR, 'manifest.json'), 'utf8'));
    for (const c of manifest.cases) {
      const data = JSON.parse(fs.readFileSync(path.join(CASES_DIR, c.id + '.json'), 'utf8'));
      for (const s of data.sections) {
        assert.ok(
          allowed.has(s.type),
          `${c.id}.json 的板块类型「${s.type}」不在服务端白名单内，数据结构已漂移`
        );
      }
    }
  });

  test('案例 settings 的字段都落在 ALLOWED_SETTINGS_KEYS 内（fictional 除外）', () => {
    const allowed = server.ALLOWED_SETTINGS_KEYS;
    const manifest = JSON.parse(fs.readFileSync(path.join(CASES_DIR, 'manifest.json'), 'utf8'));
    // fictional 是 v1.8.0 为静态案例加的标记字段，不参与服务端校验，
    // 但也不应被写进真实站点的 db.json —— 这里显式豁免并记录原因。
    const EXEMPT = new Set(['fictional']);
    for (const c of manifest.cases) {
      const data = JSON.parse(fs.readFileSync(path.join(CASES_DIR, c.id + '.json'), 'utf8'));
      for (const key of Object.keys(data.settings)) {
        if (EXEMPT.has(key)) continue;
        assert.ok(
          allowed.has(key),
          `${c.id}.json 的 settings 字段「${key}」不在服务端白名单内`
        );
      }
    }
  });
});

/* ============================================================
 * B. 行为检查：真跑一遍，验证隔离确实成立
 * ============================================================ */

describe('隔离性 · 行为验证（改静态案例不影响服务端）', () => {
  test('修改 cases/ 下的案例文件后，GET /api/content 返回内容不变', async () => {
    const dbBefore = server.readDB();
    const nameBefore = dbBefore.settings.siteName;

    // 改一份案例文件
    const target = path.join(CASES_DIR, 'warmwood-coffee.json');
    const original = fs.readFileSync(target, 'utf8');
    try {
      const data = JSON.parse(original);
      data.settings.siteName = '【隔离测试】不应出现在服务端';
      fs.writeFileSync(target, JSON.stringify(data, null, 2));

      const res = await request('GET', '/api/content');
      assert.equal(res.status, 200);
      assert.equal(
        res.body.settings.siteName, nameBefore,
        '案例文件被修改后，服务端内容竟然变了 —— 两条路径发生了交叉'
      );
      assert.notEqual(
        res.body.settings.siteName, '【隔离测试】不应出现在服务端'
      );
    } finally {
      fs.writeFileSync(target, original);
    }
  });

  test('服务端保存内容时，不写任何文件到 cases/ 目录', async () => {
    // 记录 cases/ 下所有文件的 mtime
    const snapshot = () => {
      const out = {};
      for (const f of fs.readdirSync(CASES_DIR)) {
        const p = path.join(CASES_DIR, f);
        if (fs.statSync(p).isFile()) out[f] = fs.statSync(p).mtimeMs;
      }
      return out;
    };

    const before = snapshot();
    const token = await login();
    const res = await request('PUT', '/api/content', {
      token,
      body: {
        settings: { siteName: '隔离测试写入', theme: 'aurora' },
        sections: [{ id: 's1', type: 'text', title: '隔离测试' }]
      }
    });
    assert.equal(res.status, 200, '保存应成功');
    await new Promise((r) => setTimeout(r, 60));

    const after = snapshot();
    assert.deepEqual(
      after, before,
      '服务端保存内容后，cases/ 下的文件被改动了 —— 服务端不应触碰案例目录'
    );

    // 反向确认：数据确实写进了 db.json
    assert.equal(server.readDB().settings.siteName, '隔离测试写入');
  });

  test('服务端保存的内容不会出现在任何案例 JSON 里', async () => {
    const marker = '隔离标记-' + Date.now();
    const token = await login();
    const res = await request('PUT', '/api/content', {
      token,
      body: {
        settings: { siteName: marker, theme: 'aurora' },
        sections: [{ id: 's1', type: 'text', title: marker }]
      }
    });
    assert.equal(res.status, 200);

    for (const f of fs.readdirSync(CASES_DIR).filter((x) => x.endsWith('.json'))) {
      const raw = fs.readFileSync(path.join(CASES_DIR, f), 'utf8');
      assert.equal(
        raw.includes(marker), false,
        `服务端写入的内容泄漏进了 ${f}`
      );
    }
  });

  test('静态案例的快照（content.json）不由服务端在线生成', () => {
    // content.json 只能由 scripts/build-static.js 显式构建，
    // 服务端运行时不应对它做任何写操作。
    assert.equal(
      /content\.json/.test(SERVER_SRC), false,
      'server.js 不应引用 content.json（它只服务 API，不参与静态快照）'
    );
  });
});
