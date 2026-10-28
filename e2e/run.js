'use strict';
/**
 * E2E 入口
 *
 * Playwright 自 v1.11.0 起是 **devDependency**（运行时依赖仍然只有 express）：
 * CI 会装浏览器并跑 E2E，本地没装浏览器时则跳过（退出码 0），不让 `npm run test:e2e` 直接炸。
 * CI 通过 FORCE_E2E=1 要求「必须真跑」，缺依赖即失败。
 *
 * 想跑起来：
 *   npm i -D @playwright/test
 *   npx playwright install chromium
 *   npm run test:e2e
 */
const { spawnSync } = require('child_process');

// 不同版本的 exports 映射不一样，两种写法都试一遍
let cliPath = null;
for (const spec of ['@playwright/test/cli', '@playwright/test/cli.js']) {
  try {
    cliPath = require.resolve(spec);
    break;
  } catch (_) {
    /* 换下一种 */
  }
}

if (!cliPath) {
  // 强制模式：CI / 发布门可设置 FORCE_E2E=1，缺依赖时明确失败（而非静默跳过）
  if (process.env.FORCE_E2E === '1') {
    console.error('✗ E2E 被强制要求（FORCE_E2E=1）但未安装 @playwright/test，退出失败。');
    console.error('  请先执行：npm i -D @playwright/test && npx playwright install chromium');
    process.exit(1);
  }
  console.log('─'.repeat(60));
  console.log('跳过 E2E：未安装 @playwright/test。');
  console.log('');
  console.log('E2E 是可选的端到端验证，单元测试不需要它。');
  console.log('如需本地运行：');
  console.log('');
  console.log('  npm i -D @playwright/test');
  console.log('  npx playwright install chromium');
  console.log('  npm run test:e2e');
  console.log('─'.repeat(60));
  process.exit(0);
}

const args = [cliPath, 'test', ...process.argv.slice(2)];
const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
process.exit(typeof r.status === 'number' ? r.status : 1);
