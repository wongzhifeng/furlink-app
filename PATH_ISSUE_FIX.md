# Zeabur构建失败 - 路径问题修复

## 🚨 构建错误分析

**错误信息**: `npm error Missing script: "build"`

**根本原因**: Dockerfile在错误的目录下执行构建

### 问题分析

1. **错误的构建脚本**: Dockerfile在根目录执行`npm run build`
2. **错误的package.json**: 根目录的package.json中的build脚本指向后端
3. **路径问题**: Dockerfile应该在`frontend/web`目录下工作

### 根目录package.json分析

```json
{
  "scripts": {
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend/miniprogram && npm run build"
  }
}
```

**问题**: 根目录的build脚本试图构建后端和小程序，而不是web前端！

## 🔧 修复方案

### 1. 确保Dockerfile在正确目录

**关键点**:
- ✅ Dockerfile位于`frontend/web/`目录
- ✅ 构建上下文是`frontend/web/`目录
- ✅ 复制的是`frontend/web/package.json`
- ✅ 执行的是`frontend/web/`目录下的npm脚本

### 2. 正确的构建流程

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app

# 复制frontend/web/package*.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制frontend/web/目录下的所有文件
COPY . .

# 构建应用 (执行frontend/web/package.json中的build脚本)
RUN npm run build
```

### 3. frontend/web/package.json确认

```json
{
  "scripts": {
    "build": "NODE_ENV=production vite build"
  }
}
```

**正确**: 这个build脚本会构建React应用！

## 📋 修复后的Dockerfile

```dockerfile
# FurLink 前端Web应用 Dockerfile - 路径修复版
# 宠物紧急寻回平台前端服务 - Zeabur部署优化

# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件 (frontend/web/package.json)
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码 (frontend/web/目录下的所有文件)
COPY . .

# 构建应用 (执行frontend/web/package.json中的build脚本)
RUN npm run build

# 生产阶段 - 使用Node.js静态服务器
FROM node:18-alpine AS production

# 安装serve包用于静态文件服务
RUN npm install -g serve

# 复制构建产物
COPY --from=builder /app/dist /app/dist

# 设置工作目录
WORKDIR /app

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV PORT=8080
ENV NODE_ENV=production

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# 启动静态文件服务器
CMD ["serve", "-s", "dist", "-l", "8080"]
```

## 🛠️ 部署步骤

### 1. 确认Zeabur配置

**重要**: 确保Zeabur服务配置正确：
- **仓库地址**: `https://github.com/wongzhifeng/furlink-app.git`
- **分支**: `main`
- **目录**: `frontend/web` ⭐ **关键**
- **框架**: `Docker`

### 2. 提交修复
```bash
git add .
git commit -m "🔧 修复路径问题 - 确保Dockerfile在正确目录"
git push origin main && git push github main
```

### 3. 在Zeabur平台重新部署
1. 登录Zeabur平台: https://zeabur.com
2. 找到 `furlink-frontend-us` 服务
3. 确认源码设置中的目录是 `frontend/web`
4. 点击 "Redeploy" 重新部署

## 🔍 技术对比

| 配置 | 正确 | 错误 | 结果 |
|------|------|------|------|
| 构建目录 | `frontend/web` | 根目录 | ✅/❌ |
| package.json | `frontend/web/package.json` | 根目录package.json | ✅/❌ |
| build脚本 | `vite build` | `cd backend && npm run build` | ✅/❌ |

## 📊 预期结果

修复后，Zeabur构建应该：
- ✅ 在正确的`frontend/web`目录下构建
- ✅ 使用正确的`frontend/web/package.json`
- ✅ 执行正确的build脚本 (`vite build`)
- ✅ 成功构建React应用
- ✅ 页面标题显示 "毛茸茸"

## 💡 关键要点

### Zeabur配置检查
1. **仓库地址**: 正确
2. **分支**: main
3. **目录**: `frontend/web` ⭐ **最重要**
4. **框架**: Docker

### 构建上下文
- Dockerfile位于`frontend/web/`目录
- 构建上下文是`frontend/web/`目录
- 所有COPY命令都相对于`frontend/web/`目录

### 脚本执行
- `npm run build`执行的是`frontend/web/package.json`中的脚本
- 该脚本会运行`vite build`构建React应用

---

**修复版本**: 5.0.0  
**创建时间**: 2024-12-19  
**适用问题**: Dockerfile路径和构建脚本问题
