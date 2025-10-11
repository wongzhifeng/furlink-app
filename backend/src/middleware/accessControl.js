// FurLink 访问控制中间件
// 简化版本，专注于基础功能

export const accessControl = (req, res, next) => {
  // 设置CORS头
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  // 记录请求
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);

  next();
};