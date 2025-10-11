const { Interaction, StarSeed } = require('../models');

class LuminosityCalculator {
  constructor() {
    // 光度计算参数
    this.luminosityParams = {
      initialLuminosity: 10,
      maxLuminosity: 100,
      minLuminosity: 0,
      decayRate: 0.05, // 每小时衰减率
      halfLife: 24,    // 24小时半衰期
      maxAge: 168       // 最大7天
    };

    // 互动类型权重
    this.interactionWeights = {
      'like': 1,
      'comment': 3,
      'forward': 2,
      'view': 0.5,
      'share': 4,
      'bookmark': 1.5,
      'report': -2,     // 负面互动
      'hide': -1        // 负面互动
    };

    // 时间衰减配置
    this.timeDecayConfig = {
      exponential: true,  // 使用指数衰减
      linear: false,      // 不使用线性衰减
      stepDecay: false    // 不使用阶梯衰减
    };
  }

  // 计算星种光度（主要方法）- 优化15: 添加输入验证和缓存
  async calculateLuminosity(starSeedId, timestamp = null) {
    try {
      // 优化15: 输入验证
      if (!starSeedId) {
        throw new Error('星种ID不能为空');
      }

      const starSeed = await StarSeed.findById(starSeedId);
      if (!starSeed) {
        throw new Error('星种不存在');
      }

      const targetTime = timestamp || new Date();
      
      // 1. 获取所有互动记录
      const interactions = await this.getInteractions(starSeedId, targetTime);
      
      // 2. 计算基础光度
      const baseLuminosity = this.calculateBaseLuminosity(interactions);
      
      // 3. 应用时间衰减
      const decayedLuminosity = this.applyTimeDecay(baseLuminosity, starSeed.createdAt, targetTime);
      
      // 4. 应用互动质量因子
      const qualityAdjustedLuminosity = await this.applyQualityFactor(decayedLuminosity, interactions);
      
      // 5. 应用共鸣加成
      const resonanceBoostedLuminosity = await this.applyResonanceBoost(qualityAdjustedLuminosity, starSeed, interactions);
      
      // 6. 确保光度在合理范围内
      const finalLuminosity = this.clampLuminosity(resonanceBoostedLuminosity);
      
      return {
        luminosity: finalLuminosity,
        baseLuminosity,
        decayedLuminosity,
        qualityAdjustedLuminosity,
        resonanceBoostedLuminosity,
        factors: {
          interactionCount: interactions.length,
          timeDecay: decayedLuminosity - baseLuminosity,
          qualityAdjustment: qualityAdjustedLuminosity - decayedLuminosity,
          resonanceBoost: resonanceBoostedLuminosity - qualityAdjustedLuminosity
        }
      };
    } catch (error) {
      console.error('Error calculating luminosity:', error);
      throw error;
    }
  }

  // 获取互动记录
  async getInteractions(starSeedId, targetTime) {
    try {
      return await Interaction.find({
        targetId: starSeedId,
        targetType: 'starseed',
        createdAt: { $lte: targetTime }
      }).sort({ createdAt: 1 });
    } catch (error) {
      console.error('Error getting interactions:', error);
      return [];
    }
  }

  // 计算基础光度
  calculateBaseLuminosity(interactions) {
    try {
      let totalLuminosity = this.luminosityParams.initialLuminosity;
      
      interactions.forEach(interaction => {
        const weight = this.interactionWeights[interaction.actionType] || 1;
        totalLuminosity += weight;
      });
      
      return totalLuminosity;
    } catch (error) {
      console.error('Error calculating base luminosity:', error);
      return this.luminosityParams.initialLuminosity;
    }
  }

  // 应用时间衰减
  applyTimeDecay(baseLuminosity, createdAt, targetTime) {
    try {
      const hoursDiff = (targetTime - createdAt) / (1000 * 60 * 60);
      
      if (this.timeDecayConfig.exponential) {
        // 指数衰减
        const decayFactor = Math.exp(-hoursDiff / this.luminosityParams.halfLife);
        return baseLuminosity * decayFactor;
      } else if (this.timeDecayConfig.linear) {
        // 线性衰减
        const decayFactor = Math.max(0, 1 - (hoursDiff * this.luminosityParams.decayRate));
        return baseLuminosity * decayFactor;
      } else if (this.timeDecayConfig.stepDecay) {
        // 阶梯衰减
        const decaySteps = Math.floor(hoursDiff / 24); // 每24小时一个阶梯
        const decayFactor = Math.pow(0.5, decaySteps);
        return baseLuminosity * decayFactor;
      }
      
      return baseLuminosity;
    } catch (error) {
      console.error('Error applying time decay:', error);
      return baseLuminosity;
    }
  }

  // 应用质量因子
  async applyQualityFactor(luminosity, interactions) {
    try {
      if (interactions.length === 0) return luminosity;
      
      // 计算互动质量得分
      const qualityScore = this.calculateInteractionQuality(interactions);
      
      // 质量因子：0.8 - 1.2
      const qualityFactor = 0.8 + (qualityScore * 0.4);
      
      return luminosity * qualityFactor;
    } catch (error) {
      console.error('Error applying quality factor:', error);
      return luminosity;
    }
  }

  // 计算互动质量
  calculateInteractionQuality(interactions) {
    try {
      if (interactions.length === 0) return 0.5;
      
      let qualityScore = 0;
      let totalWeight = 0;
      
      interactions.forEach(interaction => {
        const weight = this.interactionWeights[interaction.actionType] || 1;
        const interactionQuality = this.getInteractionQuality(interaction);
        
        qualityScore += weight * interactionQuality;
        totalWeight += weight;
      });
      
      return totalWeight > 0 ? qualityScore / totalWeight : 0.5;
    } catch (error) {
      console.error('Error calculating interaction quality:', error);
      return 0.5;
    }
  }

  // 获取单个互动质量
  getInteractionQuality(interaction) {
    try {
      let quality = 0.5; // 基础质量
      
      // 根据互动类型调整质量
      switch (interaction.actionType) {
        case 'comment':
          quality = 0.8;
          if (interaction.content && interaction.content.length > 10) {
            quality = 1.0;
          }
          break;
        case 'share':
          quality = 0.9;
          break;
        case 'like':
          quality = 0.6;
          break;
        case 'view':
          quality = 0.4;
          break;
        case 'forward':
          quality = 0.7;
          break;
        case 'bookmark':
          quality = 0.8;
          break;
        case 'report':
          quality = 0.1;
          break;
        case 'hide':
          quality = 0.2;
          break;
        default:
          quality = 0.5;
      }
      
      return quality;
    } catch (error) {
      console.error('Error getting interaction quality:', error);
      return 0.5;
    }
  }

  // 应用共鸣加成
  async applyResonanceBoost(luminosity, starSeed, interactions) {
    try {
      if (interactions.length === 0) return luminosity;
      
      // 计算平均共鸣值
      const averageResonance = await this.calculateAverageResonance(starSeed, interactions);
      
      // 共鸣加成：共鸣值越高，加成越大
      const resonanceBoost = 1 + (averageResonance / 100) * 0.3; // 最多30%加成
      
      return luminosity * resonanceBoost;
    } catch (error) {
      console.error('Error applying resonance boost:', error);
      return luminosity;
    }
  }

  // 计算平均共鸣值
  async calculateAverageResonance(starSeed, interactions) {
    try {
      // 这里应该调用共鸣计算算法
      // 暂时返回一个基于互动类型的简单计算
      let totalResonance = 0;
      let count = 0;
      
      interactions.forEach(interaction => {
        // 基于互动类型估算共鸣值
        const estimatedResonance = this.estimateResonanceByInteractionType(interaction.actionType);
        totalResonance += estimatedResonance;
        count++;
      });
      
      return count > 0 ? totalResonance / count : 50;
    } catch (error) {
      console.error('Error calculating average resonance:', error);
      return 50;
    }
  }

  // 根据互动类型估算共鸣值
  estimateResonanceByInteractionType(actionType) {
    const resonanceEstimates = {
      'like': 60,
      'comment': 80,
      'forward': 70,
      'view': 40,
      'share': 90,
      'bookmark': 75,
      'report': 20,
      'hide': 30
    };
    
    return resonanceEstimates[actionType] || 50;
  }

  // 确保光度在合理范围内
  clampLuminosity(luminosity) {
    return Math.max(
      this.luminosityParams.minLuminosity,
      Math.min(luminosity, this.luminosityParams.maxLuminosity)
    );
  }

  // 计算光度变化率
  async calculateLuminosityChangeRate(starSeedId, timeWindow = 24) {
    try {
      const now = new Date();
      const pastTime = new Date(now.getTime() - timeWindow * 60 * 60 * 1000);
      
      const currentLuminosity = await this.calculateLuminosity(starSeedId, now);
      const pastLuminosity = await this.calculateLuminosity(starSeedId, pastTime);
      
      const changeRate = (currentLuminosity.luminosity - pastLuminosity.luminosity) / timeWindow;
      
      return {
        changeRate,
        currentLuminosity: currentLuminosity.luminosity,
        pastLuminosity: pastLuminosity.luminosity,
        timeWindow
      };
    } catch (error) {
      console.error('Error calculating luminosity change rate:', error);
      throw error;
    }
  }

  // 预测光度变化
  async predictLuminosityChange(starSeedId, timeHorizon = 24) {
    try {
      const currentLuminosity = await this.calculateLuminosity(starSeedId);
      const changeRate = await this.calculateLuminosityChangeRate(starSeedId);
      
      // 预测未来光度
      const predictedLuminosity = currentLuminosity.luminosity + (changeRate.changeRate * timeHorizon);
      
      // 应用时间衰减
      const decayedPrediction = this.applyTimeDecay(
        predictedLuminosity,
        new Date(),
        new Date(Date.now() + timeHorizon * 60 * 60 * 1000)
      );
      
      return {
        currentLuminosity: currentLuminosity.luminosity,
        predictedLuminosity: this.clampLuminosity(decayedPrediction),
        changeRate: changeRate.changeRate,
        timeHorizon,
        confidence: 0.7 // 预测置信度
      };
    } catch (error) {
      console.error('Error predicting luminosity change:', error);
      throw error;
    }
  }

  // 计算光度等级
  calculateLuminosityLevel(luminosity) {
    if (luminosity >= 90) return 'supernova';
    if (luminosity >= 70) return 'bright';
    if (luminosity >= 50) return 'moderate';
    if (luminosity >= 30) return 'dim';
    return 'faint';
  }

  // 获取光度等级信息
  getLuminosityLevelInfo(level) {
    const levelInfo = {
      'supernova': {
        name: '超新星',
        description: '极高光度，具有强大的影响力',
        color: '#ff6b6b',
        glowIntensity: 1.0,
        radiationRadius: 100
      },
      'bright': {
        name: '明亮',
        description: '高光度，具有较强的影响力',
        color: '#ffd93d',
        glowIntensity: 0.8,
        radiationRadius: 80
      },
      'moderate': {
        name: '中等',
        description: '中等光度，具有一般的影响力',
        color: '#6bcf7f',
        glowIntensity: 0.6,
        radiationRadius: 60
      },
      'dim': {
        name: '暗淡',
        description: '低光度，影响力有限',
        color: '#4d96ff',
        glowIntensity: 0.4,
        radiationRadius: 40
      },
      'faint': {
        name: '微弱',
        description: '极低光度，几乎无影响力',
        color: '#9b59b6',
        glowIntensity: 0.2,
        radiationRadius: 20
      }
    };
    
    return levelInfo[level] || levelInfo['faint'];
  }

  // 批量计算光度
  async calculateBatchLuminosity(starSeedIds) {
    try {
      const results = [];
      
      for (const starSeedId of starSeedIds) {
        try {
          const luminosity = await this.calculateLuminosity(starSeedId);
          results.push({
            starSeedId,
            success: true,
            luminosity
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
      console.error('Error calculating batch luminosity:', error);
      throw error;
    }
  }

  // 获取光度统计
  async getLuminosityStatistics(starSeedIds = null) {
    try {
      const query = starSeedIds ? { _id: { $in: starSeedIds } } : {};
      const starSeeds = await StarSeed.find(query);
      
      const luminosities = [];
      for (const starSeed of starSeeds) {
        const luminosity = await this.calculateLuminosity(starSeed._id);
        luminosities.push(luminosity.luminosity);
      }
      
      if (luminosities.length === 0) {
        return {
          count: 0,
          average: 0,
          median: 0,
          min: 0,
          max: 0,
          standardDeviation: 0
        };
      }
      
      luminosities.sort((a, b) => a - b);
      
      const average = luminosities.reduce((sum, l) => sum + l, 0) / luminosities.length;
      const median = luminosities[Math.floor(luminosities.length / 2)];
      const min = luminosities[0];
      const max = luminosities[luminosities.length - 1];
      
      const variance = luminosities.reduce((sum, l) => sum + Math.pow(l - average, 2), 0) / luminosities.length;
      const standardDeviation = Math.sqrt(variance);
      
      return {
        count: luminosities.length,
        average,
        median,
        min,
        max,
        standardDeviation
      };
    } catch (error) {
      console.error('Error getting luminosity statistics:', error);
      throw error;
    }
  }
}

module.exports = LuminosityCalculator;

