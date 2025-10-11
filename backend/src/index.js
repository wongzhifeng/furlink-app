// FurLink 后端主入口文件 - 简化版本
// 宠物紧急寻回平台 - 云端开发模式

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// 导入路由
import emergencyRoutes from './routes/emergency.js';
import petsRoutes from './routes/pets.js';
import servicesRoutes from './routes/services.js';

// 导入中间件
import { errorHandler } from './middleware/errorHandler.js';
import { accessControl } from './middleware/accessControl.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 基础中间件
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// 日志中间件
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 访问控制
app.use(accessControl);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// API路由
app.use('/api/emergency', emergencyRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/services', servicesRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '🐾 FurLink 宠物紧急寻回平台 API',
    version: '1.0.0',
    status: 'running',
    port: PORT,
    endpoints: {
      health: '/api/health',
      emergency: '/api/emergency',
      pets: '/api/pets',
      services: '/api/services'
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `路径 ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
function startServer() {
  try {
    // 启动服务器
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🐾 FurLink后端服务启动成功！`);
      console.log(`📱 端口: ${PORT}`);
      console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 健康检查: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🔄 收到SIGTERM信号，正在优雅关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 收到SIGINT信号，正在优雅关闭...');
  process.exit(0);
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动服务器
startServer();