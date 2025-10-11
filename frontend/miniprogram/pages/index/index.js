// pages/index/index.js
Page({
  data: {
    stats: {
      totalPets: 0,
      activeAlerts: 0,
      nearbyServices: 0
    },
    alerts: []
  },

  onLoad: function(options) {
    console.log('首页加载');
    this.loadData();
  },

  onShow: function() {
    console.log('首页显示');
  },

  loadData: function() {
    try {
      // 模拟加载数据
      const mockStats = {
        totalPets: 2,
        activeAlerts: 1,
        nearbyServices: 5
      };
      
      const mockAlerts = [
        {
          id: 1,
          petName: '小白',
          location: '西湖区文三路',
          time: '2小时前',
          status: '🟡 寻找中'
        }
      ];
      
      this.setData({
        stats: mockStats,
        alerts: mockAlerts
      });
    } catch (error) {
      console.log('加载数据失败:', error);
    }
  },

  goToEmergency: function() {
    try {
      wx.switchTab({
        url: '/pages/emergency/emergency'
      });
    } catch (error) {
      console.log('跳转失败:', error);
    }
  },

  goToPets: function() {
    try {
      wx.switchTab({
        url: '/pages/pets/pets'
      });
    } catch (error) {
      console.log('跳转失败:', error);
    }
  },

  goToServices: function() {
    try {
      wx.switchTab({
        url: '/pages/services/services'
      });
    } catch (error) {
      console.log('跳转失败:', error);
    }
  }
});