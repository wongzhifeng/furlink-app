const mongoose = require('mongoose');

// 紧急警报模型 - 基于道德经"宠辱若惊"理念，紧急时刻需要立即响应
const emergencyAlertSchema = new mongoose.Schema({
  // 警报基本信息
  alertType: {
    type: String,
    enum: ['lost_pet', 'found_pet', 'medical_emergency', 'accident', 'natural_disaster'],
    required: true,
    index: true
  },
  
  // 关联宠物
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true,
    index: true
  },
  
  // 发布者
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 警报内容
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  
  // 位置信息
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      maxlength: 200
    },
    accuracy: {
      type: Number,
      default: 0
    }
  },
  
  // 时间信息
  incidentTime: {
    type: Date,
    required: true
  },
  reportTime: {
    type: Date,
    default: Date.now
  },
  
  // 紧急程度
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  
  // 状态管理
  status: {
    type: String,
    enum: ['active', 'resolved', 'cancelled', 'expired'],
    default: 'active',
    index: true
  },
  
  // 媒体附件
  attachments: [{
    type: {
      type: String,
      enum: ['photo', 'video', 'audio', 'document']
    },
    url: String,
    thumbnail: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 联系信息
  contactInfo: {
    name: String,
    phone: String,
    wechat: String,
    email: String,
    preferredContact: {
      type: String,
      enum: ['phone', 'wechat', 'email'],
      default: 'phone'
    }
  },
  
  // 传播设置
  propagationSettings: {
    // 强制传播 - 紧急情况下无视用户免疫设置
    forcePropagation: {
      type: Boolean,
      default: true
    },
    // 传播半径 (公里)
    propagationRadius: {
      type: Number,
      default: 5,
      min: 1,
      max: 50
    },
    // 传播延迟 (秒) - 紧急情况设为0
    propagationDelay: {
      type: Number,
      default: 0,
      min: 0,
      max: 3600
    },
    // 传播持续时间 (小时)
    propagationDuration: {
      type: Number,
      default: 24,
      min: 1,
      max: 168
    }
  },
  
  // 响应统计
  responses: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    responseType: {
      type: String,
      enum: ['sighting', 'help_offered', 'information', 'resolved']
    },
    message: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  
  // 传播统计
  propagationStats: {
    totalReached: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    totalShares: {
      type: Number,
      default: 0
    },
    totalResponses: {
      type: Number,
      default: 0
    }
  },
  
  // 自动过期
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
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
emergencyAlertSchema.virtual('isActive').get(function() {
  return this.status === 'active' && (!this.expiresAt || this.expiresAt > new Date());
});

emergencyAlertSchema.virtual('timeSinceIncident').get(function() {
  return Date.now() - this.incidentTime.getTime();
});

emergencyAlertSchema.virtual('urgencyScore').get(function() {
  const timeFactor = Math.min(this.timeSinceIncident / (1000 * 60 * 60), 24) / 24; // 24小时内线性增长
  const urgencyMap = { low: 1, medium: 2, high: 3, critical: 4 };
  return urgencyMap[this.urgencyLevel] + timeFactor;
});

// 索引优化
emergencyAlertSchema.index({ status: 1, urgencyLevel: -1, createdAt: -1 });
emergencyAlertSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
emergencyAlertSchema.index({ alertType: 1, status: 1 });
emergencyAlertSchema.index({ reporterId: 1, createdAt: -1 });

// 中间件
emergencyAlertSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // 自动设置过期时间
  if (this.isNew && this.propagationSettings) {
    const duration = this.propagationSettings.propagationDuration || 24;
    this.expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
  }
  
  next();
});

// 静态方法
emergencyAlertSchema.statics.findActive = function() {
  return this.find({ 
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).sort({ urgencyLevel: -1, createdAt: -1 });
};

emergencyAlertSchema.statics.findNearby = function(latitude, longitude, radius = 10) {
  return this.find({
    status: 'active',
    'location.latitude': {
      $gte: latitude - radius / 111,
      $lte: latitude + radius / 111
    },
    'location.longitude': {
      $gte: longitude - radius / (111 * Math.cos(latitude * Math.PI / 180)),
      $lte: longitude + radius / (111 * Math.cos(latitude * Math.PI / 180))
    }
  }).sort({ urgencyLevel: -1, createdAt: -1 });
};

emergencyAlertSchema.statics.findByType = function(alertType) {
  return this.find({ 
    alertType,
    status: 'active'
  }).sort({ urgencyLevel: -1, createdAt: -1 });
};

// 实例方法
emergencyAlertSchema.methods.addResponse = function(response) {
  this.responses.push(response);
  this.propagationStats.totalResponses += 1;
  return this.save();
};

emergencyAlertSchema.methods.markAsResolved = function() {
  this.status = 'resolved';
  this.updatedAt = new Date();
  return this.save();
};

emergencyAlertSchema.methods.updatePropagationStats = function(stats) {
  Object.assign(this.propagationStats, stats);
  return this.save();
};

emergencyAlertSchema.methods.extendExpiration = function(hours) {
  this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return this.save();
};

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
