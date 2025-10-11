// FurLink 结构化日志系统 - Zeabur最佳实践
// 宠物紧急寻回平台 - 生产级日志管理

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFormat = process.env.LOG_FORMAT || 'json';
  }

  // 格式化日志消息
  formatMessage(level, message, meta = {}) {
    const baseLog = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      service: 'furlink-backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      pid: process.pid,
      ...meta
    };

    if (this.logFormat === 'json') {
      return JSON.stringify(baseLog);
    } else {
      return `[${baseLog.timestamp}] ${baseLog.level}: ${baseLog.message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    }
  }

  // 记录日志
  log(level, message, meta = {}) {
    if (this.shouldLog(level)) {
      console.log(this.formatMessage(level, message, meta));
    }
  }

  // 检查是否应该记录此级别的日志
  shouldLog(level) {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  // 便捷方法
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // 请求日志
  request(req, res, responseTime) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.requestId
    });
  }

  // 错误日志
  errorLog(error, req = null) {
    this.error('Application Error', {
      message: error.message,
      stack: error.stack,
      url: req?.url,
      method: req?.method,
      requestId: req?.requestId,
      userAgent: req?.get('User-Agent'),
      ip: req?.ip || req?.connection?.remoteAddress
    });
  }

  // 性能日志
  performance(operation, duration, meta = {}) {
    this.info('Performance Metric', {
      operation,
      duration: `${duration}ms`,
      ...meta
    });
  }

  // 系统日志
  system(event, meta = {}) {
    this.info('System Event', {
      event,
      ...meta
    });
  }
}

// 创建全局日志实例
const logger = new Logger();

// 导出日志实例
export { logger };

// 默认导出
export default logger;



