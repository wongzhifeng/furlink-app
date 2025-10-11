const { User, Interaction } = require('../models');

class ActivityBalanceAlgorithm {
  constructor() {
    // 活跃度等级定义
    this.activityLevels = {
      high: { min: 30, weight: 1.2, target: 0.3 },    // 30天以上，目标30%
      medium: { min: 7, max: 29, weight: 1.0, target: 0.4 }, // 7-29天，目标40%
      low: { max: 6, weight: 0.8, target: 0.3 }        // 7天以下，目标30%
    };

    // 活跃度计算因子
    this.activityFactors = {
      daysActive: 0.4,        // 活跃天数权重
      interactionFrequency: 0.3, // 互动频率权重
      lastActiveTime: 0.2,    // 最后活跃时间权重
      contentCreation: 0.1     // 内容创作权重
    };
  }

  // 计算用户活跃度 - 优化1: 添加输入验证和空值检查
  async calculateUserActivity(user) {
    try {
      // 优化1: 输入验证
      if (!user || !user._id) {
        throw new Error('无效的用户对象');
      }

      const activity = {
        level: 'low',
        score: 0,
        factors: {
          daysActive: 0,
          interactionFrequency: 0,
          lastActiveTime: 0,
          contentCreation: 0
        }
      };

      // 1. 活跃天数得分
      activity.factors.daysActive = this.calculateDaysActiveScore(user.daysActive || 0);

      // 2. 互动频率得分
      activity.factors.interactionFrequency = await this.calculateInteractionFrequencyScore(user._id);

      // 3. 最后活跃时间得分
      activity.factors.lastActiveTime = this.calculateLastActiveTimeScore(user.lastActiveAt);

      // 4. 内容创作得分
      activity.factors.contentCreation = await this.calculateContentCreationScore(user._id);

      // 计算综合活跃度得分
      activity.score = (
        activity.factors.daysActive * this.activityFactors.daysActive +
        activity.factors.interactionFrequency * this.activityFactors.interactionFrequency +
        activity.factors.lastActiveTime * this.activityFactors.lastActiveTime +
        activity.factors.contentCreation * this.activityFactors.contentCreation
      );

      // 确定活跃度等级
      activity.level = this.determineActivityLevel(activity.score);

      return activity;
    } catch (error) {
      console.error('Error calculating user activity:', error);
      return {
        level: 'low',
        score: 0,
        factors: {
          daysActive: 0,
          interactionFrequency: 0,
          lastActiveTime: 0,
          contentCreation: 0
        }
      };
    }
  }

  // 计算活跃天数得分
  calculateDaysActiveScore(daysActive) {
    if (daysActive >= 90) return 1.0;
    if (daysActive >= 60) return 0.9;
    if (daysActive >= 30) return 0.8;
    if (daysActive >= 14) return 0.6;
    if (daysActive >= 7) return 0.4;
    if (daysActive >= 3) return 0.2;
    return 0.1;
  }

  // 计算互动频率得分 - 优化2: 添加缓存和错误处理
  async calculateInteractionFrequencyScore(userId) {
    try {
      // 优化2: 添加输入验证
      if (!userId) {
        return 0.1;
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const recentInteractions = await Interaction.countDocuments({
        userId: userId,
        createdAt: { $gte: thirtyDaysAgo }
      });

      // 根据互动次数计算得分
      if (recentInteractions >= 50) return 1.0;
      if (recentInteractions >= 30) return 0.8;
      if (recentInteractions >= 20) return 0.6;
      if (recentInteractions >= 10) return 0.4;
      if (recentInteractions >= 5) return 0.2;
      return 0.1;
    } catch (error) {
      console.error('Error calculating interaction frequency score:', error);
      return 0.1;
    }
  }

  // 计算最后活跃时间得分
  calculateLastActiveTimeScore(lastActiveAt) {
    if (!lastActiveAt) return 0.1;

    const now = new Date();
    const hoursDiff = (now - lastActiveAt) / (1000 * 60 * 60);

    if (hoursDiff <= 1) return 1.0;
    if (hoursDiff <= 6) return 0.9;
    if (hoursDiff <= 24) return 0.7;
    if (hoursDiff <= 72) return 0.5;
    if (hoursDiff <= 168) return 0.3; // 7天
    return 0.1;
  }

  // 计算内容创作得分 - 优化3: 优化数据库查询
  async calculateContentCreationScore(userId) {
    try {
      // 优化3: 添加输入验证和查询优化
      if (!userId) {
        return 0.1;
      }

      // 这里应该查询用户创建的星种数量
      // 暂时使用互动数量作为代理
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // 优化3: 使用索引优化查询
      const contentInteractions = await Interaction.countDocuments({
        userId: userId,
        actionType: { $in: ['comment', 'forward'] },
        createdAt: { $gte: thirtyDaysAgo }
      }).hint({ userId: 1, createdAt: -1 });

      if (contentInteractions >= 20) return 1.0;
      if (contentInteractions >= 10) return 0.8;
      if (contentInteractions >= 5) return 0.6;
      if (contentInteractions >= 2) return 0.4;
      return 0.1;
    } catch (error) {
      console.error('Error calculating content creation score:', error);
      return 0.1;
    }
  }

  // 确定活跃度等级
  determineActivityLevel(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  // 平衡星团活跃度 - 优化4: 添加输入验证和性能优化
  async balanceClusterActivity(members, targetDistribution = null) {
    try {
      // 优化4: 输入验证
      if (!members || !Array.isArray(members) || members.length === 0) {
        throw new Error('无效的成员数组');
      }

      if (!targetDistribution) {
        targetDistribution = {
          high: Math.floor(members.length * this.activityLevels.high.target),
          medium: Math.floor(members.length * this.activityLevels.medium.target),
          low: members.length - Math.floor(members.length * this.activityLevels.high.target) - Math.floor(members.length * this.activityLevels.medium.target)
        };
      }

      // 计算每个成员的活跃度
      const membersWithActivity = [];
      for (const member of members) {
        const activity = await this.calculateUserActivity(member);
        membersWithActivity.push({
          user: member,
          activity: activity
        });
      }

      // 按活跃度等级分组
      const activityGroups = {
        high: membersWithActivity.filter(m => m.activity.level === 'high'),
        medium: membersWithActivity.filter(m => m.activity.level === 'medium'),
        low: membersWithActivity.filter(m => m.activity.level === 'low')
      };

      // 按活跃度得分排序
      Object.keys(activityGroups).forEach(level => {
        activityGroups[level].sort((a, b) => b.activity.score - a.activity.score);
      });

      // 选择平衡后的成员
      const balancedMembers = [];
      
      // 选择高活跃用户
      balancedMembers.push(...activityGroups.high.slice(0, targetDistribution.high).map(m => m.user));
      
      // 选择中活跃用户
      balancedMembers.push(...activityGroups.medium.slice(0, targetDistribution.medium).map(m => m.user));
      
      // 选择低活跃用户
      balancedMembers.push(...activityGroups.low.slice(0, targetDistribution.low).map(m => m.user));

      return balancedMembers;
    } catch (error) {
      console.error('Error balancing cluster activity:', error);
      return members;
    }
  }

  // 计算活跃度分布
  calculateActivityDistribution(members) {
    const distribution = {
      high: 0,
      medium: 0,
      low: 0,
      total: members.length
    };

    members.forEach(member => {
      const daysActive = member.daysActive || 0;
      if (daysActive >= this.activityLevels.high.min) {
        distribution.high++;
      } else if (daysActive >= this.activityLevels.medium.min && daysActive <= this.activityLevels.medium.max) {
        distribution.medium++;
      } else {
        distribution.low++;
      }
    });

    return distribution;
  }

  // 计算活跃度平衡得分
  calculateActivityBalanceScore(members) {
    try {
      const distribution = this.calculateActivityDistribution(members);
      const total = distribution.total;

      if (total === 0) return 0;

      // 计算实际分布比例
      const actualRatios = {
        high: distribution.high / total,
        medium: distribution.medium / total,
        low: distribution.low / total
      };

      // 计算与目标分布的偏差
      const highDeviation = Math.abs(actualRatios.high - this.activityLevels.high.target);
      const mediumDeviation = Math.abs(actualRatios.medium - this.activityLevels.medium.target);
      const lowDeviation = Math.abs(actualRatios.low - this.activityLevels.low.target);

      const averageDeviation = (highDeviation + mediumDeviation + lowDeviation) / 3;
      
      // 平衡得分 = 1 - 平均偏差
      return Math.max(0, 1 - averageDeviation);
    } catch (error) {
      console.error('Error calculating activity balance score:', error);
      return 0;
    }
  }

  // 优化活跃度分布
  async optimizeActivityDistribution(members, maxIterations = 10) {
    try {
      let currentMembers = [...members];
      let bestScore = this.calculateActivityBalanceScore(currentMembers);
      let bestMembers = [...currentMembers];

      for (let iteration = 0; iteration < maxIterations; iteration++) {
        const distribution = this.calculateActivityDistribution(currentMembers);
        const targetDistribution = {
          high: Math.floor(members.length * this.activityLevels.high.target),
          medium: Math.floor(members.length * this.activityLevels.medium.target),
          low: members.length - Math.floor(members.length * this.activityLevels.high.target) - Math.floor(members.length * this.activityLevels.medium.target)
        };

        // 检查是否需要调整
        if (distribution.high === targetDistribution.high && 
            distribution.medium === targetDistribution.medium && 
            distribution.low === targetDistribution.low) {
          break;
        }

        // 尝试调整
        const adjustedMembers = await this.adjustActivityDistribution(currentMembers, targetDistribution);
        const adjustedScore = this.calculateActivityBalanceScore(adjustedMembers);

        if (adjustedScore > bestScore) {
          bestScore = adjustedScore;
          bestMembers = [...adjustedMembers];
        }

        currentMembers = adjustedMembers;
      }

      return bestMembers;
    } catch (error) {
      console.error('Error optimizing activity distribution:', error);
      return members;
    }
  }

  // 调整活跃度分布
  async adjustActivityDistribution(members, targetDistribution) {
    try {
      const distribution = this.calculateActivityDistribution(members);
      const adjustedMembers = [...members];

      // 如果高活跃用户过多，替换一些为中活跃用户
      if (distribution.high > targetDistribution.high) {
        const excessHigh = distribution.high - targetDistribution.high;
        const highUsers = adjustedMembers.filter(m => (m.daysActive || 0) >= this.activityLevels.high.min);
        const mediumUsers = adjustedMembers.filter(m => {
          const daysActive = m.daysActive || 0;
          return daysActive >= this.activityLevels.medium.min && daysActive <= this.activityLevels.medium.max;
        });

        // 移除多余的高活跃用户
        const toRemove = highUsers.slice(0, excessHigh);
        toRemove.forEach(user => {
          const index = adjustedMembers.indexOf(user);
          if (index > -1) adjustedMembers.splice(index, 1);
        });

        // 添加中活跃用户
        const toAdd = mediumUsers.slice(0, excessHigh);
        adjustedMembers.push(...toAdd);
      }

      // 如果中活跃用户过多，替换一些为低活跃用户
      if (distribution.medium > targetDistribution.medium) {
        const excessMedium = distribution.medium - targetDistribution.medium;
        const mediumUsers = adjustedMembers.filter(m => {
          const daysActive = m.daysActive || 0;
          return daysActive >= this.activityLevels.medium.min && daysActive <= this.activityLevels.medium.max;
        });
        const lowUsers = adjustedMembers.filter(m => (m.daysActive || 0) < this.activityLevels.medium.min);

        // 移除多余的中活跃用户
        const toRemove = mediumUsers.slice(0, excessMedium);
        toRemove.forEach(user => {
          const index = adjustedMembers.indexOf(user);
          if (index > -1) adjustedMembers.splice(index, 1);
        });

        // 添加低活跃用户
        const toAdd = lowUsers.slice(0, excessMedium);
        adjustedMembers.push(...toAdd);
      }

      return adjustedMembers;
    } catch (error) {
      console.error('Error adjusting activity distribution:', error);
      return members;
    }
  }

  // 获取活跃度统计
  async getActivityStatistics(members) {
    try {
      const statistics = {
        totalMembers: members.length,
        distribution: this.calculateActivityDistribution(members),
        balanceScore: this.calculateActivityBalanceScore(members),
        averageActivity: 0,
        activityTrends: {
          increasing: 0,
          stable: 0,
          decreasing: 0
        }
      };

      // 计算平均活跃度
      let totalActivity = 0;
      for (const member of members) {
        const activity = await this.calculateUserActivity(member);
        totalActivity += activity.score;
      }
      statistics.averageActivity = totalActivity / members.length;

      // 分析活跃度趋势（简化版本）
      const highActivityCount = statistics.distribution.high;
      const mediumActivityCount = statistics.distribution.medium;
      const lowActivityCount = statistics.distribution.low;

      if (highActivityCount > mediumActivityCount && mediumActivityCount > lowActivityCount) {
        statistics.activityTrends.increasing = 1;
      } else if (highActivityCount < mediumActivityCount && mediumActivityCount < lowActivityCount) {
        statistics.activityTrends.decreasing = 1;
      } else {
        statistics.activityTrends.stable = 1;
      }

      return statistics;
    } catch (error) {
      console.error('Error getting activity statistics:', error);
      return {
        totalMembers: members.length,
        distribution: { high: 0, medium: 0, low: 0, total: members.length },
        balanceScore: 0,
        averageActivity: 0,
        activityTrends: { increasing: 0, stable: 0, decreasing: 0 }
      };
    }
  }

  // 预测活跃度变化
  async predictActivityChange(members, timeHorizon = 7) {
    try {
      const predictions = {
        high: 0,
        medium: 0,
        low: 0,
        confidence: 0
      };

      // 基于历史数据预测（简化版本）
      const currentDistribution = this.calculateActivityDistribution(members);
      const balanceScore = this.calculateActivityBalanceScore(members);

      // 如果当前平衡得分高，预测保持稳定
      if (balanceScore > 0.8) {
        predictions.high = currentDistribution.high;
        predictions.medium = currentDistribution.medium;
        predictions.low = currentDistribution.low;
        predictions.confidence = 0.9;
      } else {
        // 如果当前不平衡，预测向目标分布调整
        const targetDistribution = {
          high: Math.floor(members.length * this.activityLevels.high.target),
          medium: Math.floor(members.length * this.activityLevels.medium.target),
          low: members.length - Math.floor(members.length * this.activityLevels.high.target) - Math.floor(members.length * this.activityLevels.medium.target)
        };

        predictions.high = targetDistribution.high;
        predictions.medium = targetDistribution.medium;
        predictions.low = targetDistribution.low;
        predictions.confidence = 0.6;
      }

      return predictions;
    } catch (error) {
      console.error('Error predicting activity change:', error);
      return {
        high: 0,
        medium: 0,
        low: 0,
        confidence: 0
      };
    }
  }
}

module.exports = ActivityBalanceAlgorithm;

