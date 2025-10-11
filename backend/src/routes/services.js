const express = require('express');
const router = express.Router();
const { PetService, User } = require('../models');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/services/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

/**
 * 宠物服务路由 - 基于道德经"上善若水"理念
 * 提供宠物服务的完整生命周期管理
 */

// 发布宠物服务 - 优化160: 增强输入验证和错误处理
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    const {
      serviceType,
      title,
      description,
      location,
      serviceRadius = 5,
      contactInfo,
      services = [],
      qualifications = [],
      specialties = [],
      supportedSpecies = [],
      facilities = []
    } = req.body;

    // 输入验证
    if (!serviceType || !title || !description || !location || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的服务信息',
        timestamp: new Date().toISOString()
      });
    }

    const validServiceTypes = ['veterinary', 'grooming', 'boarding', 'training', 'pet_sitting', 'pet_walking', 'emergency_care', 'adoption', 'other'];
    if (!validServiceTypes.includes(serviceType)) {
      return res.status(400).json({
        success: false,
        message: '无效的服务类型',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof title !== 'string' || title.trim().length === 0 || title.length > 100) {
      return res.status(400).json({
        success: false,
        message: '服务标题长度必须在1-100字符之间',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof description !== 'string' || description.trim().length === 0 || description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: '服务描述长度必须在1-1000字符之间',
        timestamp: new Date().toISOString()
      });
    }

    if (!location.latitude || !location.longitude || !location.address) {
      return res.status(400).json({
        success: false,
        message: '位置信息不完整',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof serviceRadius !== 'number' || serviceRadius < 1 || serviceRadius > 50) {
      return res.status(400).json({
        success: false,
        message: '服务半径必须在1-50公里之间',
        timestamp: new Date().toISOString()
      });
    }

    if (!contactInfo.phone) {
      return res.status(400).json({
        success: false,
        message: '联系电话不能为空',
        timestamp: new Date().toISOString()
      });
    }

    // 验证服务项目
    if (services.length > 0) {
      for (const service of services) {
        if (!service.name || typeof service.name !== 'string') {
          return res.status(400).json({
            success: false,
            message: '服务项目名称不能为空',
            timestamp: new Date().toISOString()
          });
        }
        if (service.price !== undefined && (typeof service.price !== 'number' || service.price < 0)) {
          return res.status(400).json({
            success: false,
            message: '服务价格必须为非负数',
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // 创建服务
    const petService = new PetService({
      serviceType,
      providerId: userId,
      title: title.trim(),
      description: description.trim(),
      location,
      serviceRadius,
      contactInfo,
      services,
      qualifications,
      specialties,
      supportedSpecies,
      facilities,
      status: 'pending_verification'
    });

    await petService.save();

    res.status(201).json({
      success: true,
      message: '宠物服务发布成功，等待审核',
      data: {
        serviceId: petService._id,
        title: petService.title,
        serviceType: petService.serviceType,
        status: petService.status
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('发布宠物服务失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '发布宠物服务失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取附近服务 - 优化161: 增强输入验证和错误处理
router.get('/nearby', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    const { latitude, longitude, radius = 10, serviceType } = req.query;

    // 输入验证
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '缺少位置信息',
        timestamp: new Date().toISOString()
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseInt(radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
      return res.status(400).json({
        success: false,
        message: '位置参数格式错误',
        timestamp: new Date().toISOString()
      });
    }

    if (rad < 1 || rad > 50) {
      return res.status(400).json({
        success: false,
        message: '搜索半径必须在1-50公里之间',
        timestamp: new Date().toISOString()
      });
    }

    if (serviceType) {
      const validServiceTypes = ['veterinary', 'grooming', 'boarding', 'training', 'pet_sitting', 'pet_walking', 'emergency_care', 'adoption', 'other'];
      if (!validServiceTypes.includes(serviceType)) {
        return res.status(400).json({
          success: false,
          message: '无效的服务类型参数',
          timestamp: new Date().toISOString()
        });
      }
    }

    // 获取附近服务
    const services = await PetService.findNearby(lat, lng, rad, serviceType);

    // 计算距离并排序
    const servicesWithDistance = services.map(service => {
      const distance = calculateDistance(
        lat, lng,
        service.location.latitude, service.location.longitude
      );
      return {
        ...service.toObject(),
        distance: Math.round(distance * 100) / 100, // 保留两位小数
        isOpen: service.isOpen
      };
    }).sort((a, b) => {
      // 按评分和距离排序
      const ratingDiff = b.ratings.overall - a.ratings.overall;
      if (Math.abs(ratingDiff) > 0.5) return ratingDiff;
      return a.distance - b.distance;
    });

    res.json({
      success: true,
      data: {
        services: servicesWithDistance,
        total: servicesWithDistance.length,
        searchRadius: rad,
        serviceType: serviceType || 'all'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取附近服务失败:', error);
    res.status(500).json({
      success: false,
      message: '获取附近服务失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取紧急服务 - 优化162: 增强输入验证和错误处理
router.get('/emergency', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    const { latitude, longitude, radius = 20 } = req.query;

    // 输入验证
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '缺少位置信息',
        timestamp: new Date().toISOString()
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseInt(radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
      return res.status(400).json({
        success: false,
        message: '位置参数格式错误',
        timestamp: new Date().toISOString()
      });
    }

    if (rad < 1 || rad > 50) {
      return res.status(400).json({
        success: false,
        message: '搜索半径必须在1-50公里之间',
        timestamp: new Date().toISOString()
      });
    }

    // 获取紧急服务
    const emergencyServices = await PetService.findEmergency(lat, lng, rad);

    // 计算距离并排序
    const servicesWithDistance = emergencyServices.map(service => {
      const distance = calculateDistance(
        lat, lng,
        service.location.latitude, service.location.longitude
      );
      return {
        ...service.toObject(),
        distance: Math.round(distance * 100) / 100,
        isOpen: service.isOpen,
        emergencyServices: service.services.filter(s => s.isEmergency)
      };
    }).sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: {
        services: servicesWithDistance,
        total: servicesWithDistance.length,
        searchRadius: rad
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取紧急服务失败:', error);
    res.status(500).json({
      success: false,
      message: '获取紧急服务失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取服务详情 - 优化163: 增强输入验证和错误处理
router.get('/:serviceId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { serviceId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: '服务ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    const service = await PetService.findById(serviceId)
      .populate('providerId', 'nickname avatar phone');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务不存在',
        timestamp: new Date().toISOString()
      });
    }

    // 增加查看统计
    service.stats.totalViews += 1;
    await service.save();

    res.json({
      success: true,
      data: service,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取服务详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务详情失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 预约服务 - 优化164: 增强输入验证和错误处理
router.post('/:serviceId/appointment', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { serviceId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: '服务ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    const { petId, serviceName, scheduledTime, duration, notes } = req.body;

    // 输入验证
    if (!petId || !serviceName || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的预约信息',
        timestamp: new Date().toISOString()
      });
    }

    const scheduledDate = new Date(scheduledTime);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: '预约时间必须是将来的时间',
        timestamp: new Date().toISOString()
      });
    }

    if (duration && (typeof duration !== 'number' || duration < 1 || duration > 480)) {
      return res.status(400).json({
        success: false,
        message: '服务时长必须在1-480分钟之间',
        timestamp: new Date().toISOString()
      });
    }

    const service = await PetService.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务不存在',
        timestamp: new Date().toISOString()
      });
    }

    if (service.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '服务当前不可用',
        timestamp: new Date().toISOString()
      });
    }

    // 检查预约时间冲突
    const conflictingAppointment = service.appointments.find(apt => {
      const aptTime = new Date(apt.scheduledTime);
      const timeDiff = Math.abs(aptTime.getTime() - scheduledDate.getTime());
      return timeDiff < (duration || 60) * 60 * 1000; // 默认1小时
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: '该时间段已有预约',
        timestamp: new Date().toISOString()
      });
    }

    // 创建预约
    const appointment = {
      userId,
      petId,
      serviceName,
      scheduledTime: scheduledDate,
      duration: duration || 60,
      status: 'pending',
      notes: notes || ''
    };

    await service.bookAppointment(appointment);

    res.json({
      success: true,
      message: '预约成功',
      data: {
        serviceId: service._id,
        appointmentId: appointment._id,
        scheduledTime: appointment.scheduledTime,
        status: appointment.status
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('预约服务失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '预约服务失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 添加服务评价 - 优化165: 增强输入验证和错误处理
router.post('/:serviceId/review', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { serviceId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: '服务ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    const { rating, comment, serviceUsed, visitDate, photos = [] } = req.body;

    // 输入验证
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间',
        timestamp: new Date().toISOString()
      });
    }

    if (comment && (typeof comment !== 'string' || comment.length > 500)) {
      return res.status(400).json({
        success: false,
        message: '评价内容不能超过500字符',
        timestamp: new Date().toISOString()
      });
    }

    if (visitDate) {
      const visit = new Date(visitDate);
      if (isNaN(visit.getTime()) || visit > new Date()) {
        return res.status(400).json({
          success: false,
          message: '访问日期不能是未来时间',
          timestamp: new Date().toISOString()
        });
      }
    }

    const service = await PetService.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务不存在',
        timestamp: new Date().toISOString()
      });
    }

    // 检查是否已经评价过
    const existingReview = service.reviews.find(review => 
      review.userId.toString() === userId
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: '您已经评价过此服务',
        timestamp: new Date().toISOString()
      });
    }

    // 添加评价
    const review = {
      userId,
      rating,
      comment: comment || '',
      serviceUsed: serviceUsed || '',
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      photos,
      isVerified: false
    };

    await service.addReview(review);

    res.json({
      success: true,
      message: '评价提交成功',
      data: {
        serviceId: service._id,
        reviewId: review._id,
        rating: review.rating,
        timestamp: review.createdAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('添加服务评价失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '添加服务评价失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 上传服务照片 - 优化166: 增强输入验证和错误处理
router.post('/:serviceId/photos', authMiddleware, upload.array('photos', 5), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { serviceId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: '服务ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的照片',
        timestamp: new Date().toISOString()
      });
    }

    const service = await PetService.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务不存在',
        timestamp: new Date().toISOString()
      });
    }

    // 检查权限
    if (service.providerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权限为此服务上传照片',
        timestamp: new Date().toISOString()
      });
    }

    // 检查照片数量限制
    if (service.photos.length + req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: '服务照片总数不能超过10张',
        timestamp: new Date().toISOString()
      });
    }

    // 添加照片到服务
    const photoTypes = ['exterior', 'interior', 'equipment', 'staff', 'pets', 'certificate'];
    req.files.forEach((file, index) => {
      service.photos.push({
        url: `/uploads/services/${file.filename}`,
        type: photoTypes[index % photoTypes.length],
        description: '',
        uploadedAt: new Date()
      });
    });

    await service.save();

    res.json({
      success: true,
      message: `成功上传 ${req.files.length} 张照片`,
      data: {
        serviceId: service._id,
        photosCount: service.photos.length,
        uploadedPhotos: req.files.map(file => ({
          filename: file.filename,
          url: `/uploads/services/${file.filename}`
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('上传服务照片失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '上传服务照片失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 计算两点间距离的辅助函数
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径(公里)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;
