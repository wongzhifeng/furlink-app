#!/bin/bash

# FurLink Web前端部署脚本
# 用于部署到Zeabur平台

echo "🐾 FurLink Web前端部署脚本"
echo "================================"

# 检查Node.js版本
echo "检查Node.js版本..."
node --version
npm --version

# 安装依赖
echo "安装依赖..."
npm install

# 构建项目
echo "构建项目..."
npm run build

# 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建成功！"
    echo "构建文件："
    ls -la dist/
else
    echo "❌ 构建失败！"
    exit 1
fi

echo ""
echo "🚀 部署准备完成！"
echo ""
echo "Zeabur部署步骤："
echo "1. 将代码推送到GitHub"
echo "2. 在Zeabur中连接GitHub仓库"
echo "3. 选择 'frontend/web' 目录"
echo "4. 自动检测为Node.js项目"
echo "5. 自动构建和部署"
echo ""
echo "或者使用命令行部署："
echo "zeabur deploy"
