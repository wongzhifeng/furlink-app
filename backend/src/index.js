// FurLink 后端主入口文件
// 宠物紧急寻回平台 - 云端开发模式

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

// 导入路由
import emergencyRoutes from './routes/emergency.js';
import petsRoutes from './routes/pets.js';
import servicesRoutes from './routes/services.js';

// 导入中间件
import { errorHandler } from './middleware/errorHandler.js';
import { accessControl } from './middleware/accessControl.js';

// 导入服务
import { databaseService } from './services/databaseService.js';
import { redisService } from './services/redisService.js';
import { performanceMonitor } from './services/performanceMonitor.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// 基础中间件
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 100次请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

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
    environment: process.env.NODE_ENV || 'development'
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
async function startServer() {
  try {
    // 初始化数据库连接
    await databaseService.connect();
    console.log('✅ 数据库连接成功');

    // 初始化Redis连接
    await redisService.connect();
    console.log('✅ Redis连接成功');

    // 启动性能监控
    performanceMonitor.start();
    console.log('✅ 性能监控启动');

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
process.on('SIGTERM', async () => {
  console.log('🔄 收到SIGTERM信号，正在优雅关闭...');
  await databaseService.disconnect();
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 收到SIGINT信号，正在优雅关闭...');
  await databaseService.disconnect();
  await redisService.disconnect();
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
