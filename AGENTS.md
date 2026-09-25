# AGENTS.md — XY 俱乐部官网模板 AI 协作规则

本文件约束所有在本仓库工作的 AI Agent。作者无编程基础，依赖 Agent 协作开发。违反本规则视为不合格交付。

## 一、项目本质

这是一个**可复用的俱乐部官网模板**（Express 4 + 原生 HTML/CSS/JS），不是空白脚手架，也不是某个俱乐部的定制站。禁止把任何改动当作"重写许可"。

**核心取舍**：零前端框架、零构建、单运行时依赖（`express`）、单个 JSON 文件存储。
这个取舍是为了让"不懂代码的人改完内容刷新就能看到"——任何削弱它的改动都必须先得到作者同意。

当前形态：
- 7 种板块类型、4 套主题、8 处微交互
- 官网数据驱动，后台可视化编辑
- 支持纯静态托管（回退读 `content.json`）

源码分层：
- `server.js` — 静态托管 + REST API + 登录鉴权 + 图片上传
- `defaults.js` — 出厂内容（改这里等于改模板默认值）
- `public/js/main.js` — 官网渲染（`render*`）与微交互（`bind*`）
- `public/js/admin.js` — 后台逻辑
- `public/css/style.css` — 官网样式与主题变量；`admin.css` — 后台样式

## 二、第一原则

1. **禁止 Big Bang Rewrite**。只允许：改一个模块 → 手动验证 → 再改下一个。
2. 优先级（从高到低）：
   **不破坏用户已有 `data/db.json` 数据 > 零框架零构建 > 中英文文档同步 > 视觉一致性 > 正确性 > 性能 > 代码漂亮**。
3. 不确定怎么改时，先做三件事再动手：
   - 读现有实现（不要凭印象）
   - 确认数据契约（`data/db.json` 的字段名）
   - 确认涉及哪几套主题（共 4 套，缺一即为破版）

## 三、安全红线（最重要）

1. **禁止引入前端框架与打包器**：React / Vue / Svelte / Vite / Webpack 一律不许。
2. **禁止新增运行时依赖**：`express` 是唯一的运行时依赖。开发期工具需说明理由。
3. **禁止把凭据写入版本库或日志**：`data/db.json` 含明文管理密码，已在 `.gitignore` 中；任何时候都不要把密码、token 写进日志、注释或文档。
4. **涉及鉴权 / 上传 / 用户输入渲染的改动，必须先说明防护方式**：
   - 用户输入渲染到 DOM 前必须转义（现有 `esc()` 函数）
   - 上传必须限制大小（当前 ≤8MB）
   - 新增 API 必须明确是否需要鉴权
5. **改动 `data/db.json` 结构必须提供向后兼容**：旧数据缺失新字段时要有默认值，禁止让用户的内容凭空消失。

## 四、改动清单（按改动类型）

| 你要做的事 | 必须同步修改的文件 |
|------------|--------------------|
| 新增板块类型 | `defaults.js`（示例数据）+ `main.js` 的 `renderSection` + `admin.js` 的编辑表单 + `docs/SECTIONS.md` |
| 新增主题 | `style.css` 的 `html[data-theme="xxx"]` 全部变量 + `admin.js` 的主题选项 + README 主题表 |
| 新增微交互 | `main.js` 新增 `bind*` 函数并在 `init()` 注册 + 尊重 `prefers-reduced-motion` + 触屏降级 |
| 新增 API | `server.js` + README 的 API 表 + 明确鉴权要求 |
| 任何行为变更 | `README.md` + `README.en.md` + `CHANGELOG.md` + `CHANGELOG.en.md` |

## 五、视觉规范

- 颜色一律走主题变量（`var(--ink)` / `var(--glass-1)` / `var(--accent)`），**禁止硬编码颜色**
- 玻璃效果统一复用 `.glass`，不要各写一套 `backdrop-filter`
- 四套主题必须同时补齐，任一缺失视为破版
- 动画必须尊重 `prefers-reduced-motion`；高光 / 倾斜仅在鼠标设备生效

## 六、提交规范

```bash
feat: 新增图片集板块的批量上传
fix: 修复浅色主题下页脚对比度不足
docs: 补充部署指南的持久卷说明
chore: 升级 express 到 4.21
refactor: 抽出主题应用逻辑为 applyTheme()
```

- 一个提交只做一件事，禁止把重构和功能改动混在一起
- **中英文文档必须同时更新**，章节一一对应，不允许只改一半
- 提交作者身份：`xiaoyu-hue <220487718+xiaoyu-hue@users.noreply.github.com>`

## 七、常见错误（已发生过，不要重犯）

- 把 `README_EN.md` 写成 `README_EN.md` —— 正确命名是 **`README.en.md`**（小写 `.en`）
- 在 README 中用 emoji 标题的自动锚点做跳转 —— GitHub 生成的锚点不稳定，必须使用显式 `<a id="...">`
- 在私有仓库 README 中使用 `github/v/release` 等徽章 —— shields.io 取不到数据，显示 inaccessible，应使用静态徽章
- 改了 `.stat span` 之类的宽泛选择器导致数字换行 —— 样式选择器要收窄到直接子元素
- 忘记 `public/uploads/` 与 `data/` 在无持久卷环境下会丢失
- 直接编辑 `data/db.json` 改密码 —— 密码是 **scrypt 哈希**，必须用 `node scripts/reset-password.js 新密码`

## 八、交付前自检

- [ ] 官网首页无控制台报错
- [ ] 四套主题均正常渲染且文字可读
- [ ] 后台登录 → 编辑 → 保存 → 刷新，内容一致
- [ ] 375px 窄屏未破版
- [ ] 中英文文档已同步，CHANGELOG 已追加条目
- [ ] 无新增运行时依赖，无引入前端框架
