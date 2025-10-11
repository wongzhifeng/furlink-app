# FurLink 后端API服务 - Zion平台版本

## 🐾 项目概述

**FurLink** - 宠物紧急寻回平台后端API服务，专为Zion平台优化部署。

### 🎯 核心功能
- 用户账户管理
- 宠物信息管理
- 紧急寻宠服务
- 地理位置服务
- 权限角色系统
- 审计记录

## 🏗️ 技术架构

### 后端技术栈
```
Node.js + Express + Zion Platform
├── 核心服务: 用户管理、宠物管理、紧急服务
├── 数据模型: Account、Province、City、District
├── 中间件: 认证、错误处理、监控、安全
└── 服务层: 日志、监控、性能优化
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0
- Docker (可选)

### 安装依赖
```bash
npm install
```

### 环境配置
```bash
cp env.example .env
# 编辑 .env 文件，配置必要的环境变量
```

### 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 🔧 配置说明

### 环境变量
- `NODE_ENV`: 运行环境 (production/development)
- `PORT`: 服务端口 (默认: 8080)
- `ZION_PROJECT_ID`: Zion项目ID
- `ZION_DATABASE_ID`: Zion数据库ID
- `ZION_API_KEY`: Zion API密钥

### Zion平台配置
- **项目ID**: `KrABb5Mb0qw`
- **数据库ID**: `mgm6x7a6`
- **项目名称**: Furlink-app

## 📊 API端点

### 基础端点
- `GET /` - 服务信息
- `GET /api/health` - 健康检查
- `GET /api/metrics` - 性能指标

### Zion平台端点
- `GET /api/zion/info` - Zion项目信息
- `GET /api/zion/data/:table` - 数据查询

## 🐳 Docker部署

### 构建镜像
```bash
docker build -t furlink-backend-zion .
```

### 运行容器
```bash
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e ZION_PROJECT_ID=KrABb5Mb0qw \
  -e ZION_DATABASE_ID=mgm6x7a6 \
  furlink-backend-zion
```

## 🔍 监控和日志

### 健康检查
```bash
curl http://localhost:8080/api/health
```

### 性能指标
```bash
curl http://localhost:8080/api/metrics
```

### Zion项目信息
```bash
curl http://localhost:8080/api/zion/info
```

## 🛡️ 安全特性

- **安全头**: Helmet.js安全头配置
- **CORS**: 跨域资源共享配置
- **速率限制**: API请求频率限制
- **输入验证**: SQL注入和XSS防护
- **安全日志**: 可疑活动监控

## 📈 性能优化

- **内存管理**: 自动垃圾回收优化
- **请求监控**: 实时性能监控
- **错误追踪**: 详细错误历史记录
- **健康检查**: 多维度健康状态监控

## 🗄️ 数据库结构

### 主要表结构
- `account` - 用户账户
- `fz_province` - 省份信息
- `fz_city` - 城市信息
- `fz_district` - 区县信息
- `fz_audit_record` - 审计记录
- `fz_permission_role` - 权限角色
- `fz_account_has_permission_role` - 账户角色关联

## 🔄 部署流程

1. **代码提交**: 推送到Git仓库
2. **构建镜像**: Docker构建优化
3. **部署服务**: Zion平台部署
4. **健康检查**: 服务状态验证
5. **监控配置**: 性能监控启用

## 📝 开发指南

### 代码规范
- 使用ES6+语法
- 遵循RESTful API设计
- 结构化错误处理
- 完整的日志记录

### 测试
```bash
# 健康检查测试
npm run health

# 性能指标测试
npm run metrics

# Zion信息测试
npm run zion-info
```

## 🆘 故障排除

### 常见问题
1. **服务启动失败**: 检查端口占用和环境变量
2. **Zion连接失败**: 验证API密钥和项目ID
3. **内存使用过高**: 调整NODE_OPTIONS配置
4. **健康检查失败**: 检查依赖服务状态

### 日志查看
```bash
# 查看应用日志
docker logs <container_id>

# 查看健康检查日志
curl http://localhost:8080/api/health
```

## 📞 支持

- **项目仓库**: https://gitee.com/hangzhou_thousand_army_wangzhifeng/furlink.git
- **Zion项目**: https://zion.com/projects/KrABb5Mb0qw
- **问题反馈**: 通过Git仓库提交Issue

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**FurLink Team** - 宠物紧急寻回平台  
**Zion Platform** - 云端部署优化版本
