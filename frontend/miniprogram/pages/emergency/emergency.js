// pages/emergency/emergency.js
Page({
  data: {
    petName: '',
    location: '',
    selectedDate: '',
    phone: '',
    description: '',
    images: []
  },

  onLoad: function(options) {
    console.log('紧急寻宠页面加载');
  },

  onPetNameInput: function(e) {
    this.setData({
      petName: e.detail.value
    });
  },

  onLocationInput: function(e) {
    this.setData({
      location: e.detail.value
    });
  },

  onDateChange: function(e) {
    this.setData({
      selectedDate: e.detail.value
    });
  },

  onPhoneInput: function(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  onDescriptionInput: function(e) {
    this.setData({
      description: e.detail.value
    });
  },

  chooseImage: function() {
    try {
      const that = this;
      wx.chooseImage({
        count: 3,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: function(res) {
          that.setData({
            images: res.tempFilePaths
          });
        },
        fail: function(err) {
          console.log('选择图片失败:', err);
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      });
    } catch (error) {
      console.log('选择图片异常:', error);
    }
  },

  publishAlert: function() {
    try {
      const { petName, location, selectedDate, phone, description, images } = this.data;
      
      // 表单验证
      if (!petName) {
        wx.showToast({
          title: '请输入宠物名称',
          icon: 'none'
        });
        return;
      }
      
      if (!location) {
        wx.showToast({
          title: '请输入走失地点',
          icon: 'none'
        });
        return;
      }
      
      if (!phone) {
        wx.showToast({
          title: '请输入联系电话',
          icon: 'none'
        });
        return;
      }

      // 显示加载中
      wx.showLoading({
        title: '发布中...'
      });

      // 模拟发布紧急警报
      setTimeout(() => {
        wx.hideLoading();
        wx.showToast({
          title: '紧急警报发布成功',
          icon: 'success'
        });
        
        // 返回上一页或首页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }, 2000);
    } catch (error) {
      console.log('发布警报异常:', error);
      wx.hideLoading();
    }
  },

  cancel: function() {
    try {
      wx.navigateBack();
    } catch (error) {
      console.log('取消操作异常:', error);
    }
  }
});