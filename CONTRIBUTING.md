# 贡献指南

感谢你愿意为这个项目花时间。这是一套**给俱乐部用的官网模板**，所以任何改动请先想一个问题：**它会不会让"不懂代码的人"更难用？**

> 本项目由 AI 辅助开发，作者为零编程基础的个人开发者。文档和代码都可能存在疏漏，欢迎直接指出。

---

## 行为准则

参与本项目即表示你同意遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。涉及安全相关的改动，请先阅读 [SECURITY.md](SECURITY.md)。

---

## 如何贡献

### 1. 报告 Bug

提 Issue 时请附上：

- **现象**：看到了什么
- **期望**：本来应该是什么
- **复现步骤**：越具体越好（改了哪个板块、点了哪个按钮）
- **环境**：Node 版本、浏览器、部署方式（本地 / 静态托管 / 服务器）
- **截图**：视觉类问题强烈建议附一张

### 2. 提出功能建议

请说明**你想解决什么问题**，而不只是想要什么功能。模板类项目的常见拒绝理由：

- 会引入运行时依赖或构建步骤
- 只对某一个俱乐部有用，不具备通用性
- 可以通过改 `defaults.js` 解决，不需要改代码

### 3. 提交 Pull Request

1. Fork 本仓库并创建分支（`git checkout -b feature/xxx`）
2. 改动完成后自查下面两条红线
3. 提交并发起 PR，正文按下方模板填写
4. 保持 PR 聚焦：一个 PR 只解决一件事

#### PR 描述模板

```markdown
## 变更内容
（改了什么，列出涉及文件）

## 变更原因
（为什么要改，解决什么问题）

## 测试说明
（你怎么验证的：本地启动 / Playwright / 手动点击路径）

## 安全影响
（是否涉及鉴权、密码、文件上传、用户输入渲染；如有，说明防护方式）

## 关联 Issue
（Fixes #123）
```

---

## 开发环境设置

### 环境要求

| 项目 | 要求 |
|------|------|
| Node.js | ≥ 18 |
| 包管理器 | pnpm（推荐）或 npm |
| 数据库 | 无 |

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/xiaoyu-hue/xy-club.git
cd xy-club

# 安装依赖（只有一个：express）
pnpm install

# 启动服务
node server.js        # 官网 http://localhost:3000 ｜ 后台 /admin

# 默认管理密码
xy888888
```

```bash
# 生成静态快照（纯静态托管用）
node scripts/build-static.js

# 跑单元测试（提交前必须全绿）
npm test
```

### 项目结构

```
xy-club/
├── server.js            # Express：静态托管 + REST API + 鉴权 + 上传
├── defaults.js          # 出厂内容（改这里等于改模板默认值）
├── scripts/
│   ├── build-static.js  # 导出 public/content.json 静态快照
│   └── reset-password.js# 重置后台密码（密码是哈希，不能直接改 db.json）
├── tests/               # 单元测试（node --test，零依赖）
├── e2e/                 # E2E（可选，需本地装 @playwright/test）
├── data/db.json         # 运行时内容（自动生成，已 gitignore）
├── docs/                # 架构、板块字段、部署、测试指南
└── public/
    ├── index.html       # 官网
    ├── admin.html       # 后台
    ├── css/             # style.css ｜ admin.css
    └── js/              # main.js ｜ admin.js
```

---

## 代码规范

### 两条红线（违反会被直接拒绝）

1. **零前端框架、零构建**：不要引入 React / Vue / Svelte，不要引入打包器。这个模板的价值就在于「改完刷新就能看到」。
2. **不要新增运行时依赖**：`express` 是唯一的运行时依赖，其余一律不许加。开发期工具（如 Playwright）另算，但请说明理由。

### 提交信息规范

```bash
feat: 新增图片集板块的批量上传
fix: 修复浅色主题下页脚对比度不足
docs: 补充部署指南的持久卷说明
chore: 升级 express 到 4.21
refactor: 抽出主题应用逻辑为 applyTheme()
test: 补充后台板块排序的 E2E 用例
```

| 前缀 | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复缺陷 |
| `docs` | 仅文档改动 |
| `chore` | 依赖、构建、杂项 |
| `refactor` | 重构，不改变行为 |
| `test` | 测试相关 |

### 代码风格

- 与现有代码保持一致：2 空格缩进、分号、单引号
- 函数命名用动词开头（`renderSections` / `bindTilt` / `applyTheme`）
- 新增渲染逻辑请放进 `main.js` 对应的 `render*` 系列，新增交互放进 `bind*` 系列
- 涉及安全相关改动（鉴权、上传、用户输入渲染）**必须先说明防护方式**

### CSS 规范

- 颜色一律走主题变量（`var(--ink)` / `var(--glass-1)` / `var(--accent)`），**禁止硬编码颜色**
- 新增主题需同时补齐 `html[data-theme="xxx"]` 下的全部变量，四套主题不可缺项
- 玻璃效果统一用 `.glass` 类，不要各写一套 `backdrop-filter`
- 动画必须尊重 `prefers-reduced-motion`

---

## 测试要求

完整说明见 [docs/TESTING.md](docs/TESTING.md)。这里只讲你提交前必须做的事。

### 必跑：单元测试

```bash
npm test        # node --test，零新增依赖，约 5 秒
```

这是**唯一强制门禁**。它用 Node 内置测试运行器，不需要装任何额外东西，CI 会在 Node 18 / 20 / 22 上各跑一遍。

改动了什么，就要补对应的用例：

| 你改了 | 该动哪个文件 |
|--------|-------------|
| 密码 / 登录 / 会话 | `tests/auth.test.js`、`tests/password.test.js`、`tests/rate-limit.test.js` |
| 内容读写 / 导入导出 | `tests/content-api.test.js` |
| 图片上传 | `tests/upload.test.js` |
| 静态托管 / 资源路径 | `tests/static-build.test.js` |
| 数据读写容错 | `tests/resilience.test.js` |
| 板块类型 / 主题 | `tests/contract-defaults.test.js` |
| 版本号 / README / API 表 | `tests/docs-sync.test.js` |

用例一律通过 `tests/harness.js` 拿**临时数据目录**，绝不会碰你本地的 `data/db.json`。

### 选跑：E2E

```bash
npm i -D @playwright test      # 只进 devDependencies
npx playwright install chromium
npm run test:e2e
```

未安装时 `npm run test:e2e` 会打印提示并退出 0（跳过，不算失败），所以你不用担心命令炸掉。

### 仍然要手动确认的部分

自动化覆盖不到的，请自己看一眼：

- [ ] 四套主题下文字对比度都可读（机器只能验证变量非空，读不读得出来得靠眼睛）
- [ ] 鼠标设备的微交互（高光 / 倾斜）未误触发在触屏上
- [ ] 改动涉及视觉时，用 Playwright 截图对比桌面与移动端两种视口

### 纪律

- 现有测试是安全网，**不要因为"更干净"就删**
- 测试失败时**禁止先改测试逃避**：先判断是真 bug、依赖了废弃实现，还是有意为之，并把判断写进提交信息
- 文档里写测试数量时必须以 `npm test` 实际输出为准

---

## 文档贡献

改了行为就必须同步文档，这是硬要求：

| 改动 | 需要更新的文件 |
|------|----------------|
| 功能增删 | `README.md` + `README.en.md` + `CHANGELOG.md` + `CHANGELOG.en.md` |
| 板块字段 | `docs/SECTIONS.md` |
| 部署方式 | `docs/DEPLOY.md` |
| 架构 / 数据流转 | `docs/ARCHITECTURE.md` |

中英文文档必须**同时更新**，章节一一对应，不允许只改一半。

---

## 常见问题

**Q：我可以加一个新的前端框架吗？**
不能。零框架是这个模板的核心取舍，请见上方红线。

**Q：我想改默认内容，需要改代码吗？**
大概率不需要。直接在后台改，或编辑 `defaults.js` 后删除 `data/db.json` 重启。

**Q：我可以新增一个板块类型吗？**
可以，但需要同时改四处：`defaults.js`（示例数据）、`public/js/main.js` 的 `renderSection`、`public/js/admin.js` 的编辑表单、`docs/SECTIONS.md`。

**Q：我的 PR 多久会被审查？**
作者是一个人且设备有限，通常几天内回复，请耐心。

---

## 致谢

每一个 Issue、PR 和指正都在让这个模板更靠谱。谢谢你。
