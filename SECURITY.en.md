# 🔒 Security Policy

> ⚠️ This project is developed with AI assistance. Admin auth is a **single shared password** and has **NOT undergone a professional security audit**. This document describes what we've done, the known risk boundaries, and how to report issues responsibly.

## 📌 Supported Versions

Security fixes go only into the **latest stable release**. Currently supported: **v1.4.3** ([Latest Release](https://github.com/xiaoyu-hue/xy-club/releases/latest)).

Older versions no longer receive security patches — please upgrade.

## 🐞 Reporting a Vulnerability

Report security issues **privately** and give us time to fix, rather than disclosing details in a public Issue or on social media.

- **Preferred**: GitHub **Private Vulnerability Reporting** (repo → Security → Report a vulnerability) — visible only to maintainers.
- **Fallback**: open an Issue titled `[SECURITY]` and **do not** include reproducible exploit details in the body; we'll move to private channels.

This is a solo-maintained project with no SLA, but we'll confirm and handle reports as quickly as we can.

## 🧱 Security Model & Known Limitations

**What we've implemented:**

- **Hashed passwords**: the admin password is stored as a **scrypt hash** (Node's built-in `crypto`, no new dependency) in `data/db.json` — never plaintext; legacy plaintext is auto-upgraded to a hash on login.
- **Login rate limiting**: 5 consecutive wrong passwords from one IP triggers a 5-minute lockout.
- **Session expiry**: sessions live in server memory, token valid for 7 days.
- **Upload allowlist**: only `jpg / png / webp / gif` (`jpeg` normalized to `jpg`), **no svg** (can embed scripts), ≤ 8MB each; never routed through a third party.
- **User-input escaping**: all input is escaped before rendering to the DOM, preventing stored XSS.

**Known and unaddressed limitations** (see [README · Data & Privacy](README.md) and [AGENTS.md](AGENTS.md)):

- 🔓 **Single password, single admin**: no multi-user accounts, roles, or permission tiers; no per-edit attribution.
- 🚫 **No CSRF protection**: endpoints assume same-origin calls; harden yourself for cross-origin.
- 🧩 **Single-process file I/O**: multiple instances or replicas cause write conflicts — run exactly one process.
- 💨 **Sessions in memory**: restarting the service signs everyone out.
- 🔍 **No content scanning on uploads**: type and size only, no inspection of actual image contents.

## 🛡 Deployment Security Checklist

1. **Change the default password `xy888888` immediately after deploying** (admin "Site Settings → Change Password", or `node scripts/reset-password.js <new-password>`).
2. **Mount a persistent volume** for `data/` and `public/uploads/`, or a restart wipes content.
3. **Put a reverse proxy** (Nginx / Caddy) in front for HTTPS and rate-limit the login endpoint.
4. Never commit `data/db.json` to the repo (already in `.gitignore`).

## ⚖️ Responsible Disclosure

On receipt we'll confirm, fix, and release as quickly as possible. Please allow at least a 90-day window before public disclosure; once fixed we'll credit you in the Release notes (if you wish).

---

Related: [AGENTS.md](AGENTS.md) · [README · Data & Privacy](README.md) · [CONTRIBUTING.md](CONTRIBUTING.md)
