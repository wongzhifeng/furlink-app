const { Interaction, User, StarSeed } = require('../models');

class InteractionHistoryCalculator {
  constructor() {
    // 互动类型权重
    this.actionWeights = {
      'like': 1,
      'comment': 5,
      'forward': 3,
      'view': 0.5,
      'share': 4,
      'bookmark': 2
    };

    // 时间衰减配置
    this.timeDecayConfig = {
      halfLife: 30, // 30天半衰期
      maxAge: 365   // 最大365天
    };

    // 互动频率权重
    this.frequencyWeights = {
      'daily': 1.2,
      'weekly': 1.0,
      'monthly': 0.8,
      'rarely': 0.6
    };
  }

  // 计算用户间的互动历史得分 - 优化11: 添加输入验证和缓存
  async calculateInteractionScore(userAId, userBId) {
    try {
      // 优化11: 输入验证
      if (!userAId || !userBId) {
        return 0.1;
      }

      // 优化11: 添加缓存检查
      const cacheKey = `interaction_score:${userAId}:${userBId}`;
      // 这里可以添加Redis缓存检查

      // 获取双向互动记录
      const interactions = await this.getUserInteractions(userAId, userBId);
      
      if (interactions.length === 0) {
        return 0.1; // 没有互动时给低分
      }

      // 计算基础得分
      const baseScore = this.calculateBaseScore(interactions);
      
      // 应用时间衰减
      const timeDecayedScore = this.applyTimeDecay(baseScore, interactions);
      
      // 应用频率权重
      const frequencyWeightedScore = await this.applyFrequencyWeight(timeDecayedScore, userAId, userBId);
      
      // 应用互动模式权重
      const patternWeightedScore = this.applyPatternWeight(frequencyWeightedScore, interactions);
      
      // 归一化到0-1范围
      const normalizedScore = this.normalizeScore(patternWeightedScore);
      
      return Math.min(normalizedScore, 1.0);
    } catch (error) {
      console.error('Error calculating interaction score:', error);
      return 0.1;
    }
  }

  // 获取用户间的互动记录 - 优化12: 优化数据库查询
  async getUserInteractions(userAId, userBId) {
    try {
      // 优化12: 添加输入验证
      if (!userAId || !userBId) {
        return [];
      }

      const interactions = await Interaction.find({
        $or: [
          { userId: userAId, targetId: userBId },
          { userId: userBId, targetId: userAId }
        ]
      })
      .populate('targetId', 'nickname')
      .sort({ createdAt: -1 })
      .limit(100); // 优化12: 限制查询结果数量

      return interactions;
    } catch (error) {
      console.error('Error getting user interactions:', error);
      return [];
    }
  }

  // 计算基础得分
  calculateBaseScore(interactions) {
    let score = 0;
    
    interactions.forEach(interaction => {
      const weight = this.actionWeights[interaction.actionType] || 1;
      score += weight;
    });

    return score;
  }

  // 应用时间衰减
  applyTimeDecay(baseScore, interactions) {
    const now = new Date();
    let decayedScore = 0;

    interactions.forEach(interaction => {
      const daysDiff = (now - interaction.createdAt) / (1000 * 60 * 60 * 24);
      
      // 计算衰减因子
      const decayFactor = Math.exp(-daysDiff / this.timeDecayConfig.halfLife);
      
      // 应用衰减
      const weight = this.actionWeights[interaction.actionType] || 1;
      decayedScore += weight * decayFactor;
    });

    return decayedScore;
  }

  // 应用频率权重
  async applyFrequencyWeight(score, userAId, userBId) {
    try {
      const frequency = await this.calculateInteractionFrequency(userAId, userBId);
      const frequencyWeight = this.frequencyWeights[frequency] || 1.0;
      
      return score * frequencyWeight;
    } catch (error) {
      console.error('Error applying frequency weight:', error);
      return score;
    }
  }

  // 计算互动频率
  async calculateInteractionFrequency(userAId, userBId) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const recentInteractions = await Interaction.countDocuments({
        $or: [
          { userId: userAId, targetId: userBId },
          { userId: userBId, targetId: userAId }
        ],
        createdAt: { $gte: thirtyDaysAgo }
      });

      if (recentInteractions >= 20) {
        return 'daily';
      } else if (recentInteractions >= 5) {
        return 'weekly';
      } else if (recentInteractions >= 1) {
        return 'monthly';
      } else {
        return 'rarely';
      }
    } catch (error) {
      console.error('Error calculating interaction frequency:', error);
      return 'rarely';
    }
  }

  // 应用互动模式权重
  applyPatternWeight(score, interactions) {
    const patterns = this.analyzeInteractionPatterns(interactions);
    let patternWeight = 1.0;

    // 互惠性权重
    if (patterns.isReciprocal) {
      patternWeight *= 1.3;
    }

    // 多样性权重
    if (patterns.isDiverse) {
      patternWeight *= 1.2;
    }

    // 持续性权重
    if (patterns.isConsistent) {
      patternWeight *= 1.1;
    }

    return score * patternWeight;
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
    const userAInteractions = interactions.filter(i => i.userId.toString() === interactions[0].userId.toString());
    const userBInteractions = interactions.filter(i => i.userId.toString() !== interactions[0].userId.toString());
    
    patterns.isReciprocal = userAInteractions.length > 0 && userBInteractions.length > 0;

    // 检查多样性
    const actionTypes = new Set(interactions.map(i => i.actionType));
    patterns.isDiverse = actionTypes.size >= 3;

    // 检查持续性
    const timeSpan = (interactions[0].createdAt - interactions[interactions.length - 1].createdAt) / (1000 * 60 * 60 * 24);
    patterns.isConsistent = timeSpan >= 7; // 至少持续一周

    return patterns;
  }

  // 归一化得分
  normalizeScore(score) {
    // 使用对数函数进行归一化
    const maxPossibleScore = 100; // 假设最大可能得分
    return Math.log(1 + score) / Math.log(1 + maxPossibleScore);
  }

  // 获取用户互动统计
  async getUserInteractionStats(userId) {
    try {
      const stats = await Interaction.aggregate([
        {
          $match: {
            userId: userId
          }
        },
        {
          $group: {
            _id: '$actionType',
            count: { $sum: 1 },
            avgResonanceImpact: { $avg: '$resonanceImpact' }
          }
        }
      ]);

      const totalInteractions = await Interaction.countDocuments({ userId: userId });
      const uniqueTargets = await Interaction.distinct('targetId', { userId: userId });

      return {
        totalInteractions,
        uniqueTargets: uniqueTargets.length,
        actionBreakdown: stats,
        averageResonanceImpact: stats.reduce((sum, stat) => sum + stat.avgResonanceImpact, 0) / stats.length || 0
      };
    } catch (error) {
      console.error('Error getting user interaction stats:', error);
      throw error;
    }
  }

  // 获取用户互动历史
  async getUserInteractionHistory(userId, limit = 50) {
    try {
      const history = await Interaction.find({ userId: userId })
        .populate('targetId', 'nickname avatar')
        .sort({ createdAt: -1 })
        .limit(limit);

      return history;
    } catch (error) {
      console.error('Error getting user interaction history:', error);
      throw error;
    }
  }

  // 计算互动影响力
  async calculateInteractionInfluence(userId) {
    try {
      const interactions = await Interaction.find({ userId: userId });
      
      let totalInfluence = 0;
      let influenceCount = 0;

      for (const interaction of interactions) {
        if (interaction.resonanceImpact) {
          totalInfluence += interaction.resonanceImpact;
          influenceCount++;
        }
      }

      return influenceCount > 0 ? totalInfluence / influenceCount : 0;
    } catch (error) {
      console.error('Error calculating interaction influence:', error);
      return 0;
    }
  }

  // 预测互动概率
  async predictInteractionProbability(userAId, userBId) {
    try {
      const interactionScore = await this.calculateInteractionScore(userAId, userBId);
      const frequency = await this.calculateInteractionFrequency(userAId, userBId);
      
      // 基于历史得分和频率预测概率
      const baseProbability = interactionScore;
      const frequencyMultiplier = this.frequencyWeights[frequency] || 1.0;
      
      return Math.min(baseProbability * frequencyMultiplier, 1.0);
    } catch (error) {
      console.error('Error predicting interaction probability:', error);
      return 0.1;
    }
  }

  // 清理过期互动记录
  async cleanupExpiredInteractions() {
    try {
      const maxAge = new Date(Date.now() - this.timeDecayConfig.maxAge * 24 * 60 * 60 * 1000);
      
      const result = await Interaction.deleteMany({
        createdAt: { $lt: maxAge }
      });

      console.log(`Cleaned up ${result.deletedCount} expired interactions`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired interactions:', error);
      throw error;
    }
  }

  // 更新互动影响因子
  updateInteractionImpact(interactionId, impact) {
    return Interaction.findByIdAndUpdate(
      interactionId,
      { resonanceImpact: impact },
      { new: true }
    );
  }
}

module.exports = InteractionHistoryCalculator;

