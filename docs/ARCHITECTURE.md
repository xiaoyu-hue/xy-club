# 架构说明

## 一句话

一个 Express 进程，既托管静态文件，又提供 REST API；所有内容存在单个 JSON 文件里；前端拿数据渲染，没有任何构建步骤。

## 数据流转

```
                  ┌──────────────── 浏览器 ────────────────┐
                  │                                        │
 官网 index.html ─┤  main.js                               │
                  │   └─ fetch /api/content ──────────┐    │
                  │      （失败则回退 ./content.json） │    │
                  │                                    │    │
 后台 admin.html ─┤  admin.js                          │    │
                  │   └─ fetch /api/login → token ─┐   │    │
                  └────────────────────────────────┼───┼────┘
                                                   │   │
                  ┌────────── Node 进程 ───────────┼───┼────┐
                  │  server.js                     ▼   ▼    │
                  │   ├─ 静态托管 public/                   │
                  │   ├─ GET  /api/content  ────────────────┼──▶ 读 data/db.json
                  │   ├─ PUT  /api/content（需鉴权）────────┼──▶ 写 data/db.json
                  │   ├─ POST /api/upload（需鉴权）─────────┼──▶ 写 public/uploads/
                  │   └─ 会话 Map（内存，7 天过期）          │
                  │                                          │
                  │  data/db.json  ← 首次启动由 defaults.js 生成
                  └──────────────────────────────────────────┘
```

**关键点**：官网与后台共用同一份 `data/db.json`。后台改什么，前台刷新即是什么——没有缓存层，也没有重新构建。

## 存储

| 文件 | 作用 | 是否入库 |
|------|------|----------|
| `data/db.json` | 全部内容与设置（**含明文管理密码**） | ❌ 已 gitignore |
| `public/uploads/` | 后台上传的图片 | ❌ 已 gitignore（保留 `.gitkeep`） |
| `public/content.json` | 静态快照，由 `scripts/build-static.js` 生成 | ❌ 构建产物 |
| `data/db.json.corrupt-*` | 配置文件解析失败时自动留存的现场 | ❌ 已 gitignore |

`db.json` 的形状就是 `defaults.js` 里 `DEFAULT_DB` 的形状：

```json
{
  "settings": { "siteName": "...", "theme": "aurora", "adminPassword": "..." },
  "sections": [ { "id": "s-game", "type": "services", "items": [] } ]
}
```

## 鉴权

1. 后台提交密码 → `POST /api/login`
2. 服务端用 **scrypt** 校验（Node 内置 `crypto`，无新增依赖），通过后生成随机 token 存进内存 Map（7 天过期）
3. 浏览器把 token 存进 `localStorage`
4. 后续写操作带 token，服务端比对

**密码存储**：`settings.adminPassword` 形如 `scrypt$<salt>$<key>`。
旧版本遗留的明文密码会在**服务启动时自动升级**为哈希；登录命中明文时也会顺手升级。
忘记密码请用 `node scripts/reset-password.js 新密码`，不能直接手改明文。

**限流**：同一 IP 连续 5 次密码错误后锁定 5 分钟（HTTP 429）。计数存在内存，重启即清空。

**已知局限**：无 CSRF 防护；单密码单管理员；会话存内存（重启即登出）。详见 README 的「已知局限」。

## 主题机制

主题不是多套 CSS，而是**同一套 CSS + 4 组变量**：

```css
html[data-theme="aurora"] { --bg-a: ...; --ink: ...; --glass-1: ...; --accent: ...; }
html[data-theme="ocean"]  { ... }
html[data-theme="mist"]   { ... }   /* 浅色 */
html[data-theme="sunset"] { ... }
```

切换主题只改 `<html data-theme>` 一个属性。所有组件都引用变量，不硬编码颜色——**这是新增组件时必须遵守的约定**，否则换主题就会破版。

## 微交互

都在 `main.js` 里，按 `bind*` 命名，在 `init()` 中统一注册：

| 函数 | 作用 | 降级 |
|------|------|------|
| `bindSpotlight` | 光标高光追踪（更新 `--mx` / `--my`） | 仅鼠标设备 |
| `bindTilt` | 卡片 3D 倾斜 | 仅鼠标设备 |
| `bindRipple` | 按钮点击涟漪 | — |
| `bindCountUp` | 首屏数字滚动 | 尊重 `prefers-reduced-motion` |
| `bindScroll` | 进度条 + 返回顶部 + 导航高亮 | — |
| `bindReveal` | 错落渐显 + 背景视差 | 尊重 `prefers-reduced-motion` |

## 静态回退（纯静态托管用）

GitHub Pages 之类的环境没有 Node 进程，`/api/content` 会 404。此时前端：

1. `fetch('/api/content')` 失败或返回非 JSON
2. 回退 `fetch('./content.json')` 读取快照
3. 给 `<html>` 加上 `static-mode` 类，CSS 自动隐藏后台入口

生成快照：

```bash
node scripts/build-static.js    # 写出 public/content.json（已剔除密码字段）
```

> 静态模式下官网完整可用，**后台不可用**（没有服务端可写）。

## 图片的导出与导入

配置导出时会把 `/uploads/*` **内联成 data URI**，让 JSON 自包含；导入保存时服务端再把 data URI 还原成
`uploads/` 下的真实文件。这样把配置搬到另一个站点不会出现裂图，同时 `db.json` 里也不会堆积 base64。

```
导出（前端 admin.js）        保存（服务端 PUT /api/content）
  /uploads/a.png     ──▶      data:image/png;base64,...     ──▶   /uploads/<new>.png
```

上传格式白名单为 jpg / png / webp / gif。**不支持 SVG** —— 它能内嵌脚本，直接访问会被浏览器当文档渲染。

## 约束

- 零前端框架、零构建步骤
- 唯一运行时依赖：`express`（密码哈希用 Node 内置 `crypto`，不引入 bcrypt 之类）
- 单进程：**不要多副本部署**，JSON 全量读写会冲突
- `data/` 与 `public/uploads/` 必须落在持久卷上
