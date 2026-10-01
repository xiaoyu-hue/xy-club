'use strict';
/**
 * 文档同步守卫
 *
 * 项目硬要求"改了行为就必须同步文档"，这里把最容易漏的三件事自动化：
 * 版本号漂移、中英文 README 断链、API 表与真实路由不一致。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const pkg = require(path.join(ROOT, 'package.json'));
const pkgVersion = pkg.version;

/** 取 CHANGELOG 里最新的一个版本号 */
function latestChangelogVersion(text) {
  const m = /##\s*\[?v?([\d]+\.[\d]+\.[\d]+)\]?/.exec(text);
  return m ? m[1] : null;
}

describe('版本号同步', () => {
  test('package.json 是唯一真源，两份 CHANGELOG 必须与之对齐', () => {
    assert.equal(latestChangelogVersion(read('CHANGELOG.md')), pkgVersion);
    assert.equal(latestChangelogVersion(read('CHANGELOG.en.md')), pkgVersion);
  });

  test('两份 CHANGELOG 的版本条目一一对应', () => {
    const zh = (read('CHANGELOG.md').match(/^##\s*\[?v?[\d]+\.[\d]+\.[\d]+\]?/gm) || []).length;
    const en = (read('CHANGELOG.en.md').match(/^##\s*\[?v?[\d]+\.[\d]+\.[\d]+\]?/gm) || []).length;
    assert.equal(zh, en, `中文 ${zh} 条 / 英文 ${en} 条，数量不一致`);
  });

  test('文档里不存在已被覆盖的旧版本号残留', () => {
    for (const file of ['README.md', 'README.en.md']) {
      const stale = (read(file).match(/\b1\.\d+\.\d+\b/g) || []).filter((v) => v !== pkgVersion);
      assert.deepEqual(stale, [], `${file} 里残留旧版本号：${stale.join(', ')}`);
    }
  });

  // v1.10.1 补：release 徽章曾显示 v1.8.0 而非 v1.10.0。
  // 根因是 shields.io 默认走 GitHub /releases/latest，它按「创建时间」判定而非
  // SemVer 大小 —— v1.9.0/v1.10.0 的 created_at 相同，谁被选中不确定。
  // 这个缺陷不会让任何测试变红（徽章是外链图片），只能靠静态断言锁住参数。
  test('release 徽章必须带 sort=semver，避免显示旧版本', () => {
    for (const file of ['README.md', 'README.en.md']) {
      const doc = read(file);
      const badges = doc.match(/https:\/\/img\.shields\.io\/github\/v\/release\/[^\s")]+/g) || [];
      assert.ok(badges.length >= 1, `${file} 未找到 release 徽章`);
      for (const url of badges) {
        assert.ok(
          /[?&]sort=semver\b/.test(url),
          `${file} 的 release 徽章缺少 sort=semver，会显示错误的旧版本：${url}`
        );
      }
    }
  });

  test('release 徽章指向正确的仓库', () => {
    for (const file of ['README.md', 'README.en.md']) {
      const badges = read(file).match(/https:\/\/img\.shields\.io\/github\/v\/release\/[^\s")?]+/g) || [];
      for (const url of badges) {
        assert.match(
          url,
          /img\.shields\.io\/github\/v\/release\/xiaoyu-hue\/xy-club$/,
          `${file} 的 release 徽章仓库路径不对：${url}`
        );
      }
    }
  });

  // v1.10.0 补：PRD 版本头此前长期停在 1.5.2 而无人发现 —— 因为上面的残留检查
  // 只覆盖了 README。DOC_SYNC.md 第四节的「版本一致性」要求
  // package.json = CHANGELOG = docs 头部 = tag，这里把 docs 头部也纳入门禁。
  test('docs 版本头必须与 package.json 一致', () => {
    const heads = [
      ['docs/PRD.md', /^>\s*版本：([\d.]+)/m],
      ['docs/PRD.en.md', /^>\s*Version:\s*([\d.]+)/m],
    ];
    for (const [file, re] of heads) {
      const m = read(file).match(re);
      assert.ok(m, `${file} 缺少版本头（形如 "> 版本：x.y.z"）`);
      assert.equal(m[1], pkgVersion, `${file} 版本头 ${m[1]} 与 package.json ${pkgVersion} 不一致`);
    }
  });

  test('PRD 版本历史表首行与当前版本一致', () => {
    for (const [file, re] of [
      ['docs/PRD.md', /\|\s*([\d.]+)\s*\|\s*(?:major|minor|patch)\s*\|/],
      ['docs/PRD.en.md', /\|\s*([\d.]+)\s*\|\s*(?:major|minor|patch)\s*\|/],
    ]) {
      const m = read(file).match(re);
      assert.ok(m, `${file} 未找到版本历史表首行`);
      assert.equal(m[1], pkgVersion, `${file} 版本历史表首行 ${m[1]} 与 package.json ${pkgVersion} 不一致`);
    }
  });
});

describe('中英文 README 配对', () => {
  test('两份 README 互相链到对方', () => {
    assert.match(read('README.md'), /README\.en\.md/);
    assert.match(read('README.en.md'), /README\.md/);
  });

  test('章节标题数量一致（中英一一对应）', () => {
    const count = (t) => (t.match(/^##\s+/gm) || []).length;
    const zh = count(read('README.md'));
    const en = count(read('README.en.md'));
    assert.equal(zh, en, `中文 ${zh} 节 / 英文 ${en} 节`);
  });
});

describe('API 表与真实路由一致', () => {
  test('server.js 里的每个 /api 路由都写进了两份 README', () => {
    const src = read('server.js');
    const routes = new Set(
      (src.match(/app\.(?:get|post|put|delete)\('(\/api\/[\w/-]+)'/g) || []).map((m) =>
        m.replace(/^app\.\w+\('/, '').replace(/'$/, '')
      )
    );
    assert.ok(routes.size >= 6, '应至少解析出 6 个 API 路由');

    for (const file of ['README.md', 'README.en.md']) {
      const doc = read(file);
      for (const r of routes) {
        assert.ok(doc.includes(r), `${file} 的 API 表缺少 ${r}`);
      }
    }
  });

  test('README 标注的方法与 server.js 实际方法一致', () => {
    const src = read('server.js');
    // 同一个路径可能注册了多个方法（GET /api/content 与 PUT /api/content）
    const actual = new Map();
    for (const m of src.matchAll(/app\.(get|post|put|delete)\('(\/api\/[\w/-]+)'/g)) {
      const methods = actual.get(m[2]) || new Set();
      methods.add(m[1].toUpperCase());
      actual.set(m[2], methods);
    }

    for (const file of ['README.md', 'README.en.md']) {
      const rows = read(file).match(/^\|\s*(GET|POST|PUT|DELETE)\s*\|\s*`(\/api\/[\w/-]+)`/gm) || [];
      assert.ok(rows.length >= 7, `${file} 的 API 表至少应有 7 行`);
      for (const row of rows) {
        const mm = /^\|\s*(GET|POST|PUT|DELETE)\s*\|\s*`(\/api\/[\w/-]+)`/.exec(row);
        const methods = actual.get(mm[2]);
        assert.ok(methods, `${file} 记录了不存在的路由 ${mm[2]}`);
        assert.ok(
          methods.has(mm[1]),
          `${file} 把 ${mm[2]} 写成 ${mm[1]}，实际注册的方法是 ${[...methods].join(' / ')}`
        );
      }
    }
  });
});


describe('docs/API.md 详文档与真实路由一致', () => {
  test('server.js 的每个 /api 路由都在 API.md 有详细小节', () => {
    const src = read('server.js');
    const routes = [
      ...new Set(
        (src.match(/app\.(?:get|post|put|delete)\('(\/api\/[\w/-]+)'/g) || []).map((m) =>
          m.replace(/^app\.\w+\('/, '').replace(/'$/, '')
        )
      )
    ];
    assert.ok(routes.length >= 6, '应至少解析出 6 个 API 路由');
    const apiDoc = read('docs/API.md');
    const docHeadings = new Set(
      [...apiDoc.matchAll(/^###\s+(?:GET|POST|PUT|DELETE)\s+(\/api\/[\w/-]+)/gm)].map((m) => m[1])
    );
    for (const r of routes) {
      assert.ok(docHeadings.has(r), `docs/API.md 缺少 ${r} 的详细小节`);
    }
  });

  test('API.md 记录的路由都真实存在于 server.js', () => {
    const src = read('server.js');
    const real = new Set(
      (src.match(/app\.(?:get|post|put|delete)\('(\/api\/[\w/-]+)'/g) || []).map((m) =>
        m.replace(/^app\.\w+\('/, '').replace(/'$/, '')
      )
    );
    const apiDoc = read('docs/API.md');
    const docRoutes = [...apiDoc.matchAll(/^###\s+(?:GET|POST|PUT|DELETE)\s+`?(\/api\/[\w/-]+)`?/gm)].map((m) => m[1]);
    assert.ok(docRoutes.length >= 6, 'API.md 应至少记录 6 个接口');
    for (const d of docRoutes) {
      assert.ok(real.has(d), `docs/API.md 记录了不存在的路由 ${d}`);
    }
  });
});
