const { swaggerSpec, swaggerUi } = require('../config/swagger');
const path = require('path');

/**
 * @swagger
 * components:
 *   responses:
 *     UnauthorizedError:
 *       description: 未授权访问
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     ValidationError:
 *       description: 参数验证错误
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     NotFoundError:
 *       description: 资源未找到
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     ServerError:
 *       description: 服务器内部错误
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 */

/**
 * Swagger UI中间件 - 优化57: 增强配置和错误处理
 */
const setupSwaggerUI = (app) => {
  try {
    // 优化57: 输入验证
    if (!app) {
      throw new Error('Express app is required');
    }

    // Swagger UI路由 - 优化57: 增强配置
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .info .title { color: #1890ff }
    `,
    customSiteTitle: 'FluLink API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      requestInterceptor: (req) => {
        // 添加认证头
        const token = localStorage.getItem('authToken');
        if (token) {
          req.headers.Authorization = `Bearer ${token}`;
        }
        return req;
      }
    }
  }));

  // API规范JSON端点
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // OpenAPI规范端点
  app.get('/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

/**
 * API规范验证中间件
 */
const validateApiSpec = (req, res, next) => {
  // 在生产环境中可以添加API规范验证逻辑
  if (process.env.NODE_ENV === 'production') {
    // 验证请求是否符合API规范
    // 这里可以添加更复杂的验证逻辑
  }
  next();
};

/**
 * API响应格式化中间件
 */
const formatApiResponse = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // 如果是API请求，格式化响应
    if (req.path.startsWith('/api/')) {
      const formattedData = {
        success: res.statusCode >= 200 && res.statusCode < 300,
        message: res.statusCode >= 200 && res.statusCode < 300 ? 'Success' : 'Error',
        data: data,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      };
      
      return originalSend.call(this, formattedData);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * API文档生成中间件
 */
const generateApiDocs = (req, res, next) => {
  // 记录API使用情况
  const apiUsage = {
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };
  
  // 在生产环境中可以记录到数据库或日志文件
  if (process.env.NODE_ENV === 'production') {
    console.log('API Usage:', JSON.stringify(apiUsage));
  }
  
  next();
};

module.exports = {
  setupSwaggerUI,
  validateApiSpec,
  formatApiResponse,
  generateApiDocs
};
