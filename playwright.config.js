'use strict';
/**
 * Playwright 冒烟配置（可选工具，未安装时 `npm run test:e2e` 会跳过）
 *
 * 只跑两个视口：桌面 + 375px 窄屏 —— 对应交付前自检清单里的两条。
 */
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.js/,
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false, // 共用同一个后台数据，串行更稳
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node e2e/serve.js',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 60000
  },
  projects: [
    {
      name: 'desktop',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } }
    },
    {
      name: 'mobile-375',
      use: { browserName: 'chromium', viewport: { width: 375, height: 667 }, hasTouch: true }
    }
  ]
});
