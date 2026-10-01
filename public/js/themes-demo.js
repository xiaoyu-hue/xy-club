/* 案例与主题总览页 · 交互逻辑
 *
 * 从 themes-demo.html 的内联 <script> 抽出来的，目的是让 CSP 能去掉
 * script-src 的 'unsafe-inline' —— 内联脚本一旦被允许，页面被注入时就无险可守。
 *
 * v1.8.0 起：本页除主题配色外，还渲染「参考案例」区块（数据来自 cases/manifest.json）。
 */
(() => {
  'use strict';

  const esc = (str) => String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '\u0027');

  // 主题 key → 圆点代表色（与 style.css 的 --accent 保持一致）
  const THEME_COLORS = {
    aurora: '#8b7cf6',
    ocean: '#38bdf8',
    sunset: '#fb7185',
    mist: '#6d5df0',
    neutral_morning: '#5a6b7c',
    neutral_cloud: '#4a5568',
    neutral_oat: '#6b5b4e',
    neutral_navy: '#2c5282'
  };

  /* ---------------- 参考案例区块 ---------------- */
  async function renderCases() {
    const host = document.getElementById('caseGrid');
    if (!host) return;
    let manifest = null;
    try {
      const res = await fetch('./cases/manifest.json', { cache: 'no-cache' });
      if (res.ok) manifest = await res.json();
    } catch (e) { /* 无 manifest 时静默跳过案例区 */ }
    if (!manifest || !Array.isArray(manifest.cases) || !manifest.cases.length) {
      host.innerHTML = '<p class="demo-sub">未能加载案例清单。</p>';
      return;
    }

    host.innerHTML = manifest.cases.map((c) => {
      // 默认案例（xy-club）用干净的 URL；其余带 ?case=
      const href = c.id === 'xy-club' ? './index.html' : './index.html?case=' + encodeURIComponent(c.id);
      const color = THEME_COLORS[c.theme] || '#888';
      return `
        <a class="case-card" href="${esc(href)}">
          <div class="case-top">
            <span class="case-emoji">${esc(c.emoji || '🏢')}</span>
            <div>
              <div class="case-title">${esc(c.name)}</div>
              <div class="case-industry">${esc(c.industry || '')}</div>
            </div>
          </div>
          <div class="case-body">
            <p class="case-desc">${esc(c.desc || '')}</p>
            <div class="case-meta">
              <span class="case-swatch" style="background:${esc(color)}"></span>
              <span class="case-theme">${esc(c.theme || '')}</span>
              ${c.fictional ? '<span class="case-badge">虚构示例</span>' : ''}
            </div>
            <span class="case-cta">查看完整演示 →</span>
          </div>
        </a>`;
    }).join('');
  }

  /* ---------------- 主题卡片点击 ---------------- */
  function bindThemeCards() {
    document.querySelectorAll('.theme-card').forEach((card) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const el = card.querySelector('.theme-key');
        if (!el) return;
        const themeKey = el.textContent.replace('data-theme="', '').replace('"', '');
        alert(`主题：${themeKey}\n\n在后台「网站设置 → 主题配色」选择该主题即可生效。\n（本页仅为配色预览）`);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { renderCases(); bindThemeCards(); });
  } else {
    renderCases();
    bindThemeCards();
  }
})();
