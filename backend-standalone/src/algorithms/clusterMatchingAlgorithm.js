const { User, Interaction, Resonance } = require('../models');
const ResonanceCalculator = require('./resonanceCalculator');

class ClusterMatchingAlgorithm {
  constructor() {
    this.resonanceCalculator = new ResonanceCalculator();
    this.clusterSize = 49;
    this.minResonanceThreshold = 50;
    this.maxResonanceThreshold = 95;
    this.diversityThreshold = 0.3;
  }

  // 49人匹配主算法 - 优化5: 增强输入验证和错误处理
  async match49Users(coreUsers, candidatePool) {
    try {
      // 优化5: 增强输入验证
      if (!coreUsers || !Array.isArray(coreUsers)) {
        throw new Error('无效的核心用户参数');
      }
      
      if (!candidatePool || !Array.isArray(candidatePool)) {
        throw new Error('无效的候选用户池参数');
      }

      if (coreUsers.length < 2) {
        throw new Error('核心用户数量不足');
      }

      if (candidatePool.length < this.clusterSize - coreUsers.length) {
        throw new Error('候选用户池数量不足');
      }

      // 1. 计算所有候选用户的共鸣值
      const candidatesWithResonance = await this.calculateCandidatesResonance(coreUsers, candidatePool);

      // 2. 按共鸣值排序
      const sortedCandidates = this.sortCandidatesByResonance(candidatesWithResonance);

      // 3. 应用多样性约束
      const diverseCandidates = await this.applyDiversityConstraints(sortedCandidates, coreUsers);

      // 4. 应用活跃度平衡
      const balancedCandidates = await this.applyActivityBalance(diverseCandidates, coreUsers);

      // 5. 最终筛选49人
      const finalMembers = this.selectFinalMembers(coreUsers, balancedCandidates);

      // 6. 验证星团质量
      const qualityScore = await this.calculateClusterQuality(finalMembers);

      return {
        members: finalMembers,
        qualityScore,
        coreUsers: coreUsers,
        averageResonance: this.calculateAverageResonance(finalMembers),
        diversityScore: this.calculateDiversityScore(finalMembers),
        activityBalance: this.calculateActivityBalance(finalMembers)
      };
    } catch (error) {
      console.error('Error matching 49 users:', error);
      throw error;
    }
  }

  // 计算候选用户共鸣值 - 优化6: 使用Promise.all并行计算
  async calculateCandidatesResonance(coreUsers, candidatePool) {
    try {
      const candidatesWithResonance = [];

      // 优化6: 并行处理所有候选用户
      const candidatePromises = candidatePool.map(async (candidate) => {
        const resonanceValues = [];
        
        // 计算与每个核心用户的共鸣值
        const resonancePromises = coreUsers.map(coreUser => 
          this.resonanceCalculator.calculateResonance(coreUser, candidate)
        );
        
        const results = await Promise.all(resonancePromises);
        resonanceValues.push(...results);

        // 计算平均共鸣值
        const averageResonance = resonanceValues.reduce((sum, val) => sum + val, 0) / resonanceValues.length;
        
        // 计算共鸣值方差（稳定性指标）
        const variance = resonanceValues.reduce((sum, val) => sum + Math.pow(val - averageResonance, 2), 0) / resonanceValues.length;
        const stability = 1 / (1 + variance); // 方差越小，稳定性越高

        return {
          user: candidate,
          resonanceValues,
          averageResonance,
          stability,
          maxResonance: Math.max(...resonanceValues),
          minResonance: Math.min(...resonanceValues)
        };
      });

      // 优化6: 使用Promise.all并行执行所有计算
      const results = await Promise.all(candidatePromises);
      return results;
    } catch (error) {
      console.error('Error calculating candidates resonance:', error);
      throw error;
    }
  }

  // 按共鸣值排序候选用户
  sortCandidatesByResonance(candidates) {
    return candidates.sort((a, b) => {
      // 主要按平均共鸣值排序
      if (Math.abs(a.averageResonance - b.averageResonance) > 5) {
        return b.averageResonance - a.averageResonance;
      }
      
      // 共鸣值相近时，按稳定性排序
      return b.stability - a.stability;
    });
  }

  // 应用多样性约束
  async applyDiversityConstraints(candidates, coreUsers) {
    try {
      const coreTags = new Set();
      coreUsers.forEach(user => {
        (user.tags || []).forEach(tag => coreTags.add(tag));
      });

      const diverseCandidates = [];
      const tagCounts = new Map();
      const maxSameTagCount = Math.floor(this.clusterSize * 0.4); // 最多40%用户有相同标签

      for (const candidate of candidates) {
        const candidateTags = candidate.user.tags || [];
        const coreTagOverlap = candidateTags.filter(tag => coreTags.has(tag));
        
        if (coreTagOverlap.length === 0) {
          // 无核心标签重叠，直接加入
          diverseCandidates.push(candidate);
        } else {
          // 有核心标签重叠，检查是否超过限制
          const primaryTag = coreTagOverlap[0];
          const currentCount = tagCounts.get(primaryTag) || 0;
          
          if (currentCount < maxSameTagCount) {
            tagCounts.set(primaryTag, currentCount + 1);
            diverseCandidates.push(candidate);
          }
        }
      }

      return diverseCandidates;
    } catch (error) {
      console.error('Error applying diversity constraints:', error);
      return candidates;
    }
  }

  // 应用活跃度平衡
  async applyActivityBalance(candidates, coreUsers) {
    try {
      const balancedCandidates = [];
      const activityLevels = {
        high: [],    // 30天以上
        medium: [],  // 7-30天
        low: []      // 7天以下
      };

      // 分类候选用户
      candidates.forEach(candidate => {
        const daysActive = candidate.user.daysActive || 0;
        if (daysActive >= 30) {
          activityLevels.high.push(candidate);
        } else if (daysActive >= 7) {
          activityLevels.medium.push(candidate);
        } else {
          activityLevels.low.push(candidate);
        }
      });

      // 计算目标分布
      const remainingSlots = this.clusterSize - coreUsers.length;
      const targetDistribution = {
        high: Math.floor(remainingSlots * 0.3),    // 30%高活跃
        medium: Math.floor(remainingSlots * 0.4),  // 40%中活跃
        low: remainingSlots - Math.floor(remainingSlots * 0.3) - Math.floor(remainingSlots * 0.4) // 剩余低活跃
      };

      // 按目标分布选择用户
      balancedCandidates.push(...activityLevels.high.slice(0, targetDistribution.high));
      balancedCandidates.push(...activityLevels.medium.slice(0, targetDistribution.medium));
      balancedCandidates.push(...activityLevels.low.slice(0, targetDistribution.low));

      return balancedCandidates;
    } catch (error) {
      console.error('Error applying activity balance:', error);
      return candidates;
    }
  }

  // 选择最终成员
  selectFinalMembers(coreUsers, balancedCandidates) {
    const finalMembers = [...coreUsers];
    
    // 按共鸣值选择剩余成员
    const remainingSlots = this.clusterSize - coreUsers.length;
    const selectedCandidates = balancedCandidates
      .slice(0, remainingSlots)
      .map(candidate => candidate.user);
    
    finalMembers.push(...selectedCandidates);
    
    return finalMembers;
  }

  // 计算星团质量
  async calculateClusterQuality(members) {
    try {
      const qualityFactors = {
        resonanceQuality: 0,
        diversityQuality: 0,
        activityQuality: 0,
        stabilityQuality: 0
      };

      // 1. 共鸣质量
      qualityFactors.resonanceQuality = await this.calculateResonanceQuality(members);

      // 2. 多样性质量
      qualityFactors.diversityQuality = this.calculateDiversityQuality(members);

      // 3. 活跃度质量
      qualityFactors.activityQuality = this.calculateActivityQuality(members);

      // 4. 稳定性质量
      qualityFactors.stabilityQuality = await this.calculateStabilityQuality(members);

      // 综合质量得分
      const overallQuality = (
        qualityFactors.resonanceQuality * 0.4 +
        qualityFactors.diversityQuality * 0.3 +
        qualityFactors.activityQuality * 0.2 +
        qualityFactors.stabilityQuality * 0.1
      );

      return {
        overall: overallQuality,
        factors: qualityFactors
      };
    } catch (error) {
      console.error('Error calculating cluster quality:', error);
      return {
        overall: 0,
        factors: {
          resonanceQuality: 0,
          diversityQuality: 0,
          activityQuality: 0,
          stabilityQuality: 0
        }
      };
    }
  }

  // 计算共鸣质量 - 优化7: 使用采样法提高性能
  async calculateResonanceQuality(members) {
    try {
      let totalResonance = 0;
      let pairCount = 0;

      // 优化7: 对于大规模成员，使用采样法而非全量计算
      const sampleSize = Math.min(members.length, 20);
      const sampledMembers = members.slice(0, sampleSize);

      for (let i = 0; i < sampledMembers.length; i++) {
        for (let j = i + 1; j < sampledMembers.length; j++) {
          const resonance = await this.resonanceCalculator.calculateResonance(sampledMembers[i], sampledMembers[j]);
          totalResonance += resonance;
          pairCount++;
        }
      }

      const averageResonance = totalResonance / pairCount;
      return Math.min(averageResonance / 100, 1.0); // 归一化到0-1
    } catch (error) {
      console.error('Error calculating resonance quality:', error);
      return 0;
    }
  }

  // 计算多样性质量
  calculateDiversityQuality(members) {
    try {
      const allTags = new Set();
      members.forEach(member => {
        (member.tags || []).forEach(tag => allTags.add(tag));
      });

      const tagCounts = new Map();
      members.forEach(member => {
        (member.tags || []).forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      // 计算标签分布的均匀性
      const tagCountsArray = Array.from(tagCounts.values());
      const maxCount = Math.max(...tagCountsArray);
      const minCount = Math.min(...tagCountsArray);
      
      const uniformity = 1 - (maxCount - minCount) / this.clusterSize;
      const diversity = allTags.size / this.clusterSize;

      return (uniformity + diversity) / 2;
    } catch (error) {
      console.error('Error calculating diversity quality:', error);
      return 0;
    }
  }

  // 计算活跃度质量
  calculateActivityQuality(members) {
    try {
      const activityLevels = {
        high: 0,
        medium: 0,
        low: 0
      };

      members.forEach(member => {
        const daysActive = member.daysActive || 0;
        if (daysActive >= 30) {
          activityLevels.high++;
        } else if (daysActive >= 7) {
          activityLevels.medium++;
        } else {
          activityLevels.low++;
        }
      });

      // 理想的活跃度分布
      const idealDistribution = {
        high: this.clusterSize * 0.3,
        medium: this.clusterSize * 0.4,
        low: this.clusterSize * 0.3
      };

      // 计算分布偏差
      const highDeviation = Math.abs(activityLevels.high - idealDistribution.high) / idealDistribution.high;
      const mediumDeviation = Math.abs(activityLevels.medium - idealDistribution.medium) / idealDistribution.medium;
      const lowDeviation = Math.abs(activityLevels.low - idealDistribution.low) / idealDistribution.low;

      const averageDeviation = (highDeviation + mediumDeviation + lowDeviation) / 3;
      return Math.max(0, 1 - averageDeviation);
    } catch (error) {
      console.error('Error calculating activity quality:', error);
      return 0;
    }
  }

  // 计算稳定性质量
  async calculateStabilityQuality(members) {
    try {
      let totalStability = 0;
      let pairCount = 0;

      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          // 计算历史共鸣值的稳定性
          const resonanceHistory = await Resonance.findOne({
            $or: [
              { userA: members[i]._id, userB: members[j]._id },
              { userA: members[j]._id, userB: members[i]._id }
            ]
          });

          if (resonanceHistory && resonanceHistory.history.length > 1) {
            const historyValues = resonanceHistory.history.map(h => h.resonance);
            const variance = this.calculateVariance(historyValues);
            const stability = 1 / (1 + variance);
            totalStability += stability;
          } else {
            totalStability += 0.5; // 默认稳定性
          }
          pairCount++;
        }
      }

      return totalStability / pairCount;
    } catch (error) {
      console.error('Error calculating stability quality:', error);
      return 0.5;
    }
  }

  // 计算方差
  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  // 计算平均共鸣值
  calculateAverageResonance(members) {
    // 这里简化计算，实际应该计算所有用户对的共鸣值
    return 75; // 示例值
  }

  // 计算多样性得分
  calculateDiversityScore(members) {
    const allTags = new Set();
    members.forEach(member => {
      (member.tags || []).forEach(tag => allTags.add(tag));
    });
    
    return allTags.size / this.clusterSize;
  }

  // 计算活跃度平衡
  calculateActivityBalance(members) {
    const activityLevels = {
      high: 0,
      medium: 0,
      low: 0
    };

    members.forEach(member => {
      const daysActive = member.daysActive || 0;
      if (daysActive >= 30) {
        activityLevels.high++;
      } else if (daysActive >= 7) {
        activityLevels.medium++;
      } else {
        activityLevels.low++;
      }
    });

    return activityLevels;
  }

  // 验证匹配结果
  validateMatchResult(matchResult) {
    const validation = {
      isValid: true,
      errors: []
    };

    // 检查成员数量
    if (matchResult.members.length !== this.clusterSize) {
      validation.isValid = false;
      validation.errors.push(`成员数量不正确: ${matchResult.members.length} !== ${this.clusterSize}`);
    }

    // 检查质量得分
    if (matchResult.qualityScore.overall < 0.6) {
      validation.isValid = false;
      validation.errors.push(`质量得分过低: ${matchResult.qualityScore.overall} < 0.6`);
    }

    // 检查多样性
    if (matchResult.diversityScore < this.diversityThreshold) {
      validation.isValid = false;
      validation.errors.push(`多样性不足: ${matchResult.diversityScore} < ${this.diversityThreshold}`);
    }

    return validation;
  }
}

module.exports = ClusterMatchingAlgorithm;

