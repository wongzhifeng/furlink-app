# FurLink 后端 Dockerfile
# 基于道德经"道法自然"理念，提供简洁高效的容器化方案

FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装 Node.js 依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p uploads/pets uploads/services uploads/users logs

# 设置权限
RUN chown -R node:node /app
USER node

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/api/health || exit 1

# 暴露端口
EXPOSE ${PORT:-8080}

# 启动应用
CMD ["npm", "start"]
