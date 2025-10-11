// API配置文件
// FurLink 前端API配置

const API_CONFIG = {
  // 后端API基础URL
  BASE_URL: 'https://furlink-backend-m9k2.zeabur.app',
  
  // API端点
  ENDPOINTS: {
    HEALTH: '/api/health',
    ROOT: '/',
    EMERGENCY: '/api/emergency',
    PETS: '/api/pets',
    SERVICES: '/api/services'
  },
  
  // 请求配置
  REQUEST_CONFIG: {
    timeout: 10000, // 10秒超时
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
}

// API请求工具函数
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    ...API_CONFIG.REQUEST_CONFIG,
    ...options,
    headers: {
      ...API_CONFIG.REQUEST_CONFIG.headers,
      ...options.headers
    }
  }
  
  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// 健康检查
export const checkHealth = () => {
  return apiRequest(API_CONFIG.ENDPOINTS.HEALTH)
}

// 获取服务信息
export const getServiceInfo = () => {
  return apiRequest(API_CONFIG.ENDPOINTS.ROOT)
}

export default API_CONFIG
