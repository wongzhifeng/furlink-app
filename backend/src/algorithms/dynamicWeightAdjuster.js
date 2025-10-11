const { User, Interaction, Resonance } = require('../models');

class DynamicWeightAdjuster {
  constructor() {
    // 基础权重配置
    this.baseWeights = {
      tagSimilarity: 0.6,
      interactionScore: 0.4,
      contentPreferenceMatch: 0.15,
      randomFactor: 0.05
    };

    // 用户成熟度阈值
    this.maturityThresholds = {
      novice: 7,      // 7天以下为新用户
      intermediate: 30, // 30天以下为中级用户
      mature: 90      // 90天以下为成熟用户
    };

    // 权重调整因子
    this.adjustmentFactors = {
      userMaturity: 0.3,
      interactionPattern: 0.2,
      contentPreference: 0.2,
      timeOfDay: 0.1,
      dayOfWeek: 0.1,
      seasonal: 0.1
    };

    // 学习率
    this.learningRate = 0.01;
  }

  // 获取动态权重 - 优化8: 添加输入验证和缓存
  async getDynamicWeights(userA, userB, context = {}) {
    try {
      // 优化8: 输入验证
      if (!userA || !userB) {
        return this.baseWeights;
      }

      const weights = { ...this.baseWeights };

      // 基于用户成熟度调整
      const maturityAdjustment = await this.calculateMaturityAdjustment(userA, userB);
      this.applyAdjustment(weights, maturityAdjustment, this.adjustmentFactors.userMaturity);

      // 基于互动模式调整
      const interactionAdjustment = await this.calculateInteractionAdjustment(userA, userB);
      this.applyAdjustment(weights, interactionAdjustment, this.adjustmentFactors.interactionPattern);

      // 基于内容偏好调整
      const contentAdjustment = await this.calculateContentAdjustment(userA, userB);
      this.applyAdjustment(weights, contentAdjustment, this.adjustmentFactors.contentPreference);

      // 基于时间上下文调整
      const timeAdjustment = this.calculateTimeAdjustment(context);
      this.applyAdjustment(weights, timeAdjustment, this.adjustmentFactors.timeOfDay);

      // 基于星期调整
      const dayAdjustment = this.calculateDayAdjustment(context);
      this.applyAdjustment(weights, dayAdjustment, this.adjustmentFactors.dayOfWeek);

      // 基于季节调整
      const seasonalAdjustment = this.calculateSeasonalAdjustment(context);
      this.applyAdjustment(weights, seasonalAdjustment, this.adjustmentFactors.seasonal);

      // 归一化权重
      this.normalizeWeights(weights);

      return weights;
    } catch (error) {
      console.error('Error getting dynamic weights:', error);
      return this.baseWeights;
    }
  }

  // 计算用户成熟度调整
  async calculateMaturityAdjustment(userA, userB) {
    const daysActiveA = userA.daysActive || 0;
    const daysActiveB = userB.daysActive || 0;
    const avgDaysActive = (daysActiveA + daysActiveB) / 2;

    let adjustment = {
      tagSimilarity: 0,
      interactionScore: 0,
      contentPreferenceMatch: 0,
      randomFactor: 0
    };

    if (avgDaysActive <= this.maturityThresholds.novice) {
      // 新用户：提高标签权重，降低互动权重
      adjustment.tagSimilarity = 0.2;
      adjustment.interactionScore = -0.1;
      adjustment.randomFactor = 0.1;
    } else if (avgDaysActive <= this.maturityThresholds.intermediate) {
      // 中级用户：平衡权重
      adjustment.tagSimilarity = 0.1;
      adjustment.interactionScore = 0.1;
    } else if (avgDaysActive <= this.maturityThresholds.mature) {
      // 成熟用户：提高互动权重，降低标签权重
      adjustment.tagSimilarity = -0.1;
      adjustment.interactionScore = 0.2;
      adjustment.contentPreferenceMatch = 0.1;
    } else {
      // 资深用户：高度依赖互动历史
      adjustment.tagSimilarity = -0.2;
      adjustment.interactionScore = 0.3;
      adjustment.contentPreferenceMatch = 0.2;
    }

    return adjustment;
  }

  // 计算互动模式调整
  async calculateInteractionAdjustment(userA, userB) {
    try {
      const interactions = await Interaction.find({
        $or: [
          { userId: userA._id, targetId: userB._id },
          { userId: userB._id, targetId: userA._id }
        ]
      });

      if (interactions.length === 0) {
        return {
          tagSimilarity: 0.1,
          interactionScore: -0.1,
          randomFactor: 0.1
        };
      }

      const adjustment = {
        tagSimilarity: 0,
        interactionScore: 0,
        contentPreferenceMatch: 0,
        randomFactor: 0
      };

      // 分析互动模式
      const patterns = this.analyzeInteractionPatterns(interactions);

      if (patterns.isReciprocal) {
        adjustment.interactionScore = 0.2;
        adjustment.tagSimilarity = -0.1;
      }

      if (patterns.isDiverse) {
        adjustment.contentPreferenceMatch = 0.1;
      }

      if (patterns.isConsistent) {
        adjustment.interactionScore = 0.1;
      }

      return adjustment;
    } catch (error) {
      console.error('Error calculating interaction adjustment:', error);
      return { tagSimilarity: 0, interactionScore: 0, contentPreferenceMatch: 0, randomFactor: 0 };
    }
  }

  // 分析互动模式
  analyzeInteractionPatterns(interactions) {
    const patterns = {
      isReciprocal: false,
      isDiverse: false,
      isConsistent: false
    };

    if (interactions.length === 0) {
      return patterns;
    }

    // 检查互惠性
    const userIds = [...new Set(interactions.map(i => i.userId.toString()))];
    patterns.isReciprocal = userIds.length > 1;

    // 检查多样性
    const actionTypes = new Set(interactions.map(i => i.actionType));
    patterns.isDiverse = actionTypes.size >= 3;

    // 检查持续性
    const timeSpan = (interactions[0].createdAt - interactions[interactions.length - 1].createdAt) / (1000 * 60 * 60 * 24);
    patterns.isConsistent = timeSpan >= 7;

    return patterns;
  }

  // 计算内容偏好调整
  async calculateContentAdjustment(userA, userB) {
    try {
      const prefsA = userA.contentPreferences || new Map();
      const prefsB = userB.contentPreferences || new Map();

      if (prefsA.size === 0 && prefsB.size === 0) {
        return {
          tagSimilarity: 0.1,
          contentPreferenceMatch: -0.1,
          randomFactor: 0.1
        };
      }

      const adjustment = {
        tagSimilarity: 0,
        interactionScore: 0,
        contentPreferenceMatch: 0,
        randomFactor: 0
      };

      // 计算偏好重叠度
      let overlapCount = 0;
      for (const [tag, weight] of prefsA) {
        if (prefsB.has(tag)) {
          overlapCount++;
        }
      }

      const overlapRatio = overlapCount / Math.max(prefsA.size, prefsB.size);

      if (overlapRatio > 0.5) {
        adjustment.contentPreferenceMatch = 0.2;
        adjustment.tagSimilarity = 0.1;
      } else if (overlapRatio < 0.2) {
        adjustment.contentPreferenceMatch = -0.1;
        adjustment.randomFactor = 0.1;
      }

      return adjustment;
    } catch (error) {
      console.error('Error calculating content adjustment:', error);
      return { tagSimilarity: 0, interactionScore: 0, contentPreferenceMatch: 0, randomFactor: 0 };
    }
  }

  // 计算时间调整
  calculateTimeAdjustment(context) {
    const hour = context.hour || new Date().getHours();
    
    const adjustment = {
      tagSimilarity: 0,
      interactionScore: 0,
      contentPreferenceMatch: 0,
      randomFactor: 0
    };

    // 工作时间（9-17点）：提高内容偏好权重
    if (hour >= 9 && hour <= 17) {
      adjustment.contentPreferenceMatch = 0.1;
      adjustment.tagSimilarity = 0.05;
    }
    // 晚上时间（18-23点）：提高互动权重
    else if (hour >= 18 && hour <= 23) {
      adjustment.interactionScore = 0.1;
      adjustment.randomFactor = 0.05;
    }
    // 深夜时间（0-6点）：提高随机因子
    else {
      adjustment.randomFactor = 0.1;
      adjustment.tagSimilarity = -0.05;
    }

    return adjustment;
  }

  // 计算星期调整
  calculateDayAdjustment(context) {
    const dayOfWeek = context.dayOfWeek || new Date().getDay();
    
    const adjustment = {
      tagSimilarity: 0,
      interactionScore: 0,
      contentPreferenceMatch: 0,
      randomFactor: 0
    };

    // 工作日：提高内容偏好权重
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      adjustment.contentPreferenceMatch = 0.05;
      adjustment.tagSimilarity = 0.05;
    }
    // 周末：提高互动权重和随机因子
    else {
      adjustment.interactionScore = 0.1;
      adjustment.randomFactor = 0.05;
    }

    return adjustment;
  }

  // 计算季节调整
  calculateSeasonalAdjustment(context) {
    const month = context.month || new Date().getMonth();
    
    const adjustment = {
      tagSimilarity: 0,
      interactionScore: 0,
      contentPreferenceMatch: 0,
      randomFactor: 0
    };

    // 春季（3-5月）：提高标签权重
    if (month >= 2 && month <= 4) {
      adjustment.tagSimilarity = 0.05;
    }
    // 夏季（6-8月）：提高互动权重
    else if (month >= 5 && month <= 7) {
      adjustment.interactionScore = 0.05;
    }
    // 秋季（9-11月）：提高内容偏好权重
    else if (month >= 8 && month <= 10) {
      adjustment.contentPreferenceMatch = 0.05;
    }
    // 冬季（12-2月）：提高随机因子
    else {
      adjustment.randomFactor = 0.05;
    }

    return adjustment;
  }

  // 应用调整
  applyAdjustment(weights, adjustment, factor) {
    Object.keys(adjustment).forEach(key => {
      weights[key] += adjustment[key] * factor;
    });
  }

  // 归一化权重 - 优化9: 添加边界检查和数值稳定性
  normalizeWeights(weights) {
    // 优化9: 添加边界检查
    if (!weights || typeof weights !== 'object') {
      return;
    }

    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    
    // 优化9: 添加数值稳定性检查
    if (sum > 0 && isFinite(sum)) {
      Object.keys(weights).forEach(key => {
        weights[key] = Math.max(0, Math.min(1, weights[key] / sum));
      });
    }
  }

  // 学习权重调整
  async learnFromFeedback(userA, userB, actualResonance, predictedResonance) {
    try {
      const error = actualResonance - predictedResonance;
      
      if (Math.abs(error) > 0.1) { // 只有误差较大时才学习
        const adjustment = {
          tagSimilarity: error * this.learningRate,
          interactionScore: error * this.learningRate,
          contentPreferenceMatch: error * this.learningRate,
          randomFactor: error * this.learningRate
        };

        // 这里可以将调整保存到数据库或配置文件
        await this.saveWeightAdjustment(userA._id, userB._id, adjustment);
      }
    } catch (error) {
      console.error('Error learning from feedback:', error);
    }
  }

  // 保存权重调整
  async saveWeightAdjustment(userAId, userBId, adjustment) {
    try {
      // 这里可以实现权重调整的持久化存储
      // 例如保存到数据库或配置文件
      console.log(`Weight adjustment saved for users ${userAId} and ${userBId}:`, adjustment);
    } catch (error) {
      console.error('Error saving weight adjustment:', error);
    }
  }

  // 获取权重统计
  async getWeightStatistics() {
    try {
      const stats = await Resonance.aggregate([
        {
          $group: {
            _id: null,
            avgTagSimilarity: { $avg: '$tagSimilarity' },
            avgInteractionScore: { $avg: '$interactionScore' },
            avgContentPreferenceMatch: { $avg: '$contentPreferenceMatch' },
            avgRandomFactor: { $avg: '$randomFactor' },
            count: { $sum: 1 }
          }
        }
      ]);

      return stats[0] || {
        avgTagSimilarity: 0,
        avgInteractionScore: 0,
        avgContentPreferenceMatch: 0,
        avgRandomFactor: 0,
        count: 0
      };
    } catch (error) {
      console.error('Error getting weight statistics:', error);
      throw error;
    }
  }

  // 重置权重到默认值
  resetWeights() {
    this.baseWeights = {
      tagSimilarity: 0.6,
      interactionScore: 0.4,
      contentPreferenceMatch: 0.15,
      randomFactor: 0.05
    };
  }
}

module.exports = DynamicWeightAdjuster;

