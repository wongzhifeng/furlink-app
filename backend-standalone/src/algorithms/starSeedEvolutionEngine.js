const { StarSeed, Interaction, User } = require('../models');
const redisService = require('../services/redisService');

/**
 * StarSeedEvolutionEngine - 星种演化引擎
 * 
 * 负责处理星种的光度演化、跃迁条件和生命周期管理
 * 
 * @class StarSeedEvolutionEngine
 * @version 1.0.0
 * @author FluLink Team
 * @since 2024-10-09
 */
class StarSeedEvolutionEngine {
  /**
   * 构造函数 - 初始化演化参数
   * 
   * @constructor
   * @description 设置星种演化的各种参数和权重
   */
  constructor() {
    // 演化参数配置
    this.evolutionParams = {
      initialLuminosity: parseInt(process.env.STARSEED_INITIAL_LUMINOSITY) || 10,
      jumpThreshold: parseInt(process.env.STARSEED_JUMP_THRESHOLD) || 70,
      luminosityDecayRate: parseFloat(process.env.STARSEED_LUMINOSITY_DECAY_RATE) || 0.05,
      maxLuminosity: 100,
      minLuminosity: 0
    };

    // 互动权重配置
    this.interactionWeights = {
      'like': 1,
      'comment': 3,
      'forward': 2,
      'view': 0.5,
      'share': 4,
      'bookmark': 1.5
    };

    // 时间衰减配置
    this.timeDecayConfig = {
      halfLife: 24, // 24小时半衰期
      maxAge: 168   // 最大7天
    };
  }

  /**
   * 星种演化主方法
   * 
   * @async
   * @method evolveStarSeed
   * @param {string} starSeedId - 星种ID
   * @param {Object} interaction - 新的互动对象（可选）
   * @returns {Promise<Object>} 演化后的星种数据
   * @throws {Error} 当星种不存在时抛出错误
   * @description 处理星种的完整演化流程，包括光度计算、时间衰减和跃迁检查
   */
  // 星种演化主方法 - 优化21: 增强输入验证
  async evolveStarSeed(starSeedId, interaction = null) {
    try {
      // 优化21: 增强输入验证
      if (!starSeedId || typeof starSeedId !== 'string') {
        throw new Error('星种ID必须是非空字符串');
      }

      // 优化21: 使用更高效的查询
      const starSeed = await StarSeed.findById(starSeedId)
        .populate('authorId', 'username tags')
        .lean(); // 使用lean()提高性能
      
      if (!starSeed) {
        throw new Error(`星种不存在: ${starSeedId}`);
      }

      // 优化3: 并行计算多个指标
      const [currentLuminosity, timeDecayedLuminosity] = await Promise.all([
        this.calculateCurrentLuminosity(starSeed),
        this.calculateTimeDecayedLuminosity(starSeed)
      ]);

      // 优化4: 处理新互动（如果有）
      let newLuminosity = timeDecayedLuminosity;
      if (interaction) {
        newLuminosity = await this.processInteraction(starSeed, interaction, timeDecayedLuminosity);
      }

      // 4. 更新光度
      starSeed.luminosity = Math.min(Math.max(newLuminosity, this.evolutionParams.minLuminosity), this.evolutionParams.maxLuminosity);

      // 5. 演化光谱
      await this.evolveSpectrum(starSeed, interaction);

      // 6. 检查跃迁条件
      const jumpEligible = await this.checkJumpEligibility(starSeed);

      // 7. 记录演化历史
      await this.recordEvolutionHistory(starSeed, {
        luminosity: starSeed.luminosity,
        spectrum: starSeed.spectrum,
        interaction: interaction,
        timestamp: new Date()
      });

      // 8. 保存星种
      await starSeed.save();

      // 9. 缓存更新
      await this.cacheStarSeedEvolution(starSeed);

      return {
        starSeed,
        evolution: {
          oldLuminosity: currentLuminosity,
          newLuminosity: starSeed.luminosity,
          luminosityChange: starSeed.luminosity - currentLuminosity,
          jumpEligible,
          spectrumEvolution: starSeed.spectrum
        }
      };
    } catch (error) {
      console.error('Error evolving star seed:', error);
      throw error;
    }
  }

  // 计算当前光度 - 优化22: 增强缓存策略和错误处理
  async calculateCurrentLuminosity(starSeed) {
    try {
      // 优化22: 增强缓存策略
      const cacheKey = `luminosity:${starSeed._id}`;
      const cachedLuminosity = await redisService.get(cacheKey);
      if (cachedLuminosity !== null) {
        return parseFloat(cachedLuminosity);
      }

      // 优化22: 并行计算多个光度因子
      const [baseLuminosity, interactionBoost, timeDecay, userInfluence, viralFactor] = await Promise.all([
        this.calculateBaseLuminosity(starSeed),
        this.calculateInteractionBoost(starSeed),
        this.calculateTimeDecay(starSeed),
        this.calculateUserInfluence(starSeed),
        this.calculateViralFactor(starSeed)
      ]);

      // 优化22: 智能权重组合
      const finalLuminosity = this.combineLuminosityFactors({
        base: baseLuminosity,
        interaction: interactionBoost,
        timeDecay: timeDecay,
        userInfluence: userInfluence,
        viral: viralFactor
      });

      // 优化22: 缓存结果
      await redisService.set(cacheKey, finalLuminosity.toString(), 1800);
      
      return Math.min(Math.max(finalLuminosity, this.evolutionParams.minLuminosity), this.evolutionParams.maxLuminosity);
    } catch (error) {
      console.error('Error calculating current luminosity:', error);
      return starSeed.luminosity || starSeed.initialLuminosity || this.evolutionParams.initialLuminosity;
    }
  }

  // 计算基础光度
  async calculateBaseLuminosity(starSeed) {
    try {
      // 基于内容质量和作者影响力的基础光度
      const author = await User.findById(starSeed.authorId).lean();
      const authorInfluence = author ? await this.calculateAuthorInfluence(author) : 0.5;
      
      const contentQuality = await this.calculateContentQuality(starSeed);
      
      return this.evolutionParams.initialLuminosity * (0.6 + authorInfluence * 0.4) * contentQuality;
    } catch (error) {
      console.error('Error calculating base luminosity:', error);
      return this.evolutionParams.initialLuminosity;
    }
  }

  // 计算互动提升
  async calculateInteractionBoost(starSeed) {
    try {
      const interactions = await Interaction.find({
        targetId: starSeed._id,
        targetType: 'starseed'
      }).sort({ createdAt: -1 });
      
      let boost = 0;
      const now = new Date();
      
      interactions.forEach(interaction => {
        const daysDiff = (now - interaction.createdAt) / (1000 * 60 * 60 * 24);
        const timeDecay = Math.exp(-daysDiff / this.timeDecayConfig.halfLife);
        
        const weight = this.interactionWeights[interaction.actionType] || 1;
        boost += weight * timeDecay;
      });

      return Math.min(boost, 50); // 最大提升50点
    } catch (error) {
      console.error('Error calculating interaction boost:', error);
      return 0;
    }
  }

  // 计算时间衰减
  async calculateTimeDecay(starSeed) {
    try {
      const now = new Date();
      const ageInHours = (now - starSeed.createdAt) / (1000 * 60 * 60);
      
      // 指数衰减
      const decayFactor = Math.exp(-ageInHours / this.timeDecayConfig.halfLife);
      
      return decayFactor;
    } catch (error) {
      console.error('Error calculating time decay:', error);
      return 1;
    }
  }

  // 计算用户影响力
  async calculateUserInfluence(starSeed) {
    try {
      const author = await User.findById(starSeed.authorId).lean();
      if (!author) return 0.5;

      // 基于用户活跃度、粉丝数、历史表现等计算影响力
      const userActivity = await this.calculateUserActivity(author);
      const userReputation = await this.calculateUserReputation(author);
      const userNetwork = await this.calculateUserNetwork(author);

      return (userActivity * 0.4) + (userReputation * 0.3) + (userNetwork * 0.3);
    } catch (error) {
      console.error('Error calculating user influence:', error);
      return 0.5;
    }
  }

  // 计算病毒因子
  async calculateViralFactor(starSeed) {
    try {
      // 基于传播速度和传播范围的病毒因子
      const propagationSpeed = await this.calculatePropagationSpeed(starSeed);
      const propagationRange = await this.calculatePropagationRange(starSeed);
      
      return (propagationSpeed * 0.6) + (propagationRange * 0.4);
    } catch (error) {
      console.error('Error calculating viral factor:', error);
      return 0.5;
    }
  }

  // 组合光度因子
  combineLuminosityFactors(factors) {
    try {
      // 智能权重组合
      const combined = (
        factors.base * 0.3 +
        factors.interaction * 0.25 +
        factors.timeDecay * 0.2 +
        factors.userInfluence * 0.15 +
        factors.viral * 0.1
      );

      return combined;
    } catch (error) {
      console.error('Error combining luminosity factors:', error);
      return factors.base;
    }
  }

  // 应用时间衰减
  applyTimeDecay(luminosity, createdAt) {
    try {
      const now = new Date();
      const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
      
      // 计算衰减因子
      const decayFactor = Math.exp(-hoursDiff / this.timeDecayConfig.halfLife);
      
      // 应用衰减
      const decayedLuminosity = luminosity * decayFactor;
      
      // 确保不低于初始光度
      return Math.max(decayedLuminosity, this.evolutionParams.initialLuminosity);
    } catch (error) {
      console.error('Error applying time decay:', error);
      return luminosity;
    }
  }

  // 处理新互动
  async processInteraction(starSeed, interaction, currentLuminosity) {
    try {
      const weight = this.interactionWeights[interaction.actionType] || 1;
      const timeDecay = this.calculateTimeDecayFactor(interaction.createdAt);
      
      // 计算互动贡献
      const interactionContribution = weight * timeDecay;
      
      // 应用共鸣影响
      const resonanceImpact = await this.calculateResonanceImpact(starSeed, interaction);
      
      // 计算最终光度增量
      const luminosityIncrement = interactionContribution * resonanceImpact;
      
      return currentLuminosity + luminosityIncrement;
    } catch (error) {
      console.error('Error processing interaction:', error);
      return currentLuminosity;
    }
  }

  // 计算时间衰减因子
  calculateTimeDecayFactor(createdAt) {
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    return Math.exp(-hoursDiff / this.timeDecayConfig.halfLife);
  }

  // 计算共鸣影响
  async calculateResonanceImpact(starSeed, interaction) {
    try {
      const author = starSeed.authorId;
      const interactor = await User.findById(interaction.userId);
      
      if (!interactor) return 1.0;

      // 计算作者与互动者的共鸣值
      const resonance = await this.calculateUserResonance(author, interactor);
      
      // 共鸣影响因子：共鸣值越高，影响越大
      return 1 + (resonance / 100) * 0.5; // 最多50%的共鸣加成
    } catch (error) {
      console.error('Error calculating resonance impact:', error);
      return 1.0;
    }
  }

  // 计算用户共鸣值（简化版本）
  async calculateUserResonance(userA, userB) {
    try {
      // 这里应该调用共鸣计算算法
      // 暂时返回一个基于标签相似度的简单计算
      const tagsA = userA.tags || [];
      const tagsB = userB.tags || [];
      
      if (tagsA.length === 0 || tagsB.length === 0) return 50;
      
      const intersection = tagsA.filter(tag => tagsB.includes(tag));
      const union = [...new Set([...tagsA, ...tagsB])];
      
      const similarity = intersection.length / union.length;
      return similarity * 100;
    } catch (error) {
      console.error('Error calculating user resonance:', error);
      return 50;
    }
  }

  // 演化光谱
  async evolveSpectrum(starSeed, interaction) {
    try {
      if (!interaction) return;

      const interactor = await User.findById(interaction.userId);
      if (!interactor) return;

      const interactorTags = interactor.tags || [];
      const currentSpectrum = starSeed.spectrum || new Map();

      // 根据互动类型调整光谱权重
      const adjustmentFactor = this.getSpectrumAdjustmentFactor(interaction.actionType);

      // 更新光谱权重
      interactorTags.forEach(tag => {
        const currentWeight = currentSpectrum.get(tag) || 0;
        const newWeight = currentWeight + adjustmentFactor;
        currentSpectrum.set(tag, Math.max(0, newWeight));
      });

      // 归一化光谱权重
      this.normalizeSpectrum(currentSpectrum);

      starSeed.spectrum = currentSpectrum;
    } catch (error) {
      console.error('Error evolving spectrum:', error);
    }
  }

  // 获取光谱调整因子
  getSpectrumAdjustmentFactor(actionType) {
    const factors = {
      'like': 0.1,
      'comment': 0.3,
      'forward': 0.2,
      'view': 0.05,
      'share': 0.4,
      'bookmark': 0.15
    };
    
    return factors[actionType] || 0.1;
  }

  // 归一化光谱
  normalizeSpectrum(spectrum) {
    try {
      const totalWeight = Array.from(spectrum.values()).reduce((sum, weight) => sum + weight, 0);
      
      if (totalWeight > 0) {
        for (const [tag, weight] of spectrum) {
          spectrum.set(tag, weight / totalWeight);
        }
      }
    } catch (error) {
      console.error('Error normalizing spectrum:', error);
    }
  }

  // 检查跃迁条件
  async checkJumpEligibility(starSeed) {
    try {
      // 检查光度是否达到跃迁阈值
      if (starSeed.luminosity < this.evolutionParams.jumpThreshold) {
        starSeed.jumpEligible = false;
        return false;
      }

      // 检查是否有足够的互动
      const interactionCount = await Interaction.countDocuments({
        targetId: starSeed._id,
        targetType: 'starseed'
      });

      if (interactionCount < 10) {
        starSeed.jumpEligible = false;
        return false;
      }

      // 检查互动多样性
      const interactionTypes = await Interaction.distinct('actionType', {
        targetId: starSeed._id,
        targetType: 'starseed'
      });

      if (interactionTypes.length < 3) {
        starSeed.jumpEligible = false;
        return false;
      }

      // 检查时间条件（至少存在24小时）
      const hoursSinceCreation = (new Date() - starSeed.createdAt) / (1000 * 60 * 60);
      if (hoursSinceCreation < 24) {
        starSeed.jumpEligible = false;
        return false;
      }

      starSeed.jumpEligible = true;
      return true;
    } catch (error) {
      console.error('Error checking jump eligibility:', error);
      return false;
    }
  }

  // 记录演化历史
  async recordEvolutionHistory(starSeed, evolutionData) {
    try {
      if (!starSeed.evolutionHistory) {
        starSeed.evolutionHistory = [];
      }

      starSeed.evolutionHistory.push({
        timestamp: evolutionData.timestamp,
        luminosity: evolutionData.luminosity,
        spectrum: evolutionData.spectrum ? new Map(evolutionData.spectrum) : new Map()
      });

      // 限制历史记录数量
      if (starSeed.evolutionHistory.length > 100) {
        starSeed.evolutionHistory = starSeed.evolutionHistory.slice(-100);
      }
    } catch (error) {
      console.error('Error recording evolution history:', error);
    }
  }

  // 缓存星种演化
  async cacheStarSeedEvolution(starSeed) {
    try {
      const evolutionData = {
        id: starSeed._id,
        luminosity: starSeed.luminosity,
        jumpEligible: starSeed.jumpEligible,
        spectrum: Object.fromEntries(starSeed.spectrum || new Map()),
        lastEvolution: new Date()
      };

      await redisService.cacheSeedHotness(starSeed._id, starSeed.luminosity);
    } catch (error) {
      console.error('Error caching star seed evolution:', error);
    }
  }

  // 批量演化星种
  async evolveBatchStarSeeds(starSeedIds) {
    try {
      const results = [];
      
      for (const starSeedId of starSeedIds) {
        try {
          const result = await this.evolveStarSeed(starSeedId);
          results.push({
            starSeedId,
            success: true,
            result
          });
        } catch (error) {
          results.push({
            starSeedId,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error evolving batch star seeds:', error);
      throw error;
    }
  }

  // 获取星种演化历史
  async getStarSeedEvolutionHistory(starSeedId, limit = 50) {
    try {
      const starSeed = await StarSeed.findById(starSeedId);
      if (!starSeed) {
        throw new Error('星种不存在');
      }

      return starSeed.evolutionHistory.slice(-limit);
    } catch (error) {
      console.error('Error getting star seed evolution history:', error);
      throw error;
    }
  }

  // 预测星种演化
  async predictStarSeedEvolution(starSeedId, timeHorizon = 24) {
    try {
      const starSeed = await StarSeed.findById(starSeedId);
      if (!starSeed) {
        throw new Error('星种不存在');
      }

      const currentLuminosity = starSeed.luminosity;
      const hoursAhead = timeHorizon;
      
      // 计算时间衰减后的光度
      const decayedLuminosity = this.applyTimeDecay(currentLuminosity, new Date());
      
      // 预测互动增长（基于历史趋势）
      const interactionGrowth = await this.predictInteractionGrowth(starSeedId, timeHorizon);
      
      // 预测最终光度
      const predictedLuminosity = decayedLuminosity + interactionGrowth;
      
      return {
        currentLuminosity,
        predictedLuminosity: Math.min(predictedLuminosity, this.evolutionParams.maxLuminosity),
        luminosityChange: predictedLuminosity - currentLuminosity,
        jumpEligible: predictedLuminosity >= this.evolutionParams.jumpThreshold,
        confidence: 0.7 // 预测置信度
      };
    } catch (error) {
      console.error('Error predicting star seed evolution:', error);
      throw error;
    }
  }

  // 预测互动增长
  async predictInteractionGrowth(starSeedId, timeHorizon) {
    try {
      const recentInteractions = await Interaction.find({
        targetId: starSeedId,
        targetType: 'starseed',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      const recentCount = recentInteractions.length;
      const hourlyRate = recentCount / 24;
      
      return hourlyRate * timeHorizon * 2; // 假设互动率会翻倍
    } catch (error) {
      console.error('Error predicting interaction growth:', error);
      return 0;
    }
  }

  // 清理过期星种
  async cleanupExpiredStarSeeds() {
    try {
      const maxAge = new Date(Date.now() - this.timeDecayConfig.maxAge * 60 * 60 * 1000);
      
      const expiredStarSeeds = await StarSeed.find({
        createdAt: { $lt: maxAge },
        luminosity: { $lt: this.evolutionParams.initialLuminosity }
      });

      let cleanedCount = 0;
      for (const starSeed of expiredStarSeeds) {
        // 检查是否还有活跃互动
        const recentInteractions = await Interaction.countDocuments({
          targetId: starSeed._id,
          targetType: 'starseed',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (recentInteractions === 0) {
          await StarSeed.findByIdAndDelete(starSeed._id);
          cleanedCount++;
        }
      }

      console.log(`Cleaned up ${cleanedCount} expired star seeds`);
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired star seeds:', error);
      throw error;
    }
  }

  // 获取星种演化统计
  async getStarSeedEvolutionStats(starSeedId) {
    try {
      const starSeed = await StarSeed.findById(starSeedId);
      if (!starSeed) {
        throw new Error('星种不存在');
      }

      const interactions = await Interaction.find({
        targetId: starSeedId,
        targetType: 'starseed'
      });

      const stats = {
        totalInteractions: interactions.length,
        interactionTypes: {},
        averageLuminosity: 0,
        maxLuminosity: 0,
        minLuminosity: starSeed.initialLuminosity,
        evolutionRate: 0,
        jumpEligible: starSeed.jumpEligible
      };

      // 统计互动类型
      interactions.forEach(interaction => {
        const type = interaction.actionType;
        stats.interactionTypes[type] = (stats.interactionTypes[type] || 0) + 1;
      });

      // 计算光度统计
      if (starSeed.evolutionHistory && starSeed.evolutionHistory.length > 0) {
        const luminosities = starSeed.evolutionHistory.map(h => h.luminosity);
        stats.averageLuminosity = luminosities.reduce((sum, l) => sum + l, 0) / luminosities.length;
        stats.maxLuminosity = Math.max(...luminosities);
        stats.minLuminosity = Math.min(...luminosities);
        
        // 计算演化率
        if (luminosities.length > 1) {
          const firstLuminosity = luminosities[0];
          const lastLuminosity = luminosities[luminosities.length - 1];
          stats.evolutionRate = (lastLuminosity - firstLuminosity) / firstLuminosity;
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting star seed evolution stats:', error);
      throw error;
    }
  }
}

  // 计算作者影响力
  async calculateAuthorInfluence(author) {
    try {
      const cacheKey = `author_influence:${author._id}`;
      const cachedInfluence = await redisService.get(cacheKey);
      if (cachedInfluence !== null) {
        return parseFloat(cachedInfluence);
      }

      // 基于作者的历史表现计算影响力
      const starSeedCount = await StarSeed.countDocuments({ authorId: author._id });
      const avgLuminosity = await this.calculateAuthorAvgLuminosity(author._id);
      const followerCount = author.followerCount || 0;
      
      const influence = Math.min(
        (starSeedCount * 0.1) + (avgLuminosity * 0.3) + (followerCount * 0.01),
        1
      );

      await redisService.set(cacheKey, influence.toString(), 3600);
      return influence;
    } catch (error) {
      console.error('Error calculating author influence:', error);
      return 0.5;
    }
  }

  // 计算内容质量
  async calculateContentQuality(starSeed) {
    try {
      let quality = 0.5; // 基础质量

      // 基于内容长度
      if (starSeed.content?.text) {
        const textLength = starSeed.content.text.length;
        if (textLength > 100) quality += 0.2;
        if (textLength > 500) quality += 0.1;
      }

      // 基于多媒体内容
      if (starSeed.content?.imageUrl) quality += 0.2;
      if (starSeed.content?.audioUrl) quality += 0.1;

      // 基于标签数量
      if (starSeed.tags && starSeed.tags.length > 0) {
        quality += Math.min(starSeed.tags.length * 0.05, 0.2);
      }

      return Math.min(quality, 1);
    } catch (error) {
      console.error('Error calculating content quality:', error);
      return 0.5;
    }
  }

  // 计算用户活跃度
  async calculateUserActivity(user) {
    try {
      const now = new Date();
      const daysSinceCreation = (now - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceLastActive = user.lastActiveAt ? 
        (now - new Date(user.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24) : daysSinceCreation;

      return Math.max(0, 1 - (daysSinceLastActive / 30));
    } catch (error) {
      console.error('Error calculating user activity:', error);
      return 0.5;
    }
  }

  // 计算用户声誉
  async calculateUserReputation(user) {
    try {
      const starSeedCount = await StarSeed.countDocuments({ authorId: user._id });
      const avgLuminosity = await this.calculateAuthorAvgLuminosity(user._id);
      
      return Math.min((starSeedCount * 0.1) + (avgLuminosity * 0.3), 1);
    } catch (error) {
      console.error('Error calculating user reputation:', error);
      return 0.5;
    }
  }

  // 计算用户网络
  async calculateUserNetwork(user) {
    try {
      const followerCount = user.followerCount || 0;
      const followingCount = user.followingCount || 0;
      
      return Math.min((followerCount + followingCount) * 0.01, 1);
    } catch (error) {
      console.error('Error calculating user network:', error);
      return 0.5;
    }
  }

  // 计算传播速度
  async calculatePropagationSpeed(starSeed) {
    try {
      const interactions = await Interaction.find({
        targetId: starSeed._id,
        targetType: 'starseed'
      }).sort({ createdAt: 1 });

      if (interactions.length < 2) return 0.1;

      const firstInteraction = interactions[0];
      const lastInteraction = interactions[interactions.length - 1];
      
      const timeSpan = (lastInteraction.createdAt - firstInteraction.createdAt) / (1000 * 60 * 60);
      const speed = interactions.length / Math.max(timeSpan, 1);
      
      return Math.min(speed / 10, 1); // 归一化
    } catch (error) {
      console.error('Error calculating propagation speed:', error);
      return 0.1;
    }
  }

  // 计算传播范围
  async calculatePropagationRange(starSeed) {
    try {
      const interactions = await Interaction.find({
        targetId: starSeed._id,
        targetType: 'starseed'
      });

      const uniqueUsers = new Set(interactions.map(i => i.userId));
      return Math.min(uniqueUsers.size / 100, 1); // 归一化
    } catch (error) {
      console.error('Error calculating propagation range:', error);
      return 0.1;
    }
  }

  // 计算作者平均光度
  async calculateAuthorAvgLuminosity(authorId) {
    try {
      const starSeeds = await StarSeed.find({ authorId });
      if (starSeeds.length === 0) return 0;

      const totalLuminosity = starSeeds.reduce((sum, seed) => sum + (seed.luminosity || 0), 0);
      return totalLuminosity / starSeeds.length;
    } catch (error) {
      console.error('Error calculating author avg luminosity:', error);
      return 0;
    }
  }
}

module.exports = StarSeedEvolutionEngine;

