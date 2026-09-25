# Club Website Template · XY Club

A **reusable club website template** built on a Liquid Glass design system with micro-interactions. It ships with a public site and an admin panel; all content is data-driven — reuse it for another club by changing content and theme only, no code changes required.

> 中文版：[README.md](./README.md)

## ✨ Features

**Design**
- Liquid Glass system: blurred glass surfaces + cursor-tracking specular highlight + sweeping sheen
- 4 switchable themes: Aurora (dark violet) / Ocean (deep blue) / Mist (light) / Sunset (warm)
- Liquid flowing-gradient background that keeps the glass look in both light and dark themes

**Micro-interactions (8)**
- Cursor-tracking glass highlight, 3D card tilt, button ripple
- Count-up stats, top scroll-progress bar, back-to-top button
- Active-section nav highlight, staggered scroll reveal + background parallax
- Automatically degraded on touch devices (tilt/highlight are mouse-only)

**Content & Admin**
- 7 section types: price list / card grid / testimonials / FAQ / notice list / image gallery / rich text
- Each section: edit, reorder (↑↓), show/hide, delete; add new sections any time
- Site settings: name, logo, hero copy, announcement, contacts, support QR code, footer
- Image upload (≤8MB), change admin password
- **Template reuse**: export / import site config as JSON, restore defaults in one click

## 📁 Structure

```
xy-club/
├── server.js            # Express server: static hosting + REST API + auth + uploads
├── defaults.js          # Template default content (the "factory configuration")
├── package.json
├── data/
│   └── db.json          # Runtime content (auto-generated, gitignored)
└── public/
    ├── index.html       # Public site
    ├── admin.html       # Admin panel
    ├── uploads/         # Uploaded images
    ├── css/             # style.css (site) · admin.css (admin)
    └── js/              # main.js (render + interactions) · admin.js (admin logic)
```

## 🚀 Quick Start

```bash
pnpm install      # or npm install
node server.js    # http://localhost:3000 by default
```

- Site: <http://localhost:3000>
- Admin: <http://localhost:3000/admin>
- **Default admin password: `xy888888`** — change it right after login under Site Settings → Change Password
- Port via env var: `PORT=8080 node server.js` (binds `0.0.0.0`, deployment-ready)

> On first start, `data/db.json` is generated from `defaults.js`. Delete the file to restore factory content.

## 🔁 Reusing the Template

1. In the original site: Admin → Site Settings → **Export Config** to get a full JSON
2. Deploy a new instance → Admin → **Import Config** to load it
3. Update four things: name / logo, hero copy, contacts (WeChat · QQ · QR code), section content
4. Pick a theme, click **Save** — live immediately

## 📦 Deployment

Single-port HTTP app, no database required. Works on any Node.js host:

```bash
PORT=8080 node server.js     # hosts inject PORT; the server binds 0.0.0.0
```

Static assets and API share one port; uploads are stored in `public/uploads/`.

## 💾 Data & Backup

- All content lives in `data/db.json` (persists across restarts; gitignored because it contains the admin password)
- Back up regularly with Admin → Export Config
- Lost password: edit `settings.adminPassword` in `data/db.json` and restart

## 🛠 Stack

Vanilla HTML / CSS / JavaScript (no frontend framework) · Node.js + Express 4 · JSON file storage

## 📄 License

[MIT](./LICENSE) — free to use, modify and commercialize with attribution.
Switch to Apache-2.0 if you need explicit patent protection.
