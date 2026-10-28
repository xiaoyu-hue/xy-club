/* 俱乐部官网模板 · 前端渲染 + 微交互（液态玻璃） */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  // 渲染层（纯函数）抽在 js/render.js 里：浏览器端与构建期预渲染共用同一份实现，
  // 避免「预渲染出来的 HTML」和「JS 渲染出来的 HTML」各写一遍后慢慢漂移。
  // 浏览器：render.js 先于本文件加载，挂到 window.XYRender；
  // Node（单元测试）：走 require。
  const R = (typeof module !== 'undefined' && module.exports)
    ? require('./render.js')
    : window.XYRender;
  const { esc, interp, parseStat, twoLines, fragments } = R;
  const fine = matchMedia('(pointer:fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let SITE = { settings: {}, sections: [] };
  // 当前案例 id（静态多案例切换用）。Node 部署下恒为空字符串。
  let CURRENT_CASE = '';
  let STATIC_MODE = false;

  /* ================= 案例切换（静态站特性，ADR-005） ================= */
  // 从 URL 读取案例 id：?case=xxx。无参数返回空串（表示默认案例）。
  function readCaseId() {
    try {
      const v = new URLSearchParams(location.search).get('case');
      // 只允许安全字符，防止路径穿越或注入到 fetch 路径
      return v && /^[a-z0-9-]{1,64}$/.test(v) ? v : '';
    } catch (e) { return ''; }
  }

  /**
   * 加载指定案例的内容。
   * 返回 { data, ok }：ok=false 表示该案例 id 无效 / 加载失败（供上层回退）。
   */
  async function loadCase(id) {
    try {
      const res = await fetch('./cases/' + encodeURIComponent(id) + '.json', { cache: 'no-cache' });
      if (!res.ok) return { data: null, ok: false };
      const data = await res.json();
      if (data && data.settings) return { data, ok: true };
      return { data: null, ok: false };
    } catch (e) { return { data: null, ok: false }; }
  }

  /* ================= 渲染 =================
   * 具体 HTML 由 js/render.js 产出（纯函数），这里只负责「落地到 DOM」与微交互。
   * 顺序：主题 → 片段 → 图片降级 → 演示声明。
   */
  function applyFragments(f) {
    $('#brandLogo').textContent = f.text.brandLogo;
    $('#brandName').textContent = f.text.brandName;
    $('#navLinks').innerHTML = f.html.navLinks;
    $('#mobileMenu').innerHTML = f.html.mobileMenu;
    $('#heroBadge').textContent = f.text.heroBadge;
    $('#heroTitle').innerHTML = f.html.heroTitle;
    $('#heroSub').textContent = f.text.heroSub;
    $('#heroBtns').innerHTML = f.html.heroBtns;
    const ticker = $('#ticker');
    const tickerText = $('#tickerText');
    if (f.text.tickerText) {
      ticker.hidden = false;
      tickerText.textContent = f.text.tickerText;
    } else {
      ticker.hidden = true;
      tickerText.textContent = '';
    }
    $('#app').innerHTML = f.html.sections;
    $('#ctaCard').innerHTML = f.html.cta;
    $('#footerInner').innerHTML = f.html.footer;
    $('#copyright').textContent = f.text.copyright;
    document.title = f.text.title;
    // SEO / 社交卡片随内容更新：后台改站点名或简介后，分享预览不应继续显示旧文案。
    setMeta('description', f.text.description);
    setMeta('og:title', f.text.title, 'property');
    setMeta('og:description', f.text.description, 'property');
    setMeta('og:site_name', f.text.brandName, 'property');
    setMeta('twitter:title', f.text.title);
    setMeta('twitter:description', f.text.description);
    if (f.meta.ogImage) {
      setMeta('og:image', f.meta.ogImage, 'property');
      setMeta('twitter:image', f.meta.ogImage);
    }
  }

  // 只改已存在的标签，不凭空注入（避免与预渲染结果重复）。
  function setMeta(name, value, kind) {
    if (!value) return;
    const sel = kind === 'property' ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    const el = document.querySelector(sel);
    if (el) el.setAttribute('content', value);
  }


  /* ================= 弹窗 / 复制 / Toast ================= */
  // ms 可调：错误提示需要更长的阅读时间（调用方已在传，早期版本被静默忽略）。
  function toast(msg, ms) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove('show'), ms || 2200);
  }
  function copyText(text) {
    const done = () => toast('✅ 已复制：' + text);
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败，请手动复制'); }
      ta.remove();
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else fallback();
  }
  let modalReturnFocus = null;
  function onModalKey(e) {
    if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
  }
  function openModal() {
    const st = SITE.settings;
    const rows = [];
    if (st.wechat) rows.push(['💚', '微信', st.wechat]);
    if (st.qq) rows.push(['🐧', 'QQ', st.qq]);
    if (st.phone) rows.push(['📱', '电话', st.phone]);
    if (st.email) rows.push(['📧', '邮箱', st.email]);
    $('#modalCard').innerHTML = `
      <button class="modal-close" data-close="1">✕</button>
      <h3 class="grad-text">联系我们下单</h3>
      <p class="m-sub">添加任意联系方式，客服秒回接待</p>
      <div class="contact-rows">
        ${rows.map(([i, k, v]) => `
          <div class="c-row"><span class="ci">${i}</span>
            <div><div class="ck">${k}</div><div class="cv">${esc(v)}</div></div>
            <button class="copy-btn" data-copy="${esc(v)}">复制</button>
          </div>`).join('')}
      </div>
      ${st.qrImage ? `<img class="modal-qr" src="${esc(st.qrImage)}" alt="二维码">` : ''}
      ${st.qrNote ? `<p class="m-note">📌 ${esc(st.qrNote)}</p>` : ''}
      <p class="m-time">🕐 ${esc(st.serviceTime || '')}</p>`;
    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
    // 无障碍：记录打开前焦点，并把焦点移入弹窗；ESC 可关闭
    modalReturnFocus = document.activeElement;
    const f = $('#modal').querySelector('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (f) f.focus();
    document.addEventListener('keydown', onModalKey);
  }
  function closeModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onModalKey);
    if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') modalReturnFocus.focus();
  }

  /* ================= 微交互 =================
   * 幂等约定：renderAll() 会在切换案例时重复调用，因此所有「挂全局监听」的绑定
   * 只允许生效一次（flag 守卫）；「按 DOM 挂监听」的绑定每次先清理旧实例，
   * 否则切几次案例就叠几份回调（v1.10.x 的滚动/观察者泄漏）。
   */
  let spotBound = false;
  // 1) 玻璃卡片跟随光标的高光
  function bindSpotlight() {
    if (!fine || spotBound) return;
    spotBound = true;
    document.addEventListener('pointermove', (e) => {
      const el = e.target.closest && e.target.closest('.glass');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }, { passive: true });
  }

  // 2) 卡片 3D 微倾斜（元素级标记，重复绑定同一元素只生效一次）
  function bindTilt() {
    if (!fine || reduced) return;
    document.querySelectorAll('.tilt').forEach(el => {
      if (el.dataset.tiltBound) return;
      el.dataset.tiltBound = '1';
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-6px)`;
      }, { passive: true });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  let rippleBound = false;
  // 3) 按钮点击涟漪
  function bindRipple() {
    if (rippleBound) return;
    rippleBound = true;
    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest && e.target.closest('.btn');
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const sp = document.createElement('span');
      sp.className = 'ripple';
      sp.style.width = sp.style.height = size + 'px';
      sp.style.left = (e.clientX - r.left - size / 2) + 'px';
      sp.style.top = (e.clientY - r.top - size / 2) + 'px';
      btn.appendChild(sp);
      setTimeout(() => sp.remove(), 700);
    }, { passive: true });
  }

  // 4) 数字滚动（旧观察者先断开，避免重复触发）
  let countIO = null;
  function bindCountUp() {
    const els = document.querySelectorAll('.count-up');
    if (reduced) { els.forEach(el => { el.textContent = el.dataset.val; }); return; }
    if (countIO) countIO.disconnect();
    countIO = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        countIO.unobserve(el);
        const target = parseFloat(el.dataset.val) || 0;
        const dec = +el.dataset.dec || 0;
        const dur = 1400, t0 = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(dec);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target.toFixed(dec);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    els.forEach(el => countIO.observe(el));
  }

  // 5) 滚动：进度条 / 导航压缩 / 返回顶部 / 背景视差（全局只绑一次）
  let scrollBound = false;
  function bindScroll() {
    const nav = $('#navbar'), prog = $('#scrollProg'), toTop = $('#toTop'), aurora = $('.aurora');
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const y = window.scrollY || document.documentElement.scrollTop;
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        prog.style.width = (y / max * 100).toFixed(2) + '%';
        nav.classList.toggle('scrolled', y > 60);
        toTop.classList.toggle('show', y > 600);
        if (aurora) aurora.style.transform = `translate3d(${(-y * 0.02).toFixed(1)}px, ${(-y * 0.04).toFixed(1)}px, 0)`;
      });
    };
    onScroll();
    if (scrollBound) return;
    scrollBound = true;
    addEventListener('scroll', onScroll, { passive: true });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // 6) 滚动渐显 + 导航高亮（重绑前断开旧观察者）
  let revealIO = null, navIO = null;
  function bindReveal() {
    if (revealIO) revealIO.disconnect();
    if (navIO) navIO.disconnect();
    revealIO = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

    const links = document.querySelectorAll('#navLinks a');
    if (!links.length) return;
    const secs = document.querySelectorAll('.section');
    navIO = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => navIO.observe(s));
  }

  /* ================= 全局事件 ================= */
  let globalBound = false;
  function bindGlobal() {
    if (globalBound) return;
    globalBound = true;
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('[data-order]')) { openModal(); return; }
      if (t.closest('[data-close]')) { closeModal(); return; }
      const cp = t.closest('[data-copy]');
      if (cp) { copyText(cp.dataset.copy); return; }
      const nav = t.closest('#mobileMenu a');
      if (nav) { $('#mobileMenu').classList.remove('open'); $('#menuBtn').classList.remove('open'); }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    $('#menuBtn').addEventListener('click', () => {
      $('#menuBtn').classList.toggle('open');
      $('#mobileMenu').classList.toggle('open');
    });
    $('#navCta').addEventListener('click', openModal);
    $('#fab').addEventListener('click', openModal);
  }

  /* ================= P5：图片加载失败降级 ================= */
  // 本地图片虽稳，但部署漏传 / 文件损坏时 <img> 会显示裂图图标。
  // 用**一次性** capture 监听统一处理（error 事件不冒泡，但 capture 阶段能拿到），
  // 而不是每次渲染后给每张新图挂 listener —— 案例切换时图片会被整批重建。
  let imageFallbackBound = false;
  function bindImageFallback() {
    if (imageFallbackBound) return;
    imageFallbackBound = true;
    document.addEventListener('error', (e) => {
      const img = e.target;
      if (!img || img.tagName !== 'IMG') return;
      const ph = document.createElement('div');
      ph.className = 'img-fallback';
      ph.textContent = (img.dataset && img.dataset.gfx) || '🖼';
      ph.setAttribute('aria-label', '图片加载失败');
      if (img.parentNode) img.parentNode.replaceChild(ph, img);
    }, true);
  }

  /* ================= 页脚/页眉的演示声明（静态模式） ================= */
  // P1 的运行时配套：静态演示案例需在页面显著位置声明「虚构」，
  // 不能只靠内容里的徽章（案例 1 是真实模板内容，不声明）。
  function renderDemoNotice() {
    if (!STATIC_MODE || !CURRENT_CASE) return;
    const isFictional = !!SITE.settings.fictional;
    if (!isFictional) return;
    const bar = document.createElement('div');
    bar.className = 'demo-notice';
    bar.setAttribute('role', 'note');
    bar.innerHTML = '<b>🎭 模板演示</b> · 本页企业名称、联系方式与内容均为虚构示例，非真实机构。'
      + ' <a href="./themes-demo.html">← 返回案例总览</a>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  /* ================= 启动 ================= */
  function applyTheme() {
    const t = (SITE.settings && SITE.settings.theme) || 'aurora';
    document.documentElement.dataset.theme = ['aurora', 'ocean', 'mist', 'sunset',
      'neutral_morning', 'neutral_cloud', 'neutral_oat', 'neutral_navy']
      .includes(t) ? t : 'aurora';
  }

  /**
   * 渲染全站（P3：切换案例时被完整调用，确保无上一个案例的残留）。
   * 顺序：主题 → 标题 → 各区块 → 图片降级 → 演示声明。
   */
  function renderAll() {
    applyTheme();
    applyFragments(fragments(SITE));
    bindImageFallback();
    renderDemoNotice();
    if (!reduced) requestAnimationFrame(() => { const c = $('#heroCard'); if (c) c.classList.add('enter'); });
  }

  /**
   * 加载内容（ADR-005 四级回退）。
   * 1) 优先后端 API —— 本地或 Node 服务器部署走这条，后台改动即时生效
   * 2) 指定了 ?case=xxx → 读 cases/<id>.json（纯静态多案例切换）
   * 3) 未指定 / 案例无效 → 读 ./content.json 快照（默认案例，兼容旧部署）
   * 4) 全失败 → 提示错误，界面降级为空（不白屏）
   *
   * P4：指定案例加载失败时**自动回退默认案例**，而不是停在那里报错。
   */
  async function loadContent() {
    // 1) 后端 API
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        const data = await res.json();
        if (data && data.settings) { CURRENT_CASE = ''; return data; }
      }
    } catch (e) { /* 无后端，继续走静态回退 */ }

    // 进入静态模式：隐藏后台入口，显示案例切换器
    STATIC_MODE = true;
    document.documentElement.classList.add('static-mode');

    // 2) 指定案例
    const wantedId = readCaseId();
    if (wantedId) {
      const { data, ok } = await loadCase(wantedId);
      if (ok) {
        CURRENT_CASE = wantedId;
        console.info(`[xy-club] 静态预览模式：内容来自 cases/${wantedId}.json`);
        return data;
      }
      // P4：案例无效 → 回退默认，并提示
      console.warn(`[xy-club] 案例「${wantedId}」不存在，已回退默认案例`);
      document.dispatchEvent(new CustomEvent('xy:case-invalid', { detail: { id: wantedId } }));
    }

    // 3) 默认快照
    try {
      const res = await fetch('./content.json');
      if (res.ok) {
        const data = await res.json();
        if (data && data.settings) {
          console.info('[xy-club] 静态预览模式：内容来自 content.json');
          return data;
        }
      }
    } catch (e) { /* 快照也不存在 */ }

    // 4) 全失败
    console.error('加载内容失败：API、案例文件与静态快照均不可用');
    toast('⚠ 内容加载失败，请检查网络后刷新页面', 6000);
    return { settings: {}, sections: [] };
  }

  async function init() {
    SITE = await loadContent();
    renderAll();
    bindGlobal(); bindReveal(); bindScroll(); bindCountUp(); bindTilt(); bindSpotlight(); bindRipple();
  }
  init();

  /* ================= 对外 API（供 case-switcher.js 调用） ================= */
  // P3：reload 会完整重走「加载 → 全量重渲染」，确保切换案例后无任何残留。
  // 渲染完成后派发 xy:rendered，让切换器刷新自身状态（选中项 / 按钮文案）。
  function afterRender() {
    document.dispatchEvent(new CustomEvent('xy:rendered', { detail: { caseId: CURRENT_CASE } }));
  }

  window.XYClub = {
    toast,
    get caseId() { return CURRENT_CASE; },
    async reload(caseId) {
      const id = caseId || '';
      if (id) {
        const { data, ok } = await loadCase(id);
        if (ok) {
          CURRENT_CASE = id; SITE = data;
          renderAll(); bindReveal(); bindScroll(); bindCountUp(); bindTilt();
          afterRender();
          return;
        }
        toast(`⚠ 案例「${id}」不存在，已显示默认案例`);
      }
      // 回默认
      try {
        const res = await fetch('./content.json', { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.settings) {
            CURRENT_CASE = ''; SITE = data;
            renderAll(); bindReveal(); bindScroll(); bindCountUp(); bindTilt();
            afterRender();
            return;
          }
        }
      } catch (e) { /* 忽略 */ }
      toast('⚠ 案例加载失败，请检查网络', 5000);
    }
  };

  // 供 Node 测试复用纯函数（浏览器中 module 未定义，自动跳过）
  if (typeof module !== 'undefined' && module.exports) module.exports = { esc, interp, parseStat, twoLines, readCaseId };
})();
