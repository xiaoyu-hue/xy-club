# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.10.0] - 2026-10-01

**Theme: image licensing compliance** — remove third-party images of unverifiable provenance, replace them with original works, and add an automated gate to prevent recurrence.

### 🔒 Security / Compliance (the core of this release)

- **Removed all 16 third-party images**: the "临界摄影" case's 16 images were recorded as Unsplash free-commercial, but an audit showed the ledger could not prove itself — the recorded URLs used **12-character hex IDs**, whereas Unsplash photo IDs are actually **11-character short codes** (`varchar(11)`). The format does not match, so the links cannot resolve. Additionally, **12 of the 16 were never referenced by any case** — dead weight with no purpose.
  - The audit process and conclusions are kept in an internal document (audit reports are not committed, per project policy).
- **Replaced with original photography owned by the project author**: 4 new original botanical / natural-light works with clear ownership, free of any third-party restrictions.
  - Repository image size dropped from roughly **930KB to 160KB**.

### ✨ Case rework

- **Repositioned the "临界摄影" case**: from a portrait studio (wedding documentary / family portraits / commercial portraiture) to a **natural-light photography** studio focused on botanical still life, natural-light documentary, and solar-term themes — consistent with the new images.
- **Unified case naming**: the original had `siteName: 临界摄影` while the body text said "拾光摄影"; everything is now "临界摄影".
- **Rewrote all copy**: portfolio captions, service packages, shooting workflow, testimonials, FAQ, and about section — all rebuilt around the new positioning.
- Renamed image files to semantic names (e.g. `work-dew-white.webp`) instead of the vague `photo-work-1.webp`.

### ✅ Tests

- **Added `tests/credits.test.js` (11 cases)**: turns licensing compliance into executable assertions —
  - ledger list and image directory must match **in both directions** (no orphan files, no unlisted files);
  - images referenced by case JSON **must actually exist** (no broken references);
  - the ledger **must not contain 12-character hex pseudo-Unsplash IDs** (no fabricated ledgers);
  - per-image size ceiling.
  - Validated with deliberate-break experiments: orphan file / broken reference / re-inserted pseudo ID were all caught.
- Test scale **223 cases / 60 suites → 236 cases / 63 suites**.

### 🐛 Fixed

- **Rewrote `scripts/gen-cases.js` to fix a defect that kept corrupting live data**:
  - The script used to be a "case data generator" — case content was hand-written inside the script and then written over the JSON files. But the in-script content had drifted badly from the live JSON (mismatched case names, missing `settings.fictional`), so **every run silently corrupted live data**, including deleting the fictional-content declaration from demo cases (a compliance requirement enforced by tests).
  - It is now a **validation + formatting tool**: the JSON is the single source of truth, and the script only validates structure (section-type whitelist, required fields, credential scan, manifest consistency) and normalises formatting — it **never writes content**.
  - The script is now **idempotent**: repeated runs produce no diff. A `--check` mode (validate without writing) was added for CI.

### 📝 Docs

- Completed the image copyright audit: per-image provenance checks, risk grading, and remediation decisions (**the audit report is not committed, per project policy**; conclusions are folded into this CHANGELOG and `CREDITS.md`).
- Rewrote `public/cases/CREDITS.md`: from a third-party stock ledger to an original-works statement with clear ownership and usage scope.
- **Follow-up**: corrected 4 remaining stale licensing claims — `README.en.md`, `docs/PRD.en.md`, the user-visible footer of `public/themes-demo.html`, and the image-source entries in `docs/adr/ADR-005.md` (original text kept, change note appended — history is not rewritten).
- `docs-sync.test.js` only checked version numbers and CHANGELOGs, so it could not catch content drift — assertions were added to `credits.test.js` to prevent this class of miss from recurring.

---

## [v1.9.0] - 2026-10-01

**Theme: admin mobile usability** — make the admin panel genuinely usable on a phone: smooth, tappable, and capable of uploading images.

### ⚡ Performance (the core of this release)

- **Removed `backdrop-filter` frosted glass**: the admin panel had 25 elements using `backdrop-filter: blur(20px)`, stacked on top of continuously animating blurred blobs, forcing the phone GPU to run a dozen-plus real-time Gaussian blurs every frame. Replaced with "translucent solid colour + hairline border + inner highlight"; the visual difference is negligible.
  - Measured (CPU throttled 4× to emulate a phone): **FPS 46.7 → 60.2**, longest frame **30.7ms → 17.4ms** (−43%).
- **Removed the `blur(80px)` background blobs and their continuous animation**: replaced with plain radial gradients (rasterised once and cached), which look the same soft-light effect.
- **Item add/edit/delete now update the DOM locally**: previously "add item", "move up", "move down", and "delete" all called `renderSecList()` and rebuilt the entire section list's `innerHTML`. They now touch only the affected node (`appendChild` / `removeChild` / `insertBefore`) and re-index the `data-i` attributes.
  - Measured (CPU throttled 4×): add item **4.1ms**, delete item **0.72ms**.

### ✨ Added: image upload for three more section types

Previously only the «🖼 Gallery» section could upload images — and **the default dataset contains no gallery section at all**, so users never saw an upload entry point. Now:

| Section | Graphic slot | Accepted forms |
|---|---|---|
| 🃏 Cards | icon | emoji **or** image |
| 💖 Testimonials | avatar | emoji **or** image |
| 📌 Notice | icon | emoji **or** image |

- A **📤 Upload** button and a **↺ Remove** button (to revert an image back to an emoji) now sit beside the graphic field.
- A **live preview** next to the input: emoji renders as text, an image path renders as a thumbnail.
- The front end decides per value whether to render text or an `<img>`; **if the image fails to load it falls back to the emoji**, so no broken images appear.
- **Fully backward compatible**: legacy data (emoji only) renders exactly as before.

### 📱 Responsive rework

- Breakpoints expanded from **1 to 4**: `≤1024px` / `≤860px` / `≤640px` / `≤400px`.
- From `≤640px`: forms become single column; item rows switch from a multi-column grid to **vertical stacking** (the inputs used to be squeezed into near-unusable slivers).
- Touch targets enlarged to **≥44px** (Apple HIG / WCAG 2.5.5).
- Top bar and sidebar now use opaque backgrounds (after removing the blur, a translucent bar let scrolling content bleed through as a "ghost" artefact).
- Added `prefers-reduced-motion` support: all non-essential motion is disabled when the OS "Reduce Motion" setting is on.
- Added `@media (hover: none)` handling: touch devices get `:active` feedback instead of `:hover` (touch has no hover, so the old CSS left states "stuck").

### 🧪 Tests

- Added `tests/admin-perf.test.js` (18 cases): turns the above performance and responsive constraints into executable assertions, preventing future changes from reintroducing the blur.
- Total tests **205 → 223**, all passing.

### 🐛 Fixed

- Fixed scrolling content bleeding through the admin top bar and sidebar as a ghost image (a side effect of removing `backdrop-filter`; solved with opaque backgrounds).

---

## [v1.8.0] - 2026-10-01

**Theme: Multi-case demo site** — one template now showcases five website cases across five industries, proving it is not "club-only".

### ✨ Added

- **Multi-case switching (user-visible)**: a case dropdown in the header of the live demo lets you switch between **5 reference cases** instantly, without a page reload
  - 💎 XY Club (companion service · the real site)
  - ☕ Qingwu Coffee (specialty coffee) · ⚖️ Henghe Law Firm (legal services)
  - ☁️ Cloudpivot (SaaS product) · 📷 Shiguang Photo (photography studio)
  - Switching writes browser history, so **back / forward work**; links are shareable (`?case=<id>`)
- **Multi-case architecture (ADR-005)**: content addressing expanded from a single `data/db.json` to "default site + multiple read-only case snapshots". Cases are plain static JSON and need no server to switch, so **purely static hosting such as GitHub Pages works too**
- **Case overview page**: `themes-demo.html` upgraded into a combined "cases + themes" overview with 5 clickable case cards
- **Image credits ledger** `public/cases/CREDITS.md`: all 16 demo images logged per-file with original page, license and download date, keeping licensing traceable
- **Case contract tests** `tests/cases.test.js` (29 cases): structure, allowed section types, zero-tolerance credentials, fictional disclosure, image provenance, relative paths, theme validity and `heroStats` number format are all enforced in CI
- **Case isolation guard** `tests/case-isolation.test.js` (13 cases): keeps the "static cases" and "server content" paths from ever crossing. Two layers — static checks (the server must not reference `cases/`; `DB_FILE`/`UPLOAD_DIR` must not fall inside it; the frontend fallback must try the API first) plus behavioural checks (actually runs the server to prove editing a case file leaves the API untouched and that saving server-side writes nothing into `cases/`). Proven effective via deliberate-break experiments: the tests do go red when a violation is introduced
- **Build-time case validation**: besides generating the snapshot, `scripts/build-static.js` now validates the `public/cases/` assets and **exits with code 1 to block deployment** if anything fails

### 🔧 Fixed

- **Demo case hero stats rendered as 0**: the law / SaaS / photography cases wrote their `heroStats` numbers mid-phrase (e.g. "执业律师32人", "平均提速40%"), but the frontend `parseStat()` only recognises a number **at the very start of a segment** — so all four hero stats showed a glaring `0`. Numbers moved to the front ("32人执业律师", "40%平均提速"), and a **test now locks the format convention** (new case: `heroStats` segments must start with a digit) to prevent recurrence
- **⚠️ Fixed a live production bug: the homepage bottom CTA block and the entire footer never rendered** (affects every release before v1.8.0)
  - **Root cause**: in `public/index.html` the CTA `<section>` was mistakenly placed **inside** `<main id="app">`. `renderSections()` runs `$('#app').innerHTML = ...`, which replaces all of `#app`'s content and thereby removes `<div id="ctaCard">`; `renderCTA()` then touches that now-missing element and throws `Cannot set properties of null (setting 'innerHTML')`. Because the exception aborted the remaining initialization, **the footer failed to render as well**
  - **Fix**: moved the CTA `<section>` outside `#app` and added a test locking the constraint (see `tests/cases.test.js`) to prevent regressions
- **Test hygiene**: `tests/theme-demo.test.js` hard-coded an assertion for `v1.6.0`, so it failed spuriously on every version bump. It now follows the `package.json` version, which both guarantees the demo page shows a version and prevents drift

### 🔒 Security

- **Zero real company information in demo cases (P1)**: the four new cases use entirely fictional organisation names, phone numbers (`400-000-0000`), addresses and logos; names were searched to confirm they do not collide with real businesses
- **Explicit fictional disclosure**: demo cases label their hero badge with "🎭 Template demo case · fictional organisation, not a real business" and set `settings.fictional`; the frontend also renders a notice bar so visitors cannot mistake them for real firms
- **Zero-tolerance on credentials in case assets**: case JSON must never contain `adminPassword` / `password` / `secret` / `token`; enforced by both the build script and the tests
- **Frontend case-ID allow-list**: `readCaseId()` filters with `/^[a-z0-9-]{1,64}$/`; invalid IDs issue no request and fall back to the default site gracefully (prevents path traversal)
- **Stronger deployment artifact gate**: CI gained a "verify artifact integrity" step confirming `cases/` and `CREDITS.md` ship with the artifact, admin files are truly removed, and the case count matches the manifest

### 📝 Docs

- Added `docs/adr/ADR-005.md`: architecture decision record for multi-case support (including the seven protections P1–P7 and the trade-offs)
- Added `docs/PLAN-v1.8.0.md`: phased task list and acceptance matrix for v1.8.0
- Added `public/cases/CREDITS.md`: image licensing ledger
- Synced `README.md` / `README.en.md` / `docs/ARCHITECTURE.md` / `docs/DEPLOY.md` / `docs/PRD.md` / `docs/adr/README.md`

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
