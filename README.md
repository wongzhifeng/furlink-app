# FurLink - 毛茸茸链接 🐾

基于 FluLink 流感应用架构开发的宠物垂直社交平台，专注于宠物紧急寻回、健康档案管理和本地服务匹配。

## 项目概述

FurLink 是一个遵循《道德经》哲学思想的宠物数字生态系统，将 FluLink 的毒株传播机制适配到宠物场景，实现：

- **紧急寻宠系统** - 0延迟传播，AR寻宠，强制推送
- **宠物健康档案** - 基础信息管理，照片上传，简化验证
- **附近服务匹配** - 宠物医院定位，距离计算，服务推荐
- **毒株传播基础** - 复用 FluLink 核心传播机制

## 技术架构

### 后端技术栈
- **服务器**: Node.js + Express
- **数据库**: MongoDB (独立实例)
- **缓存**: Redis
- **认证**: JWT
- **核心复用**: FluLink 毒株传播引擎

### 前端技术栈
- **小程序**: 微信原生小程序
- **Web版**: React + TypeScript (兼容)
- **通信**: WebSocket + RESTful API
- **部署**: 独立服务器 + CDN

## 项目结构

```
FurLink/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── algorithms/      # 核心算法 (复用FluLink)
│   │   ├── config/          # 配置文件
│   │   ├── middleware/      # 中间件
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务服务
│   │   ├── tools/           # 工具类
│   │   └── utils/           # 工具函数
│   └── tests/               # 测试文件
├── frontend/
│   ├── miniprogram/         # 微信小程序
│   └── web/                 # Web版本
├── docs/                    # 文档
└── deployment/              # 部署配置
```

## 核心功能

### 1. 紧急寻宠系统
- **0延迟传播**: 宠物走失警报立即推送
- **AR寻宠**: 基于宠物特征的AR识别
- **强制推送**: 无视用户免疫设置，确保紧急信息传达

### 2. 宠物健康档案
- **基础信息**: 品种、年龄、体重等
- **照片管理**: 多角度宠物照片上传
- **简化验证**: 照片+基本信息快速验证

### 3. 附近服务匹配
- **地理定位**: 基于用户位置的附近服务
- **距离计算**: 精确的距离和路线规划
- **服务推荐**: 宠物医院、美容、寄养等

## 开发阶段

### 第一阶段 (MVP)
- [x] 项目架构设计
- [ ] 核心模块复制适配
- [ ] 紧急寻宠系统
- [ ] 基础档案管理
- [ ] 附近医院匹配

### 第二阶段
- [ ] 完整毒株传播机制
- [ ] 宠物社交功能
- [ ] 知识分享系统

### 第三阶段
- [ ] AR寻宠功能
- [ ] 高级匹配算法
- [ ] 商业化功能

## 快速开始

```bash
# 克隆项目
git clone <repository-url>
cd FurLink

# 安装依赖
cd backend && npm install
cd ../frontend/miniprogram && npm install

# 启动开发服务器
cd backend && npm run dev
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目维护者: [Your Name]
- 邮箱: [your.email@example.com]
- 项目链接: [https://github.com/yourusername/FurLink]

---

**遵循《道德经》"上善若水"的设计理念，让宠物主在无强制社交压力下自然形成互助网络。**
