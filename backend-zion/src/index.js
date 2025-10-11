// FurLink 后端API服务 - Zion平台版本
// 宠物紧急寻回平台后端服务 - Zion部署优化

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

// 环境变量配置 - Zion优化
dotenv.config();

// 性能监控
const startTime = Date.now();
const requestCount = { count: 0 };
const memoryThreshold = 400; // MB

const app = express();
const PORT = process.env.PORT || 8080;

// Zion平台特定配置
const ZION_CONFIG = {
  projectId: 'KrABb5Mb0qw', // Furlink-app项目ID
  databaseId: 'mgm6x7a6', // 数据库ID
  apiBaseUrl: process.env.ZION_API_BASE_URL || 'https://api.zion.com',
  apiKey: process.env.ZION_API_KEY || 'your-zion-api-key'
};

// 安全中间件 - Zion优化版本
app.use(securityMiddleware.createHelmet()); // 安全头
app.use(securityMiddleware.createCors()); // CORS
app.use(securityMiddleware.createRateLimit()); // 速率限制
app.use(securityMiddleware.validateInput); // 输入验证
app.use(securityMiddleware.preventSQLInjection); // SQL注入防护
app.use(securityMiddleware.preventXSS); // XSS防护
app.use(securityMiddleware.logSecurityEvents); // 安全日志

// 监控中间件 - Zion优化版本
app.use(requestMonitoring); // 请求监控
app.use(memoryMonitoring); // 内存监控

// 请求计数中间件
app.use((req, res, next) => {
  requestCount.count++;
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Zion API代理中间件
app.use('/api/zion', (req, res, next) => {
  // 添加Zion项目信息到请求头
  req.headers['x-zion-project-id'] = ZION_CONFIG.projectId;
  req.headers['x-zion-database-id'] = ZION_CONFIG.databaseId;
  req.headers['x-zion-api-key'] = ZION_CONFIG.apiKey;
  next();
});

// 健康检查端点 - Zion最佳实践版本
app.get('/api/health', async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();
    
    // 检查系统资源
    const memoryUsagePercent = Math.round((memUsage.heapUsed / 1024 / 1024) / memoryThreshold * 100);
    const isHealthy = memoryUsagePercent < 90; // 内存使用低于90%视为健康
    
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
      // Zion特定信息
      zion: {
        projectId: ZION_CONFIG.projectId,
        databaseId: ZION_CONFIG.databaseId,
        apiBaseUrl: ZION_CONFIG.apiBaseUrl,
        status: 'connected'
      }
    };
    
    // 根据健康状态返回相应的HTTP状态码
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(healthData);
    
  } catch (error) {
    logger.error('Health check failed:', { message: error.message, stack: error.stack });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 性能报告端点 - Zion优化版本
app.get('/api/metrics', performanceReport);

// Zion项目信息端点
app.get('/api/zion/info', (req, res) => {
  res.json({
    project: {
      id: ZION_CONFIG.projectId,
      name: 'Furlink-app',
      databaseId: ZION_CONFIG.databaseId,
      description: 'FurLink 宠物紧急寻回平台'
    },
    database: {
      tables: [
        'account', 'fz_province', 'fz_city', 'fz_district',
        'fz_audit_record', 'fz_permission_role', 'fz_account_has_permission_role'
      ],
      features: [
        '用户账户管理',
        '地理位置数据',
        '权限角色系统',
        '审计记录'
      ]
    },
    api: {
      baseUrl: ZION_CONFIG.apiBaseUrl,
      endpoints: [
        '/api/health',
        '/api/metrics',
        '/api/zion/info',
        '/api/zion/data'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Zion数据查询端点
app.get('/api/zion/data/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    // 这里应该调用Zion API获取数据
    // 目前返回模拟数据
    const mockData = {
      table,
      data: [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: 0
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(mockData);
    
  } catch (error) {
    logger.error('Zion data query failed:', { 
      table: req.params.table, 
      error: error.message 
    });
    res.status(500).json({
      error: 'Data query failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 根路径 - Zion优化响应
app.get('/', (req, res) => {
  const responseData = {
    service: 'FurLink Backend API - Zion Platform',
    message: '🐾 宠物紧急寻回平台后端服务 - Zion部署版本',
    version: '1.0.0',
    status: 'running',
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    platform: 'Zion',
    endpoints: {
      health: '/api/health',
      metrics: '/api/metrics',
      zionInfo: '/api/zion/info',
      zionData: '/api/zion/data/:table',
      root: '/'
    },
    zion: {
      projectId: ZION_CONFIG.projectId,
      databaseId: ZION_CONFIG.databaseId,
      status: 'connected'
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  };
  res.status(200).json(responseData);
});

// 404处理 - Zion最佳实践版本
app.use('*', (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, { requestId: req.requestId, ip: req.ip });
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `路径 ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString(),
    availableEndpoints: ['/', '/api/health', '/api/metrics', '/api/zion/info'],
    requestId: req.requestId
  });
});

// 错误处理中间件 - Zion最佳实践版本
app.use(errorMonitoring); // 错误监控
app.use((err, req, res, next) => {
  const errorData = {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    ip: req.ip,
    zion: {
      projectId: ZION_CONFIG.projectId,
      databaseId: ZION_CONFIG.databaseId
    }
  };
  
  logger.error('API Error:', errorData);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 启动服务器 - Zion最佳实践版本
let server;
function startServer() {
  try {
    server = app.listen(PORT, '0.0.0.0', () => {
      const startupTime = Date.now() - startTime;
      logger.info(`🚀 FurLink Backend API Started Successfully on Zion Platform!`);
      logger.info(`📱 Port: ${PORT}`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
      logger.info(`🔗 Health Check: http://0.0.0.0:${PORT}/api/health`);
      logger.info(`📊 Metrics: http://0.0.0.0:${PORT}/api/metrics`);
      logger.info(`🏢 Zion Info: http://0.0.0.0:${PORT}/api/zion/info`);
      logger.info(`⏰ Started at: ${new Date().toISOString()}`);
      logger.info(`⚡ Startup time: ${startupTime}ms`);
      logger.info(`💾 Memory limit: ${memoryThreshold}MB`);
      logger.info(`🔧 Node.js version: ${process.version}`);
      logger.info(`🖥️ Platform: ${process.platform}`);
      logger.info(`🏢 Zion Project ID: ${ZION_CONFIG.projectId}`);
      logger.info(`🗄️ Database ID: ${ZION_CONFIG.databaseId}`);
    });

    // 服务器超时配置 - Zion优化版本
    server.timeout = 30000; // 30秒超时
    server.keepAliveTimeout = 65000; // 保持连接超时
    server.headersTimeout = 66000; // 头部超时

  } catch (error) {
    logger.error('❌ Server startup failed:', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

// 优雅关闭 - Zion最佳实践版本
let isShuttingDown = false;
let shutdownTimeout;

function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn(`Received ${signal} again, already shutting down.`);
    return;
  }
  isShuttingDown = true;
  
  logger.info(`🔄 Received ${signal}, starting graceful shutdown...`);
  
  // 设置强制关闭超时
  shutdownTimeout = setTimeout(() => {
    logger.error('⏰ Graceful shutdown timeout, forcing exit');
    process.exit(1); // 强制退出
  }, 15000); // 15秒强制退出

  if (server) {
    server.close((err) => {
      if (err) {
        logger.error('❌ Error during server close:', { message: err.message, stack: err.stack });
        process.exit(1);
      }
      logger.info('✅ Server closed. Exiting process.');
      clearTimeout(shutdownTimeout);
      process.exit(0);
    });
  } else {
    logger.info('No server to close. Exiting process.');
    clearTimeout(shutdownTimeout);
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理 - Zion最佳实践版本
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    memoryUsage: process.memoryUsage(),
    zion: {
      projectId: ZION_CONFIG.projectId,
      databaseId: ZION_CONFIG.databaseId
    }
  });
  // 确保日志写入完成
  setTimeout(() => process.exit(1), 1000); // 延迟退出，确保日志输出
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Promise Rejection:', {
    reason: reason,
    promise: promise,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    memoryUsage: process.memoryUsage(),
    zion: {
      projectId: ZION_CONFIG.projectId,
      databaseId: ZION_CONFIG.databaseId
    }
  });
  // 确保日志写入完成
  setTimeout(() => process.exit(1), 1000); // 延迟退出，确保日志输出
});

// 启动服务器
startServer();

// 导出服务器实例用于测试
export { app, server, PORT, ZION_CONFIG };
