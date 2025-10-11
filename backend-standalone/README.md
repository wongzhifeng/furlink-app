# FurLink 后端服务

## 🐾 宠物紧急寻回平台后端API

这是一个独立的Node.js后端服务，提供宠物紧急寻回平台的API接口。

### 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动服务
npm start

# 开发模式
npm run dev
```

### 📊 API端点

- `GET /` - 服务信息
- `GET /api/health` - 健康检查

### 🔧 环境变量

- `PORT` - 服务端口 (默认: 3000)
- `NODE_ENV` - 环境模式 (development/production)

### 🐳 Docker部署

```bash
# 构建镜像
docker build -t furlink-backend .

# 运行容器
docker run -p 3000:3000 furlink-backend
```

### 📝 部署说明

这是一个**纯后端服务**，不包含前端代码。

**Zeabur部署配置**：
- 项目类型: Node.js 或 Docker
- 根目录: `/` (当前目录)
- 端口: 3000
- 环境变量: `PORT=3000`
