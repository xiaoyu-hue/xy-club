# 🔌 API Reference

XY Club's admin backend is managed through a set of REST APIs. All APIs return JSON, base URL is the site root (e.g. `http://localhost:3000`).

> This is the detailed version of [README "API Overview"](README.md). When modifying APIs, please sync updates to README's API table—`tests/docs-sync.test.js` validates consistency.

## 🔑 Authentication

Except for the following **public** endpoints, all other APIs require login token in request header:

```
x-token: <token returned at login>
```

- Token is issued by `POST /api/login`, valid for **7 days**, stored in server memory (lost on restart).
- Missing or expired token returns `401 { "error": "Login expired, please login again" }`.

**Public endpoints** (no `x-token` required):

- `POST /api/login`
- `GET /api/health`
- `GET /api/check`
- `GET /api/content`

## 📦 Conventions

- Request body: `Content-Type: application/json` (upload API uses JSON to carry base64, see below).
- Success response: `200` + JSON (specific shape per endpoint).
- Error response: non-`2xx` + `{ "error": "..." }` or `{ "ok": false, "error": "..." }`.
- Time fields: `updatedAt` is ISO 8601 string.

## Endpoint List

### POST /api/login

Password login, issues session token.

Request body:

```json
{ "password": "your admin password" }
```

> ⚠️ This project **no longer ships a default password**. The admin password comes from the `ADMIN_PASSWORD` environment variable; if unset, the server generates a strong random password on first start and prints it to the console (once only, see ARCHITECTURE "Authentication"). The old weak default `xy888888` is deprecated.

Success `200`:

```json
{ "ok": true, "token": "a1b2c3..." }
```

Errors:

- `401 { "ok": false, "error": "Wrong password, please retry" }` — password mismatch
- `429 { "ok": false, "error": "Too many attempts, please retry in 5 minutes" }` — IP rate-limited (5 consecutive failures)

> When hitting a legacy plaintext password, server upgrades it to scrypt hash on this login.

### GET /api/health

Health check for monitoring/liveness probe, no login required.

Success `200`:

```json
{ "ok": true }
```

### GET /api/check

Check if current token is still valid (no need to login first).

Request header: `x-token: <token>`

Success `200`:

```json
{ "ok": true }
```

`ok` is `false` means token missing or expired.

### POST /api/logout

Log out the current session (**authenticated**). Invalidates the current token immediately (no longer bound to the 7-day TTL); the frontend should also clear the token from `localStorage`.

Request header: `x-token: <token>`

Success `200`:

```json
{ "ok": true }
```

> On a shared device or when a token leak is suspected, logging out revokes the old token at once—safer than waiting for the 7-day expiry.

### GET /api/content

Get entire site content (**public**, no login required). Sensitive fields like password are stripped.

Success `200`:

```json
{
  "settings": { "siteName": "...", "theme": "aurora", "contact": { "wechat": "..." } },
  "sections": [ { "type": "services", "title": "...", "items": [ ... ] } ],
  "updatedAt": "2026-09-26T01:00:00.000Z"
}
```

> `settings` **does not contain** `adminPassword`, frontend cannot access password hash.

### GET /api/csrf-token

Get CSRF token (**authenticated**). Frontend auto-calls after login, then all write operations include `x-csrf-token` header.

Success `200`:

```json
{ "csrfToken": "a1b2c3..." }
```

Errors:

- `401 { "error": "Not logged in" }` — missing `x-token` or login expired

> CSRF token is bound to session, expires with session; cross-session use rejected.

### PUT /api/content

Save entire site content and settings (**authenticated + CSRF**).

Request body:

```json
{
  "settings": { "siteName": "...", "theme": "ocean", "contact": { ... } },
  "sections": [ { "type": "services", "title": "...", "items": [ ... ] } ]
}
```

- `settings` and `sections` both required, missing or `sections` not array returns `400 { "error": "Invalid data format" }`
- **Input validation (whitelist)**:
  - `settings` only accepts known fields, unknown fields return `400 { "error": "Invalid setting field: xxx" }`
  - Each section's `type` must be in 8-type whitelist (`cards` / `services` / `testimonials` / `notice` / `faq` / `text` / `gallery` / `custom`), otherwise `400 { "error": "Invalid section type: xxx" }`
  - Request body goes through `deepClone` to strip dangerous keys `__proto__` / `constructor` / `prototype`, defending against prototype pollution
- Inline images (data URIs) in imported config are automatically restored to real files under `public/uploads/`.

Success `200`:

```json
{ "ok": true, "settings": { ... }, "sections": [ ... ], "restoredImages": true }
```

> Password field won't be overridden by this request—`adminPassword` always uses server-stored value.

### POST /api/password

Change admin password (**authenticated + CSRF**).

Request body:

```json
{ "oldPassword": "your current password", "newPassword": "newSecret6" }
```

Success `200`: `{ "ok": true }`

Errors:

- `400 { "error": "Wrong old password" }` — old password verification failed
- `400 { "error": "New password at least 6 characters" }` — new password empty or less than 6 chars

> New password stored as scrypt hash, cannot directly edit `db.json`.

### POST /api/reset

Restore to template defaults (**authenticated + CSRF**). Useful when reusing for another club.

Request body:

```json
{ "currentPassword": "your admin password" }
```

- `currentPassword` is required to re-confirm identity; missing or wrong returns `400 { "ok": false, "error": "管理密码错误，无法恢复默认内容" }`. Note it is **not** the login token, but the admin password you logged in with.
- After reset, the **current** admin password is preserved (it does not fall back to a default); everything else returns to the factory template.

Success `200`:

```json
{ "ok": true, "settings": { ... }, "sections": [ ... ] }
```

### POST /api/upload

Upload image (**authenticated + CSRF**). Image submitted as base64 data URI in request body.

Request body:

```json
{ "data": "data:image/png;base64,iVBORw0KGgo..." }
```

Validation rules:

- Must be data URI starting with `data:image/...`, otherwise `400 { "error": "Image files only" }`
- Extension whitelist: `jpg / png / webp / gif` (`jpeg` normalized to `jpg`), **SVG not supported**, otherwise `400 { "error": "Only jpg / png / webp / gif formats supported" }`
- Decoded size ≤ 8MB, otherwise `400 { "error": "Image cannot exceed 8MB" }`

Success `200`:

```json
{ "ok": true, "url": "/uploads/1695700000000-ab12cd34.png" }
```

Returned relative path can be used directly in image gallery sections.

## ⚠️ Error Code Quick Reference

| Status Code | Meaning | Common Triggers |
|-------------|---------|-----------------|
| 400 | Request format error | Missing required fields, password too short, invalid setting field, invalid section type, image format/size mismatch |
| 401 | Not logged in or expired | Missing `x-token`, token invalid |
| 403 | CSRF validation failed | Write operation missing `x-csrf-token`, token invalid or expired |
| 429 | Rate limit triggered | Same IP 5 consecutive password failures |

---

Related docs: [README](README.md) · [AGENTS.md](AGENTS.md) · [TESTING.md](TESTING.md) · [SECURITY.md](../SECURITY.md)
