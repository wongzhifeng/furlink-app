const express = require('express');
const router = express.Router();
const EmergencyProtocol = require('../services/emergencyProtocol');
const { EmergencyAlert, Pet, User } = require('../models');
const authMiddleware = require('../middleware/auth');

const emergencyProtocol = new EmergencyProtocol();

/**
 * 紧急警报路由 - 基于道德经"宠辱若惊"理念
 * 紧急情况下需要立即响应，提供快速、高效的API接口
 */

// 创建紧急警报 - 优化145: 增强输入验证和错误处理
router.post('/alert', authMiddleware, async (req, res) => {
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
      petId,
      alertType,
      title,
      description,
      location,
      urgencyLevel = 'high',
      contactInfo,
      attachments = []
    } = req.body;

    // 输入验证
    if (!petId || !alertType || !title || !description || !location) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的警报信息',
        timestamp: new Date().toISOString()
      });
    }

    if (!location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: '位置信息不完整',
        timestamp: new Date().toISOString()
      });
    }

    const validAlertTypes = ['lost_pet', 'found_pet', 'medical_emergency', 'accident', 'natural_disaster'];
    if (!validAlertTypes.includes(alertType)) {
      return res.status(400).json({
        success: false,
        message: '无效的警报类型',
        timestamp: new Date().toISOString()
      });
    }

    const validUrgencyLevels = ['low', 'medium', 'high', 'critical'];
    if (!validUrgencyLevels.includes(urgencyLevel)) {
      return res.status(400).json({
        success: false,
        message: '无效的紧急程度',
        timestamp: new Date().toISOString()
      });
    }

    // 创建警报
    const alert = await emergencyProtocol.createEmergencyAlert({
      petId,
      reporterId: userId,
      alertType,
      title,
      description,
      location,
      urgencyLevel,
      contactInfo,
      attachments
    });

    res.status(201).json({
      success: true,
      message: '紧急警报已创建并开始传播',
      data: {
        alertId: alert._id,
        title: alert.title,
        urgencyLevel: alert.urgencyLevel,
        propagationRadius: alert.propagationSettings.propagationRadius,
        expiresAt: alert.expiresAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('创建紧急警报失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建紧急警报失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取附近活跃警报 - 优化146: 增强输入验证和错误处理
router.get('/alerts/nearby', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    const { latitude, longitude, radius = 10, alertType } = req.query;

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

    // 获取附近警报
    let alerts;
    if (alertType) {
      alerts = await EmergencyAlert.findByType(alertType);
    } else {
      alerts = await emergencyProtocol.getActiveAlerts(lat, lng, rad);
    }

    // 计算距离并排序
    const alertsWithDistance = alerts.map(alert => {
      const distance = calculateDistance(
        lat, lng,
        alert.location.latitude, alert.location.longitude
      );
      return {
        ...alert.toObject(),
        distance: Math.round(distance * 100) / 100 // 保留两位小数
      };
    }).sort((a, b) => {
      // 按紧急程度和距离排序
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
      if (urgencyDiff !== 0) return urgencyDiff;
      return a.distance - b.distance;
    });

    res.json({
      success: true,
      data: {
        alerts: alertsWithDistance,
        total: alertsWithDistance.length,
        searchRadius: rad
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

// 响应警报 - 优化147: 增强输入验证和错误处理
router.post('/alert/:alertId/response', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { alertId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: '警报ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    const { type, message, location } = req.body;

    // 输入验证
    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: '响应类型和消息不能为空',
        timestamp: new Date().toISOString()
      });
    }

    const validResponseTypes = ['sighting', 'help_offered', 'information', 'resolved'];
    if (!validResponseTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的响应类型',
        timestamp: new Date().toISOString()
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        message: '响应消息不能超过500字符',
        timestamp: new Date().toISOString()
      });
    }

    // 处理响应
    const response = await emergencyProtocol.handleAlertResponse(alertId, userId, {
      type,
      message,
      location
    });

    res.json({
      success: true,
      message: '响应已提交',
      data: {
        responseId: response._id,
        type: response.responseType,
        timestamp: response.timestamp
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('处理警报响应失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '处理警报响应失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 取消警报 - 优化148: 增强输入验证和错误处理
router.delete('/alert/:alertId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { alertId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: '警报ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    await emergencyProtocol.cancelAlert(alertId, userId);

    res.json({
      success: true,
      message: '警报已取消',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('取消警报失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '取消警报失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 延长警报 - 优化149: 增强输入验证和错误处理
router.post('/alert/:alertId/extend', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { alertId } = req.params;
    const { hours } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: '警报ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    if (!hours || typeof hours !== 'number' || hours < 1 || hours > 168) {
      return res.status(400).json({
        success: false,
        message: '延长小时数必须在1-168之间',
        timestamp: new Date().toISOString()
      });
    }

    await emergencyProtocol.extendAlert(alertId, userId, hours);

    res.json({
      success: true,
      message: `警报已延长 ${hours} 小时`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('延长警报失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '延长警报失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取警报详情 - 优化150: 增强输入验证和错误处理
router.get('/alert/:alertId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { alertId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: '警报ID不能为空',
        timestamp: new Date().toISOString()
      });
    }

    const alert = await EmergencyAlert.findById(alertId)
      .populate('petId', 'name species breed age color photos')
      .populate('reporterId', 'nickname avatar phone');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: '警报不存在',
        timestamp: new Date().toISOString()
      });
    }

    // 增加查看统计
    alert.propagationStats.totalViews += 1;
    await alert.save();

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

// 获取警报统计 - 优化151: 增强错误处理
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        timestamp: new Date().toISOString()
      });
    }

    const stats = await emergencyProtocol.getAlertStats();

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
