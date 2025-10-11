// FurLink 多平台服务配置
// 支持Zeabur和Zion双平台后端服务

export const API_CONFIG = {
  // 平台配置
  platforms: {
    zeabur: {
      name: 'Zeabur',
      baseUrl: 'https://furlink-backend-m9k2.zeabur.app',
      status: 'deployed',
      features: ['基础API', '健康检查', '性能监控'],
      priority: 2 // 备用优先级
    },
    zion: {
      name: 'Zion',
      baseUrl: 'http://localhost:8081', // 本地测试，部署后改为Zion URL
      status: 'testing',
      features: ['完整API', '数据库集成', '用户管理', '地理位置', '权限系统'],
      priority: 1 // 主要优先级
    }
  },

  // 环境配置
  environments: {
    development: {
      primary: 'zion',
      fallback: 'zeabur',
      timeout: 5000
    },
    production: {
      primary: 'zion',
      fallback: 'zeabur',
      timeout: 10000
    }
  },

  // API端点配置
  endpoints: {
    health: '/api/health',
    metrics: '/api/metrics',
    zionInfo: '/api/zion/info',
    zionData: '/api/zion/data',
    // 通用端点
    pets: '/api/pets',
    emergency: '/api/emergency',
    services: '/api/services',
    users: '/api/users'
  }
};

// 服务选择器
export class ServiceSelector {
  constructor(environment = 'development') {
    this.environment = environment;
    this.config = API_CONFIG.environments[environment];
    this.currentPlatform = this.config.primary;
    this.fallbackPlatform = this.config.fallback;
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

  // 自动切换平台
  async switchToFallback() {
    if (this.currentPlatform === this.config.primary) {
      console.log(`Switching from ${this.currentPlatform} to ${this.config.fallback}`);
      this.currentPlatform = this.config.fallback;
      return true;
    }
    return false;
  }

  // 智能API调用
  async apiCall(endpoint, options = {}) {
    const maxRetries = 2;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
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
        lastError = error;
        console.warn(`API call failed (attempt ${attempt + 1}):`, error);

        // 尝试切换到备用平台
        if (attempt === 0 && await this.switchToFallback()) {
          continue;
        }
      }
    }

    throw lastError;
  }
}

// 服务状态监控
export class ServiceMonitor {
  constructor(serviceSelector) {
    this.serviceSelector = serviceSelector;
    this.healthStatus = new Map();
    this.monitoringInterval = null;
  }

  // 开始监控
  startMonitoring(intervalMs = 30000) {
    this.monitoringInterval = setInterval(async () => {
      await this.checkAllServices();
    }, intervalMs);
  }

  // 停止监控
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // 检查所有服务
  async checkAllServices() {
    const platforms = Object.keys(API_CONFIG.platforms);
    
    for (const platform of platforms) {
      const originalPlatform = this.serviceSelector.currentPlatform;
      this.serviceSelector.currentPlatform = platform;
      
      const health = await this.serviceSelector.checkHealth();
      this.healthStatus.set(platform, health);
      
      this.serviceSelector.currentPlatform = originalPlatform;
    }
  }

  // 获取服务状态
  getServiceStatus() {
    return Object.fromEntries(this.healthStatus);
  }

  // 获取最佳服务
  getBestService() {
    const statuses = this.getServiceStatus();
    
    // 优先选择健康的Zion服务
    if (statuses.zion?.healthy) {
      return 'zion';
    }
    
    // 其次选择健康的Zeabur服务
    if (statuses.zeabur?.healthy) {
      return 'zeabur';
    }
    
    // 默认返回当前平台
    return this.serviceSelector.currentPlatform;
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

// 获取服务信息
export const getServiceInfo = () => {
  const currentPlatform = defaultServiceSelector.getCurrentPlatform();
  const serviceStatus = defaultServiceMonitor.getServiceStatus();
  
  return {
    current: {
      platform: defaultServiceSelector.currentPlatform,
      ...currentPlatform
    },
    status: serviceStatus,
    best: defaultServiceMonitor.getBestService()
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
