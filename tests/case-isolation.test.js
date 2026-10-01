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
  /**
   * 重要：本文件**不得修改** public/cases/ 下的任何文件。
   *
   * 原因：`node --test tests/*.test.js` 会并行运行各测试文件，而 cases.test.js
   * 同时会在读同一个目录。若这里直接改写共享文件，两个文件会互相干扰，
   * 造成间歇性失败（曾实测 1/3 通过率）。
   *
   * 因此改用「内容快照对比」：先记录服务端应返回的内容与 cases/ 的完整指纹，
   * 再执行一个**看起来会污染静态资产**的动作（向服务端写入），
   * 最后确认两者都原封不动。这比"改文件再检查"更安全且同样有力。
   */

  /** 计算 cases/ 目录的稳定指纹（文件名 + 大小 + 内容哈希），不修改任何文件 */
  function fingerprintCasesDir() {
    const crypto = require('crypto');
    const out = {};
    for (const f of fs.readdirSync(CASES_DIR).sort()) {
      const p = path.join(CASES_DIR, f);
      const st = fs.statSync(p);
      if (st.isFile()) {
        out[f] = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex').slice(0, 12);
      } else if (st.isDirectory()) {
        // 只记子目录文件数量，避免递归过深；足以发现"被写入"
        out[f + '/'] = fs.readdirSync(p).length;
      }
    }
    return out;
  }

  test('向服务端写入内容后，cases/ 目录内容零变化（按内容哈希比对）', async () => {
    const casesBefore = fingerprintCasesDir();
    const dbBefore = server.readDB();

    const token = await login();
    const marker = '隔离标记-' + Date.now();
    const res = await request('PUT', '/api/content', {
      token,
      body: {
        settings: { siteName: marker, theme: 'aurora' },
        sections: [{ id: 's1', type: 'text', title: marker }]
      }
    });
    assert.equal(res.status, 200, '保存应成功');
    await new Promise((r) => setTimeout(r, 60));

    const casesAfter = fingerprintCasesDir();
    assert.deepEqual(
      casesAfter, casesBefore,
      '服务端写入后 cases/ 内容发生变化 —— 服务端不应触碰案例目录'
    );

    // 反向确认：数据确实写进了 db.json（而不是哪里都没写）
    assert.equal(server.readDB().settings.siteName, marker, '服务端内容应已更新');
    assert.notEqual(dbBefore.settings.siteName, marker, '前置状态应不同于写入值');
  });

  test('服务端保存的标记不会出现在任何案例 JSON 中', async () => {
    const marker = '隔离标记泄漏检查-' + Date.now();
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

  test('GET /api/content 返回的内容与 cases/ 里的默认案例内容不同（证明未走静态源）', async () => {
    // 服务端内容由 harness 的临时 db.json 决定，与仓库里的案例 JSON 无关。
    // 若两者"恰好相同"，说明服务端可能在读静态资产 —— 这条会失败。
    const res = await request('GET', '/api/content');
    assert.equal(res.status, 200);

    const caseFiles = fs.readdirSync(CASES_DIR).filter((x) => x.endsWith('.json') && x !== 'manifest.json');
    for (const f of caseFiles) {
      const c = JSON.parse(fs.readFileSync(path.join(CASES_DIR, f), 'utf8'));
      const sameName = c.settings.siteName === res.body.settings.siteName;
      const sameSections = JSON.stringify(c.sections) === JSON.stringify(res.body.sections);
      assert.equal(
        sameName && sameSections, false,
        `GET /api/content 的返回与 ${f} 完全一致 —— 服务端疑似在读静态案例`
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
