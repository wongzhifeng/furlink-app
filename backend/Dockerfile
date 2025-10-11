# FurLink 后端 Dockerfile - 简化版本
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json
COPY package.json ./

# 安装依赖
RUN npm install --only=production

# 复制源代码
COPY src/ ./src/

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PORT=3000
ENV NODE_ENV=production

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 启动应用
CMD ["npm", "start"]