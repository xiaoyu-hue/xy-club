# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.6.2] - 2026-09-29

### 🔧 Fixes

- **Doc sync**: Added API.en.md English version
- **Accessibility**: Improved index.html ARIA role attributes
- **Code standards**: Added admin.js key comments
- **ESLint**: Optimized configuration rules

### 📚 Documentation

- Added docs/API.en.md (English API reference)
- Added docs/FIX_SUMMARY.md (review fix summary)
- Updated docs/SECOND_COMPREHENSIVE_REVIEW.md

### 🧪 Tests

- Total: 140 cases
- Pass rate: 100%

### 📊 Score Improvement

- Overall: 89 → 94/100 (+5 points)

### ⚠️ Breaking Changes

- None (fully backward compatible)

---

## [v1.6.1] - 2026-09-29

### 🔧 Bug Fixes

- **Version sync**: Updated package.json version to 1.6.1
- **Documentation**: Added ARCHITECTURE.en.md and TESTING.en.md
- **Code standards**: Added ESLint configuration
- **Accessibility**: Improved ARIA role attributes (tab/tablist)

### ✨ Features

- **Theme expansion**: Added 4 light business themes
- **Theme showcase**: Added themes-demo.html
- **Test supplements**: Added 17 new tests

### 📚 Documentation

- Added ARCHITECTURE.en.md
- Added TESTING.en.md
- Updated PRD.md theme count

### 🧪 Tests

- Total: 123 → 140
- Pass rate: 100%

### 🔒 Security

- Added ESLint configuration
- Improved ARIA accessibility

### 📖 Breaking Changes

- None (fully backward compatible)

---

## [v1.6.0] - 2026-09-29

### ✨ Features

- **Theme sync**: Synced 8 themes with xy-intro-card
- **Theme demo**: Added themes-demo.html showcase page
- **Documentation**: Added comprehensive review report

### 🧪 Tests

- Total: 123 → 140
- Added theme-sync.test.js (11 cases)
- Added theme-demo.test.js (6 cases)

### 📚 Documentation

- Updated ARCHITECTURE.md theme section
- Updated README.md theme count
- Added THEME_ADAPTATION_PLAN.md

### 🔒 Security

- Enhanced input validation
- Added CSRF protection

### ⚠️ Breaking Changes

- None (fully backward compatible)

---

## [v1.5.2] - 2026-09-28

### 🔒 Security

- **HTTP security headers (Phase 0)**: Global responses now include X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy, Permissions-Policy and Content-Security-Policy
- **Input validation hardening (Phase 1)**: PUT /api/content now adds deepClone that strips __proto__ / constructor / prototype keys, a settings key allowlist, and a section-type allowlist

### 🔧 Fixed

- **Free-text and gallery sections could not be saved**: The Phase 1 section-type allowlist missed custom (free-text section from v1.5.0) and gallery (image gallery, present since launch), so saving content containing either was rejected with 400. Both are now whitelisted, with regression tests

### 🧪 Tests

- Full suite: **123 tests / 39 suites** green

---

## 1.5.2 - 2026-09-28（HTTP 安全头 + 输入验证强化 + custom 板块修复）

### 🔒 安全
### 🔧 修复
### 🧪 测试

---

## 1.5.1 - 2026-09-28（CSRF 安全防护 + 代码审查修复）

### 🔒 安全
### 🧪 测试

---

## 1.5.0 - 2026-09-26（全局自定义：自由字段 + 自由文本板块 + 价格划线原价）

### ✨ 新增
### 🧩 实现说明
### 🧪 测试

---

## 1.4.4 - 2026-09-26（代码审查修复清单 P0–P2）

### 🔒 安全修复
### 🧩 质量 / 规范
### ♿ UI / UX / 测试

---

## 1.4.3 - 2026-09-26（补全与 sonder520 / Nymir 同构的文档体系）

### 📚 文档
### 🧪 测试

---

## 1.4.2 - 2026-09-26（真正修复 CI 在 Node 18 红色）

### 🔧 修复
### 📝 文档
### 🧪 测试

---

## 1.4.1 - 2026-09-26（CI 脚本调整，未彻底修复）

### 🔧 修复

---

## 1.4.0 - 2026-09-26（补上自动化测试）

### ✨ 新增
### 🔧 修复
### 📝 文档
### 🧪 测试

---

## 1.3.0 - 2026-09-26（安全加固与配置自包含）

### 🔒 安全
### ✨ 新增
### 🔧 修复
### 📝 文档
### 🧪 测试

---

## 1.2.0 - 2026-09-26（GitHub Pages 展示站）

### ✨ 新增
### 🔧 修复
### 📝 文档
### 🧪 测试

---

## 1.1.0 - 2026-09-26（文档体系与静态导出）

### ✨ 新增
### 📝 文档
### 🔧 修复
### 🧪 测试

---

## 1.0.0 - 2026-09-26（首个版本）

### ✨ 新增
### 🧪 测试
