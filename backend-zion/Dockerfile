# FurLink 后端API服务 Dockerfile - Zion平台版本
# 宠物紧急寻回平台后端服务 - Zion部署优化

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
RUN npm ci --omit=dev --no-audit --no-fund --ignore-scripts && \
    npm cache clean --force

# 构建阶段
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/

# 代码质量检查
RUN npm run lint || true

# 生产镜像
FROM base AS production

# 复制生产依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY src/ ./src/

# 复制配置文件
COPY package*.json ./

# 更改文件所有者
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 8080

# 设置环境变量 - Zion平台优化
ENV PORT=8080
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=400 --max-semi-space-size=64 --optimize-for-size"
ENV NODE_ENABLE_SOURCE_MAPS=false
ENV NODE_DISABLE_COLORS=1
ENV ZION_PROJECT_ID=KrABb5Mb0qw
ENV ZION_DATABASE_ID=mgm6x7a6

# 健康检查 - Zion平台版本
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# 添加Zion平台标签
LABEL maintainer="FurLink Team" \
      version="1.0.0" \
      description="FurLink Backend API - Zion Platform Optimized" \
      platform="zion" \
      zion-project-id="KrABb5Mb0qw" \
      zion-database-id="mgm6x7a6"

# 使用dumb-init作为PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["npm", "start"]
