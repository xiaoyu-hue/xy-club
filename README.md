<div align="center">

<img src="https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge" alt="license">
<img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="node">
<img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="express">
<img src="https://img.shields.io/badge/前端-零框架-4FC08D?style=for-the-badge" alt="frontend">
<img src="https://img.shields.io/badge/存储-JSON%20文件-6B728C?style=for-the-badge" alt="storage">
<img src="https://img.shields.io/github/v/release/xiaoyu-hue/xy-club?style=for-the-badge" alt="release">

**[English](./README.en.md) · 中文**

# 💎 俱乐部官网模板 · XY俱乐部

> ⚠️ **重要提示**：本项目由 AI 辅助开发。后台鉴权为**单密码**机制，**未经专业安全审计**，请部署后第一时间修改默认密码。

一套**可复用的俱乐部官网模板**：液态玻璃视觉体系 + 微交互，官网与后台管理系统一体，内容全部由数据驱动。

**换一个俱乐部，只需改内容、换主题，不改代码。**

> *改四处文案，就能变成另一个俱乐部的官网。*

<br>

**[🔗 在线预览（GitHub Pages）](https://xiaoyu-hue.github.io/xy-club/)** · **[🚀 快速开始](#quick-start)** · **[🔁 复用模板](#reuse)** · **[📚 文档](docs/README.md)** · **[⚠️ 不适合什么场景](#not-recommended)**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![Test](https://github.com/xiaoyu-hue/xy-club/actions/workflows/test.yml/badge.svg)

</div>

---

## 🎯 项目简介

一个俱乐部想有个官网，通常卡在两件事：要么找人开发花钱，要么用建站平台被模板绑死。这个模板想解决的正是这件事——**一套代码，改内容就能给任意俱乐部用**。

官网与后台共用一份 JSON 数据：后台改什么，前台立刻是什么，不需要重新构建、不需要懂代码。

> 顶部「在线预览」是 GitHub Pages 的**纯静态**版本：官网完整可见，**后台不可用**（入口会自动隐藏）。需要后台请按 [docs/DEPLOY.md](docs/DEPLOY.md) 用 Node 服务器部署。

### ✨ 核心特点

| 特性 | 说明 |
|------|------|
| 🎨 **液态玻璃视觉** | 高斯模糊玻璃 + 光标高光追踪 + 流光扫过，深浅主题都保持玻璃质感 |
| 🌈 **4 套主题配色** | 极光紫 / 深海蓝 / 晨雾白（浅色）/ 落日金，后台一键切换 |
| ✨ **8 处微交互** | 光标高光、卡片 3D 倾斜、按钮涟漪、数字滚动、滚动进度条、返回顶部、导航高亮、错落渐显 |
| 🧩 **7 种板块类型** | 价目列表 / 卡片网格 / 客户评价 / 常见问答 / 须知列表 / 图片集 / 图文段落 |
| 🛠 **可视化后台** | 板块增删改、↑↓ 排序、👁 显隐，随时新增板块 |
| 📦 **模板复用** | 整站配置导出 / 导入 JSON，一键恢复默认内容 |
| 🚀 **零数据库** | 单端口 HTTP + JSON 文件存储，任何支持 Node.js 的平台都能跑 |
| 🍦 **零前端框架** | 原生 HTML/CSS/JS，无构建步骤，改完刷新即生效 |

---

## 🎨 视觉与交互

### 液态玻璃设计语言

玻璃质感由三层叠出来：半透明渐变底 + `backdrop-filter` 高斯模糊与饱和度提升 + 1px 内描边高光。光标在卡片上移动时，高光会跟着走——靠 CSS 变量 `--mx` / `--my` 实时更新光源位置实现。

### 微交互清单

- **光标高光追踪** — 玻璃卡片内的径向高光跟随鼠标
- **卡片 3D 微倾斜** — `perspective(900px)` 下随光标做 ±6° 旋转
- **按钮点击涟漪** — 从点击位置扩散的水波纹
- **首屏数字滚动** — 统计数字进入视口时从 0 滚动到目标值
- **滚动进度条** — 顶部细条实时反映阅读进度
- **返回顶部** — 滚动超过一屏后淡入
- **导航当前板块高亮** — 滚动到某板块时对应导航项点亮
- **错落渐显 + 背景视差** — 板块按 `--i` 延迟依次淡入上浮

> 移动端自动降级：倾斜、高光仅在有鼠标的设备生效，触屏不会误触发。

### 主题配色

| 主题 | 基调 | 适合 |
|------|------|------|
| 🌌 极光紫 `aurora` | 深色 · 紫蓝渐变 | 游戏 / 陪玩 / 潮玩社群 |
| 🌊 深海蓝 `ocean` | 深色 · 青蓝渐变 | 技术 / 户外 / 运动俱乐部 |
| ☁️ 晨雾白 `mist` | **浅色** · 灰白渐变 | 读书 / 亲子 / 生活服务 |
| 🌇 落日金 `sunset` | 深色 · 橙金渐变 | 餐饮 / 派对 / 兴趣社交 |

---

## 📋 板块类型

后台新增板块时可选 7 种类型，前台按类型自动套用不同渲染方式：

| 类型 | `type` | 用途 | 每项字段 |
|------|--------|------|----------|
| 价目列表 | `services` | 服务项目 / 套餐价目 | 名称、描述、价格、标签 |
| 卡片网格 | `cards` | 特色展示 / 团队成员 | 标题、描述、图标 |
| 客户评价 | `testimonials` | 用户反馈 / 好评墙 | 内容、署名、评分 |
| 常见问答 | `faq` | 疑问解答（可折叠） | 问题、答案 |
| 须知列表 | `notice` | 规则 / 公告 / 注意事项 | 条目文本 |
| 图片集 | `gallery` | 相册 / 活动照片 | 图片地址 `url`、说明 `caption` |
| 图文段落 | `text` | 关于我们 / 长文介绍 | 标题、正文 |

---

## 🔐 数据与隐私

- **所有内容存于 `data/db.json`** — 单个 JSON 文件，重启不丢失，不依赖任何数据库
- **默认管理密码 `xy888888`** — 以 **scrypt 哈希**存于 `db.json`（Node 内置实现，未引入新依赖），**部署后请立即修改**
- **密码不进版本库** — `data/db.json` 已在 `.gitignore` 中排除
- **登录限流** — 同一 IP 连续 5 次密码错误后锁定 5 分钟
- **登录态** — 服务端内存保存会话，7 天过期；token 存于浏览器 localStorage
- **图片** — 后台上传后存于 `public/uploads/`，不经过任何第三方

### ⚠️ 已知局限

诚实说，当前实现有意保持简单，以下都是**已知且未处理**的：

- **单密码单管理员** — 没有多用户、角色或权限分级，也无法区分谁改了什么
- **无 CSRF 防护** — 接口依赖同源调用，跨域场景下需自行加固
- **单进程文件读写** — 多实例 / 多副本部署会导致写冲突，请只跑一个进程
- **会话存内存** — 服务重启后所有登录态失效，需要重新登录
- **上传仅做格式与大小校验** — 限 8MB，仅允许 jpg / png / webp / gif（**不支持 svg**，因其可内嵌脚本）；未做图片内容扫描

---

<a id="not-recommended"></a>

## ⚠️ 不适合什么场景

这个模板追求「开箱即用、零依赖」，代价是放弃了企业级能力。以下场景请谨慎评估或另选方案：

- **涉及支付的交易站点** — 没有订单、库存、支付与对账能力，也不满足合规要求
- **需要多管理员协作** — 后台是单密码，无法区分谁改了什么
- **高流量 / 高并发站点** — 单进程 + JSON 全量读写，没有缓存与连接池
- **需要 SEO 与服务端渲染** — 内容由前端 JS 异步拉取，爬虫不一定能拿到渲染结果
- **存储用户敏感信息** — 单密码鉴权 + 无操作审计日志，不足以承担实名、证件等数据
- **容器无持久卷** — 重启会丢失 `data/db.json` 与 `public/uploads/` 下的内容

---

<a id="quick-start"></a>

## 🚀 快速开始

```bash
git clone https://github.com/xiaoyu-hue/xy-club.git
cd xy-club
pnpm install      # 或 npm install
node server.js    # 默认 http://localhost:3000
```

- 官网：<http://localhost:3000>
- 后台：<http://localhost:3000/admin>
- **默认管理密码：`xy888888`** —— 登录后立即到「网站设置 → 修改管理密码」更换
- 换端口：`PORT=8080 node server.js`（服务已绑定 `0.0.0.0`，可直接部署）

> 首次启动会由 `defaults.js` 自动生成 `data/db.json`；删掉这个文件即恢复出厂内容。

### 环境要求

| 项目 | 要求 |
|------|------|
| Node.js | ≥ 18（用到原生 `fetch` 之外的 ES2020 特性，实际 14+ 亦可） |
| 磁盘 | 约 50MB（含依赖） |
| 数据库 | 无 |

---

## 📁 目录结构

```
xy-club/
├── server.js            # Express 服务：静态托管 + REST API + 登录鉴权 + 图片上传
├── defaults.js          # 模板默认内容（改这里可改「出厂配置」）
├── package.json
├── tests/               # 单元测试（node --test，零新增依赖）
├── e2e/                 # E2E 冒烟（可选，需本地装 @playwright/test）
├── data/
│   └── db.json          # 运行时内容数据（自动生成，已 gitignore）
└── public/
    ├── index.html       # 官网前端
    ├── admin.html       # 后台管理系统
    ├── uploads/         # 后台上传的图片
    ├── css/             # style.css（官网）· admin.css（后台）
    └── js/              # main.js（官网渲染+微交互）· admin.js（后台逻辑）
```

### API 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/login` | 密码登录，返回 token |
| GET | `/api/check` | 校验登录态 |
| GET | `/api/content` | 获取整站内容（公开） |
| PUT | `/api/content` | 保存内容与设置（需鉴权） |
| POST | `/api/password` | 修改管理密码（需鉴权） |
| POST | `/api/upload` | 上传图片，≤8MB（需鉴权） |
| POST | `/api/reset` | 恢复默认内容（需鉴权） |
| GET | `/api/health` | 健康检查（公开，探活用） |

---

<a id="docs"></a>

## 📚 文档

| 文档 | 内容 |
|------|------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 架构说明：数据流转、主题机制、鉴权、静态回退 |
| [docs/SECTIONS.md](docs/SECTIONS.md) | 7 种板块类型的字段参考 |
| [docs/DEPLOY.md](docs/DEPLOY.md) | 部署指南：Node 服务器 / 纯静态托管两条路线 |
| [docs/TESTING.md](docs/TESTING.md) | 测试指南：单元测试门禁 + 可选 E2E，含纪律约定 |
| [docs/API.md](docs/API.md) | 后台 REST API 详细参考（鉴权、各端点、错误码） |
| [CHANGELOG.md](CHANGELOG.md) | 版本历史 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 贡献指南（含代码规范与两条红线） |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | 贡献者行为准则 |
| [SECURITY.md](SECURITY.md) | 安全政策：漏洞报告、安全模型与已知局限 |
| [AGENTS.md](AGENTS.md) | AI Agent 协作规则 |

<a id="reuse"></a>

## 🔁 复用模板（给另一个俱乐部用）

1. 在原站点后台「网站设置 → ⬇️ 导出配置」得到整站 JSON
2. 部署一份新站点 → 后台「⬆️ 导入配置」载入该 JSON
3. 只需改这四处：
   - 网站名称 / Logo
   - 首屏文案（标题、副标题、徽标）
   - 联系方式（微信 · QQ · 客服二维码）
   - 各板块内容
4. 在「主题配色」切换风格，点「保存修改」即刻生效

> 导出的配置会把图片**内联成 data URI**，因此配置是自包含的：导入到新站点时会自动还原成图片文件，**不会出现裂图**。

想直接改出厂配置？编辑 `defaults.js` 后删除 `data/db.json` 重启即可。

---

## 📦 部署

两条路线可选：**Node 服务器**（后台完整可用）或**纯静态托管**（仅官网，后台入口自动隐藏）。
平台对比、持久卷要求与故障排查见 [docs/DEPLOY.md](docs/DEPLOY.md)。

单端口 HTTP 应用，无需数据库，任何支持 Node.js 的平台均可：

```bash
PORT=8080 node server.js     # 平台会注入 PORT，服务已监听 0.0.0.0
```

静态资源与 API 同端口提供，不存在跨域问题。

> ⚠️ **务必挂载持久卷**保存 `data/` 与 `public/uploads/`，否则重启后内容和图片都会丢失。建议前面加一层反向代理提供 HTTPS 与限流。

---

## 💾 数据与备份

- 内容全在 `data/db.json`，**建议定期用后台「导出配置」备份 JSON**
- 忘记密码：`node scripts/reset-password.js 新密码`（密码以哈希存储，不能再直接手改明文）
- 想回到初始状态：删除 `data/db.json` 重启，或后台点「恢复默认」

---

## 🗺 路线图

### 已完成 ✅

- 液态玻璃视觉体系与 4 套主题
- 8 处微交互
- 7 种板块类型与可视化后台
- 图片上传、密码修改、配置导入导出
- 管理密码 **scrypt 哈希**存储（Node 内置实现，零新增依赖）
- 登录失败限流：同一 IP 连续 5 次错误锁定 5 分钟
- 上传格式白名单：jpg / png / webp / gif（禁用 svg）
- **导出配置内联图片**，导入到新站点自动还原，不再丢图
- 导出配置损坏时的自动备份与降级保护

### 计划中 🚀

- CSRF 防护
- 多图批量上传与图片管理面板
- SEO 元数据与 Open Graph 卡片
- Dockerfile 与一键部署配置
- 内容版本历史与撤销

---

<a id="testing"></a>

## 🧪 测试

```bash
npm test          # 单元测试：73 项，约 5 秒，零新增依赖（Node 内置 node --test）
```

`npm test` 是唯一的强制门禁，CI 会在 Node 18 / 20 / 22 上各跑一遍。它覆盖的是真正有风险的层面：密码哈希与登录限流、上传格式白名单、内容读写与数据容错、静态快照不含凭据、以及「文档与代码是否还对齐」。

| 层 | 命令 | 依赖 | 说明 |
|----|------|------|------|
| 单元测试 | `npm test` | 无 | 强制门禁，`tests/` |
| E2E | `npm run test:e2e` | 需本地装 `@playwright/test` | 可选，未安装会自动跳过 |

E2E 在真实浏览器里验证桌面（1280×800）与窄屏（375×667）两种视口：首页渲染、四套主题、后台「改内容 → 保存 → 刷新仍在」闭环。详见 [docs/TESTING.md](docs/TESTING.md)。

---

## 🤝 贡献指南

欢迎 Issue 与 PR，详见 [CONTRIBUTING.md](CONTRIBUTING.md)；参与前请先阅读 [行为准则](CODE_OF_CONDUCT.md)。

提交前请确保：

1. Fork 本仓库并创建分支（`git checkout -b feature/xxx`）
2. `npm test` 全绿；改动涉及鉴权 / 上传 / 渲染时要补对应用例
3. 改动保持「零前端框架、零构建」的底线——不要引入 React/Vue 或打包器
4. 提交信息用简明中文或英文均可
5. 发起 Pull Request 并说明改动动机

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) —— 可自由使用、修改与商用，保留版权声明即可。

---

## 🙏 致谢与依赖

> **"If I have seen further, it is by standing on the shoulders of giants."**
> 我看得更远，是因为站在巨人的肩膀上。—— 送给支撑这个项目的开源社区与 Web 标准。

### 运行时依赖

| 项目 | 协议 | 说明 |
|------|------|------|
| [Node.js](https://nodejs.org) | MIT | 服务端运行时 |
| [Express](https://expressjs.com) | MIT | 静态托管与 REST API |

### 开发与测试工具链

| 项目 | 协议 | 说明 |
|------|------|------|
| [Playwright](https://playwright.dev) | Apache-2.0 | 官网与后台的端到端验证（桌面 / 移动端、四套主题渲染） |

### 视觉与设计灵感

液态玻璃（Liquid Glass）语言参考了当代操作系统中「材质感 + 景深」的设计取向；实现上完全依赖开放的 Web 标准 —— CSS `backdrop-filter`、`color-mix()`、自定义属性与 `@keyframes`，未使用任何 UI 框架。
