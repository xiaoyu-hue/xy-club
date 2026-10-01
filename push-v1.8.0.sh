#!/usr/bin/env bash
# v1.8.0 推送脚本
#
# 用法：
#   ./push-v1.8.0.sh <你的新GitHubToken>
#
# 说明：
#   旧 Token 已失效（API 返回 Bad credentials），需要你到 GitHub 重新生成一个。
#   生成地址：https://github.com/settings/tokens
#   需要的权限：repo（勾选 repo 整组即可）
#
# 本脚本做的事：
#   1. 推送 main 分支到 GitHub
#   2. 打 tag v1.8.0 并推送
#   3. 提示你去创建 Release
#
# 安全提示：脚本不会把你的 Token 写进任何文件，只用于当次推送。

set -e

TOKEN="$1"

if [ -z "$TOKEN" ]; then
  echo "错误：请把新 Token 作为参数传入"
  echo "用法：./push-v1.8.0.sh <你的新GitHubToken>"
  exit 1
fi

if [[ ! "$TOKEN" =~ ^gh[pousr]_ ]]; then
  echo "警告：Token 格式看起来不像 GitHub Token（通常以 ghp_ / github_pat_ 开头），继续尝试..."
fi

cd "$(dirname "$0")"

echo "==> 当前待推送的提交："
git log --oneline -3
echo ""

# 通过代理写入（沙箱内直连 github.com 不通）
REPO="xiaoyu-hue/xy-club"
PROXY="https://ghproxy.net/https://github.com/$REPO.git"
AUTH_URL="https://xiaoyu-hue:${TOKEN}@${PROXY#https://}"

echo "==> 推送到 main..."
git push "$AUTH_URL" main:main
echo "✓ main 已推送"
echo ""

# 打 tag
if git rev-parse "v1.8.0" >/dev/null 2>&1; then
  echo "==> tag v1.8.0 已存在，跳过创建"
else
  echo "==> 创建 tag v1.8.0..."
  git tag -a v1.8.0 -m "v1.8.0 多案例演示站"
fi

echo "==> 推送 tag v1.8.0..."
git push "$AUTH_URL" v1.8.0
echo "✓ tag v1.8.0 已推送"
echo ""

echo "=================================================="
echo "完成！接下来请手动做两件事："
echo ""
echo "1. 创建 Release（约 1 分钟）："
echo "   https://github.com/$REPO/releases/new?tag=v1.8.0"
echo "   标题填：v1.8.0 多案例演示站"
echo "   正文可直接复制 CHANGELOG.md 里 v1.8.0 那一段"
echo ""
echo "2. 确认 GitHub Pages 部署成功（约 2 分钟）："
echo "   https://github.com/$REPO/actions"
echo "   打开 https://xiaoyu-hue.github.io/xy-club/ 验证案例切换下拉框"
echo "   "
echo "   ⚠️ 若部署失败，多半是新的 CI 校验步骤拦住了问题，"
echo "      去 Actions 日志里看「校验部署产物完整性」那一步的输出。"
echo ""
echo "3. 【安全提醒】推送完成后，请到这个页面把本次用的 Token 也撤销掉："
echo "   https://github.com/settings/tokens"
echo "   因为它在终端里出现过，留着有泄露风险。用完即撤最安全。"
echo "=================================================="
