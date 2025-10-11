// FurLink 后端API服务 - Zeabur最佳实践版本
// 宠物紧急寻回平台 - 生产级部署优化

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { 
  requestMonitoring, 
  memoryMonitoring, 
  errorMonitoring, 
  performanceReport 
} from './middleware/monitoring.js';
import { 
  securityMiddleware, 
  securityConfig 
} from './config/security.js';

// 环境变量配置 - 性能优化
dotenv.config();

// 性能监控
const startTime = Date.now();
const requestCount = { count: 0 };
const memoryThreshold = 400; // MB

const app = express();
const PORT = process.env.PORT || 8080;

// 安全中间件 - 超高性能版本
app.use(securityMiddleware.createHelmet()); // 安全头
app.use(securityMiddleware.createCors()); // CORS
app.use(securityMiddleware.createRateLimit()); // 速率限制
app.use(securityMiddleware.validateInput); // 输入验证
app.use(securityMiddleware.preventSQLInjection); // SQL注入防护
app.use(securityMiddleware.preventXSS); // XSS防护
app.use(securityMiddleware.logSecurityEvents); // 安全日志

// 性能优化中间件 - 极致版本

// 请求体解析优化
app.use(express.json({ 
  limit: '5mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '5mb',
  parameterLimit: 1000
}));

// 监控中间件 - 超高性能版本
app.use(requestMonitoring); // 请求监控
app.use(memoryMonitoring); // 内存监控

// 请求计数中间件
app.use((req, res, next) => {
  requestCount.count++;
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// 健康检查端点 - Zeabur最佳实践版本
app.get('/api/health', async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();
    
    // 检查系统资源
    const memoryUsagePercent = Math.round((memUsage.heapUsed / 1024 / 1024) / memoryThreshold * 100);
    const isHealthy = memoryUsagePercent < 90;
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        usagePercent: memoryUsagePercent
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      performance: {
        requestCount: requestCount.count,
        avgResponseTime: uptime > 0 ? (requestCount.count / uptime).toFixed(2) : '0',
        memoryUsagePercent: memoryUsagePercent
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      port: PORT,
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      // Zeabur特定信息
      zeabur: {
        region: process.env.ZEABUR_REGION || 'unknown',
        serviceId: process.env.ZEABUR_SERVICE_ID || 'unknown'
      }
    };
    
    // 根据健康状态返回相应的HTTP状态码
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(healthData);
    
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 性能报告端点 - 超高性能版本
app.get('/api/metrics', performanceReport);

// 根路径 - 超高性能响应
app.get('/', (req, res) => {
  const responseData = {
    service: 'FurLink Backend API',
    message: '🐾 宠物紧急寻回平台后端服务',
    version: '1.0.0',
    status: 'running',
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    endpoints: {
      health: '/api/health',
      root: '/',
      metrics: '/api/metrics'
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    uptime: Math.floor(process.uptime()),
    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  };
  
  res.json(responseData);
});

// 性能指标端点
app.get('/api/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.json({
    requests: {
      total: requestCount.count,
      perSecond: uptime > 0 ? (requestCount.count / uptime).toFixed(2) : '0'
    },
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024)
    },
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString()
  });
});

// 404处理 - 超高性能版本
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `路径 ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    availableEndpoints: ['/', '/api/health', '/api/metrics'],
    suggestions: {
      health: 'Check service health',
      metrics: 'View performance metrics'
    }
  });
});

// 错误处理中间件 - 超高性能版本
// 错误处理中间件 - Zeabur最佳实践版本
app.use(errorMonitoring); // 错误监控
app.use((err, req, res, next) => {
  const errorData = {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  };
  
  console.error('API Error:', errorData);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 启动服务器 - Zeabur最佳实践版本
function startServer() {
  try {
    const server = app.listen(PORT, '0.0.0.0', () => {
      const startupTime = Date.now() - startTime;
      console.log(`🚀 FurLink Backend API Started Successfully!`);
      console.log(`📱 Port: ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`🔗 Health Check: http://0.0.0.0:${PORT}/api/health`);
      console.log(`📊 Metrics: http://0.0.0.0:${PORT}/api/metrics`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
      console.log(`⚡ Startup time: ${startupTime}ms`);
      console.log(`💾 Memory limit: ${memoryThreshold}MB`);
      console.log(`🔧 Node.js version: ${process.version}`);
      console.log(`🖥️ Platform: ${process.platform}`);
    });

    // 服务器超时配置 - 优化版本
    server.timeout = 30000;
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    
    // 连接限制
    server.maxConnections = 1000;
    
    // 性能监控
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      if (memUsedMB > memoryThreshold * 0.9) {
        console.warn(`⚠️ High memory usage: ${memUsedMB}MB / ${memoryThreshold}MB`);
      }
    }, 30000); // 每30秒检查一次

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// 优雅关闭 - 超高性能版本
let isShuttingDown = false;
let serverInstance = null;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`🔄 Received ${signal}, starting graceful shutdown...`);
  console.log(`📊 Final stats: ${requestCount.count} requests processed`);
  
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
    
    // 强制关闭超时
    setTimeout(() => {
      console.log('⏰ Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理 - 超高性能版本
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
  
  // 尝试优雅关闭
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', {
    reason: reason,
    promise: promise,
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage()
  });
  
  // 尝试优雅关闭
  gracefulShutdown('UNHANDLED_REJECTION');
});

// 内存泄漏监控
process.on('warning', (warning) => {
  console.warn('⚠️ Process Warning:', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
startServer();

// 导出服务器实例用于测试
export { app, serverInstance };