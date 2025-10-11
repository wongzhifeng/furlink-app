// pages/pets/pets.js
Page({
  data: {
    pets: []
  },

  onLoad: function(options) {
    console.log('宠物页面加载');
    this.loadPets();
  },

  onShow: function() {
    console.log('宠物页面显示');
    this.loadPets();
  },

  loadPets: function() {
    try {
      // 模拟加载宠物数据
      const mockPets = [
        {
          id: 1,
          name: '小白',
          breed: '金毛',
          age: 3,
          avatar: '🐕',
          status: 'normal',
          statusText: '正常'
        },
        {
          id: 2,
          name: '咪咪',
          breed: '英短',
          age: 2,
          avatar: '🐱',
          status: 'normal',
          statusText: '正常'
        }
      ];
      
      this.setData({
        pets: mockPets
      });
    } catch (error) {
      console.log('加载宠物数据失败:', error);
    }
  },

  addPet: function() {
    try {
      wx.showToast({
        title: '添加宠物功能开发中',
        icon: 'none'
      });
    } catch (error) {
      console.log('添加宠物异常:', error);
    }
  },

  viewPetDetail: function(e) {
    try {
      const petId = e.currentTarget.dataset.id;
      wx.showToast({
        title: '查看详情功能开发中',
        icon: 'none'
      });
    } catch (error) {
      console.log('查看详情异常:', error);
    }
  }
});