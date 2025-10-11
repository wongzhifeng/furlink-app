// FurLink 服务管理路由
// 简化版本，专注于基础API功能

import express from 'express';

const router = express.Router();

/**
 * 服务管理API - 宠物紧急寻回平台
 * 提供基础的服务管理功能
 */

// 获取服务列表
router.get('/', async (req, res) => {
  try {
    const { type, location, radius = 10 } = req.query;

    // 模拟服务数据
    const services = [
      {
        _id: 'service_1',
        name: '宠物医院',
        type: 'medical',
        description: '24小时宠物急诊医院',
        location: {
          latitude: 39.9042,
          longitude: 116.4074,
          address: '北京市朝阳区宠物医院'
        },
        contact: {
          phone: '010-12345678',
          wechat: 'pet_hospital_beijing'
        },
        rating: 4.8,
        priceRange: '$$',
        operatingHours: '24/7',
        services: ['急诊', '手术', '疫苗', '体检'],
        status: 'active',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      },
      {
        _id: 'service_2',
        name: '宠物美容店',
        type: 'grooming',
        description: '专业宠物美容服务',
        location: {
          latitude: 39.9042,
          longitude: 116.4074,
          address: '北京市朝阳区美容店'
        },
        contact: {
          phone: '010-87654321',
          wechat: 'pet_grooming_beijing'
        },
        rating: 4.5,
        priceRange: '$',
        operatingHours: '9:00-18:00',
        services: ['洗澡', '剪毛', '修甲', '清洁'],
        status: 'active',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      },
      {
        _id: 'service_3',
        name: '宠物寄养中心',
        type: 'boarding',
        description: '安全舒适的宠物寄养服务',
        location: {
          latitude: 39.9042,
          longitude: 116.4074,
          address: '北京市朝阳区寄养中心'
        },
        contact: {
          phone: '010-11223344',
          wechat: 'pet_boarding_beijing'
        },
        rating: 4.7,
        priceRange: '$$',
        operatingHours: '8:00-20:00',
        services: ['短期寄养', '长期寄养', '遛狗', '喂食'],
        status: 'active',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    ];

    // 根据类型过滤
    let filteredServices = services;
    if (type) {
      filteredServices = services.filter(service => service.type === type);
    }

    res.json({
      success: true,
      data: {
        services: filteredServices,
        total: filteredServices.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取服务列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务列表失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取服务详情
router.get('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: '服务ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    // 模拟服务详情
    const service = {
      _id: serviceId,
      name: '宠物医院',
      type: 'medical',
      description: '24小时宠物急诊医院，提供专业的宠物医疗服务',
      location: {
        latitude: 39.9042,
        longitude: 116.4074,
        address: '北京市朝阳区宠物医院'
      },
      contact: {
        phone: '010-12345678',
        wechat: 'pet_hospital_beijing',
        email: 'info@pet-hospital.com'
      },
      rating: 4.8,
      reviewCount: 156,
      priceRange: '$$',
      operatingHours: '24/7',
      services: ['急诊', '手术', '疫苗', '体检', 'X光', '化验'],
      facilities: ['手术室', 'X光室', '化验室', '住院部'],
      staff: [
        {
          name: '张医生',
          position: '主治医师',
          experience: '10年'
        },
        {
          name: '李护士',
          position: '护士长',
          experience: '8年'
        }
      ],
      reviews: [
        {
          userId: 'user_1',
          rating: 5,
          comment: '医生很专业，服务态度很好',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      ],
      status: 'active',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    };

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

// 获取附近服务
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, type } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '缺少位置信息',
        timestamp: new Date().toISOString()
      });
    }

    // 模拟附近服务
    const nearbyServices = [
      {
        _id: 'service_1',
        name: '宠物医院',
        type: 'medical',
        distance: 0.5,
        rating: 4.8,
        priceRange: '$$'
      },
      {
        _id: 'service_2',
        name: '宠物美容店',
        type: 'grooming',
        distance: 1.2,
        rating: 4.5,
        priceRange: '$'
      }
    ];

    res.json({
      success: true,
      data: {
        services: nearbyServices,
        total: nearbyServices.length,
        searchRadius: parseInt(radius)
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

// 添加服务
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      location,
      contact,
      operatingHours,
      services
    } = req.body;

    // 基础验证
    if (!name || !type || !description || !location) {
      return res.status(400).json({
        success: false,
        message: '服务名称、类型、描述和位置不能为空',
        timestamp: new Date().toISOString()
      });
    }

    // 模拟创建服务
    const service = {
      _id: `service_${Date.now()}`,
      name,
      type,
      description,
      location,
      contact: contact || {},
      operatingHours: operatingHours || '9:00-18:00',
      services: services || [],
      rating: 0,
      reviewCount: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: '服务添加成功',
      data: service,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('添加服务失败:', error);
    res.status(500).json({
      success: false,
      message: '添加服务失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取服务统计
router.get('/stats', async (req, res) => {
  try {
    // 模拟统计数据
    const stats = {
      totalServices: 89,
      activeServices: 85,
      serviceTypes: {
        medical: 25,
        grooming: 20,
        boarding: 15,
        training: 12,
        walking: 17
      },
      avgRating: 4.6,
      totalReviews: 1234,
      topRatedServices: [
        {
          name: '宠物医院',
          rating: 4.8,
          reviewCount: 156
        },
        {
          name: '宠物美容店',
          rating: 4.7,
          reviewCount: 89
        }
      ]
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取服务统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务统计失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;