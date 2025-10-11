// pages/index/index.js
import { checkHealth, getPets, getEmergencyAlerts, getNearbyServices, safeApiCall } from '../../utils/api.js';

Page({
  data: {
    stats: {
      totalPets: 0,
      activeAlerts: 0,
      nearbyServices: 0
    },
    alerts: [],
    backendStatus: 'unknown',
    loading: true
  },

  onLoad: function(options) {
    console.log('首页加载');
    this.loadData();
  },

  onShow: function() {
    console.log('首页显示');
    // 每次显示时刷新数据
    this.loadData();
  },

  // 加载数据
  async loadData() {
    this.setData({ loading: true });
    
    try {
      // 检查后端健康状态
      await this.checkBackendHealth();
      
      // 并行加载数据
      await Promise.all([
        this.loadStats(),
        this.loadAlerts(),
        this.loadNearbyServices()
      ]);
      
    } catch (error) {
      console.error('加载数据失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'error'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 检查后端健康状态
  async checkBackendHealth() {
    try {
      const res = await safeApiCall(checkHealth);
      this.setData({
        backendStatus: res.data.status === 'healthy' ? 'healthy' : 'unhealthy'
      });
      console.log('后端健康状态:', res.data);
    } catch (error) {
      this.setData({ backendStatus: 'error' });
      console.error('后端连接失败:', error);
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      const petsRes = await safeApiCall(getPets);
      const alertsRes = await safeApiCall(getEmergencyAlerts);
      
      const stats = {
        totalPets: petsRes.data?.length || 0,
        activeAlerts: alertsRes.data?.filter(alert => alert.status === 'active').length || 0,
        nearbyServices: 0 // 将在loadNearbyServices中更新
      };
      
      this.setData({ stats });
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 使用模拟数据
      this.setData({
        stats: {
          totalPets: 0,
          activeAlerts: 0,
          nearbyServices: 0
        }
      });
    }
  },

  // 加载紧急寻宠信息
  async loadAlerts() {
    try {
      const res = await safeApiCall(getEmergencyAlerts);
      const alerts = res.data?.slice(0, 5).map(alert => ({
        id: alert.id,
        petName: alert.petName || '未知宠物',
        location: alert.location || '未知位置',
        time: this.formatTime(new Date(alert.createdAt)),
        status: this.getStatusIcon(alert.status)
      })) || [];
      
      this.setData({ alerts });
    } catch (error) {
      console.error('加载紧急寻宠失败:', error);
      this.setData({ alerts: [] });
    }
  },

  // 加载附近服务
  async loadNearbyServices() {
    try {
      const app = getApp();
      const location = app.globalData.location;
      
      if (location && location.latitude && location.longitude) {
        const res = await safeApiCall(getNearbyServices, location);
        const nearbyServicesCount = res.data?.length || 0;
        
        this.setData({
          'stats.nearbyServices': nearbyServicesCount
        });
      }
    } catch (error) {
      console.error('加载附近服务失败:', error);
    }
  },

  // 格式化时间
  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      return `${days}天前`;
    }
  },

  // 获取状态图标
  getStatusIcon(status) {
    const statusMap = {
      active: '🟡 寻找中',
      found: '🟢 已找到',
      closed: '🔴 已关闭'
    };
    return statusMap[status] || '🟡 寻找中';
  },

  // 跳转到紧急寻宠页面
  goToEmergency: function() {
    try {
      wx.switchTab({
        url: '/pages/emergency/emergency'
      });
    } catch (error) {
      console.log('跳转失败:', error);
    }
  },

  // 跳转到宠物管理页面
  goToPets: function() {
    try {
      wx.switchTab({
        url: '/pages/pets/pets'
      });
    } catch (error) {
      console.log('跳转失败:', error);
    }
  },

  // 跳转到服务页面
  goToServices: function() {
    try {
      wx.switchTab({
        url: '/pages/services/services'
      });
    } catch (error) {
      console.log('跳转失败:', error);
    }
  },

  // 刷新数据
  onPullDownRefresh: function() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 查看紧急寻宠详情
  viewAlertDetail: function(e) {
    const alertId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/emergency/detail?id=${alertId}`
    });
  }
});