// FurLink 多平台服务配置
// 支持Zeabur和Zion双平台后端服务

export const API_CONFIG = {
  // 平台配置 - 新架构：Zeabur前端 + Zeabur后端
  platforms: {
    zeabur: {
      name: 'Zeabur',
      baseUrl: process.env.NODE_ENV === 'production' 
        ? 'https://furlink-backend-us.zeabur.app' // Zeabur后端URL
        : 'http://localhost:8081', // 本地开发
      status: 'primary',
      features: ['完整API', '数据库集成', '用户管理', '地理位置', '权限系统', '宠物管理', '紧急寻回'],
      priority: 1 // 唯一后端服务
    }
  },

  // 环境配置 - 新架构：只有Zeabur后端
  environments: {
    development: {
      primary: 'zeabur',
      timeout: 5000
    },
    production: {
      primary: 'zeabur',
      timeout: 10000
    }
  },

  // API端点配置 - FurLink宠物平台
  endpoints: {
    // 系统端点
    health: '/api/health',
    metrics: '/api/metrics',
    zionInfo: '/api/zion/info',
    zionData: '/api/zion/data',
    
    // 用户管理
    users: '/api/users',
    auth: '/api/auth',
    profile: '/api/profile',
    
    // 宠物管理
    pets: '/api/pets',
    petProfile: '/api/pets/profile',
    petPhotos: '/api/pets/photos',
    
    // 紧急寻回
    emergency: '/api/emergency',
    alerts: '/api/alerts',
    search: '/api/search',
    
    // 服务管理
    services: '/api/services',
    nearby: '/api/services/nearby',
    bookings: '/api/bookings',
    
    // 地理位置
    locations: '/api/locations',
    provinces: '/api/locations/provinces',
    cities: '/api/locations/cities',
    districts: '/api/locations/districts'
  }
};

// 服务选择器 - 简化版：只有Zeabur后端
export class ServiceSelector {
  constructor(environment = 'development') {
    this.environment = environment;
    this.config = API_CONFIG.environments[environment];
    this.currentPlatform = this.config.primary; // 只有'zeabur'
  }

  // 获取当前平台配置
  getCurrentPlatform() {
    return API_CONFIG.platforms[this.currentPlatform];
  }

  // 获取API基础URL
  getBaseUrl() {
    return this.getCurrentPlatform().baseUrl;
  }

  // 构建完整API URL
  buildApiUrl(endpoint) {
    const baseUrl = this.getBaseUrl();
    const endpointPath = API_CONFIG.endpoints[endpoint] || endpoint;
    return `${baseUrl}${endpointPath}`;
  }

  // 健康检查
  async checkHealth() {
    try {
      const healthUrl = this.buildApiUrl('health');
      const response = await fetch(healthUrl, {
        method: 'GET',
        timeout: this.config.timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          platform: this.currentPlatform,
          status: data.status,
          healthy: data.status === 'healthy',
          data: data
        };
      }
      return { platform: this.currentPlatform, healthy: false };
    } catch (error) {
      console.warn(`Health check failed for ${this.currentPlatform}:`, error);
      return { platform: this.currentPlatform, healthy: false, error };
    }
  }

  // API调用 - 简化版
  async apiCall(endpoint, options = {}) {
    try {
      const url = this.buildApiUrl(endpoint);
      const response = await fetch(url, {
        ...options,
        timeout: this.config.timeout
      });

      if (response.ok) {
        return await response.json();
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }
}

// 服务状态监控 - 简化版：只监控Zeabur后端
export class ServiceMonitor {
  constructor(serviceSelector) {
    this.serviceSelector = serviceSelector;
    this.healthStatus = { zeabur: { healthy: false, status: 'unknown' } };
    this.monitoringInterval = null;
  }

  // 开始监控
  startMonitoring(intervalMs = 30000) {
    this.monitoringInterval = setInterval(async () => {
      await this.checkZeaburService();
    }, intervalMs);
  }

  // 停止监控
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // 检查Zeabur服务
  async checkZeaburService() {
    const health = await this.serviceSelector.checkHealth();
    this.healthStatus.zeabur = health;
  }

  // 获取服务状态
  getServiceStatus() {
    return this.healthStatus;
  }

  // 获取最佳服务（只有Zeabur）
  getBestService() {
    return this.healthStatus.zeabur?.healthy ? 'zeabur' : 'zeabur';
  }
}

// 默认服务选择器实例
export const defaultServiceSelector = new ServiceSelector(
  process.env.NODE_ENV || 'development'
);

// 默认服务监控实例
export const defaultServiceMonitor = new ServiceMonitor(defaultServiceSelector);

// 便捷API调用函数
export const apiCall = async (endpoint, options = {}) => {
  return await defaultServiceSelector.apiCall(endpoint, options);
};

// 健康检查函数
export const checkHealth = async () => {
  return await defaultServiceSelector.checkHealth();
};

// 获取服务信息 - 简化版
export const getServiceInfo = () => {
  const currentPlatform = defaultServiceSelector.getCurrentPlatform();
  const serviceStatus = defaultServiceMonitor.getServiceStatus();
  
  return {
    current: {
      platform: defaultServiceSelector.currentPlatform,
      ...currentPlatform
    },
    status: serviceStatus,
    best: 'zeabur' // 只有Zeabur后端
  };
};

export default {
  API_CONFIG,
  ServiceSelector,
  ServiceMonitor,
  defaultServiceSelector,
  defaultServiceMonitor,
  apiCall,
  checkHealth,
  getServiceInfo
};
