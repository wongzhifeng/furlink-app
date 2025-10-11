const mongoose = require('mongoose');

// 宠物数据模型 - 基于道德经"道法自然"理念设计
const petSchema = new mongoose.Schema({
  // 基础信息
  name: {
    type: String,
    required: true,
    maxlength: 20,
    trim: true
  },
  species: {
    type: String,
    required: true,
    enum: ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'],
    index: true
  },
  breed: {
    type: String,
    maxlength: 50,
    trim: true
  },
  age: {
    type: Number,
    min: 0,
    max: 30
  },
  weight: {
    type: Number,
    min: 0,
    max: 200
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown']
  },
  color: {
    type: String,
    maxlength: 50,
    trim: true
  },
  
  // 身份验证信息
  photos: [{
    url: String,
    type: {
      type: String,
      enum: ['profile', 'side', 'front', 'back', 'detail'],
      default: 'profile'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 健康档案
  healthRecords: [{
    type: {
      type: String,
      enum: ['vaccination', 'checkup', 'surgery', 'medication', 'emergency'],
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      maxlength: 500
    },
    veterinarian: {
      name: String,
      clinic: String,
      contact: String
    },
    documents: [{
      url: String,
      name: String
    }]
  }],
  
  // 紧急联系信息
  emergencyContacts: [{
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      enum: ['owner', 'family', 'friend', 'veterinarian', 'other']
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // 特殊标记和特征
  specialMarks: [{
    type: {
      type: String,
      enum: ['scar', 'tattoo', 'chip', 'collar', 'other']
    },
    location: String,
    description: String,
    photo: String
  }],
  
  // 行为特征
  personality: [{
    type: String,
    enum: ['friendly', 'shy', 'aggressive', 'playful', 'calm', 'energetic', 'protective', 'social']
  }],
  
  // 位置信息
  lastKnownLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  // 状态管理
  status: {
    type: String,
    enum: ['normal', 'lost', 'found', 'emergency', 'medical_attention'],
    default: 'normal',
    index: true
  },
  
  // 主人信息
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 验证状态
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedAt: Date,
  verificationNotes: String,
  
  // 统计信息
  viewCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
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
petSchema.virtual('ageInMonths').get(function() {
  if (!this.age) return null;
  return this.age * 12;
});

petSchema.virtual('isEmergency').get(function() {
  return this.status === 'emergency' || this.status === 'lost';
});

// 索引优化
petSchema.index({ ownerId: 1, createdAt: -1 });
petSchema.index({ species: 1, status: 1 });
petSchema.index({ 'lastKnownLocation.latitude': 1, 'lastKnownLocation.longitude': 1 });
petSchema.index({ verificationStatus: 1, createdAt: -1 });

// 中间件
petSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 静态方法
petSchema.statics.findByOwner = function(ownerId) {
  return this.find({ ownerId }).sort({ createdAt: -1 });
};

petSchema.statics.findEmergency = function() {
  return this.find({ 
    status: { $in: ['emergency', 'lost'] } 
  }).sort({ updatedAt: -1 });
};

petSchema.statics.findNearby = function(latitude, longitude, radius = 10) {
  return this.find({
    'lastKnownLocation.latitude': {
      $gte: latitude - radius / 111,
      $lte: latitude + radius / 111
    },
    'lastKnownLocation.longitude': {
      $gte: longitude - radius / (111 * Math.cos(latitude * Math.PI / 180)),
      $lte: longitude + radius / (111 * Math.cos(latitude * Math.PI / 180))
    }
  });
};

// 实例方法
petSchema.methods.addHealthRecord = function(record) {
  this.healthRecords.push(record);
  return this.save();
};

petSchema.methods.updateLocation = function(latitude, longitude, address) {
  this.lastKnownLocation = {
    latitude,
    longitude,
    address,
    timestamp: new Date()
  };
  return this.save();
};

petSchema.methods.markAsLost = function() {
  this.status = 'lost';
  this.updatedAt = new Date();
  return this.save();
};

petSchema.methods.markAsFound = function() {
  this.status = 'normal';
  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Pet', petSchema);