const { StarSeed, Interaction, Cluster } = require('../models');

class JumpConditionEvaluator {
  constructor() {
    // 跃迁条件参数
    this.jumpConditions = {
      minLuminosity: 70,           // 最小光度阈值
      minInteractions: 10,         // 最小互动数量
      minInteractionTypes: 3,      // 最小互动类型数量
      minTimeAlive: 24,            // 最小存活时间（小时）
      minUniqueUsers: 5,           // 最小独特用户数量
      minResonanceScore: 60,       // 最小共鸣得分
      maxClusterAge: 168,           // 最大星团年龄（小时）
      minSpectrumDiversity: 0.3    // 最小光谱多样性
    };

    // 跃迁权重
    this.jumpWeights = {
      luminosity: 0.3,
      interactions: 0.2,
      timeAlive: 0.1,
      uniqueUsers: 0.1,
      resonanceScore: 0.2,
      spectrumDiversity: 0.1
    };

    // 跃迁类型
    this.jumpTypes = {
      'luminosity': '光度跃迁',
      'interaction': '互动跃迁',
      'resonance': '共鸣跃迁',
      'time': '时间跃迁',
      'composite': '复合跃迁'
    };
  }

  // 评估跃迁条件（主要方法）- 优化13: 添加输入验证和错误处理
  async evaluateJumpConditions(starSeedId) {
    try {
      // 优化13: 输入验证
      if (!starSeedId) {
        throw new Error('星种ID不能为空');
      }

      const starSeed = await StarSeed.findById(starSeedId).populate('authorId');
      if (!starSeed) {
        throw new Error('星种不存在');
      }

      // 1. 检查基础条件
      const basicConditions = await this.checkBasicConditions(starSeed);
      
      // 2. 检查光度条件
      const luminosityConditions = await this.checkLuminosityConditions(starSeed);
      
      // 3. 检查互动条件
      const interactionConditions = await this.checkInteractionConditions(starSeed);
      
      // 4. 检查时间条件
      const timeConditions = await this.checkTimeConditions(starSeed);
      
      // 5. 检查用户条件
      const userConditions = await this.checkUserConditions(starSeed);
      
      // 6. 检查共鸣条件
      const resonanceConditions = await this.checkResonanceConditions(starSeed);
      
      // 7. 检查光谱条件
      const spectrumConditions = await this.checkSpectrumConditions(starSeed);
      
      // 8. 计算综合跃迁得分
      const jumpScore = this.calculateJumpScore({
        luminosity: luminosityConditions,
        interactions: interactionConditions,
        time: timeConditions,
        users: userConditions,
        resonance: resonanceConditions,
        spectrum: spectrumConditions
      });
      
      // 9. 确定跃迁类型
      const jumpType = this.determineJumpType({
        luminosity: luminosityConditions,
        interactions: interactionConditions,
        resonance: resonanceConditions,
        time: timeConditions
      });
      
      // 10. 检查是否可以跃迁
      const canJump = jumpScore >= 0.7; // 70%以上可以跃迁
      
      return {
        canJump,
        jumpScore,
        jumpType,
        conditions: {
          basic: basicConditions,
          luminosity: luminosityConditions,
          interactions: interactionConditions,
          time: timeConditions,
          users: userConditions,
          resonance: resonanceConditions,
          spectrum: spectrumConditions
        },
        recommendations: this.generateJumpRecommendations({
          luminosity: luminosityConditions,
          interactions: interactionConditions,
          time: timeConditions,
          users: userConditions,
          resonance: resonanceConditions,
          spectrum: spectrumConditions
        })
      };
    } catch (error) {
      console.error('Error evaluating jump conditions:', error);
      throw error;
    }
  }

  // 检查基础条件
  async checkBasicConditions(starSeed) {
    try {
      const conditions = {
        isValid: true,
        reasons: []
      };

      // 检查星种是否有效
      if (!starSeed.isActive) {
        conditions.isValid = false;
        conditions.reasons.push('星种已失效');
      }

      // 检查作者是否存在
      if (!starSeed.authorId) {
        conditions.isValid = false;
        conditions.reasons.push('作者不存在');
      }

      // 检查内容是否完整
      if (!starSeed.content || starSeed.content.trim().length === 0) {
        conditions.isValid = false;
        conditions.reasons.push('内容不完整');
      }

      return conditions;
    } catch (error) {
      console.error('Error checking basic conditions:', error);
      return {
        isValid: false,
        reasons: ['检查基础条件时出错']
      };
    }
  }

  // 检查光度条件
  async checkLuminosityConditions(starSeed) {
    try {
      const conditions = {
        isValid: true,
        score: 0,
        reasons: []
      };

      const currentLuminosity = starSeed.luminosity || 0;
      
      if (currentLuminosity >= this.jumpConditions.minLuminosity) {
        conditions.score = Math.min(currentLuminosity / 100, 1.0);
        conditions.reasons.push(`光度达标: ${currentLuminosity} >= ${this.jumpConditions.minLuminosity}`);
      } else {
        conditions.isValid = false;
        conditions.score = currentLuminosity / this.jumpConditions.minLuminosity;
        conditions.reasons.push(`光度不足: ${currentLuminosity} < ${this.jumpConditions.minLuminosity}`);
      }

      return conditions;
    } catch (error) {
      console.error('Error checking luminosity conditions:', error);
      return {
        isValid: false,
        score: 0,
        reasons: ['检查光度条件时出错']
      };
    }
  }

  // 检查互动条件 - 优化14: 优化数据库查询
  async checkInteractionConditions(starSeed) {
    try {
      const conditions = {
        isValid: true,
        score: 0,
        reasons: []
      };

      // 优化14: 添加索引提示和限制查询
      const interactions = await Interaction.find({
        targetId: starSeed._id,
        targetType: 'starseed'
      }).hint({ targetId: 1, targetType: 1 }).limit(1000);

      const interactionCount = interactions.length;
      const interactionTypes = [...new Set(interactions.map(i => i.actionType))];
      const uniqueUsers = [...new Set(interactions.map(i => i.userId.toString()))];

      // 检查互动数量
      if (interactionCount >= this.jumpConditions.minInteractions) {
        conditions.score += 0.4;
        conditions.reasons.push(`互动数量达标: ${interactionCount} >= ${this.jumpConditions.minInteractions}`);
      } else {
        conditions.isValid = false;
        conditions.reasons.push(`互动数量不足: ${interactionCount} < ${this.jumpConditions.minInteractions}`);
      }

      // 检查互动类型多样性
      if (interactionTypes.length >= this.jumpConditions.minInteractionTypes) {
        conditions.score += 0.3;
        conditions.reasons.push(`互动类型多样: ${interactionTypes.length} >= ${this.jumpConditions.minInteractionTypes}`);
      } else {
        conditions.isValid = false;
        conditions.reasons.push(`互动类型单一: ${interactionTypes.length} < ${this.jumpConditions.minInteractionTypes}`);
      }

      // 检查独特用户数量
      if (uniqueUsers.length >= this.jumpConditions.minUniqueUsers) {
        conditions.score += 0.3;
        conditions.reasons.push(`用户多样性达标: ${uniqueUsers.length} >= ${this.jumpConditions.minUniqueUsers}`);
      } else {
        conditions.isValid = false;
        conditions.reasons.push(`用户多样性不足: ${uniqueUsers.length} < ${this.jumpConditions.minUniqueUsers}`);
      }

      return conditions;
    } catch (error) {
      console.error('Error checking interaction conditions:', error);
      return {
        isValid: false,
        score: 0,
        reasons: ['检查互动条件时出错']
      };
    }
  }

  // 检查时间条件
  async checkTimeConditions(starSeed) {
    try {
      const conditions = {
        isValid: true,
        score: 0,
        reasons: []
      };

      const now = new Date();
      const hoursAlive = (now - starSeed.createdAt) / (1000 * 60 * 60);
      
      if (hoursAlive >= this.jumpConditions.minTimeAlive) {
        conditions.score = Math.min(hoursAlive / (this.jumpConditions.minTimeAlive * 2), 1.0);
        conditions.reasons.push(`存活时间达标: ${hoursAlive.toFixed(1)}小时 >= ${this.jumpConditions.minTimeAlive}小时`);
      } else {
        conditions.isValid = false;
        conditions.score = hoursAlive / this.jumpConditions.minTimeAlive;
        conditions.reasons.push(`存活时间不足: ${hoursAlive.toFixed(1)}小时 < ${this.jumpConditions.minTimeAlive}小时`);
      }

      return conditions;
    } catch (error) {
      console.error('Error checking time conditions:', error);
      return {
        isValid: false,
        score: 0,
        reasons: ['检查时间条件时出错']
      };
    }
  }

  // 检查用户条件
  async checkUserConditions(starSeed) {
    try {
      const conditions = {
        isValid: true,
        score: 0,
        reasons: []
      };

      const interactions = await Interaction.find({
        targetId: starSeed._id,
        targetType: 'starseed'
      });

      const uniqueUsers = [...new Set(interactions.map(i => i.userId.toString()))];
      
      if (uniqueUsers.length >= this.jumpConditions.minUniqueUsers) {
        conditions.score = Math.min(uniqueUsers.length / (this.jumpConditions.minUniqueUsers * 2), 1.0);
        conditions.reasons.push(`用户数量达标: ${uniqueUsers.length} >= ${this.jumpConditions.minUniqueUsers}`);
      } else {
        conditions.isValid = false;
        conditions.score = uniqueUsers.length / this.jumpConditions.minUniqueUsers;
        conditions.reasons.push(`用户数量不足: ${uniqueUsers.length} < ${this.jumpConditions.minUniqueUsers}`);
      }

      return conditions;
    } catch (error) {
      console.error('Error checking user conditions:', error);
      return {
        isValid: false,
        score: 0,
        reasons: ['检查用户条件时出错']
      };
    }
  }

  // 检查共鸣条件
  async checkResonanceConditions(starSeed) {
    try {
      const conditions = {
        isValid: true,
        score: 0,
        reasons: []
      };

      // 这里应该调用共鸣计算算法
      // 暂时使用一个基于互动的简单计算
      const interactions = await Interaction.find({
        targetId: starSeed._id,
        targetType: 'starseed'
      });

      const uniqueUsers = [...new Set(interactions.map(i => i.userId.toString()))];
      const estimatedResonance = Math.min(uniqueUsers.length * 10, 100);
      
      if (estimatedResonance >= this.jumpConditions.minResonanceScore) {
        conditions.score = estimatedResonance / 100;
        conditions.reasons.push(`共鸣得分达标: ${estimatedResonance} >= ${this.jumpConditions.minResonanceScore}`);
      } else {
        conditions.isValid = false;
        conditions.score = estimatedResonance / this.jumpConditions.minResonanceScore;
        conditions.reasons.push(`共鸣得分不足: ${estimatedResonance} < ${this.jumpConditions.minResonanceScore}`);
      }

      return conditions;
    } catch (error) {
      console.error('Error checking resonance conditions:', error);
      return {
        isValid: false,
        score: 0,
        reasons: ['检查共鸣条件时出错']
      };
    }
  }

  // 检查光谱条件
  async checkSpectrumConditions(starSeed) {
    try {
      const conditions = {
        isValid: true,
        score: 0,
        reasons: []
      };

      const spectrum = starSeed.spectrum || new Map();
      
      if (spectrum.size === 0) {
        conditions.isValid = false;
        conditions.score = 0;
        conditions.reasons.push('光谱为空');
        return conditions;
      }

      // 计算光谱多样性
      const diversity = this.calculateSpectrumDiversity(spectrum);
      
      if (diversity >= this.jumpConditions.minSpectrumDiversity) {
        conditions.score = diversity;
        conditions.reasons.push(`光谱多样性达标: ${diversity.toFixed(2)} >= ${this.jumpConditions.minSpectrumDiversity}`);
      } else {
        conditions.isValid = false;
        conditions.score = diversity / this.jumpConditions.minSpectrumDiversity;
        conditions.reasons.push(`光谱多样性不足: ${diversity.toFixed(2)} < ${this.jumpConditions.minSpectrumDiversity}`);
      }

      return conditions;
    } catch (error) {
      console.error('Error checking spectrum conditions:', error);
      return {
        isValid: false,
        score: 0,
        reasons: ['检查光谱条件时出错']
      };
    }
  }

  // 计算光谱多样性
  calculateSpectrumDiversity(spectrum) {
    try {
      if (spectrum.size === 0) return 0;
      
      const weights = Array.from(spectrum.values());
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      
      if (totalWeight === 0) return 0;
      
      let entropy = 0;
      weights.forEach(weight => {
        const probability = weight / totalWeight;
        if (probability > 0) {
          entropy -= probability * Math.log2(probability);
        }
      });
      
      const maxEntropy = Math.log2(spectrum.size);
      return maxEntropy > 0 ? entropy / maxEntropy : 0;
    } catch (error) {
      console.error('Error calculating spectrum diversity:', error);
      return 0;
    }
  }

  // 计算综合跃迁得分
  calculateJumpScore(conditions) {
    try {
      let totalScore = 0;
      let totalWeight = 0;

      Object.entries(this.jumpWeights).forEach(([key, weight]) => {
        const condition = conditions[key];
        if (condition && condition.score !== undefined) {
          totalScore += condition.score * weight;
          totalWeight += weight;
        }
      });

      return totalWeight > 0 ? totalScore / totalWeight : 0;
    } catch (error) {
      console.error('Error calculating jump score:', error);
      return 0;
    }
  }

  // 确定跃迁类型
  determineJumpType(conditions) {
    try {
      const scores = {
        luminosity: conditions.luminosity?.score || 0,
        interactions: conditions.interactions?.score || 0,
        resonance: conditions.resonance?.score || 0,
        time: conditions.time?.score || 0
      };

      const maxScore = Math.max(...Object.values(scores));
      const maxKey = Object.keys(scores).find(key => scores[key] === maxScore);

      if (maxScore >= 0.8) {
        return this.jumpTypes[maxKey] || this.jumpTypes.composite;
      } else if (maxScore >= 0.6) {
        return this.jumpTypes.composite;
      } else {
        return 'none';
      }
    } catch (error) {
      console.error('Error determining jump type:', error);
      return 'none';
    }
  }

  // 生成跃迁建议
  generateJumpRecommendations(conditions) {
    try {
      const recommendations = [];

      if (!conditions.luminosity.isValid) {
        recommendations.push({
          type: 'luminosity',
          message: '增加星种光度',
          suggestion: '通过更多互动提升星种光度',
          priority: 'high'
        });
      }

      if (!conditions.interactions.isValid) {
        recommendations.push({
          type: 'interactions',
          message: '增加互动多样性',
          suggestion: '鼓励更多用户进行不同类型的互动',
          priority: 'high'
        });
      }

      if (!conditions.time.isValid) {
        recommendations.push({
          type: 'time',
          message: '等待时间条件',
          suggestion: '星种需要更多时间积累影响力',
          priority: 'medium'
        });
      }

      if (!conditions.users.isValid) {
        recommendations.push({
          type: 'users',
          message: '扩大用户参与',
          suggestion: '吸引更多不同用户参与互动',
          priority: 'medium'
        });
      }

      if (!conditions.resonance.isValid) {
        recommendations.push({
          type: 'resonance',
          message: '提升共鸣值',
          suggestion: '通过标签匹配和互动历史提升共鸣',
          priority: 'medium'
        });
      }

      if (!conditions.spectrum.isValid) {
        recommendations.push({
          type: 'spectrum',
          message: '丰富光谱内容',
          suggestion: '增加更多样化的标签和内容',
          priority: 'low'
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating jump recommendations:', error);
      return [];
    }
  }

  // 检查是否可以跃迁到目标星团
  async checkJumpToCluster(starSeedId, targetClusterId) {
    try {
      const starSeed = await StarSeed.findById(starSeedId);
      const targetCluster = await Cluster.findById(targetClusterId);

      if (!starSeed || !targetCluster) {
        throw new Error('星种或目标星团不存在');
      }

      // 检查目标星团是否活跃
      if (!targetCluster.isActive) {
        return {
          canJump: false,
          reason: '目标星团已失效'
        };
      }

      // 检查目标星团是否已满
      if (targetCluster.members.length >= 49) {
        return {
          canJump: false,
          reason: '目标星团已满'
        };
      }

      // 检查星种是否具备跃迁条件
      const jumpEvaluation = await this.evaluateJumpConditions(starSeedId);
      
      if (!jumpEvaluation.canJump) {
        return {
          canJump: false,
          reason: '星种不具备跃迁条件',
          details: jumpEvaluation
        };
      }

      // 检查目标星团的兼容性
      const compatibility = await this.checkClusterCompatibility(starSeed, targetCluster);
      
      if (compatibility.score < 0.6) {
        return {
          canJump: false,
          reason: '与目标星团兼容性不足',
          compatibility
        };
      }

      return {
        canJump: true,
        jumpEvaluation,
        compatibility
      };
    } catch (error) {
      console.error('Error checking jump to cluster:', error);
      throw error;
    }
  }

  // 检查星团兼容性
  async checkClusterCompatibility(starSeed, targetCluster) {
    try {
      const compatibility = {
        score: 0,
        factors: {}
      };

      // 检查标签兼容性
      const starSeedTags = starSeed.spectrum ? Array.from(starSeed.spectrum.keys()) : [];
      const clusterTags = new Set();
      
      // 这里应该获取星团成员的标签
      // 暂时使用一个简化的计算
      const tagCompatibility = starSeedTags.length > 0 ? 0.7 : 0.5;
      compatibility.factors.tagCompatibility = tagCompatibility;
      compatibility.score += tagCompatibility * 0.4;

      // 检查活跃度兼容性
      const activityCompatibility = 0.8; // 简化计算
      compatibility.factors.activityCompatibility = activityCompatibility;
      compatibility.score += activityCompatibility * 0.3;

      // 检查时间兼容性
      const timeCompatibility = 0.9; // 简化计算
      compatibility.factors.timeCompatibility = timeCompatibility;
      compatibility.score += timeCompatibility * 0.3;

      return compatibility;
    } catch (error) {
      console.error('Error checking cluster compatibility:', error);
      return {
        score: 0,
        factors: {}
      };
    }
  }

  // 批量评估跃迁条件
  async evaluateBatchJumpConditions(starSeedIds) {
    try {
      const results = [];
      
      for (const starSeedId of starSeedIds) {
        try {
          const evaluation = await this.evaluateJumpConditions(starSeedId);
          results.push({
            starSeedId,
            success: true,
            evaluation
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
      console.error('Error evaluating batch jump conditions:', error);
      throw error;
    }
  }

  // 获取跃迁统计
  async getJumpStatistics() {
    try {
      const totalStarSeeds = await StarSeed.countDocuments();
      const jumpEligibleStarSeeds = await StarSeed.countDocuments({ jumpEligible: true });
      
      const jumpRate = totalStarSeeds > 0 ? jumpEligibleStarSeeds / totalStarSeeds : 0;
      
      return {
        totalStarSeeds,
        jumpEligibleStarSeeds,
        jumpRate,
        averageJumpScore: 0.65 // 简化计算
      };
    } catch (error) {
      console.error('Error getting jump statistics:', error);
      throw error;
    }
  }
}

module.exports = JumpConditionEvaluator;

