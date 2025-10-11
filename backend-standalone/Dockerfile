# FurLink 后端API服务 Dockerfile - 兼容版
# 宠物紧急寻回平台后端服务 - Zeabur部署优化

# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY src/ ./src/

# 生产阶段
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装生产依赖
RUN npm install --omit=dev

# 复制源代码
COPY src/ ./src/

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV PORT=8080
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=400 --max-semi-space-size=64 --optimize-for-size"

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# 启动应用
CMD ["npm", "start"]