const mongoose = require('mongoose');

// 用户模型 - 复用FluLink用户系统，适配宠物场景
const userSchema = new mongoose.Schema({
  // 基础信息
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^1[3-9]\d{9}$/.test(v);
      },
      message: '手机号格式不正确'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  nickname: {
    type: String,
    default: '宠物家长',
    maxlength: 20,
    validate: {
      validator: function(v) {
        return !v || (v.length >= 1 && v.length <= 20);
      },
      message: '昵称长度必须在1-20字符之间'
    }
  },
  avatar: {
    type: String,
    default: ''
  },
  
  // 个人资料
  motto: {
    type: String,
    maxlength: 100,
    default: '爱宠如家人'
  },
  poem: {
    type: String,
    maxlength: 200,
    default: '毛茸茸的小生命，温暖了我的世界'
  },
  
  // 标签系统 - 适配宠物场景
  tags: [{
    type: String,
    enum: [
      // 宠物类型
      'dog_lover', 'cat_lover', 'bird_lover', 'rabbit_lover', 'exotic_pet_lover',
      // 服务类型
      'veterinarian', 'groomer', 'trainer', 'pet_sitter', 'rescue_volunteer',
      // 经验水平
      'new_owner', 'experienced_owner', 'breeder', 'foster_parent',
      // 兴趣领域
      'pet_health', 'pet_training', 'pet_grooming', 'pet_nutrition', 'pet_behavior',
      // 紧急响应
      'emergency_responder', 'search_volunteer', 'rescue_team',
      // 社区角色
      'community_leader', 'knowledge_sharer', 'helpful_neighbor'
    ]
  }],
  
  // 位置信息
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    city: String,
    district: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // 宠物相关统计
  petStats: {
    totalPets: {
      type: Number,
      default: 0
    },
    activePets: {
      type: Number,
      default: 0
    },
    emergencyAlerts: {
      type: Number,
      default: 0
    },
    helpProvided: {
      type: Number,
      default: 0
    },
    helpReceived: {
      type: Number,
      default: 0
    }
  },
  
  // 免疫档案 - 适配宠物场景
  immunityProfile: {
    // 紧急警报免疫
    emergencyImmunity: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // 服务推广免疫
    serviceImmunity: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // 社交互动免疫
    socialImmunity: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // 最后更新
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // 偏好设置
  preferences: {
    // 通知设置
    notifications: {
      emergency: {
        type: Boolean,
        default: true
      },
      nearby: {
        type: Boolean,
        default: true
      },
      services: {
        type: Boolean,
        default: false
      },
      social: {
        type: Boolean,
        default: true
      }
    },
    // 隐私设置
    privacy: {
      showLocation: {
        type: Boolean,
        default: false
      },
      showPets: {
        type: Boolean,
        default: true
      },
      allowContact: {
        type: Boolean,
        default: true
      }
    },
    // 语言设置
    language: {
      type: String,
      default: 'zh-CN',
      enum: ['zh-CN', 'en-US']
    }
  },
  
  // 账户状态
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isNewUser: {
    type: Boolean,
    default: true
  },
  
  // 服务限制
  serviceLimits: {
    maxPets: {
      type: Number,
      default: 5
    },
    maxAlerts: {
      type: Number,
      default: 3
    },
    cooldownPeriod: {
      type: Number,
      default: 24,
      comment: '小时'
    }
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段
userSchema.virtual('accountAge').get(function() {
  return Date.now() - this.createdAt.getTime();
});

userSchema.virtual('isExperiencedUser').get(function() {
  return this.petStats.totalPets > 0 || this.petStats.helpProvided > 0;
});

userSchema.virtual('trustScore').get(function() {
  const baseScore = 50;
  const petBonus = Math.min(this.petStats.totalPets * 10, 30);
  const helpBonus = Math.min(this.petStats.helpProvided * 5, 20);
  const ageBonus = Math.min(this.accountAge / (1000 * 60 * 60 * 24 * 30), 20); // 每月1分，最多20分
  return Math.min(baseScore + petBonus + helpBonus + ageBonus, 100);
});

// 索引优化
userSchema.index({ phone: 1 });
userSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
userSchema.index({ tags: 1 });
userSchema.index({ isActive: 1, isVerified: 1 });
userSchema.index({ createdAt: -1 });

// 中间件
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // 自动更新新用户状态
  if (this.isNew && this.accountAge > 7 * 24 * 60 * 60 * 1000) { // 7天
    this.isNewUser = false;
  }
  
  next();
});

// 静态方法
userSchema.statics.findNearby = function(latitude, longitude, radius = 10) {
  return this.find({
    isActive: true,
    'location.latitude': {
      $gte: latitude - radius / 111,
      $lte: latitude + radius / 111
    },
    'location.longitude': {
      $gte: longitude - radius / (111 * Math.cos(latitude * Math.PI / 180)),
      $lte: longitude + radius / (111 * Math.cos(latitude * Math.PI / 180))
    }
  });
};

userSchema.statics.findByTags = function(tags) {
  return this.find({
    isActive: true,
    tags: { $in: tags }
  });
};

// 实例方法
userSchema.methods.updateLocation = function(latitude, longitude, address) {
  this.location = {
    latitude,
    longitude,
    address,
    lastUpdated: new Date()
  };
  return this.save();
};

userSchema.methods.addPet = function() {
  this.petStats.totalPets += 1;
  this.petStats.activePets += 1;
  return this.save();
};

userSchema.methods.removePet = function() {
  this.petStats.activePets = Math.max(0, this.petStats.activePets - 1);
  return this.save();
};

userSchema.methods.recordHelpProvided = function() {
  this.petStats.helpProvided += 1;
  return this.save();
};

userSchema.methods.recordHelpReceived = function() {
  this.petStats.helpReceived += 1;
  return this.save();
};

userSchema.methods.updateImmunity = function(type, value) {
  if (this.immunityProfile[type] !== undefined) {
    this.immunityProfile[type] = Math.max(0, Math.min(100, value));
    this.immunityProfile.lastUpdated = new Date();
  }
  return this.save();
};

// 导出模型
const User = mongoose.model('User', userSchema);

// 导入其他模型
const Pet = require('./Pet');
const EmergencyAlert = require('./EmergencyAlert');
const PetService = require('./PetService');

module.exports = {
  User,
  Pet,
  EmergencyAlert,
  PetService
};
