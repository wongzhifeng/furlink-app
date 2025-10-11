const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const redisService = require('../services/redisService');

/**
 * AuthService - 认证服务类
 * 
 * 提供JWT令牌生成、验证、刷新等安全认证功能
 * 
 * @class AuthService
 * @version 1.0.0
 * @author FluLink Team
 * @since 2024-10-09
 */
class AuthService {
  constructor() {
    // 第9次优化：增强密钥管理和安全配置
    this.secretKey = process.env.JWT_SECRET || this.generateSecureKey();
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    
    // 优化9.1: 增强安全配置，添加更多安全选项
    this.securityConfig = {
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 15 * 60 * 1000, // 15分钟
      tokenBlacklistTTL: parseInt(process.env.TOKEN_BLACKLIST_TTL) || 7 * 24 * 60 * 60, // 7天
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15分钟
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 最大请求数
      // 优化9.2: 添加新的安全选项
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
      passwordRequireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL === 'true',
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 30 * 60 * 1000, // 30分钟
      ipWhitelist: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [],
      // 优化9.3: 添加安全头配置
      securityHeaders: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      }
    };
  }

  /**
   * 生成安全密钥
   * 
   * @method generateSecureKey
   * @returns {string} 生成的随机密钥
   * @description 当环境变量中没有JWT_SECRET时生成安全的随机密钥
   */
  generateSecureKey() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * 生成JWT Token - 增强安全版本
   * 
   * @method generateToken
   * @param {Object} payload - 令牌载荷
   * @param {string} type - 令牌类型 ('access' | 'refresh')
   * @returns {string} JWT令牌
   * @description 生成带有安全配置的JWT令牌
   */
  generateToken(payload, type = 'access') {
    try {
      // 优化3: 增强载荷安全性
      const securePayload = {
        ...payload,
        jti: crypto.randomUUID(), // JWT ID
        iat: Math.floor(Date.now() / 1000),
        type: type
      };

      // 优化4: 根据类型设置不同的过期时间
      const expiresIn = type === 'refresh' ? this.refreshExpiresIn : this.expiresIn;
      
      return jwt.sign(securePayload, this.secretKey, { 
        expiresIn,
        algorithm: 'HS256',
        issuer: 'flulink-api',
        audience: 'flulink-client'
      });
    } catch (error) {
      console.error('Token generation failed:', error);
      throw new Error('令牌生成失败');
    }
  }

  /**
   * 验证JWT Token - 增强安全版本
   * 
   * @method verifyToken
   * @param {string} token - JWT令牌
   * @param {string} type - 期望的令牌类型
   * @returns {Object} 解码后的载荷
   * @throws {Error} 当令牌无效时抛出错误
   * @description 验证JWT令牌的有效性和安全性
   */
  async verifyToken(token, type = 'access') {
    try {
      // 优化5: 检查令牌黑名单
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('令牌已被撤销');
      }

      // 优化6: 增强验证选项
      const decoded = jwt.verify(token, this.secretKey, {
        algorithms: ['HS256'],
        issuer: 'flulink-api',
        audience: 'flulink-client'
      });

      // 优化7: 验证令牌类型
      if (decoded.type !== type) {
        throw new Error('令牌类型不匹配');
      }

      // 优化8: 检查令牌年龄
      const tokenAge = Date.now() / 1000 - decoded.iat;
      if (tokenAge > 7 * 24 * 60 * 60) { // 7天
        throw new Error('令牌过期时间过长');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('令牌已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('无效的令牌');
      } else {
        throw new Error(`令牌验证失败: ${error.message}`);
      }
    }
  }

  // 从请求头中提取Token
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      throw new Error('Authorization header is missing');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }

    return parts[1];
  }

  // 刷新Token
  refreshToken(token) {
    try {
      const decoded = this.verifyToken(token);
      const newPayload = {
        userId: decoded.userId,
        phone: decoded.phone,
        iat: Math.floor(Date.now() / 1000)
      };
      return this.generateToken(newPayload);
    } catch (error) {
      throw new Error('Cannot refresh invalid token');
    }
  }
}

// 认证中间件
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    const authService = new AuthService();
    const token = authService.extractTokenFromHeader(authHeader);
    const decoded = authService.verifyToken(token);

    // 验证用户是否存在且活跃
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    // 更新用户最后活跃时间
    user.lastActiveAt = new Date();
    await user.save();

    // 将用户信息添加到请求对象
    req.user = {
      id: user._id,
      phone: user.phone,
      nickname: user.nickname
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌',
      error: error.message
    });
  }
};

// 可选认证中间件（不强制要求登录）
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const authService = new AuthService();
    const token = authService.extractTokenFromHeader(authHeader);
    const decoded = authService.verifyToken(token);

    const user = await User.findById(decoded.userId);
    if (user && user.isActive) {
      req.user = {
        id: user._id,
        phone: user.phone,
        nickname: user.nickname
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// 管理员认证中间件
const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    const authService = new AuthService();
    const token = authService.extractTokenFromHeader(authHeader);
    const decoded = authService.verifyToken(token);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    // 检查管理员权限（这里可以根据实际需求调整）
    if (user.phone !== process.env.ADMIN_PHONE) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    req.user = {
      id: user._id,
      phone: user.phone,
      nickname: user.nickname,
      isAdmin: true
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌',
      error: error.message
    });
  }
};

// 验证手机号格式
const validatePhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// 验证密码强度
const validatePassword = (password) => {
  // 至少8位，包含字母和数字
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
};

module.exports = {
  AuthService,
  authMiddleware,
  optionalAuthMiddleware,
  adminAuthMiddleware,
  validatePhone,
  validatePassword
};

