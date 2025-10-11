# 微信小程序调用Zeabur后端指南

## ✅ 可行性确认

### 🎯 答案：可以！
微信小程序完全可以调用Zeabur后端API，这是标准的跨平台架构。

## 🔧 技术实现

### 1. 网络请求配置
微信小程序使用 `wx.request()` 调用外部API：

```javascript
// 调用Zeabur后端API
wx.request({
  url: 'https://furlink-backend-us.zeabur.app/api/health',
  method: 'GET',
  header: {
    'content-type': 'application/json'
  },
  success: function(res) {
    console.log('API调用成功:', res.data);
  },
  fail: function(err) {
    console.error('API调用失败:', err);
  }
});
```

### 2. 服务器域名配置
在微信小程序后台配置服务器域名：

**开发环境**：
- 在微信开发者工具中勾选"不校验合法域名"
- 可以直接调用任何HTTPS接口

**生产环境**：
- 在微信公众平台配置服务器域名
- 添加：`https://furlink-backend-us.zeabur.app`

## 🛠️ 具体配置步骤

### 步骤1: 微信公众平台配置
1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入小程序后台
3. 开发 → 开发管理 → 开发设置
4. 服务器域名 → request合法域名
5. 添加：`https://furlink-backend-us.zeabur.app`

### 步骤2: 小程序代码实现
```javascript
// utils/api.js
const API_BASE_URL = 'https://furlink-backend-us.zeabur.app';

// API调用封装
function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        ...options.header
      },
      success: resolve,
      fail: reject
    });
  });
}

// 健康检查
export function checkHealth() {
  return request({
    url: '/api/health',
    method: 'GET'
  });
}

// 获取宠物信息
export function getPets() {
  return request({
    url: '/api/pets',
    method: 'GET'
  });
}

// 提交紧急寻宠
export function submitEmergency(data) {
  return request({
    url: '/api/emergency',
    method: 'POST',
    data: data
  });
}
```

### 步骤3: 页面中使用
```javascript
// pages/index/index.js
import { checkHealth, getPets, submitEmergency } from '../../utils/api.js';

Page({
  data: {
    pets: [],
    healthStatus: null
  },

  onLoad() {
    this.checkBackendHealth();
    this.loadPets();
  },

  // 检查后端健康状态
  async checkBackendHealth() {
    try {
      const res = await checkHealth();
      this.setData({
        healthStatus: res.data
      });
      console.log('后端健康状态:', res.data);
    } catch (error) {
      console.error('后端连接失败:', error);
      wx.showToast({
        title: '后端连接失败',
        icon: 'error'
      });
    }
  },

  // 加载宠物列表
  async loadPets() {
    try {
      const res = await getPets();
      this.setData({
        pets: res.data
      });
    } catch (error) {
      console.error('加载宠物失败:', error);
    }
  },

  // 提交紧急寻宠
  async submitEmergency() {
    const data = {
      petId: '123',
      location: '北京市朝阳区',
      description: '走失的宠物',
      contact: '13800138000'
    };

    try {
      const res = await submitEmergency(data);
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('提交失败:', error);
      wx.showToast({
        title: '提交失败',
        icon: 'error'
      });
    }
  }
});
```

## 🔒 安全配置

### 1. HTTPS要求
- ✅ Zeabur后端默认使用HTTPS
- ✅ 微信小程序要求HTTPS接口
- ✅ 完全兼容

### 2. CORS配置
后端已配置CORS，允许跨域请求：
```javascript
// 后端CORS配置
app.use(cors({
  origin: '*', // 允许所有域名
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 3. 域名白名单
在微信公众平台添加域名到白名单：
- `https://furlink-backend-us.zeabur.app`

## 📊 架构对比

| 平台 | 前端 | 后端 | 通信方式 |
|------|------|------|----------|
| Web | React | Zeabur | fetch/axios |
| 小程序 | 微信小程序 | Zeabur | wx.request |
| 移动端 | React Native | Zeabur | fetch |

## 🎯 优势

### 1. 统一后端
- ✅ 一套后端API服务多个平台
- ✅ 数据一致性
- ✅ 维护成本低

### 2. 性能优化
- ✅ Zeabur全球CDN加速
- ✅ 自动扩缩容
- ✅ 高可用性

### 3. 开发效率
- ✅ API接口复用
- ✅ 统一的数据格式
- ✅ 标准RESTful API

## 🚀 实施建议

### 1. 立即行动
1. **配置域名**: 在微信公众平台添加Zeabur后端域名
2. **开发测试**: 在微信开发者工具中测试API调用
3. **功能实现**: 实现宠物管理、紧急寻回等功能

### 2. 功能规划
- **宠物管理**: 添加、编辑、删除宠物信息
- **紧急寻回**: 发布寻宠信息、查看附近宠物
- **用户系统**: 登录、注册、个人中心
- **地理位置**: 获取位置、附近服务

### 3. 测试验证
```javascript
// 测试API连接
wx.request({
  url: 'https://furlink-backend-us.zeabur.app/api/health',
  success: function(res) {
    console.log('连接成功:', res.data);
  }
});
```

## 📋 注意事项

### 1. 域名配置
- 必须在微信公众平台配置合法域名
- 开发环境可以跳过域名校验
- 生产环境必须使用HTTPS

### 2. 网络超时
```javascript
wx.request({
  url: 'https://furlink-backend-us.zeabur.app/api/data',
  timeout: 10000, // 10秒超时
  success: function(res) {
    // 处理响应
  },
  fail: function(err) {
    // 处理错误
  }
});
```

### 3. 错误处理
```javascript
// 统一错误处理
function handleApiError(error) {
  if (error.errMsg.includes('timeout')) {
    wx.showToast({
      title: '网络超时',
      icon: 'error'
    });
  } else if (error.errMsg.includes('fail')) {
    wx.showToast({
      title: '网络错误',
      icon: 'error'
    });
  }
}
```

---

**总结**: 微信小程序完全可以调用Zeabur后端，只需要配置域名白名单和实现API调用代码即可！
