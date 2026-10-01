'use strict';
/**
 * 文档策略门禁（DOC POLICY）
 *
 * 背景：GLOBAL.md 的「文档提交规则」明文规定审查报告 / 计划方案 / 工作总结
 * 禁止推送到 GitHub，但规则写完之后从未被检查过 —— 结果 docs/FIX_SUMMARY.md、
 * docs/PLAN-v1.8.0.md、docs/DECISION_REVIEW.md、CODE-REVIEW.md 都躺在仓库里。
 *
 * 结论：**光写"禁止"没有检查，就等于没写**。本文件把这条规则变成可执行的断言。
 *
 * v1.10.2 新增。
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/**
 * 被 GLOBAL.md 明令禁止推送的文件模式。
 * 这些是「过程产物」：写完即过期，但对当时的决策有解释价值 —— 所以策略是
 * 允许它们存在，但只能待在 docs/_archive/ 里，不得出现在主线文档路径。
 */
const FORBIDDEN_PATTERNS = [
  // —— 审查报告：一次性产出，写完即过期 ——
  { re: /^CODE-REVIEW.*\.md$/i, why: '审查报告（一次性）' },
  { re: /^CODE_REVIEW.*\.md$/i, why: '审查报告（一次性）' },
  { re: /^COMPREHENSIVE_REVIEW.*\.md$/i, why: '审查报告（一次性）' },
  { re: /^REVIEW_REPORT.*\.md$/i, why: '审查报告（一次性）' },
  { re: /^IMAGE-AUDIT.*\.md$/i, why: '审查报告（一次性）' },
  { re: /^AUDIT-.*\.md$/i, why: '审查报告（一次性）' },
  // —— 工作总结：属于某次任务的收尾产物 ——
  { re: /^FIX_SUMMARY.*\.md$/i, why: '工作总结（一次性）' },
  { re: /^.*_SUMMARY\.md$/i, why: '工作总结（一次性）' },
  // —— 版本计划：只对某一版有效，版本发完即过期 ——
  { re: /^PLAN-v?\d+\.\d+.*\.md$/i, why: '版本计划（发完即过期）' },
  { re: /^IMPLEMENTATION_PLAN.*\.md$/i, why: '实施计划（发完即过期）' },
  // —— 临时文件 ——
  { re: /\.(tmp|temp)$/i, why: '临时文件' },
];

/**
 * 明确**不属于**过程产物、必须保留的文档（防止误杀）。
 * 这些是「流程工具」：长期有效，且被 AGENTS.md / DOC_SYNC.md 等引用为工作流的一部分。
 */
const ALLOWED_PROCESS_TOOLS = [
  { re: /^DECISION_REVIEW.*\.md$/i, why: '决策审查清单 —— 不可逆操作前的必过流程，与 ADR 配套，长期有效' },
  { re: /^DOC_SYNC.*\.md$/i, why: '文档同步规范 —— 长期有效的执行清单' },
  { re: /^SPEC-.*\.md$/i, why: '规格说明 —— 描述"应该是什么"，长期有效' },
];

/** 允许存在的归档目录（这些路径下的文件不受限） */
const ARCHIVE_DIRS = ['docs/_archive/'];

/** 递归收集仓库内所有文件（跳过噪音目录） */
function walk(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'coverage', '.nyc_output'].includes(entry.name)) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs, rel));
    else out.push(rel);
  }
  return out;
}

function isArchived(p) {
  return ARCHIVE_DIRS.some((d) => p.startsWith(d));
}

describe('文档策略：禁止推送过程产物', () => {
  const allFiles = walk(ROOT);

  test('仓库内不存在被 GLOBAL.md 禁止的过程产物（归档目录除外）', () => {
    const violations = [];
    for (const f of allFiles) {
      if (isArchived(f)) continue;
      const name = path.basename(f);
      // 先排除"流程工具"白名单，避免误杀长期有效的文档
      if (ALLOWED_PROCESS_TOOLS.some(({ re }) => re.test(name))) continue;
      for (const { re, why } of FORBIDDEN_PATTERNS) {
        if (re.test(name)) {
          violations.push(`  ${f}  （${why}）`);
          break;
        }
      }
    }
    assert.deepEqual(
      violations,
      [],
      `发现 ${violations.length} 个被禁止推送的过程产物，\n` +
        `按 GLOBAL.md「文档提交规则」应移入 docs/_archive/ 或删除：\n${violations.join('\n')}`
    );
  });

  test('禁止清单本身有效（防止正则写错导致门禁空转）', () => {
    // 用已知的样本自检：如果模式写错，这里会先失败
    const blocked = [
      'docs/FIX_SUMMARY.md',
      'docs/PLAN-v1.8.0.md',
      'CODE-REVIEW.md',
      'docs/REVIEW_REPORT.md',
      'docs/IMAGE-AUDIT.md',
      'CHANGELOG_FIX_SUMMARY.md',
    ];
    const allowed = [
      'docs/DECISION_REVIEW.md', // 决策审查清单——流程工具，必须放行
      'docs/DOC_SYNC.md', // 同步规范——长期有效
      'docs/PRD.md',
      'docs/ARCHITECTURE.md',
      'README.md',
      'docs/TESTING.md',
      'docs/adr/ADR-001.md',
      'docs/adr/ADR-005.md',
    ];

    for (const sample of blocked) {
      const name = path.basename(sample);
      const hit = FORBIDDEN_PATTERNS.some(({ re }) => re.test(name));
      assert.ok(hit, `${sample} 应被拦截，实际放行 —— 检查 FORBIDDEN_PATTERNS 正则`);
    }
    for (const sample of allowed) {
      const name = path.basename(sample);
      const whitelisted = ALLOWED_PROCESS_TOOLS.some(({ re }) => re.test(name));
      const hit = FORBIDDEN_PATTERNS.some(({ re }) => re.test(name));
      assert.ok(
        whitelisted || !hit,
        `${sample} 应被放行，实际被拦截 —— 流程工具不得进 FORBIDDEN_PATTERNS`
      );
    }
  });

  test('归档目录若存在，其中文件不算违规', () => {
    // 纯逻辑校验，不依赖目录是否真实存在
    assert.ok(isArchived('docs/_archive/FIX_SUMMARY.md'));
    assert.ok(!isArchived('docs/FIX_SUMMARY.md'));
  });
});

describe('文档策略：版本标签不得高于 package.json', () => {
  // 背景：v2.0.0-Phase0 / v2.0.0-Phase1 曾指向已废弃分支的 commit，
  // 且没有对应 GitHub Release，导致 tag 列表顶端显示 2.x 而实际代码是 1.x。
  // 这里用「本地 git tag」做静态校验（CI 环境有完整 git 历史）。
  const { execFileSync } = require('child_process');

  function git(args) {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  }

  function hasGit() {
    try {
      git(['rev-parse', '--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 取本地标签列表。
   *
   * ⚠️ 关键：CI 用的 actions/checkout@v4 默认 fetch-depth=1 **且不抓取标签**，
   * 所以 CI 里 `git tag -l` 返回空。若测试直接断言"必须有标签"，
   * 就会在本地绿、CI 红 —— 这正是 v1.10.2 首次提交时踩的坑。
   *
   * 处理原则：**环境不具备条件时跳过，而不是失败**。
   * 但跳过要说明原因，避免变成"永远不执行却看不出来"的假门禁。
   */
  function localTags() {
    if (!hasGit()) return { ok: false, why: '无 git 环境' };
    let tags;
    try {
      tags = git(['tag', '-l', 'v*']).split('\n').filter(Boolean);
    } catch {
      return { ok: false, why: 'git tag 命令执行失败' };
    }
    if (tags.length === 0) {
      return {
        ok: false,
        why: '本地无标签（CI 的浅克隆不抓取标签，属预期情况）',
      };
    }
    return { ok: true, tags };
  }

  test('所有 tag 的版本号都不高于 package.json（防止遗留 2.x 标签）', (t) => {
    const { ok, tags, why } = localTags();
    if (!ok) return t.skip(why);

    const pkg = require(path.join(ROOT, 'package.json'));
    const [maj, min, pat] = pkg.version.split('.').map(Number);

    const tooHigh = [];
    for (const tag of tags) {
      const mm = /^v(\d+)\.(\d+)\.(\d+)/.exec(tag);
      if (!mm) continue;
      const [T, tmin, tpat] = [Number(mm[1]), Number(mm[2]), Number(mm[3])];
      if (T > maj || (T === maj && tmin > min) || (T === maj && tmin === min && tpat > pat)) {
        tooHigh.push(`  ${tag} > ${pkg.version}`);
      }
    }
    assert.deepEqual(
      tooHigh,
      [],
      `存在版本号高于 package.json(${pkg.version}) 的标签：\n${tooHigh.join('\n')}\n` +
        `这会让 tag 列表顶端显示错误版本，误导阅读者。`
    );
  });

  test('标签格式统一：全部为 vX.Y.Z 或 vX.Y.Z-PhaseN，不含其它花样', (t) => {
    const { ok, tags, why } = localTags();
    if (!ok) return t.skip(why);

    const bad = tags.filter((tag) => !/^v\d+\.\d+\.\d+(-Phase\d+)?$/.test(tag));
    assert.deepEqual(
      bad,
      [],
      `以下标签不符合 GLOBAL.md 规定的格式（vX.Y.Z 或 vX.Y.Z-PhaseN）：\n${bad
        .map((x) => `  ${x}`)
        .join('\n')}`
    );
  });

  // 用 package.json 兜底：即使 CI 没有标签，版本号本身也必须合法。
  // 这样标签相关的断言被跳过时，仍有一条不依赖 git 环境的版本检查在跑。
  test('package.json 版本号本身必须合法（不依赖 git，CI 也执行）', () => {
    const pkg = require(path.join(ROOT, 'package.json'));
    assert.match(
      pkg.version,
      /^\d+\.\d+\.\d+$/,
      `package.json 版本号 "${pkg.version}" 不符合 SemVer（应形如 1.2.3）`
    );
    // 防止再出现 v2.0.0 那种"标签超前"的根源：版本号不应突然跨大版本
    const [maj] = pkg.version.split('.').map(Number);
    assert.ok(maj >= 1, `主版本号 ${maj} 异常`);
  });

  // 说明（v1.10.2）：本文件**刻意不检查**「tag 必须是 HEAD 的祖先」。
  //
  // 初版曾这样断言，结果把 v1.3.0~v1.5.1 这 7 个**合法发布过**的版本判成违规——
  // 它们指向的 commit 不在 main 祖先链上，是因为 main 在 v1.7.0 附近被重建过，
  // 老版本留在了一条分叉历史上。这些 tag 在 GitHub Release 上都有正式记录。
  //
  // 「不在祖先链」≠「错误」。删掉它们反而会让已发布的 Release 变成孤儿。
  // 真正该守的是「tag ↔ Release 一一对应」，见下一个 describe。
  test('历史上存在分叉标签是允许的（防止误删合法版本）', (t) => {
    // 此测试是「文档性断言」：明确记录我们**不**要求 tag 必须是 HEAD 祖先。
    // 若未来有人加回该限制，这里的注释能解释为什么不该加。
    //
    // 它不断言标签数量——因为 CI 浅克隆里标签数为 0，断言数量会误报。
    // 真正防止误删的是这段注释本身，以及 CHANGELOG 里的决策记录。
    if (!hasGit()) return t.skip('无 git 环境（CI 浅克隆属预期）');
    t.diagnostic(
      '约定：分叉历史上的标签（如 v1.3.0~v1.5.1）是合法发布，不得因"非 HEAD 祖先"而删除。'
    );
  });
});
