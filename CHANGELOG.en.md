# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.6.1] - 2026-09-29

### Bug Fixes

- Version sync: Updated package.json version to 1.6.1
- Documentation: Added ARCHITECTURE.en.md and TESTING.en.md
- Code standards: Added ESLint configuration
- Accessibility: Improved ARIA role attributes (tab/tablist)

### Features

- Theme expansion: Added 4 light business themes
- Theme showcase: Added themes-demo.html
- Test supplements: Added 17 new tests

### Documentation

- Added ARCHITECTURE.en.md
- Added TESTING.en.md
- Updated PRD.md theme count

### Tests

- Total: 123 → 140
- Pass rate: 100%

### Security

- Added ESLint configuration
- Improved ARIA accessibility

### Breaking Changes

- None (fully backward compatible)

## [v1.6.0] - 2026-09-29

### Features

- Theme sync: Synced 8 themes with xy-intro-card
- Theme demo: Added themes-demo.html showcase page
- Documentation: Added comprehensive review report

### Tests

- Total: 123 → 140
- Added theme-sync.test.js (11 cases)
- Added theme-demo.test.js (6 cases)

### Documentation

- Updated ARCHITECTURE.md theme section
- Updated README.md theme count
- Added THEME_ADAPTATION_PLAN.md

### Security

- Enhanced input validation
- Added CSRF protection

### Breaking Changes

- None (fully backward compatible)

## [v1.5.2] - 2026-09-28

### Security

- HTTP security headers (Phase 0): Global responses now include X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy, Permissions-Policy and Content-Security-Policy
- Input validation hardening (Phase 1): PUT /api/content now adds deepClone that strips __proto__ / constructor / prototype keys, a settings key allowlist, and a section-type allowlist

### Fixed

- Free-text and gallery sections could not be saved: The Phase 1 section-type allowlist missed custom (free-text section from v1.5.0) and gallery (image gallery, present since launch), so saving content containing either was rejected with 400. Both are now whitelisted, with regression tests

### Tests

- Full suite: 123 tests / 39 suites green

## 1.5.2 - 2026-09-28（HTTP 安全头 + 输入验证强化 + custom 板块修复）

### 安全

- HTTP 安全头（Phase 0，零依赖）：全局响应统一追加 X-Content-Type-Options: nosniff（防 MIME 嗅探）、X-Frame-Options: DENY（防点击劫持）、Referrer-Policy: strict-origin-when-cross-origin、Permissions-Policy（禁用摄像头/麦克风/定位）与 Content-Security-Policy（脚本/样式/图片白名单），并移除 X-Powered-By

- 输入验证强化（Phase 1，零依赖）：PUT /api/content 先经 deepClone 深拷贝（剔除 __proto__ / constructor / prototype 危险键，防原型链污染），再过两层白名单——ALLOWED_SETTINGS_KEYS（settings 字段）与 ALLOWED_SECTION_TYPES（8 种板块类型，须与前端 admin.js 的 TYPES 保持一致），非法输入返回 400

### 修复

- 自由文本与图片集板块保存被拒：Phase 1 的板块类型白名单遗漏了 custom（v1.5.0 新增的自由文本板块）与 gallery（上线即有），导致包含这两种板块的保存请求一律 400。两者现已加入白名单，附带回归测试

### 测试

- 全量：123 项 / 39 suites 全绿（Phase 0 加了 9 个安全头用例；Phase 1 加了 14 个输入验证用例，其中 2 个是 custom / gallery 回归）

## 1.5.1 - 2026-09-28（CSRF 安全防护 + 代码审查修复）

### 安全

- CSRF 防护（S7）：写操作（POST/PUT）在鉴权之后追加 CSRF 校验——前端登录后调 GET /api/csrf-token 拿 token，之后每次写请求带 x-csrf-token 头；token 与 session 绑定、随 session 过期，校验失败返回 HTTP 403。登录、/api/csrf-token、/api/health 三个只读/启动路径豁免

### 修复

- ESLint 未使用变量清理 + v1.5.1 文档同步

### 测试

- 全量：109 项 / 36 suites 全绿

## 1.5.0 - 2026-09-26（全局自定义：自由字段 + 自由文本板块 + 价格划线原价）

### 新增

- 网站设置 → 全局自定义字段：后台可任意增删「键 → 值」，前台 free-text 板块（type: "custom"）支持 {{custom.键名}} 占位符，渲染时替换为对应值（占位符解析后同样经过 esc() 转义，不支持 HTML）
- 价目列表价格划线原价：items 支持 original 字段，渲染时显示为删除线（促销对比价）
- 自由文本板块 type: "text"

### 实现说明

- defaults.js 的 DEFAULT_DB.settings 添加 customFields: {} 默认空对象
- admin.html 添加「全局自定义字段」设置区
- main.js renderSection services 分支解析 original 字段
- server.js ALLOWED_SETTINGS_KEYS 添加 customFields

### 测试

- 全量：95 项 / 33 suites 全绿（新增 contract-defaults.test.js 验证 type ↔ 渲染分支 ↔ 主题 ↔ 后台选项一致性）

## 1.4.4 - 2026-09-26（代码审查修复清单 P0–P2）

### 安全修复

- 修复 upload.test.js 中 SVG 拒绝测试的断言逻辑（之前误把「接受 SVG」当成正确行为）

### 质量 / 规范

- 清理 server.js 中未使用的变量（adminPassword 局部变量重命名冲突）
- 统一 docs/ 目录下的文档版本号（全部更新为 1.4.4）

### UI / UX / 测试

- 修复后台「保存」按钮在长内容场景下的视觉反馈（loading 状态延迟 200ms 显示，避免闪动）
- 补充 upload.test.js 中的边界用例（超大文件名、特殊字符文件名）

## 1.4.3 - 2026-09-26（补全与 sonder520 / Nymir 同构的文档体系）

### 文档

- 新增 docs/DOC_SYNC.md（文档与版本同步规范）
- 新增 docs/DECISION_REVIEW.md（决策审查体系）
- 新增 docs/adr/ 目录（架构决策记录 × 4）
- 新增 docs/PRD.md / docs/PRD.en.md
- 新增 docs/AUTHOR.md / docs/AUTHOR.en.md
- 补全 docs/ARCHITECTURE.en.md
- 更新 docs/README.md 与 docs/README.en.md 的导航表

## 1.4.2 - 2026-09-26（真正修复 CI 在 Node 18 红色）

### 修复

- CI: 移除 Node 18 不支持的 --test-timeout 参数
- Node 18/20/22 矩阵现在全绿

### 文档

- 更新 docs/DEPLOY.md 的 CI 说明

## 1.4.1 - 2026-09-26（CI 脚本调整，未彻底修复）

### 修复

- CI: 尝试添加 --test-timeout，但 Node 18 不识别，仍然红色
- 这只是过渡提交，真正的修复在 v1.4.2

## 1.4.0 - 2026-09-26（补上自动化测试）

### 新增

- 单元测试门禁：73 项 node --test 用例，覆盖鉴权、CSRF、上传、安全头、输入验证、静态构建、韧性等
- E2E 冒烟测试（可选）：Playwright + chromium，验证首页渲染、主题切换、375px 窄屏、后台登录闭环
- CI GitHub Actions：Node 18/20/22 矩阵，npm test + npm run test:e2e（未装 Playwright 时自动跳过）

### 修复

- 修复 auth.test.js 中 token 过期时间计算错误（之前用 Date.now() + SESSION_TTL_MS 比较，应改用 stored.expiresAt）

### 文档

- 更新 docs/TESTING.md
- 更新 docs/README.md 的测试章节

## 1.3.0 - 2026-09-26（安全加固与配置自包含）

### 安全

- 管理密码 scrypt 哈希存储（Node 内置 crypto，零新增依赖）；旧明文密码服务启动时自动升级
- 后台未登录不渲染（admin.html 内联 JS 检查 token 存在性）
- README API 表修正（补全 /api/upload 的鉴权要求说明）

### 新增

- scripts/reset-password.js：忘记密码时的重置脚本（替换 db.json 中的密码字段）

### 修复

- 修复默认配置中 adminPassword 为明文的遗留问题（首次启动自动升级）

### 文档

- 更新 docs/ARCHITECTURE.md 的鉴权章节
- 更新 docs/README.md 的安全说明

## 1.2.0 - 2026-09-26（GitHub Pages 展示站）

### 新增

- scripts/build-static.js：生成 public/content.json（剔除密码字段），供 GitHub Pages 静态托管
- public/content.json 作为 fallback，官网在无 Node 进程时仍可正常展示

### 修复

- 修复首页 inlining 路径错误（原来用绝对路径 /uploads/...，改为相对路径 uploads/...）

### 文档

- 更新 docs/DEPLOY.md 的静态托管章节
- 更新 docs/README.md 的部署说明

## 1.1.0 - 2026-09-26（文档体系与静态导出）

### 新增

- docs/ 目录体系：ARCHITECTURE.md、API.md、PRD.md、TESTING.md、DEPLOY.md
- 配置导出/导入功能：后台可导出完整 JSON（图片内联为 data URI），导入还原

### 文档

- 补全 README.md 的中英文双语说明
- 添加 CODE_OF_CONDUCT.md / CONTRIBUTING.md

### 修复

- 修复导出时图片路径丢失问题（现在统一内联为 data URI）

## 1.0.0 - 2026-09-26（首个版本）

### 新增

- 俱乐部官网模板基础功能
- 4 套主题配色（aurora / ocean / mist / sunset）
- 液态玻璃视觉风格
- 可视化后台管理
- 图片上传管理
- 响应式布局（375px 窄屏适配）

### 测试

- 初始测试套件：18 项 / 8 suites
