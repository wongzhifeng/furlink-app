// FurLink 性能优化配置 - 超高性能版本
// 宠物紧急寻回平台 - 极致性能优化

// 性能优化配置
export const performanceConfig = {
  // 内存优化
  memory: {
    maxOldSpaceSize: 400, // MB
    maxSemiSpaceSize: 64, // MB
    optimizeForSize: true,
    gcInterval: 30000, // 30秒
    memoryThreshold: 350 // MB
  },
  
  // 请求优化
  request: {
    timeout: 30000, // 30秒
    keepAliveTimeout: 65000, // 65秒
    headersTimeout: 66000, // 66秒
    maxRequestSize: '10mb',
    maxParameterLimit: 1000,
    compression: true,
    etag: true
  },
  
  // 缓存优化
  cache: {
    staticAssets: {
      maxAge: 31536000, // 1年
      immutable: true
    },
    api: {
      maxAge: 300, // 5分钟
      staleWhileRevalidate: 60 // 1分钟
    },
    html: {
      maxAge: 3600, // 1小时
      mustRevalidate: true
    }
  },
  
  // 数据库优化
  database: {
    connectionPool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    },
    query: {
      timeout: 10000, // 10秒
      slowQueryThreshold: 1000 // 1秒
    }
  },
  
  // 日志优化
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    maxFiles: 5,
    maxSize: '10m',
    compress: true,
    json: true
  },
  
  // 监控优化
  monitoring: {
    metricsInterval: 60000, // 1分钟
    healthCheckInterval: 30000, // 30秒
    performanceReportInterval: 3600000, // 1小时
    maxHistorySize: 1000,
    cleanupInterval: 300000 // 5分钟
  },
  
  // 安全优化
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 限制每个IP 15分钟内最多100个请求
      skipSuccessfulRequests: true
    },
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
      optionsSuccessStatus: 200
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  },
  
  // 构建优化
  build: {
    minify: true,
    sourceMap: false,
    treeShaking: true,
    codeSplitting: true,
    compression: {
      gzip: true,
      brotli: true,
      level: 6
    },
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react']
        }
      }
    }
  },
  
  // 环境特定优化
  environment: {
    development: {
      hotReload: true,
      sourceMap: true,
      verbose: true
    },
    production: {
      hotReload: false,
      sourceMap: false,
      verbose: false,
      compression: true,
      caching: true
    }
  }
};

// 性能优化函数
export const performanceOptimizer = {
  // 内存优化
  optimizeMemory() {
    if (global.gc) {
      global.gc();
    }
    
    const memUsage = process.memoryUsage();
    const usagePercent = (memUsage.heapUsed / 1024 / 1024) / performanceConfig.memory.memoryThreshold * 100;
    
    if (usagePercent > 80) {
      console.warn(`High memory usage: ${usagePercent.toFixed(2)}%`);
    }
    
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      usagePercent: Math.round(usagePercent)
    };
  },
  
  // 请求优化
  optimizeRequest(req, res, next) {
    // 设置缓存头
    if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
      res.setHeader('Cache-Control', `public, max-age=${performanceConfig.cache.staticAssets.maxAge}, immutable`);
    } else if (req.url.startsWith('/api/')) {
      res.setHeader('Cache-Control', `public, max-age=${performanceConfig.cache.api.maxAge}, stale-while-revalidate=${performanceConfig.cache.api.staleWhileRevalidate}`);
    } else {
      res.setHeader('Cache-Control', `public, max-age=${performanceConfig.cache.html.maxAge}, must-revalidate`);
    }
    
    // 设置压缩
    if (performanceConfig.request.compression) {
      res.setHeader('Content-Encoding', 'gzip');
    }
    
    next();
  },
  
  // 数据库优化
  optimizeDatabase(connection) {
    return {
      ...connection,
      ...performanceConfig.database.connectionPool,
      query_timeout: performanceConfig.database.query.timeout
    };
  },
  
  // 日志优化
  optimizeLogging(level = 'info') {
    return {
      level,
      format: performanceConfig.logging.json ? 'json' : 'simple',
      maxFiles: performanceConfig.logging.maxFiles,
      maxSize: performanceConfig.logging.maxSize,
      compress: performanceConfig.logging.compress
    };
  }
};

// 性能监控
export const performanceMonitor = {
  metrics: {
    requestCount: 0,
    totalResponseTime: 0,
    errorCount: 0,
    memoryUsage: [],
    responseTimeHistory: []
  },
  
  // 记录请求指标
  recordRequest(responseTime, error = null) {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.responseTimeHistory.push({
      timestamp: Date.now(),
      responseTime,
      error: error?.message
    });
    
    if (error) {
      this.metrics.errorCount++;
    }
    
    // 清理历史数据
    this.cleanupHistory();
  },
  
  // 记录内存使用
  recordMemoryUsage() {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024)
    });
    
    // 清理历史数据
    this.cleanupHistory();
  },
  
  // 清理历史数据
  cleanupHistory() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    this.metrics.responseTimeHistory = this.metrics.responseTimeHistory.filter(
      entry => now - entry.timestamp < oneHour
    );
    
    this.metrics.memoryUsage = this.metrics.memoryUsage.filter(
      entry => now - entry.timestamp < oneHour
    );
  },
  
  // 获取性能报告
  getReport() {
    const avgResponseTime = this.metrics.requestCount > 0 
      ? this.metrics.totalResponseTime / this.metrics.requestCount 
      : 0;
    
    const errorRate = this.metrics.requestCount > 0 
      ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
      : 0;
    
    return {
      requestCount: this.metrics.requestCount,
      avgResponseTime: Math.round(avgResponseTime),
      errorCount: this.metrics.errorCount,
      errorRate: Math.round(errorRate * 100) / 100,
      memoryUsage: this.metrics.memoryUsage.slice(-10), // 最近10条
      responseTimeHistory: this.metrics.responseTimeHistory.slice(-50), // 最近50条
      timestamp: new Date().toISOString()
    };
  }
};

// 启动性能监控
setInterval(() => {
  performanceMonitor.recordMemoryUsage();
}, performanceConfig.monitoring.metricsInterval);

export default {
  performanceConfig,
  performanceOptimizer,
  performanceMonitor
};
