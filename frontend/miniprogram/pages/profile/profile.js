// pages/profile/profile.js
Page({
  data: {
    stats: {
      totalPets: 2,
      helpProvided: 5,
      trustScore: 75
    }
  },

  onLoad: function(options) {
    console.log('个人中心页面加载');
    this.loadUserData();
  },

  loadUserData: function() {
    try {
      console.log('加载用户数据');
    } catch (error) {
      console.log('加载用户数据失败:', error);
    }
  },

  editProfile: function() {
    try {
      wx.showToast({
        title: '编辑资料功能开发中',
        icon: 'none'
      });
    } catch (error) {
      console.log('编辑资料异常:', error);
    }
  },

  myPets: function() {
    try {
      wx.switchTab({
        url: '/pages/pets/pets'
      });
    } catch (error) {
      console.log('跳转异常:', error);
    }
  },

  myAlerts: function() {
    try {
      wx.showToast({
        title: '我的警报功能开发中',
        icon: 'none'
      });
    } catch (error) {
      console.log('我的警报异常:', error);
    }
  },

  settings: function() {
    try {
      wx.showToast({
        title: '设置功能开发中',
        icon: 'none'
      });
    } catch (error) {
      console.log('设置异常:', error);
    }
  },

  about: function() {
    try {
      wx.showModal({
        title: '关于 FurLink',
        content: 'FurLink - 毛茸茸链接\n宠物紧急寻回平台\n版本: 1.0.0',
        showCancel: false
      });
    } catch (error) {
      console.log('关于异常:', error);
    }
  }
});