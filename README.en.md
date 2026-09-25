<div align="center">

<img src="https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge" alt="license">
<img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="node">
<img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="express">
<img src="https://img.shields.io/badge/frontend-zero--framework-4FC08D?style=for-the-badge" alt="frontend">
<img src="https://img.shields.io/badge/storage-JSON%20file-6B728C?style=for-the-badge" alt="storage">

**English · [中文](./README.md)**

# 💎 Club Website Template · XY Club

> ⚠️ **Important Notice**: This project is developed with AI assistance. Admin auth is a **single shared password**, stored in plaintext in a local JSON file, and has **NOT undergone a professional security audit**. Change the default password immediately after deploying.

A **reusable club website template**: liquid-glass visuals + micro-interactions, with the public site and admin panel in one package, all content driven by data.

**To use it for another club: change the content and the theme. Not the code.**

> *Change four pieces of copy and it becomes another club's website.*

<br>

**[🚀 Quick Start](#quick-start)** · **[🔁 Reuse the template](#reuse)** · **[📚 Docs](docs/README.md)** · **[⚠️ Not for](#not-recommended)**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)

</div>

---

## 🎯 Overview

A club that wants a website usually gets stuck on one of two things: hiring a developer costs money, or a site builder locks you into its templates. This template addresses exactly that — **one codebase, reusable for any club by changing only the content**.

The site and the admin panel share a single JSON document. Whatever you edit in the admin is what visitors see immediately: no rebuild, no coding.

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
- **Default admin password `xy888888`** — stored in plaintext; **change it right after deploying**
- **Passwords stay out of git** — `data/db.json` is listed in `.gitignore`
- **Sessions** — held in server memory, expire after 7 days; the token is kept in browser localStorage
- **Images** — uploaded to `public/uploads/`, never routed through a third party

### ⚠️ Known Limitations

Being honest: simplicity was chosen deliberately, so the following are **known and unaddressed**:

- **Plaintext password** — `settings.adminPassword` is not hashed or salted; a leaked `db.json` means a leaked password
- **Single password, single admin** — no multi-user accounts, roles, or permission levels
- **No rate limiting** — the login endpoint has no brute-force protection; add it at the reverse proxy
- **No CSRF protection** — endpoints assume same-origin calls; harden this yourself if you go cross-origin
- **Single-process file I/O** — running multiple instances or replicas causes write conflicts; run exactly one process
- **Uploads size-checked only** — capped at 8MB, with no MIME allowlist or content scanning

---

<a id="not-recommended"></a>

## ⚠️ Not Recommended For

This template optimizes for "works out of the box, zero dependencies," and pays for it by giving up enterprise-grade capabilities. Evaluate carefully, or pick another tool, for:

- **Sites handling payments** — no orders, inventory, checkout, or reconciliation, and no compliance posture
- **Teams needing multiple admins** — one shared password means no attribution for edits
- **High-traffic / high-concurrency sites** — single process with full-file JSON writes, no cache or connection pooling
- **SEO-critical or SSR-dependent sites** — content is fetched client-side; crawlers may not see rendered output
- **Storing sensitive user data** — plaintext passwords and an absent audit log cannot carry ID numbers or similar data
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
| PUT | `/api/password` | Change the admin password (auth required) |
| POST | `/api/upload` | Upload an image, ≤8MB (auth required) |
| POST | `/api/reset` | Restore default content (auth required) |

---

<a id="docs"></a>

## 📚 Documentation

| Doc | Contents |
|-----|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture: data flow, theming, auth, static fallback |
| [docs/SECTIONS.md](docs/SECTIONS.md) | Field reference for the 7 section types |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Deployment: Node server vs. static-only hosting |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributing guide (code rules and two red lines) |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Contributor Code of Conduct |
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
- Forgot the password? Edit `settings.adminPassword` in `data/db.json` and restart
- Back to square one? Delete `data/db.json` and restart, or hit Restore defaults in the admin

---

## 🗺 Roadmap

### Done ✅

- Liquid-glass visual system and 4 themes
- 8 micro-interactions
- 7 section types with a visual admin
- Image upload, password change, config import/export

### Planned 🚀

- Hashed admin password (bcrypt / scrypt)
- Login rate limiting and CSRF protection
- MIME allowlist for uploads
- Bulk upload and an image management panel
- SEO metadata and Open Graph cards
- Dockerfile and one-click deploy config

---

## 🤝 Contributing

Issues and PRs are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md), and please read the [Code of Conduct](CODE_OF_CONDUCT.md) first.

Before submitting:

1. Fork the repo and create a branch (`git checkout -b feature/xxx`)
2. Keep the "zero frontend framework, zero build" rule — no React/Vue, no bundler
3. Commit messages in Chinese or English are both fine
4. Open a Pull Request explaining the motivation

---

## 📄 License

Released under the [MIT License](LICENSE) — free to use, modify, and commercialize, provided the copyright notice is retained.

Swap to Apache-2.0 if you need stronger patent protection.

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
