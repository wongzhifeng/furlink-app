# 微信小程序域名白名单问题解决方案

## 🔍 问题诊断

### ❌ 错误信息
```
request:fail url not in domain list
```

### 🔧 问题分析
微信小程序出于安全考虑，只允许调用在微信公众平台配置的合法域名。当前Zeabur后端域名 `https://furlink-backend-us.zeabur.app` 未添加到域名白名单中。

## ✅ 解决方案

### 方案1: 配置域名白名单 (推荐)

#### 步骤1: 登录微信公众平台
1. 访问 [微信公众平台](https://mp.weixin.qq.com)
2. 使用小程序账号登录

#### 步骤2: 配置服务器域名
1. 进入 **开发** → **开发管理** → **开发设置**
2. 找到 **服务器域名** 部分
3. 在 **request合法域名** 中添加：
   ```
   https://furlink-backend-us.zeabur.app
   ```
4. 点击 **保存** 按钮

#### 步骤3: 等待生效
- 域名配置需要几分钟生效
- 重新编译小程序项目

### 方案2: 开发环境跳过域名校验 (临时方案)

#### 在微信开发者工具中：
1. 点击右上角 **详情** 按钮
2. 在 **本地设置** 中勾选：
   - ✅ **不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**
3. 重新编译项目

### 方案3: 使用代理域名 (高级方案)

如果无法配置域名白名单，可以设置代理：

```javascript
// utils/api.js - 使用代理域名
const API_BASE_URL = 'https://your-proxy-domain.com/api'; // 代理域名

// 或者使用相对路径（如果小程序部署在同一域名下）
// const API_BASE_URL = '/api';
```

## 🚀 立即解决步骤

### 1. 开发环境快速解决
在微信开发者工具中：
1. 点击 **详情** → **本地设置**
2. 勾选 **不校验合法域名**
3. 重新编译运行

### 2. 生产环境配置
1. 登录微信公众平台
2. 添加域名到白名单
3. 等待生效后测试

## 🔧 代码优化

### 添加域名检查
```javascript
// utils/api.js - 添加域名检查
const API_BASE_URL = 'https://furlink-backend-us.zeabur.app';

// 检查是否在开发环境
const isDev = __wxConfig.envVersion === 'develop';

// 开发环境提示
if (isDev) {
  console.log('开发环境：请确保已勾选"不校验合法域名"');
}

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
      timeout: options.timeout || 10000,
      success: function(res) {
        if (res.statusCode === 200) {
          resolve(res);
        } else {
          reject({
            errMsg: `请求失败: ${res.statusCode}`,
            statusCode: res.statusCode,
            data: res.data
          });
        }
      },
      fail: function(err) {
        // 特殊处理域名错误
        if (err.errMsg.includes('url not in domain list')) {
          console.error('域名未在白名单中，请配置域名白名单或勾选"不校验合法域名"');
          wx.showModal({
            title: '域名配置提示',
            content: '请在微信公众平台配置域名白名单，或在开发者工具中勾选"不校验合法域名"',
            showCancel: false
          });
        }
        reject(err);
      }
    });
  });
}
```

### 添加环境检测
```javascript
// utils/env.js - 环境检测工具
export function getEnvironment() {
  const accountInfo = wx.getAccountInfoSync();
  return {
    envVersion: accountInfo.miniProgram.envVersion, // develop, trial, release
    version: accountInfo.miniProgram.version,
    isDev: accountInfo.miniProgram.envVersion === 'develop',
    isTrial: accountInfo.miniProgram.envVersion === 'trial',
    isRelease: accountInfo.miniProgram.envVersion === 'release'
  };
}

export function checkDomainConfig() {
  const env = getEnvironment();
  
  if (env.isDev) {
    console.log('开发环境：建议勾选"不校验合法域名"');
    return true;
  } else {
    console.log('生产环境：请确保域名已添加到白名单');
    return false;
  }
}
```

## 📋 配置检查清单

### 开发环境
- [ ] 微信开发者工具中勾选"不校验合法域名"
- [ ] 重新编译项目
- [ ] 测试API调用

### 生产环境
- [ ] 微信公众平台添加域名白名单
- [ ] 等待配置生效（通常几分钟）
- [ ] 测试API调用
- [ ] 发布小程序

## 🎯 预期结果

配置完成后：
- ✅ API调用成功
- ✅ 数据正常加载
- ✅ 错误提示消失
- ✅ 小程序功能正常

## 🔧 故障排查

### 如果仍然失败

#### 1. 检查域名格式
- 确保使用HTTPS协议
- 确保域名格式正确
- 确保没有多余的斜杠

#### 2. 检查配置状态
- 确认域名已保存
- 确认配置已生效
- 重新编译项目

#### 3. 检查网络连接
- 确认网络正常
- 确认域名可访问
- 检查防火墙设置

## 💡 最佳实践

### 1. 开发阶段
- 使用"不校验合法域名"快速开发
- 及时测试API功能

### 2. 测试阶段
- 配置测试域名
- 进行完整功能测试

### 3. 生产阶段
- 配置正式域名
- 确保域名安全可靠

---

**立即行动**: 在微信开发者工具中勾选"不校验合法域名"，然后重新编译运行！
