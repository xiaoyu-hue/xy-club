# v1.8.0 实施任务清单 · 多行业参考案例演示站

> 依据：`docs/adr/ADR-005.md`（提议中，待批准后改「已采纳」）
> 版本：1.7.1 → **1.8.0**（minor，新增功能）
> 铁律：零新增依赖 · 零前端框架 · 零构建步骤 · 不改数据结构

---

## 阶段一：内容资产（先做，可独立验收）

| # | 任务 | 产出 | 验收 |
|---|------|------|------|
| 1.1 | 下载 15 张免费商用图片（Unsplash / Pexels），**优先无正脸、无他人 Logo** | `public/cases/images/*.webp` | 总体积 < 5MB；`file` 确认格式 |
| 1.2 | 编写 4 个新行业案例 JSON | `cases/warmwood-coffee.json` / `mingli-law.json` / `cloudpivot.json` / `shiguang-photo.json` | JSON 合法；板块类型在白名单内；无 `adminPassword` |
| 1.3 | 导出案例 1（XY俱乐部）为独立 JSON | `cases/xy-club.json` | 与 `content.json` 内容一致 |
| 1.4 | 编写案例清单 | `cases/manifest.json` | 含 id / name / industry / emoji / theme / desc |
| 1.5 | **P1 内容层去真实化**：企业名查证不撞名；电话用 `400-000-0000` 占位；地址用"XX市 XX 区 XX 路"；Logo 一律 emoji | 4 个案例 JSON | 全文检索无真实号码/门牌/品牌 |
| 1.6 | **P2 图片授权台账** | `cases/CREDITS.md` | 每图含原始 URL + License + 下载日期 |

## 阶段二：前端切换机制

| # | 任务 | 涉及文件 | 验收 |
|---|------|---------|------|
| 2.1 | `loadContent()` 支持 `?case=` | `public/js/main.js` | 四级回退：API → cases/<id> → content.json → 报错 |
| 2.2 | **P4 无效 case id 优雅回退默认** | `public/js/main.js` | `?case=不存在` 不白屏，回落默认案例 |
| 2.3 | **P3 切换全量重渲染 + 主题重置** | `public/js/main.js` | 标题/导航/板块/CTA/页脚/弹窗全部刷新，theme 重应用 |
| 2.4 | 新增切换器组件 | `public/js/case-switcher.js`（新） | 仅 static-mode 渲染；读取 manifest |
| 2.5 | **P6 pushState 切换 + popstate + 监听器清理** | `public/js/case-switcher.js` | 前进/后退可用；无监听器堆积 |
| 2.6 | 切换器挂载点 | `public/index.html` | 导航右侧容器 |
| 2.7 | 切换器样式（复用主题变量） | `public/css/style.css` | 8 套主题下均不破版 |
| 2.8 | **P5 图片 onerror 降级占位** | `public/js/main.js` | 图片缺失显示 CSS 占位块，不裂图 |
| 2.9 | 页脚声明（示例内容 + 图片来源） | `public/js/main.js` | 静态模式显示 |

## 阶段三：展示页升级

| # | 任务 | 涉及文件 | 验收 |
|---|------|---------|------|
| 3.1 | `themes-demo.html` 升级为「案例 + 主题」双区块 | `public/themes-demo.html` | 案例区点击跳 `?case=xxx` |
| 3.2 | 修复主题卡点击交互（现为 `alert`） | `public/js/themes-demo.js` | 改为跳转或有效反馈 |

## 阶段四：构建与 CI

| # | 任务 | 涉及文件 | 验收 |
|---|------|---------|------|
| 4.1 | `build-static.js` 同步生成 `cases/` 快照 | `scripts/build-static.js` | 本地跑通，生成 5+1 个 JSON |
| 4.2 | 部署 workflow 校验 cases 目录 | `.github/workflows/deploy-pages.yml` | 部署产物含 cases/ |

## 阶段五：测试

| # | 任务 | 涉及文件 | 验收 |
|---|------|---------|------|
| 5.1 | 新增案例 JSON 契约测试 | `tests/cases.test.js`（新） | 每个案例合法、类型白名单、无凭据 |
| 5.2 | **P7 manifest 与 cases 一致性 + 凭据零容忍门禁** | `tests/cases.test.js` | manifest 每个 id 有文件；任何案例含 `adminPassword` 即失败 |
| 5.3 | 更新 `static-build.test.js` | `tests/static-build.test.js` | 覆盖新产物 |
| 5.4 | 全量回归 | `npm test` | ≥158 项全绿 |

## 阶段六：文档同步（一票否决项）

| # | 任务 | 涉及文件 |
|---|------|---------|
| 6.1 | ADR-005 状态改「已采纳」 | `docs/adr/ADR-005.md` |
| 6.2 | ADR 索引登记 ADR-005 | `docs/adr/README.md` |
| 6.3 | 架构文档补静态回退新链路 | `docs/ARCHITECTURE.md` / `.en.md` |
| 6.4 | 部署文档补案例切换说明 | `docs/DEPLOY.md` |
| 6.5 | PRD 补 3.5 节「参考案例演示」 | `docs/PRD.md` |
| 6.6 | README 定位与预览说明（中英） | `README.md` / `README.en.md` |
| 6.7 | CHANGELOG 追加 v1.8.0（中英） | `CHANGELOG.md` / `.en.md` |
| 6.8 | 案例图片来源与授权说明 | `public/cases/CREDITS.md` |
| 6.9 | ADR-005 状态由「提议」改「已采纳」 | `docs/adr/ADR-005.md` |

## 阶段七：发布

| # | 任务 |
|---|------|
| 7.1 | `package.json` 版本 → 1.8.0 |
| 7.2 | 本地全量验证（test + lint + 起服务手测 5 个案例） |
| 7.3 | 推送 + 打 tag v1.8.0 + 建 Release |

---

## 七条保护（P1–P7）验收对照

| 保护 | 落在哪个任务 | 如何验证 |
|------|-------------|---------|
| **P1** 内容层零真实企业信息 | 1.5 | 全文检索无真实号码/门牌/品牌 |
| **P2** 图片授权可追溯 | 1.6 | `CREDITS.md` 每图有 URL+License+日期 |
| **P3** 切换全量重渲染 + 主题重置 | 2.3 | 切换后无上一案例残留 |
| **P4** 无效 case id 优雅回退 | 2.2 | 手改 URL 不白屏 |
| **P5** 图片 onerror 降级 | 2.8 | 删图后显示占位块 |
| **P6** pushState + 前进后退 + 监听器清理 | 2.5 | 浏览器前进/后退正常，无泄漏 |
| **P7** 案例契约测试门禁 | 5.2 | 注入 `adminPassword` 测试必须失败 |

---

## 风险与检查点

- ⚠️ **图片肖像权 / 商标权**：License 不覆盖可识别面孔与他人 Logo，挑选时必须规避（P2）。
- ⚠️ **撞名风险**：案例企业名必须查证不撞真实企业（P1）。
- ⚠️ **仓库体积**：超过 5MB 需压缩或减量。
- ⚠️ **Node 部署割裂**：切换器必须明确"演示案例只读"，避免用户以为后台能改。
- ⚠️ **文档不同步**：阶段六是硬门禁，`docs-sync.test.js` 会拦截遗漏。
- ⚠️ **状态污染**：多视图切换最易出的 bug，靠 P3 + P6 双保险。
