# Changelog

All notable changes to the XY Club website template are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

> ⚠️ Notice: This project is developed with AI assistance. Admin auth is a single shared password stored in plaintext and has not undergone a professional security audit. Change the default password right after deploying.

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
