# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.7.1] - 2026-10-01

### 🔧 Fixes

- **Removed the conflicting `eslint.config.js`**: it coexisted with `.eslintrc.js` and contained the nonexistent rule `no-new-promises`, the root cause of the crashing `npm run lint`. The deletion was missed in v1.7.0 and is restored here (config unified to `.eslintrc.js`)

---

## [v1.7.0] - 2026-10-01

### 🔒 Security

- **Default-password hardening (Breaking)**: Removed the hardcoded weak default `xy888888`. The admin password now comes from the `ADMIN_PASSWORD` env var; if unset, the server generates a strong random password on first start and prints it to the console once. **After upgrading, set `ADMIN_PASSWORD` or read the new password from the startup log**
- **Login rate-limit bypass closed**: `TRUST_PROXY` default changed from `1` to `false`; a spoofed `X-Forwarded-For` header can no longer bypass the login rate limit (previously one HTTP header allowed unlimited brute force)
- **New logout endpoint** `POST /api/logout`: invalidates the token immediately instead of waiting for the 7-day TTL
- **Tighter CSP**: removed script/style `unsafe-inline`; added `Strict-Transport-Security` and `object-src 'none'`
- **Upload validation**: added file-signature (magic-byte) checks (rejecting scripts disguised as images), a per-IP upload rate limit, and disk quota on top of the extension whitelist
- **Audit log**: key writes (password change / reset / logout / upload) are written to the server log

### 🔧 Fixes

- **Accessibility**: fixed the unclosed `<main>` tag in `index.html` (footer / modal / floating button were wrongly nested inside `main`); added visible keyboard focus styles to admin inputs; modals now close on ESC and manage focus
- **Robustness**: unknown section types show a clear warning; `build-static` reads the real `data/db.json` first; the site shows a visible message when loading fails
- **Code standards**: fixed the crashing `npm run lint` (two conflicting ESLint configs plus one nonexistent rule); now zero errors

### 🧪 Tests

- Total: 140 → **158 cases / 45 suites**, 100% pass rate
- Added: XSS-escaping regression, logout invalidation, unauthenticated upload, CSRF cross-session binding, session TTL, write-lock serialization, API-doc two-way consistency guard
- **CI**: added a lint quality gate; deploy now depends on tests passing

### 📚 Documentation

- Fixed `docs/API.md` / `.en.md`: added the required `currentPassword` param for `/api/reset`, added `/api/logout`, removed the obsolete default-password example
- Fixed `docs/ARCHITECTURE.md` / `.en.md`: cache layer, password storage, theme count
- Fixed `GLOBAL.md` factual errors (SQLite → single JSON file, test framework), repaired dead doc links
- Unified test counts across the repo; unified EN/ZH themes to 8 and section types to 8

### ⚠️ Breaking Changes

- **Admin password mechanism changed**: there is no built-in default password anymore. After upgrading you must set the `ADMIN_PASSWORD` env var, or read the auto-generated random password from the first startup log, otherwise you cannot log into the admin

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
