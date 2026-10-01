# 部署指南

本项目有两条部署路线，取决于你要不要用**后台管理**。

## 先选路线

| | 路线 A：Node 服务器 | 路线 B：纯静态托管 |
|---|---|---|
| 官网展示 | ✅ | ✅ |
| 后台管理 | ✅ 完整可用 | ❌ 不可用（入口自动隐藏） |
| 内容更新 | 后台随时改 | 改 `defaults.js` 后重新构建 |
| 需要什么 | 能跑 Node 的主机 | 任意静态托管 |
| 持久卷 | **必须** | 不需要 |
| 典型平台 | Render / Railway / Fly.io / VPS / 云函数 | GitHub Pages / Cloudflare Pages / Netlify / Vercel |

> 判断标准很简单：**你想不想在手机上改内容**。想 → 路线 A；只是想让别人看到 → 路线 B 更省心。

---

## 路线 A：Node 服务器（完整功能）

### 启动命令

```bash
pnpm install --prod     # 只装 express
PORT=8080 node server.js
```

平台通常会自己注入 `PORT`；服务已绑定 `0.0.0.0`，无需额外配置。

### 三个硬性要求

1. **挂载持久卷**：`data/` 与 `public/uploads/` 必须持久化。否则每次重启，内容和图片全没了。
2. **只跑一个进程**：JSON 是全量读写的，多副本并发会写坏数据。**不要开多实例、不要开自动扩缩容**。
3. **加一层反向代理**：主要提供 HTTPS。（登录限流已内置：同一 IP 连续 5 次错误锁定 5 分钟。）

### 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `PORT` | `3000` | 监听端口，平台一般会自动注入 |

### 部署后清单

- [ ] 打开 `/admin` 登录：密码取自环境变量 `ADMIN_PASSWORD`；未设置则看服务首次启动控制台打印的那串随机密码（仅一次）
- [ ] **部署后尽快改掉密码**（网站设置 → 修改管理密码）
- [ ] 上传一张图片，重启服务，确认图片还在（验证持久卷）
- [ ] 用后台导出一份 JSON 备份（图片已内联进配置，单文件即可完整迁移）
- [ ] 忘记密码时用 `node scripts/reset-password.js 新密码`（或 `--generate` 自动生成）重置（密码是哈希存储，不能手改）

---

## 路线 B：纯静态托管（仅官网）

静态环境没有 Node 进程，官网会回退读取 `content.json` 快照，后台入口自动隐藏。

### 构建

```bash
node scripts/build-static.js     # 生成 public/content.json 并校验 public/cases/ 多案例资产
```

这一步会做两件事：

1. 生成 `public/content.json`（默认案例快照，已剔除密码字段）
2. **校验** `public/cases/` 下的多案例资产——结构、板块类型、凭据字段、manifest 对应关系、图片引用

> ⚠️ 第 2 步失败会以**退出码 1** 结束。CI 里这意味着**阻断部署**，是刻意设计：防止坏案例资产被发到线上。
> 本地手动跑时若看到 `✗ 静态构建校验失败`，请先修好再发布。

产物就是整个 `public/` 目录。建议**在发布前删除后台相关文件**，避免误以为后台能用：

```bash
rm -f public/admin.html public/js/admin.js public/css/admin.css
```

### 多案例资产随产物一起发布

`public/cases/` 必须完整上传，否则**案例切换下拉框不出现**（切换器读不到 `manifest.json` 会静默跳过）：

```
public/cases/manifest.json      # 必须有：案例清单
public/cases/<id>.json          # 必须有：每个案例的内容
public/cases/images/*.webp      # 必须有：演示图片
public/cases/CREDITS.md         # 建议有：图片授权台账（对外可查）
```

仓库的 [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) 已内置「校验部署产物完整性」步骤，
会自动确认以上文件随产物发布、后台文件确已移除、案例数与 manifest 一致。

### 部署

把 `public/` 作为站点根目录上传即可。注意：若部署在子路径（如 GitHub Pages 的 `/xy-club/`），快照用相对路径 `./content.json` 读取，案例图片也用相对路径 `./cases/images/...`，均无需改配置。

### 更新内容

静态站没有后台，改内容只能：

1. 编辑 `defaults.js`（改默认案例）或 `public/cases/*.json`（改某个案例）
2. 重新跑 `node scripts/build-static.js`
3. 重新发布

新增一个案例：复制任一份 `public/cases/*.json` 改内容，在 `manifest.json` 的 `cases` 数组登记一行（`id` 只用小写字母/数字/连字符），补上图片，再跑一次构建脚本。**不需要改代码。**

---

## 从静态升级到完整版

随时可以。把代码部署到路线 A 的平台，把 `data/db.json` 放上去即可，前端会自动走 API 而不是快照——**同一份代码，两种形态**。

---

## 常见坑

| 现象 | 原因 |
|------|------|
| 重启后内容变回默认 | `data/` 没挂持久卷 |
| 官网空白或只有标题 | 静态托管缺少 `content.json`，跑一次构建脚本 |
| 后台能登录但保存无效 | 静态托管环境，没有后端可写 |
| 案例切换下拉框不显示 | `public/cases/manifest.json` 没上传，或上传路径不对 |
| 切到某案例白屏 | 该案例的 `<id>.json` 没随产物上传，或 JSON 有语法错误 |
| 案例图片裂图 | `public/cases/images/` 没上传；或 JSON 里写成了绝对路径而非 `./cases/images/...` |
| 分享的案例链接打开还是默认案例 | 链接里的 `?case=<id>` 参数丢了，或被托管平台的重写规则抹掉 |
| 多副本部署后内容互相覆盖 | 违反单进程要求，改成单实例 |
| 上传的图片 404 | `public/uploads/` 没持久化，或路径不对 |
