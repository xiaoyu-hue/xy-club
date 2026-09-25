# 更新日志

本文件记录 XY 俱乐部官网模板的所有重要变更。
格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/)。

> ⚠️ 提示：本项目由 AI 辅助开发。后台鉴权为单密码机制且密码明文存储，尚未经过专业安全审计，部署后请第一时间修改默认密码。

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
