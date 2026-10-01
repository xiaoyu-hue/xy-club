/* 主题展示页 · 卡片点击交互
 * 从 themes-demo.html 的内联 <script> 抽出来的，目的是让 CSP 能去掉
 * script-src 的 'unsafe-inline' —— 内联脚本一旦被允许，页面被注入时就无险可守。
 */
(() => {
  'use strict';
  document.querySelectorAll('.theme-card').forEach((card) => {
    card.addEventListener('click', () => {
      const el = card.querySelector('.theme-key');
      if (!el) return;
      const themeKey = el.textContent.replace('data-theme="', '').replace('"', '');
      alert(`主题: ${themeKey}\n\n在后台设置中切换此主题即可看到效果。`);
    });
  });
})();
