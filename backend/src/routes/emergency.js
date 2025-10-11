// FurLink 紧急警报路由
// 简化版本，专注于基础API功能

import express from 'express';

const router = express.Router();

/**
 * 紧急警报API - 宠物紧急寻回平台
 * 提供基础的紧急警报功能
 */

// 创建紧急警报
router.post('/alert', async (req, res) => {
  try {
    const {
      petId,
      alertType,
      title,
      description,
      location,
      urgencyLevel = 'high',
      contactInfo
    } = req.body;

    // 基础验证
    if (!petId || !alertType || !title || !description || !location) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的警报信息',
        timestamp: new Date().toISOString()
      });
    }

    // 模拟创建警报
    const alert = {
      _id: `alert_${Date.now()}`,
      petId,
      alertType,
      title,
      description,
      location,
      urgencyLevel,
      contactInfo,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
      status: 'active'
    };

    res.status(201).json({
      success: true,
      message: '紧急警报已创建',
      data: {
        alertId: alert._id,
        title: alert.title,
        urgencyLevel: alert.urgencyLevel,
        expiresAt: alert.expiresAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('创建紧急警报失败:', error);
    res.status(500).json({
      success: false,
      message: '创建紧急警报失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取附近活跃警报
router.get('/alerts/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '缺少位置信息',
        timestamp: new Date().toISOString()
      });
    }

    // 模拟附近警报数据
    const mockAlerts = [
      {
        _id: 'alert_1',
        petId: 'pet_1',
        alertType: 'lost_pet',
        title: '寻找走失金毛',
        description: '3岁金毛，戴红色项圈',
        location: {
          latitude: parseFloat(latitude) + 0.001,
          longitude: parseFloat(longitude) + 0.001
        },
        urgencyLevel: 'high',
        distance: 0.1,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2小时前
      },
      {
        _id: 'alert_2',
        petId: 'pet_2',
        alertType: 'found_pet',
        title: '发现走失猫咪',
        description: '橘色猫咪，很亲人',
        location: {
          latitude: parseFloat(latitude) - 0.002,
          longitude: parseFloat(longitude) + 0.001
        },
        urgencyLevel: 'medium',
        distance: 0.2,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1小时前
      }
    ];

    res.json({
      success: true,
      data: {
        alerts: mockAlerts,
        total: mockAlerts.length,
        searchRadius: parseInt(radius)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取附近警报失败:', error);
    res.status(500).json({
      success: false,
      message: '获取附近警报失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 响应警报
router.post('/alert/:alertId/response', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { type, message, location } = req.body;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: '警报ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: '响应类型和消息不能为空',
        timestamp: new Date().toISOString()
      });
    }

    // 模拟处理响应
    const response = {
      _id: `response_${Date.now()}`,
      alertId,
      type,
      message,
      location,
      timestamp: new Date()
    };

    res.json({
      success: true,
      message: '响应已提交',
      data: {
        responseId: response._id,
        type: response.type,
        timestamp: response.timestamp
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('处理警报响应失败:', error);
    res.status(500).json({
      success: false,
      message: '处理警报响应失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取警报详情
router.get('/alert/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: '警报ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    // 模拟警报详情
    const alert = {
      _id: alertId,
      petId: 'pet_1',
      alertType: 'lost_pet',
      title: '寻找走失金毛',
      description: '3岁金毛，戴红色项圈，性格温顺',
      location: {
        latitude: 39.9042,
        longitude: 116.4074,
        address: '北京市朝阳区'
      },
      urgencyLevel: 'high',
      contactInfo: {
        phone: '138****1234',
        wechat: 'pet_owner_123'
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
      status: 'active',
      responses: []
    };

    res.json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取警报详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取警报详情失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取警报统计
router.get('/stats', async (req, res) => {
  try {
    // 模拟统计数据
    const stats = {
      totalAlerts: 156,
      activeAlerts: 23,
      resolvedAlerts: 133,
      alertTypes: {
        lost_pet: 89,
        found_pet: 45,
        medical_emergency: 12,
        accident: 8,
        natural_disaster: 2
      },
      urgencyLevels: {
        critical: 5,
        high: 18,
        medium: 45,
        low: 88
      },
      avgResponseTime: 15.5, // 分钟
      successRate: 85.3 // 百分比
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取警报统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取警报统计失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;