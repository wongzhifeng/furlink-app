const path = require('path');

// 简单访问控制：限制静态uploads访问，仅允许images子目录读取 - 优化56: 增强输入验证和错误处理
function uploadsAccessControl(req, res, next) {
  try {
    // 优化56: 输入验证
    if (!req || !res || !next) {
      return res.status(500).json({ 
        success: false, 
        message: '访问控制中间件参数错误',
        timestamp: new Date().toISOString()
      });
    }

    const requestedPath = req.path || '';
    
    // 优化56: 增强路径验证
    if (typeof requestedPath !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: '请求路径格式错误',
        timestamp: new Date().toISOString()
      });
    }

    // 仅允许访问 /images/* 或根索引
    if (requestedPath === '/' || requestedPath.startsWith('/images/')) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: '禁止访问该资源',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Access control error:', e);
    return res.status(500).json({ 
      success: false, 
      message: '访问控制错误',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = { uploadsAccessControl };







