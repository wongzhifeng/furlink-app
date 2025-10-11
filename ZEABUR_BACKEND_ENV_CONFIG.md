# Zeabur后端环境变量配置指南

## 🔧 环境变量问题诊断

### ❌ 当前问题
后端服务返回 HTTP 502 Bad Gateway，可能原因：
1. **数据库连接失败** - MongoDB/Redis 未配置
2. **环境变量缺失** - 关键配置未设置
3. **服务启动超时** - 等待数据库连接超时

### ✅ 解决方案

#### 1. 必需的环境变量

在Zeabur平台的后端服务配置中，添加以下环境变量：

```bash
# 基础配置
PORT=8080
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=400 --max-semi-space-size=64 --optimize-for-size

# 数据库配置 - 禁用MongoDB (使用Zion数据库)
MONGODB_ENABLED=false

# Redis配置 - 禁用Redis (使用内存缓存)
REDIS_ENABLED=false

# 性能优化
PERFORMANCE_MONITORING=true
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true

# 安全配置
SECURITY_HEADERS=true
CORS_ENABLED=true
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# 缓存配置
CACHE_STRATEGY=aggressive
MEMORY_CACHE_TTL=300

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json

# 监控配置
MONITORING_INTERVAL=30
ALERT_THRESHOLD=80

# CORS配置
ALLOWED_ORIGINS=https://furlink-frontend-us.zeabur.app,http://localhost:3000

# Zeabur特定配置
ZEABUR=true
ZEABUR_REGION=us
ZEABUR_SERVICE_ID=furlink-backend-us
```

#### 2. 关键配置说明

**数据库配置**:
- `MONGODB_ENABLED=false` - 禁用MongoDB，避免连接失败
- `REDIS_ENABLED=false` - 禁用Redis，使用内存缓存

**CORS配置**:
- `ALLOWED_ORIGINS` - 允许前端域名访问

**安全配置**:
- `JWT_SECRET` - JWT密钥，生产环境必须设置

#### 3. Zeabur平台配置步骤

1. **登录Zeabur平台**: https://zeabur.com
2. **找到后端服务**: `furlink-backend-us`
3. **进入服务设置**: 点击服务名称
4. **环境变量配置**: 点击 "Environment Variables" 或 "环境变量"
5. **添加变量**: 逐个添加上述环境变量
6. **保存配置**: 点击 "Save" 或 "保存"
7. **重新部署**: 点击 "Redeploy" 或 "重新部署"

#### 4. 环境变量优先级

```bash
# 高优先级 - 必须设置
PORT=8080
NODE_ENV=production
MONGODB_ENABLED=false
REDIS_ENABLED=false

# 中优先级 - 建议设置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ALLOWED_ORIGINS=https://furlink-frontend-us.zeabur.app

# 低优先级 - 可选设置
PERFORMANCE_MONITORING=true
METRICS_ENABLED=true
LOG_LEVEL=info
```

### 🧪 配置验证

配置完成后，测试以下端点：

```bash
# 健康检查
curl https://furlink-backend-us.zeabur.app/api/health

# 预期响应
{
  "status": "healthy",
  "timestamp": "2025-10-11T14:30:00.000Z",
  "uptime": 12345,
  "memory": {...},
  "version": "1.0.0"
}
```

### 🔍 故障排查

#### 如果仍然502错误：

1. **检查服务日志**:
   - 在Zeabur平台查看服务日志
   - 查找错误信息

2. **常见错误**:
   - `MongoDB connection failed` → 设置 `MONGODB_ENABLED=false`
   - `Redis connection failed` → 设置 `REDIS_ENABLED=false`
   - `CORS error` → 设置 `ALLOWED_ORIGINS`
   - `JWT error` → 设置 `JWT_SECRET`

3. **重新部署**:
   - 保存环境变量后
   - 点击 "Redeploy" 重新部署

### 📊 配置对比

| 配置项 | 本地开发 | Zeabur生产 | 说明 |
|--------|----------|------------|------|
| PORT | 8081 | 8080 | 端口配置 |
| MONGODB_ENABLED | true | false | 数据库配置 |
| REDIS_ENABLED | true | false | 缓存配置 |
| NODE_ENV | development | production | 环境配置 |
| CORS_ORIGIN | localhost | zeabur.app | 跨域配置 |

### 🎯 预期结果

配置完成后：
- ✅ 后端服务正常启动
- ✅ API端点可访问
- ✅ 健康检查通过
- ✅ 前端可以正常调用后端
- ✅ 页面错误问题解决

---

**重要提醒**: 设置环境变量后必须重新部署服务才能生效！
