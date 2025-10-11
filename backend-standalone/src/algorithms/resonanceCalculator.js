const { User, Interaction, Resonance } = require('../models');
const redisService = require('../services/redisService');
const { randomUUID, randomBytes } = require('crypto');

class ResonanceCalculator {
  constructor() {
    // 权重配置
    this.weights = {
      tagSimilarity: parseFloat(process.env.RESONANCE_TAG_WEIGHT) || 0.6,
      interactionScore: parseFloat(process.env.RESONANCE_INTERACTION_WEIGHT) || 0.4,
      contentPreferenceMatch: 0.15,
      randomFactor: parseFloat(process.env.RESONANCE_RANDOM_WEIGHT) || 0.05
    };

    // 动态权重调整阈值
    this.matureUserThreshold = 30; // 30天为成熟用户
  }

  // 计算两个用户的共鸣值 - 优化70: 增强缓存策略和性能监控
  async calculateResonance(userA, userB, forceRecalculate = false) {
    const startTime = Date.now(); // 性能监控开始
    const requestId = this.generateRequestId(); // 添加请求ID追踪
    
    try {
      // 优化70: 增强输入验证，提前返回无效请求
      if (!userA || !userB || !userA._id || !userB._id) {
        throw new Error('无效的用户数据');
      }
      
      // 优化70: 验证用户ID格式
      if (typeof userA._id !== 'string' || typeof userB._id !== 'string') {
        throw new Error('用户ID格式错误');
      }
      
      if (userA._id === userB._id) {
        return 100; // 自己与自己的共鸣值为100
      }

      // 优化2: 改进缓存策略 - 使用更智能的缓存键和预检查
      const cacheKey = this.generateCacheKey(userA._id, userB._id);
      
      if (!forceRecalculate) {
        const cachedResonance = await redisService.getResonance(userA._id, userB._id);
        if (cachedResonance !== null) {
          // 优化3: 添加缓存命中统计和性能记录
          await this.incrementCacheHit(cacheKey);
          await this.recordCacheHitMetrics(userA._id, userB._id, Date.now() - startTime, requestId);
          return cachedResonance;
        }
      }

      // 第2次优化: 增强并行计算，使用Promise.allSettled和错误恢复
      const [tagSimilarityResult, interactionScoreResult, contentPreferenceResult] = await Promise.allSettled([
        this.calculateTagSimilarity(userA, userB),
        this.calculateInteractionScore(userA._id, userB._id),
        Promise.resolve(this.calculateContentPreferenceMatch(userA, userB))
      ]);

      // 优化1.1: 处理并行计算结果，实现错误恢复和降级策略
      const tagSimilarity = tagSimilarityResult.status === 'fulfilled' ? tagSimilarityResult.value : 0.1;
      const interactionScore = interactionScoreResult.status === 'fulfilled' ? interactionScoreResult.value : 0.1;
      const contentPreferenceMatch = contentPreferenceResult.status === 'fulfilled' ? contentPreferenceResult.value : 0.1;

      // 优化1.2: 记录并行计算性能和错误统计
      const parallelTime = Date.now() - startTime;
      await this.recordParallelPerformance(userA._id, userB._id, parallelTime);
      
      // 优化1.3: 记录失败的计算任务
      if (tagSimilarityResult.status === 'rejected') {
        await this.recordCalculationError('tagSimilarity', userA._id, userB._id, tagSimilarityResult.reason);
      }
      if (interactionScoreResult.status === 'rejected') {
        await this.recordCalculationError('interactionScore', userA._id, userB._id, interactionScoreResult.reason);
      }
      if (contentPreferenceResult.status === 'rejected') {
        await this.recordCalculationError('contentPreference', userA._id, userB._id, contentPreferenceResult.reason);
      }

      const randomFactor = this.generateRandomFactor();

      // 优化4: 缓存权重计算结果
      const adjustedWeights = await this.getCachedAdjustedWeights(userA);

      // 优化5: 使用更精确的数学计算
      const totalResonance = this.calculateWeightedResonance(
        tagSimilarity,
        interactionScore,
        contentPreferenceMatch,
        randomFactor,
        adjustedWeights
      );

      // 优化6: 异步保存记录，不阻塞主流程
      setImmediate(() => {
        this.saveResonanceRecord(userA._id, userB._id, {
        tagSimilarity,
        interactionScore,
        contentPreferenceMatch,
        randomFactor,
        totalResonance
        }).catch(err => console.error('Async save error:', err));
      });

      // 优化7: 使用更长的缓存时间，减少重复计算
      await redisService.cacheResonance(userA._id, userB._id, totalResonance, 3600); // 1小时缓存

      // 优化8: 记录性能指标
      const executionTime = Date.now() - startTime;
      await this.recordPerformanceMetrics(userA._id, userB._id, executionTime);

      return Math.round(totalResonance * 100) / 100;
    } catch (error) {
      console.error('Error calculating resonance:', error);
      // 优化8: 添加降级策略
      return this.getFallbackResonance(userA, userB);
    }
  }

  // 第13次优化：增强标签相似度计算，添加语义分析和权重
  async calculateTagSimilarity(userA, userB) {
    try {
      // 优化13.1: 增强缓存策略
      const cacheKey = `tag_similarity:${userA._id}:${userB._id}`;
      const cachedSimilarity = await redisService.get(cacheKey);
      if (cachedSimilarity !== null) {
        return parseFloat(cachedSimilarity);
      }

      const tagsA = userA.tags || [];
      const tagsB = userB.tags || [];

      if (tagsA.length === 0 && tagsB.length === 0) {
        return 0.5; // 都没有标签时给中等相似度
      }

      if (tagsA.length === 0 || tagsB.length === 0) {
        return 0.1; // 只有一个用户有标签时给低相似度
      }

      // 优化13.2: 计算多种相似度指标
      const jaccardSimilarity = this.calculateJaccardSimilarity(tagsA, tagsB);
      const cosineSimilarity = this.calculateCosineSimilarity(tagsA, tagsB);
      const semanticSimilarity = await this.calculateSemanticSimilarity(tagsA, tagsB);
      const weightedSimilarity = await this.calculateWeightedTagSimilarity(tagsA, tagsB);
      
      // 优化13.3: 动态权重组合
      const finalSimilarity = (
        jaccardSimilarity * 0.25 +
        cosineSimilarity * 0.25 +
        semanticSimilarity * 0.25 +
        weightedSimilarity * 0.25
      );
      
      // 优化13.4: 添加标签活跃度权重
      const activityWeight = await this.calculateTagActivityWeight(userA, userB);
      const weightedFinalSimilarity = finalSimilarity * activityWeight;
      
      // 优化13.5: 缓存结果
      await redisService.set(cacheKey, weightedFinalSimilarity.toString(), 1800); // 30分钟缓存
      
      return Math.min(Math.max(weightedFinalSimilarity, 0), 1); // 确保在[0,1]范围内
    } catch (error) {
      console.error('Error calculating tag similarity:', error);
      return 0.1;
    }
  }

  // 计算Jaccard相似度
  calculateJaccardSimilarity(tagsA, tagsB) {
    const intersection = tagsA.filter(tag => tagsB.includes(tag));
    const union = [...new Set([...tagsA, ...tagsB])];
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  // 计算余弦相似度
  calculateCosineSimilarity(tagsA, tagsB) {
    const allTags = [...new Set([...tagsA, ...tagsB])];
    
    const vectorA = allTags.map(tag => tagsA.includes(tag) ? 1 : 0);
    const vectorB = allTags.map(tag => tagsB.includes(tag) ? 1 : 0);

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < allTags.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // 计算语义相似度
  async calculateSemanticSimilarity(tagsA, tagsB) {
    try {
      // 简单的语义相似度计算，基于标签类别
      const tagCategories = {
        '科技': ['技术', '编程', 'AI', '互联网', '软件'],
        '生活': ['美食', '旅游', '摄影', '音乐', '电影'],
        '学习': ['教育', '读书', '学习', '知识', '技能'],
        '运动': ['健身', '跑步', '游泳', '篮球', '足球'],
        '艺术': ['绘画', '设计', '创作', '艺术', '美学']
      };

      const getCategory = (tag) => {
        for (const [category, keywords] of Object.entries(tagCategories)) {
          if (keywords.some(keyword => tag.includes(keyword))) {
            return category;
          }
        }
        return '其他';
      };

      const categoriesA = [...new Set(tagsA.map(getCategory))];
      const categoriesB = [...new Set(tagsB.map(getCategory))];

      const commonCategories = categoriesA.filter(cat => categoriesB.includes(cat));
      const totalCategories = [...new Set([...categoriesA, ...categoriesB])];

      return totalCategories.length > 0 ? commonCategories.length / totalCategories.length : 0;
    } catch (error) {
      console.error('Semantic similarity calculation error:', error);
      return 0.1;
    }
  }

  // 计算加权标签相似度
  async calculateWeightedTagSimilarity(tagsA, tagsB) {
    try {
      // 基于标签使用频率的加权相似度
      const tagWeights = await this.getTagWeights();
      
      let weightedScore = 0;
      let totalWeight = 0;

      for (const tag of tagsA) {
        const weight = tagWeights[tag] || 1;
        if (tagsB.includes(tag)) {
          weightedScore += weight * 2; // 共同标签权重加倍
        }
        totalWeight += weight;
      }

      for (const tag of tagsB) {
        const weight = tagWeights[tag] || 1;
        if (!tagsA.includes(tag)) {
          totalWeight += weight;
        }
      }

      return totalWeight > 0 ? weightedScore / totalWeight : 0;
    } catch (error) {
      console.error('Weighted tag similarity calculation error:', error);
      return 0.1;
    }
  }

  // 计算标签活跃度权重
  async calculateTagActivityWeight(userA, userB) {
    try {
      // 基于用户标签更新频率的权重
      const userAActivity = await this.getUserTagActivity(userA._id);
      const userBActivity = await this.getUserTagActivity(userB._id);
      
      // 活跃度越高，权重越高
      const avgActivity = (userAActivity + userBActivity) / 2;
      return Math.min(avgActivity / 10, 1); // 归一化到[0,1]
    } catch (error) {
      console.error('Tag activity weight calculation error:', error);
      return 0.5; // 默认中等权重
    }
  }

  // 获取标签权重
  async getTagWeights() {
    try {
      const cacheKey = 'tag_weights';
      const cachedWeights = await redisService.get(cacheKey);
      if (cachedWeights) {
        return JSON.parse(cachedWeights);
      }

      // 模拟标签权重数据
      const weights = {
        '技术': 1.2,
        '编程': 1.3,
        'AI': 1.5,
        '美食': 1.1,
        '旅游': 1.0,
        '摄影': 1.1,
        '音乐': 1.0,
        '电影': 0.9,
        '健身': 1.2,
        '学习': 1.1
      };

      await redisService.set(cacheKey, JSON.stringify(weights), 3600);
      return weights;
    } catch (error) {
      console.error('Get tag weights error:', error);
      return {};
    }
  }

  // 获取用户标签活跃度
  async getUserTagActivity(userId) {
    try {
      const cacheKey = `user_tag_activity:${userId}`;
      const cachedActivity = await redisService.get(cacheKey);
      if (cachedActivity !== null) {
        return parseFloat(cachedActivity);
      }

      // 模拟活跃度计算（基于用户创建时间和标签数量）
      const user = await User.findById(userId);
      if (!user) return 0.5;

      const daysSinceCreation = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const tagCount = user.tags ? user.tags.length : 0;
      
      // 活跃度 = 标签数量 / 天数
      const activity = Math.min(tagCount / Math.max(daysSinceCreation, 1), 5);
      
      await redisService.set(cacheKey, activity.toString(), 1800);
      return activity;
    } catch (error) {
      console.error('Get user tag activity error:', error);
      return 0.5;
    }
  }

  // 第14次优化：增强互动历史计算，添加多维度分析
  async calculateInteractionScore(userAId, userBId) {
    try {
      // 优化14.1: 增强缓存策略
      const cacheKey = `interaction_score:${userAId}:${userBId}`;
      const cachedScore = await redisService.get(cacheKey);
      if (cachedScore !== null) {
        return parseFloat(cachedScore);
      }

      const interactions = await Interaction.find({
        $or: [
          { userId: userAId, targetId: userBId },
          { userId: userBId, targetId: userAId }
        ]
      }).sort({ createdAt: -1 });

      if (interactions.length === 0) {
        return 0.1; // 没有互动时给低分
      }

      // 优化14.2: 多维度互动分析
      const interactionAnalysis = this.analyzeInteractions(interactions, userAId, userBId);
      
      // 优化14.3: 计算综合得分
      const baseScore = this.calculateBaseInteractionScore(interactions);
      const reciprocityScore = this.calculateReciprocityScore(interactions, userAId, userBId);
      const frequencyScore = this.calculateFrequencyScore(interactions);
      const recencyScore = this.calculateRecencyScore(interactions);
      
      // 优化14.4: 动态权重组合
      const finalScore = (
        baseScore * 0.4 +
        reciprocityScore * 0.25 +
        frequencyScore * 0.2 +
        recencyScore * 0.15
      );

      // 优化14.5: 缓存结果
      await redisService.set(cacheKey, finalScore.toString(), 1800);
      
      return Math.min(Math.max(finalScore, 0), 1); // 确保在[0,1]范围内
    } catch (error) {
      console.error('Error calculating interaction score:', error);
      return 0.1;
    }
  }

  // 分析互动模式
  analyzeInteractions(interactions, userAId, userBId) {
    const analysis = {
      totalInteractions: interactions.length,
      userAInitiated: 0,
      userBInitiated: 0,
      actionTypes: {},
      timePatterns: [],
      reciprocity: 0
    };

    interactions.forEach(interaction => {
      if (interaction.userId === userAId) {
        analysis.userAInitiated++;
      } else {
        analysis.userBInitiated++;
      }

      analysis.actionTypes[interaction.actionType] = 
        (analysis.actionTypes[interaction.actionType] || 0) + 1;
      
      analysis.timePatterns.push(interaction.createdAt);
    });

    // 计算互惠性
    analysis.reciprocity = Math.min(analysis.userAInitiated, analysis.userBInitiated) / 
                           Math.max(analysis.userAInitiated, analysis.userBInitiated);

    return analysis;
  }

  // 计算基础互动得分
  calculateBaseInteractionScore(interactions) {
      const actionWeights = {
        'like': 1,
        'comment': 5,
        'forward': 3,
      'view': 0.5,
      'share': 4,
      'bookmark': 2,
      'follow': 6
      };

    let score = 0;
      const now = new Date();

      interactions.forEach(interaction => {
        const daysDiff = (now - interaction.createdAt) / (1000 * 60 * 60 * 24);
        const timeDecay = Math.exp(-daysDiff / 30); // 30天半衰期
        
        const actionWeight = actionWeights[interaction.actionType] || 1;
        score += actionWeight * timeDecay;
      });

    // 归一化
    const maxPossibleScore = 100;
      return Math.min(score / maxPossibleScore, 1.0);
  }

  // 计算互惠性得分
  calculateReciprocityScore(interactions, userAId, userBId) {
    const userAInteractions = interactions.filter(i => i.userId === userAId);
    const userBInteractions = interactions.filter(i => i.userId === userBId);
    
    if (userAInteractions.length === 0 || userBInteractions.length === 0) {
      return 0.1; // 单方面互动
    }

    // 计算互动平衡度
    const balance = Math.min(userAInteractions.length, userBInteractions.length) / 
                   Math.max(userAInteractions.length, userBInteractions.length);
    
    return balance;
  }

  // 计算频率得分
  calculateFrequencyScore(interactions) {
    if (interactions.length < 2) return 0.1;

    // 计算互动间隔
    const intervals = [];
    for (let i = 1; i < interactions.length; i++) {
      const interval = (interactions[i-1].createdAt - interactions[i].createdAt) / (1000 * 60 * 60 * 24);
      intervals.push(interval);
    }

    // 计算平均间隔
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    // 间隔越短，频率得分越高
    const frequencyScore = Math.exp(-avgInterval / 7); // 7天为基准
    return Math.min(frequencyScore, 1.0);
  }

  // 计算最近性得分
  calculateRecencyScore(interactions) {
    if (interactions.length === 0) return 0;

    const latestInteraction = interactions[0];
    const now = new Date();
    const daysDiff = (now - latestInteraction.createdAt) / (1000 * 60 * 60 * 24);
    
    // 最近性衰减
    const recencyScore = Math.exp(-daysDiff / 14); // 14天半衰期
    return Math.min(recencyScore, 1.0);
  }

  // 计算内容偏好匹配度
  calculateContentPreferenceMatch(userA, userB) {
    try {
      const prefsA = userA.contentPreferences || new Map();
      const prefsB = userB.contentPreferences || new Map();

      if (prefsA.size === 0 && prefsB.size === 0) {
        return 0.5; // 都没有偏好时给中等匹配度
      }

      let matchScore = 0;
      let totalWeight = 0;

      // 计算用户A的偏好与用户B的匹配度
      for (const [tag, weight] of prefsA) {
        if (prefsB.has(tag)) {
          matchScore += weight * prefsB.get(tag);
        }
        totalWeight += weight;
      }

      if (totalWeight === 0) {
        return 0.1;
      }

      return Math.min(matchScore / totalWeight, 1.0);
    } catch (error) {
      console.error('Error calculating content preference match:', error);
      return 0.1;
    }
  }

  // 生成随机因子
  generateRandomFactor() {
    return Math.random();
  }

  // 根据用户成熟度调整权重
  getAdjustedWeights(user) {
    const daysActive = user.daysActive || 0;
    
    if (daysActive >= this.matureUserThreshold) {
      // 成熟用户：降低标签权重，提高互动权重
      return {
        tagSimilarity: this.weights.tagSimilarity * 0.7,
        interactionScore: this.weights.interactionScore * 1.3,
        contentPreferenceMatch: this.weights.contentPreferenceMatch,
        randomFactor: this.weights.randomFactor
      };
    } else {
      // 新用户：使用默认权重
      return this.weights;
    }
  }

  // 保存共鸣记录
  async saveResonanceRecord(userAId, userBId, factors) {
    try {
      const existingRecord = await Resonance.findOne({
        $or: [
          { userA: userAId, userB: userBId },
          { userA: userBId, userB: userAId }
        ]
      });

      if (existingRecord) {
        // 更新现有记录
        existingRecord.tagSimilarity = factors.tagSimilarity;
        existingRecord.interactionScore = factors.interactionScore;
        existingRecord.contentPreferenceMatch = factors.contentPreferenceMatch;
        existingRecord.randomFactor = factors.randomFactor;
        existingRecord.totalResonance = factors.totalResonance;
        existingRecord.calculatedAt = new Date();

        // 添加到历史记录
        existingRecord.history.push({
          timestamp: new Date(),
          resonance: factors.totalResonance,
          factors: {
            tagSimilarity: factors.tagSimilarity,
            interactionScore: factors.interactionScore,
            contentPreferenceMatch: factors.contentPreferenceMatch,
            randomFactor: factors.randomFactor
          }
        });

        await existingRecord.save();
      } else {
        // 创建新记录
        const resonanceRecord = new Resonance({
          userA: userAId,
          userB: userBId,
          tagSimilarity: factors.tagSimilarity,
          interactionScore: factors.interactionScore,
          contentPreferenceMatch: factors.contentPreferenceMatch,
          randomFactor: factors.randomFactor,
          totalResonance: factors.totalResonance,
          history: [{
            timestamp: new Date(),
            resonance: factors.totalResonance,
            factors: {
              tagSimilarity: factors.tagSimilarity,
              interactionScore: factors.interactionScore,
              contentPreferenceMatch: factors.contentPreferenceMatch,
              randomFactor: factors.randomFactor
            }
          }]
        });

        await resonanceRecord.save();
      }
    } catch (error) {
      console.error('Error saving resonance record:', error);
    }
  }

  // 批量计算用户与多个用户的共鸣值
  async calculateBatchResonance(userA, candidateUsers) {
    try {
      const results = [];
      
      for (const userB of candidateUsers) {
        const resonance = await this.calculateResonance(userA, userB);
        results.push({
          user: userB,
          resonance: resonance
        });
      }

      // 按共鸣值排序
      return results.sort((a, b) => b.resonance - a.resonance);
    } catch (error) {
      console.error('Error calculating batch resonance:', error);
      throw error;
    }
  }

  // 获取用户共鸣历史
  async getUserResonanceHistory(userId, limit = 50) {
    try {
      const history = await Resonance.find({
        $or: [
          { userA: userId },
          { userB: userId }
        ]
      })
      .populate('userA', 'nickname avatar')
      .populate('userB', 'nickname avatar')
      .sort({ calculatedAt: -1 })
      .limit(limit);

      return history;
    } catch (error) {
      console.error('Error getting resonance history:', error);
      throw error;
    }
  }

  // 获取共鸣统计
  async getResonanceStats(userId) {
    try {
      const stats = await Resonance.aggregate([
        {
          $match: {
            $or: [
              { userA: userId },
              { userB: userId }
            ]
          }
        },
        {
          $group: {
            _id: null,
            averageResonance: { $avg: '$totalResonance' },
            maxResonance: { $max: '$totalResonance' },
            minResonance: { $min: '$totalResonance' },
            totalConnections: { $sum: 1 }
          }
        }
      ]);

      return stats[0] || {
        averageResonance: 0,
        maxResonance: 0,
        minResonance: 0,
        totalConnections: 0
      };
    } catch (error) {
      console.error('Error getting resonance stats:', error);
      throw error;
    }
  }

  // 优化方法1: 生成智能缓存键
  generateCacheKey(userAId, userBId) {
    // 确保键的一致性，避免重复计算
    const sortedIds = [userAId.toString(), userBId.toString()].sort();
    return `resonance:${sortedIds[0]}:${sortedIds[1]}`;
  }

  // 优化方法2: 缓存命中统计
  async incrementCacheHit(cacheKey) {
    try {
      await redisService.incrementCounter(`cache_hit:${cacheKey}`);
    } catch (error) {
      // 静默处理缓存统计错误
      console.warn('Cache hit increment failed:', error.message);
    }
  }

  // 优化方法3: 缓存权重计算结果
  async getCachedAdjustedWeights(user) {
    const cacheKey = `weights:${user._id}:${user.daysActive || 0}`;
    
    try {
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Weight cache read failed:', error.message);
    }

    const weights = this.getAdjustedWeights(user);
    
    // 异步缓存权重
    setImmediate(() => {
      redisService.set(cacheKey, JSON.stringify(weights), 1800).catch(err => 
        console.warn('Weight cache write failed:', err.message)
      );
    });

    return weights;
  }

  // 优化方法4: 精确的加权共鸣计算
  calculateWeightedResonance(tagSimilarity, interactionScore, contentPreferenceMatch, randomFactor, weights) {
    // 使用更精确的数学计算，避免浮点数误差
    const result = (
      Math.round(tagSimilarity * weights.tagSimilarity * 10000) +
      Math.round(interactionScore * weights.interactionScore * 10000) +
      Math.round(contentPreferenceMatch * weights.contentPreferenceMatch * 10000) +
      Math.round(randomFactor * weights.randomFactor * 10000)
    ) / 100;

    return Math.min(Math.max(result, 0), 100); // 确保在0-100范围内
  }

  // 优化方法5: 降级策略
  getFallbackResonance(userA, userB) {
    // 基于用户基本信息的简单共鸣计算
    const baseResonance = 30; // 基础共鸣值
    const tagBonus = (userA.tags || []).length > 0 && (userB.tags || []).length > 0 ? 20 : 0;
    const activityBonus = Math.min((userA.daysActive || 0) + (userB.daysActive || 0), 30);
    
    return Math.min(baseResonance + tagBonus + activityBonus, 100);
  }

  // 优化方法6: 批量共鸣计算优化
  async calculateBatchResonanceOptimized(userA, candidateUsers) {
    try {
      const batchSize = 10; // 批量处理大小
      const results = [];
      
      // 分批处理，避免内存溢出
      for (let i = 0; i < candidateUsers.length; i += batchSize) {
        const batch = candidateUsers.slice(i, i + batchSize);
        const batchPromises = batch.map(async (userB) => {
          const resonance = await this.calculateResonance(userA, userB);
          return {
            user: userB,
            resonance: resonance
          };
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      // 按共鸣值排序
      return results.sort((a, b) => b.resonance - a.resonance);
    } catch (error) {
      console.error('Error calculating batch resonance:', error);
      throw error;
    }
  }

  // 优化方法7: 共鸣值预测
  async predictResonance(userA, userB) {
    try {
      // 基于历史数据预测共鸣值
      const historicalData = await this.getHistoricalResonanceData(userA._id, userB._id);
      
      if (historicalData.length === 0) {
        return this.getFallbackResonance(userA, userB);
      }

      // 使用加权平均预测
      const weights = historicalData.map((data, index) => Math.pow(0.9, index));
      const weightedSum = historicalData.reduce((sum, data, index) => 
        sum + data.resonance * weights[index], 0
      );
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

      return Math.round((weightedSum / totalWeight) * 100) / 100;
    } catch (error) {
      console.error('Error predicting resonance:', error);
      return this.getFallbackResonance(userA, userB);
    }
  }

  // 优化方法8: 获取历史共鸣数据
  async getHistoricalResonanceData(userAId, userBId) {
    try {
      const history = await Resonance.findOne({
        $or: [
          { userA: userAId, userB: userBId },
          { userA: userBId, userB: userAId }
        ]
      }).select('history');

      return history?.history?.slice(-10) || []; // 返回最近10次记录
    } catch (error) {
      console.error('Error getting historical resonance data:', error);
      return [];
    }
  }

  // 生成请求ID - 道法自然优化
  generateRequestId() {
    try {
      return randomUUID();
    } catch (e) {
      try {
        return randomBytes(16).toString('hex');
      } catch (e2) {
        return Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
      }
    }
  }
}

module.exports = ResonanceCalculator;

// 优化9: 性能监控方法 - 第2次优化：增强性能监控
async function recordPerformanceMetrics(userAId, userBId, executionTime) {
  try {
    const metrics = {
      userAId,
      userBId,
      executionTime,
      timestamp: new Date(),
      algorithm: 'resonanceCalculator',
      // 优化2.1: 添加性能等级分类
      performanceLevel: executionTime < 100 ? 'excellent' : 
                       executionTime < 500 ? 'good' : 
                       executionTime < 1000 ? 'acceptable' : 'slow'
    };
    
    // 异步记录到Redis
    await redisService.set(`perf:resonance:${userAId}:${userBId}`, JSON.stringify(metrics), 86400);
    
    // 优化2.2: 增强性能警告和统计
    if (executionTime > 1000) {
      console.warn(`Slow resonance calculation: ${executionTime}ms for users ${userAId} and ${userBId}`);
      // 记录慢查询统计
      await redisService.increment(`slow_queries:resonance:${new Date().toISOString().split('T')[0]}`);
    }
    
    // 优化2.3: 记录性能分布统计
    const performanceBucket = Math.floor(executionTime / 100) * 100;
    await redisService.increment(`perf_distribution:resonance:${performanceBucket}ms`);
    
  } catch (error) {
    console.error('Performance metrics recording failed:', error);
  }
}

// 优化2.4: 新增缓存命中指标记录方法
async function recordCacheHitMetrics(userAId, userBId, cacheTime) {
  try {
    const metrics = {
      userAId,
      userBId,
      cacheTime,
      timestamp: new Date(),
      type: 'cache_hit'
    };
    
    await redisService.set(`cache_hit:resonance:${userAId}:${userBId}`, JSON.stringify(metrics), 3600);
    await redisService.increment(`cache_hits:resonance:${new Date().toISOString().split('T')[0]}`);
    
  } catch (error) {
    console.error('Cache hit metrics recording failed:', error);
  }
}

// 第2次优化: 新增并行性能记录方法
async function recordParallelPerformance(userAId, userBId, parallelTime) {
  try {
    const metrics = {
      userAId,
      userBId,
      parallelTime,
      timestamp: new Date(),
      type: 'parallel_performance',
      // 优化2.1: 添加性能等级分类
      performanceLevel: parallelTime < 50 ? 'excellent' : 
                       parallelTime < 100 ? 'good' : 
                       parallelTime < 200 ? 'acceptable' : 'slow'
    };
    
    await redisService.set(`parallel_perf:resonance:${userAId}:${userBId}`, JSON.stringify(metrics), 3600);
    
    // 优化2.2: 记录并行性能分布统计
    const performanceBucket = Math.floor(parallelTime / 25) * 25;
    await redisService.increment(`parallel_perf_distribution:${performanceBucket}ms`);
    
    // 优化2.3: 如果并行时间过长，记录警告
    if (parallelTime > 200) {
      console.warn(`Slow parallel calculation: ${parallelTime}ms for users ${userAId} and ${userBId}`);
      await redisService.increment(`slow_parallel:resonance:${new Date().toISOString().split('T')[0]}`);
    }
    
  } catch (error) {
    console.error('Parallel performance recording failed:', error);
  }
}

// 第2次优化: 新增计算错误记录方法
async function recordCalculationError(calculationType, userAId, userBId, error) {
  try {
    const errorData = {
      calculationType,
      userAId,
      userBId,
      error: error.message || error.toString(),
      stack: error.stack,
      timestamp: new Date(),
      type: 'calculation_error'
    };
    
    // 记录错误详情
    await redisService.set(`calc_error:${calculationType}:${userAId}:${userBId}`, JSON.stringify(errorData), 86400);
    
    // 记录错误统计
    await redisService.increment(`calc_errors:${calculationType}:${new Date().toISOString().split('T')[0]}`);
    
    // 记录总错误数
    await redisService.increment(`total_calc_errors:${new Date().toISOString().split('T')[0]}`);
    
    console.error(`Calculation error in ${calculationType}:`, error);
    
  } catch (recordError) {
    console.error('Error recording calculation error:', recordError);
  }
}

// 优化10: 批量共鸣计算
async function calculateBatchResonance(userPairs) {
  const results = [];
  const batchSize = 10; // 每批处理10对用户
  
  for (let i = 0; i < userPairs.length; i += batchSize) {
    const batch = userPairs.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(([userA, userB]) => 
        new ResonanceCalculator().calculateResonance(userA, userB)
      )
    );
    results.push(...batchResults);
  }
  
  return results;
}

