const { User, UserService, Resonance } = require('../models');

/**
 * 服务匹配算法
 * 基于《德道经》"天道无亲，常与善人"原则
 * 集成共鸣算法计算信用权重
 */
class ServiceMatchingAlgorithm {
  /**
   * 匹配服务提供者
   * @param {ObjectId} seekerId - 寻求服务的用户ID
   * @param {Object} seekerLocation - 用户位置 {coordinates: [lng, lat]}
   * @param {String} serviceType - 服务类型
   * @param {Number} maxDistance - 最大距离（米），默认1000米
   */
  // 匹配服务提供者 - 优化16: 添加输入验证和错误处理
  async matchServices(seekerId, seekerLocation, serviceType, maxDistance = 1000) {
    try {
      // 优化16: 输入验证
      if (!seekerId || !seekerLocation || !serviceType) {
        throw new Error('缺少必要参数');
      }

      if (!seekerLocation.coordinates || !Array.isArray(seekerLocation.coordinates)) {
        throw new Error('位置坐标格式错误');
      }

      // 获取寻求者信息
      const seeker = await User.findById(seekerId);
      
      if (!seeker) {
        throw new Error('用户不存在');
      }

      // 1. 地理围栏查询：查找附近的服务 - 优化17: 优化数据库查询
      const nearbyServices = await UserService.find({
        serviceType,
        isActive: true,
        moralStatus: 'active',
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: seekerLocation.coordinates
            },
            $maxDistance: maxDistance
          }
        },
        // 服务必须在30天内更新
        lastUpdated: {
          $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      })
      .populate('userId', 'username creditScore')
      .hint({ serviceType: 1, isActive: 1, location: '2dsphere' })
      .limit(20);

      // 2. 计算加权得分
      const scoredServices = await Promise.all(
        nearbyServices.map(async (service) => {
          // 2.1 距离权重（1公里线性衰减）
          const distance = this.calculateDistance(
            seekerLocation.coordinates,
            service.location.coordinates
          );
          const distanceWeight = Math.max(0, 1 - distance / 1000);

          // 2.2 信用分权重（利用共鸣算法计算）
          const creditWeight = await this.calculateCreditWeight(
            seekerId,
            service.userId._id
          );

          // 2.3 时效性权重（30天线性衰减）
          const daysSinceUpdate = (Date.now() - service.lastUpdated) / (24 * 60 * 60 * 1000);
          const freshnessWeight = Math.max(0, 1 - daysSinceUpdate / 30);

          // 2.4 综合得分
          const totalWeight = (
            distanceWeight * 0.4 +
            creditWeight * 0.4 +
            freshnessWeight * 0.2
          );

          return {
            service,
            score: totalWeight,
            distance: Math.round(distance),
            breakdown: {
              distanceWeight: distanceWeight.toFixed(2),
              creditWeight: creditWeight.toFixed(2),
              freshnessWeight: freshnessWeight.toFixed(2)
            }
          };
        })
      );

      // 3. 排序并限制数量
      const sortedServices = scoredServices
        .sort((a, b) => b.score - a.score)
        .slice(0, seeker.isNewUser ? 3 : 5); // 新用户限制3个，老用户5个

      return sortedServices;
    } catch (error) {
      console.error('服务匹配失败:', error);
      throw error;
    }
  }

  /**
   * 计算距离（米）- Haversine公式
   */
  calculateDistance(coords1, coords2) {
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * 计算信用权重（集成共鸣算法）
   * "天道无亲，常与善人" - 利用现有的Resonance共鸣值来辅助计算信用
   */
  async calculateCreditWeight(seekerId, providerId) {
    try {
      // 优化18: 输入验证
      if (!seekerId || !providerId) {
        return 0.8;
      }

      // 优化18: 添加缓存检查
      const cacheKey = `credit_weight:${seekerId}:${providerId}`;
      // 这里可以添加Redis缓存检查

      // 基础信用分转换（60→0.6, 100→1.0）
      const provider = await User.findById(providerId).lean();
      if (!provider) {
        return 0.8; // 默认值
      }
      
      const baseCreditWeight = (provider.creditScore || 60) / 100;

      // 尝试获取共鸣值（如果存在历史互动）
      const resonance = await Resonance.findOne({
        $or: [
          { userA: seekerId, userB: providerId },
          { userA: providerId, userB: seekerId }
        ]
      }).sort({ calculatedAt: -1 });

      if (resonance) {
        // 共鸣值加成（0-1范围，最高加成20%）
        const resonanceBonus = (resonance.totalResonance / 100) * 0.2;
        return Math.min(1.0, baseCreditWeight + resonanceBonus);
      }

      return baseCreditWeight;
    } catch (error) {
      console.error('计算信用权重失败:', error);
      return 0.8; // 默认值
    }
  }

  /**
   * 检查用户轨迹与服务提供者是否有交集
   * 用于触发"毒株"推送
   */
  async checkTrajectoryIntersection(userId, serviceId) {
    try {
      const user = await User.findById(userId);
      const service = await UserService.findById(serviceId);

      if (!user || !service || !user.locationHistory || user.locationHistory.length === 0) {
        return false;
      }

      // 检查最近24小时的轨迹
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentLocations = user.locationHistory.filter(loc => 
        loc.timestamp > oneDayAgo
      );

      // 检查是否有任何历史位置在服务范围内
      for (const loc of recentLocations) {
        const distance = this.calculateDistance(
          loc.coordinates,
          service.location.coordinates
        );

        // 如果距离小于服务范围，则有交集
        if (distance <= service.serviceRadius * 1000) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('检查轨迹交集失败:', error);
      return false;
    }
  }
}

module.exports = new ServiceMatchingAlgorithm();

