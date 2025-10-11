// utils/api.js - FurLink 小程序API调用工具
// 调用Zeabur后端API

const API_BASE_URL = 'https://furlink-backend-us.zeabur.app';

// 统一请求封装
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
        reject(err);
      }
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

// 获取性能指标
export function getMetrics() {
  return request({
    url: '/api/metrics',
    method: 'GET'
  });
}

// 用户相关API
export function login(data) {
  return request({
    url: '/api/auth/login',
    method: 'POST',
    data: data
  });
}

export function register(data) {
  return request({
    url: '/api/auth/register',
    method: 'POST',
    data: data
  });
}

export function getUserProfile() {
  return request({
    url: '/api/profile',
    method: 'GET'
  });
}

export function updateUserProfile(data) {
  return request({
    url: '/api/profile',
    method: 'PUT',
    data: data
  });
}

// 宠物相关API
export function getPets() {
  return request({
    url: '/api/pets',
    method: 'GET'
  });
}

export function getPetById(petId) {
  return request({
    url: `/api/pets/${petId}`,
    method: 'GET'
  });
}

export function createPet(data) {
  return request({
    url: '/api/pets',
    method: 'POST',
    data: data
  });
}

export function updatePet(petId, data) {
  return request({
    url: `/api/pets/${petId}`,
    method: 'PUT',
    data: data
  });
}

export function deletePet(petId) {
  return request({
    url: `/api/pets/${petId}`,
    method: 'DELETE'
  });
}

export function uploadPetPhoto(petId, filePath) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: API_BASE_URL + `/api/pets/${petId}/photos`,
      filePath: filePath,
      name: 'photo',
      success: resolve,
      fail: reject
    });
  });
}

// 紧急寻回API
export function getEmergencyAlerts() {
  return request({
    url: '/api/emergency',
    method: 'GET'
  });
}

export function createEmergencyAlert(data) {
  return request({
    url: '/api/emergency',
    method: 'POST',
    data: data
  });
}

export function updateEmergencyAlert(alertId, data) {
  return request({
    url: `/api/emergency/${alertId}`,
    method: 'PUT',
    data: data
  });
}

export function deleteEmergencyAlert(alertId) {
  return request({
    url: `/api/emergency/${alertId}`,
    method: 'DELETE'
  });
}

export function searchNearbyPets(location) {
  return request({
    url: '/api/search/nearby',
    method: 'POST',
    data: {
      latitude: location.latitude,
      longitude: location.longitude,
      radius: 5000 // 5公里范围
    }
  });
}

// 服务相关API
export function getServices() {
  return request({
    url: '/api/services',
    method: 'GET'
  });
}

export function getNearbyServices(location) {
  return request({
    url: '/api/services/nearby',
    method: 'POST',
    data: {
      latitude: location.latitude,
      longitude: location.longitude,
      radius: 10000 // 10公里范围
    }
  });
}

export function getServiceById(serviceId) {
  return request({
    url: `/api/services/${serviceId}`,
    method: 'GET'
  });
}

export function createService(data) {
  return request({
    url: '/api/services',
    method: 'POST',
    data: data
  });
}

export function updateService(serviceId, data) {
  return request({
    url: `/api/services/${serviceId}`,
    method: 'PUT',
    data: data
  });
}

export function deleteService(serviceId) {
  return request({
    url: `/api/services/${serviceId}`,
    method: 'DELETE'
  });
}

// 预约相关API
export function getBookings() {
  return request({
    url: '/api/bookings',
    method: 'GET'
  });
}

export function createBooking(data) {
  return request({
    url: '/api/bookings',
    method: 'POST',
    data: data
  });
}

export function updateBooking(bookingId, data) {
  return request({
    url: `/api/bookings/${bookingId}`,
    method: 'PUT',
    data: data
  });
}

export function cancelBooking(bookingId) {
  return request({
    url: `/api/bookings/${bookingId}/cancel`,
    method: 'POST'
  });
}

// 地理位置API
export function getProvinces() {
  return request({
    url: '/api/locations/provinces',
    method: 'GET'
  });
}

export function getCities(provinceId) {
  return request({
    url: `/api/locations/provinces/${provinceId}/cities`,
    method: 'GET'
  });
}

export function getDistricts(cityId) {
  return request({
    url: `/api/locations/cities/${cityId}/districts`,
    method: 'GET'
  });
}

// 错误处理工具
export function handleApiError(error) {
  console.error('API调用错误:', error);
  
  let errorMessage = '网络错误';
  
  if (error.errMsg) {
    if (error.errMsg.includes('url not in domain list')) {
      errorMessage = '域名未配置，请检查域名白名单';
      // 显示详细的配置提示
      wx.showModal({
        title: '域名配置提示',
        content: '请在微信公众平台配置域名白名单，或在开发者工具中勾选"不校验合法域名"',
        showCancel: false,
        confirmText: '知道了'
      });
    } else if (error.errMsg.includes('timeout')) {
      errorMessage = '请求超时，请检查网络连接';
    } else if (error.errMsg.includes('fail')) {
      errorMessage = '网络连接失败';
    } else if (error.errMsg.includes('404')) {
      errorMessage = '请求的资源不存在';
    } else if (error.errMsg.includes('500')) {
      errorMessage = '服务器内部错误';
    }
  }
  
  // 只在非域名错误时显示Toast
  if (!error.errMsg || !error.errMsg.includes('url not in domain list')) {
    wx.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 2000
    });
  }
  
  return errorMessage;
}

// 带错误处理的API调用
export async function safeApiCall(apiFunction, ...args) {
  try {
    const result = await apiFunction(...args);
    return result;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export default {
  checkHealth,
  getMetrics,
  login,
  register,
  getUserProfile,
  updateUserProfile,
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  uploadPetPhoto,
  getEmergencyAlerts,
  createEmergencyAlert,
  updateEmergencyAlert,
  deleteEmergencyAlert,
  searchNearbyPets,
  getServices,
  getNearbyServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getBookings,
  createBooking,
  updateBooking,
  cancelBooking,
  getProvinces,
  getCities,
  getDistricts,
  handleApiError,
  safeApiCall
};
