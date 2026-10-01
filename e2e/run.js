'use strict';
/**
 * E2E 入口
 *
 * Playwright 是**可选**工具：本项目不把它写进 package.json，
 * 这样 `express` 仍然是唯一声明的依赖，锁文件也不用跟着变。
 * 没装就直接跳过（退出码 0），绝不让 `npm run test:e2e` 因为缺依赖而炸掉。
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
  console.log('如需运行，请先安装（不会写进 package.json 的依赖列表）：');
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
