# 测试指南

本项目分两层：**单元测试是强制门禁，E2E 是可选加分项**。

分层的依据是成本 —— 单元测试用 Node 内置的 `node --test`，零新增依赖、约 5 秒跑完，任何环境都能跑；E2E 需要下载浏览器，只作为发布前的补充验证。

---

## 第一层：单元测试（强制）

```bash
npm test
```

| 项目 | 值 |
|------|-----|
| 运行器 | `node --test`（Node 内置） |
| 依赖 | 无（只需 `express` 跑起来，测试本身零依赖） |
| 用例位置 | `tests/*.test.js` |
| 用例规模 | 245 项 / 65 suites |
| 耗时参考 | 约 10–40 秒（视机器性能） |

### 文件与职责

| 文件 | 覆盖什么 | 为什么必须有 |
|------|---------|-------------|
| `tests/password.test.js` | scrypt 哈希格式、校验、旧明文兼容、损坏输入 | 对应 README「密码不以明文存储」的声明 |
| `tests/auth.test.js` | 登录、token、会话过期、鉴权中间件、改密码 | 这是全站唯一的安全边界 |
| `tests/rate-limit.test.js` | 5 次失败锁定、成功后清零、锁定自动解除 | 防暴力破解 |
| `tests/csrf.test.js` | token 签发、未登录拒发、写操作强制校验、错误 token 返回 403 | 写操作的第二道锁 |
| `tests/security-headers.test.js` | nosniff / X-Frame-Options / CSP 等全局安全头、X-Powered-By 移除 | 防 MIME 嗅探与点击劫持的回归防线 |
| `tests/input-validation.test.js` | 字段白名单、板块类型白名单、原型链污染过滤、deepClone | 恶意 / 畸形输入进不了存储层 |
| `tests/password-session.test.js` | 改密码后其余旧会话失效 | 防改密码后旧 token 在 7 天内继续可用 |
| `tests/content-api.test.js` | 内容读写落盘、密码不可被篡改、内联图片还原 | 数据完整性 |
| `tests/upload.test.js` | 格式白名单（SVG 必须被拒）、8MB 上限、nosniff | 上传是唯一"把外部字节写进磁盘"的入口 |
| `tests/static-build.test.js` | 静态快照不含凭据、资源用相对路径 | GitHub Pages 子路径托管白屏 / 泄密的防线 |
| `tests/resilience.test.js` | `db.json` 损坏时备份现场并回退默认 | 第一原则：不破坏用户已有数据 |
| `tests/contract-defaults.test.js` | 板块类型 ↔ 渲染分支 ↔ 主题 ↔ 后台选项 | 防"加了类型忘了渲染""加了主题后台没选项" |
| `tests/docs-sync.test.js` | 版本号三方一致（package.json / CHANGELOG / docs 版本头）/ 旧版本号残留 / 中英 README 配对 / API 表与真实路由一致 / **release 徽章必须带 `sort=semver`**（13 项） | 防止版本与文档漂移（v1.10.0 起纳入 docs 版本头门禁，v1.10.1 起纳入徽章参数门禁） |
| `tests/frontend-util.test.js` | `esc()` 转义与 `TYPES` 板块类型定义（前端纯函数） | XSS 第一防线 + 类型定义一致性 |
| `tests/cases.test.js` | 案例 JSON 结构 / 板块类型白名单 / 凭据零容忍 / 虚构声明 / 图片溯源 / 相对路径 / 主题合法性 / `heroStats` 格式（29 项） | v1.8.0 多案例内容资产的契约门禁（ADR-005 P7） |
| `tests/case-isolation.test.js` | 服务端不引用 `cases/`、`DB_FILE`/`UPLOAD_DIR` 越界检查、前端回退顺序、改案例不影响 API、服务端写入不落 `cases/`（13 项） | 守住「静态案例 ↔ 服务端内容」两条路径永不交叉（ADR-005 P8） |
| `tests/admin-perf.test.js` | 后台禁用 `backdrop-filter` / 光斑禁用 `blur` / 断点数量 / 44px 触控尺寸 / 条目操作不得整列表重绘 / 三板块支持传图（18 项） | 把手机端性能与响应式约束固化为门禁，防止模糊与全量重绘回归（v1.9.0） |
| `tests/credits.test.js` | 台账与图片目录双向一致 / 无僵尸图片 / 引用真实存在 / 拒绝 12 位伪 Unsplash ID / 图片体积上限 / 对外文案不得再宣称 Unsplash（11 项） | 把图片版权合规固化为门禁：防止僵尸文件、失效引用与编造台账（v1.10.0） |
| `tests/doc-policy.test.js` | 过程产物不得进主线（审查报告/版本计划/工作总结，`docs/_archive/` 除外）/ 禁推清单自检（防误杀流程工具）/ tag 格式统一 / tag 版本不得高于 `package.json`（7 项） | 让「GLOBAL.md 写了但没人执行」的规则真正可执行（v1.10.2） |
| `tests/harness.js` | （非测试文件）临时目录隔离 + 内存服务器启动 | 所有测试的公共底座 |

> **为什么需要 `admin-perf.test.js`**：手机后台卡顿的根因**不在 JavaScript，而在 CSS**。
> 后台原有 25 个元素使用 `backdrop-filter: blur(20px)`，且叠在 `blur(80px)` 的持续动画色块之上——
> 手机 GPU 被迫每帧执行十几次实时高斯模糊。实测（CPU 4 倍降速）：关闭后 **FPS 46.7 → 60.2，最长帧 30.7ms → 17.4ms**。
> 这类问题**不会报错、不会崩溃**，只是"整体都卡"，且容易被误判为 JS 性能问题而浪费时间。
> 该文件把这些实测出来的红线写成断言，任何把模糊或全量重绘加回来的改动都会立刻变红。

> **为什么需要 `credits.test.js`**：v1.8.0 的 `CREDITS.md` 登记了 16 张「Unsplash 免费商用」图片，
> 但登记的 URL 用的是 **12 位十六进制 ID**，而 Unsplash 的照片 ID 实为 **11 位短码**（`varchar(11)`）——
> 格式对不上，说明台账无法自证授权。同时 16 张图里只有 4 张被真正引用。
> 本测试把「台账必须可核验、不许有僵尸文件」变成 CI 门禁，杜绝此类问题复发（v1.10.0）。

> **为什么 `docs-sync.test.js` 要管 release 徽章的 URL 参数**：v1.10.0 发版后徽章仍显示 `v1.8.0`。
> 起初以为是 CDN 缓存，实为**语义错误**——shields.io 默认走 GitHub `/releases/latest`，
> 而该接口按**创建时间**判定 latest，不是按 SemVer 大小。v1.9.0 与 v1.10.0 的 `created_at` 完全相同
> （同为 `05:41:17`），因此"哪个是 latest"在 API 层就是不确定的。加上 `?sort=semver` 后口径才与版本号一致。
> 这类缺陷**不会让任何测试变红**（徽章是外链图片、不会被解析），只能靠静态断言锁参数——故补此门禁（v1.10.1）。

> **为什么需要 `doc-policy.test.js`**：`GLOBAL.md` 的「文档提交规则」从写下那天起就没被检查过。
> 规则说审查报告/计划/总结禁止推送，而 `CODE-REVIEW.md`、`docs/FIX_SUMMARY.md`、`docs/PLAN-v1.8.0.md`
> 一直在仓库里躺着——**光写"禁止"没有检查，等于没写**。
>
> 同时它守住了另一个坑：本文件初版曾断言「所有 tag 必须是 HEAD 的祖先」，
> 结果把 `v1.3.0`~`v1.5.1` 这 7 个**正式发布过**的版本判成违规（它们因 `main` 被重建而位于分叉历史）。
> 教训：**「不在祖先链」≠「错误」**，删掉它们反而会让已发布的 Release 变成孤儿。
> 现在改为只守「tag 格式统一」与「tag 版本不高于代码版本」这两条真正成立的红线（v1.10.2）。

> **过程产物 vs 流程工具 —— 别搞混**：
> `FIX_SUMMARY.md`（这次做了什么）会过期，是过程产物 → 归档；
> `DECISION_REVIEW.md`（以后该怎么做）长期有效，是流程工具 → 保留。
> 判据是「描述过去的一次动作」还是「描述未来的行为准则」。

> ⚠️ **写依赖 git 的测试前必读：`actions/checkout@v4` 默认 `fetch-depth=1` 且不抓取标签。**
>
> `doc-policy.test.js` 初版断言「`git tag -l` 必须非空」，本地全绿、**CI 三个 Node 版本全红**——
> 因为 CI 里 `git tag -l` 返回空。这是典型的"在我机器上是好的"。
>
> **规避方式**：环境前提不满足时**跳过并说明原因**，不要断言其存在：
>
> ```js
> const tags = git(['tag','-l','v*']).split('\n').filter(Boolean);
> if (tags.length === 0) return t.skip('本地无标签（CI 浅克隆不抓标签，属预期）');
> ```
>
> **验证方式**：任何依赖 git 历史的测试，都必须在干净检出里跑一遍再提交：
>
> ```bash
> git clone --depth 1 --no-tags file://$PWD /tmp/ci-sim && cd /tmp/ci-sim
> node --test tests/*.test.js
> ```

> **为什么需要 `case-isolation.test.js`**：v1.8.0 后内容有两条来源——服务端的 `data/db.json` 与静态的 `public/cases/*.json`。
> 二者的分离在架构上天然成立（`server.js` 完全不认识 `cases/` 目录），但那是**隐式约定**。一旦被无意打破，
> 症状是「后台改了但页面不变」或「静态站覆盖真实内容」，**没有任何报错**，排查代价极高。
> 该文件把约定固化为可执行门禁，并用破坏性实验验证过有效性（人为制造违规时确实变红）。

### 隔离机制

`tests/harness.js` 在每个测试文件加载时创建**临时目录**并把 `DATA_DIR` / `UPLOAD_DIR` 指过去。因此：

- 用例绝不会读到开发者真实的 `data/db.json`
- 用例之间互不干扰（`node --test` 每个文件一个进程）
- 服务用 `listen(0)` 临时端口 + `unref()`，跑完自动退出，不占 3000

> 想让服务端用别的目录跑，直接设环境变量即可：`DATA_DIR=/tmp/foo node server.js`。

---

## 第二层：E2E（可选）

E2E 用 Playwright 在真实浏览器里验证「用户能不能看到、会不会报错、窄屏会不会破版」。

**它没有写进 `package.json` 的依赖列表** —— 这样 `express` 仍是唯一声明的依赖，锁文件也不用跟着变。没装就自动跳过，不会让命令失败。

```bash
npm i -D @playwright/test      # 装到 devDependencies，不污染运行时依赖
npx playwright install chromium
npm run test:e2e
```

| 项目 | 值 |
|------|-----|
| 配置 | `playwright.config.js` |
| 视口 | desktop 1280×800 + mobile 375×667 |
| 服务 | `e2e/serve.js`（一次性数据目录，每次启动清空） |
| 用例 | `e2e/smoke.spec.js`（官网）、`e2e/admin.spec.js`（后台闭环） |

已覆盖：

- 首页渲染出厂内容、无控制台报错
- 四套主题切换后 CSS 变量非空（防配色缺项）
- 375px 窄屏不横向溢出
- 静态托管模式下不暴露后台入口
- 后台：错误密码拦住、登录成功、主题切换、改站名 → 保存 → 刷新仍在、刷新后保持登录态

未安装时的行为：

```
跳过 E2E：未安装 @playwright/test。
...
```

退出码为 0，CI 不会因此变红。

---

## 纪律（照搬自同类项目的经验）

1. **现有测试是安全网，不是旧包袱** —— 不得因为"更干净""重构需要"删除。
2. **禁止先改测试来逃避失败**。测试失败先判断：真 bug？依赖了废弃的内部实现？有意的行为改变？判断要写进提交信息。
3. **新增功能必须同时新增测试**；涉及鉴权 / 上传 / 用户输入渲染的改动必须留对应用例。
4. **文档里写的测试数量必须以 `npm test` 实际输出为准**，禁止凭印象写数字。
