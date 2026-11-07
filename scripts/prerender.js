/**
 * 首页内容注入（构建期与运行期共用）
 *
 * index.html 只保留骨架与 data-xy / data-xy-html / data-xy-attr / data-xy-href 标记，
 * 真实内容由 public/js/render.js 的纯函数渲染层生成，这里只负责把片段写回 HTML：
 *   - 构建期：scripts/build-static.js 生成静态快照（GitHub Pages 等纯静态托管）
 *   - 运行期：server.js 在响应 GET / 时即时注入，后台改完内容刷新即可被抓取
 *
 * 纯字符串处理，不碰 DOM，也不读磁盘以外的东西（模板由调用方传入）。
 */

const path = require('path');
const R = require('../public/js/render.js');

const META_KEYS = new Set(['title', 'description', 'siteName', 'ogImage']);

/** 社交卡片要绝对地址；没有 SITE_URL 时保留相对路径（本地/演示仍可用）。 */
function makeAbs(siteUrl) {
  const base = String(siteUrl || '').replace(/\/+$/, '');
  return (u) => {
    if (!u) return '';
    if (/^https?:\/\//.test(u)) return u;
    return base ? base + (u.startsWith('/') ? u : '/' + u) : u;
  };
}

/** 内容里没有图片时，用案例自带素材兜底，避免社交卡片空白。 */
function withFallbackImage(frag, imageDir) {
  if (frag.meta.ogImage || !imageDir) return frag;
  try {
    const first = require('fs').readdirSync(imageDir)
      .filter((f) => /\.(webp|jpe?g|png|gif)$/i.test(f))
      .sort()[0];
    if (first) frag.meta.ogImage = 'cases/images/' + first;
  } catch {
    // 没有案例素材目录就保持为空
  }
  return frag;
}

/**
 * 按标签开合深度，替换所有带 data-xy-html 的容器内部 HTML。
 *
 * 为什么不能简单用正则「匹配到第一个 </tag>」：
 *   容器与子节点往往同名（都是 div），例如
 *     <div id="heroStats"   data-xy-html="heroStats">  里套 <div class="stat">
 *     <div id="ctaCard"     data-xy-html="cta">        里套 <div class="cta-btns">
 *     <div id="footerInner" data-xy-html="footer">     里套 <div class="f-col">
 *   旧实现用非贪婪正则 `[\s\S]*?<\/tag>` 会在第一个内层 </div> 处停下，于是只替换了
 *   第一个子节点，把剩下的兄弟节点（含历史遗留的重复内容）原样保留 —— 这正是线上整页
 *   重复渲染的根因。这里手动数开合深度，定位真正闭合当前容器的结束标签再整体替换内部。
 *
 * @param {string} html 模板 HTML
 * @param {Record<string,string|null|undefined>} map key -> 要注入的内部 HTML；值为 null/undefined 时保留原内容
 * @returns {string}
 */
function replaceHtmlContainers(html, map) {
  // 先收集所有 data-xy-html 的 key（一次扫描，避免重复构造正则）
  const keys = [];
  const keyRe = /data-xy-html="([\w-]+)"/g;
  let km;
  while ((km = keyRe.exec(html))) keys.push(km[1]);

  let result = html;
  for (const key of keys) {
    const replacement = map[key];
    if (replacement == null) continue;

    // 定位起始标签：<tag ... data-xy-html="key" ...>
    const openRe = new RegExp(
      '<([a-zA-Z0-9]+)((?:[^\>"\']|\"[^\"]*\"|\'[^\']*\')*?\\sdata-xy-html="' + key + '"(?:[^\>"\']|\"[^\"]*\"|\'[^\']*\')*)>',
      'i'
    );
    const m = openRe.exec(result);
    if (!m) continue;
    const tag = m[1];
    const innerStart = m.index + m[0].length;
    const openTag = new RegExp('<' + tag + '(?:\\s[^>]*?)?>', 'gi');
    const closeTag = new RegExp('</' + tag + '>', 'gi');
    const closeLen = tag.length + 3; // </tag>

    // 从 innerStart 起数开合深度，找到 depth 归零处 = 真正闭合当前容器的 </tag>
    let i = innerStart;
    let depth = 1;
    let closeIdx = -1;
    while (i < result.length) {
      openTag.lastIndex = i;
      closeTag.lastIndex = i;
      const o = openTag.exec(result);
      const c = closeTag.exec(result);
      const oi = o ? o.index : Infinity;
      const ci = c ? c.index : Infinity;
      if (ci <= oi) {
        // 先遇到闭合标签
        depth--;
        if (depth === 0) { closeIdx = ci; break; }
        i = ci + closeLen;
      } else if (oi < Infinity) {
        // 先遇到同名开标签（嵌套）
        depth++;
        i = oi + o[0].length;
      } else {
        break; // 结构不配对，放弃该容器
      }
    }
    if (closeIdx < 0) continue;

    const before = result.slice(0, innerStart);
    const after = result.slice(closeIdx); // 含 </tag>
    result = before + replacement + after;
  }
  return result;
}

/**
 * 把 db 渲染进 index.html 模板。
 * @param {string} html 模板 HTML（含 data-xy* 标记）
 * @param {object} db 完整数据库对象（含 settings / sections）
 * @param {{siteUrl?: string, imageDir?: string}} [opts]
 * @returns {string}
 */
function inject(html, db, opts) {
  const { siteUrl = '' } = opts || {};
  // 案例素材目录由本模块自己解析：服务端不需要（也不应该）认识静态案例目录。
  const imageDir = (opts && opts.imageDir) || path.join(__dirname, '..', 'public', 'cases', 'images');
  const frag = withFallbackImage(R.fragments(db), imageDir);
  const abs = makeAbs(siteUrl);
  let out = html;

  // 纯文本节点：<tag ... data-xy="key">旧值</tag>
  out = out.replace(/<([a-z0-9]+)([^>]*?)\sdata-xy="(\w+)"([^>]*)>[\s\S]*?<\/\1>/gi,
    (m, tag, pre, key, post) => {
      const v = frag.text[key];
      if (v == null) return m;
      return `<${tag}${pre} data-xy="${key}"${post}>${R.esc(v)}</${tag}>`;
    });

  // HTML 片段节点：<tag ... data-xy-html="key">...</tag>
  // 用按深度配对的 replaceHtmlContainers 替换，避免容器内部嵌套同名标签时
  // 只替换到第一个子节点、把重复内容遗留下来（详见该函数注释）。
  out = replaceHtmlContainers(out, frag.html);

  // meta 属性：<meta ... data-xy-attr="key" ...> 的 content 换成真实值
  const attrValue = (key) => {
    if (key === 'siteName') return frag.text.brandName;
    if (key === 'ogImage') return abs(frag.meta.ogImage);
    return frag.text[key] || frag.text.description || '';
  };
  out = out.replace(/<meta\b([^>]*?)\sdata-xy-attr="(\w+)"([^>]*?)>/gi, (m, pre, key, post) => {
    if (!META_KEYS.has(key)) return m;
    const v = R.esc(attrValue(key));
    const rest = (pre + post).replace(/\s*content="[^"]*"/i, '');
    return `<meta${rest} data-xy-attr="${key}" content="${v}">`;
  });

  // 链接类属性：<link ... data-xy-href="canonical" href="...">
  out = out.replace(/<link\b([^>]*?)\sdata-xy-href="(\w+)"([^>]*?)>/gi, (m, pre, key, post) => {
    if (key !== 'canonical') return m;
    const rest = (pre + post).replace(/\s*href="[^"]*"/i, '');
    return `<link${rest} data-xy-href="${key}" href="${R.esc(abs('/'))}">`;
  });

  return out;
}

module.exports = { inject, withFallbackImage, makeAbs };
