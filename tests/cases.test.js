'use strict';
/**
 * 多案例资产契约测试（P7 — 案例契约测试门禁）
 *
 * 背景：v1.8.0 起仓库里放了 5 份「案例」内容（1 份真实站点 + 4 份虚构行业演示）。
 * 这些 JSON 是**手写/脚本生成的静态资产**，没有任何运行时校验兜底 —— 一旦写坏，
 * 线上表现是「切到某个案例白屏」或「演示站泄露真实企业信息 / 凭据」。
 *
 * 本文件把「案例必须满足的契约」固化成测试：改坏了 CI 直接红，不靠人眼。
 *
 * 覆盖契约：
 *   ① 结构：每份案例含 settings + sections，sections 里 type 必须在白名单内
 *   ② 一致性：manifest 与磁盘文件一一对应（不多不少）
 *   ③ 安全（零容忍）：不得出现 adminPassword / password / secret / token 字段
 *   ④ P1 虚构声明：演示案例必须 self-declare 为虚构（fictional 标记 + 文案提示）
 *   ⑤ P2 图片溯源：16 张图必须登记在 CREDITS.md，且标注 License
 *   ⑥ 图片引用：JSON 里引用的本地图片必须真实存在
 *   ⑦ 相对路径：图片必须用 ./cases/ 相对路径（GitHub Pages 子路径部署才不挂）
 *   ⑧ 主题合法性：案例声明的主题必须是已知主题之一
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CASES_DIR = path.join(ROOT, 'public', 'cases');
const IMAGES_DIR = path.join(CASES_DIR, 'images');
const CREDITS = path.join(CASES_DIR, 'CREDITS.md');

/** 与 defaults.js / style.css 保持同步的合法板块类型 */
const ALLOWED_TYPES = new Set([
  'cards', 'services', 'testimonials', 'notice', 'faq', 'text', 'gallery', 'custom'
]);

/** 与 public/css/style.css 的 html[data-theme] 分组保持同步 */
const ALLOWED_THEMES = new Set([
  'aurora', 'ocean', 'sunset', 'mist',
  'neutral_morning', 'neutral_cloud', 'neutral_oat', 'neutral_navy'
]);

/** 凭据字段：出现在任何案例里都是事故 */
const FORBIDDEN_KEYS = ['adminPassword', 'password', 'secret', 'token'];

function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(CASES_DIR, 'manifest.json'), 'utf8'));
}

function readCase(id) {
  return JSON.parse(fs.readFileSync(path.join(CASES_DIR, id + '.json'), 'utf8'));
}

/** 深度收集对象里所有字符串值 */
function collectStrings(node, out) {
  out = out || [];
  if (typeof node === 'string') { out.push(node); return out; }
  if (Array.isArray(node)) { node.forEach((v) => collectStrings(v, out)); return out; }
  if (node && typeof node === 'object') {
    Object.values(node).forEach((v) => collectStrings(v, out));
  }
  return out;
}

describe('多案例 · manifest 与文件一致性', () => {
  test('manifest.json 可解析且声明了案例列表', () => {
    const m = readManifest();
    assert.ok(Array.isArray(m.cases), 'manifest 需含 cases 数组');
    assert.ok(m.cases.length >= 1, 'cases 不能为空');
  });

  test('manifest 每个 id 都有对应 JSON 文件', () => {
    for (const c of readManifest().cases) {
      const p = path.join(CASES_DIR, c.id + '.json');
      assert.ok(fs.existsSync(p), `manifest 里的案例「${c.id}」缺少 ${c.id}.json`);
    }
  });

  test('磁盘上的案例 JSON 都已登记进 manifest（无孤儿文件）', () => {
    const declared = new Set(readManifest().cases.map((c) => c.id));
    const onDisk = fs.readdirSync(CASES_DIR)
      .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
      .map((f) => f.replace(/\.json$/, ''));
    for (const id of onDisk) {
      assert.ok(declared.has(id), `public/cases/${id}.json 存在但未登记进 manifest.json`);
    }
  });

  test('案例 id 只含小写字母/数字/连字符（与前端 readCaseId 校验一致）', () => {
    // 前端 main.js 的 readCaseId 用 /^[a-z0-9-]{1,64}$/ 过滤，
    // 若 manifest 里出现大写或下划线，切换请求会在前端被静默丢弃。
    for (const c of readManifest().cases) {
      assert.match(c.id, /^[a-z0-9-]{1,64}$/, `案例 id「${c.id}」不符合前端校验规则`);
    }
  });

  test('默认案例（首项）是 xy-club 且非虚构', () => {
    const first = readManifest().cases[0];
    assert.equal(first.id, 'xy-club', '首项应为默认案例 xy-club');
    assert.equal(first.fictional, false, 'xy-club 是真实站点，不应标记为虚构');
  });

  test('每个案例声明了合法主题', () => {
    for (const c of readManifest().cases) {
      assert.ok(ALLOWED_THEMES.has(c.theme), `案例「${c.id}」主题「${c.theme}」不在已知主题内`);
    }
  });
});

describe('多案例 · 结构契约', () => {
  const cases = readManifest().cases;

  test('每份案例都含 settings 与 sections', () => {
    for (const c of cases) {
      const data = readCase(c.id);
      assert.ok(data.settings && typeof data.settings === 'object', `${c.id}.json 缺 settings`);
      assert.ok(Array.isArray(data.sections) && data.sections.length, `${c.id}.json 的 sections 为空`);
    }
  });

  test('每份案例的板块类型都在白名单内', () => {
    for (const c of cases) {
      for (const s of readCase(c.id).sections) {
        assert.ok(ALLOWED_TYPES.has(s.type), `${c.id}.json 含非法板块类型: ${s.type}`);
      }
    }
  });

  test('每份案例都设置了站点名（siteName）', () => {
    for (const c of cases) {
      const s = readCase(c.id).settings;
      assert.ok(typeof s.siteName === 'string' && s.siteName.trim(), `${c.id} 缺 siteName`);
    }
  });

  test('案例 settings 字段集与真实站点保持一致（不引入额外必填字段）', () => {
    // 案例 JSON 由前端统一渲染，字段一旦与 defaults.js 漂移就会出现空白区块。
    // 这里以 xy-club.json（真实站点的快照）为基准做「子集」校验：
    // 演示案例可以有额外字段（如 fictional），但不能缺字段。
    const base = Object.keys(readCase('xy-club').settings);
    for (const c of cases) {
      const keys = new Set(Object.keys(readCase(c.id).settings));
      for (const k of base) {
        assert.ok(keys.has(k), `${c.id}.json 缺少与真实站点对齐的字段: ${k}`);
      }
    }
  });
});

describe('多案例 · 安全契约（零容忍）', () => {
  const cases = readManifest().cases;

  test('案例 JSON 不含任何凭据字段', () => {
    for (const c of cases) {
      const raw = fs.readFileSync(path.join(CASES_DIR, c.id + '.json'), 'utf8');
      for (const k of FORBIDDEN_KEYS) {
        const re = new RegExp('"' + k + '"\\s*:');
        assert.equal(re.test(raw), false, `${c.id}.json 含禁止字段「${k}」`);
      }
    }
  });

  test('案例 JSON 不含密码哈希痕迹', () => {
    for (const c of cases) {
      const raw = fs.readFileSync(path.join(CASES_DIR, c.id + '.json'), 'utf8');
      assert.equal(raw.includes('scrypt$'), false, `${c.id}.json 疑似含密码哈希`);
    }
  });

  test('CREDITS.md 等台账文件不会被误当成案例数据源泄露密钥', () => {
    // 台账是纯文本，这里只确认它不含任何密钥样式字符串
    const md = fs.readFileSync(CREDITS, 'utf8');
    assert.equal(/scrypt\$/.test(md), false);
    assert.equal(/"adminPassword"\s*:/.test(md), false);
  });
});

describe('多案例 · P1 虚构声明', () => {
  test('演示案例在 manifest 中标记 fictional=true', () => {
    const demo = readManifest().cases.filter((c) => c.id !== 'xy-club');
    assert.ok(demo.length > 0, '应存在演示案例');
    for (const c of demo) {
      assert.equal(c.fictional, true, `演示案例「${c.id}」应标记 fictional=true`);
    }
  });

  test('演示案例在 settings 中标记 fictional=true', () => {
    for (const c of readManifest().cases.filter((x) => x.id !== 'xy-club')) {
      const s = readCase(c.id).settings;
      assert.equal(s.fictional, true, `${c.id}.json settings 应含 fictional:true`);
    }
  });

  test('演示案例首屏徽标显式声明「虚构 / 演示」', () => {
    for (const c of readManifest().cases.filter((x) => x.id !== 'xy-club')) {
      const s = readCase(c.id).settings;
      const badge = String(s.heroBadge || '');
      assert.ok(badge.length > 0, `${c.id} 缺 heroBadge`);
      const declares = badge.includes('虚构') || badge.includes('演示') || badge.includes('模板');
      assert.ok(declares, `${c.id} 的 heroBadge「${badge}」未声明虚构/演示性质`);
    }
  });

  test('演示案例文案中不出现「真实/官方/正版」这类误导性表述', () => {
    const misleading = ['官方认证', '正版授权', '国家认证', '政府指定'];
    for (const c of readManifest().cases.filter((x) => x.id !== 'xy-club')) {
      const strings = collectStrings(readCase(c.id), []);
      for (const s of strings) {
        for (const word of misleading) {
          assert.equal(s.includes(word), false, `${c.id} 文案含误导性表述「${word}」: ${s.slice(0, 40)}`);
        }
      }
    }
  });
});

describe('多案例 · P2 图片资产与授权溯源', () => {
  test('images/ 目录存在且有图片', () => {
    assert.ok(fs.existsSync(IMAGES_DIR), '缺少 public/cases/images/');
    const files = fs.readdirSync(IMAGES_DIR).filter((f) => /\.(webp|jpg|png|avif)$/i.test(f));
    assert.ok(files.length > 0, 'images/ 目录为空');
  });

  test('CREDITS.md 存在且登记了全部图片', () => {
    assert.ok(fs.existsSync(CREDITS), '缺少 public/cases/CREDITS.md（图片授权台账）');
    const md = fs.readFileSync(CREDITS, 'utf8');
    const files = fs.readdirSync(IMAGES_DIR).filter((f) => /\.(webp|jpg|png|avif)$/i.test(f));
    for (const f of files) {
      assert.ok(md.includes(f), `CREDITS.md 未登记图片: ${f}`);
    }
  });

  test('CREDITS.md 标注了 License，可追溯', () => {
    const md = fs.readFileSync(CREDITS, 'utf8');
    assert.match(md, /License/i, 'CREDITS.md 需有 License 列');
    assert.match(md, /Unsplash|CC0|Public Domain|Pexels/i, 'CREDITS.md 需写明具体授权来源');
  });

  test('案例引用的本地图片真实存在', () => {
    for (const c of readManifest().cases) {
      const refs = collectStrings(readCase(c.id), [])
        .filter((s) => s.startsWith('./cases/images/') || s.startsWith('/cases/images/'));
      for (const r of refs) {
        const rel = r.replace(/^\.?\/cases\/images\//, '');
        assert.ok(
          fs.existsSync(path.join(IMAGES_DIR, rel)),
          `${c.id}.json 引用的图片不存在: ${r}`
        );
      }
    }
  });

  test('本地图片一律用 ./cases/ 相对路径（兼容 GitHub Pages 子路径部署）', () => {
    for (const c of readManifest().cases) {
      const refs = collectStrings(readCase(c.id), []);
      for (const r of refs) {
        // 只要提到 cases/images/，就必须是相对引入，不能是 /cases/images/ 或裸 cases/images/
        if (r.includes('cases/images/')) {
          assert.ok(
            r.startsWith('./cases/images/'),
            `${c.id}.json 图片路径「${r}」必须是 ./cases/images/... 相对路径`
          );
        }
      }
    }
  });

  test('图片体积在预算内（单图 < 400KB，总量 < 5MB）', () => {
    const files = fs.readdirSync(IMAGES_DIR).filter((f) => /\.(webp|jpg|png|avif)$/i.test(f));
    let total = 0;
    for (const f of files) {
      const size = fs.statSync(path.join(IMAGES_DIR, f)).size;
      total += size;
      assert.ok(size < 400 * 1024, `${f} 体积 ${(size / 1024).toFixed(0)}KB 超过 400KB`);
    }
    assert.ok(total < 5 * 1024 * 1024, `图片总量 ${(total / 1024 / 1024).toFixed(2)}MB 超过 5MB 预算`);
  });
});

describe('多案例 · 前端切换链路', () => {
  test('main.js 具备「API → 案例 JSON → content.json」回退链', () => {
    const js = fs.readFileSync(path.join(ROOT, 'public', 'js', 'main.js'), 'utf8');
    assert.match(js, /cases\//, 'main.js 应能按 case id 读取 cases/<id>.json');
    assert.match(js, /content\.json/, 'main.js 应保留 content.json 最终回退');
    assert.match(js, /readCaseId/, 'main.js 应校验 case id（防路径穿越）');
  });

  test('case-switcher.js 使用 pushState + popstate 支持浏览器前进/后退', () => {
    const js = fs.readFileSync(path.join(ROOT, 'public', 'js', 'case-switcher.js'), 'utf8');
    assert.match(js, /pushState/, '切换应写历史（否则无法回退）');
    assert.match(js, /popstate/, '应监听 popstate 响应浏览器后退');
  });

  test('index.html 引入了案例切换脚本与挂载点', () => {
    const html = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
    assert.match(html, /case-switcher\.js/, 'index.html 应引入 case-switcher.js');
    assert.match(html, /id="caseSwitcher"/, 'index.html 应提供切换器挂载点');
  });

  test('底部 CTA 必须位于 #app 之外（否则 renderSections 会把它整块删掉）', () => {
    // 这是 v1.8.0 修掉的线上事故：CTA 若在 #app 内，renderSections 整体替换
    // #app.innerHTML 后 #ctaCard 消失，renderCTA 抛错 → CTA 与页脚全不渲染。
    // 判据：<main id="app"> 的闭合标签 </main> 必须出现在 #ctaCard 之前。
    const html = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
    const mainOpen = html.indexOf('id="app"');
    assert.ok(mainOpen > -1, 'index.html 应有 #app');
    const mainClose = html.indexOf('</main>', mainOpen);
    assert.ok(mainClose > -1, '#app 应有闭合标签 </main>');
    const ctaPos = html.indexOf('id="ctaCard"');
    assert.ok(ctaPos > -1, 'index.html 应有 #ctaCard');
    assert.ok(ctaPos > mainClose, '#ctaCard 必须位于 </main> 之后（即 #app 容器之外）');
  });

  test('themes-demo 页具备案例总览卡片容器', () => {
    const html = fs.readFileSync(path.join(ROOT, 'public', 'themes-demo.html'), 'utf8');
    assert.match(html, /id="caseGrid"/, 'themes-demo 应有案例卡片容器 #caseGrid');
    assert.match(html, /themes-demo\.js/, 'themes-demo 应引入 themes-demo.js');
  });
});
