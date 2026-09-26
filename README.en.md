<div align="center">

<img src="https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge" alt="license">
<img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="node">
<img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="express">
<img src="https://img.shields.io/badge/frontend-zero--framework-4FC08D?style=for-the-badge" alt="frontend">
<img src="https://img.shields.io/badge/storage-JSON%20file-6B728C?style=for-the-badge" alt="storage">
<img src="https://img.shields.io/github/v/release/xiaoyu-hue/xy-club?style=for-the-badge" alt="release">

**English · [中文](./README.md)**

# 💎 Club Website Template · XY Club

> ⚠️ **Important Notice**: This project is developed with AI assistance. Admin auth is a **single shared password** and has **NOT undergone a professional security audit**. Change the default password immediately after deploying.

A **reusable club website template**: liquid-glass visuals + micro-interactions, with the public site and admin panel in one package, all content driven by data.

**To use it for another club: change the content and the theme. Not the code.**

> *Change four pieces of copy and it becomes another club's website.*

<br>

**[🔗 Live preview (GitHub Pages)](https://xiaoyu-hue.github.io/xy-club/)** · **[🚀 Quick Start](#quick-start)** · **[🔁 Reuse the template](#reuse)** · **[📚 Docs](docs/README.md)** · **[⚠️ Not for](#not-recommended)**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![Test](https://github.com/xiaoyu-hue/xy-club/actions/workflows/test.yml/badge.svg)

</div>

---

## 🎯 Overview

A club that wants a website usually gets stuck on one of two things: hiring a developer costs money, or a site builder locks you into its templates. This template addresses exactly that — **one codebase, reusable for any club by changing only the content**.

The site and the admin panel share a single JSON document. Whatever you edit in the admin is what visitors see immediately: no rebuild, no coding.

> The "Live preview" link above is the **static-only** build on GitHub Pages: the site renders fully, but the **admin is unavailable** (its entry hides itself automatically). For the admin, deploy the Node server as described in [docs/DEPLOY.md](docs/DEPLOY.md).

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🎨 **Liquid-glass visuals** | Blurred glass + cursor-tracked specular highlight + sheen sweep, holding up in both light and dark themes |
| 🌈 **4 themes** | Aurora / Ocean / Mist (light) / Sunset — switchable in one click from the admin |
| ✨ **8 micro-interactions** | Cursor highlight, 3D card tilt, button ripple, count-up numbers, scroll progress, back-to-top, nav highlighting, staggered reveal |
| 🧩 **7 section types** | Pricing list / Card grid / Testimonials / FAQ / Notice list / Gallery / Rich text |
| 🛠 **Visual admin** | Add, edit, delete, reorder (↑↓) and toggle (👁) any section at any time |
| 📦 **Template reuse** | Export / import the whole site as JSON, plus one-click restore to defaults |
| 🚀 **No database** | Single-port HTTP + JSON file storage — runs anywhere Node.js runs |
| 🍦 **Zero frontend framework** | Vanilla HTML/CSS/JS, no build step; save and refresh |

---

## 🎨 Visual & Interaction

### The liquid-glass language

The glass look is built in three layers: a translucent gradient base, `backdrop-filter` blur with boosted saturation, and a 1px inner rim highlight. The highlight follows your cursor — CSS custom properties `--mx` / `--my` update the light position on every move.

### Micro-interaction list

- **Cursor-tracked highlight** — a radial specular glow follows the pointer inside glass cards
- **3D card tilt** — ±6° rotation under `perspective(900px)`
- **Button ripple** — a wave spreading from the click point
- **Count-up stats** — hero numbers animate from 0 when scrolled into view
- **Scroll progress bar** — a thin bar at the top tracks reading progress
- **Back to top** — fades in after one viewport of scrolling
- **Active-section highlighting** — the nav item lights up as its section scrolls in
- **Staggered reveal + background parallax** — sections fade and rise in sequence via a `--i` delay

> Graceful degradation on mobile: tilt and highlight only activate on pointer devices, so touch never misfires.

### Themes

| Theme | Tone | Good for |
|-------|------|----------|
| 🌌 Aurora `aurora` | Dark · purple-blue gradient | Gaming / companionship / trend culture |
| 🌊 Ocean `ocean` | Dark · cyan-blue gradient | Tech / outdoor / sports clubs |
| ☁️ Mist `mist` | **Light** · grey-white gradient | Reading / family / lifestyle services |
| 🌇 Sunset `sunset` | Dark · orange-gold gradient | Food / parties / hobby communities |

---

## 📋 Section Types

Seven types are available when adding a section; each renders differently on the front end:

| Type | `type` | Use for | Fields per item |
|------|--------|---------|-----------------|
| Pricing list | `services` | Service packages / price lists | name, description, price, tag |
| Card grid | `cards` | Features / team members | title, description, icon |
| Testimonials | `testimonials` | Feedback / review wall | quote, author, rating |
| FAQ | `faq` | Q&A (collapsible) | question, answer |
| Notice list | `notice` | Rules / announcements | item text |
| Gallery | `gallery` | Photo albums / event shots | image URL `url`, caption `caption` |
| Rich text | `text` | About us / long-form intro | heading, body |

---

## 🔐 Data & Privacy

- **All content lives in `data/db.json`** — a single JSON file, survives restarts, no database required
- **Default admin password `xy888888`** — stored as a **scrypt hash** (Node's built-in crypto, no extra dependency); **change it right after deploying**
- **Passwords stay out of git** — `data/db.json` is listed in `.gitignore`
- **Login rate limiting** — 5 consecutive wrong passwords from one IP triggers a 5-minute lockout
- **Sessions** — held in server memory, expire after 7 days; the token is kept in browser localStorage
- **Images** — uploaded to `public/uploads/`, never routed through a third party

### ⚠️ Known Limitations

Being honest: simplicity was chosen deliberately, so the following are **known and unaddressed**:

- **Single password, single admin** — no multi-user accounts, roles, permission levels, or per-edit attribution
- **No CSRF protection** — endpoints assume same-origin calls; harden this yourself if you go cross-origin
- **Single-process file I/O** — running multiple instances or replicas causes write conflicts; run exactly one process
- **Sessions live in memory** — restarting the service signs everyone out
- **Uploads are type- and size-checked only** — capped at 8MB, limited to jpg / png / webp / gif (**no svg**, since it can embed scripts); no content scanning

---

<a id="not-recommended"></a>

## ⚠️ Not Recommended For

This template optimizes for "works out of the box, zero dependencies," and pays for it by giving up enterprise-grade capabilities. Evaluate carefully, or pick another tool, for:

- **Sites handling payments** — no orders, inventory, checkout, or reconciliation, and no compliance posture
- **Teams needing multiple admins** — one shared password means no attribution for edits
- **High-traffic / high-concurrency sites** — single process with full-file JSON writes, no cache or connection pooling
- **SEO-critical or SSR-dependent sites** — content is fetched client-side; crawlers may not see rendered output
- **Storing sensitive user data** — single-password auth with no audit log cannot carry ID numbers or similar data
- **Containers without a persistent volume** — restarts lose `data/db.json` and everything under `public/uploads/`

---

<a id="quick-start"></a>

## 🚀 Quick Start

```bash
git clone https://github.com/xiaoyu-hue/xy-club.git
cd xy-club
pnpm install      # or npm install
node server.js    # http://localhost:3000 by default
```

- Site: <http://localhost:3000>
- Admin: <http://localhost:3000/admin>
- **Default admin password: `xy888888`** — change it under Site Settings → Change Password right after login
- Custom port: `PORT=8080 node server.js` (already bound to `0.0.0.0`, deployment-ready)

> On first start, `defaults.js` generates `data/db.json` automatically. Delete that file to restore factory content.

### Requirements

| Item | Requirement |
|------|-------------|
| Node.js | ≥ 18 (ES2020 features; 14+ generally works) |
| Disk | ~50MB including dependencies |
| Database | None |

---

## 📁 Project Layout

```
xy-club/
├── server.js            # Express server: static hosting + REST API + auth + uploads
├── defaults.js          # Default template content (edit this to change "factory settings")
├── package.json
├── tests/               # Unit tests (node --test, no new dependencies)
├── e2e/                 # E2E smoke tests (optional, needs a local @playwright/test)
├── data/
│   └── db.json          # Runtime content (auto-generated, gitignored)
└── public/
    ├── index.html       # Public site
    ├── admin.html       # Admin panel
    ├── uploads/         # Uploaded images
    ├── css/             # style.css (site) · admin.css (admin)
    └── js/              # main.js (rendering + interactions) · admin.js (admin logic)
```

### API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/login` | Password login, returns a token |
| GET | `/api/check` | Validate the session |
| GET | `/api/content` | Fetch all site content (public) |
| PUT | `/api/content` | Save content and settings (auth required) |
| POST | `/api/password` | Change the admin password (auth required) |
| POST | `/api/upload` | Upload an image, ≤8MB (auth required) |
| POST | `/api/reset` | Restore default content (auth required) |
| GET | `/api/health` | Health check (public, for probes) |

---

<a id="docs"></a>

## 📚 Documentation

| Doc | Contents |
|-----|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [.en](docs/ARCHITECTURE.en.md) | Architecture: data flow, theming, auth, static fallback |
| [docs/PRD.md](docs/PRD.md) · [.en](docs/PRD.en.md) | Product requirements: positioning, features, data spec, acceptance |
| [docs/SECTIONS.md](docs/SECTIONS.md) | Field reference for the 7 section types |
| [docs/TESTING.md](docs/TESTING.md) | Testing guide: unit gate + optional E2E, incl. discipline rules |
| [docs/API.md](docs/API.md) | Detailed admin REST API reference (auth, endpoints, error codes) |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Deployment: Node server vs. static-only hosting |
| [docs/DOC_SYNC.md](docs/DOC_SYNC.md) | Doc & version sync spec: single source of truth, checklist, SemVer, pre-release checks |
| [docs/DECISION_REVIEW.md](docs/DECISION_REVIEW.md) | Decision review: three questions + five-layer probe (before release / irreversible ops) |
| [docs/adr/README.md](docs/adr/README.md) | Architecture Decision Records (ADR) index & status convention |
| [docs/AUTHOR.md](docs/AUTHOR.md) · [.en](docs/AUTHOR.en.md) | About the author |
| [CHANGELOG.md](CHANGELOG.md) · [.en](CHANGELOG.en.md) | Version history |
| [CONTRIBUTING.md](CONTRIBUTING.md) · [.en](CONTRIBUTING.en.md) | Contributing guide (code rules and two red lines) |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) · [.en](CODE_OF_CONDUCT.en.md) | Contributor Code of Conduct |
| [SECURITY.en.md](SECURITY.en.md) | Security policy: reporting, model, known limits |
| [AGENTS.md](AGENTS.md) | AI agent collaboration rules |

<a id="reuse"></a>

## 🔁 Reuse the Template

1. In the original site, go to Site Settings → ⬇️ Export config to get the full JSON
2. Deploy a fresh instance → ⬆️ Import config and load that JSON
3. Then change only these four things:
   - Site name / Logo
   - Hero copy (title, subtitle, badge)
   - Contact details (WeChat · QQ · support QR code)
   - Section content
4. Pick a theme under Theme, click Save — it takes effect immediately

> Exported configs **inline images as data URIs**, so the file is self-contained: importing into a fresh site restores them as real image files, with **no broken images**.

Want to change the factory defaults instead? Edit `defaults.js`, delete `data/db.json`, and restart.

---

## 📦 Deployment

Two routes are available: **Node server** (full admin) or **static-only hosting** (site only, admin entry auto-hidden).
See [docs/DEPLOY.md](docs/DEPLOY.md) for platform notes, volume requirements, and troubleshooting.

A single-port HTTP app with no database — any Node.js-capable platform works:

```bash
PORT=8080 node server.js     # the platform injects PORT; already listening on 0.0.0.0
```

Static assets and the API share one port, so there is no CORS setup.

> ⚠️ **Mount a persistent volume** for `data/` and `public/uploads/`, or a restart wipes both content and images. Put a reverse proxy in front for HTTPS and rate limiting.

---

## 💾 Data & Backup

- Everything lives in `data/db.json`; **back it up regularly via Export config**
- Forgot the password? Run `node scripts/reset-password.js <new-password>` — the password is hashed, so it can no longer be hand-edited as plaintext
- Back to square one? Delete `data/db.json` and restart, or hit Restore defaults in the admin

---

## 🗺 Roadmap

### Done ✅

- Liquid-glass visual system and 4 themes
- 8 micro-interactions
- 7 section types with a visual admin
- Image upload, password change, config import/export
- Admin password stored as a **scrypt hash** (Node built-in, no new dependency)
- Login rate limiting: 5 wrong attempts from one IP triggers a 5-minute lockout
- Upload allowlist: jpg / png / webp / gif (svg disabled)
- **Exported config inlines images**, restored automatically on import — no broken images
- Corrupt-config auto-backup with safe fallback

### Planned 🚀

- CSRF protection
- Bulk upload and an image management panel
- SEO metadata and Open Graph cards
- Dockerfile and one-click deploy config
- Content version history and undo

---

<a id="testing"></a>

## 🧪 Testing

```bash
npm test          # Unit tests: 73 cases, ~5s, no new dependencies (Node's built-in node --test)
```

`npm test` is the only mandatory gate; CI runs it on Node 18 / 20 / 22. It covers the parts that actually carry risk: password hashing and login rate limiting, the upload allowlist, content read/write and data resilience, static snapshots staying credential-free, and whether the docs still match the code.

| Layer | Command | Dependencies | Notes |
|-------|---------|--------------|-------|
| Unit | `npm test` | none | Mandatory gate, `tests/` |
| E2E | `npm run test:e2e` | requires a local `@playwright/test` | Optional; skipped automatically if absent |

E2E drives a real browser at desktop (1280×800) and narrow (375×667) viewports: home rendering, all four themes, and the admin loop "edit → save → reload and it's still there". See [docs/TESTING.md](docs/TESTING.md).

---

## 🤝 Contributing

Issues and PRs are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md), and please read the [Code of Conduct](CODE_OF_CONDUCT.md) first.

Before submitting:

1. Fork the repo and create a branch (`git checkout -b feature/xxx`)
2. Make sure `npm test` is green; add cases when you touch auth, uploads, or rendering
3. Keep the "zero frontend framework, zero build" rule — no React/Vue, no bundler
4. Commit messages in Chinese or English are both fine
5. Open a Pull Request explaining the motivation

---

## 📄 License

Released under the [MIT License](LICENSE) — free to use, modify, and commercialize, provided the copyright notice is retained.

---

## 🙏 Credits

> **"If I have seen further, it is by standing on the shoulders of giants."** — for the open-source community and web standards this project rests on.

### Runtime Dependencies

| Project | License | Role |
|---------|---------|------|
| [Node.js](https://nodejs.org) | MIT | Server runtime |
| [Express](https://expressjs.com) | MIT | Static hosting and REST API |

### Development & Testing

| Project | License | Role |
|---------|---------|------|
| [Playwright](https://playwright.dev) | Apache-2.0 | End-to-end verification of site and admin (desktop / mobile, all four themes) |

### Visual & Design Inspiration

The liquid-glass language follows the "material + depth" direction of contemporary operating systems. Implementation relies entirely on open web standards — CSS `backdrop-filter`, `color-mix()`, custom properties, and `@keyframes` — with no UI framework involved.
