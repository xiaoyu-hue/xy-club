# Contributing Guide

Thank you for spending time on this project. It's a **website template for clubs**, so before any change ask one question: **will it make it harder for people who don't code?**

> This project is developed with AI assistance by a non-programmer author. Docs and code may have gaps — please point them out directly.

---

## Code of Conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). For security-related changes, also read [SECURITY.md](SECURITY.md).

---

## How to Contribute

### 1. Report a Bug

When opening an Issue, please include:

- **What happened**
- **What you expected**
- **Steps to reproduce** (which section, which button)
- **Environment**: Node version, browser, deploy mode (local / static / server)
- **Screenshot** for visual issues

### 2. Suggest a Feature

Explain **the problem you want to solve**, not just the feature you want. Common reasons we'd decline a template change:

- It would add a runtime dependency or a build step
- It only helps one specific club, not general use
- It can be done by editing `defaults.js` without code changes

### 3. Submit a Pull Request

1. Fork and branch (`git checkout -b feature/xxx`)
2. Self-check the two red lines below
3. Open the PR using the template
4. Keep the PR focused: one PR, one thing

#### PR template

```markdown
## What changed
（what you changed, list the files involved）

## Why
（why you changed it, what problem it solves）

## Testing
（how you verified: local run / Playwright / manual click path）

## Security impact
（does it touch auth, password, upload, or user-input rendering? if so, how is it protected）

## Related issue
（Fixes #123）
```

---

## Development Setup

### Requirements

| Item | Requirement |
|------|-------------|
| Node.js | ≥ 18 |
| Package manager | pnpm (recommended) or npm |
| Database | none |

### Install & Run

```bash
git clone https://github.com/xiaoyu-hue/xy-club.git
cd xy-club
pnpm install
node server.js        # site http://localhost:3000 | admin /admin
# default admin password: xy888888
```

```bash
node scripts/build-static.js   # static snapshot for static-only hosting
npm test                      # unit tests (must be green before submitting)
```

### Project Layout

```
xy-club/
├── server.js            # Express: static + REST API + auth + upload
├── defaults.js          # factory content
├── scripts/
│   ├── build-static.js  # export public/content.json snapshot
│   └── reset-password.js# reset admin password (hashed, can't edit db.json directly)
├── tests/               # unit tests (node --test, zero deps)
├── e2e/                 # E2E (optional, needs @playwright/test)
├── data/db.json         # runtime content (auto-generated, gitignored)
├── docs/                # architecture, sections, deploy, testing, API
└── public/
    ├── index.html       # site
    ├── admin.html       # admin
    ├── css/             # style.css | admin.css
    └── js/              # main.js | admin.js
```

---

## Code Standards

### Two red lines (violations are rejected)

1. **Zero frontend framework, zero build**: no React / Vue / Svelte, no bundler. The template's value is "edit and refresh".
2. **No new runtime dependencies**: `express` is the only one. Dev tools (e.g. Playwright) are separate, but justify them.

### Commit message

```bash
feat: add bulk upload for gallery
fix: fix low contrast in light theme footer
docs: add persistent-volume note to deploy guide
chore: bump express to 4.21
refactor: extract theme logic into applyTheme()
test: add E2E for admin section reorder
```

| Prefix | Use |
|--------|-----|
| `feat` | new feature |
| `fix` | bug fix |
| `docs` | docs only |
| `chore` | deps, build, misc |
| `refactor` | refactor, no behavior change |
| `test` | tests |

### Style

- Match existing code: 2-space indent, semicolons, single quotes
- Verb-led function names (`renderSections` / `bindTilt` / `applyTheme`)
- New rendering → `main.js` `render*`; new interaction → `bind*`
- Security-related changes (auth, upload, user-input rendering) **must state the protection approach**

### CSS

- Colors via theme variables (`var(--ink)` / `var(--glass-1)` / `var(--accent)`); no hardcoded colors
- A new theme must complete all variables under `html[data-theme="xxx"]`; no missing theme
- Glass effects use `.glass`; no separate `backdrop-filter`
- Animations respect `prefers-reduced-motion`

---

## Testing

Full guide in [docs/TESTING.md](docs/TESTING.md). What you must do before submitting:

### Required: unit tests

```bash
npm test        # node --test, zero new deps, ~5s
```

The **only mandatory gate**. Node's built-in runner, no install needed; CI runs on Node 18 / 20 / 22.

| You changed | Touch this file |
|-------------|-----------------|
| password / login / session | `tests/auth.test.js`, `tests/password.test.js`, `tests/rate-limit.test.js` |
| content read/write / import-export | `tests/content-api.test.js` |
| image upload | `tests/upload.test.js` |
| static hosting / asset paths | `tests/static-build.test.js` |
| data resilience | `tests/resilience.test.js` |
| section type / theme | `tests/contract-defaults.test.js` |
| version / README / API table | `tests/docs-sync.test.js` |

Cases use a temp data dir via `tests/harness.js`; they never touch your local `data/db.json`.

### Optional: E2E

```bash
npm i -D @playwright/test
npx playwright install chromium
npm run test:e2e
```

`npm run test:e2e` prints a hint and exits 0 (skip, not failure) when Playwright isn't installed.

### Still verify manually

- [ ] Text is readable across all four themes (machines only check variables are non-empty)
- [ ] Mouse-only micro-interactions don't misfire on touch
- [ ] For visual changes, compare desktop and mobile screenshots via Playwright

### Discipline

- Don't delete existing tests just to look cleaner
- Never "fix" a failure by editing the test first — judge first, write it in the commit message
- Test counts in docs must match `npm test` output

---

## Docs Contribution

Changing behavior requires syncing docs — hard requirement:

| Change | Files to update |
|--------|-----------------|
| feature add/remove | `README.md` + `README.en.md` + `CHANGELOG.md` + `CHANGELOG.en.md` |
| section fields | `docs/SECTIONS.md` |
| deploy method | `docs/DEPLOY.md` |
| architecture / data flow | `docs/ARCHITECTURE.md` |

Chinese and English docs must be updated **together**, section by section. No half updates.

---

## FAQ

**Q: Can I add a frontend framework?**
No. Zero-framework is a core trade-off — see the red lines above.

**Q: Do I need to edit code to change default content?**
Probably not. Use the admin, or edit `defaults.js` then delete `data/db.json` and restart.

**Q: Can I add a new section type?**
Yes, but you must change four places: `defaults.js` (sample), `public/js/main.js` `renderSection`, `public/js/admin.js` form, and `docs/SECTIONS.md`.

**Q: How soon will my PR be reviewed?**
The author is a solo maintainer with limited hardware; usually within a few days. Please be patient.

---

## Credits

Every Issue, PR, and correction makes this template more trustworthy. Thank you.
