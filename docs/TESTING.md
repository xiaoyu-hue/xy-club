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
| 耗时参考 | 约 5 秒 |

### 文件与职责

| 文件 | 覆盖什么 | 为什么必须有 |
|------|---------|-------------|
| `tests/password.test.js` | scrypt 哈希格式、校验、旧明文兼容、损坏输入 | 对应 README「密码不以明文存储」的声明 |
| `tests/auth.test.js` | 登录、token、会话过期、鉴权中间件、改密码 | 这是全站唯一的安全边界 |
| `tests/rate-limit.test.js` | 5 次失败锁定、成功后清零、锁定自动解除 | 防暴力破解 |
| `tests/content-api.test.js` | 内容读写落盘、密码不可被篡改、内联图片还原 | 数据完整性 |
| `tests/upload.test.js` | 格式白名单（SVG 必须被拒）、8MB 上限、nosniff | 上传是唯一"把外部字节写进磁盘"的入口 |
| `tests/static-build.test.js` | 静态快照不含凭据、资源用相对路径 | GitHub Pages 子路径托管白屏 / 泄密的防线 |
| `tests/resilience.test.js` | `db.json` 损坏时备份现场并回退默认 | 第一原则：不破坏用户已有数据 |
| `tests/contract-defaults.test.js` | 板块类型 ↔ 渲染分支 ↔ 主题 ↔ 后台选项 | 防"加了类型忘了渲染""加了主题后台没选项" |
| `tests/docs-sync.test.js` | 版本号漂移、中英 README 断链、API 表与路由不一致 | 把「改了行为必须同步文档」自动化 |

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
