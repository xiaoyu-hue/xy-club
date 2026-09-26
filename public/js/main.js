/* 俱乐部官网模板 · 前端渲染 + 微交互（液态玻璃） */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const esc = (str) => String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  // 占位符插值：{{custom.键名}} → settings.custom[键名]；键不存在返回空。
  // 调用方需先 interp 再 esc，因此自定义值里的 HTML 会被转义，无 XSS 风险。
  const interp = (text, custom) => {
    const c = custom || {};
    return String(text == null ? '' : text)
      .replace(/\{\{\s*custom\.([\w.\-]+)\s*\}\}/g, (m, k) => (k in c ? c[k] : ''));
  };
  const fine = matchMedia('(pointer:fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let SITE = { settings: {}, sections: [] };

  /* ================= 渲染 ================= */
  function twoLines(title) {
    const parts = String(title || '').split('|');
    if (parts.length > 1) {
      return `<span class="t1">${esc(parts[0])}</span><span class="t2 grad-text">${esc(parts.slice(1).join('|'))}</span>`;
    }
    return `<span class="grad-text">${esc(parts[0] || '')}</span>`;
  }

  function parseStat(s) {
    const m = String(s).match(/^([\d.]+)(.*)$/);
    if (!m) return { val: 0, suffix: '', label: s };
    const label = m[2] || '';
    const sm = label.match(/^([^\d\u4e00-\u9fa5A-Za-z]*)/);
    const suffix = sm ? sm[1] : '';
    return { val: parseFloat(m[1]), suffix, label: label.slice(suffix.length) };
  }

  function renderNav() {
    const st = SITE.settings;
    $('#brandLogo').textContent = st.logoEmoji || '💎';
    $('#brandName').textContent = st.siteName || '俱乐部';
    const links = SITE.sections.filter(s => s.visible !== false).slice(0, 6);
    const html = links.map(s => `<a href="#sec-${esc(s.id)}">${esc(s.title)}</a>`).join('');
    $('#navLinks').innerHTML = html;
    $('#mobileMenu').innerHTML = html + `<a href="javascript:void(0)" data-order>📞 联系下单</a>`;
  }

  function renderHero() {
    const st = SITE.settings;
    $('#heroBadge').textContent = st.heroBadge || '';
    $('#heroTitle').innerHTML = twoLines(st.heroTitle);
    $('#heroSub').textContent = st.heroSubtitle || '';
    $('#heroBtns').innerHTML =
      `<button class="btn btn-primary btn-lg" data-order>🚀 立即下单</button>
       <a class="btn btn-ghost btn-lg" href="#app">📋 查看价目</a>`;
    const stats = String(st.heroStats || '').split(/[,，]/).map(x => x.trim()).filter(Boolean);
    $('#heroStats').innerHTML = stats.map(s => {
      const p = parseStat(s);
      const dec = (String(p.val).split('.')[1] || '').length;
      return `<div class="stat">
        <b class="gold-text"><span class="count-up" data-val="${p.val}" data-dec="${dec}">0</span>${esc(p.suffix)}</b>
        <span>${esc(p.label)}</span></div>`;
    }).join('');
    document.title = `${st.siteName || '俱乐部'} · ${st.slogan || '官网'}`;
    if (!reduced) requestAnimationFrame(() => $('#heroCard').classList.add('enter'));
  }

  function renderTicker() {
    const t = String(SITE.settings.announcement || '').trim();
    const el = $('#ticker');
    if (!t) { el.hidden = true; return; }
    el.hidden = false;
    $('#tickerText').textContent = t;
  }

  /* -------- 各类型板块 -------- */
  function priceRow(it, i) {
    return `<div class="price-row reveal" style="--i:${i}">
      <div class="pr-info">
        <div class="pr-name">${esc(it.name)}</div>
        ${it.desc ? `<div class="pr-desc">${esc(it.desc)}</div>` : ''}
      </div>
      <div class="pr-price"><span class="num gold-text">${esc(it.price)}</span>${it.original ? `<span class="pr-original">${esc(it.original)}</span>` : ''}<span class="unit">${esc(it.unit)}</span></div>
    </div>`;
  }
  function stars(n) {
    return Array.from({ length: Math.max(1, Math.min(5, +n || 5)) },
      (_, k) => `<span style="animation-delay:${k * 90}ms">★</span>`).join('');
  }

  function sectionHTML(s) {
    const st = SITE.settings;
    const head = `<div class="sec-head reveal">
        <span class="sec-icon">${esc(s.icon || '✦')}</span>
        <h2 class="grad-text">${esc(s.title)}</h2>
        ${s.subtitle ? `<p class="sec-sub">${esc(s.subtitle)}</p>` : ''}
      </div>`;
    let body = '';
    const items = s.items || [];
    switch (s.type) {
      case 'services':
        body = `<div class="price-list">${items.map(priceRow).join('')}</div>
          ${s.tip ? `<p class="sec-tip reveal">${esc(s.tip)}</p>` : ''}`;
        break;
      case 'cards':
        body = `<div class="card-grid">${items.map((it, i) => `
          <div class="f-card tilt reveal" style="--i:${i}">
            <span class="ic">${esc(it.icon || '✨')}</span>
            <h3>${esc(it.title)}</h3><p>${esc(it.desc)}</p>
          </div>`).join('')}</div>`;
        break;
      case 'testimonials':
        body = `<div class="review-grid">${items.map((it, i) => `
          <div class="r-card tilt reveal" style="--i:${i}"><span class="quote">”</span>
            <div class="r-stars">${stars(it.rating)}</div>
            <p class="r-text">${esc(it.text)}</p>
            <div class="r-who"><span class="r-avatar">${esc(it.emoji || '🙂')}</span><b>${esc(it.who)}</b></div>
          </div>`).join('')}</div>`;
        break;
      case 'notice':
        body = `<div class="notice-list">${items.map((it, i) => `
          <div class="n-item reveal" style="--i:${i}"><span class="ni">${esc(it.icon || '•')}</span><span>${esc(it.text)}</span></div>`).join('')}</div>`;
        break;
      case 'faq':
        body = `<div class="faq-list">${items.map((it, i) => `
          <details class="faq-item reveal" style="--i:${i}">
            <summary><span><span class="q-mark">Q.</span>${esc(it.q)}</span><span class="arrow">▼</span></summary>
            <div class="faq-a">${esc(it.a)}</div>
          </details>`).join('')}</div>`;
        break;
      case 'gallery':
        body = `<div class="gallery-grid">${items.map((it, i) => `
          <figure class="g-item reveal" style="--i:${i}">
            <img src="${esc(it.url)}" alt="${esc(it.caption || '')}" loading="lazy">
            ${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ''}
          </figure>`).join('')}</div>`;
        break;
      case 'text':
        body = `<div class="text-wrap reveal">${esc(s.content)}</div>`;
        break;
      case 'custom':
        body = `<div class="text-wrap custom-wrap reveal">${esc(interp(s.content, st.custom))}</div>`;
        break;
      default: body = '';
    }
    return `<section class="section" id="sec-${esc(s.id)}">${head}${body}</section>`;
  }

  function renderSections() {
    const list = (SITE.sections || []).filter(s => s.visible !== false);
    $('#app').innerHTML = list.map(sectionHTML).join('');
  }

  function renderCTA() {
    const st = SITE.settings;
    $('#ctaCard').innerHTML = `
      <h2 class="grad-text">准备好开启陪伴了吗？</h2>
      <p>${esc(st.slogan || '')}　${esc(st.qrNote || '')}</p>
      ${st.wechat ? `<div class="cta-wx">💚 微信号：<b>${esc(st.wechat)}</b></div>` : ''}
      <div class="cta-btns">
        <button class="btn btn-gold btn-lg" data-order>💌 立即下单</button>
        ${st.wechat ? `<button class="btn btn-ghost btn-lg" data-copy="${esc(st.wechat)}">📋 复制微信号</button>` : ''}
      </div>
      ${st.qrImage ? `<img class="cta-qr" src="${esc(st.qrImage)}" alt="客服二维码">` : ''}`;
  }

  function renderFooter() {
    const st = SITE.settings;
    const cols = SITE.sections.filter(s => s.visible !== false).slice(0, 5)
      .map(s => `<a href="#sec-${esc(s.id)}">${esc(s.title)}</a>`).join('');
    $('#footerInner').innerHTML = `
      <div class="f-brand">
        <span class="brand-logo">${esc(st.logoEmoji || '💎')}</span>
        <h3 class="grad-text">${esc(st.siteName || '')}</h3>
        <p>${esc(st.footer || '')}</p>
      </div>
      <div class="f-col"><h4>快速导航</h4>${cols}</div>
      <div class="f-col"><h4>联系方式</h4>
        ${st.wechat ? `<span>微信：${esc(st.wechat)}</span>` : ''}
        ${st.qq ? `<span>QQ：${esc(st.qq)}</span>` : ''}
        ${st.phone ? `<span>电话：${esc(st.phone)}</span>` : ''}
        ${st.email ? `<span>邮箱：${esc(st.email)}</span>` : ''}
        <a href="javascript:void(0)" data-order>📩 联系下单</a>
      </div>`;
    $('#copyright').textContent = `© ${new Date().getFullYear()} ${st.siteName || '俱乐部'} · ${st.slogan || ''}`;
  }

  /* ================= 弹窗 / 复制 / Toast ================= */
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove('show'), 2200);
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
  }
  function closeModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
  }

  /* ================= 微交互 ================= */
  // 1) 玻璃卡片跟随光标的高光
  function bindSpotlight() {
    if (!fine) return;
    document.addEventListener('pointermove', (e) => {
      const el = e.target.closest && e.target.closest('.glass');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }, { passive: true });
  }

  // 2) 卡片 3D 微倾斜
  function bindTilt() {
    if (!fine || reduced) return;
    document.querySelectorAll('.tilt').forEach(el => {
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

  // 3) 按钮点击涟漪
  function bindRipple() {
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

  // 4) 数字滚动
  function bindCountUp() {
    const els = document.querySelectorAll('.count-up');
    if (reduced) { els.forEach(el => { el.textContent = el.dataset.val; }); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        io.unobserve(el);
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
    els.forEach(el => io.observe(el));
  }

  // 5) 滚动：进度条 / 导航压缩 / 返回顶部 / 背景视差
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
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // 6) 滚动渐显 + 导航高亮
  function bindReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    const links = document.querySelectorAll('#navLinks a');
    if (!links.length) return;
    const secs = document.querySelectorAll('.section');
    const sio = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => sio.observe(s));
  }

  /* ================= 全局事件 ================= */
  function bindGlobal() {
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

  /* ================= 启动 ================= */
  function applyTheme() {
    const t = (SITE.settings && SITE.settings.theme) || 'aurora';
    document.documentElement.dataset.theme = ['aurora', 'ocean', 'mist', 'sunset'].includes(t) ? t : 'aurora';
  }

  /**
   * 加载内容。
   * 1) 优先后端 API —— 本地或服务器部署时走这条，后台改动即时生效
   * 2) 拿不到 API 时回退静态快照 content.json —— GitHub Pages 等纯静态托管走这条
   *    静态环境没有 Node 服务，官网照常展示，后台入口会自动隐藏
   */
  async function loadContent() {
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        const data = await res.json();
        if (data && data.settings) return data;
      }
    } catch (e) { /* 无后端，继续走静态回退 */ }

    try {
      const res = await fetch('./content.json');
      if (res.ok) {
        const data = await res.json();
        if (data && data.settings) {
          document.documentElement.classList.add('static-mode');
          console.info('[xy-club] 静态预览模式：内容来自 content.json，后台功能不可用。');
          return data;
        }
      }
    } catch (e) { /* 快照也不存在 */ }

    console.error('加载内容失败：API 与静态快照均不可用');
    return { settings: {}, sections: [] };
  }

  async function init() {
    SITE = await loadContent();
    applyTheme();
    renderNav(); renderHero(); renderTicker(); renderSections(); renderCTA(); renderFooter();
    bindGlobal(); bindReveal(); bindScroll(); bindCountUp(); bindTilt(); bindSpotlight(); bindRipple();
  }
  init();

  // 供 Node 测试复用纯函数（浏览器中 module 未定义，自动跳过）
  if (typeof module !== 'undefined' && module.exports) module.exports = { esc, interp };
})();
