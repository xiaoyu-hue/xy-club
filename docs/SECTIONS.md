# 板块字段参考

官网的每个板块（section）都是 `data/db.json` 里 `sections` 数组的一项。改数据结构或新增板块类型前，请以本文档为准。

## 板块通用字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识，用于导航锚点（如 `s-game`），不要重复 |
| `type` | string | ✅ | 渲染类型，见下表 |
| `icon` | string | ✅ | 板块标题前的 emoji |
| `title` | string | ✅ | 板块标题 |
| `subtitle` | string | — | 板块副标题 |
| `tip` | string | — | 板块底部的补充说明（`services` 类型常用） |
| `visible` | boolean | ✅ | 是否在官网显示（后台 👁 按钮切换） |
| `items` | array | 视类型 | 条目列表；`text` 类型不用此字段 |
| `content` | string | 视类型 | 仅 `text` 类型使用，支持 `\n` 换行 |

## 各类型的条目字段

### `services` 价目列表

```json
{ "name": "技术陪玩 / 上分车", "price": "29.9-49.9", "unit": "元/小时", "desc": "实力带飞，稳稳上分" }
```

| 字段 | 说明 |
|------|------|
| `name` | 项目名 |
| `price` | 价格（字符串，支持区间写法） |
| `unit` | 计价单位 |
| `desc` | 一句话说明 |

### `cards` 卡片网格

```json
{ "icon": "🌟", "title": "星级陪玩官", "desc": "每位陪玩官均通过试单考核" }
```

| 字段 | 说明 |
|------|------|
| `icon` | 卡片图标 emoji |
| `title` | 卡片标题 |
| `desc` | 卡片描述 |

### `testimonials` 客户评价

```json
{ "emoji": "🌙", "who": "小星星", "rating": 5, "text": "哄睡电话真的太治愈了" }
```

| 字段 | 说明 |
|------|------|
| `emoji` | 头像 emoji |
| `who` | 署名 |
| `rating` | 评分，1–5 |
| `text` | 评价正文 |

### `faq` 常见问答

```json
{ "q": "如何下单？", "a": "添加客服微信，告诉客服你想选择的项目和时长" }
```

| 字段 | 说明 |
|------|------|
| `q` | 问题 |
| `a` | 答案 |

### `notice` 须知列表

```json
{ "icon": "🕐", "text": "深夜时段（23:00–8:00）加收 30%" }
```

| 字段 | 说明 |
|------|------|
| `icon` | 条目 emoji |
| `text` | 条目文本 |

### `gallery` 图片集

```json
{ "url": "/uploads/xxx.jpg", "caption": "2026 年会现场" }
```

| 字段 | 说明 |
|------|------|
| `url` | 图片地址（后台上传后为 `/uploads/文件名`，也可填外链）。**导出配置时会自动内联成 data URI**，导入新站点后还原为文件 |
| `caption` | 图片说明，可留空 |

### `text` 图文段落

```json
{ "id": "s-about", "type": "text", "title": "关于我们", "content": "第一段\n\n第二段" }
```

`content` 为纯文本，`\n` 表示换行，**不支持 HTML**（渲染时会被转义，以防 XSS）。

## 新增一种板块类型要改四处

1. `defaults.js` — 提供默认示例数据
2. `public/js/main.js` — 在 `renderSection` 的 `switch` 中新增 `case`
3. `public/js/admin.js` — 新增对应的编辑表单字段
4. 本文档 — 补充字段说明

## 注意事项

- 渲染用户输入时一律经过 `esc()` 转义，不要直接拼接 HTML
- `id` 重复会导致导航锚点冲突，新增板块请用唯一前缀
- `visible: false` 的板块不会渲染，但数据仍保留在 `db.json` 中
