# FurLink Zion平台部署指南

## 🏢 Zion平台部署步骤

### 📋 部署前准备

#### 1. 确认Zion项目信息
- **项目名称**: Furlink-app
- **项目ID**: KrABb5Mb0qw
- **数据库ID**: mgm6x7a6
- **API密钥**: mgm6x7a6
- **账号**: vx18668020218@qq.com

#### 2. 本地测试状态
- ✅ **服务启动**: 成功运行在端口8081
- ✅ **健康检查**: `/api/health` - 正常
- ✅ **性能监控**: `/api/metrics` - 正常
- ✅ **Zion信息**: `/api/zion/info` - 正常
- ✅ **数据查询**: `/api/zion/data/account` - 正常

### 🚀 Zion平台部署流程

#### 步骤1: 登录Zion平台
1. 访问 https://zion.com
2. 使用账号 `vx18668020218@qq.com` 登录
3. 进入项目 `Furlink-app` (ID: KrABb5Mb0qw)

#### 步骤2: 创建后端服务
1. 在Zion平台创建新的后端服务
2. 选择 "Docker" 部署类型
3. 上传 `backend-zion` 目录的代码

#### 步骤3: 配置环境变量
在Zion平台设置以下环境变量：

```bash
# 基础配置
NODE_ENV=production
PORT=8080
NODE_OPTIONS=--max-old-space-size=400 --max-semi-space-size=64 --optimize-for-size

# Zion平台配置
ZION_PROJECT_ID=KrABb5Mb0qw
ZION_DATABASE_ID=mgm6x7a6
ZION_API_BASE_URL=https://api.zion.com
ZION_API_KEY=mgm6x7a6

# 跨域配置
ALLOWED_ORIGINS=https://furlink-frontend.zeabur.app,http://localhost:8080

# 安全配置
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

#### 步骤4: 配置Docker
Zion平台将使用 `backend-zion/Dockerfile` 进行构建：
- 多阶段构建优化
- 非root用户运行
- 健康检查配置
- Zion平台标签

#### 步骤5: 部署和测试
1. 启动部署流程
2. 等待构建完成
3. 测试API端点：
   - `GET /api/health` - 健康检查
   - `GET /api/metrics` - 性能指标
   - `GET /api/zion/info` - Zion项目信息
   - `GET /api/zion/data/:table` - 数据查询

### 🔧 部署配置详情

#### Dockerfile特性
- **基础镜像**: node:18-alpine
- **多阶段构建**: 优化镜像大小
- **安全配置**: 非root用户运行
- **健康检查**: 30秒间隔检查
- **端口**: 8080

#### 性能优化
- **内存限制**: 400MB
- **启动优化**: dumb-init PID 1管理
- **缓存优化**: npm缓存清理
- **压缩优化**: 生产环境压缩

#### 监控和日志
- **结构化日志**: Winston日志系统
- **性能监控**: 实时性能指标
- **健康检查**: 多维度健康状态
- **错误追踪**: 详细错误历史

### 🧪 部署后测试

#### 1. 健康检查测试
```bash
curl https://your-zion-backend-url.zion.com/api/health
```

#### 2. Zion信息测试
```bash
curl https://your-zion-backend-url.zion.com/api/zion/info
```

#### 3. 性能指标测试
```bash
curl https://your-zion-backend-url.zion.com/api/metrics
```

#### 4. 数据查询测试
```bash
curl https://your-zion-backend-url.zion.com/api/zion/data/account
```

### 🔗 多平台集成

#### 前端配置
更新前端API配置，支持多平台后端：
```javascript
const API_BASE_URLS = {
  zeabur: 'https://furlink-backend-m9k2.zeabur.app',
  zion: 'https://your-zion-backend-url.zion.com'
};
```

#### 服务选择策略
- **开发环境**: 使用Zeabur后端
- **生产环境**: 使用Zion后端
- **备用方案**: 自动切换机制

### 📊 监控和维护

#### 性能监控
- **内存使用**: 监控内存使用率
- **响应时间**: 监控API响应时间
- **错误率**: 监控错误发生率
- **请求量**: 监控请求频率

#### 日志分析
- **访问日志**: 分析用户访问模式
- **错误日志**: 分析错误原因
- **性能日志**: 分析性能瓶颈
- **安全日志**: 分析安全事件

### 🆘 故障排除

#### 常见问题
1. **服务启动失败**: 检查环境变量和依赖
2. **数据库连接失败**: 检查Zion API密钥
3. **内存使用过高**: 调整NODE_OPTIONS
4. **健康检查失败**: 检查服务状态

#### 调试方法
1. **查看日志**: 分析服务日志
2. **检查配置**: 验证环境变量
3. **测试端点**: 逐个测试API端点
4. **性能分析**: 使用性能监控工具

### 📞 支持联系

- **Zion平台**: https://zion.com
- **项目仓库**: https://gitee.com/hangzhou_thousand_army_wangzhifeng/furlink.git
- **文档更新**: 及时更新部署文档

---

**部署指南版本**: 1.0.0  
**最后更新**: 2024-12-19  
**适用版本**: FurLink v1.0.0
