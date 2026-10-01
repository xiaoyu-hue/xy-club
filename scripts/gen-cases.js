#!/usr/bin/env node
'use strict';
/**
 * 案例资产格式化 / 校验脚本（v1.10.0 重写）
 *
 * ⚠️ 重要变更：本脚本以前是「案例数据生成器」——在脚本里手写 5 个案例的内容，
 * 然后覆盖写入 public/cases/*.json。但脚本内的内容与线上 JSON 长期脱节
 * （案例名不一致、缺少 settings.fictional 字段），导致每次运行都会
 * 静默破坏线上数据。v1.10.0 起彻底改为下面的行为：
 *
 *   1. 从 public/cases/*.json 读取（JSON 是唯一真源）
 *   2. 校验结构与必填字段
 *   3. 只做格式化（统一缩进、末尾换行），不改变任何内容
 *
 * 因此本脚本现在是幂等的 —— 反复运行不会产生任何 diff。
 *
 * 用法：
 *   node scripts/gen-cases.js          # 校验并格式化
 *   node scripts/gen-cases.js --check  # 只校验，不写文件（适合 CI）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CASES_DIR = path.join(ROOT, 'public', 'cases');
const CHECK_ONLY = process.argv.includes('--check');

const SECTION_TYPES = new Set([
  'services', 'cards', 'testimonials', 'notice', 'faq', 'text', 'gallery', 'custom'
]);

/** 收集对象里所有字符串值（用于凭据扫描） */
function collectStrings(obj, acc = []) {
  if (typeof obj === 'string') acc.push(obj);
  else if (Array.isArray(obj)) obj.forEach((x) => collectStrings(x, acc));
  else if (obj && typeof obj === 'object') Object.values(obj).forEach((x) => collectStrings(x, acc));
  return acc;
}

const errors = [];
const warnings = [];

function readJSON(file) {
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    errors.push(`${path.basename(file)}：JSON 解析失败 —— ${e.message}`);
    return null;
  }
}

/* ---------- 1. 读取案例文件 ---------- */
const caseFiles = fs.readdirSync(CASES_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
  .sort();

if (caseFiles.length === 0) {
  console.error('✗ public/cases/ 下没有任何案例文件');
  process.exit(1);
}

const cases = new Map();
for (const f of caseFiles) {
  const data = readJSON(path.join(CASES_DIR, f));
  if (data) cases.set(f.replace(/\.json$/, ''), data);
}

/* ---------- 2. 校验 ---------- */
for (const [id, data] of cases) {
  const label = `${id}.json`;

  if (!data.settings || typeof data.settings !== 'object') {
    errors.push(`${label}：缺少 settings`);
    continue;
  }
  if (!Array.isArray(data.sections)) {
    errors.push(`${label}：缺少 sections 数组`);
    continue;
  }

  for (const key of ['siteName', 'theme']) {
    if (!data.settings[key]) errors.push(`${label}：settings.${key} 缺失`);
  }

  for (const s of data.sections) {
    if (!s.id) errors.push(`${label}：存在缺少 id 的板块`);
    if (!SECTION_TYPES.has(s.type)) {
      errors.push(`${label}：板块「${s.id || '?'}」类型 "${s.type}" 不在白名单内`);
    }
  }

  // 凭据零容忍：绝不允许把密码写进案例文件
  if ('adminPassword' in data.settings) {
    delete data.settings.adminPassword;
    warnings.push(`${label}：已移除 settings.adminPassword（凭据不得入库）`);
  }
  const creds = collectStrings(data).filter((s) =>
    /(ghp_|gho_|ghs_|sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16})/.test(s)
  );
  if (creds.length) errors.push(`${label}：疑似泄露凭据 ${creds.length} 处`);

  if (id !== 'xy-club' && data.settings.fictional !== true) {
    warnings.push(`${label}：演示案例建议设置 settings.fictional = true`);
  }
}

/* ---------- 3. manifest 校验 ---------- */
const manifestPath = path.join(CASES_DIR, 'manifest.json');
const manifest = readJSON(manifestPath);
if (manifest) {
  if (!Array.isArray(manifest.cases)) {
    errors.push('manifest.json：cases 必须是数组');
  } else {
    const ids = manifest.cases.map((c) => c.id);
    for (const id of cases.keys()) {
      if (!ids.includes(id)) errors.push(`manifest.json：案例「${id}」未登记`);
    }
    for (const c of manifest.cases) {
      if (!cases.has(c.id)) {
        errors.push(`manifest.json：登记了不存在的案例「${c.id}」`);
      }
      if (c.demo && c.fictional !== true) {
        warnings.push(`manifest.json：演示案例「${c.id}」建议标记 fictional: true`);
      }
    }
  }
}

/* ---------- 4. 输出结果 ---------- */
for (const w of warnings) console.warn(`⚠ ${w}`);

if (errors.length) {
  console.error('\n✗ 校验未通过：');
  for (const e of errors) console.error(`  · ${e}`);
  process.exit(1);
}

/* ---------- 5. 格式化（幂等：只有格式不一致时才写回） ---------- */
let changed = 0;
const targets = [...cases.entries()].map(([id, d]) => [`${id}.json`, d]);
if (manifest) targets.push(['manifest.json', manifest]);

for (const [file, data] of targets) {
  const p = path.join(CASES_DIR, file);
  const formatted = JSON.stringify(data, null, 2) + '\n';
  const current = fs.readFileSync(p, 'utf8');
  if (current !== formatted) {
    if (!CHECK_ONLY) fs.writeFileSync(p, formatted);
    changed++;
    console.log(`• ${file} 需要格式化${CHECK_ONLY ? '（--check 模式未写入）' : '，已更新'}`);
  }
}

console.log(`\n✓ 校验通过：${cases.size} 个案例 + manifest`);
if (changed === 0) {
  console.log('✓ 所有文件格式一致，无改动（脚本幂等）');
} else {
  console.log(`  共 ${changed} 个文件格式已统一`);
}
