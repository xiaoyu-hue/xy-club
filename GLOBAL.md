# xy-club 项目记忆（GLOBAL.md）

## 核心规则（永久记住）

### 🚨 版本一致性铁律

**打 tag 的版本必须和文档体系版本、代码版本三者完全一致**

每次发版前必须执行检查清单：

```bash
cd /var/minis/workspace/xy-club

# 1. 确认代码版本号
cat package.json | grep '"version"'

# 2. 确认文档版本号
head -20 CHANGELOG.md | grep '## \['

# 3. 确认 Git Tag 指向正确的 commit（功能提交，非纯文档提交）
git log --oneline -5
git show <tag> --no-patch

# 4. 验证 GitHub Release
curl -s -H "Authorization: token ${GITHUBTOKEN}" \
  "https://api.github.com/repos/xiaoyu-hue/xy-club/releases" | \
  grep -E '"tag_name"|"name"'
```

### 错误案例（2026-09-29 教训）

| 问题 | 后果 | 修复 |
|------|------|------|
| v3.0.0 打在错误的 commit（纯文档提交）上 | 版本历史混乱 | 删除重建，v3.0.1 指向正确 commit |
| GitHub Release 与 Git Tag 不匹配 | 发布记录错误 | 必须同时更新两者 |

### 正确的发版流程

```bash
cd /var/minis/workspace/xy-club

# 1. 跑测试和构建检查
npm test
npm run build

# 2. 确认文档已同步（见 docs/DOC_SYNC.md）

# 3. 打 tag（格式：vMAJOR.MINOR.PATCH-PhaseN，指向功能 commit）
git tag -a vX.Y.Z-PhaseN <commit-hash> -m "vX.Y.Z-PhaseN: 一句话摘要

## feat
- 新增 ...

## fix
- 修复 ...

## test
- 新增 N 项测试（共 X 项全绿）

## docs
- CHANGELOG/README 同步

## breaking
- 无（完全向后兼容）"

# 4. 推送（用环境变量 GITHUBTOKEN）
git remote set-url origin "https://${GITHUBTOKEN}@github.com/xiaoyu-hue/xy-club.git"
git push origin main --tags

# 5. 创建 GitHub Release（API，非 git tag）
curl -s -X POST -H "Authorization: token ${GITHUBTOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/xiaoyu-hue/xy-club/releases" \
  -d '{
    "tag_name": "vX.Y.Z-PhaseN",
    "name": "vX.Y.Z-PhaseN — 一句话标题",
    "body": "完整 release notes（Markdown）",
    "draft": false,
    "prerelease": false
  }'
```

### 版本格式规范

| 元素 | 格式 | 示例 |
|------|------|------|
| Git Tag | `vMAJOR.MINOR.PATCH` 或 `vMAJOR.MINOR.PATCH-PhaseN` | `v1.5.2` 或 `v2.0.0-Phase1` |
| package.json version | `vMAJOR.MINOR.PATCH` | `"version": "1.5.2"` |
| CHANGELOG 标题 | `## [vX.Y.Z]` 或 `## [vX.Y.Z-PhaseN]` | `## [v1.5.2]` |
| GitHub Release tag_name | 必须与 Git Tag 完全一致 | `v1.5.2` |

### 历史版本参考

```
v1.3.0 - 初始版本
v1.4.0 - 基础功能完善
v1.4.2 - Bug 修复
v1.4.3 - 安全增强
v1.4.4 - 性能优化
v1.5.0 - 后台管理系统
v1.5.1 - 文档同步
v1.5.2 - 板块类型修复
v2.0.0-Phase0 - HTTP 安全头
v2.0.0-Phase1 - 输入验证强化
```

---

## 用户偏好

- 零编程基础，不懂代码，但我是最终决策者
- 要求结论先用大白话讲，专业细节放后面展开
- 术语第一次出现必须括号解释
- 给方案要讲清取舍
- 遇到技术缺陷或逻辑漏洞必须先指出并给出替代方案
- 发现重复踩同一个坑时要直接提醒
- 涉及删除、覆盖、花钱、发布等不可逆操作必须先征得同意

## 项目结构

```
/var/minis/workspace/xy-club/
├── server.js               # 后端服务器
├── package.json            # 依赖配置（version: 1.5.2）
├── render.yaml             # Render 部署配置
├── defaults.js             # 默认配置
├── public/                 # 前端静态资源
│   ├── index.html
│   ├── css/
│   └── js/
├── src/                    # 前端源代码
├── tests/                  # 测试文件（16 个）
├── docs/                   # 文档目录
│   ├── CHANGELOG.md        # 变更日志
│   ├── CHANGELOG.en.md     # 英文变更日志
│   ├── README.md           # 使用说明
│   ├── ARCHITECTURE.md     # 架构文档
│   └── CODE-REVIEW.md      # 代码审查报告
├── scripts/                # 构建脚本
├── e2e/                    # 端到端测试
└── GLOBAL.md               # 全局记忆（本文件）
```

## 技术栈

- **前端**: Vanilla JavaScript + Liquid Glass 风格
- **后端**: Node.js + Express
- **数据库**: SQLite（本地存储）
- **测试**: Node.js + 自定义测试框架
- **部署**: Render / Vercel
- **包管理**: npm + pnpm
- **CI/CD**: GitHub Actions

## 发版工具链

- Git tag 创建：`git tag -a vX.Y.Z-PhaseN <commit>`
- GitHub Release：通过 REST API 创建
- 环境变量：`GITHUBTOKEN`（已配置）
- Git Author：`xiaoyu-hue <xiaoyu-hue@users.noreply.github.com>`

## 重要提醒

1. **打 tag 前必须确认 commit 指向正确**（功能提交，非纯文档提交）
2. **Git Tag ≠ GitHub Release**：两者独立，必须分别创建
3. **每个 Phase 只打一个 tag**：不要在多个 commit 上打同一个 tag
4. **清理混乱的旧 tag**：删除前确认指向正确的 commit
5. **支持 Phase 标记**：大型功能可添加 -PhaseN 后缀

## 特殊说明

- 本项目为 XY 俱乐部官网模板
- 采用液态玻璃（Liquid Glass）视觉风格
- 数据驱动 + 可视化后台管理
- 可作为任意俱乐部官网复用
- 包含完整的后端 API（Express + SQLite）
- 支持图片上传和管理
- 代码审查报告完善（CODE-REVIEW.md）

## 文档提交规则（重要）

**以下文档禁止推送到 GitHub：**
- 审查报告（COMPREHENSIVE_REVIEW.md, CODE_REVIEW.md 等）
- 计划方案（IMPLEMENTATION_PLAN.md, THEME_SYNC_PLAN.md 等）
- 工作总结（FIX_SUMMARY.md, THEME_SYNC_COMPLETE.md 等）
- 临时文档（*.tmp, *.temp 等）

**可以推送的文档：**
- CHANGELOG.md / CHANGELOG.en.md
- README.md / README.en.md
- ARCHITECTURE.md / ARCHITECTURE.en.md
- PRD.md / PRD.en.md
- TESTING.md
- API.md / API.en.md
- GLOBAL.md
- LICENSE, CODE_OF_CONDUCT, CONTRIBUTING 等标准文档

**原因**：审查报告和计划方案是内部工作文档，推送会污染仓库。
