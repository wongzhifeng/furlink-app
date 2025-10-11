const { User, Interaction } = require('../models');

class TagDiversityAlgorithm {
  constructor() {
    // 标签分类定义
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

    // 多样性约束参数
    this.diversityConstraints = {
      maxSameTagRatio: 0.4,        // 同一标签最多40%用户
      minCategoryCoverage: 0.3,     // 至少覆盖30%的标签分类
      maxCategoryRatio: 0.6,        // 单个分类最多60%用户
      minUniqueTags: 10,            // 至少10个不同标签
      maxTagPerUser: 8              // 每个用户最多8个标签
    };

    // 标签权重
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
  }

  // 计算标签多样性得分
  calculateTagDiversityScore(members) {
    try {
      const diversityFactors = {
        tagCount: 0,
        categoryCoverage: 0,
        tagDistribution: 0,
        categoryBalance: 0
      };

      // 1. 标签数量得分
      diversityFactors.tagCount = this.calculateTagCountScore(members);

      // 2. 分类覆盖得分
      diversityFactors.categoryCoverage = this.calculateCategoryCoverageScore(members);

      // 3. 标签分布得分
      diversityFactors.tagDistribution = this.calculateTagDistributionScore(members);

      // 4. 分类平衡得分
      diversityFactors.categoryBalance = this.calculateCategoryBalanceScore(members);

      // 综合多样性得分
      const overallScore = (
        diversityFactors.tagCount * 0.3 +
        diversityFactors.categoryCoverage * 0.3 +
        diversityFactors.tagDistribution * 0.2 +
        diversityFactors.categoryBalance * 0.2
      );

      return {
        overall: overallScore,
        factors: diversityFactors
      };
    } catch (error) {
      console.error('Error calculating tag diversity score:', error);
      return {
        overall: 0,
        factors: {
          tagCount: 0,
          categoryCoverage: 0,
          tagDistribution: 0,
          categoryBalance: 0
        }
      };
    }
  }

  // 计算标签数量得分
  calculateTagCountScore(members) {
    try {
      const allTags = new Set();
      members.forEach(member => {
        (member.tags || []).forEach(tag => allTags.add(tag));
      });

      const uniqueTagCount = allTags.size;
      const maxPossibleTags = members.length * this.diversityConstraints.maxTagPerUser;
      
      // 归一化到0-1
      return Math.min(uniqueTagCount / this.diversityConstraints.minUniqueTags, 1.0);
    } catch (error) {
      console.error('Error calculating tag count score:', error);
      return 0;
    }
  }

  // 计算分类覆盖得分
  calculateCategoryCoverageScore(members) {
    try {
      const allTags = new Set();
      members.forEach(member => {
        (member.tags || []).forEach(tag => allTags.add(tag));
      });

      const coveredCategories = new Set();
      allTags.forEach(tag => {
        Object.entries(this.tagCategories).forEach(([category, tags]) => {
          if (tags.includes(tag)) {
            coveredCategories.add(category);
          }
        });
      });

      const totalCategories = Object.keys(this.tagCategories).length;
      const coverageRatio = coveredCategories.size / totalCategories;
      
      return Math.min(coverageRatio / this.diversityConstraints.minCategoryCoverage, 1.0);
    } catch (error) {
      console.error('Error calculating category coverage score:', error);
      return 0;
    }
  }

  // 计算标签分布得分
  calculateTagDistributionScore(members) {
    try {
      const tagCounts = new Map();
      members.forEach(member => {
        (member.tags || []).forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      if (tagCounts.size === 0) return 0;

      const tagCountsArray = Array.from(tagCounts.values());
      const maxCount = Math.max(...tagCountsArray);
      const minCount = Math.min(...tagCountsArray);
      const averageCount = tagCountsArray.reduce((sum, count) => sum + count, 0) / tagCountsArray.length;

      // 计算分布的均匀性
      const variance = tagCountsArray.reduce((sum, count) => sum + Math.pow(count - averageCount, 2), 0) / tagCountsArray.length;
      const uniformity = 1 - (variance / averageCount);

      // 检查是否有标签过度集中
      const maxAllowedCount = Math.floor(members.length * this.diversityConstraints.maxSameTagRatio);
      const overConcentration = maxCount > maxAllowedCount ? (maxCount - maxAllowedCount) / maxAllowedCount : 0;

      return Math.max(0, uniformity - overConcentration);
    } catch (error) {
      console.error('Error calculating tag distribution score:', error);
      return 0;
    }
  }

  // 计算分类平衡得分
  calculateCategoryBalanceScore(members) {
    try {
      const categoryCounts = new Map();
      members.forEach(member => {
        const memberTags = member.tags || [];
        const memberCategories = new Set();
        
        memberTags.forEach(tag => {
          Object.entries(this.tagCategories).forEach(([category, tags]) => {
            if (tags.includes(tag)) {
              memberCategories.add(category);
            }
          });
        });

        memberCategories.forEach(category => {
          categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        });
      });

      if (categoryCounts.size === 0) return 0;

      const categoryCountsArray = Array.from(categoryCounts.values());
      const maxCount = Math.max(...categoryCountsArray);
      const minCount = Math.min(...categoryCountsArray);
      const averageCount = categoryCountsArray.reduce((sum, count) => sum + count, 0) / categoryCountsArray.length;

      // 计算分类平衡性
      const variance = categoryCountsArray.reduce((sum, count) => sum + Math.pow(count - averageCount, 2), 0) / categoryCountsArray.length;
      const balance = 1 - (variance / averageCount);

      // 检查是否有分类过度集中
      const maxAllowedCount = Math.floor(members.length * this.diversityConstraints.maxCategoryRatio);
      const overConcentration = maxCount > maxAllowedCount ? (maxCount - maxAllowedCount) / maxAllowedCount : 0;

      return Math.max(0, balance - overConcentration);
    } catch (error) {
      console.error('Error calculating category balance score:', error);
      return 0;
    }
  }

  // 应用标签多样性约束
  async applyTagDiversityConstraints(members, maxMembers = 49) {
    try {
      const constrainedMembers = [];
      const tagCounts = new Map();
      const categoryCounts = new Map();

      // 按标签多样性得分排序成员
      const membersWithDiversity = members.map(member => ({
        user: member,
        diversityScore: this.calculateUserDiversityScore(member, tagCounts, categoryCounts)
      }));

      membersWithDiversity.sort((a, b) => b.diversityScore - a.diversityScore);

      // 选择成员，确保多样性约束
      for (const memberData of membersWithDiversity) {
        if (constrainedMembers.length >= maxMembers) break;

        const member = memberData.user;
        const memberTags = member.tags || [];
        const memberCategories = this.getUserCategories(memberTags);

        // 检查标签约束
        let canAdd = true;
        for (const tag of memberTags) {
          const currentCount = tagCounts.get(tag) || 0;
          const maxAllowed = Math.floor(maxMembers * this.diversityConstraints.maxSameTagRatio);
          
          if (currentCount >= maxAllowed) {
            canAdd = false;
            break;
          }
        }

        // 检查分类约束
        if (canAdd) {
          for (const category of memberCategories) {
            const currentCount = categoryCounts.get(category) || 0;
            const maxAllowed = Math.floor(maxMembers * this.diversityConstraints.maxCategoryRatio);
            
            if (currentCount >= maxAllowed) {
              canAdd = false;
              break;
            }
          }
        }

        if (canAdd) {
          constrainedMembers.push(member);
          
          // 更新计数
          memberTags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
          
          memberCategories.forEach(category => {
            categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
          });
        }
      }

      return constrainedMembers;
    } catch (error) {
      console.error('Error applying tag diversity constraints:', error);
      return members.slice(0, maxMembers);
    }
  }

  // 计算用户多样性得分
  calculateUserDiversityScore(user, currentTagCounts, currentCategoryCounts) {
    try {
      const userTags = user.tags || [];
      const userCategories = this.getUserCategories(userTags);
      
      let diversityScore = 0;

      // 基于标签权重
      userTags.forEach(tag => {
        const weight = this.tagWeights[tag] || 1.0;
        const currentCount = currentTagCounts.get(tag) || 0;
        const scarcityBonus = 1 / (1 + currentCount); // 稀缺性奖励
        diversityScore += weight * scarcityBonus;
      });

      // 基于分类多样性
      userCategories.forEach(category => {
        const currentCount = currentCategoryCounts.get(category) || 0;
        const scarcityBonus = 1 / (1 + currentCount);
        diversityScore += scarcityBonus;
      });

      // 基于标签数量
      const tagCountBonus = Math.min(userTags.length / this.diversityConstraints.maxTagPerUser, 1.0);
      diversityScore += tagCountBonus;

      return diversityScore;
    } catch (error) {
      console.error('Error calculating user diversity score:', error);
      return 0;
    }
  }

  // 获取用户标签分类
  getUserCategories(userTags) {
    const categories = new Set();
    
    userTags.forEach(tag => {
      Object.entries(this.tagCategories).forEach(([category, tags]) => {
        if (tags.includes(tag)) {
          categories.add(category);
        }
      });
    });

    return Array.from(categories);
  }

  // 优化标签多样性
  async optimizeTagDiversity(members, maxIterations = 10) {
    try {
      let currentMembers = [...members];
      let bestScore = this.calculateTagDiversityScore(currentMembers).overall;
      let bestMembers = [...currentMembers];

      for (let iteration = 0; iteration < maxIterations; iteration++) {
        const currentScore = this.calculateTagDiversityScore(currentMembers).overall;
        
        if (currentScore >= 0.9) break; // 达到足够好的多样性

        // 尝试替换成员以改善多样性
        const optimizedMembers = await this.improveDiversityByReplacement(currentMembers);
        const optimizedScore = this.calculateTagDiversityScore(optimizedMembers).overall;

        if (optimizedScore > bestScore) {
          bestScore = optimizedScore;
          bestMembers = [...optimizedMembers];
        }

        currentMembers = optimizedMembers;
      }

      return bestMembers;
    } catch (error) {
      console.error('Error optimizing tag diversity:', error);
      return members;
    }
  }

  // 通过替换改善多样性
  async improveDiversityByReplacement(members) {
    try {
      const diversityScore = this.calculateTagDiversityScore(members);
      const improvedMembers = [...members];

      // 找出多样性贡献最小的成员
      const memberContributions = members.map(member => ({
        user: member,
        contribution: this.calculateMemberDiversityContribution(member, members)
      }));

      memberContributions.sort((a, b) => a.contribution - b.contribution);

      // 尝试替换贡献最小的成员
      const worstContributor = memberContributions[0];
      const replacementCandidates = await this.findDiversityReplacementCandidates(
        worstContributor.user, 
        members
      );

      if (replacementCandidates.length > 0) {
        const bestReplacement = replacementCandidates[0];
        const index = improvedMembers.indexOf(worstContributor.user);
        if (index > -1) {
          improvedMembers[index] = bestReplacement;
        }
      }

      return improvedMembers;
    } catch (error) {
      console.error('Error improving diversity by replacement:', error);
      return members;
    }
  }

  // 计算成员多样性贡献
  calculateMemberDiversityContribution(member, allMembers) {
    try {
      const memberTags = member.tags || [];
      const memberCategories = this.getUserCategories(memberTags);
      
      let contribution = 0;

      // 计算标签贡献
      memberTags.forEach(tag => {
        const tagCount = allMembers.filter(m => (m.tags || []).includes(tag)).length;
        const scarcity = 1 / (1 + tagCount);
        const weight = this.tagWeights[tag] || 1.0;
        contribution += weight * scarcity;
      });

      // 计算分类贡献
      memberCategories.forEach(category => {
        const categoryCount = allMembers.filter(m => {
          const userTags = m.tags || [];
          return userTags.some(tag => this.tagCategories[category]?.includes(tag));
        }).length;
        const scarcity = 1 / (1 + categoryCount);
        contribution += scarcity;
      });

      return contribution;
    } catch (error) {
      console.error('Error calculating member diversity contribution:', error);
      return 0;
    }
  }

  // 寻找多样性替换候选
  async findDiversityReplacementCandidates(targetMember, currentMembers) {
    try {
      // 这里应该从候选用户池中寻找
      // 暂时返回空数组
      return [];
    } catch (error) {
      console.error('Error finding diversity replacement candidates:', error);
      return [];
    }
  }

  // 获取标签多样性统计
  getTagDiversityStatistics(members) {
    try {
      const allTags = new Set();
      const tagCounts = new Map();
      const categoryCounts = new Map();

      members.forEach(member => {
        const memberTags = member.tags || [];
        const memberCategories = this.getUserCategories(memberTags);

        memberTags.forEach(tag => {
          allTags.add(tag);
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });

        memberCategories.forEach(category => {
          categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        });
      });

      return {
        totalUniqueTags: allTags.size,
        totalCategories: categoryCounts.size,
        tagDistribution: Object.fromEntries(tagCounts),
        categoryDistribution: Object.fromEntries(categoryCounts),
        diversityScore: this.calculateTagDiversityScore(members).overall,
        averageTagsPerUser: Array.from(tagCounts.values()).reduce((sum, count) => sum + count, 0) / members.length
      };
    } catch (error) {
      console.error('Error getting tag diversity statistics:', error);
      return {
        totalUniqueTags: 0,
        totalCategories: 0,
        tagDistribution: {},
        categoryDistribution: {},
        diversityScore: 0,
        averageTagsPerUser: 0
      };
    }
  }

  // 验证多样性约束
  validateDiversityConstraints(members) {
    try {
      const validation = {
        isValid: true,
        violations: []
      };

      const tagCounts = new Map();
      const categoryCounts = new Map();

      members.forEach(member => {
        const memberTags = member.tags || [];
        const memberCategories = this.getUserCategories(memberTags);

        memberTags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });

        memberCategories.forEach(category => {
          categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        });
      });

      // 检查标签约束
      const maxSameTagCount = Math.floor(members.length * this.diversityConstraints.maxSameTagRatio);
      tagCounts.forEach((count, tag) => {
        if (count > maxSameTagCount) {
          validation.isValid = false;
          validation.violations.push(`标签"${tag}"用户过多: ${count} > ${maxSameTagCount}`);
        }
      });

      // 检查分类约束
      const maxCategoryCount = Math.floor(members.length * this.diversityConstraints.maxCategoryRatio);
      categoryCounts.forEach((count, category) => {
        if (count > maxCategoryCount) {
          validation.isValid = false;
          validation.violations.push(`分类"${category}"用户过多: ${count} > ${maxCategoryCount}`);
        }
      });

      // 检查最小标签数量
      const uniqueTagCount = tagCounts.size;
      if (uniqueTagCount < this.diversityConstraints.minUniqueTags) {
        validation.isValid = false;
        validation.violations.push(`标签数量不足: ${uniqueTagCount} < ${this.diversityConstraints.minUniqueTags}`);
      }

      return validation;
    } catch (error) {
      console.error('Error validating diversity constraints:', error);
      return {
        isValid: false,
        violations: ['验证过程出错']
      };
    }
  }
}

module.exports = TagDiversityAlgorithm;

