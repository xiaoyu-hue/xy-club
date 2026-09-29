# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.6.1] - 2026-09-29

### 🐛 Bug Fixes

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

- Full suite: **123 tests / 39 suites** green (Phase 0 added 9 security-header cases; Phase 1 added 14 input-validation cases, 2 of which are the custom / gallery regressions)

---

## [1.5.1] - 2026-09-28

### 🔒 Security

- **CSRF protection (S7)**: Write operations (POST/PUT) now require a CSRF token in the x-csrf-token header. Tokens are issued per-session via GET /api/csrf-token and expire with the session. Login, /api/csrf-token, and /api/health are exempt.

### 🔧 Fixed

- ESLint unused variable cleanup + docs sync for v1.5.1

### 🧪 Tests

- Full suite: **109 tests / 36 suites** green

---

## [1.5.0] - 2026-09-27

### ✨ Features

- **Global custom fields**: Settings now support arbitrary key-value pairs in `settings.customFields`. The free-text section (`type: "custom"`) supports `{{custom.key}}` placeholders that are resolved at render time against these fields.
- **Price original strikethrough**: Service items can now include an `original` price field; when present, it renders as a strikethrough next to the current price.
- **Free text section type**: New `type: "text"` section for arbitrary paragraph content.

### 🧪 Tests

- Added contract-defaults.test.js to verify type ↔ render branch ↔ theme ↔ admin option consistency
- Full suite: **95 tests / 33 suites** green

---

## [1.4.4] - 2026-09-26

### 🔧 Fixed

- CI: Removed `--test-timeout` flag unsupported by Node 18. Node 18/20/22 matrix now all green.

### 🧪 Tests

- Full suite: **95 tests / 33 suites** green

---

## [1.4.3] - 2026-09-25

### 📚 Documentation

- Completed doc system: DOC_SYNC / DECISION_REVIEW / ADR×4 / PRD / AUTHOR / ARCHITECTURE en
- Added CODE_OF_CONDUCT / CONTRIBUTING
- Added SECURITY.md / SECURITY.en.md
- Added docs/adr/README.md

### 🧪 Tests

- Full suite: **95 tests / 33 suites** green

---

## [1.4.2] - 2026-09-24

### 🔧 Fixed

- CI: Removed `--test-timeout` flag unsupported by Node 18

### 🧪 Tests

- Full suite: **95 tests / 33 suites** green

---

## [1.4.0] - 2026-09-23

### ✨ Features

- **Automated testing**: 73 `node --test` gate cases + optional E2E (Playwright, not in dependencies)
- **E2E smoke tests**: Homepage render, theme switching, 375px narrow screen, static mode
- **CI matrix**: Node 18/20/22

### 🧪 Tests

- Full suite: **73 tests / 26 suites** green

---

## [1.3.0] - 2026-09-20

### 🔒 Security

- Admin password now stored as scrypt hash (Node built-in crypto, zero new deps). Plaintext passwords auto-upgraded on first start.
- Admin panel hidden when not logged in.
- README API table corrected.

### 🧪 Tests

- Added password.test.js, auth.test.js, resilience.test.js
- Full suite: **59 tests / 21 suites** green

---

## [1.2.0] - 2026-09-18

### ✨ Features

- Section type whitelist + prototype pollution defense
- Settings field whitelist
- Upload format whitelist (jpg/png/webp/gif, ≤8MB, SVG rejected)
- HTTP security headers (nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP)

### 🧪 Tests

- Full suite: **45 tests / 16 suites** green

---

## [1.1.0] - 2026-09-15

### ✨ Features

- Static fallback: `scripts/build-static.js` generates `public/content.json` (password stripped) for GitHub Pages
- Backend entry auto-hidden in static mode

### 🧪 Tests

- Added static-build.test.js
- Full suite: **31 tests / 11 suites** green

---

## [1.0.0] - 2026-09-14

### 🎉 Initial Release

- Club website template with Liquid Glass visual style
- 4 themes: aurora / ocean / mist / sunset
- 8 micro-interactions
- Visual admin backend
- Image upload management
- Configuration export/import

### 🧪 Tests

- Full suite: **18 tests / 8 suites** green
