# 🔌 API 参考

XY 俱乐部的后台管理通过一组 REST 接口完成。所有接口均为 JSON，基址即站点根（例如 `http://localhost:3000`）。

> 这是 [README「API 一览」](README.md) 的详细展开版。改动接口时请同步更新 README 的 API 表——`tests/docs-sync.test.js` 会校验两者一致。

## 🔑 鉴权

除下列**公开**接口外，其余接口都需要在请求头携带登录 token：

```
x-token: <登录时返回的 token>
```

- Token 由 `POST /api/login` 签发，有效期 **7 天**，存于服务端内存（重启即失效）。
- 缺少或过期 token 时，接口返回 `401 { "error": "登录已过期，请重新登录" }`。

**公开接口**（无需 `x-token`）：

- `POST /api/login`
- `GET /api/health`
- `GET /api/check`
- `GET /api/content`

## 📦 通用约定

- 请求体：`Content-Type: application/json`（上传接口用 JSON 承载 base64，见下文）。
- 成功响应：`200` + JSON（具体形状见各接口）。
- 错误响应：非 `2xx` + `{ "error": "..." }` 或 `{ "ok": false, "error": "..." }`。
- 时间字段：`updatedAt` 为 ISO 8601 字符串。

## 接口列表

### POST /api/login

密码登录，签发会话 token。

请求体：

```json
{ "password": "xy888888" }
```

成功 `200`：

```json
{ "ok": true, "token": "a1b2c3..." }
```

错误：

- `401 { "ok": false, "error": "密码错误，请重试" }` — 密码不匹配
- `429 { "ok": false, "error": "尝试次数过多，请 5 分钟后再试" }` — 该 IP 已被限流（连续 5 次错误）

> 命中遗留明文密码时，服务端会在本次登录顺手将其升级为 scrypt 哈希。

### GET /api/health

健康检查，供监控 / 探活使用，无需登录。

成功 `200`：

```json
{ "ok": true }
```

### GET /api/check

校验当前 token 是否仍有效（无需先登录即可询问）。

请求头：`x-token: <token>`

成功 `200`：

```json
{ "ok": true }
```

`ok` 为 `false` 表示 token 缺失或已过期。

### GET /api/content

获取整站内容（**公开**，无需登录）。密码等敏感字段已被脱敏。

成功 `200`：

```json
{
  "settings": { "siteName": "...", "theme": "aurora", "contact": { "wechat": "..." } },
  "sections": [ { "type": "services", "title": "...", "items": [ ... ] } ],
  "updatedAt": "2026-09-26T01:00:00.000Z"
}
```

> `settings` 中**不含** `adminPassword`，前端拿不到密码哈希。

### PUT /api/content

保存整站内容与设置（**需鉴权**）。

请求体：

```json
{
  "settings": { "siteName": "...", "theme": "ocean", "contact": { ... } },
  "sections": [ { "type": "services", "title": "...", "items": [ ... ] } ]
}
```

- `settings` 与 `sections` 均为必填，缺失或 `sections` 非数组返回 `400 { "error": "数据格式错误" }`。
- 导入配置中内联的图片（data URI）会被自动还原为 `public/uploads/` 下的真实文件。

成功 `200`：

```json
{ "ok": true, "settings": { ... }, "sections": [ ... ], "restoredImages": true }
```

> 密码字段不会被本次请求覆盖——`adminPassword` 始终以服务端存储值为准。

### POST /api/password

修改管理密码（**需鉴权**）。

请求体：

```json
{ "oldPassword": "xy888888", "newPassword": "newSecret6" }
```

成功 `200`：`{ "ok": true }`

错误：

- `400 { "error": "原密码错误" }` — 旧密码校验失败
- `400 { "error": "新密码至少 6 位" }` — 新密码为空或少于 6 位

> 新密码以 scrypt 哈希存储，无法再直接手改 `db.json`。

### POST /api/reset

恢复为模板默认内容（**需鉴权**）。换俱乐部复用时可先恢复默认再改内容。

成功 `200`：

```json
{ "ok": true, "settings": { ... }, "sections": [ ... ] }
```

### POST /api/upload

上传图片（**需鉴权**）。图片以 base64 data URI 形式随请求体提交。

请求体：

```json
{ "data": "data:image/png;base64,iVBORw0KGgo..." }
```

校验规则：

- 必须是 `data:image/...` 开头的 data URI，否则 `400 { "error": "仅支持图片文件" }`
- 扩展名白名单：`jpg / png / webp / gif`（`jpeg` 归一为 `jpg`），**不支持 svg**，否则 `400 { "error": "仅支持 jpg / png / webp / gif 格式" }`
- 解码后大小 ≤ 8MB，否则 `400 { "error": "图片不能超过 8MB" }`

成功 `200`：

```json
{ "ok": true, "url": "/uploads/1695700000000-ab12cd34.png" }
```

返回的相对路径可直接用于图片集等板块。

## ⚠️ 错误码速查

| 状态码 | 含义 | 常见触发 |
|--------|------|----------|
| 400 | 请求格式错误 | 缺少必填字段、密码过短、图片格式/大小不符 |
| 401 | 未登录或登录已过期 | 缺 `x-token`、token 失效 |
| 429 | 触发限流 | 同一 IP 连续 5 次密码错误 |

---

相关文档：[README](README.md) · [AGENTS.md](AGENTS.md) · [TESTING.md](TESTING.md) · [SECURITY.md](../SECURITY.md)
