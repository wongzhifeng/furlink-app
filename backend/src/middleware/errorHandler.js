import { Request, Response, NextFunction } from 'express';
import { randomUUID, randomBytes } from 'crypto';
import performanceMonitor from '../services/performanceMonitor';

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  timestamp: string;
  requestId?: string;
  stack?: string;
}

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

class ErrorHandler {
  // 全局错误处理中间件
  static handle(err: CustomError, req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || this.generateRequestId();
    
    // 记录错误到性能监控
    performanceMonitor.emit('error', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: (req as any).user?.id,
      requestId,
      timestamp: new Date()
    });

    // 设置默认状态码
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let isOperational = err.isOperational || false;

    // 处理不同类型的错误
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation Error';
      isOperational = true;
    } else if (err.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
      isOperational = true;
    } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
      statusCode = 500;
      message = 'Database Error';
      isOperational = true;
    } else if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
      isOperational = true;
    } else if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
      isOperational = true;
    } else if (err.name === 'MulterError') {
      statusCode = 400;
      message = 'File upload error';
      isOperational = true;
    } else if (err.code === 'ECONNREFUSED') {
      statusCode = 503;
      message = 'Service unavailable';
      isOperational = true;
    } else if (err.code === 'ENOTFOUND') {
      statusCode = 503;
      message = 'Service not found';
      isOperational = true;
    }

    // 在生产环境中对非可操作性错误隐藏详细信息
    if (process.env.NODE_ENV !== 'development' && !isOperational) {
      message = 'Internal Server Error';
    }

    // 构建错误响应
    const errorResponse: ErrorResponse = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      requestId
    };

    // 在开发环境中包含更多错误信息
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error = err.message;
      errorResponse.stack = err.stack;
    }

    // 记录详细错误日志
    console.error(`[${requestId}] Error:`, {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: (req as any).user?.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      statusCode,
      isOperational
    });

    // 设置基础安全响应头与请求ID
    res.set('X-Request-Id', requestId);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('Content-Security-Policy', "default-src 'none'");

    // 发送错误响应
    res.status(statusCode).json(errorResponse);
  }

  // 404错误处理
  static notFound(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string || this.generateRequestId();
    
    const error: CustomError = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = 404;
    error.isOperational = true;

    next(error);
  }

  // 异步错误包装器
  static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // 生成请求ID
  private static generateRequestId(): string {
    try {
      return randomUUID();
    } catch (e) {
      try {
        return randomBytes(16).toString('hex');
      } catch (e2) {
        return Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
      }
    }
  }

  // 创建自定义错误
  static createError(message: string, statusCode: number = 500, isOperational: boolean = true): CustomError {
    const error: CustomError = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = isOperational;
    return error;
  }

  // 验证错误
  static validationError(message: string): CustomError {
    return this.createError(message, 400, true);
  }

  // 认证错误
  static authenticationError(message: string = 'Authentication failed'): CustomError {
    return this.createError(message, 401, true);
  }

  // 授权错误
  static authorizationError(message: string = 'Access denied'): CustomError {
    return this.createError(message, 403, true);
  }

  // 资源未找到错误
  static notFoundError(message: string = 'Resource not found'): CustomError {
    return this.createError(message, 404, true);
  }

  // 冲突错误
  static conflictError(message: string = 'Resource conflict'): CustomError {
    return this.createError(message, 409, true);
  }

  // 请求过大错误
  static tooLargeError(message: string = 'Request too large'): CustomError {
    return this.createError(message, 413, true);
  }

  // 频率限制错误
  static rateLimitError(message: string = 'Too many requests'): CustomError {
    return this.createError(message, 429, true);
  }

  // 服务器错误
  static serverError(message: string = 'Internal server error'): CustomError {
    return this.createError(message, 500, true);
  }

  // 服务不可用错误
  static serviceUnavailableError(message: string = 'Service unavailable'): CustomError {
    return this.createError(message, 503, true);
  }

  // 处理未捕获的异常
  static handleUncaughtException() {
    process.on('uncaughtException', (err: Error) => {
      console.error('Uncaught Exception:', err);
      
      // 记录到性能监控
      performanceMonitor.emit('uncaught_exception', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date()
      });

      // 优雅关闭
      process.exit(1);
    });
  }

  // 处理未处理的Promise拒绝
  static handleUnhandledRejection() {
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      
      // 记录到性能监控
      performanceMonitor.emit('unhandled_rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        timestamp: new Date()
      });

      // 优雅关闭
      process.exit(1);
    });
  }

  // 处理SIGTERM信号
  static handleSIGTERM() {
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      
      // 记录到性能监控
      performanceMonitor.emit('sigterm', {
        timestamp: new Date()
      });

      process.exit(0);
    });
  }

  // 处理SIGINT信号
  static handleSIGINT() {
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      
      // 记录到性能监控
      performanceMonitor.emit('sigint', {
        timestamp: new Date()
      });

      process.exit(0);
    });
  }

  // 初始化所有错误处理
  static initialize() {
    this.handleUncaughtException();
    this.handleUnhandledRejection();
    this.handleSIGTERM();
    this.handleSIGINT();
    
    console.log('Error handling initialized');
  }
}

export default ErrorHandler;
