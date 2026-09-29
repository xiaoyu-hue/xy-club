# Testing Guide

This project has two layers: **unit tests are mandatory, E2E is optional bonus**.

The分层 is based on cost—unit tests use Node's built-in `node --test`, zero new dependencies, run in about 5 seconds, work in any environment; E2E requires downloading a browser and serves only as pre-release validation.

---

## Layer 1: Unit Tests (Mandatory)

```bash
npm test
```

| Item | Value |
|------|-------|
| Runner | `node --test` (Node built-in) |
| Dependencies | None (just need `express` running, tests themselves zero-dependency) |
| Test location | `tests/*.test.js` |
| Test count | 140 cases / 42 suites |
| Time reference | About 10–40 seconds (depends on machine performance) |

### Files and Responsibilities

| File | Covers | Why mandatory |
|------|--------|---------------|
| `tests/password.test.js` | scrypt hash format, validation, legacy plaintext compatibility, corrupted input | Corresponds to README's "password not stored in plaintext" claim |
| `tests/auth.test.js` | Login, token, session expiry, auth middleware, password change | This is the site's only security boundary |
| `tests/rate-limit.test.js` | 5-failure lock, success clears counter, lock auto-resolves | Anti-brute-force |
| `tests/csrf.test.js` | Token issuance,拒发 when未登录, mandatory validation on writes, wrong token returns 403 | Second lock on write operations |
| `tests/security-headers.test.js` | nosniff / X-Frame-Options / CSP and other global security headers, X-Powered-By removal | Regression defense against MIME sniffing and clickjacking |
| `tests/input-validation.test.js` | Field whitelist, section type whitelist, prototype pollution filtering, deepClone | Malicious/malformed input cannot reach the storage layer |
| `tests/password-session.test.js` | Other old sessions invalidate after password change | Prevents old tokens from remaining valid for 7 days after password change |
| `tests/content-api.test.js` | Content read/write to disk, password不可篡改, inline image restoration | Data integrity |
| `tests/upload.test.js` | Format whitelist (SVG must be rejected), 8MB limit, nosniff | Upload is the only entry point "writing external bytes to disk" |
| `tests/static-build.test.js` | Static snapshots不含凭据, resources use relative paths | Defense against GitHub Pages subpath hosting white screen / credential leakage |
| `tests/resilience.test.js` | `db.json` corruption backs up scene and falls back to defaults | First principle: never破坏 existing user data |
| `tests/contract-defaults.test.js` | Section types ↔ render branches ↔ themes ↔ admin options | Prevents "added type forgot render""added theme admin has no option" |
| `tests/docs-sync.test.js` | Version number drift, Chinese/English README broken links, API table vs route inconsistency | Automates "changed behavior must sync docs" |
| `tests/frontend-util.test.js` | `esc()` escaping and `TYPES` section type definitions (frontend pure functions) | XSS first line of defense + type definition consistency |
| `tests/harness.js` | (Non-test file) Temporary directory isolation + in-memory server startup | Common foundation for all tests |
| `tests/theme-sync.test.js` | 8 themes完整性, dark/light theme variable validation | Ensures theme sync with xy-intro-card |
| `tests/theme-demo.test.js` | Theme demo page completeness, theme display validation | Validates themes-demo.html |

### Isolation Mechanism

`tests/harness.js` creates a **temporary directory** when each test file loads and points `DATA_DIR` / `UPLOAD_DIR` there. Therefore:

- Cases never read the developer's real `data/db.json`
- Cases don't interfere with each other (`node --test` runs one process per file)
- Server uses `listen(0)` temporary port + `unref()`, exits automatically after running, doesn't occupy 3000

> To run the server with a different directory, just set the environment variable: `DATA_DIR=/tmp/foo node server.js`.

---

## Layer 2: E2E (Optional)

E2E uses Playwright to verify in a real browser whether "users can see it, whether it errors, whether narrow screens break."

**It's not written into the `package.json` dependency list**—this way `express` remains the only declared dependency, and the lockfile doesn't need to change. If not installed, it auto-skips and won't cause command failure.

```bash
npm i -D @playwright/test      # Install to devDependencies, don't pollute runtime deps
npx playwright install chromium
npm run test:e2e
```

| Item | Value |
|------|-------|
| Config | `playwright.config.js` |
| Viewport | desktop 1280×800 + mobile 375×667 |
| Server | `e2e/serve.js` (one-time data directory, cleared on each start) |
| Cases | `e2e/smoke.spec.js` (official site), `e2e/admin.spec.js` (admin loop) |

Already covered:

- Homepage renders factory content, no console errors
- CSS variables non-empty after 8-theme switching (prevents color scheme missing items)
- 375px narrow screen doesn't horizontally overflow
- Admin entry not exposed in static hosting mode
- Admin: wrong password blocked, login success, theme switching, change site name → save → still there after refresh, login state maintained after refresh

Behavior when not installed:

```
Skipping E2E: @playwright/test not installed.
...
```

Exit code is 0, CI won't turn red because of this.

---

## Discipline (copied from similar projects' experience)

1. **Existing tests are a safety net, not an old burden** — never delete them because "cleaner""refactoring needs".
2. **Never修改测试 to逃避失败**. When tests fail, first judge: real bug? Depends on废弃的内部实现? Intentional behavior change? Judgment must be written into the commit message.
3. **New features must add tests simultaneously**; changes involving authentication / upload / user input rendering must leave corresponding cases.
4. **The test count written in docs must match the actual output of `npm test`**, never write numbers based on impression.
