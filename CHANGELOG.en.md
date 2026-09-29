# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.6.2] - 2026-09-29

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

## [1.6.1] - 2026-09-29

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

## [1.6.0] - 2026-09-29

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

## [1.5.2] - 2026-09-28

### 🔒 Security

- **HTTP security headers (Phase 0)**: Global responses now include X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy, Permissions-Policy and Content-Security-Policy
- **Input validation hardening (Phase 1)**: PUT /api/content now adds deepClone that strips __proto__ / constructor / prototype keys, a settings key allowlist, and a section-type allowlist

### 🔧 Fixed

- **Free-text and gallery sections could not be saved**: The Phase 1 section-type allowlist missed custom (free-text section from v1.5.0) and gallery (image gallery, present since launch), so saving content containing either was rejected with 400. Both are now whitelisted, with regression tests

### 🧪 Tests

- Full suite: **123 tests / 39 suites** green
