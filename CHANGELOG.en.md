# Changelog

All notable changes to the XY Club website template are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> ⚠️ Notice: This project is developed with AI assistance. Admin auth is a single shared password (stored as a scrypt hash since 1.3.0) and has not undergone a professional security audit. Change the default password right after deploying.

---

## Unreleased

### 📚 Documentation

- **Completed the documentation system modeled on sonder520 / Nymir**: Chinese as baseline with `.en.md` mirrors; added (all based on real implementation, nothing invented):
  - `docs/DOC_SYNC.md` — doc & version sync spec (single source of truth, sync checklist, SemVer, pre-release checks)
  - `docs/DECISION_REVIEW.md` — decision review (three questions + five-layer probe, required before release / irreversible ops)
  - `docs/adr/` — ADR index + 4 seed ADRs (scrypt password hash / JSON-file source of truth / zero-build front-end / contract-fixed tests)
  - `docs/PRD.md` · `docs/PRD.en.md` — product requirements (positioning, features, data spec, acceptance)
  - `docs/AUTHOR.md` · `docs/AUTHOR.en.md` — about the author
  - `docs/ARCHITECTURE.en.md` — architecture write-up in English
- Updated `docs/README.md` index, `README.md` / `README.en.md` doc tables, and `AGENTS.md` (new "Doc & version sync (pre-release required)" section referencing `DOC_SYNC.md`).
- Security policy `SECURITY.md` / `SECURITY.en.md`, English contributing guide `CONTRIBUTING.en.md`, and REST API reference `docs/API.md` were added and wired in the previous round.

---

## 1.4.2 - 2026-09-26 (Actually fix CI red on Node 18)

### 🔧 Fixed

- **The real reason `test.yml` stayed red on Node 18**: the `--test-timeout=20000` flag in the `npm test` script is a **CLI option only added in Node 20**. Node 18 doesn't recognise it and exits non-zero immediately with `bad option: --test-timeout=20000`. Node 20 / 22 are unaffected, so only Node 18 failed.
  Removed the flag from the `test` script.
- As a replacement hang-guard, added `timeout-minutes: 10` to the `unit` job in `test.yml` (job-level timeout works on every Node version, so a stuck test can't hang CI indefinitely).
- Verified locally on both Node 18.20.4 and Node 22: 73 cases green, 24 suites, 0 fail (Node 18 ~1.3s).

### 📝 Documentation

- This entry corrects the wrong diagnosis in 1.4.1 (which blamed "directory auto-discovery" — the explicit glob alone didn't fix it).

---

## 1.4.1 - 2026-09-26 (CI script tweak, not fully fixed)

### 🔧 Fixed

- `npm test` changed from bare `node --test` to explicit `node --test tests/*.test.js` — the shell expands the glob into the 9 file names, and `--test` accepting explicit file arguments has worked since Node 18.
  This change itself is fine, but **1.4.1 wrongly claimed it fixed the CI red** — the actual Node 18 failure was `--test-timeout` (see 1.4.2), so `test.yml` was still red on Node 18 after this release.

---

## 1.4.0 - 2026-09-26 (Automated tests)

### ✨ Added

- **Unit test suite**: 9 files, 73 cases under `tests/`, run with Node's built-in `node --test` — no new dependencies, ~5s. `npm test` is now the single mandatory gate
  - Covers password hashing/verification, login rate limiting, the auth middleware, the upload allowlist, content read/write and inline-image restore, static snapshot sanitisation, data-file resilience, section/theme contracts, and doc sync
- **Optional E2E**: `e2e/` + `playwright.config.js` across desktop (1280×800) and narrow (375×667) viewports; when Playwright isn't installed, `npm run test:e2e` skips gracefully without failing
- `docs/TESTING.md`: testing guide with the layering rationale, a file-responsibility table, and discipline rules
- GitHub Actions workflow `test.yml`: runs the unit suite on Node 18 / 20 / 22
- `server.js` now honours `DATA_DIR` / `UPLOAD_DIR` environment overrides (for test isolation; default behaviour unchanged)

### 🔧 Fixed

- **The admin panel was actually rendered while signed out**: `.admin-app { display: flex }` overrode the `hidden` attribute's `display: none`, hidden only behind the login overlay. Added `.admin-app[hidden] { display: none }`
- `/api/health` was blocked by the auth middleware and returned 401, unusable as a probe; it now runs before auth and is public again
- Both READMEs documented `/api/password` as `PUT` (it is `POST`) and omitted `/api/health`; fixed, plus a new `docs-sync.test.js` that guards against docs drifting from routes

### 📝 Documentation

- Added `docs/TESTING.md`, linked from both READMEs (doc index and project structure)
- `AGENTS.md` gained a "Testing discipline" section; the pre-delivery checklist now includes `npm test`
- `CONTRIBUTING.md`: "Testing requirements" changed from a purely manual checklist to "unit gate + optional E2E + what still needs human eyes"

---

## 1.3.0 - 2026-09-26 (Security hardening & self-contained config)

### 🔒 Security

- **Admin password is now stored as a scrypt hash** (Node's built-in `crypto`, no new dependency); legacy plaintext passwords are upgraded automatically at startup
- **Login rate limiting**: 5 consecutive wrong passwords from one IP triggers a 5-minute lockout (HTTP 429)
- **SVG uploads disabled**: SVG can embed scripts, and visiting `/uploads/*.svg` directly is an XSS vector; the allowlist is now jpg / png / webp / gif
- Added the `X-Content-Type-Options: nosniff` header for the uploads directory
- Added `scripts/reset-password.js` for resetting a hashed admin password

### ✨ Added

- **Exported configs inline images** as data URIs; on import the server restores them as real files under `uploads/` — reusing the template no longer loses images
- When `data/db.json` fails to parse, it is backed up as `.corrupt-*` before falling back to defaults, so real data never vanishes silently

### 🔧 Fixed

- `/api/check` was blocked by the auth middleware and returned 401 when signed out; it now runs before auth and correctly returns `{"ok": false}`
- The image-type regex `\w+` could not match `svg+xml`, so SVG uploads reported "parse failed" instead of the real reason

### 📝 Documentation

- Corrected the **inaccurate** "uploads have no MIME allowlist" entry under Known Limitations (the code does validate types)
- Synced both READMEs with the security, rate-limiting, and image-export changes; updated the roadmap

---

## 1.2.0 - 2026-09-26 (GitHub Pages showcase)

### ✨ Added

- **GitHub Pages auto-deploy** — new `.github/workflows/deploy-pages.yml`; every push to `main` builds and publishes the static site
- **Render blueprint** — new `render.yaml` for one-click deployment of the full version (admin included) as a demo

### 🔧 Fixed

- Static assets now use relative paths (`/css/style.css` → `css/style.css`), fixing a blank page caused by 404s on sub-path hosting

### 📝 Documentation

- Added the Pages preview link <https://xiaoyu-hue.github.io/xy-club/> to both READMEs, noting that the admin is unavailable in static mode
- Removed the Apache-2.0 note from the English README to match the Chinese one

---

## 1.1.0 - 2026-09-26 (Documentation & static export)

### ✨ Added

- **Static snapshot export** — new `scripts/build-static.js` writes the default content to `public/content.json` for use on static-only hosting
- **Static fallback rendering** — when `/api/content` is unavailable, the front end falls back to `content.json` and hides the admin entry (there is no backend in a static environment)
- **Documentation set** — added `CHANGELOG.md` / `CHANGELOG.en.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` / `.en.md`, and `AGENTS.md`
- **Docs directory** — added `docs/` with an index, architecture notes, section field reference, and a deployment guide

### 📝 Documentation

- Rewrote both READMEs to project conventions: badge header, language switcher, known limitations, "not recommended for", roadmap, and credits
- Renamed the English docs to `README.en.md` (was `README_EN.md`) for consistency across repositories
- Switched README top-nav links to explicit `<a id>` anchors, since GitHub's auto-generated anchors for emoji headings are unstable
- Added the repository URL to the READMEs and `repository` / `license` / `engines` fields to `package.json`

### 🔧 Fixed

- `package.json` still carried the old NX starfield name and description; unified to the XY Club template
- `server.js` startup log still printed `NX俱乐部官网已启动`; replaced with neutral wording

---

## 1.0.0 - 2026-09-26 (First release)

### ✨ Added

**Visuals**

- Liquid-glass design system: translucent gradient base + `backdrop-filter` blur + 1px inner rim highlight
- Cursor-tracked specular highlight driven by the `--mx` / `--my` CSS custom properties
- 4 themes: Aurora `aurora` / Ocean `ocean` / Mist `mist` (light) / Sunset `sunset`
- Liquid aurora background: four gradient blobs with morphing animation

**Micro-interactions (8)**

- Cursor highlight on glass cards, 3D card tilt, button ripple
- Hero count-up numbers, scroll progress bar, back-to-top button
- Active-section nav highlighting, staggered reveal + background parallax
- Graceful degradation on mobile: tilt and highlight are pointer-device only

**Content & admin**

- 7 section types: pricing list `services` / card grid `cards` / testimonials `testimonials` / FAQ `faq` / notice list `notice` / gallery `gallery` / rich text `text`
- Sections can be edited, reordered (↑↓), toggled (👁), deleted, and added at any time
- Site settings: name, logo, hero copy, announcement, contacts, support QR code, footer
- Image upload (≤8MB) and admin password change
- Template reuse: export / import the full config as JSON, plus one-click restore to defaults

**Server**

- Single-port Express server: static hosting + REST API + auth + uploads
- JSON file storage, no database required
- Sessions held in server memory, expiring after 7 days

### 🧪 Testing

- End-to-end verification with Playwright: desktop / mobile layouts, all four themes, and the admin login and editing flow
