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
    
    # 本地预览测试
    echo ""
    echo "🧪 本地预览测试..."
    echo "启动预览服务器..."
    echo "访问地址: http://localhost:3000"
    echo "按 Ctrl+C 停止预览"
    echo ""
    
    # 启动预览服务器
    npm run preview
else
    echo "❌ 构建失败！"
    exit 1
fi

echo ""
echo "🚀 部署准备完成！"
echo ""
echo "Zeabur部署步骤："
echo "1. 将代码推送到Gitee"
echo "2. 在Zeabur中连接Gitee仓库"
echo "3. 选择 'frontend/web' 目录"
echo "4. 选择 Node.js 环境"
echo "5. 端口设置为 3000"
echo "6. 环境变量留空"
echo "7. 自动构建和部署"
echo ""
echo "部署完成后访问: https://your-project-name.zeabur.app"
