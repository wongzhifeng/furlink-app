// FurLink 安全配置 - 超高性能版本
// 宠物紧急寻回平台 - 极致安全优化

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// 安全配置
export const securityConfig = {
  // 速率限制
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100个请求
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },
  
  // CORS配置
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://furlink-app.zeabur.app',
        'http://localhost:8080',
        'http://localhost:3000'
      ];
      
      // 允许无origin的请求（如移动应用）
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  },
  
  // 安全头配置
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://furlink-backend-api.zeabur.app"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        workerSrc: ["'self'", "blob:"],
        childSrc: ["'self'", "blob:"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1年
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  },
  
  // 输入验证
  validation: {
    maxLength: {
      name: 100,
      description: 1000,
      email: 254,
      phone: 20,
      address: 500
    },
    patterns: {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[\+]?[1-9][\d]{0,15}$/,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    }
  },
  
  // 认证配置
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: '24h',
    refreshTokenExpiresIn: '7d',
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15分钟
  },
  
  // 加密配置
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltRounds: 12
  },
  
  // 文件上传安全
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    scanForMalware: true,
    quarantinePath: '/tmp/quarantine'
  },
  
  // API安全
  api: {
    versioning: true,
    apiKeyRequired: false,
    rateLimitPerEndpoint: {
      '/api/auth/login': { max: 5, windowMs: 15 * 60 * 1000 },
      '/api/auth/register': { max: 3, windowMs: 60 * 60 * 1000 },
      '/api/emergency': { max: 10, windowMs: 60 * 1000 }
    }
  }
};

// 安全中间件
export const securityMiddleware = {
  // 速率限制中间件
  createRateLimit(config = {}) {
    return rateLimit({
      ...securityConfig.rateLimit,
      ...config
    });
  },
  
  // CORS中间件
  createCors(config = {}) {
    return cors({
      ...securityConfig.cors,
      ...config
    });
  },
  
  // Helmet中间件
  createHelmet(config = {}) {
    return helmet({
      ...securityConfig.helmet,
      ...config
    });
  },
  
  // 输入验证中间件
  validateInput(req, res, next) {
    const { validation } = securityConfig;
    
    // 检查请求体大小
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB
      return res.status(413).json({
        error: 'Request entity too large',
        message: 'Request body exceeds maximum allowed size'
      });
    }
    
    // 检查Content-Type
    if (req.method === 'POST' || req.method === 'PUT') {
      const contentType = req.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(415).json({
          error: 'Unsupported media type',
          message: 'Content-Type must be application/json'
        });
      }
    }
    
    next();
  },
  
  // SQL注入防护中间件
  preventSQLInjection(req, res, next) {
    const dangerousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
      /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/i,
      /(\b(OR|AND)\s+['"]\s*IN\s*\(['"])/i
    ];
    
    const checkValue = (value) => {
      if (typeof value === 'string') {
        return dangerousPatterns.some(pattern => pattern.test(value));
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkValue);
      }
      return false;
    };
    
    // 检查查询参数
    if (checkValue(req.query)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Potentially dangerous input detected'
      });
    }
    
    // 检查请求体
    if (checkValue(req.body)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Potentially dangerous input detected'
      });
    }
    
    next();
  },
  
  // XSS防护中间件
  preventXSS(req, res, next) {
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        return value
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      }
      if (typeof value === 'object' && value !== null) {
        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = sanitizeValue(val);
        }
        return sanitized;
      }
      return value;
    };
    
    // 清理请求体
    if (req.body) {
      req.body = sanitizeValue(req.body);
    }
    
    // 清理查询参数
    if (req.query) {
      req.query = sanitizeValue(req.query);
    }
    
    next();
  },
  
  // 请求日志中间件
  logSecurityEvents(req, res, next) {
    const securityEvents = [];
    
    // 检查可疑的User-Agent
    const userAgent = req.get('User-Agent') || '';
    if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.length > 500) {
      securityEvents.push('Suspicious User-Agent');
    }
    
    // 检查可疑的请求头
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-cluster-client-ip'];
    suspiciousHeaders.forEach(header => {
      if (req.get(header) && !req.get(header).match(/^[\d\.]+$/)) {
        securityEvents.push(`Suspicious ${header} header`);
      }
    });
    
    // 记录安全事件
    if (securityEvents.length > 0) {
      console.warn('Security event detected:', {
        ip: req.ip,
        userAgent,
        events: securityEvents,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  }
};

// 安全工具函数
export const securityUtils = {
  // 生成安全的随机字符串
  generateSecureRandom(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // 验证邮箱格式
  validateEmail(email) {
    return securityConfig.validation.patterns.email.test(email);
  },
  
  // 验证手机号格式
  validatePhone(phone) {
    return securityConfig.validation.patterns.phone.test(phone);
  },
  
  // 验证UUID格式
  validateUUID(uuid) {
    return securityConfig.validation.patterns.uuid.test(uuid);
  },
  
  // 检查密码强度
  validatePassword(password) {
    const minLength = securityConfig.auth.passwordMinLength;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return {
      isValid: password.length >= minLength && 
               (securityConfig.auth.passwordRequireSpecialChars ? hasSpecialChar : true) &&
               hasUpperCase && hasLowerCase && hasNumber,
      requirements: {
        minLength,
        hasSpecialChar: securityConfig.auth.passwordRequireSpecialChars ? hasSpecialChar : true,
        hasUpperCase,
        hasLowerCase,
        hasNumber
      }
    };
  },
  
  // 生成API密钥
  generateApiKey() {
    return this.generateSecureRandom(64);
  },
  
  // 检查IP是否在黑名单中
  isIPBlacklisted(ip) {
    const blacklistedIPs = process.env.BLACKLISTED_IPS?.split(',') || [];
    return blacklistedIPs.includes(ip);
  },
  
  // 检查IP是否在白名单中
  isIPWhitelisted(ip) {
    const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
    return whitelistedIPs.includes(ip);
  }
};

export default {
  securityConfig,
  securityMiddleware,
  securityUtils
};
