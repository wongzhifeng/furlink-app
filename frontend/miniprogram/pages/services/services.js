// pages/services/services.js
Page({
  data: {
    services: [],
    currentFilter: 'all'
  },

  onLoad: function(options) {
    console.log('服务页面加载');
    this.loadServices();
  },

  loadServices: function() {
    try {
      // 模拟加载服务数据
      const mockServices = [
        {
          id: 1,
          name: '爱心宠物医院',
          type: 'veterinary',
          address: '西湖区文三路123号',
          distance: 0.5,
          rating: 4.8,
          reviewCount: 128
        },
        {
          id: 2,
          name: '美丽宠物美容',
          type: 'grooming',
          address: '西湖区文三路456号',
          distance: 0.8,
          rating: 4.6,
          reviewCount: 89
        },
        {
          id: 3,
          name: '温馨宠物寄养',
          type: 'boarding',
          address: '西湖区文三路789号',
          distance: 1.2,
          rating: 4.7,
          reviewCount: 156
        }
      ];
      
      this.setData({
        services: mockServices
      });
    } catch (error) {
      console.log('加载服务数据失败:', error);
    }
  },

  filterServices: function(e) {
    try {
      const type = e.currentTarget.dataset.type;
      this.setData({
        currentFilter: type
      });
      
      console.log('过滤服务类型:', type);
    } catch (error) {
      console.log('过滤服务异常:', error);
    }
  },

  getServiceIcon: function(type) {
    const icons = {
      'veterinary': '🏥',
      'grooming': '✂️',
      'boarding': '🏠',
      'training': '🎓'
    };
    return icons[type] || '🏥';
  },

  viewServiceDetail: function(e) {
    try {
      const serviceId = e.currentTarget.dataset.id;
      wx.showToast({
        title: '服务详情功能开发中',
        icon: 'none'
      });
    } catch (error) {
      console.log('查看服务详情异常:', error);
    }
  }
});