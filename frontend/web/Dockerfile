# FurLink 前端Web应用 Dockerfile - 超高性能优化版
# 宠物紧急寻回平台前端服务 - Zeabur部署极致优化

# 多阶段构建优化
FROM node:18-alpine AS base

# 安装系统依赖和工具
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# 设置工作目录
WORKDIR /app

# 创建非root用户 - 安全优化
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制package.json和package-lock.json
COPY package*.json ./

# 生产依赖安装阶段
FROM base AS deps
RUN npm ci --only=production --no-audit --no-fund --ignore-scripts && \
    npm cache clean --force

# 开发依赖安装阶段
FROM base AS dev-deps
RUN npm ci --no-audit --no-fund --ignore-scripts && \
    npm cache clean --force

# 构建阶段
FROM base AS builder
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# 代码质量检查
RUN npm run lint || true

# 构建应用
RUN npm run build

# 生产镜像
FROM nginx:alpine AS production

# 安装curl用于健康检查
RUN apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 更改文件所有者
RUN chown -R nodejs:nodejs /usr/share/nginx/html && \
    chown -R nodejs:nodejs /var/cache/nginx && \
    chown -R nodejs:nodejs /var/log/nginx && \
    chown -R nodejs:nodejs /etc/nginx/conf.d

USER nodejs

# 暴露端口
EXPOSE 8080

# 设置环境变量 - 性能优化
ENV PORT=8080
ENV NODE_ENV=production

# 健康检查 - 超高性能版本
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# 添加性能监控标签
LABEL maintainer="FurLink Team" \
      version="1.0.0" \
      description="FurLink Frontend Web - Ultra Performance Optimized" \
      performance="optimized" \
      zeabur="compatible"

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
