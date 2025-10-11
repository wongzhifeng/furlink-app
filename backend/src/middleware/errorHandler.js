// FurLink 错误处理中间件
// 简化版本，专注于基础错误处理

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // 默认错误响应
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};