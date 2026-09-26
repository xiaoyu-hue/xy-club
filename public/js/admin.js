/* XY俱乐部 · 后台管理逻辑 */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const esc = (str) => String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // C1：鉴权 token 键统一为 xy_token
  let token = localStorage.getItem('xy_token') || '';
  let D = null;            // 工作副本 { settings, sections }
  let dirty = false;       // 是否有未保存修改
  let expandedId = null;   // 当前展开编辑的板块
  let newSecType = 'services';

  /* ================= 板块类型定义 ================= */
  const TYPES = {
    services:     { label: '💰 价目/列表', desc: '带价格的条目，适合服务报价', itemLabel: '项目' },
    cards:        { label: '🃏 卡片网格',   desc: '图标+标题+描述，适合优势/活动/团队', itemLabel: '卡片' },
    testimonials: { label: '💖 客户评价',   desc: '星级+头像+评语', itemLabel: '评价' },
    faq:          { label: '❓ 常见问答',   desc: '点击展开的 Q&A', itemLabel: '问答' },
    notice:       { label: '📌 须知列表',   desc: '图标+一句话规则', itemLabel: '条目' },
    gallery:      { label: '🖼 图片集',     desc: '图片墙，可上传图片', itemLabel: '图片' },
    text:         { label: '📝 图文段落',   desc: '大段文字介绍，自动换行', itemLabel: '' }
  };

  function blankItem(type) {
    switch (type) {
      case 'services':     return { name: '新项目', price: '0', unit: '元/小时', desc: '' };
      case 'cards':        return { icon: '✨', title: '新卡片', desc: '' };
      case 'testimonials': return { emoji: '🌙', who: '匿名客户', rating: 5, text: '' };
      case 'faq':          return { q: '新问题？', a: '' };
      case 'notice':       return { icon: '⭐', text: '' };
      case 'gallery':      return { url: '', caption: '' };
      default:             return {};
    }
  }

  /* ================= API ================= */
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', 'x-token': token, ...(opts.headers || {}) }
    });
    if (res.status === 401) { showLogin(); throw new Error('未登录'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  }

  function toast(msg, isErr) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.toggle('err', !!isErr);
    t.classList.add('show');
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ================= 登录 ================= */
  function showLogin() {
    $('#adminView').hidden = true;
    $('#loginView').style.display = 'flex';
  }
  function showApp() {
    $('#loginView').style.display = 'none';
    $('#adminView').hidden = false;
    switchTab('settings');
  }

  async function doLogin() {
    const pwd = $('#pwdInput').value.trim();
    if (!pwd) return;
    try {
      const r = await fetch('/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || '登录失败');
      token = data.token;
      localStorage.setItem('xy_token', token);
      await loadContent();
      showApp();
      toast('欢迎回来 👋');
    } catch (e) {
      $('#loginErr').textContent = e.message;
      const card = $('.login-card');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
    }
  }

  async function loadContent() {
    D = await api('/api/content');
    dirty = false;
    updateSaveState();
    renderSettings();
    renderSecList();
    renderTheme();
    document.documentElement.dataset.theme = D.settings.theme || 'aurora';
  }

  /* ================= 修改状态 ================= */
  function markDirty() {
    if (!dirty) { dirty = true; updateSaveState(); }
  }
  function updateSaveState() {
    const el = $('#saveState');
    el.textContent = dirty ? '● 有未保存的修改' : '';
    el.classList.toggle('saved', false);
    $('#saveBtn').disabled = !dirty;
  }

  /* ================= Tab 切换 ================= */
  function switchTab(name) {
    $$('.side-item').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    $$('.tab-panel').forEach(p => p.hidden = p.id !== 'tab-' + name);
  }
  $('#sideNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.side-item');
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });

  /* ================= 设置页 ================= */
  function renderSettings() {
    $$('#tab-settings [data-bind^="set:"]').forEach(inp => {
      const f = inp.dataset.bind.split(':')[1];
      inp.value = D.settings[f] || '';
    });
    renderQrPreview();
  }
  function renderQrPreview() {
    const img = $('#qrPreview');
    if (D.settings.qrImage) { img.src = D.settings.qrImage; img.hidden = false; $('#qrClearBtn').hidden = false; }
    else { img.hidden = true; img.removeAttribute('src'); $('#qrClearBtn').hidden = true; }
  }

  // 双向绑定：所有 data-bind 输入
  document.body.addEventListener('input', (e) => {
    const el = e.target;
    const bind = el.dataset && el.dataset.bind;
    if (!bind) return;
    const [kind, id, f3, f4] = bind.split(':');
    if (kind === 'set') {
      D.settings[id] = el.value;
    } else if (kind === 'sec') {
      const s = D.sections.find(x => x.id === id);
      if (s) s[f3] = el.value;
    } else if (kind === 'item') {
      const s = D.sections.find(x => x.id === id);
      if (s && s.items && s.items[+f3]) s.items[+f3][f4] = el.value;
    }
    markDirty();
  });
  document.body.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.bind === 'sec-vis') {
      const s = D.sections.find(x => x.id === el.dataset.id);
      if (s) { s.visible = el.checked; markDirty(); }
    }
  });

  /* ================= 图片上传 ================= */
  function uploadImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) return reject(new Error('请选择图片文件'));
      if (file.size > 8 * 1024 * 1024) return reject(new Error('图片不能超过 8MB'));
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const r = await api('/api/upload', { method: 'POST', body: JSON.stringify({ name: file.name, data: reader.result }) });
          resolve(r.url);
        } catch (e) { reject(e); }
      };
      reader.onerror = () => reject(new Error('读取图片失败'));
      reader.readAsDataURL(file);
    });
  }

  $('#qrUploadBtn').addEventListener('click', () => pickFile(async (file) => {
    toast('上传中…');
    try { D.settings.qrImage = await uploadImage(file); renderQrPreview(); markDirty(); toast('✅ 二维码已上传，记得保存'); }
    catch (e) { toast(e.message, true); }
  }));
  $('#qrClearBtn').addEventListener('click', () => {
    D.settings.qrImage = ''; renderQrPreview(); markDirty();
  });

  function pickFile(cb) {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = () => { if (inp.files[0]) cb(inp.files[0]); };
    inp.click();
  }

  /* ================= 板块列表 ================= */
  const secById = (id) => D.sections.find(s => s.id === id);

  function typeBadge(s) {
    const t = TYPES[s.type];
    const n = s.type === 'text' ? '' : ` · ${(s.items || []).length} 个${t.itemLabel || ''}`;
    const off = s.visible === false ? ' off' : '';
    const offTxt = s.visible === false ? ' · 已隐藏' : '';
    return `<span class="badge${off}">${t ? t.label : s.type}${n}${offTxt}</span>`;
  }

  function renderSecList() {
    const box = $('#secList');
    // U1：重渲染前记录焦点元素与滚动位置，重渲染后还原，避免连续编辑时焦点/滚动跳失
    const active = document.activeElement;
    const focusKey = (active && active.dataset && active.dataset.bind)
      ? active.dataset.bind
      : (active && active.id ? active.id : null);
    const scrollTop = box ? box.scrollTop : 0;

    if (!D.sections.length) {
      box.innerHTML = `<div class="panel-card glass" style="text-align:center;color:var(--faint)">还没有任何板块，点击上方「＋ 添加新板块」创建吧</div>`;
      return;
    }
    box.innerHTML = D.sections.map((s, i) => `
      <div class="sec-card glass" data-id="${esc(s.id)}">
        <div class="sec-row">
          <span class="sec-ico">${esc(s.icon || '✦')}</span>
          <div class="sec-meta">
            <b>${esc(s.title || '未命名板块')}</b>${typeBadge(s)}
            ${s.subtitle ? `<small>${esc(s.subtitle)}</small>` : ''}
          </div>
          <div class="sec-ops">
            <label class="switch" title="显示/隐藏">
              <input type="checkbox" data-bind="sec-vis" data-id="${esc(s.id)}" ${s.visible !== false ? 'checked' : ''}><i></i>
            </label>
            <button class="op-btn" data-act="up" data-i="${i}" title="上移" aria-label="上移板块" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="op-btn" data-act="down" data-i="${i}" title="下移" aria-label="下移板块" ${i === D.sections.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="op-btn wide" data-act="edit" data-id="${esc(s.id)}" aria-label="编辑板块">${expandedId === s.id ? '收起' : '编辑'}</button>
            <button class="op-btn wide del" data-act="del" data-id="${esc(s.id)}" aria-label="删除板块">删除</button>
          </div>
        </div>
        ${expandedId === s.id ? secEditorHTML(s) : ''}
      </div>`).join('');

    // 还原焦点（仅对有稳定 data-bind 的输入框有效；操作按钮无稳定标识，跳过）
    if (focusKey && (focusKey.startsWith('set:') || focusKey.startsWith('sec:') || focusKey.startsWith('item:'))) {
      const el = document.querySelector(`[data-bind="${focusKey}"]`);
      if (el && typeof el.focus === 'function') el.focus();
    }
    if (box) box.scrollTop = scrollTop;
  }

  /* -------- 单个板块编辑器 -------- */
  function itemRowHTML(s, it, i) {
    const b = (f) => `data-bind="item:${esc(s.id)}:${i}:${f}"`;
    const v = (x) => esc(x == null ? '' : x);
    const ops = `<div class="item-ops">
        <button class="op-btn" data-iact="iup" data-i="${i}" title="上移" aria-label="上移条目">↑</button>
        <button class="op-btn" data-iact="idown" data-i="${i}" title="下移" aria-label="下移条目">↓</button>
        <button class="op-btn del" data-iact="idel" data-i="${i}" title="删除" aria-label="删除条目">✕</button>
      </div>`;
    const input = (f, ph) => `<input ${b(f)} value="${v(it[f])}" placeholder="${ph}">`;

    switch (s.type) {
      case 'services':
        return `<div class="item-row">
          ${input('name', '项目名称')}${input('price', '价格 如 19.9-29.9')}${input('unit', '单位 如 元/小时')}${input('desc', '一句说明（可选）')}
          ${ops}</div>`;
      case 'cards':
        return `<div class="item-row v4">
          ${input('icon', '图标')}${input('title', '标题')}${input('desc', '描述')}
          ${ops}</div>`;
      case 'testimonials':
        return `<div class="item-row">
          ${input('emoji', '头像')}${input('who', '客户昵称')}<input ${b('rating')} type="number" min="1" max="5" value="${v(it.rating || 5)}" title="星级">
          ${input('text', '评价内容')}${ops}</div>`;
      case 'notice':
        return `<div class="item-row v2">
          ${input('icon', '图标')}${input('text', '须知内容')}
          ${ops}</div>`;
      case 'faq':
        return `<div class="item-row v3">
          ${input('q', '问题')}${input('a', '答案')}
          ${ops}</div>`;
      case 'gallery':
        return `<div class="item-row v4">
          <input ${b('url')} value="${v(it.url)}" placeholder="图片链接，或点右侧上传">
          <button class="op-btn wide" data-iact="iupload" data-i="${i}" style="width:100%">📤 上传图片</button>
          ${input('caption', '图片说明（可选）')}
          ${ops}</div>`;
      default: return '';
    }
  }

  function secEditorHTML(s) {
    const b = (f) => `data-bind="sec:${esc(s.id)}:${f}"`;
    const v = (x) => esc(x == null ? '' : x);
    let head = `
      <div class="form-grid">
        <label class="form-item"><span>图标表情</span><input ${b('icon')} value="${v(s.icon)}" maxlength="4"></label>
        <label class="form-item"><span>板块标题</span><input ${b('title')} value="${v(s.title)}"></label>
        <label class="form-item form-full"><span>副标题（可选）</span><input ${b('subtitle')} value="${v(s.subtitle)}"></label>
      </div>`;
    let itemsPart = '';
    if (s.type === 'text') {
      itemsPart = `<div class="items-count">正文内容（自动换行）</div>
        <textarea rows="8" data-bind="sec:${esc(s.id)}:content" style="width:100%;padding:12px 15px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.05);color:var(--ink);font-size:14px;outline:none;line-height:1.8">${v(s.content)}</textarea>`;
    } else {
      const t = TYPES[s.type];
      itemsPart = `<div class="items-count">${t.itemLabel}列表（共 ${(s.items || []).length} 个）</div>
        <div class="items-box">${(s.items || []).map((it, i) => itemRowHTML(s, it, i)).join('')}</div>
        <button class="btn btn-ghost btn-sm add-item-btn" data-act="addItem" data-id="${esc(s.id)}">＋ 添加${t.itemLabel}</button>`;
      if (s.type === 'services') {
        itemsPart += `<label class="form-item sec-tip-input"><span>列表底部提示语（可选，如：只挨骂不还嘴…）</span>
          <input ${b('tip')} value="${v(s.tip)}"></label>`;
      }
    }
    return `<div class="sec-editor">${head}${itemsPart}</div>`;
  }

  /* -------- 板块操作 -------- */
  $('#secList').addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act, iact = btn.dataset.iact;
    if (act) {
      const card = btn.closest('.sec-card');
      const id = btn.dataset.id || (card && card.dataset.id);
      if (act === 'edit') {
        expandedId = expandedId === id ? null : id;
        renderSecList();
      } else if (act === 'del') {
        const s = secById(id);
        if (confirm(`确定删除板块「${s.title}」吗？保存后生效。`)) {
          D.sections = D.sections.filter(x => x.id !== id);
          if (expandedId === id) expandedId = null;
          markDirty(); renderSecList();
        }
      } else if (act === 'up' || act === 'down') {
        const i = +btn.dataset.i, j = act === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= D.sections.length) return;
        [D.sections[i], D.sections[j]] = [D.sections[j], D.sections[i]];
        markDirty(); renderSecList();
      } else if (act === 'addItem') {
        const s = secById(id);
        s.items = s.items || [];
        s.items.push(blankItem(s.type));
        markDirty(); renderSecList();
        const box = $(`.sec-card[data-id="${id}"] .items-box`);
        if (box && box.lastElementChild) box.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      return;
    }
    if (iact) {
      const card = btn.closest('.sec-card');
      const s = secById(card.dataset.id);
      const i = +btn.dataset.i;
      if (iact === 'iup' || iact === 'idown') {
        const j = iact === 'iup' ? i - 1 : i + 1;
        if (j < 0 || j >= s.items.length) return;
        [s.items[i], s.items[j]] = [s.items[j], s.items[i]];
        markDirty(); renderSecList();
      } else if (iact === 'idel') {
        if (confirm('确定删除这一条吗？')) { s.items.splice(i, 1); markDirty(); renderSecList(); }
      } else if (iact === 'iupload') {
        pickFile(async (file) => {
          toast('上传中…');
          try {
            s.items[i].url = await uploadImage(file);
            markDirty(); renderSecList();
            toast('✅ 图片已上传，记得保存');
          } catch (err) { toast(err.message, true); }
        });
      }
    }
  });

  /* ================= 添加板块弹窗 ================= */
  $('#addSecBtn').addEventListener('click', () => {
    newSecType = 'services';
    renderTypeGrid();
    $('#newSecTitle').value = '';
    $('#newSecIcon').value = '';
    $('#newSecSub').value = '';
    $('#addModal').hidden = false;
    $('#newSecTitle').focus(); // U3：弹窗打开时把焦点移到首个输入框
  });
  $('#typeGrid').addEventListener('click', (e) => {
    const opt = e.target.closest('.type-opt');
    if (!opt) return;
    newSecType = opt.dataset.type;
    renderTypeGrid();
  });
  function renderTypeGrid() {
    $('#typeGrid').innerHTML = Object.entries(TYPES).map(([k, t]) =>
      `<button type="button" class="type-opt ${k === newSecType ? 'sel' : ''}" data-type="${k}"><b>${t.label}</b>${t.desc}</button>`).join('');
  }
  $('#createSecBtn').addEventListener('click', () => {
    const title = $('#newSecTitle').value.trim() || '新板块';
    const icon = $('#newSecIcon').value.trim() || '✦';
    const sub = $('#newSecSub').value.trim();
    const id = 'sec-' + Date.now().toString(36);
    const sec = { id, type: newSecType, icon, title, subtitle: sub, visible: true };
    if (newSecType === 'text') sec.content = '';
    else sec.items = [blankItem(newSecType)];
    D.sections.push(sec);
    expandedId = id;
    markDirty(); renderSecList();
    $('#addModal').hidden = true;
    toast('板块已创建，编辑后记得保存');
    const card = $(`.sec-card[data-id="${id}"]`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ================= 保存 ================= */
  $('#saveBtn').addEventListener('click', async () => {
    try {
      $('#saveBtn').disabled = true;
      await api('/api/content', { method: 'PUT', body: JSON.stringify({ settings: D.settings, sections: D.sections }) });
      dirty = false;
      updateSaveState();
      $('#saveState').textContent = '✓ 已保存并同步到官网';
      $('#saveState').classList.add('saved');
      toast('✅ 已保存，官网即刻生效');
    } catch (e) {
      $('#saveBtn').disabled = false;
      toast('保存失败：' + e.message, true);
    }
  });
  addEventListener('beforeunload', (e) => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ================= 修改密码 / 退出 ================= */
  $('#changePwdBtn').addEventListener('click', async () => {
    const oldPwd = $('#oldPwd').value, n1 = $('#newPwd').value, n2 = $('#newPwd2').value;
    if (!oldPwd || !n1) return toast('请填写完整', true);
    if (n1 !== n2) return toast('两次输入的新密码不一致', true);
    try {
      await api('/api/password', { method: 'POST', body: JSON.stringify({ oldPassword: oldPwd, newPassword: n1 }) });
      $('#oldPwd').value = $('#newPwd').value = $('#newPwd2').value = '';
      toast('✅ 密码修改成功');
    } catch (e) { toast(e.message, true); }
  });
  $('#logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('xy_token');
    location.reload();
  });

  /* ================= 弹窗关闭 ================= */
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) {
      $('#addModal').hidden = true;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $('#addModal').hidden = true;
  });

  /* ================= 登录事件 ================= */
  $('#loginBtn').addEventListener('click', doLogin);
  $('#pwdInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

  /* ================= 主题选择 ================= */
  function renderTheme() {
    const cur = D.settings.theme || 'aurora';
    $$('.theme-opt').forEach(b => b.classList.toggle('sel', b.dataset.theme === cur));
  }
  $('#themePicker').addEventListener('click', (e) => {
    const b = e.target.closest('.theme-opt');
    if (!b) return;
    D.settings.theme = b.dataset.theme;
    document.documentElement.dataset.theme = b.dataset.theme;
    renderTheme();
    markDirty();
  });

  /* ================= 模板导出 / 导入 / 恢复默认 ================= */
  /**
   * 把 /uploads/xxx 内联成 data URI，让导出的配置「自包含」——
   * 直接导入到另一个站点时图片不会变成裂图。
   */
  async function inlineImages(sections, settings) {
    const urls = new Set();
    const scan = (v) => {
      if (typeof v === 'string') { if (v.startsWith('/uploads/')) urls.add(v); return; }
      if (Array.isArray(v)) return v.forEach(scan);
      if (v && typeof v === 'object') return Object.values(v).forEach(scan);
    };
    scan(sections);
    scan(settings);
    if (!urls.size) return { sections, settings, count: 0 };

    const map = new Map();
    await Promise.all([...urls].map(async (u) => {
      try {
        const r = await fetch(u);
        if (!r.ok) return;
        const blob = await r.blob();
        const dataUri = await new Promise((resolve) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result);
          fr.onerror = () => resolve(null);
          fr.readAsDataURL(blob);
        });
        if (dataUri) map.set(u, dataUri);
      } catch (e) { /* 单张失败不影响整体导出 */ }
    }));

    const replace = (v) => {
      if (typeof v === 'string') return map.get(v) || v;
      if (Array.isArray(v)) return v.map(replace);
      if (v && typeof v === 'object') {
        const o = {};
        for (const k of Object.keys(v)) o[k] = replace(v[k]);
        return o;
      }
      return v;
    };
    return { sections: replace(sections), settings: replace(settings), count: map.size };
  }

  $('#exportBtn').addEventListener('click', async () => {
    try {
      const { sections, settings, count } = await inlineImages(D.sections, D.settings);
      const payload = { settings, sections, _exportedAt: new Date().toISOString() };
      if (count) payload._note = `已内联 ${count} 张图片，可直接导入到另一个站点`;
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `俱乐部官网配置-${(D.settings.siteName || 'site').replace(/\s+/g, '')}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      toast(count ? `✅ 配置已导出（含 ${count} 张图片）` : '✅ 配置已导出');
    } catch (e) { toast('导出失败', true); }
  });

  $('#importBtn').addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = async () => {
      const f = inp.files[0];
      if (!f) return;
      try {
        const text = await f.text();
        const obj = JSON.parse(text);
        if (!obj.settings || !Array.isArray(obj.sections)) throw new Error('格式不符：需要 settings + sections');
        D.settings = { ...D.settings, ...obj.settings };
        D.sections = obj.sections;
        renderSettings(); renderSecList(); renderTheme(); markDirty();
        toast('✅ 配置已载入，请点「保存修改」生效');
      } catch (e) { toast('导入失败：' + e.message, true); }
    };
    inp.click();
  });

  $('#resetBtn').addEventListener('click', async () => {
    const pwd = $('#resetPwd') ? $('#resetPwd').value.trim() : '';
    if (!pwd) { toast('请先输入当前管理密码', true); if ($('#resetPwd')) $('#resetPwd').focus(); return; }
    if (!confirm('确定把整个官网内容恢复为模板默认吗？当前所有修改将丢失（可在恢复前先导出备份）。此操作需输入管理密码确认。')) return;
    try {
      const r = await api('/api/reset', { method: 'POST', body: JSON.stringify({ currentPassword: pwd }) });
      D.settings = r.settings; D.sections = r.sections;
      dirty = false; updateSaveState();
      renderSettings(); renderSecList(); renderTheme();
      if ($('#resetPwd')) $('#resetPwd').value = '';
      toast('♻️ 已恢复为模板默认内容');
    } catch (e) { toast('恢复失败：' + e.message, true); }
  });

  /* ================= 启动 ================= */
  (async function boot() {
    if (!token) return showLogin();
    try {
      await api('/api/check');
      await loadContent();
      showApp();
    } catch (e) { /* showLogin 已在 401 时触发 */ }
  })();

  /* ================= 测试导出（T3） =================
   * 仅当运行环境支持 CommonJS module 时导出纯函数（Node 单测用）。
   * 浏览器中 module 未定义，跳过导出，不影响线上行为。
   */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { esc, TYPES };
  }
})();
