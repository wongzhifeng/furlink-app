const { User, UserService } = require('../models');

/**
 * 道德风控服务
 * 基于《德道经》"利而不害"原则
 * 确保所有服务交易互利互惠，不伤害任何一方
 */
class MoralGuardService {
  /**
   * 验证服务发布合规性
   * 四条核心规则：
   * 1. 新用户7天内只能发布1个服务（"知止不殆"）
   * 2. 差评率>30%自动冻结（"利而不害"）
   * 3. 同一IP下服务数≤2（防止刷单）
   * 4. 服务数量上限检查（"知足不辱"）
   */
  async validateServicePublication(userId, serviceData) {
    try {
      // 优化74: 输入验证
      if (!userId || typeof userId !== 'string') {
        throw new Error('用户ID不能为空');
      }

      if (!serviceData || typeof serviceData !== 'object') {
        throw new Error('服务数据不能为空');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const violations = [];

      // 规则1：新用户7天内只能发布1个服务（"知止不殆"）- 优化75: 增强错误处理
      if (user.isNewUser) {
        try {
          const accountAge = (Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000);
          if (accountAge < 7 && user.serviceSlots?.currentServices >= 1) {
            violations.push({
              rule: 'NEW_USER_LIMIT',
              message: '知止不殆：新用户7天内只能发布1个服务',
              daoQuote: '知足不辱，知止不殆',
              severity: 'high'
            });
          }
        } catch (error) {
          console.error('Error calculating account age:', error);
          // 优化75: 错误恢复机制
          violations.push({
            rule: 'CALCULATION_ERROR',
            message: '账户年龄计算错误，请稍后重试',
            daoQuote: '知者不惑',
            severity: 'medium'
          });
        }
      }

      // 规则2：差评率>30%自动冻结（"利而不害"）
      const userServices = await UserService.find({ userId, isActive: true });
      if (userServices.length > 0) {
        const totalNegativeRate = userServices.reduce((sum, s) => 
          sum + s.ratings.negativeRate, 0) / userServices.length;
        
        if (totalNegativeRate > 0.3) {
          violations.push({
            rule: 'HIGH_NEGATIVE_RATE',
            message: '利而不害：差评率过高，服务已暂停',
            daoQuote: '天道无亲，常与善人',
            action: 'suspend',
            severity: 'critical'
          });
          
          // 自动暂停所有服务
          await UserService.updateMany(
            { userId },
            { moralStatus: 'suspended' }
          );
        }
      }

      // 规则3：同一IP下服务数≤2（防止刷单）
      const ipAddress = serviceData.ipAddress;
      if (ipAddress) {
        const servicesFromSameIP = await UserService.countDocuments({
          'metadata.ipAddress': ipAddress,
          isActive: true
        });
        
        if (servicesFromSameIP >= 2) {
          violations.push({
            rule: 'IP_LIMIT',
            message: '同一IP下最多发布2个服务',
            daoQuote: '治大国若烹小鲜',
            severity: 'medium'
          });
        }
      }

      // 规则4：服务数量上限检查（"知足不辱"）
      if (user.serviceSlots.currentServices >= user.serviceSlots.maxServices) {
        violations.push({
          rule: 'SLOT_LIMIT',
          message: `知足不辱：您已达到服务上限（${user.serviceSlots.maxServices}个）`,
          daoQuote: '知足不辱，知止不殆',
          severity: 'high'
        });
      }

      return {
        isValid: violations.length === 0,
        violations,
        canProceed: !violations.some(v => v.action === 'suspend')
      };
    } catch (error) {
      console.error('道德风控验证失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户信用分（基于行为）
   * 集成到共鸣算法体系中
   */
  async updateCreditScore(userId, action, impact) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      let newScore = user.creditScore;

      switch(action) {
        case 'positive_rating':
          newScore = Math.min(100, newScore + 2); // 好评+2分
          break;
        case 'negative_rating':
          newScore = Math.max(60, newScore - 5); // 差评-5分
          break;
        case 'service_completed':
          newScore = Math.min(100, newScore + 1); // 完成服务+1分
          break;
        case 'violation':
          newScore = Math.max(60, newScore - 10); // 违规-10分
          break;
        case 'helpful_service':
          newScore = Math.min(100, newScore + 3); // 互助+3分
          break;
        default:
          break;
      }

      await User.findByIdAndUpdate(userId, { creditScore: newScore });

      // 如果信用分降到70以下，发出警告
      if (newScore < 70 && user.creditScore >= 70) {
        await this.sendMoralWarning(userId, {
          message: '天道无亲，常与善人：您的信用分已降至警戒线',
          currentScore: newScore,
          previousScore: user.creditScore,
          suggestion: '提升服务质量可恢复信用'
        });
      }

      // 如果信用分跌破65分，自动禁止发布新服务
      if (newScore < 65) {
        await UserService.updateMany(
          { userId },
          { moralStatus: 'warning' }
        );
      }

      return newScore;
    } catch (error) {
      console.error('更新信用分失败:', error);
      throw error;
    }
  }

  /**
   * 发送道德警告
   */
  async sendMoralWarning(userId, warningData) {
    // 记录警告日志（用于后续审计）
    console.log(`🚨 道德警告 [${userId}]:`, {
      timestamp: new Date().toISOString(),
      ...warningData
    });
    
    // TODO: 集成通知系统（可通过WebSocket或推送通知）
    // TODO: 记录到警告历史表
  }

  /**
   * 检查服务提供者的道德状态
   */
  async checkServiceProviderStatus(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          canProvideService: false,
          reason: '用户不存在'
        };
      }

      // 检查信用分
      if (user.creditScore < 65) {
        return {
          canProvideService: false,
          reason: '信用分过低，无法提供服务',
          daoQuote: '天道无亲，常与善人'
        };
      }

      // 检查服务状态
      const activeServices = await UserService.find({
        userId,
        isActive: true,
        moralStatus: 'suspended'
      });

      if (activeServices.length > 0) {
        return {
          canProvideService: false,
          reason: '服务已被暂停',
          daoQuote: '利而不害'
        };
      }

      return {
        canProvideService: true,
        creditScore: user.creditScore
      };
    } catch (error) {
      console.error('检查服务提供者状态失败:', error);
      return {
        canProvideService: false,
        reason: '系统错误'
      };
    }
  }

  /**
   * 计算服务的道德风险评分
   * 返回0-100，越低越安全
   */
  async calculateServiceRiskScore(serviceId) {
    try {
      const service = await UserService.findById(serviceId).populate('userId');
      if (!service) {
        return 100; // 服务不存在，最高风险
      }

      let riskScore = 0;

      // 差评率风险
      riskScore += service.ratings.negativeRate * 50;

      // 信用分风险
      const creditRisk = (100 - service.userId.creditScore) * 0.3;
      riskScore += creditRisk;

      // 服务时效性风险
      const daysSinceUpdate = (Date.now() - service.lastUpdated) / (24 * 60 * 60 * 1000);
      const timeRisk = Math.min(20, daysSinceUpdate * 0.5);
      riskScore += timeRisk;

      return Math.round(Math.min(100, riskScore));
    } catch (error) {
      console.error('计算服务风险评分失败:', error);
      return 100;
    }
  }
}

module.exports = new MoralGuardService();

