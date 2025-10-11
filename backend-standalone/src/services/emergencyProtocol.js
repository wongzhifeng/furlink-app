const { EmergencyAlert, Pet, User } = require('../models');
const DealerService = require('./dealerService');
const GeoLayer = require('./geoLayer');

/**
 * 紧急协议服务 - 基于道德经"宠辱若惊"理念
 * 紧急情况下需要立即响应，无视常规免疫设置
 */
class EmergencyProtocol {
  constructor() {
    this.dealerService = new DealerService();
    this.geoLayer = new GeoLayer();
    this.activeAlerts = new Map(); // 内存缓存活跃警报
  }

  /**
   * 创建紧急警报 - 0延迟传播
   * @param {Object} alertData - 警报数据
   * @returns {Promise<Object>} 创建的警报
   */
  async createEmergencyAlert(alertData) {
    try {
      const {
        petId,
        reporterId,
        alertType,
        title,
        description,
        location,
        urgencyLevel = 'high',
        contactInfo,
        attachments = []
      } = alertData;

      // 验证输入
      if (!petId || !reporterId || !alertType || !title || !description || !location) {
        throw new Error('缺少必要的警报信息');
      }

      // 验证宠物存在
      const pet = await Pet.findById(petId);
      if (!pet) {
        throw new Error('宠物不存在');
      }

      // 验证报告者权限
      if (pet.ownerId.toString() !== reporterId && !this.isAuthorizedReporter(reporterId)) {
        throw new Error('无权限为此宠物创建警报');
      }

      // 创建警报
      const alert = new EmergencyAlert({
        petId,
        reporterId,
        alertType,
        title,
        description,
        location,
        urgencyLevel,
        contactInfo,
        attachments,
        incidentTime: new Date(),
        propagationSettings: {
          forcePropagation: true, // 强制传播
          propagationRadius: this.getPropagationRadius(urgencyLevel),
          propagationDelay: 0, // 0延迟
          propagationDuration: this.getPropagationDuration(urgencyLevel)
        }
      });

      await alert.save();

      // 立即开始传播
      await this.startImmediatePropagation(alert);

      // 缓存活跃警报
      this.activeAlerts.set(alert._id.toString(), alert);

      console.log(`🚨 紧急警报已创建: ${alert.title} (ID: ${alert._id})`);
      return alert;

    } catch (error) {
      console.error('创建紧急警报失败:', error);
      throw error;
    }
  }

  /**
   * 立即开始传播 - 0延迟
   * @param {Object} alert - 警报对象
   */
  async startImmediatePropagation(alert) {
    try {
      const { location, propagationSettings } = alert;
      
      // 获取传播范围内的用户
      const nearbyUsers = await this.getNearbyUsers(
        location.latitude,
        location.longitude,
        propagationSettings.propagationRadius
      );

      console.log(`📡 开始紧急传播，覆盖 ${nearbyUsers.length} 个用户`);

      // 创建紧急毒株
      const emergencyStrain = {
        type: 'emergency',
        subtype: alert.alertType,
        content: {
          alertId: alert._id,
          title: alert.title,
          description: alert.description,
          petInfo: await this.getPetInfo(alert.petId),
          location: alert.location,
          urgencyLevel: alert.urgencyLevel,
          contactInfo: alert.contactInfo,
          attachments: alert.attachments
        },
        propagationSettings: {
          forceSpread: true, // 强制传播
          overrideImmunity: true, // 无视免疫
          maxRadius: propagationSettings.propagationRadius,
          delay: 0, // 0延迟
          duration: propagationSettings.propagationDuration
        }
      };

      // 立即传播到所有附近用户
      const propagationPromises = nearbyUsers.map(user => 
        this.dealerService.spreadStrain(user._id, emergencyStrain, {
          force: true,
          overrideImmunity: true,
          immediate: true
        })
      );

      await Promise.all(propagationPromises);

      // 更新传播统计
      await alert.updatePropagationStats({
        totalReached: nearbyUsers.length
      });

      console.log(`✅ 紧急警报传播完成: ${alert.title}`);

    } catch (error) {
      console.error('紧急传播失败:', error);
      throw error;
    }
  }

  /**
   * 获取传播范围内的用户
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   * @param {number} radius - 半径(公里)
   * @returns {Promise<Array>} 附近用户列表
   */
  async getNearbyUsers(latitude, longitude, radius) {
    try {
      return await User.findNearby(latitude, longitude, radius);
    } catch (error) {
      console.error('获取附近用户失败:', error);
      return [];
    }
  }

  /**
   * 获取宠物信息
   * @param {string} petId - 宠物ID
   * @returns {Promise<Object>} 宠物信息
   */
  async getPetInfo(petId) {
    try {
      const pet = await Pet.findById(petId).select('name species breed age color photos specialMarks');
      return pet ? pet.toObject() : null;
    } catch (error) {
      console.error('获取宠物信息失败:', error);
      return null;
    }
  }

  /**
   * 根据紧急程度获取传播半径
   * @param {string} urgencyLevel - 紧急程度
   * @returns {number} 传播半径(公里)
   */
  getPropagationRadius(urgencyLevel) {
    const radiusMap = {
      low: 2,
      medium: 5,
      high: 10,
      critical: 20
    };
    return radiusMap[urgencyLevel] || 5;
  }

  /**
   * 根据紧急程度获取传播持续时间
   * @param {string} urgencyLevel - 紧急程度
   * @returns {number} 持续时间(小时)
   */
  getPropagationDuration(urgencyLevel) {
    const durationMap = {
      low: 12,
      medium: 24,
      high: 48,
      critical: 72
    };
    return durationMap[urgencyLevel] || 24;
  }

  /**
   * 检查是否为授权报告者
   * @param {string} userId - 用户ID
   * @returns {boolean} 是否授权
   */
  isAuthorizedReporter(userId) {
    // 这里可以添加更多授权逻辑
    // 比如紧急响应志愿者、宠物医院工作人员等
    return true; // 暂时允许所有用户报告
  }

  /**
   * 处理警报响应
   * @param {string} alertId - 警报ID
   * @param {string} userId - 响应者ID
   * @param {Object} responseData - 响应数据
   */
  async handleAlertResponse(alertId, userId, responseData) {
    try {
      const alert = await EmergencyAlert.findById(alertId);
      if (!alert) {
        throw new Error('警报不存在');
      }

      const response = {
        userId,
        responseType: responseData.type,
        message: responseData.message,
        location: responseData.location,
        timestamp: new Date(),
        isVerified: false
      };

      await alert.addResponse(response);

      // 如果是解决响应，标记警报为已解决
      if (responseData.type === 'resolved') {
        await alert.markAsResolved();
        this.activeAlerts.delete(alertId);
      }

      console.log(`📝 警报响应已记录: ${alertId} - ${responseData.type}`);
      return response;

    } catch (error) {
      console.error('处理警报响应失败:', error);
      throw error;
    }
  }

  /**
   * 获取活跃警报列表
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   * @param {number} radius - 半径(公里)
   * @returns {Promise<Array>} 活跃警报列表
   */
  async getActiveAlerts(latitude, longitude, radius = 10) {
    try {
      return await EmergencyAlert.findNearby(latitude, longitude, radius);
    } catch (error) {
      console.error('获取活跃警报失败:', error);
      return [];
    }
  }

  /**
   * 取消警报
   * @param {string} alertId - 警报ID
   * @param {string} userId - 用户ID
   */
  async cancelAlert(alertId, userId) {
    try {
      const alert = await EmergencyAlert.findById(alertId);
      if (!alert) {
        throw new Error('警报不存在');
      }

      // 检查权限
      if (alert.reporterId.toString() !== userId) {
        throw new Error('无权限取消此警报');
      }

      alert.status = 'cancelled';
      await alert.save();

      this.activeAlerts.delete(alertId);
      console.log(`❌ 警报已取消: ${alertId}`);

    } catch (error) {
      console.error('取消警报失败:', error);
      throw error;
    }
  }

  /**
   * 延长警报有效期
   * @param {string} alertId - 警报ID
   * @param {string} userId - 用户ID
   * @param {number} hours - 延长小时数
   */
  async extendAlert(alertId, userId, hours) {
    try {
      const alert = await EmergencyAlert.findById(alertId);
      if (!alert) {
        throw new Error('警报不存在');
      }

      // 检查权限
      if (alert.reporterId.toString() !== userId) {
        throw new Error('无权限延长此警报');
      }

      await alert.extendExpiration(hours);
      console.log(`⏰ 警报已延长 ${hours} 小时: ${alertId}`);

    } catch (error) {
      console.error('延长警报失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期警报
   */
  async cleanupExpiredAlerts() {
    try {
      const expiredAlerts = await EmergencyAlert.find({
        status: 'active',
        expiresAt: { $lt: new Date() }
      });

      for (const alert of expiredAlerts) {
        alert.status = 'expired';
        await alert.save();
        this.activeAlerts.delete(alert._id.toString());
      }

      console.log(`🧹 清理了 ${expiredAlerts.length} 个过期警报`);

    } catch (error) {
      console.error('清理过期警报失败:', error);
    }
  }

  /**
   * 获取警报统计
   * @returns {Promise<Object>} 统计信息
   */
  async getAlertStats() {
    try {
      const totalAlerts = await EmergencyAlert.countDocuments();
      const activeAlerts = await EmergencyAlert.countDocuments({ status: 'active' });
      const resolvedAlerts = await EmergencyAlert.countDocuments({ status: 'resolved' });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAlerts = await EmergencyAlert.countDocuments({
        createdAt: { $gte: today }
      });

      return {
        total: totalAlerts,
        active: activeAlerts,
        resolved: resolvedAlerts,
        today: todayAlerts,
        resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts * 100).toFixed(2) : 0
      };

    } catch (error) {
      console.error('获取警报统计失败:', error);
      return {
        total: 0,
        active: 0,
        resolved: 0,
        today: 0,
        resolutionRate: 0
      };
    }
  }
}

module.exports = EmergencyProtocol;
