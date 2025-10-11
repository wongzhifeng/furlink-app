# Dockerfile目录问题修复指南

## 🔍 问题诊断

### ❌ 当前错误
```
> furlink@1.0.0 build:backend
> cd backend && npm run build

npm error Missing script: "build"
```

### 🔧 问题分析
1. **目录问题**: Dockerfile在根目录执行，但根目录的package.json指向backend
2. **脚本冲突**: 根目录的build脚本是 `cd backend && npm run build`
3. **路径错误**: 应该使用frontend/web目录的package.json

## ✅ 解决方案

### 问题根源
- **根目录package.json**: 包含 `"build": "cd backend && npm run build"`
- **前端package.json**: 包含 `"build": "NODE_ENV=production vite build"`
- **Dockerfile执行**: 在根目录执行，使用了错误的package.json

### 修复后的Dockerfile
```dockerfile
# FurLink 前端Web应用 Dockerfile - 目录修复版
# 宠物紧急寻回平台前端服务 - Zeabur部署优化

# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . ./

# 构建应用
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

### 关键修复点
1. **确保正确的package.json**: 复制frontend/web目录的package.json
2. **正确的构建脚本**: 使用vite build而不是backend build
3. **目录结构**: 确保在正确的目录执行构建

## 🚀 部署步骤

### 1. 确认Zeabur配置
在Zeabur平台确认：
- **源码目录**: `frontend/web`
- **Dockerfile路径**: `frontend/web/Dockerfile`
- **构建命令**: 使用Dockerfile构建

### 2. 重新部署
1. 登录 [https://zeabur.com](https://zeabur.com)
2. 找到 `furlink-frontend-us` 服务
3. 点击 **"Redeploy"** 重新部署

### 3. 验证构建
部署过程中观察构建日志：
- ✅ 复制正确的package.json
- ✅ `npm install` 成功
- ✅ `npm run build` 成功 (vite build)
- ✅ 构建产物生成

## 🔍 故障排查

### 如果仍然失败

#### 1. 检查Zeabur配置
- 确认源码目录设置为 `frontend/web`
- 确认Dockerfile路径正确
- 确认构建上下文正确

#### 2. 检查package.json
```bash
# 确认frontend/web/package.json包含正确的build脚本
cat frontend/web/package.json | grep -A 5 "scripts"
```

#### 3. 本地测试构建
```bash
# 在frontend/web目录测试构建
cd frontend/web
npm install
npm run build
```

### 常见问题解决

#### 问题1: 仍然使用根目录package.json
**解决方案**: 检查Zeabur的源码目录配置

#### 问题2: 构建脚本不存在
**解决方案**: 确认frontend/web/package.json正确

#### 问题3: 依赖安装失败
**解决方案**: 检查网络连接和npm配置

## 📊 目录结构对比

| 目录 | package.json | build脚本 | 用途 |
|------|-------------|-----------|------|
| 根目录 | `cd backend && npm run build` | 后端构建 | ❌ 错误 |
| frontend/web | `NODE_ENV=production vite build` | 前端构建 | ✅ 正确 |

## 🎯 预期结果

修复完成后：
- ✅ **构建成功**: 使用正确的package.json和build脚本
- ✅ **部署成功**: 前端服务正常启动
- ✅ **页面显示**: 前端页面正常显示
- ✅ **API调用**: 前后端正常通信

## 🔧 立即行动

1. **确认Zeabur配置**: 源码目录为 `frontend/web`
2. **重新部署**: 在Zeabur平台重新部署
3. **监控构建**: 观察构建日志确认成功
4. **验证结果**: 测试前端页面和API调用

---

**关键点**: 确保Dockerfile在正确的目录执行，使用正确的package.json和build脚本！
