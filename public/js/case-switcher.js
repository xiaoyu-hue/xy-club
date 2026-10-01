/* 参考案例切换器（静态站特性 · ADR-005）
 *
 * 只在 static-mode（纯静态托管）下渲染；Node 部署下后台是唯一内容源，不显示切换器。
 *
 * 职责：
 *   1. 读取 cases/manifest.json，在导航右侧渲染一个下拉切换器
 *   2. 切换案例时用 history.pushState + 重新加载内容 + 局部重渲染（不整页刷新）
 *   3. P6：支持浏览器前进/后退（popstate）；切换前清理旧监听，避免堆积
 *   4. P4：无效案例 id 由 main.js 回退，本文件负责在 UI 上给出反馈
 *
 * 与 main.js 的协作：通过 window.XYClub 暴露的 API 通信（见 main.js 末尾挂载）。
 */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const esc = (str) => String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '\u0027');

  let manifest = null;       // { cases: [...] }
  let menuOpen = false;
  // P6：切换时需清理的监听器（菜单相关的临时绑定）。
  // 注意：popstate / xy:case-invalid 属**常驻**监听器，不放进这里 ——
  // 否则第一次 popstate 触发后 runCleanup 会把 popstate 自己移除，前进/后退随即失效。
  const cleanupFns = [];

  function currentCaseId() {
    try {
      const v = new URLSearchParams(location.search).get('case');
      return v && /^[a-z0-9-]{1,64}$/.test(v) ? v : '';
    } catch (e) { return ''; }
  }

  /* ---------------- 渲染 ---------------- */
  function render() {
    const host = $('#caseSwitcher');
    if (!host || !manifest) return;
    const list = manifest.cases || [];
    const curId = currentCaseId();
    const cur = list.find(c => c.id === curId) || list[0];
    if (!cur) return;

    host.hidden = false; // 静态模式下才填充，填充后显示
    host.innerHTML = `
      <button class="case-btn" id="caseBtn" aria-haspopup="listbox" aria-expanded="false">
        <span class="case-emoji">${esc(cur.emoji || '🔀')}</span>
        <span class="case-label">${esc(cur.name)}</span>
        <span class="case-caret">▾</span>
      </button>
      <div class="case-menu" id="caseMenu" role="listbox" hidden>
        <div class="case-menu-head">选择参考案例</div>
        ${list.map(c => `
          <button class="case-item${c.id === cur.id ? ' active' : ''}" role="option"
                  aria-selected="${c.id === cur.id}" data-case="${esc(c.id)}">
            <span class="ci-emoji">${esc(c.emoji || '🔀')}</span>
            <span class="ci-body">
              <b>${esc(c.name)}</b>
              <small>${esc(c.industry || '')} · ${esc(c.desc || '')}</small>
            </span>
            ${c.fictional ? '<span class="ci-tag">演示</span>' : ''}
          </button>`).join('')}
        <div class="case-menu-foot">
          示例内容均为虚构 · <a href="./themes-demo.html">案例总览</a>
        </div>
      </div>`;
    // 每次重渲染后重新绑定（旧 DOM 随 innerHTML 一起丢弃，天然无残留）
    bindMenu();
  }

  function bindMenu() {
    const btn = $('#caseBtn');
    const menu = $('#caseMenu');
    if (!btn || !menu) return;

    const onBtnClick = (e) => {
      e.stopPropagation();
      menuOpen = !menuOpen;
      menu.hidden = !menuOpen;
      btn.setAttribute('aria-expanded', String(menuOpen));
    };
    const onDocClick = () => { if (menuOpen) { menuOpen = false; menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); } };
    const onKey = (e) => { if (e.key === 'Escape' && menuOpen) { menuOpen = false; menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); } };
    const onItem = (e) => {
      const item = e.target.closest('.case-item');
      if (!item) return;
      switchTo(item.dataset.case);
    };

    btn.addEventListener('click', onBtnClick);
    menu.addEventListener('click', onItem);
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);

    // P6：登记清理函数，切换/重渲染时移除，避免监听器堆积
    cleanupFns.push(() => {
      btn.removeEventListener('click', onBtnClick);
      menu.removeEventListener('click', onItem);
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    });
  }

  function runCleanup() {
    while (cleanupFns.length) {
      const fn = cleanupFns.pop();
      try { fn(); } catch (e) { /* 单个清理失败不影响其它 */ }
    }
  }

  /* ---------------- 切换 ---------------- */
  async function switchTo(id, opts) {
    const push = !opts || opts.push !== false;
    const api = window.XYClub;
    if (!api) return;

    // 目标 URL：默认案例（xy-club）清掉参数，保持 URL 干净
    let url = location.pathname;
    if (id && id !== 'xy-club') url += '?case=' + encodeURIComponent(id);

    if (push && location.pathname + location.search !== url) {
      history.pushState({ case: id }, '', url);
    }

    runCleanup();
    menuOpen = false;
    const menu = $('#caseMenu');
    if (menu) menu.hidden = true;

    await api.reload(id);
  }

  /* ---------------- 启动 ---------------- */
  async function boot() {
    // 只在静态模式下出现。main.js 会在回退到静态时给 <html> 加 static-mode。
    const isStatic = () => document.documentElement.classList.contains('static-mode');
    if (!isStatic()) {
      // main.js 的加载是异步的，可能还没加 class；等一小会儿再判断一次
      await new Promise(r => setTimeout(r, 300));
      if (!isStatic()) return;
    }

    try {
      const res = await fetch('./cases/manifest.json', { cache: 'no-cache' });
      if (!res.ok) return;
      manifest = await res.json();
      if (!manifest || !Array.isArray(manifest.cases) || !manifest.cases.length) return;
    } catch (e) { return; }

    render();

    // P6：浏览器前进/后退（常驻监听，不参与 runCleanup）
    const onPop = () => {
      const id = currentCaseId();
      if (window.XYClub) window.XYClub.reload(id);
    };
    window.addEventListener('popstate', onPop);

    // P4：无效案例时给出可见反馈（main.js 派发的事件，同样常驻）
    const onInvalid = (e) => {
      const id = e.detail && e.detail.id;
      if (window.XYClub) window.XYClub.toast(`⚠ 案例「${id}」不存在，已显示默认案例`);
    };
    document.addEventListener('xy:case-invalid', onInvalid);

    // 内容重渲染后刷新切换器自身（按钮文案 / 选中项）
    const onRendered = () => { runCleanup(); render(); };
    document.addEventListener('xy:rendered', onRendered);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
