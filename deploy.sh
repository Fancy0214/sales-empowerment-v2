#!/bin/bash
# 部署脚本 - 在完成GitHub认证后运行

echo "======================================"
echo "留学销售赋能平台 V2 - 部署脚本"
echo "======================================"

# 检查是否已登录GitHub
if ! gh auth status &>/dev/null; then
    echo "⚠️  请先完成GitHub登录认证"
    echo ""
    echo "运行以下命令登录："
    echo "  gh auth login"
    echo ""
    echo "或设置GITHUB_TOKEN环境变量后重试"
    exit 1
fi

echo "✅ GitHub 已登录"

# 创建仓库（如果不存在）
REPO="sales-empowerment-v2"
if ! gh repo view fancy0214/$REPO &>/dev/null; then
    echo "📦 创建GitHub仓库..."
    gh repo create $REPO --public --source=. --push
else
    echo "✅ 仓库已存在"
    echo "📤 推送代码..."
    git push -u origin main
fi

# 启用GitHub Pages
echo "🌐 启用GitHub Pages..."
gh api repos/fancy0214/$REPO/pages -X POST -f build_type=workflow -f branch=main &>/dev/null || echo "Pages可能已在运行"

echo ""
echo "======================================"
echo "🎉 部署完成！"
echo ""
echo "访问地址: https://fancy0214.github.io/sales-empowerment-v2/"
echo "======================================"
