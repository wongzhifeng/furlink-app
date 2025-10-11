// app.js - FurLink 小程序主入口
// 极简版本，避免所有文件系统操作

App({
  globalData: {
    userInfo: null,
    token: null,
    location: {
      latitude: 39.9042,
      longitude: 116.4074
    }
  },

  onLaunch() {
    console.log('🐾 FurLink 小程序启动');
    
    // 最小化启动操作，避免文件系统错误
    this.initApp();
  },

  onShow() {
    console.log('FurLink 小程序显示');
  },

  onHide() {
    console.log('FurLink 小程序隐藏');
  },

  onError(error) {
    console.error('FurLink 小程序错误:', error);
  },

  // 初始化应用
  initApp() {
    try {
      // 只做最基本的初始化
      console.log('应用初始化完成');
    } catch (error) {
      console.log('应用初始化异常:', error);
    }
  },

  // 检查登录状态（简化版）
  checkLoginStatus() {
    try {
      const token = wx.getStorageSync('token');
      if (token) {
        this.globalData.token = token;
        console.log('用户已登录');
      } else {
        console.log('用户未登录');
      }
    } catch (error) {
      console.log('检查登录状态失败:', error);
    }
  },

  // 请求位置权限（简化版）
  requestLocationPermission() {
    return new Promise((resolve) => {
      try {
        wx.getSetting({
          success: (res) => {
            if (res.authSetting['scope.userLocation']) {
              wx.getLocation({
                type: 'gcj02',
                success: (locationRes) => {
                  this.globalData.location = {
                    latitude: locationRes.latitude,
                    longitude: locationRes.longitude
                  };
                  resolve(true);
                },
                fail: () => {
                  resolve(false);
                }
              });
            } else {
              resolve(false);
            }
          },
          fail: () => {
            resolve(false);
          }
        });
      } catch (error) {
        console.log('请求位置权限异常:', error);
        resolve(false);
      }
    });
  },

  // 显示加载提示
  showLoading(title = '加载中...') {
    try {
      wx.showLoading({
        title,
        mask: true
      });
    } catch (error) {
      console.log('显示加载提示失败:', error);
    }
  },

  // 隐藏加载提示
  hideLoading() {
    try {
      wx.hideLoading();
    } catch (error) {
      console.log('隐藏加载提示失败:', error);
    }
  },

  // 显示成功提示
  showSuccess(title) {
    try {
      wx.showToast({
        title,
        icon: 'success',
        duration: 2000
      });
    } catch (error) {
      console.log('显示成功提示失败:', error);
    }
  },

  // 显示错误提示
  showError(title) {
    try {
      wx.showToast({
        title,
        icon: 'none',
        duration: 2000
      });
    } catch (error) {
      console.log('显示错误提示失败:', error);
    }
  },

  // 格式化时间
  formatTime(date) {
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    } catch (error) {
      return '时间格式错误';
    }
  },

  // 计算距离
  calculateDistance(lat1, lon1, lat2, lon2) {
    try {
      const R = 6371; // 地球半径(公里)
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    } catch (error) {
      return 0;
    }
  },

  // 格式化距离
  formatDistance(distance) {
    try {
      if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
      } else {
        return `${distance.toFixed(1)}km`;
      }
    } catch (error) {
      return '0m';
    }
  },

  // 获取宠物种类图标
  getPetSpeciesIcon(species) {
    const iconMap = {
      dog: '🐕',
      cat: '🐱',
      bird: '🐦',
      rabbit: '🐰',
      hamster: '🐹',
      fish: '🐠',
      reptile: '🦎',
      other: '🐾'
    };
    return iconMap[species] || '🐾';
  },

  // 获取服务类型图标
  getServiceTypeIcon(serviceType) {
    const iconMap = {
      veterinary: '🏥',
      grooming: '✂️',
      boarding: '🏠',
      training: '🎓',
      pet_sitting: '👥',
      pet_walking: '🚶',
      emergency_care: '🚨',
      adoption: '❤️',
      other: '🔧'
    };
    return iconMap[serviceType] || '🔧';
  }
});