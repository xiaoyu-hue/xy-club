'use strict';
/**
 * 官网冒烟：真实浏览器里能不能看、会不会报错、窄屏会不会破版。
 */
const { test, expect } = require('@playwright/test');

/** 收集控制台错误与未捕获异常 */
function watchErrors(page) {
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

test('首页渲染出厂内容，且无控制台报错', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.waitForSelector('#app .section');

  await expect(page.locator('#heroTitle')).toBeVisible();
  await expect(page.locator('#app .section').first()).toBeVisible();
  await expect(page.locator('#footerInner')).toBeVisible();

  const sectionCount = await page.locator('#app .section').count();
  expect(sectionCount).toBeGreaterThanOrEqual(5);

  expect(errors, `控制台报错：${errors.join(' | ')}`).toEqual([]);
});

test('出厂默认主题已应用到 <html>', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#app .section');
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(['aurora', 'ocean', 'mist', 'sunset']).toContain(theme);
});

test('四套主题都能切换且不留下空白文字', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#app .section');

  for (const theme of ['aurora', 'ocean', 'mist', 'sunset']) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    // 主题变量必须真的生效（不是空值），否则就是配色缺项
    const bg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--glass-1').trim()
    );
    expect(bg, `${theme} 主题缺少 --glass-1 变量`).not.toEqual('');
  }
});

test('375px 窄屏不横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.waitForSelector('#app .section');

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
});

test('静态托管模式下不暴露后台入口', async ({ page }) => {
  // 打上 static-mode 标记，模拟 GitHub Pages（拿不到 /api/content）的场景
  await page.goto('/');
  await page.waitForSelector('#app .section');
  await page.evaluate(() => document.documentElement.classList.add('static-mode'));

  const adminVisible = await page.evaluate(() => {
    const el = document.querySelector('.admin-link');
    return el ? getComputedStyle(el).display !== 'none' : false;
  });
  expect(adminVisible).toBe(false);
});
