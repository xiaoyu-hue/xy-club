# 贡献指南

感谢你愿意为这个项目花时间。这是一套**给俱乐部用的官网模板**，所以任何改动请先想一个问题：**它会不会让"不懂代码的人"更难用？**

> 本项目由 AI 辅助开发，作者为零编程基础的个人开发者。文档和代码都可能存在疏漏，欢迎直接指出。

---

## 行为准则

参与本项目即表示你同意遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

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
```

### 项目结构

```
xy-club/
├── server.js            # Express：静态托管 + REST API + 鉴权 + 上传
├── defaults.js          # 出厂内容（改这里等于改模板默认值）
├── scripts/
│   └── build-static.js  # 导出 public/content.json 静态快照
├── data/db.json         # 运行时内容（自动生成，已 gitignore）
├── docs/                # 架构、板块字段、部署指南
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

本项目没有单元测试套件，靠端到端验证。提交前请至少手动确认：

- [ ] 官网首页正常渲染，无控制台报错
- [ ] 四套主题都能正常切换且对比度可读
- [ ] 后台登录、新增板块、保存、刷新后内容一致
- [ ] 移动端窄屏（375px）下布局未破版
- [ ] 鼠标设备的微交互（高光 / 倾斜）未误触发在触屏上

改动涉及视觉时，建议用 Playwright 截图对比桌面与移动端两种视口。

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
