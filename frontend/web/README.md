# FurLink Web Frontend

## 🐾 项目简介

FurLink Web前端是基于React + TypeScript开发的宠物紧急寻回平台，采用模拟数据，适合快速部署和演示。

## 🚀 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **路由**: React Router DOM
- **图标**: Lucide React
- **样式**: CSS + Tailwind CSS类名
- **部署**: Zeabur

## 📱 功能特性

- ✅ **响应式设计**: 支持桌面和移动端
- ✅ **无图片设计**: 完全使用Unicode图标
- ✅ **模拟数据**: 无需后端API，立即可用
- ✅ **快速部署**: 一键部署到Zeabur
- ✅ **MVP功能**: 5个核心页面完整实现

## 🎯 核心页面

1. **🏠 首页** - 功能概览和快速操作
2. **🚨 紧急寻宠** - 紧急警报发布表单
3. **🐾 宠物管理** - 宠物档案管理
4. **🏥 服务匹配** - 附近宠物服务
5. **👤 个人中心** - 用户信息和设置

## 🔧 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 启动生产服务器
npm run start
```

## 🚀 Zeabur部署

### 方法1: 直接部署
1. 将代码推送到GitHub
2. 在Zeabur中连接GitHub仓库
3. 选择`frontend/web`目录
4. 自动检测为Node.js项目
5. 自动构建和部署

### 方法2: 手动配置
```yaml
# zeabur.yml
build: npm run build
start: npm run start
port: 3000
```

## 📊 模拟数据

所有数据都是本地模拟，包括：
- 宠物信息
- 紧急警报
- 附近服务
- 用户统计

## 🎨 设计特色

- **无图片设计**: 完全使用Unicode图标
- **符号化UI**: 统一的图标符号语言
- **响应式布局**: 适配各种屏幕尺寸
- **现代设计**: 简洁美观的用户界面

## 🔗 相关链接

- [小程序版本](../miniprogram/)
- [后端API](../../backend/)
- [项目文档](../../docs/)

## 📝 更新日志

- v1.0.0 - 初始版本，包含5个核心页面
- 使用模拟数据，无需后端支持
- 支持Zeabur一键部署
