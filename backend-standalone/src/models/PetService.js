const mongoose = require('mongoose');

// 宠物服务模型 - 基于道德经"上善若水"理念，服务如水般自然流动
const petServiceSchema = new mongoose.Schema({
  // 服务基本信息
  serviceType: {
    type: String,
    enum: ['veterinary', 'grooming', 'boarding', 'training', 'pet_sitting', 'pet_walking', 'emergency_care', 'adoption', 'other'],
    required: true,
    index: true
  },
  
  // 服务提供者
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 服务标题和描述
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
      required: true,
      maxlength: 200
    },
    city: {
      type: String,
      maxlength: 50
    },
    district: {
      type: String,
      maxlength: 50
    }
  },
  
  // 服务范围
  serviceRadius: {
    type: Number,
    default: 5,
    min: 1,
    max: 50,
    comment: '服务覆盖半径(公里)'
  },
  
  // 联系信息
  contactInfo: {
    phone: {
      type: String,
      required: true
    },
    wechat: String,
    email: String,
    website: String,
    businessHours: {
      monday: { open: String, close: String, closed: Boolean },
      tuesday: { open: String, close: String, closed: Boolean },
      wednesday: { open: String, close: String, closed: Boolean },
      thursday: { open: String, close: String, closed: Boolean },
      friday: { open: String, close: String, closed: Boolean },
      saturday: { open: String, close: String, closed: Boolean },
      sunday: { open: String, close: String, closed: Boolean }
    }
  },
  
  // 服务详情
  services: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    price: {
      type: Number,
      min: 0
    },
    duration: {
      type: Number,
      min: 1,
      comment: '服务时长(分钟)'
    },
    isEmergency: {
      type: Boolean,
      default: false
    }
  }],
  
  // 专业资质
  qualifications: [{
    type: {
      type: String,
      enum: ['license', 'certification', 'degree', 'experience', 'award']
    },
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    documentUrl: String
  }],
  
  // 服务特色
  specialties: [{
    type: String,
    enum: ['emergency', 'surgery', 'dental', 'dermatology', 'cardiology', 'oncology', 'behavioral', 'nutrition', 'rehabilitation']
  }],
  
  // 宠物类型支持
  supportedSpecies: [{
    type: String,
    enum: ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other']
  }],
  
  // 设施信息
  facilities: [{
    type: String,
    enum: ['parking', 'waiting_room', 'surgery_room', 'x_ray', 'laboratory', 'pharmacy', 'grooming_station', 'boarding_kennels', 'play_area']
  }],
  
  // 媒体资源
  photos: [{
    url: String,
    type: {
      type: String,
      enum: ['exterior', 'interior', 'equipment', 'staff', 'pets', 'certificate']
    },
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 评价系统
  ratings: {
    overall: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    breakdown: {
      service: { type: Number, default: 0 },
      cleanliness: { type: Number, default: 0 },
      staff: { type: Number, default: 0 },
      value: { type: Number, default: 0 }
    }
  },
  
  // 评价记录
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    serviceUsed: String,
    visitDate: Date,
    photos: [String],
    createdAt: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  
  // 预约系统
  appointments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet'
    },
    serviceName: String,
    scheduledTime: Date,
    duration: Number,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'pending'
    },
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 状态管理
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'pending_verification',
    index: true
  },
  
  // 验证信息
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedAt: Date,
  verificationNotes: String,
  
  // 统计信息
  stats: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalBookings: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    lastBookingDate: Date
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
petServiceSchema.virtual('isOpen').get(function() {
  if (!this.contactInfo.businessHours) return true;
  
  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const todayHours = this.contactInfo.businessHours[dayOfWeek];
  
  if (!todayHours || todayHours.closed) return false;
  
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(todayHours.open.replace(':', ''));
  const closeTime = parseInt(todayHours.close.replace(':', ''));
  
  return currentTime >= openTime && currentTime <= closeTime;
});

petServiceSchema.virtual('averageRating').get(function() {
  return this.ratings.count > 0 ? this.ratings.overall / this.ratings.count : 0;
});

petServiceSchema.virtual('hasEmergencyService').get(function() {
  return this.services.some(service => service.isEmergency) || 
         this.specialties.includes('emergency');
});

// 索引优化
petServiceSchema.index({ serviceType: 1, status: 1 });
petServiceSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
petServiceSchema.index({ providerId: 1, createdAt: -1 });
petServiceSchema.index({ verificationStatus: 1, status: 1 });
petServiceSchema.index({ 'ratings.overall': -1, 'ratings.count': -1 });

// 地理索引
petServiceSchema.index({ 
  'location.latitude': 1, 
  'location.longitude': 1 
}, { 
  name: 'location_2dsphere' 
});

// 中间件
petServiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 静态方法
petServiceSchema.statics.findNearby = function(latitude, longitude, radius = 10, serviceType = null) {
  const query = {
    status: 'active',
    verificationStatus: 'verified',
    'location.latitude': {
      $gte: latitude - radius / 111,
      $lte: latitude + radius / 111
    },
    'location.longitude': {
      $gte: longitude - radius / (111 * Math.cos(latitude * Math.PI / 180)),
      $lte: longitude + radius / (111 * Math.cos(latitude * Math.PI / 180))
    }
  };
  
  if (serviceType) {
    query.serviceType = serviceType;
  }
  
  return this.find(query).sort({ 'ratings.overall': -1, 'ratings.count': -1 });
};

petServiceSchema.statics.findEmergency = function(latitude, longitude, radius = 20) {
  return this.find({
    status: 'active',
    verificationStatus: 'verified',
    $or: [
      { 'services.isEmergency': true },
      { specialties: 'emergency' }
    ],
    'location.latitude': {
      $gte: latitude - radius / 111,
      $lte: latitude + radius / 111
    },
    'location.longitude': {
      $gte: longitude - radius / (111 * Math.cos(latitude * Math.PI / 180)),
      $lte: longitude + radius / (111 * Math.cos(latitude * Math.PI / 180))
    }
  }).sort({ 'ratings.overall': -1 });
};

petServiceSchema.statics.findByProvider = function(providerId) {
  return this.find({ providerId }).sort({ createdAt: -1 });
};

petServiceSchema.statics.findTopRated = function(limit = 10) {
  return this.find({
    status: 'active',
    verificationStatus: 'verified',
    'ratings.count': { $gte: 5 }
  }).sort({ 'ratings.overall': -1, 'ratings.count': -1 }).limit(limit);
};

// 实例方法
petServiceSchema.methods.addReview = function(review) {
  this.reviews.push(review);
  
  // 更新评分统计
  const totalRating = this.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.ratings.overall = totalRating;
  this.ratings.count = this.reviews.length;
  
  return this.save();
};

petServiceSchema.methods.bookAppointment = function(appointment) {
  this.appointments.push(appointment);
  this.stats.totalBookings += 1;
  this.stats.lastBookingDate = new Date();
  return this.save();
};

petServiceSchema.methods.updateLocation = function(latitude, longitude, address) {
  this.location = {
    ...this.location.toObject(),
    latitude,
    longitude,
    address
  };
  return this.save();
};

petServiceSchema.methods.verify = function(notes = '') {
  this.verificationStatus = 'verified';
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  this.status = 'active';
  return this.save();
};

module.exports = mongoose.model('PetService', petServiceSchema);
