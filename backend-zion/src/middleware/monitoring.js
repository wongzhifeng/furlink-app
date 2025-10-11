// FurLink 监控中间件 - 超高性能版本
// 宠物紧急寻回平台后端服务 - 实时性能监控

import logger from '../utils/logger.js';

// 性能监控数据存储
const performanceMetrics = {
  requestCount: 0,
  totalResponseTime: 0,
  errorCount: 0,
  startTime: Date.now(),
  memoryThreshold: 400, // MB
  maxResponseTime: 0,
  minResponseTime: Infinity,
  responseTimeHistory: [],
  errorHistory: []
};

// 清理历史数据
function cleanupHistory() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  // 清理超过1小时的响应时间历史
  performanceMetrics.responseTimeHistory = performanceMetrics.responseTimeHistory.filter(
    entry => now - entry.timestamp < oneHour
  );
  
  // 清理超过1小时的错误历史
  performanceMetrics.errorHistory = performanceMetrics.errorHistory.filter(
    entry => now - entry.timestamp < oneHour
  );
}

// 获取性能指标
export function getPerformanceMetrics() {
  cleanupHistory();
  
  const uptime = Date.now() - performanceMetrics.startTime;
  const avgResponseTime = performanceMetrics.requestCount > 0 
    ? performanceMetrics.totalResponseTime / performanceMetrics.requestCount 
    : 0;
  
  const errorRate = performanceMetrics.requestCount > 0 
    ? (performanceMetrics.errorCount / performanceMetrics.requestCount) * 100 
    : 0;
  
  const memUsage = process.memoryUsage();
  const memoryUsagePercent = Math.round((memUsage.heapUsed / 1024 / 1024) / performanceMetrics.memoryThreshold * 100);
  
  return {
    uptime: Math.floor(uptime / 1000), // 秒
    requestCount: performanceMetrics.requestCount,
    avgResponseTime: Math.round(avgResponseTime),
    maxResponseTime: performanceMetrics.maxResponseTime === Infinity ? 0 : performanceMetrics.maxResponseTime,
    minResponseTime: performanceMetrics.minResponseTime === Infinity ? 0 : performanceMetrics.minResponseTime,
    errorCount: performanceMetrics.errorCount,
    errorRate: Math.round(errorRate * 100) / 100,
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      usagePercent: memoryUsagePercent
    },
    cpu: process.cpuUsage(),
    responseTimeHistory: performanceMetrics.responseTimeHistory.slice(-100), // 最近100条
    errorHistory: performanceMetrics.errorHistory.slice(-50), // 最近50条
    timestamp: new Date().toISOString()
  };
}

// 请求监控中间件
export function requestMonitoring(req, res, next) {
  const startTime = Date.now();
  performanceMetrics.requestCount++;
  
  // 记录请求开始
  logger.info('Request started', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
  
  // 监听响应完成
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    performanceMetrics.totalResponseTime += responseTime;
    
    // 更新响应时间统计
    performanceMetrics.maxResponseTime = Math.max(performanceMetrics.maxResponseTime, responseTime);
    performanceMetrics.minResponseTime = Math.min(performanceMetrics.minResponseTime, responseTime);
    
    // 记录响应时间历史
    performanceMetrics.responseTimeHistory.push({
      timestamp: Date.now(),
      responseTime,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode
    });
    
    // 记录响应完成
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
    
    // 检查响应时间是否过长
    if (responseTime > 5000) { // 5秒
      logger.warn('Slow response detected', {
        method: req.method,
        url: req.originalUrl,
        responseTime,
        requestId: req.requestId
      });
    }
  });
  
  // 监听响应错误
  res.on('error', (error) => {
    performanceMetrics.errorCount++;
    
    // 记录错误历史
    performanceMetrics.errorHistory.push({
      timestamp: Date.now(),
      error: error.message,
      method: req.method,
      url: req.originalUrl,
      requestId: req.requestId
    });
    
    logger.error('Response error', {
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      stack: error.stack,
      requestId: req.requestId
    });
  });
  
  next();
}

// 内存监控中间件
export function memoryMonitoring(req, res, next) {
  const memUsage = process.memoryUsage();
  const memoryUsagePercent = Math.round((memUsage.heapUsed / 1024 / 1024) / performanceMetrics.memoryThreshold * 100);
  
  // 检查内存使用情况
  if (memoryUsagePercent > 80) {
    logger.warn('High memory usage detected', {
      memoryUsagePercent,
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      requestId: req.requestId
    });
  }
  
  // 内存使用过高时触发垃圾回收
  if (memoryUsagePercent > 90 && global.gc) {
    logger.warn('Triggering garbage collection due to high memory usage', {
      memoryUsagePercent,
      requestId: req.requestId
    });
    global.gc();
  }
  
  next();
}

// 错误监控中间件
export function errorMonitoring(err, req, res, next) {
  performanceMetrics.errorCount++;
  
  // 记录错误历史
  performanceMetrics.errorHistory.push({
    timestamp: Date.now(),
    error: err.message,
    method: req.method,
    url: req.originalUrl,
    requestId: req.requestId,
    stack: err.stack
  });
  
  logger.error('Application error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
  
  next(err);
}

// 性能报告端点
export function performanceReport(req, res) {
  try {
    const metrics = getPerformanceMetrics();
    
    // 检查系统健康状态
    const isHealthy = metrics.memory.usagePercent < 90 && 
                     metrics.errorRate < 10 && 
                     metrics.avgResponseTime < 1000;
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      metrics,
      recommendations: generateRecommendations(metrics),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Performance report error', {
      error: error.message,
      stack: error.stack,
      requestId: req.requestId
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate performance report',
      timestamp: new Date().toISOString()
    });
  }
}

// 生成性能建议
function generateRecommendations(metrics) {
  const recommendations = [];
  
  if (metrics.memory.usagePercent > 80) {
    recommendations.push('内存使用率过高，建议优化内存使用或增加内存限制');
  }
  
  if (metrics.errorRate > 5) {
    recommendations.push('错误率过高，建议检查错误日志并修复问题');
  }
  
  if (metrics.avgResponseTime > 500) {
    recommendations.push('平均响应时间过长，建议优化代码性能');
  }
  
  if (metrics.maxResponseTime > 5000) {
    recommendations.push('存在超慢响应，建议检查数据库查询和外部API调用');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('系统运行正常，无需特殊优化');
  }
  
  return recommendations;
}

// 定期清理和报告
setInterval(() => {
  cleanupHistory();
  
  const metrics = getPerformanceMetrics();
  
  // 每小时记录一次性能摘要
  if (metrics.requestCount > 0) {
    logger.info('Performance summary', {
      uptime: metrics.uptime,
      requestCount: metrics.requestCount,
      avgResponseTime: metrics.avgResponseTime,
      errorRate: metrics.errorRate,
      memoryUsagePercent: metrics.memory.usagePercent
    });
  }
}, 60 * 60 * 1000); // 每小时

export default {
  requestMonitoring,
  memoryMonitoring,
  errorMonitoring,
  performanceReport,
  getPerformanceMetrics
};
