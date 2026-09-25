'use strict';
/**
 * 后台闭环：登录 → 改内容 → 保存 → 刷新，内容还在。
 *
 * 只在桌面视口跑（后台本来就是桌面工具）。
 */
const { test, expect } = require('@playwright/test');

const PASSWORD = 'xy888888';

async function login(page) {
  await page.goto('/admin.html');
  await page.fill('#pwdInput', PASSWORD);
  await page.click('#loginBtn');
  await page.waitForSelector('#adminView:not([hidden])', { timeout: 10000 });
}

test('密码错误时给出提示，不进入后台', async ({ page }) => {
  await page.goto('/admin.html');
  await page.fill('#pwdInput', 'definitely-wrong');
  await page.click('#loginBtn');
  await expect(page.locator('#loginErr')).not.toBeEmpty();
  await expect(page.locator('#adminView')).toBeHidden();
});

test('登录成功后进入后台，并停在「网站设置」', async ({ page }) => {
  await login(page);
  await expect(page.locator('#adminView')).toBeVisible();
  await expect(page.locator('#tab-settings')).toBeVisible();
});

test('切换主题后 <html> 的 data-theme 跟着变', async ({ page }) => {
  await login(page);
  for (const theme of ['ocean', 'mist', 'sunset', 'aurora']) {
    await page.click(`#themePicker .theme-opt[data-theme="${theme}"]`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  }
});

test('改站名 → 保存 → 刷新官网，改动仍在', async ({ page }) => {
  test.setTimeout(30000);
  await login(page);

  const newName = 'E2E 测试俱乐部';
  await page.fill('input[data-bind="set:siteName"]', newName);
  await page.click('#saveBtn');
  await page.waitForTimeout(1000); // 等保存请求落盘

  await page.goto('/');
  await page.waitForSelector('#app .section');
  await expect(page.locator('#brandName')).toContainText(newName);
});

test('刷新后台后仍是登录态（/api/check 生效）', async ({ page }) => {
  await login(page);
  await page.reload();
  await page.waitForSelector('#adminView:not([hidden])', { timeout: 10000 });
  await expect(page.locator('#adminView')).toBeVisible();
});
