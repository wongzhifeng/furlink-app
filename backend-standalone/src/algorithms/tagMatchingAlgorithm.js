class TagMatchingAlgorithm {
  constructor() {
    // 标签权重配置
    this.tagWeights = {
      '旅行': 1.2,
      '美食': 1.1,
      '音乐': 1.0,
      '电影': 1.0,
      '读书': 1.1,
      '运动': 1.0,
      '摄影': 1.1,
      '艺术': 1.2,
      '科技': 1.0,
      '游戏': 0.9,
      '时尚': 1.0,
      '宠物': 1.1,
      '健身': 1.0,
      '瑜伽': 1.1,
      '咖啡': 1.0,
      '茶': 1.0,
      '酒': 0.9,
      '烹饪': 1.1,
      '园艺': 1.0,
      '手工': 1.1
    };

    // 标签分类
    this.tagCategories = {
      'lifestyle': ['旅行', '美食', '时尚', '咖啡', '茶', '酒', '烹饪'],
      'entertainment': ['音乐', '电影', '游戏', '读书'],
      'health': ['运动', '健身', '瑜伽'],
      'creative': ['摄影', '艺术', '手工', '园艺'],
      'tech': ['科技', '游戏']
    };
    
    // 优化1: 添加LRU缓存，提升重复计算性能
    this.similarityCache = new Map();
    this.cacheMaxSize = 10000;
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
    
    // 优化2: 预计算分类映射，避免重复遍历
    this.tagToCategoryMap = this._buildTagToCategoryMap();
    
    // 优化3: 添加性能统计
    this.performanceStats = {
      totalCalculations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCalculationTime: 0
    };
  }
  
  // 优化2: 构建标签到分类的映射，O(1)查找
  _buildTagToCategoryMap() {
    const map = new Map();
    Object.entries(this.tagCategories).forEach(([category, tags]) => {
      tags.forEach(tag => {
        if (!map.has(tag)) {
          map.set(tag, []);
        }
        map.get(tag).push(category);
      });
    });
    return map;
  }
  
  // 优化1: 生成缓存键
  _getCacheKey(tagsA, tagsB) {
    const sortedA = [...tagsA].sort().join(',');
    const sortedB = [...tagsB].sort().join(',');
    return sortedA <= sortedB ? `${sortedA}|${sortedB}` : `${sortedB}|${sortedA}`;
  }
  
  // 优化1: 从缓存获取或计算
  _getFromCacheOrCalculate(key, calculateFn) {
    if (this.similarityCache.has(key)) {
      this.cacheHitCount++;
      this.performanceStats.cacheHits++;
      const entry = this.similarityCache.get(key);
      // LRU: 更新访问时间
      this.similarityCache.delete(key);
      this.similarityCache.set(key, entry);
      return entry.value;
    }
    
    this.cacheMissCount++;
    this.performanceStats.cacheMisses++;
    
    const value = calculateFn();
    
    // LRU: 如果缓存满了，删除最旧的条目
    if (this.similarityCache.size >= this.cacheMaxSize) {
      const firstKey = this.similarityCache.keys().next().value;
      this.similarityCache.delete(firstKey);
    }
    
    this.similarityCache.set(key, { value, timestamp: Date.now() });
    return value;
  }
  
  // 优化1: 清理缓存
  clearCache() {
    this.similarityCache.clear();
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
  }
  
  // 优化1: 获取缓存统计
  getCacheStats() {
    return {
      size: this.similarityCache.size,
      maxSize: this.cacheMaxSize,
      hitCount: this.cacheHitCount,
      missCount: this.cacheMissCount,
      hitRate: this.cacheHitCount / (this.cacheHitCount + this.cacheMissCount) || 0
    };
  }

  // 计算标签相似度（主要方法）- 优化26: 增强输入验证和错误处理
  calculateTagSimilarity(tagsA, tagsB) {
    const startTime = Date.now();
    
    // 优化26: 增强输入验证
    if (!tagsA || !tagsB || !Array.isArray(tagsA) || !Array.isArray(tagsB)) {
      return 0.1; // 没有标签时给低相似度
    }

    if (tagsA.length === 0 || tagsB.length === 0) {
      return 0.1; // 没有标签时给低相似度
    }

    // 优化1: 使用缓存
    const cacheKey = this._getCacheKey(tagsA, tagsB);
    const cachedResult = this._getFromCacheOrCalculate(cacheKey, () => {
      try {
        // 计算多种相似度
        const jaccardSimilarity = this.calculateJaccardSimilarity(tagsA, tagsB);
        const cosineSimilarity = this.calculateCosineSimilarity(tagsA, tagsB);
        const weightedSimilarity = this.calculateWeightedSimilarity(tagsA, tagsB);
        const categorySimilarity = this.calculateCategorySimilarity(tagsA, tagsB);

        // 综合相似度（加权平均）
        const combinedSimilarity = (
          jaccardSimilarity * 0.3 +
          cosineSimilarity * 0.3 +
          weightedSimilarity * 0.25 +
          categorySimilarity * 0.15
        );

        return Math.min(combinedSimilarity, 1.0);
      } catch (error) {
        console.error('Error calculating similarity:', error);
        return 0.1;
      }
    });
    
    // 优化3: 更新性能统计
    const calculationTime = Date.now() - startTime;
    this.performanceStats.totalCalculations++;
    this.performanceStats.averageCalculationTime = 
      (this.performanceStats.averageCalculationTime * (this.performanceStats.totalCalculations - 1) + calculationTime) / 
      this.performanceStats.totalCalculations;
    
    return cachedResult;
  }

  // 计算Jaccard相似度 - 优化27: 添加输入验证和错误处理
  calculateJaccardSimilarity(tagsA, tagsB) {
    try {
      // 优化27: 输入验证
      if (!tagsA || !tagsB || !Array.isArray(tagsA) || !Array.isArray(tagsB)) {
        return 0;
      }

      if (tagsA.length === 0 && tagsB.length === 0) {
        return 1; // 都为空时相似度为1
      }

      if (tagsA.length === 0 || tagsB.length === 0) {
        return 0;
      }

      const setA = new Set(tagsA);
      const setB = new Set(tagsB);
      
      const intersection = new Set([...setA].filter(x => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      
      return union.size > 0 ? intersection.size / union.size : 0;
    } catch (error) {
      console.error('Error calculating Jaccard similarity:', error);
      return 0;
    }
  }

  // 计算余弦相似度
  calculateCosineSimilarity(tagsA, tagsB) {
    const allTags = [...new Set([...tagsA, ...tagsB])];
    
    const vectorA = allTags.map(tag => {
      const count = tagsA.filter(t => t === tag).length;
      const weight = this.tagWeights[tag] || 1.0;
      return count * weight;
    });
    
    const vectorB = allTags.map(tag => {
      const count = tagsB.filter(t => t === tag).length;
      const weight = this.tagWeights[tag] || 1.0;
      return count * weight;
    });

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

  // 计算加权相似度
  calculateWeightedSimilarity(tagsA, tagsB) {
    const weightedTagsA = tagsA.map(tag => ({
      tag,
      weight: this.tagWeights[tag] || 1.0
    }));
    
    const weightedTagsB = tagsB.map(tag => ({
      tag,
      weight: this.tagWeights[tag] || 1.0
    }));

    let totalWeight = 0;
    let matchedWeight = 0;

    // 计算A中每个标签的权重
    weightedTagsA.forEach(({ tag, weight }) => {
      totalWeight += weight;
      if (tagsB.includes(tag)) {
        matchedWeight += weight;
      }
    });

    // 计算B中每个标签的权重
    weightedTagsB.forEach(({ tag, weight }) => {
      if (!tagsA.includes(tag)) {
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? matchedWeight / totalWeight : 0;
  }

  // 计算分类相似度
  calculateCategorySimilarity(tagsA, tagsB) {
    const categoriesA = this.getTagCategories(tagsA);
    const categoriesB = this.getTagCategories(tagsB);

    if (categoriesA.size === 0 && categoriesB.size === 0) {
      return 0.5; // 都没有分类时给中等相似度
    }

    const intersection = new Set([...categoriesA].filter(x => categoriesB.has(x)));
    const union = new Set([...categoriesA, ...categoriesB]);

    return intersection.size / union.size;
  }

  // 获取标签所属分类 - 优化2: 使用预计算的映射，O(n)而不是O(n*m)
  getTagCategories(tags) {
    const categories = new Set();
    
    tags.forEach(tag => {
      const tagCategories = this.tagToCategoryMap.get(tag);
      if (tagCategories) {
        tagCategories.forEach(category => categories.add(category));
      }
    });

    return categories;
  }

  // 计算标签距离（用于聚类）
  calculateTagDistance(tagsA, tagsB) {
    const similarity = this.calculateTagSimilarity(tagsA, tagsB);
    return 1 - similarity; // 距离 = 1 - 相似度
  }

  // 获取标签推荐
  getTagRecommendations(userTags, allTags, limit = 10) {
    const recommendations = [];
    
    allTags.forEach(tag => {
      if (!userTags.includes(tag)) {
        const similarity = this.calculateTagSimilarity(userTags, [tag]);
        recommendations.push({
          tag,
          similarity,
          weight: this.tagWeights[tag] || 1.0
        });
      }
    });

    // 按相似度和权重排序
    return recommendations
      .sort((a, b) => (b.similarity * b.weight) - (a.similarity * a.weight))
      .slice(0, limit);
  }

  // 计算标签多样性
  calculateTagDiversity(tags) {
    if (tags.length === 0) return 0;
    
    const categories = this.getTagCategories(tags);
    const categoryCount = categories.size;
    const tagCount = tags.length;
    
    // 多样性 = 分类数 / 标签数 * 0.5 + 分类数 / 总分类数 * 0.5
    const categoryDiversity = categoryCount / tagCount;
    const totalCategories = Object.keys(this.tagCategories).length;
    const globalDiversity = categoryCount / totalCategories;
    
    return categoryDiversity * 0.5 + globalDiversity * 0.5;
  }

  // 标签相似度矩阵
  calculateSimilarityMatrix(tagList) {
    const matrix = [];
    
    for (let i = 0; i < tagList.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < tagList.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          matrix[i][j] = this.calculateTagSimilarity([tagList[i]], [tagList[j]]);
        }
      }
    }
    
    return matrix;
  }

  // 更新标签权重（基于用户行为）
  updateTagWeights(tag, interactionCount, positiveFeedback) {
    const currentWeight = this.tagWeights[tag] || 1.0;
    const feedbackFactor = positiveFeedback ? 1.1 : 0.9;
    const interactionFactor = Math.min(interactionCount / 100, 1.2); // 最多1.2倍
    
    this.tagWeights[tag] = Math.max(0.1, Math.min(2.0, currentWeight * feedbackFactor * interactionFactor));
  }

  // 获取标签统计
  getTagStats(tags) {
    const stats = {
      totalTags: tags.length,
      uniqueTags: new Set(tags).size,
      categories: this.getTagCategories(tags).size,
      diversity: this.calculateTagDiversity(tags),
      averageWeight: 0,
      weightedTags: []
    };

    let totalWeight = 0;
    tags.forEach(tag => {
      const weight = this.tagWeights[tag] || 1.0;
      totalWeight += weight;
      stats.weightedTags.push({ tag, weight });
    });

    stats.averageWeight = totalWeight / tags.length;
    stats.weightedTags.sort((a, b) => b.weight - a.weight);

    return stats;
  }
  
  // 优化3: 获取性能统计
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      cache: this.getCacheStats()
    };
  }
  
  // 优化3: 重置性能统计
  resetPerformanceStats() {
    this.performanceStats = {
      totalCalculations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCalculationTime: 0
    };
    this.clearCache();
  }
}

module.exports = TagMatchingAlgorithm;

