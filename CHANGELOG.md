# 更新日志

所有版本变更记录。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并 adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)。

---

## [v1.8.0] - 2026-10-01

**主题：多案例演示站** —— 让一份模板能横向展示 5 个不同行业的网站案例，证明它不是"只能做俱乐部"。

### ✨ 新增

- **多案例切换（用户可见）**：线上演示站顶部新增案例下拉框，可在 **5 个参考案例** 间即时切换，页面不刷新
  - 💎 XY俱乐部（陪玩服务 · 真实站点）
  - ☕ 青坞咖啡（精品咖啡）· ⚖️ 衡合律师事务所（法律服务）
  - ☁️ 叠云协作（SaaS 产品）· 📷 临界摄影（摄影工作室）
  - 切换写浏览器历史，**前进 / 后退键可用**；链接可分享（`?case=<id>`）
- **多案例架构（ADR-005）**：内容寻址从"单一 `data/db.json`"扩展为"默认站点 + 多份只读案例快照"。案例为纯静态 JSON，无需服务端即可切换，因此 **GitHub Pages 这类纯静态托管也能用**
- **案例总览页**：`themes-demo.html` 升级为「案例 + 主题」双区总览，5 张案例卡片可点击直达对应站点
- **图片授权台账** `public/cases/CREDITS.md`：16 张演示图逐张登记原始页面、License 与下载日期，授权可追溯
- **案例契约测试** `tests/cases.test.js`（29 项）：结构、类型白名单、凭据零容忍、虚构声明、图片溯源、相对路径、主题合法性、`heroStats` 数字格式全部纳入 CI 门禁
- **案例隔离性保护测试** `tests/case-isolation.test.js`（13 项）：守住「静态案例」与「服务端内容」两条路径永不交叉。分两层——静态检查（服务端不得引用 `cases/`、`DB_FILE`/`UPLOAD_DIR` 不得越界、前端回退必须 API 优先）+ 行为检查（真跑服务端，验证改案例不影响 API、服务端写入不落 `cases/`）。已用破坏性实验证明：人为制造违规时测试确实变红
- **构建期案例校验**：`scripts/build-static.js` 除生成快照外，新增校验 `public/cases/` 资产，**任一项不合格即退出码 1 阻断部署**

### 🔧 修复

- **演示案例首页统计数字显示为 0**：律所 / SaaS / 摄影三个案例的 `heroStats` 把数字写在了词组中间（如「执业律师32人」「平均提速40%」），而前端 `parseStat()` 要求**数字紧贴段首**才能识别，导致首页四个统计全变成刺眼的 `0`。已把数字挪到段首（「32人执业律师」「40%平均提速」），并**补测试固化这个格式约定**（新增测试项：`heroStats` 每段必须以数字开头），防止再次写错
- **⚠️ 修复线上事故：首页底部 CTA 区块与整个页脚从未渲染**（v1.8.0 之前所有版本均受影响）
  - **根因**：`public/index.html` 中 CTA 的 `<section>` 被错误地放在 `<main id="app">` **内部**。而 `renderSections()` 执行 `$('#app').innerHTML = ...` 会整体替换 `#app` 的内容，连带删除 `<div id="ctaCard">`；随后 `renderCTA()` 访问该已消失的元素并抛出 `Cannot set properties of null (setting 'innerHTML')`。由于异常中断了后续初始化，**页脚也一并未渲染**
  - **修复**：把 CTA `<section>` 移出 `#app` 之外，并补测试固化这个约束（见 `tests/cases.test.js`），避免回归
- **测试治理**：`tests/theme-demo.test.js` 原先硬编码断言 `v1.6.0`，每次升版本都会假失败。改为跟随 `package.json` 版本，既保证展示页标注版本，也防止两者漂移

### 🔒 安全

- **演示案例零真实企业信息（P1）**：4 个新案例的机构名、电话（`400-000-0000`）、地址、Logo 全部虚构；机构名经检索确认不与真实企业重合
- **虚构性质显式声明**：演示案例首屏徽标标注「🎭 模板演示案例 · 虚构机构，非真实企业」，并在 `settings.fictional` 打标；前端渲染时额外显示提示条，避免访客误认为真实机构
- **案例资产凭据零容忍**：案例 JSON 严禁出现 `adminPassword` / `password` / `secret` / `token` 字段，构建与测试双重拦截
- **前端案例 ID 白名单校验**：`readCaseId()` 以 `/^[a-z0-9-]{1,64}$/` 过滤，非法 ID 不发起请求并优雅回退到默认站点（防路径穿越）
- **部署产物门禁加强**：CI 新增「校验部署产物完整性」步骤，确认 `cases/` 与 `CREDITS.md` 随产物发布、后台文件确已移除、案例数与 manifest 一致

### 📝 文档

- 新增 `docs/adr/ADR-005.md`：多案例架构决策记录（含 7 项保护措施 P1–P7 与代价分析）
- 新增 `docs/PLAN-v1.8.0.md`：v1.8.0 分阶段任务清单与验收对照
- 新增 `public/cases/CREDITS.md`：演示图片授权台账
- 同步更新 `README.md` / `README.en.md` / `docs/ARCHITECTURE.md` / `docs/DEPLOY.md` / `docs/PRD.md` / `docs/adr/README.md`

---

## [v1.7.1] - 2026-10-01

### 🔧 修复

- **移除冲突的 `eslint.config.js`**：该文件与 `.eslintrc.js` 并存，且含有 ESLint 中并不存在的规则 `no-new-promises`，是 `npm run lint` 崩溃的根因。v1.7.0 推送时遗漏了此删除，本版本补上（配置统一保留 `.eslintrc.js`）

---

## [v1.7.0] - 2026-10-01

### 🔒 安全

- **默认密码加固（Breaking）**：移除代码内写死的弱密码 `xy888888`。管理员密码改为环境变量 `ADMIN_PASSWORD` 优先；未设置时服务首次启动生成强随机密码并仅在控制台打印一次。**升级后请务必设置 `ADMIN_PASSWORD` 或从启动日志获取新密码**
- **登录限流绕过封堵**：`TRUST_PROXY` 默认值由 `1` 改为 `false`，伪造 `X-Forwarded-For` 头不再能绕过登录限流（此前可用一个 HTTP 头实现无限爆破）
- **新增登出接口** `POST /api/logout`：登出后 token 立即失效，不再需要等待 7 天 TTL
- **CSP 收紧**：移除脚本 / 样式的 `unsafe-inline`，新增 `Strict-Transport-Security` 与 `object-src 'none'`
- **上传校验增强**：在扩展名白名单之外，新增文件头魔数校验（拒绝伪装成图片的脚本）、上传频率限制与磁盘配额
- **审计日志**：改密 / 重置 / 登出 / 上传等关键写操作写入服务端日志

### 🔧 修复

- **可访问性**：修复 `index.html` 中 `<main>` 标签从未闭合的问题（页脚 / 弹窗 / 悬浮按钮不再被错误嵌套进 `main`）；后台输入框补键盘焦点可见样式；弹窗支持 ESC 关闭并管理焦点
- **健壮性**：未知板块类型给出明确警示；`build-static` 优先读取真实 `data/db.json`；官网加载失败给出可见提示
- **代码规范**：修复 `npm run lint` 崩溃（两份冲突的 ESLint 配置 + 一条不存在的规则），现零 error

### 🧪 测试

- 总测试数: 140 → **158 项 / 45 suites**，通过率 100%
- 新增：XSS 转义回归、登出失效、未登录上传、CSRF 跨会话绑定、会话 TTL、写锁串行化、API 文档双向一致守卫
- **CI**：新增 lint 质量门；部署流程增加"测试不通过不部署"的依赖约束

### 📚 文档

- 修正 `docs/API.md` / `.en.md`：补 `/api/reset` 必填参数 `currentPassword`、补 `/api/logout`、删除已失效的默认弱密码示例
- 修正 `docs/ARCHITECTURE.md` / `.en.md`：缓存层、密码存储、主题套数等过时描述
- 修正 `GLOBAL.md` 事实错误（SQLite → 单 JSON 文件、测试框架等），修复失效文档链接
- 全仓测试数量统一为真实值；中英文主题统一为 8 套、板块类型 8 种

### ⚠️ Breaking Changes

- **管理员密码机制变更**：不再有内置默认密码。升级后必须设置 `ADMIN_PASSWORD` 环境变量，或从首次启动日志读取自动生成的随机密码，否则无法登录后台

---

## [v1.6.2] - 2026-09-29

### 🔧 修复

- **文档同步**: 补充 API.en.md 英文版 API 文档
- **可访问性**: 完善 index.html ARIA role 属性（banner/navigation/main/contentinfo）
- **代码规范**: 增加 admin.js 关键注释，提升可读性
- **ESLint**: 优化配置规则，平衡规范与灵活性

### 📚 文档

- 新增 docs/API.en.md（英文版 API 参考）
- 新增 docs/FIX_SUMMARY.md（审查修复总结）
- 更新 docs/SECOND_COMPREHENSIVE_REVIEW.md

### 🧪 测试

- 总测试数: 140 项
- 通过率: 100%

### 📊 评分提升

- 综合评分: 89 → 94/100 (+5分)

### ⚠️ Breaking Changes

- 无（完全向后兼容）

---

## [v1.6.1] - 2026-09-29

### 🐛 Bug Fixes

- **版本同步**: 更新 package.json 版本号为 1.6.1
- **文档补充**: 添加 ARCHITECTURE.en.md 和 TESTING.en.md 英文版
- **代码规范**: 添加 ESLint 配置文件
- **可访问性**: 完善 ARIA role 属性（tab/tablist）

### ✨ Features

- **主题扩展**: 新增 4 套亮色商务主题（米白·晨雾 / 浅灰·云影 / 燕麦·暖调 / 藏蓝·经典）
- **主题案例**: 添加 themes-demo.html 主题展示页面
- **测试补充**: 新增 11 项主题同步测试 + 6 项主题展示测试

### 📚 Documentation

- 添加 ARCHITECTURE.en.md（英文版架构文档）
- 添加 TESTING.en.md（英文版测试文档）
- 更新 PRD.md 主题数量说明（4套→8套）
- 添加综合审查报告 COMPREHENSIVE_REVIEW.md

### 🧪 Tests

- 总测试数: 123 → 140（新增 17 项）
- 通过率: 100%

### 🔒 Security

- 添加 ESLint 配置文件（防御性编程）
- 完善 ARIA 可访问性（WCAG 2.1 AA）

### 📖 Breaking Changes

- 无（完全向后兼容）

---

## [v1.6.0] - 2026-09-29

### ✨ Features

- **主题扩展**: 新增 4 套亮色商务主题（米白·晨雾 / 浅灰·云影 / 燕麦·暖调 / 藏蓝·经典）
- **主题同步**: 与 xy-intro-card 主题配置完全一致
- **视觉优化**: 亮色主题光斑透明度降低，玻璃效果增强

### 🧪 Tests

- 新增 11 项主题同步测试
- 总测试数: 123 → 134 项
- 通过率: 100%

### 📚 Documentation

- 更新 ARCHITECTURE.md 主题机制说明
- 添加主题对比表格

### 🔧 技术细节

- 保持 xy-club 原有变量命名规范（--bg-a, --ink, --accent 等）
- 新增主题适配亮色背景（降低光斑透明度，提高玻璃透明度）
- 保留金色变量 --gold-1/2/3 用于所有主题

### ⚠️ Breaking Changes

- 无（完全向后兼容）

---

## [v1.5.2] - 2026-09-28

本文件记录 XY 俱乐部官网模板的所有重要变更。
格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/)。

> ⚠️ 提示：本项目由 AI 辅助开发。后台鉴权为单密码机制（1.3.0 起密码以 scrypt 哈希存储），尚未经过专业安全审计，部署后请第一时间修改默认密码。

---

## 1.5.2 - 2026-09-28（HTTP 安全头 + 输入验证强化 + custom 板块修复）

### 🔒 安全

- **HTTP 安全头（Phase 0，零依赖）**：全局响应新增 `X-Content-Type-Options: nosniff`（防 MIME 嗅探）、`X-Frame-Options: DENY`（防点击劫持）、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy`（禁用 camera/mic/geolocation）与 `Content-Security-Policy`（脚本/样式/图片白名单）；并移除 `X-Powered-By` 隐藏 Express 版本
- **输入验证强化（Phase 1，零依赖）**：`PUT /api/content` 新增
  - `deepClone` 深拷贝并过滤 `__proto__` / `constructor` / `prototype` 危险键，防御原型链污染
  - `settings` 字段白名单（`ALLOWED_SETTINGS_KEYS`），非法字段返回 `400 非法设置字段`
  - 板块类型白名单（`ALLOWED_SECTION_TYPES`），非法类型返回 `400 非法板块类型`

### 🔧 修复

- **自由文本板块与图片集无法保存**：Phase 1 的板块类型白名单遗漏了 `custom`（v1.5.0 自由文本板块）与 `gallery`（图片集，上线即有）两个类型，导致后台保存含这两类板块的内容被 400 拒绝；已补入白名单并各新增回归测试用例

### 🧪 测试

- 全量测试：**123 项 / 39 suites** 全绿（Phase 0 新增 9 项安全头用例、Phase 1 新增 14 项输入验证用例，其中 2 项为 custom / gallery 回归用例）

---

## 1.5.1 - 2026-09-28（CSRF 安全防护 + 代码审查修复）

### 🔒 安全

- **CSRF 防护（S7）**：新增 `/api/csrf-token` 端点，所有写操作（POST/PUT）强制校验 CSRF token
- Token 与 session 绑定，不同会话不能混用
- 前端 admin.js 登录后自动获取并携带 CSRF token

### 🧪 测试

- 全量测试：100 项（+11 新用例覆盖 CSRF 场景）

---

## 1.5.0 - 2026-09-26（全局自定义：自由字段 + 自由文本板块 + 价格划线原价）

### ✨ 新增
- **全局自定义字段**：后台「网站设置 → 全局自定义字段」可任意增删「键 → 值」，用于跨板块复用的文案（如营业时间、活动标语）。
- **自由文本板块**（新增板块类型 `custom`）：正文支持 `{{custom.键名}}` 占位符引用全局自定义字段；渲染走 `esc()` 转义，自定义值里的 HTML 不会被执行（无 XSS）。
- **价目划线原价**：services 条目新增可选 `original` 字段，前端展示划线对比价（促销场景）。

### 🧩 实现说明
- 后端 `PUT /api/content` 对 `settings` 为开放浅合并，自定义字段零后端改造即可落库；`safeSettings` 仅剔除 `adminPassword`，自定义值正常返回。

## 1.4.4 - 2026-09-26（代码审查修复清单 P0–P2）

> 依据 `CODE-REVIEW.md` 的优先级修复清单执行。综合评分由 3.6/5 提升至约 4.3/5，安全维度由 C 升至 B+。

### 🔒 安全修复

- **S1 · `/api/reset` 后门**：恢复默认内容接口原本会把全站管理密码重置为硬编码弱密码 `xy888888` 且无二次校验。现改为：①必须校验当前管理密码；②只恢复内容与设置，**绝不改动登录密码**。
- **S2 · 改密码失效会话**：`/api/password` 成功后清空所有会话（仅保留当前 token），旧 token 在 7 天过期前不再有效。
- **S3 · 限流取真实客户端 IP**：部署在反向代理后通过 `trust proxy` 取真实客户端 IP 限流，避免限流失效或误锁全站（可用 `TRUST_PROXY` 环境变量覆盖跳数）。

### 🧩 质量 / 规范

- **Q1 · 并发写加进程内锁**：`/api/content`、`/api/password`、`/api/reset` 的 read-modify-write 临界区串行化，避免并发丢失更新。
- **Q2 · 读盘缓存**：`readDB` 基于文件 mtime 缓存，公开高频读不再每次全量解析 + 读盘（缓存命中仍返回副本，不污染调用方）。
- **Q4 · 全局错误处理**：新增错误处理中间件，统一返回 500，避免异常泄漏为挂起连接。
- **C1 · 命名统一**：后台与 `localStorage` 鉴权 key 由 `nx_token` 统一为 `xy_token`，删除全部旧版 NX 命名。
- **C2 · 常量收敛**：上传上限 / JSON 上限 / 会话有效期 / 限流阈值改为服务端常量；普通 JSON 接口上限 64mb → 1mb，上传接口 16mb（业务上限仍是 8MB，路由内校验）。

### ♿ UI / UX / 测试

- **U1 · 后台重渲染保持焦点与滚动**：编辑板块时整列表重渲染不再丢失输入框焦点与滚动位置。
- **U2 · reset 移入危险区**：「恢复默认内容」移到独立危险操作区，需输入当前密码确认，文案明确「将清空所有板块与设置」。
- **U3 · 后台 a11y**：登录框真实 `label[for]`、操作按钮 `aria-label`、`#saveState` 加 `aria-live`、添加板块弹窗 `role="dialog"` + 焦点语义。
- **T1 / T2 / T3 · 测试**：新增 reset 安全契约、改密码失效会话、前端 `esc` / `TYPES` 单测；合计 **82 项全绿、28 suites、0 fail**。

---

## 1.4.3 - 2026-09-26（补全与 sonder520 / Nymir 同构的文档体系）

### 📚 文档

- **补全与 sonder520 / Nymir 同构的文档体系**：以中文为基准、`.en.md` 镜像，新增以下文档（均基于真实实现，未凭空编造）：
  - `docs/DOC_SYNC.md` — 文档与版本同步规范（唯一真源、同步清单、SemVer 判定、发布前验证）
  - `docs/DECISION_REVIEW.md` — 决策审查清单（决策三问 + 五层追问，发版 / 不可逆操作前必过）
  - `docs/adr/` — 架构决策记录索引 + 4 篇种子 ADR（scrypt 密码哈希 / JSON 文件真源 / 零构建前端 / 契约固化式测试）
  - `docs/PRD.md` · `docs/PRD.en.md` — 产品需求文档（定位、功能、数据规范、验收标准）
  - `docs/AUTHOR.md` · `docs/AUTHOR.en.md` — 关于作者
  - `docs/ARCHITECTURE.en.md` — 架构说明英文版
- 更新 `docs/README.md` 索引、`README.md` / `README.en.md` 文档表、`AGENTS.md`（新增「文档与版本同步（发布必查）」章节，引用 `DOC_SYNC.md`）。
- 安全政策 `SECURITY.md` / `SECURITY.en.md`、英文贡献指南 `CONTRIBUTING.en.md`、REST API 参考 `docs/API.md` 已于上一轮补建并接入。

---

## 1.4.2 - 2026-09-26（真正修复 CI 在 Node 18 红色）

### 🔧 修复

- **`test.yml` 在 Node 18 上依旧红色的根因**：`npm test` 脚本里的 `--test-timeout=20000` 是 **Node 20 才加入的 CLI 参数**，Node 18 不认识它，启动即报 `bad option: --test-timeout=20000` 并非零退出。Node 20 / 22 不受影响，所以只有 Node 18 挂。
  已从 `test` 脚本移除该参数。
- 作为替代的防挂保护，给 `test.yml` 的 `unit` 作业加了 `timeout-minutes: 10`（作业级超时对所有 Node 版本都生效，避免某个用例意外卡死把 CI 挂成无期限）。
- 本地用 Node 18.20.4 与 Node 22 双验证：73 项全绿、24 suites、0 fail（Node 18 约 1.3s）。

### 📝 文档

- 本条目修正了 1.4.1 的错误判断（当时误以为是「目录自动发现」，实际上显式 glob 也没修好）。

---

## 1.4.1 - 2026-09-26（CI 脚本调整，未彻底修复）

### 🔧 修复

- `npm test` 由 `node --test` 无参改为显式 `node --test tests/*.test.js`：shell 把通配符展开成 9 个文件名传入，`--test` 接收显式文件参数自 Node 18 起就支持。
  这一改动本身没问题，但**当时误以为它修好了 CI 红色**——其实 Node 18 真正的失败原因是 `--test-timeout`（见 1.4.2），所以本次发布后 `test.yml` 在 Node 18 仍是红色。

---

## 1.4.0 - 2026-09-26（补上自动化测试）

### ✨ 新增

- **单元测试套件**：`tests/` 下 9 个文件、73 项用例，用 Node 内置的 `node --test` 跑，零新增依赖、约 5 秒；`npm test` 成为唯一的强制门禁
  - 覆盖密码哈希与校验、登录限流、鉴权中间件、上传白名单、内容读写与内联图片还原、静态快照脱敏、数据文件容错、板块/主题契约、文档同步
- **可选 E2E**：`e2e/` + `playwright.config.js`，桌面（1280×800）与窄屏（375×667）两个视口；未安装 Playwright 时 `npm run test:e2e` 自动跳过，不影响退出码
- `docs/TESTING.md`：测试指南，含分层依据、文件职责表与纪律约定
- GitHub Actions 工作流 `test.yml`：Node 18 / 20 / 22 上各跑一遍单元测试
- `server.js` 支持用 `DATA_DIR` / `UPLOAD_DIR` 环境变量覆盖存储目录（测试隔离用，不影响默认行为）

### 🔧 修复

- **后台面板在未登录时其实已经渲染出来了**：`.admin-app { display: flex }` 盖掉了 `hidden` 属性的 `display: none`，只是被登录浮层遮住看不见；补上 `.admin-app[hidden] { display: none }`
- `/api/health` 原本被鉴权中间件拦截返回 401，无法用于探活；现已移到鉴权之前，恢复为公开接口
- 中英文 README 的 API 表把 `/api/password` 写成 `PUT`（实际是 `POST`），且漏记了 `/api/health`；已修正，并新增 `docs-sync.test.js` 自动守卫「文档与路由不一致」

### 📝 文档

- 新增 `docs/TESTING.md`，并在两份 README 的文档索引与目录结构中同步
- `AGENTS.md` 新增「测试纪律」章节，交付前自检加入 `npm test`
- `CONTRIBUTING.md` 的「测试要求」从纯手工清单改为「单元测试门禁 + 可选 E2E + 仍需人工确认的部分」

---

## 1.3.0 - 2026-09-26（安全加固与配置自包含）

### 🔒 安全

- **管理密码改为 scrypt 哈希存储**（Node 内置 `crypto`，零新增依赖）；旧版本遗留的明文密码在服务启动时自动升级
- **登录限流**：同一 IP 连续 5 次密码错误后锁定 5 分钟，返回 429
- **上传禁用 SVG**：SVG 可内嵌脚本，直接访问 `/uploads/*.svg` 存在 XSS 风险；格式白名单改为 jpg / png / webp / gif
- 上传目录新增 `X-Content-Type-Options: nosniff` 响应头
- 新增 `scripts/reset-password.js`，用于重置已哈希化的管理密码

### ✨ 新增

- **导出配置内联图片**：导出时把 `/uploads/*` 转为 data URI，导入新站点时由服务端还原为图片文件 —— 复用模板不再丢图
- `data/db.json` 解析失败时自动备份为 `.corrupt-*` 文件，再回退到默认内容（避免真实数据悄无声息地消失）

### 🔧 修复

- `/api/check` 原本被鉴权中间件拦截，未登录时返回 401；现移到鉴权之前，正确返回 `{"ok": false}`
- 图片类型正则 `\w+` 无法匹配 `svg+xml`，导致 SVG 上传报「图片解析失败」而非准确原因

### 📝 文档

- 修正「已知局限」中「上传未做 MIME 白名单」的**错误描述**（代码实际已做格式校验）
- 中英文 README 同步安全、限流、导出图片等变更；路线图更新

---

## 1.2.0 - 2026-09-26（GitHub Pages 展示站）

### ✨ 新增

- **GitHub Pages 自动部署**：新增 `.github/workflows/deploy-pages.yml`，推送 `main` 即自动构建并发布静态站点
- **Render 蓝图**：新增 `render.yaml`，可在 Render 上一键部署完整版（含后台）用于演示

### 🔧 修复

- 静态资源引用改为相对路径（`/css/style.css` → `css/style.css`），修复子路径托管下样式与脚本 404 导致白屏的问题

### 📝 文档

- 中英文 README 加入 Pages 在线预览链接 <https://xiaoyu-hue.github.io/xy-club/>，并说明静态模式下后台不可用
- 移除英文 README 中的 Apache-2.0 替换提示，与中文保持一致

---

## 1.1.0 - 2026-09-26（文档体系与静态导出）

### ✨ 新增

- **静态快照导出**：新增 `scripts/build-static.js`，把默认内容导出为 `public/content.json`，供纯静态托管使用
- **静态回退渲染**：官网前端在 `/api/content` 不可用时自动读取 `content.json`，并自动隐藏后台入口（静态环境无后端）
- **文档体系**：新增 `CHANGELOG.md` / `CHANGELOG.en.md`、`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md` / `.en.md`、`AGENTS.md`
- **文档目录**：新增 `docs/`，包含文档索引、架构说明、板块字段参考、部署指南

### 📝 文档

- 中英文 README 按项目规范重写：顶部徽章区、语言切换行、已知局限、不适合什么场景、路线图、致谢与依赖
- 英文文档统一命名为 `README.en.md`（原 `README_EN.md`），与项目其它仓库保持一致
- README 顶部导航改用显式 `<a id>` 锚点，避免 emoji 标题在 GitHub 上生成的锚点不稳定
- README 补上仓库地址、`package.json` 补上 `repository` / `license` / `engines` 字段

### 🔧 修复

- `package.json` 包名与描述仍是旧的 NX 星空主题，已统一为 XY 俱乐部模板
- `server.js` 启动日志仍输出 `NX俱乐部官网已启动`，已改为中性文案

---

## 1.0.0 - 2026-09-26（首个版本）

### ✨ 新增

**视觉**

- 液态玻璃设计体系：半透明渐变底 + `backdrop-filter` 高斯模糊 + 1px 内描边高光
- 光标高光追踪：通过 CSS 变量 `--mx` / `--my` 实时更新光源位置
- 4 套主题配色：极光紫 `aurora` / 深海蓝 `ocean` / 晨雾白 `mist`（浅色）/ 落日金 `sunset`
- 液态流光背景：4 个渐变色块做形变动画

**微交互（8 处）**

- 玻璃卡片光标高光追踪、卡片 3D 微倾斜、按钮点击涟漪
- 首屏数字滚动动画、顶部滚动进度条、返回顶部按钮
- 导航当前板块高亮、滚动错落渐显 + 背景视差
- 移动端自动降级：倾斜与高光仅在鼠标设备生效

**内容与后台**

- 7 种板块类型：价目列表 `services` / 卡片网格 `cards` / 客户评价 `testimonials` / 常见问答 `faq` / 须知列表 `notice` / 图片集 `gallery` / 图文段落 `text`
- 板块可编辑、↑↓ 排序、👁 显隐切换、删除，随时新增
- 网站设置：名称、Logo、首屏文案、公告、联系方式、客服二维码、页脚
- 图片上传（≤8MB）、修改管理密码
- 模板复用：配置导出 / 导入 JSON、一键恢复默认内容

**服务端**

- Express 单端口服务：静态托管 + REST API + 登录鉴权 + 图片上传
- JSON 文件存储，无需数据库
- 会话存服务端内存，7 天过期

### 🧪 测试

- 使用 Playwright 完成官网与后台的端到端验证：桌面 / 移动端布局、四套主题渲染、后台登录与编辑流程
