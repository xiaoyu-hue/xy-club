/* XY俱乐部模板 · 渲染层（纯函数，无 DOM）
 *
 * 为什么单独一个文件：
 *   同一份「数据 → HTML」逻辑要同时服务两种运行环境：
 *     ① 浏览器端（js/main.js 首次渲染 / 切换案例）
 *     ② 构建期（scripts/build-static.js 把内容预渲染进 index.html，解决 SEO 与首屏白屏）
 *   逻辑只能有一份真源，否则预渲染出来的 HTML 与浏览器渲染结果会慢慢漂移。
 *
 * 约束：本文件不得访问 window / document / localStorage，
 *       因此既能被 <script> 直接加载（挂到 window.XYRender），也能被 Node require。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.XYRender = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const esc = (str) => String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // 占位符插值：{{custom.键名}} → settings.custom[键名]；键不存在返回空。
  // 调用方需先 interp 再 esc，因此自定义值里的 HTML 会被转义，无 XSS 风险。
  const interp = (text, custom) => {
    const c = custom || {};
    return String(text == null ? '' : text)
      .replace(/\{\{\s*custom\.([\w.-]+)\s*\}\}/g, (m, k) => (k in c ? c[k] : ''));
  };

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

  function heroStatsHTML(raw) {
    const stats = String(raw || '').split(/[,，]/).map((x) => x.trim()).filter(Boolean);
    return stats.map((s) => {
      const p = parseStat(s);
      const dec = (String(p.val).split('.')[1] || '').length;
      return `<div class="stat">
        <b class="gold-text"><span class="count-up" data-val="${p.val}" data-dec="${dec}">0</span>${esc(p.suffix)}</b>
        <span>${esc(p.label)}</span></div>`;
    }).join('');
  }

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

  /* -------- 图形字段：表情 或 图片 --------
   * 后台的「图标/头像」字段支持两种值：
   *   - 表情符号（如 ✨）        → 按文本渲染
   *   - 图片路径（/uploads/x）   → 渲染为 <img>
   * 图片加载失败时回落到 alt 文本，不让页面出现破图。
   * 注意：回落**不能**用内联 onerror —— 本站 CSP 是 script-src 'self'，
   * 内联事件处理器会被浏览器直接拦掉（v1.10.x 的真实 bug）。
   * 这里改成 data-gfx 标记，由 main.js 用一次 capture 阶段的 error 监听统一处理。
   */
  const isGfxImage = (x) => typeof x === 'string' && /^(\/|https?:\/\/|data:image\/)/.test(x.trim());
  function gfx(x, fallback, cls) {
    const val = (x == null || x === '') ? fallback : String(x);
    if (isGfxImage(val)) {
      return `<img class="${cls}" src="${esc(val.trim())}" alt="" loading="lazy" data-gfx="${esc(fallback)}">`;
    }
    return `<span class="${cls}">${esc(val)}</span>`;
  }

  function sectionHTML(s, st) {
    const settings = st || {};
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
            <span class="ic">${gfx(it.icon, '✨', 'ic-gfx')}</span>
            <h3>${esc(it.title)}</h3><p>${esc(it.desc)}</p>
          </div>`).join('')}</div>`;
        break;
      case 'testimonials':
        body = `<div class="review-grid">${items.map((it, i) => `
          <div class="r-card tilt reveal" style="--i:${i}"><span class="quote">”</span>
            <div class="r-stars">${stars(it.rating)}</div>
            <p class="r-text">${esc(it.text)}</p>
            <div class="r-who"><span class="r-avatar">${gfx(it.emoji, '🙂', 'r-avatar-gfx')}</span><b>${esc(it.who)}</b></div>
          </div>`).join('')}</div>`;
        break;
      case 'notice':
        body = `<div class="notice-list">${items.map((it, i) => `
          <div class="n-item reveal" style="--i:${i}"><span class="ni">${gfx(it.icon, '•', 'ni-gfx')}</span><span>${esc(it.text)}</span></div>`).join('')}</div>`;
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
        body = `<div class="text-wrap custom-wrap reveal">${esc(interp(s.content, settings.custom))}</div>`;
        break;
      default: body = '';
    }
    return `<section class="section" id="sec-${esc(s.id)}">${head}${body}</section>`;
  }

  /* -------- 页面级片段 --------
   * 返回 { html, text } 两组：
   *   html 组是可直接 innerHTML 的字符串；
   *   text 组是纯文本，调用方用 textContent（浏览器）或 esc()（预渲染）落地。
   */
  const HERO_BTNS = `<button class="btn btn-primary btn-lg" data-order>🚀 立即下单</button>
       <a class="btn btn-ghost btn-lg" href="#app">📋 查看价目</a>`;

  const ORDER_LINK = `<button type="button" class="link-btn" data-order>📞 联系下单</button>`;

  function navLinksHTML(sections) {
    return (sections || []).filter((s) => s.visible !== false).slice(0, 6)
      .map((s) => `<a href="#sec-${esc(s.id)}">${esc(s.title)}</a>`).join('');
  }

  function ctaHTML(st) {
    const settings = st || {};
    return `
      <h2 class="grad-text">准备好开启陪伴了吗？</h2>
      <p>${esc(settings.slogan || '')} ${esc(settings.qrNote || '')}</p>
      ${settings.wechat ? `<div class="cta-wx">💚 微信号：<b>${esc(settings.wechat)}</b></div>` : ''}
      <div class="cta-btns">
        <button class="btn btn-gold btn-lg" data-order>💌 立即下单</button>
        ${settings.wechat ? `<button class="btn btn-ghost btn-lg" data-copy="${esc(settings.wechat)}">📋 复制微信号</button>` : ''}
      </div>
      ${settings.qrImage ? `<img class="cta-qr" src="${esc(settings.qrImage)}" alt="客服二维码">` : ''}`;
  }

  function footerHTML(st, sections) {
    const settings = st || {};
    const cols = (sections || []).filter((s) => s.visible !== false).slice(0, 5)
      .map((s) => `<a href="#sec-${esc(s.id)}">${esc(s.title)}</a>`).join('');
    return `
      <div class="f-brand">
        <span class="brand-logo">${esc(settings.logoEmoji || '💎')}</span>
        <h3 class="grad-text">${esc(settings.siteName || '')}</h3>
        <p>${esc(settings.footer || '')}</p>
      </div>
      <div class="f-col"><h4>快速导航</h4>${cols}</div>
      <div class="f-col"><h4>联系方式</h4>
        ${settings.wechat ? `<span>微信：${esc(settings.wechat)}</span>` : ''}
        ${settings.qq ? `<span>QQ：${esc(settings.qq)}</span>` : ''}
        ${settings.phone ? `<span>电话：${esc(settings.phone)}</span>` : ''}
        ${settings.email ? `<span>邮箱：${esc(settings.email)}</span>` : ''}
        ${ORDER_LINK}
      </div>`;
  }

  function pageTitle(st) {
    const settings = st || {};
    return `${settings.siteName || '俱乐部'} · ${settings.slogan || '官网'}`;
  }

  function metaDescription(st) {
    const settings = st || {};
    const parts = [settings.siteName, settings.slogan, settings.heroSubtitle]
      .map((x) => String(x || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const joined = parts.join(' · ');
    return joined.length > 150 ? joined.slice(0, 149) + '…' : joined;
  }

  // 社交分享图：优先取内容里第一张真实图片（案例图 / 上传图）。
  function firstImage(data) {
    const found = [];
    const scan = (v) => {
      if (typeof v === 'string') {
        if (/^\.?\/cases\//.test(v) || /^\/uploads\//.test(v)) found.push(v);
        return;
      }
      if (Array.isArray(v)) return v.forEach(scan);
      if (v && typeof v === 'object') return Object.values(v).forEach(scan);
    };
    scan(data && data.sections);
    scan(data && data.settings);
    return found[0] || '';
  }

  function fragments(data) {
    const settings = (data && data.settings) || {};
    const sections = (data && Array.isArray(data.sections)) ? data.sections : [];
    const visible = sections.filter((s) => s.visible !== false);
    return {
      html: {
        navLinks: navLinksHTML(visible),
        mobileMenu: navLinksHTML(visible) + ORDER_LINK,
        heroTitle: twoLines(settings.heroTitle),
        heroBtns: HERO_BTNS,
        heroStats: heroStatsHTML(settings.heroStats),
        sections: visible.map((s) => sectionHTML(s, settings)).join(''),
        cta: ctaHTML(settings),
        footer: footerHTML(settings, visible)
      },
      text: {
        title: pageTitle(settings),
        description: metaDescription(settings),
        brandLogo: settings.logoEmoji || '💎',
        brandName: settings.siteName || '俱乐部',
        heroBadge: settings.heroBadge || '',
        heroSub: settings.heroSubtitle || '',
        tickerText: String(settings.announcement || '').trim(),
        copyright: `© ${new Date().getFullYear()} ${settings.siteName || '俱乐部'} · ${settings.slogan || ''}`
      },
      meta: {
        ogImage: firstImage(data)
      }
    };
  }

  return {
    esc, interp, twoLines, parseStat,
    heroStatsHTML, priceRow, stars, isGfxImage, gfx, sectionHTML,
    navLinksHTML, ctaHTML, footerHTML, pageTitle, metaDescription, firstImage,
    fragments
  };
});
