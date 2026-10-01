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

**关键点**：官网与后台共用同一份 `data/db.json`。后台改什么，前台刷新即是什么——服务端有一层**进程内读缓存**（`readDB` 按文件 `mtime` 判断是否需要重读，写操作后失效），没有整站构建步骤。

## 存储

| 文件 | 作用 | 是否入库 |
|------|------|----------|
| `data/db.json` | 全部内容与设置（管理密码以 `scrypt$...` 哈希存储，**非明文**） | ❌ 已 gitignore |
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

**CSRF 防护**：写操作（POST/PUT）在鉴权之后追加 CSRF 校验——前端登录后调 `GET /api/csrf-token` 拿 token，之后每次写请求带 `x-csrf-token` 头；token 与 session 绑定、随 session 过期，校验失败返回 HTTP 403。登录、`/api/csrf-token`、`/api/health` 三个只读/启动路径豁免。

**HTTP 安全头**：全局响应中间件统一追加 `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy` 与 `Content-Security-Policy`（脚本/样式/图片白名单），并移除 `X-Powered-By`。

**输入验证**：`PUT /api/content` 的请求体先经 `deepClone` 深拷贝（剔除 `__proto__` / `constructor` / `prototype` 危险键，防原型链污染），再过两层白名单——`ALLOWED_SETTINGS_KEYS`（settings 字段）与 `ALLOWED_SECTION_TYPES`（8 种板块类型，须与前端 `admin.js` 的 `TYPES` 保持一致），非法输入返回 400。

**已知局限**：单密码单管理员；会话存内存（重启即登出）。详见 README 的「已知局限」。

## 主题机制

主题不是多套 CSS，而是**同一套 CSS + 8 组变量**（与 xy-intro-card 同步）：

```css
/* 暗色主题（3套） */
html[data-theme="aurora"]   { --bg-a: ...; --ink: ...; --accent: #8b7cf6; }
html[data-theme="ocean"]    { --bg-a: ...; --ink: ...; --accent: #38bdf8; }
html[data-theme="sunset"]   { --bg-a: ...; --ink: ...; --accent: #fb7185; }

/* 亮色商务主题（5套） */
html[data-theme="mist"]     { --bg-a: #eef1fb; --ink: #141a2e; --accent: #6d5df0; }
html[data-theme="neutral_morning"] { --bg-a: #f7f4f0; --ink: #1e2935; --accent: #5a6b7c; }
html[data-theme="neutral_cloud"]   { --bg-a: #f1f5f9; --ink: #0f172a; --accent: #4a5568; }
html[data-theme="neutral_oat"]     { --bg-a: #faf8f5; --ink: #2c2418; --accent: #6b5b4e; }
html[data-theme="neutral_navy"]    { --bg-a: #ffffff; --ink: #0f172a; --accent: #2c5282; }
```

| 类别 | 主题 | 适用场景 |
|------|------|----------|
| 暗色 | aurora 极光紫 | 俱乐部经典 |
| | ocean 深海蓝 | 俱乐部科技风 |
| | sunset 落日金 | 俱乐部暖调 |
| 亮色 | mist 晨雾白 | 俱乐部留白 |
| | neutral_morning 米白·晨雾 | 通用商务 |
| | neutral_cloud 浅灰·云影 | 科技咨询 |
| | neutral_oat 燕麦·暖调 | 文化餐饮 |
| | neutral_navy 藏蓝·经典 | 金融法律 |

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

## 多案例（v1.8.0 / ADR-005）

预览站需要证明"这套模板能变成别的行业"。做法是给静态托管加一条**只读的多案例通道**，不动数据结构。

### 内容布局

```
public/
├── content.json              # 默认案例（XY俱乐部）快照，仍是最终兜底
└── cases/
    ├── manifest.json         # 案例清单：id / 名称 / 行业 / 主题，供切换器读取
    ├── xy-club.json          # 案例内容，与 content.json 同构
    ├── warmwood-coffee.json
    ├── mingli-law.json
    ├── cloudpivot.json
    ├── shiguang-photo.json
    ├── CREDITS.md            # 演示图片授权台账
    └── images/               # 演示图片（WebP，本地自包含）
```

每个案例 JSON 的字段与 `DEFAULT_DB` **完全一致**，只由现有 8 种板块类型拼装。因此：

- 后台编辑器**无需改造**即可编辑任意案例内容
- 新增一个案例 = 加一份 JSON + 在 manifest 登记一行，**不写代码**
- 案例不含任何凭据字段（`adminPassword` / `password` / `secret` / `token`）

### 加载顺序

`main.js` 的 `loadContent()` 是四级回退：

```
1. /api/content                 (Node 部署，后台为唯一真源)
2. ./cases/<id>.json            (静态，且 URL 指定了 ?case=<id>)
3. ./content.json               (静态，默认案例)
4. 报错并提示
```

`case` 参数先经 `readCaseId()` 白名单校验（`/^[a-z0-9-]{1,64}$/`），非法值不发起请求、直接回退，避免路径穿越。

### 为什么用查询参数而不是路径路由

GitHub Pages 对**不存在的路径**返回 404，SPA 式路径路由（`/case/coffee`）会直接失效，除非引入
`_redirects` / `.htaccess` 之类改写规则或 404 兜底技巧。查询参数 `?case=<id>` 天然可用，
不需要任何服务端配置，也不影响 Node 部署。

### 切换流程（不刷新页面）

```
用户点选案例
  → case-switcher.js: history.pushState({case:id}, '', '?case=' + id)
  → window.XYClub.reload(id)
  → loadContent() 取到新内容
  → renderAll()  ★ 全量重渲染 + 主题重置
  → 派发 xy:rendered 事件
  → 切换器重新渲染自身 + 清理旧的局部监听器
```

浏览器**后退/前进**由 `popstate` 监听处理，走同一条 `reload()` 路径，因此前进后退可靠。
`popstate` / `xy:case-invalid` 两个监听是**常驻**的（不登记进 `cleanupFns`），否则一次清理会把
自己摘掉，导致只有第一次后退生效。

### 保护措施

案例资产是静态手写/脚本生成的，没有运行时兜底，因此在构建期与测试期双重设防：

| 编号 | 保护 | 落点 |
|------|------|------|
| P1 | 演示案例零真实企业信息 + 显式"虚构"声明 | `settings.fictional`、hero 徽标、前端提示条 |
| P2 | 图片授权可追溯 | `public/cases/CREDITS.md` |
| P3 | 切换必须全量重渲染 + 主题重置 | `main.js` `renderAll()` |
| P4 | 无效 case id 优雅降级 | `main.js` `readCaseId()` |
| P5 | 图片加载失败降级 | `main.js` `bindImageFallback()` |
| P6 | 切换不刷新页面 + 监听器清理 | `case-switcher.js` `cleanupFns` |
| P7 | 案例契约测试门禁 | `tests/cases.test.js`（28 项） |

构建期拦截在 `scripts/build-static.js`：结构、板块类型、凭据字段、manifest 对应关系、
图片引用存在性，**任一不合格退出码 1，阻断部署**。

### 与服务端内容的隔离

多案例是**纯静态特性**，与 Node 服务端的内容体系互不干扰。两条路径从头到尾不交叉：

```
【Node 部署】
  后台编辑器  ──►  PUT /api/content  ──►  data/db.json  ──►  GET /api/content  ──►  前端
                                          （唯一真源）
【静态部署】
  无写入能力  ──►  public/cases/<id>.json 或 public/content.json  ──►  前端只读

  关键：server.js 中不存在任何对 cases/ 目录的引用。
        前端 loadContent() 第 1 步先试 /api/content，成功即 return，永不走到静态分支。
```

因此：

- **改静态案例不影响服务端**：服务端只认 `data/db.json`
- **后台保存不影响静态案例**：写入只落 `data/db.json`
- **Node 部署下案例切换器不显示**：只在 `static-mode` 渲染，避免"后台改了但下拉框没变"的困惑

**唯一的方向性是 `content.json` 单向导出**：

```
node scripts/build-static.js   →   data/db.json  ──►  content.json    ✔
                               ←   content.json ──►  data/db.json    ✘（无回流）
```

在静态站手改 `content.json` 后再跑构建脚本，改动会被 `data/db.json` 覆盖——这是"唯一真源"的预期行为，不是 bug。

> 这条隔离原本只是**架构约定**，没有代码守着。v1.8.0 起由 `tests/case-isolation.test.js`（13 项）转为可执行门禁：
> 静态检查源码约定 + 行为检查真跑服务端验证。已用破坏性实验确认它在违规时确实变红。

### 代价（已知取舍）

- **SEO 分不清**：所有案例共用同一份 HTML，搜索引擎只认默认案例
- **Node 部署与静态部署割裂**：Node 下后台是唯一真源，案例切换器只在 `static-mode` 显示
- **仓库体积**：16 张演示图约 0.9MB（已转 WebP 并限制单图 < 400KB）
- **文案非真实**：演示案例是行业范本，不是真实客户案例

> 若将来要让后台统一编辑全部案例，必须先修订 **ADR-002**（唯一真源约定），属独立议题。

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
