# 产品需求文档（PRD）— XY 俱乐部官网模板

> 版本：1.10.2
> 状态：维护中
> 最后更新：2026-09-28
> 定位：本文档是功能的**需求真源**；实现细节以 `ARCHITECTURE.md` / `API.md` 为准，决策以 `docs/adr/` 为准。

---

## 一、产品定位

**XY 俱乐部官网模板**是一套可复用的俱乐部 / 社团官网：

- 液态玻璃（Liquid Glass）视觉风格 + 微交互
- 数据驱动的官网（内容改完刷新即见）
- 可视化后台管理（非技术人员也能改）
- 支持纯静态托管（无 Node 进程时回退读快照）

目标不是"某个俱乐部的定制站"，而是一套**开箱即用的模板**，任何人 clone 后改内容即可上线。

## 二、目标用户 / 非目标

| 目标用户 | 非目标 |
|---------|--------|
| 不懂代码的俱乐部运营者 | 需要多用户 / 多角色后台的 SaaS |
| 想要好看官网的小团队 | 高并发、多副本的大型站点 |
| 希望零运维部署的个人 | 需要复杂权限 / 工作流的平台 |

## 三、功能模块

### 3.1 官网（数据驱动渲染）
- 8 种板块类型（`docs/SECTIONS.md` 字段参考）：如服务 / 成员 / 活动 / 资讯 / 图片集 / 自由文本等
- 8 套主题（aurora / ocean / mist / sunset 暗色；mist / neutral_morning / neutral_cloud / neutral_oat / neutral_navy 亮色商务），同一套 CSS + 变量切换
- 8 处微交互（`bind*` 系列）：光标高光、卡片倾斜、点击涟漪、数字滚动、滚动进度、错落渐显等，均尊重 `prefers-reduced-motion`、触屏降级

### 3.2 后台管理（可视化编辑）
- 登录（单管理员，scrypt 哈希，见 ADR-001）
- 板块增删改、主题切换、站点设置
- 图片上传（白名单 jpg/png/webp/gif，≤8MB，**不支持 SVG**）
- 配置导出 / 导入（导出内联 data URI 自包含，导入还原真实文件）

### 3.3 服务端（Node/Express）
- 静态托管 `public/`
- REST API：`GET /api/content`、`PUT /api/content`、`POST /api/login`、`POST /api/upload`、`GET /api/health` 等（详见 `docs/API.md`）
- 唯一运行时依赖 `express`，密码哈希用 Node 内置 `crypto`

### 3.4 静态回退
- 无 Node 进程时，前端回退读 `public/content.json`（由 `scripts/build-static.js` 生成，已剔除密码字段）
- 静态模式下官网完整可用，**后台不可用**

### 3.5 多案例演示（v1.8.0 / ADR-005）
- 静态预览站内置 **5 个跨行业参考案例**（陪玩俱乐部 + 咖啡 / 律所 / SaaS / 摄影），顶部下拉框即时切换
- 案例为纯静态 JSON（`public/cases/*.json`），字段与 `DEFAULT_DB` 同构，仅由现有 8 种板块类型拼装
- 切换用查询参数 `?case=<id>`，纯静态托管可用；`history.pushState` + `popstate` 支持浏览器前进/后退
- 4 个非俱乐部案例**全部虚构**，机构名/电话/地址/Logo 均为演示内容，并在首屏显式声明「虚构」
- 案例配图为项目作者**自有版权**的原创摄影作品，版权说明登记在 `public/cases/CREDITS.md`（v1.10.0 起；此前的第三方图库台账因无法核验已废弃）
- 案例资产在构建期（`scripts/build-static.js`）与测试期（`tests/cases.test.js`）双重校验：结构 / 类型 / 凭据 / 图片引用

## 四、数据规范

唯一真源：`data/db.json`，形状由 `defaults.js` 的 `DEFAULT_DB` 定义。

```json
{
  "settings": { "siteName": "...", "theme": "aurora", "adminPassword": "scrypt$..." },
  "sections": [ { "id": "s-game", "type": "services", "items": [] } ]
}
```

- 字段缺失必须有向后兼容默认值（旧数据不得"凭空消失"）
- `adminPassword` 永不以明文落库（scrypt 哈希）
- 字段真源的改动须同步 `docs/SECTIONS.md` 与 `docs/API.md`

## 五、非功能需求

| 维度 | 要求 |
|------|------|
| 零构建 / 零依赖 | 前端无框架无打包器；运行时依赖仅 `express` |
| 单进程 | 不允许多副本部署（JSON 全量读写冲突） |
| 持久化 | `data/` 与 `public/uploads/` 落持久卷 |
| 响应式 | 375px 窄屏不破版 |
| 可访问性 | 动画尊重 `prefers-reduced-motion` |
| 安全 | 用户输入渲染前转义；上传限大小；API 明确鉴权要求；写操作强制 CSRF token；HTTP 安全头；输入验证（字段白名单 + 原型链污染防御） |
| 跨版本 | `node >= 18`（CI 矩阵 18/20/22） |

## 六、验收标准

- [ ] `npm test` 全绿（当前 **244 项 / 65 suites**，唯一强制门禁）
- [ ] 官网首页无控制台报错
- [ ] 八套主题均正常渲染且文字可读
- [ ] 后台登录 → 编辑 → 保存 → 刷新，内容一致
- [ ] 375px 窄屏未破版
- [ ] **5 个案例均可切换、可分享、可前进后退；无效 `?case=` 优雅降级**
- [ ] **首页 CTA 区块与页脚正常渲染**（v1.8.0 修复的线上事故，已补测试固化）
- [ ] **后台 320/360/390/430/768/1280px 六档视口均无横向溢出**（v1.9.0）
- [ ] **后台移动端操作按钮 ≥44px、表单单列、条目纵向堆叠**（v1.9.0）
- [ ] **卡片/评价/须知三个板块可上传图片，且老数据（纯表情）渲染不变**（v1.9.0）
- [ ] 中英文档已同步，CHANGELOG 已追加条目
- [ ] 无新增运行时依赖，无引入前端框架
- [ ] 涉及鉴权 / 上传 / 渲染的改动已补对应测试用例

## 七、版本历史表

| 版本 | 类型 | 一言 |
|------|------|------|
| 1.10.2 | patch | 文档治理：过程产物归档至 docs/_archive/、删除孤立标签、新增 doc-policy 门禁 |
| 1.10.1 | patch | 修复 release 徽章显示旧版本：shields.io 默认按创建时间而非 SemVer 判定 latest，补 `sort=semver` |
| 1.10.0 | minor | 图片版权合规：移除 16 张无法核验授权的第三方图片，改用自有版权作品；新增版权校验测试 |
| 1.9.0 | minor | 后台移动端可用性：移除毛玻璃（FPS 46.7→60.2）、条目操作改局部更新、四档响应式、三个板块支持传图 |
| 1.8.0 | minor | 多案例演示站：5 个跨行业案例可切换；修复首页 CTA 与页脚从未渲染的线上事故 |
| 1.7.1 | patch | 移除冲突的 `eslint.config.js`（lint 崩溃根因） |
| 1.7.0 | minor | 安全加固：移除默认弱密码、登录限流绕过封堵、CSP 收紧、上传魔数校验、审计日志 |
| 1.6.x | patch | 主题体系重构为 8 套、板块类型扩展至 8 种、契约加固 |
| 1.5.2 | patch | 安全加固：HTTP 安全头 + 输入验证强化；修复 custom / gallery 板块被白名单误拒 |
| 1.5.1 | patch | 安全加固：CSRF 防护（写操作强制校验 token） |
| 1.5.0 | minor | 全局自定义：自由字段 + 自由文本板块 + 价格划线原价 |
| 1.4.3 | patch | 文档体系补全：DOC_SYNC / DECISION_REVIEW / ADR×4 / PRD / AUTHOR / 架构英文版 |
| 1.4.2 | patch | CI 修复：移除 Node 18 不支持的 `--test-timeout`，Node 18/20/22 矩阵全绿 |
| 1.4.0 | minor | 补全自动化测试：73 项 `node --test` 门禁 + 可选 E2E（Playwright 不进依赖） |
| 1.3.0 | minor | 安全加固：管理密码 scrypt 哈希、后台未登录不渲染、README API 表修正 |

> 完整条目见 `CHANGELOG.md` / `CHANGELOG.en.md`。版本号语义见 `docs/DOC_SYNC.md`。

## 八、明确范围外

- 多用户 / 角色权限系统
- 数据库 / ORM
- 多副本 / 水平扩容部署
- 前端框架 / 组件库
- 服务端渲染（SSR）

任何触及上述范围外的改动，必须先过 `docs/DECISION_REVIEW.md` 的决策三问。
