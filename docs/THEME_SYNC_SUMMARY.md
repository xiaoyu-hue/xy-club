# xy-club 主题同步计划 - 简化版

**版本**: v1.6.0  
**预计周期**: 4天  
**制定日期**: 2026-09-29

---

## 🎯 核心目标

将 xy-intro-card 的 8 套主题同步到 xy-club，实现：
- ✅ 两个项目主题风格完全一致
- ✅ 用户可以在 xy-club 使用相同的主题
- ✅ 后续维护统一，改一处即可

---

## 📊 当前 vs 目标

| 项目 | 当前主题数 | 目标主题数 |
|------|-----------|-----------|
| xy-intro-card | 8 套 | 8 套（不变） |
| xy-club | 4 套 | **8 套** (+4) |

**新增 4 套亮色商务主题**:
- 米白·晨雾 (neutral_morning)
- 浅灰·云影 (neutral_cloud)
- 燕麦·暖调 (neutral_oat)
- 藏蓝·经典 (neutral_navy)

---

## 📋 实施步骤

### 第 1 步：CSS 改造（1天）
- 添加 4 套新主题的 CSS 变量
- 统一变量命名规范

### 第 2 步：JavaScript 改造（1天）
- 更新 `main.js` 主题切换逻辑
- 更新 `admin.js` 主题选择器

### 第 3 步：测试验证（0.5天）
- 新增单元测试 `theme-sync.test.js`
- 新增 E2E 测试 `themes.spec.js`
- 确保 151 项测试全绿

### 第 4 步：文档同步（0.5天）
- 更新 ARCHITECTURE.md
- 更新 PRD.md
- 更新 CHANGELOG.md

---

## ✅ 验收标准

**功能**:
- [ ] 8 套主题均可正常切换
- [ ] 主题颜色与 xy-intro-card 完全一致
- [ ] 后台主题选择器显示所有主题
- [ ] 主题偏好自动保存

**测试**:
- [ ] `npm test` 151 项全绿
- [ ] E2E 测试全部通过

**文档**:
- [ ] 所有文档同步更新
- [ ] 主题配置表格完整

---

## 🔧 改动文件清单

**需要修改**:
- `public/css/style.css`
- `public/js/main.js`
- `public/js/admin.js`
- `defaults.js`
- `tests/theme-sync.test.js` (新增)
- `e2e/themes.spec.js` (新增)
- `docs/ARCHITECTURE.md`
- `docs/PRD.md`
- `CHANGELOG.md`

**不需要修改**:
- `server.js`
- `public/index.html`
- `public/admin.html`

---

## ⚡ 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/xiaoyu-hue/xy-club.git
cd xy-club

# 2. 安装依赖
pnpm install

# 3. 运行测试
npm test

# 4. 启动服务
node server.js

# 5. 访问 http://localhost:3000
```

---

## 💡 关键决策

**Q: 是否需要修改 CSS 变量命名？**  
A: 需要，统一为 xy-intro-card 的命名规范

**Q: 旧主题是否会失效？**  
A: 不会，完全向后兼容

**Q: 是否需要数据库迁移？**  
A: 不需要，旧配置自动适配

---

**下一步**: 确认计划后开始实施
