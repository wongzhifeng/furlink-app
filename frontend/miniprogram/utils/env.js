// utils/env.js - 环境检测工具
// 检测小程序运行环境和配置状态

// 获取环境信息
export function getEnvironment() {
  try {
    const accountInfo = wx.getAccountInfoSync();
    return {
      envVersion: accountInfo.miniProgram.envVersion, // develop, trial, release
      version: accountInfo.miniProgram.version,
      isDev: accountInfo.miniProgram.envVersion === 'develop',
      isTrial: accountInfo.miniProgram.envVersion === 'trial',
      isRelease: accountInfo.miniProgram.envVersion === 'release'
    };
  } catch (error) {
    console.error('获取环境信息失败:', error);
    return {
      envVersion: 'unknown',
      version: 'unknown',
      isDev: false,
      isTrial: false,
      isRelease: false
    };
  }
}

// 检查域名配置
export function checkDomainConfig() {
  const env = getEnvironment();
  
  if (env.isDev) {
    console.log('开发环境：建议勾选"不校验合法域名"');
    return {
      needConfig: true,
      message: '开发环境：请在开发者工具中勾选"不校验合法域名"',
      action: 'developer_tool'
    };
  } else if (env.isTrial || env.isRelease) {
    console.log('生产环境：请确保域名已添加到白名单');
    return {
      needConfig: true,
      message: '生产环境：请在微信公众平台配置域名白名单',
      action: 'mp_platform'
    };
  }
  
  return {
    needConfig: false,
    message: '域名配置正常',
    action: 'none'
  };
}

// 显示配置提示
export function showConfigTip() {
  const config = checkDomainConfig();
  
  if (config.needConfig) {
    wx.showModal({
      title: '域名配置提示',
      content: config.message,
      showCancel: false,
      confirmText: '知道了'
    });
  }
}

// 测试API连接
export function testApiConnection() {
  return new Promise((resolve) => {
    wx.request({
      url: 'https://furlink-backend-us.zeabur.app/api/health',
      method: 'GET',
      timeout: 5000,
      success: function(res) {
        console.log('API连接测试成功:', res.data);
        resolve({
          success: true,
          data: res.data,
          message: 'API连接正常'
        });
      },
      fail: function(err) {
        console.error('API连接测试失败:', err);
        resolve({
          success: false,
          error: err,
          message: err.errMsg || 'API连接失败'
        });
      }
    });
  });
}

// 检查网络状态
export function checkNetworkStatus() {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success: function(res) {
        console.log('网络类型:', res.networkType);
        resolve({
          networkType: res.networkType,
          isConnected: res.networkType !== 'none'
        });
      },
      fail: function(err) {
        console.error('获取网络状态失败:', err);
        resolve({
          networkType: 'unknown',
          isConnected: false
        });
      }
    });
  });
}

// 综合环境检查
export async function comprehensiveCheck() {
  const env = getEnvironment();
  const domainConfig = checkDomainConfig();
  const networkStatus = await checkNetworkStatus();
  const apiTest = await testApiConnection();
  
  const result = {
    environment: env,
    domainConfig: domainConfig,
    networkStatus: networkStatus,
    apiTest: apiTest,
    timestamp: new Date().toISOString()
  };
  
  console.log('环境检查结果:', result);
  
  // 如果有问题，显示提示
  if (domainConfig.needConfig || !networkStatus.isConnected || !apiTest.success) {
    let message = '检测到以下问题：\n';
    
    if (domainConfig.needConfig) {
      message += '• ' + domainConfig.message + '\n';
    }
    
    if (!networkStatus.isConnected) {
      message += '• 网络连接异常\n';
    }
    
    if (!apiTest.success) {
      message += '• API连接失败\n';
    }
    
    wx.showModal({
      title: '环境检查',
      content: message,
      showCancel: false,
      confirmText: '知道了'
    });
  }
  
  return result;
}

export default {
  getEnvironment,
  checkDomainConfig,
  showConfigTip,
  testApiConnection,
  checkNetworkStatus,
  comprehensiveCheck
};
