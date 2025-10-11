const { StarSeed, Interaction, User } = require('../models');

class SpectrumEvolutionEngine {
  constructor() {
    // 光谱演化参数
    this.evolutionParams = {
      maxSpectrumWeight: 1.0,
      minSpectrumWeight: 0.01,
      learningRate: 0.1,
      decayRate: 0.05,
      maxTags: 20,
      minTags: 3
    };

    // 标签分类
    this.tagCategories = {
      'lifestyle': ['旅行', '美食', '时尚', '咖啡', '茶', '酒', '烹饪', '健身', '瑜伽'],
      'entertainment': ['音乐', '电影', '游戏', '读书', '摄影', '艺术'],
      'tech': ['科技', '编程', 'AI', '区块链', 'VR', 'AR'],
      'health': ['运动', '健身', '瑜伽', '冥想', '养生', '医疗'],
      'creative': ['摄影', '艺术', '手工', '园艺', '设计', '写作'],
      'social': ['社交', '聚会', '活动', '志愿者', '公益'],
      'education': ['学习', '读书', '课程', '培训', '技能'],
      'business': ['创业', '投资', '理财', '职场', '管理']
    };

    // 互动类型对光谱的影响权重
    this.interactionSpectrumWeights = {
      'like': 0.1,
      'comment': 0.3,
      'forward': 0.2,
      'view': 0.05,
      'share': 0.4,
      'bookmark': 0.15,
      'report': -0.2,
      'hide': -0.1
    };
  }

  // 光谱演化主方法 - 优化19: 添加输入验证和错误处理
  async evolveSpectrum(starSeedId, interaction = null) {
    try {
      // 优化19: 输入验证
      if (!starSeedId) {
        throw new Error('星种ID不能为空');
      }

      const starSeed = await StarSeed.findById(starSeedId).populate('authorId');
      if (!starSeed) {
        throw new Error('星种不存在');
      }

      let currentSpectrum = starSeed.spectrum || new Map();
      
      // 1. 应用时间衰减
      currentSpectrum = this.applyTimeDecay(currentSpectrum, starSeed.createdAt);
      
      // 2. 处理新互动（如果有）
      if (interaction) {
        currentSpectrum = await this.processInteractionSpectrum(currentSpectrum, interaction);
      }
      
      // 3. 应用用户偏好学习
      currentSpectrum = await this.applyUserPreferenceLearning(currentSpectrum, starSeed);
      
      // 4. 归一化光谱
      currentSpectrum = this.normalizeSpectrum(currentSpectrum);
      
      // 5. 修剪低权重标签
      currentSpectrum = this.pruneLowWeightTags(currentSpectrum);
      
      // 6. 更新星种光谱
      starSeed.spectrum = currentSpectrum;
      
      // 7. 记录光谱演化历史
      await this.recordSpectrumEvolution(starSeed, currentSpectrum, interaction);
      
      // 8. 保存星种
      await starSeed.save();
      
      return {
        starSeed,
        spectrum: currentSpectrum,
        evolution: {
          oldSpectrum: starSeed.spectrum,
          newSpectrum: currentSpectrum,
          changes: this.calculateSpectrumChanges(starSeed.spectrum, currentSpectrum)
        }
      };
    } catch (error) {
      console.error('Error evolving spectrum:', error);
      throw error;
    }
  }

  // 应用时间衰减 - 优化版本
  applyTimeDecay(spectrum, createdAt) {
    try {
      const now = new Date();
      const timeDiff = now - createdAt;
      
      // 优化1: 使用更精确的时间计算
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      const daysDiff = hoursDiff / 24;
      
      const decayedSpectrum = new Map();
      
      // 优化2: 使用分段衰减函数，更符合实际衰减规律
      for (const [tag, weight] of spectrum) {
        let decayFactor;
        
        if (daysDiff <= 1) {
          // 24小时内：线性衰减
          decayFactor = 1 - (hoursDiff * 0.02);
        } else if (daysDiff <= 7) {
          // 1-7天：指数衰减
          decayFactor = Math.exp(-(daysDiff - 1) * this.evolutionParams.decayRate);
        } else {
          // 7天以上：对数衰减，减缓衰减速度
          decayFactor = Math.exp(-7 * this.evolutionParams.decayRate) * 
                       Math.pow(0.95, daysDiff - 7);
        }
        
        // 优化3: 考虑标签类型的影响
        const tagDecayMultiplier = this.getTagDecayMultiplier(tag);
        const adjustedDecayFactor = Math.max(0.1, decayFactor * tagDecayMultiplier);
        
        const newWeight = weight * adjustedDecayFactor;
        
        // 优化4: 动态调整最小权重阈值
        const dynamicMinWeight = this.calculateDynamicMinWeight(spectrum.size);
        
        if (newWeight > dynamicMinWeight) {
          decayedSpectrum.set(tag, newWeight);
        }
      }
      
      // 优化5: 确保衰减后的光谱仍然有意义
      return this.ensureSpectrumValidity(decayedSpectrum, spectrum);
    } catch (error) {
      console.error('Error applying time decay:', error);
      return spectrum;
    }
  }

  // 处理互动光谱 - 优化20: 优化数据库查询和错误处理
  async processInteractionSpectrum(spectrum, interaction) {
    try {
      // 优化20: 输入验证
      if (!interaction || !interaction.userId) {
        return spectrum;
      }

      const interactor = await User.findById(interaction.userId).lean();
      if (!interactor) return spectrum;
      
      const interactorTags = interactor.tags || [];
      const interactionWeight = this.interactionSpectrumWeights[interaction.actionType] || 0.1;
      
      const updatedSpectrum = new Map(spectrum);
      
      // 更新互动者标签的权重
      interactorTags.forEach(tag => {
        const currentWeight = updatedSpectrum.get(tag) || 0;
        const newWeight = currentWeight + interactionWeight;
        updatedSpectrum.set(tag, Math.max(0, newWeight));
      });
      
      return updatedSpectrum;
    } catch (error) {
      console.error('Error processing interaction spectrum:', error);
      return spectrum;
    }
  }

  // 应用用户偏好学习
  async applyUserPreferenceLearning(spectrum, starSeed) {
    try {
      const author = starSeed.authorId;
      if (!author) return spectrum;
      
      const authorTags = author.tags || [];
      const authorPreferences = author.contentPreferences || new Map();
      
      const learnedSpectrum = new Map(spectrum);
      
      // 基于作者标签调整光谱
      authorTags.forEach(tag => {
        const currentWeight = learnedSpectrum.get(tag) || 0;
        const authorPreference = authorPreferences.get(tag) || 0.5;
        const learningAdjustment = authorPreference * this.evolutionParams.learningRate;
        
        learnedSpectrum.set(tag, currentWeight + learningAdjustment);
      });
      
      // 基于作者内容偏好调整光谱
      for (const [tag, preference] of authorPreferences) {
        const currentWeight = learnedSpectrum.get(tag) || 0;
        const learningAdjustment = preference * this.evolutionParams.learningRate * 0.5;
        
        learnedSpectrum.set(tag, currentWeight + learningAdjustment);
      }
      
      return learnedSpectrum;
    } catch (error) {
      console.error('Error applying user preference learning:', error);
      return spectrum;
    }
  }

  // 归一化光谱
  normalizeSpectrum(spectrum) {
    try {
      const totalWeight = Array.from(spectrum.values()).reduce((sum, weight) => sum + weight, 0);
      
      if (totalWeight <= 0) return spectrum;
      
      const normalizedSpectrum = new Map();
      
      for (const [tag, weight] of spectrum) {
        const normalizedWeight = weight / totalWeight;
        normalizedSpectrum.set(tag, normalizedWeight);
      }
      
      return normalizedSpectrum;
    } catch (error) {
      console.error('Error normalizing spectrum:', error);
      return spectrum;
    }
  }

  // 修剪低权重标签
  pruneLowWeightTags(spectrum) {
    try {
      const prunedSpectrum = new Map();
      
      for (const [tag, weight] of spectrum) {
        if (weight >= this.evolutionParams.minSpectrumWeight) {
          prunedSpectrum.set(tag, weight);
        }
      }
      
      // 确保至少保留最小数量的标签
      if (prunedSpectrum.size < this.evolutionParams.minTags) {
        const sortedTags = Array.from(spectrum.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, this.evolutionParams.minTags);
        
        prunedSpectrum.clear();
        sortedTags.forEach(([tag, weight]) => {
          prunedSpectrum.set(tag, weight);
        });
      }
      
      // 限制最大标签数量
      if (prunedSpectrum.size > this.evolutionParams.maxTags) {
        const sortedTags = Array.from(prunedSpectrum.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, this.evolutionParams.maxTags);
        
        prunedSpectrum.clear();
        sortedTags.forEach(([tag, weight]) => {
          prunedSpectrum.set(tag, weight);
        });
      }
      
      return prunedSpectrum;
    } catch (error) {
      console.error('Error pruning low weight tags:', error);
      return spectrum;
    }
  }

  // 计算光谱变化
  calculateSpectrumChanges(oldSpectrum, newSpectrum) {
    try {
      const changes = {
        addedTags: [],
        removedTags: [],
        weightChanges: [],
        totalChange: 0
      };
      
      const allTags = new Set([...oldSpectrum.keys(), ...newSpectrum.keys()]);
      
      allTags.forEach(tag => {
        const oldWeight = oldSpectrum.get(tag) || 0;
        const newWeight = newSpectrum.get(tag) || 0;
        const change = newWeight - oldWeight;
        
        if (oldWeight === 0 && newWeight > 0) {
          changes.addedTags.push({ tag, weight: newWeight });
        } else if (oldWeight > 0 && newWeight === 0) {
          changes.removedTags.push({ tag, weight: oldWeight });
        } else if (Math.abs(change) > 0.01) {
          changes.weightChanges.push({ tag, oldWeight, newWeight, change });
        }
        
        changes.totalChange += Math.abs(change);
      });
      
      return changes;
    } catch (error) {
      console.error('Error calculating spectrum changes:', error);
      return {
        addedTags: [],
        removedTags: [],
        weightChanges: [],
        totalChange: 0
      };
    }
  }

  // 记录光谱演化历史
  async recordSpectrumEvolution(starSeed, spectrum, interaction) {
    try {
      if (!starSeed.evolutionHistory) {
        starSeed.evolutionHistory = [];
      }
      
      const evolutionRecord = {
        timestamp: new Date(),
        spectrum: new Map(spectrum),
        interaction: interaction ? {
          type: interaction.actionType,
          userId: interaction.userId
        } : null
      };
      
      starSeed.evolutionHistory.push(evolutionRecord);
      
      // 限制历史记录数量
      if (starSeed.evolutionHistory.length > 100) {
        starSeed.evolutionHistory = starSeed.evolutionHistory.slice(-100);
      }
    } catch (error) {
      console.error('Error recording spectrum evolution:', error);
    }
  }

  // 计算光谱相似度
  calculateSpectrumSimilarity(spectrumA, spectrumB) {
    try {
      const allTags = new Set([...spectrumA.keys(), ...spectrumB.keys()]);
      
      if (allTags.size === 0) return 0;
      
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      
      allTags.forEach(tag => {
        const weightA = spectrumA.get(tag) || 0;
        const weightB = spectrumB.get(tag) || 0;
        
        dotProduct += weightA * weightB;
        normA += weightA * weightA;
        normB += weightB * weightB;
      });
      
      if (normA === 0 || normB === 0) return 0;
      
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    } catch (error) {
      console.error('Error calculating spectrum similarity:', error);
      return 0;
    }
  }

  // 计算光谱多样性
  calculateSpectrumDiversity(spectrum) {
    try {
      if (spectrum.size === 0) return 0;
      
      const weights = Array.from(spectrum.values());
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      
      if (totalWeight === 0) return 0;
      
      // 计算熵
      let entropy = 0;
      weights.forEach(weight => {
        const probability = weight / totalWeight;
        if (probability > 0) {
          entropy -= probability * Math.log2(probability);
        }
      });
      
      // 归一化熵
      const maxEntropy = Math.log2(spectrum.size);
      return maxEntropy > 0 ? entropy / maxEntropy : 0;
    } catch (error) {
      console.error('Error calculating spectrum diversity:', error);
      return 0;
    }
  }

  // 获取光谱统计
  getSpectrumStatistics(spectrum) {
    try {
      const weights = Array.from(spectrum.values());
      
      if (weights.length === 0) {
        return {
          tagCount: 0,
          averageWeight: 0,
          maxWeight: 0,
          minWeight: 0,
          standardDeviation: 0,
          diversity: 0
        };
      }
      
      const averageWeight = weights.reduce((sum, weight) => sum + weight, 0) / weights.length;
      const maxWeight = Math.max(...weights);
      const minWeight = Math.min(...weights);
      
      const variance = weights.reduce((sum, weight) => sum + Math.pow(weight - averageWeight, 2), 0) / weights.length;
      const standardDeviation = Math.sqrt(variance);
      
      const diversity = this.calculateSpectrumDiversity(spectrum);
      
      return {
        tagCount: weights.length,
        averageWeight,
        maxWeight,
        minWeight,
        standardDeviation,
        diversity
      };
    } catch (error) {
      console.error('Error getting spectrum statistics:', error);
      return {
        tagCount: 0,
        averageWeight: 0,
        maxWeight: 0,
        minWeight: 0,
        standardDeviation: 0,
        diversity: 0
      };
    }
  }

  // 预测光谱演化
  async predictSpectrumEvolution(starSeedId, timeHorizon = 24) {
    try {
      const starSeed = await StarSeed.findById(starSeedId);
      if (!starSeed) {
        throw new Error('星种不存在');
      }
      
      const currentSpectrum = starSeed.spectrum || new Map();
      
      // 预测时间衰减后的光谱
      const predictedSpectrum = this.applyTimeDecay(
        currentSpectrum,
        new Date(Date.now() - timeHorizon * 60 * 60 * 1000)
      );
      
      // 预测互动增长对光谱的影响
      const interactionGrowth = await this.predictInteractionGrowth(starSeedId, timeHorizon);
      const interactionSpectrum = this.predictInteractionSpectrum(interactionGrowth);
      
      // 合并预测光谱
      const finalSpectrum = this.mergeSpectra(predictedSpectrum, interactionSpectrum);
      
      return {
        currentSpectrum: Object.fromEntries(currentSpectrum),
        predictedSpectrum: Object.fromEntries(finalSpectrum),
        changes: this.calculateSpectrumChanges(currentSpectrum, finalSpectrum),
        confidence: 0.6
      };
    } catch (error) {
      console.error('Error predicting spectrum evolution:', error);
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
      
      return hourlyRate * timeHorizon;
    } catch (error) {
      console.error('Error predicting interaction growth:', error);
      return 0;
    }
  }

  // 预测互动光谱
  predictInteractionSpectrum(interactionCount) {
    try {
      const predictedSpectrum = new Map();
      
      // 基于历史互动模式预测光谱变化
      // 这里简化处理，实际应该基于历史数据
      const commonTags = ['音乐', '电影', '读书', '旅行', '美食'];
      
      commonTags.forEach(tag => {
        const weight = (interactionCount / 100) * Math.random();
        if (weight > 0.01) {
          predictedSpectrum.set(tag, weight);
        }
      });
      
      return predictedSpectrum;
    } catch (error) {
      console.error('Error predicting interaction spectrum:', error);
      return new Map();
    }
  }

  // 合并光谱
  mergeSpectra(spectrumA, spectrumB) {
    try {
      const mergedSpectrum = new Map(spectrumA);
      
      for (const [tag, weight] of spectrumB) {
        const currentWeight = mergedSpectrum.get(tag) || 0;
        mergedSpectrum.set(tag, currentWeight + weight);
      }
      
      return this.normalizeSpectrum(mergedSpectrum);
    } catch (error) {
      console.error('Error merging spectra:', error);
      return spectrumA;
    }
  }

  // 批量演化光谱
  async evolveBatchSpectra(starSeedIds) {
    try {
      const results = [];
      
      for (const starSeedId of starSeedIds) {
        try {
          const result = await this.evolveSpectrum(starSeedId);
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
      console.error('Error evolving batch spectra:', error);
      throw error;
    }
  }

  // 获取光谱演化历史
  async getSpectrumEvolutionHistory(starSeedId, limit = 50) {
    try {
      const starSeed = await StarSeed.findById(starSeedId);
      if (!starSeed) {
        throw new Error('星种不存在');
      }
      
      return starSeed.evolutionHistory.slice(-limit);
    } catch (error) {
      console.error('Error getting spectrum evolution history:', error);
      throw error;
    }
  }

  // 优化方法1: 获取标签衰减乘数
  getTagDecayMultiplier(tag) {
    try {
      // 不同类别的标签有不同的衰减特性
      for (const [category, tags] of Object.entries(this.tagCategories)) {
        if (tags.includes(tag)) {
          switch (category) {
            case 'lifestyle':
              return 0.8; // 生活方式标签衰减较慢
            case 'entertainment':
              return 0.9; // 娱乐标签衰减较快
            case 'tech':
              return 0.7; // 科技标签衰减最慢
            case 'health':
              return 0.85; // 健康标签衰减较慢
            case 'creative':
              return 0.75; // 创意标签衰减较慢
            case 'social':
              return 0.95; // 社交标签衰减最快
            case 'education':
              return 0.6; // 教育标签衰减最慢
            case 'business':
              return 0.8; // 商业标签衰减较慢
            default:
              return 0.9;
          }
        }
      }
      return 0.9; // 默认衰减乘数
    } catch (error) {
      console.error('Error getting tag decay multiplier:', error);
      return 0.9;
    }
  }

  // 优化方法2: 计算动态最小权重阈值
  calculateDynamicMinWeight(spectrumSize) {
    try {
      // 根据光谱大小动态调整最小权重阈值
      if (spectrumSize <= 5) {
        return this.evolutionParams.minSpectrumWeight * 0.5;
      } else if (spectrumSize <= 10) {
        return this.evolutionParams.minSpectrumWeight * 0.7;
      } else if (spectrumSize <= 20) {
        return this.evolutionParams.minSpectrumWeight;
      } else {
        return this.evolutionParams.minSpectrumWeight * 1.2;
      }
    } catch (error) {
      console.error('Error calculating dynamic min weight:', error);
      return this.evolutionParams.minSpectrumWeight;
    }
  }

  // 优化方法3: 确保光谱有效性
  ensureSpectrumValidity(decayedSpectrum, originalSpectrum) {
    try {
      // 如果衰减后没有标签，保留原始光谱的top标签
      if (decayedSpectrum.size === 0) {
        const topTags = Array.from(originalSpectrum.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        
        topTags.forEach(([tag, weight]) => {
          decayedSpectrum.set(tag, weight * 0.1); // 保留10%的权重
        });
      }

      // 确保至少有一个标签
      if (decayedSpectrum.size < 1) {
        const topTag = Array.from(originalSpectrum.entries())
          .sort((a, b) => b[1] - a[1])[0];
        
        if (topTag) {
          decayedSpectrum.set(topTag[0], 0.1);
        }
      }

      return decayedSpectrum;
    } catch (error) {
      console.error('Error ensuring spectrum validity:', error);
      return decayedSpectrum;
    }
  }

  // 优化方法4: 智能光谱演化
  async evolveSpectrumIntelligent(starSeedId, interaction = null) {
    try {
      const starSeed = await StarSeed.findById(starSeedId).populate('authorId');
      if (!starSeed) {
        throw new Error('星种不存在');
      }

      // 优化1: 并行处理多个演化步骤
      const [timeDecayedSpectrum, interactionSpectrum, preferenceSpectrum] = await Promise.all([
        Promise.resolve(this.applyTimeDecay(starSeed.spectrum || new Map(), starSeed.createdAt)),
        interaction ? this.processInteractionSpectrum(starSeed.spectrum || new Map(), interaction) : Promise.resolve(new Map()),
        this.applyUserPreferenceLearning(starSeed.spectrum || new Map(), starSeed)
      ]);

      // 优化2: 智能合并多个光谱
      const mergedSpectrum = this.intelligentSpectrumMerge(timeDecayedSpectrum, interactionSpectrum, preferenceSpectrum);

      // 优化3: 自适应归一化
      const normalizedSpectrum = this.adaptiveNormalizeSpectrum(mergedSpectrum);

      // 优化4: 智能修剪
      const prunedSpectrum = this.intelligentPruneSpectrum(normalizedSpectrum);

      // 优化5: 更新星种
      starSeed.spectrum = prunedSpectrum;
      await starSeed.save();

      return {
        starSeed,
        spectrum: prunedSpectrum,
        evolution: {
          timeDecay: timeDecayedSpectrum,
          interaction: interactionSpectrum,
          preference: preferenceSpectrum,
          final: prunedSpectrum
        }
      };
    } catch (error) {
      console.error('Error in intelligent spectrum evolution:', error);
      throw error;
    }
  }

  // 优化方法5: 智能光谱合并
  intelligentSpectrumMerge(timeDecayed, interaction, preference) {
    try {
      const mergedSpectrum = new Map(timeDecayed);
      
      // 合并互动光谱
      for (const [tag, weight] of interaction) {
        const currentWeight = mergedSpectrum.get(tag) || 0;
        const interactionBoost = weight * 0.3; // 互动权重30%
        mergedSpectrum.set(tag, currentWeight + interactionBoost);
      }

      // 合并偏好光谱
      for (const [tag, weight] of preference) {
        const currentWeight = mergedSpectrum.get(tag) || 0;
        const preferenceBoost = weight * 0.2; // 偏好权重20%
        mergedSpectrum.set(tag, currentWeight + preferenceBoost);
      }

      return mergedSpectrum;
    } catch (error) {
      console.error('Error in intelligent spectrum merge:', error);
      return timeDecayed;
    }
  }

  // 优化方法6: 自适应归一化
  adaptiveNormalizeSpectrum(spectrum) {
    try {
      const weights = Array.from(spectrum.values());
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      
      if (totalWeight <= 0) return spectrum;

      // 使用softmax归一化，保持相对关系
      const normalizedSpectrum = new Map();
      const maxWeight = Math.max(...weights);
      
      for (const [tag, weight] of spectrum) {
        const normalizedWeight = Math.exp(weight - maxWeight) / 
                                weights.reduce((sum, w) => sum + Math.exp(w - maxWeight), 0);
        normalizedSpectrum.set(tag, normalizedWeight);
      }

      return normalizedSpectrum;
    } catch (error) {
      console.error('Error in adaptive normalization:', error);
      return this.normalizeSpectrum(spectrum);
    }
  }

  // 优化方法7: 智能修剪
  intelligentPruneSpectrum(spectrum) {
    try {
      const prunedSpectrum = new Map();
      const weights = Array.from(spectrum.values());
      
      if (weights.length === 0) return spectrum;

      // 计算动态阈值
      const sortedWeights = weights.sort((a, b) => b - a);
      const percentile90 = sortedWeights[Math.floor(sortedWeights.length * 0.1)];
      const dynamicThreshold = Math.max(percentile90 * 0.1, this.evolutionParams.minSpectrumWeight);

      // 保留超过阈值的标签
      for (const [tag, weight] of spectrum) {
        if (weight >= dynamicThreshold) {
          prunedSpectrum.set(tag, weight);
        }
      }

      // 确保标签数量在合理范围内
      if (prunedSpectrum.size < this.evolutionParams.minTags) {
        const topTags = Array.from(spectrum.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, this.evolutionParams.minTags);
        
        prunedSpectrum.clear();
        topTags.forEach(([tag, weight]) => {
          prunedSpectrum.set(tag, weight);
        });
      }

      if (prunedSpectrum.size > this.evolutionParams.maxTags) {
        const topTags = Array.from(prunedSpectrum.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, this.evolutionParams.maxTags);
        
        prunedSpectrum.clear();
        topTags.forEach(([tag, weight]) => {
          prunedSpectrum.set(tag, weight);
        });
      }

      return prunedSpectrum;
    } catch (error) {
      console.error('Error in intelligent pruning:', error);
      return this.pruneLowWeightTags(spectrum);
    }
  }

  // 优化方法8: 批量智能演化
  async evolveBatchSpectraIntelligent(starSeedIds) {
    try {
      const batchSize = 5; // 批量处理大小
      const results = [];
      
      // 分批处理，避免内存溢出
      for (let i = 0; i < starSeedIds.length; i += batchSize) {
        const batch = starSeedIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (starSeedId) => {
          try {
            const result = await this.evolveSpectrumIntelligent(starSeedId);
            return {
              starSeedId,
              success: true,
              result
            };
          } catch (error) {
            return {
              starSeedId,
              success: false,
              error: error.message
            };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
      
      return results;
    } catch (error) {
      console.error('Error in batch intelligent evolution:', error);
      throw error;
    }
  }
}

module.exports = SpectrumEvolutionEngine;

