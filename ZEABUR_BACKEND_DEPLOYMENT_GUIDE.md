# Zeabur后端部署指南

## 🚀 部署FurLink后端到Zeabur

### 📋 部署前准备

#### 1. 检查后端代码
- ✅ **目录**: `backend-standalone/`
- ✅ **Dockerfile**: 已修复npm兼容性问题
- ✅ **package.json**: 包含正确的启动脚本
- ✅ **zeabur.yml**: 配置完整

#### 2. 后端服务信息
- **服务名称**: `furlink-backend-api`
- **端口**: `8080`
- **健康检查**: `/api/health`
- **API端点**: `/api/*`

### 🛠️ Zeabur平台部署步骤

#### 步骤1: 登录Zeabur平台
1. 访问 [https://zeabur.com](https://zeabur.com)
2. 使用您的账号登录

#### 步骤2: 创建后端服务
1. 点击 **"Create Service"** 或 **"创建服务"**
2. 选择 **"Git Repository"** 或 **"Git仓库"**
3. 连接仓库: `https://github.com/wongzhifeng/furlink-app.git`
4. 选择分支: `main`
5. 选择目录: `backend-standalone` ⭐ **重要**
6. 选择框架: `Docker`

#### 步骤3: 配置环境变量
在Zeabur平台的服务配置页面，设置以下环境变量：

```bash
# 基础配置
PORT=8080
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=400 --max-semi-space-size=64 --optimize-for-size

# 性能优化
PERFORMANCE_MONITORING=true
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true

# 安全配置
SECURITY_HEADERS=true
CORS_ENABLED=true

# 缓存配置
CACHE_STRATEGY=aggressive
MEMORY_CACHE_TTL=300

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json

# 监控配置
MONITORING_INTERVAL=30
ALERT_THRESHOLD=80
```

#### 步骤4: 资源配置
- **内存**: `512Mi`
- **CPU**: `500m`
- **最小副本**: `1`
- **最大副本**: `3`

#### 步骤5: 启动部署
1. 确认所有配置已保存
2. 点击 **"Deploy"** 或 **"部署"** 按钮
3. 等待构建完成 (通常需要3-5分钟)

### 🧪 部署后验证

#### 1. 检查服务状态
- 在Zeabur平台查看服务状态
- 确认服务状态为 "Running"

#### 2. 测试API端点
部署完成后，测试以下API端点：

```bash
# 健康检查
curl https://your-backend-url.zeabur.app/api/health

# 性能指标
curl https://your-backend-url.zeabur.app/api/metrics

# 根路径
curl https://your-backend-url.zeabur.app/
```

#### 3. 预期响应
- **健康检查**: `{"status":"healthy","timestamp":"...","uptime":...}`
- **性能指标**: `{"memory":...,"cpu":...,"requests":...}`
- **根路径**: `{"message":"FurLink API Server","version":"1.0.0"}`

### 🔧 故障排查

#### 常见问题

1. **构建失败**
   - 检查Dockerfile语法
   - 确认package.json正确
   - 查看构建日志

2. **服务启动失败**
   - 检查环境变量配置
   - 确认端口配置正确
   - 查看服务日志

3. **健康检查失败**
   - 确认健康检查端点存在
   - 检查服务是否正常启动
   - 查看健康检查配置

#### 调试步骤

1. **查看构建日志**
   - 在Zeabur平台查看构建日志
   - 确认npm install和构建过程

2. **查看服务日志**
   - 在Zeabur平台查看服务日志
   - 确认服务启动过程

3. **测试API端点**
   - 使用curl测试各个端点
   - 确认API响应正常

### 📊 部署配置

#### zeabur.yml配置
```yaml
name: furlink-backend-api
type: docker
dockerfile: ./Dockerfile
port: 8080

env:
  PORT: 8080
  NODE_ENV: production
  NODE_OPTIONS: "--max-old-space-size=400 --max-semi-space-size=64 --optimize-for-size"

resources:
  memory: 512Mi
  cpu: 500m

healthcheck:
  path: /api/health
  interval: 30s
  timeout: 10s
  retries: 3
```

#### Dockerfile特点
- ✅ 使用Node.js 18 Alpine
- ✅ 多阶段构建优化
- ✅ 生产环境优化
- ✅ 健康检查配置
- ✅ 性能监控标签

### 🎯 预期结果

部署成功后：
- ✅ 后端服务正常运行
- ✅ API端点可访问
- ✅ 健康检查通过
- ✅ 前端可以正常调用后端API
- ✅ 页面错误问题解决

### 📞 支持信息

如果部署过程中遇到问题：
1. 检查Zeabur文档: https://docs.zeabur.com
2. 查看构建和服务日志
3. 确认环境变量配置
4. 联系Zeabur支持

---

**部署版本**: 1.0.0  
**创建时间**: 2024-12-19  
**适用平台**: Zeabur
