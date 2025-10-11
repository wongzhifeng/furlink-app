import redisService from './redisService';
import performanceMonitor from './performanceMonitor';
import { randomUUID, randomBytes } from 'crypto';

interface CacheConfig {
  ttl: number; // 生存时间（秒）
  maxSize: number; // 最大缓存大小
  strategy: 'lru' | 'lfu' | 'fifo'; // 缓存策略
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  universeId?: string; // 宇宙计算ID
  cosmicSignature?: string; // 宇宙签名
}

class CacheOptimizer {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private config: Map<string, CacheConfig> = new Map();
  private stats: Map<string, { hits: number; misses: number; evictions: number }> = new Map();

  constructor() {
    this.setupDefaultConfigs();
    this.startCleanupInterval();
  }

  // 设置默认配置
  private setupDefaultConfigs() {
    // 用户数据缓存
    this.config.set('user', {
      ttl: 1800, // 30分钟
      maxSize: 1000,
      strategy: 'lru'
    });

    // 星种数据缓存
    this.config.set('starseed', {
      ttl: 900, // 15分钟
      maxSize: 2000,
      strategy: 'lru'
    });

    // 星团数据缓存
    this.config.set('cluster', {
      ttl: 600, // 10分钟
      maxSize: 500,
      strategy: 'lru'
    });

    // 共鸣计算缓存
    this.config.set('resonance', {
      ttl: 3600, // 1小时
      maxSize: 5000,
      strategy: 'lfu'
    });

    // API响应缓存
    this.config.set('api', {
      ttl: 300, // 5分钟
      maxSize: 1000,
      strategy: 'lru'
    });
  }

  // 获取缓存
  async get<T>(key: string, category: string = 'default'): Promise<T | null> {
    const cacheKey = `${category}:${key}`;
    
    try {
      // 先尝试内存缓存
      const memoryResult = this.getFromMemory<T>(cacheKey);
      if (memoryResult !== null) {
        performanceMonitor.recordCacheHit(cacheKey);
        return memoryResult;
      }

      // 尝试Redis缓存
      const redisResult = await this.getFromRedis<T>(cacheKey);
      if (redisResult !== null) {
        // 回写到内存缓存
        this.setToMemory(cacheKey, redisResult, category);
        performanceMonitor.recordCacheHit(cacheKey);
        return redisResult;
      }

      // 缓存未命中
      performanceMonitor.recordCacheMiss(cacheKey);
      return null;
    } catch (error) {
      console.error(`Cache get error for ${cacheKey}:`, error);
      performanceMonitor.recordCacheMiss(cacheKey);
      return null;
    }
  }

  // 设置缓存
  async set<T>(key: string, value: T, category: string = 'default', customTtl?: number): Promise<void> {
    const cacheKey = `${category}:${key}`;
    const config = this.config.get(category) || this.config.get('default')!;
    const ttl = customTtl || config.ttl;

    try {
      // 设置到内存缓存
      this.setToMemory(cacheKey, value, category);

      // 设置到Redis缓存
      await this.setToRedis(cacheKey, value, ttl);
    } catch (error) {
      console.error(`Cache set error for ${cacheKey}:`, error);
    }
  }

  // 删除缓存
  async delete(key: string, category: string = 'default'): Promise<void> {
    const cacheKey = `${category}:${key}`;

    try {
      // 从内存缓存删除
      this.memoryCache.delete(cacheKey);

      // 从Redis缓存删除
      await redisService.del(cacheKey);
    } catch (error) {
      console.error(`Cache delete error for ${cacheKey}:`, error);
    }
  }

  // 批量获取
  async mget<T>(keys: string[], category: string = 'default'): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    const cacheKeys = keys.map(key => `${category}:${key}`);

    try {
      // 先尝试内存缓存
      for (const cacheKey of cacheKeys) {
        const memoryResult = this.getFromMemory<T>(cacheKey);
        if (memoryResult !== null) {
          const originalKey = cacheKey.replace(`${category}:`, '');
          results.set(originalKey, memoryResult);
          performanceMonitor.recordCacheHit(cacheKey);
        }
      }

      // 获取未命中的键
      const missedKeys = cacheKeys.filter(key => !results.has(key.replace(`${category}:`, '')));
      
      if (missedKeys.length > 0) {
        // 从Redis批量获取
        const redisResults = await redisService.mget(missedKeys);
        
        for (let i = 0; i < missedKeys.length; i++) {
          const cacheKey = missedKeys[i];
          const redisValue = redisResults[i];
          
          if (redisValue !== null) {
            const originalKey = cacheKey.replace(`${category}:`, '');
            const parsedValue = JSON.parse(redisValue);
            results.set(originalKey, parsedValue);
            
            // 回写到内存缓存
            this.setToMemory(cacheKey, parsedValue, category);
            performanceMonitor.recordCacheHit(cacheKey);
          } else {
            performanceMonitor.recordCacheMiss(cacheKey);
          }
        }
      }

      return results;
    } catch (error) {
      console.error(`Cache mget error:`, error);
      return results;
    }
  }

  // 批量设置
  async mset<T>(keyValuePairs: Map<string, T>, category: string = 'default', customTtl?: number): Promise<void> {
    const config = this.config.get(category) || this.config.get('default')!;
    const ttl = customTtl || config.ttl;

    try {
      const redisPairs = new Map<string, string>();
      
      for (const [key, value] of keyValuePairs) {
        const cacheKey = `${category}:${key}`;
        
        // 设置到内存缓存
        this.setToMemory(cacheKey, value, category);
        
        // 准备Redis数据
        redisPairs.set(cacheKey, JSON.stringify(value));
      }

      // 批量设置到Redis
      await redisService.mset(redisPairs, ttl);
    } catch (error) {
      console.error(`Cache mset error:`, error);
    }
  }

  // 从内存获取
  private getFromMemory<T>(cacheKey: string): T | null {
    const entry = this.memoryCache.get(cacheKey);
    
    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (this.isExpired(entry)) {
      this.memoryCache.delete(cacheKey);
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.value;
  }

  // 设置到内存
  private setToMemory<T>(cacheKey: string, value: T, category: string): void {
    const config = this.config.get(category) || this.config.get('default')!;
    
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    };

    // 检查是否需要清理
    if (this.memoryCache.size >= config.maxSize) {
      this.evictEntries(category);
    }

    this.memoryCache.set(cacheKey, entry);
  }

  // 从Redis获取
  private async getFromRedis<T>(cacheKey: string): Promise<T | null> {
    try {
      const value = await redisService.get(cacheKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis get error for ${cacheKey}:`, error);
      return null;
    }
  }

  // 设置到Redis
  private async setToRedis<T>(cacheKey: string, value: T, ttl: number): Promise<void> {
    try {
      await redisService.set(cacheKey, JSON.stringify(value), ttl);
    } catch (error) {
      console.error(`Redis set error for ${cacheKey}:`, error);
    }
  }

  // 检查是否过期
  private isExpired(entry: CacheEntry<any>): boolean {
    const config = this.config.get('default')!;
    return Date.now() - entry.timestamp > config.ttl * 1000;
  }

  // 清理过期条目
  private evictEntries(category: string): void {
    const config = this.config.get(category) || this.config.get('default')!;
    const entries = Array.from(this.memoryCache.entries())
      .filter(([key]) => key.startsWith(`${category}:`));

    if (entries.length < config.maxSize) {
      return;
    }

    // 根据策略清理
    switch (config.strategy) {
      case 'lru':
        this.evictLRU(entries);
        break;
      case 'lfu':
        this.evictLFU(entries);
        break;
      case 'fifo':
        this.evictFIFO(entries);
        break;
    }
  }

  // LRU清理
  private evictLRU(entries: [string, CacheEntry<any>][]): void {
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    const toEvict = entries.slice(0, Math.floor(entries.length * 0.1)); // 清理10%
    
    toEvict.forEach(([key]) => {
      this.memoryCache.delete(key);
    });
  }

  // LFU清理
  private evictLFU(entries: [string, CacheEntry<any>][]): void {
    entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
    const toEvict = entries.slice(0, Math.floor(entries.length * 0.1)); // 清理10%
    
    toEvict.forEach(([key]) => {
      this.memoryCache.delete(key);
    });
  }

  // FIFO清理
  private evictFIFO(entries: [string, CacheEntry<any>][]): void {
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toEvict = entries.slice(0, Math.floor(entries.length * 0.1)); // 清理10%
    
    toEvict.forEach(([key]) => {
      this.memoryCache.delete(key);
    });
  }

  // 开始清理间隔
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }

  // 清理过期条目
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > 24 * 60 * 60 * 1000) { // 24小时
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  // 获取缓存统计
  getStats(): any {
    const stats = {
      memoryCache: {
        size: this.memoryCache.size,
        entries: Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
          key,
          age: Date.now() - entry.timestamp,
          accessCount: entry.accessCount,
          lastAccessed: entry.lastAccessed
        }))
      },
      configs: Object.fromEntries(this.config),
      performance: Object.fromEntries(this.stats)
    };

    return stats;
  }

  // 预热缓存
  async warmup(data: Map<string, any>, category: string = 'default'): Promise<void> {
    console.log(`Warming up cache for category: ${category}`);
    
    try {
      await this.mset(data, category);
      console.log(`Cache warmed up with ${data.size} entries`);
    } catch (error) {
      console.error('Cache warmup error:', error);
    }
  }

  // 清空缓存
  async clear(category?: string): Promise<void> {
    try {
      if (category) {
        // 清空特定类别的缓存
        const keysToDelete = Array.from(this.memoryCache.keys())
          .filter(key => key.startsWith(`${category}:`));
        
        keysToDelete.forEach(key => {
          this.memoryCache.delete(key);
        });

        // 清空Redis中的相关键
        const pattern = `${category}:*`;
        const redisKeys = await redisService.keys(pattern);
        if (redisKeys.length > 0) {
          await redisService.del(...redisKeys);
        }
      } else {
        // 清空所有缓存
        this.memoryCache.clear();
        await redisService.flushdb();
      }

      console.log(`Cache cleared for category: ${category || 'all'}`);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // 宇宙计算和万物技术 - 生成宇宙ID
  generateUniverseId(): string {
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

  // 生成宇宙签名
  generateCosmicSignature(data: any): string {
    const timestamp = Date.now();
    const dataHash = JSON.stringify(data).length;
    return `${timestamp}-${dataHash}-${this.generateUniverseId().substring(0, 8)}`;
  }

  // 宇宙缓存设置 - 增强版
  async setWithCosmicSignature<T>(key: string, value: T, category: string = 'default'): Promise<void> {
    const universeId = this.generateUniverseId();
    const cosmicSignature = this.generateCosmicSignature(value);
    
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      universeId,
      cosmicSignature
    };

    await this.set(key, value, category);
  }
}

// 创建单例实例
const cacheOptimizer = new CacheOptimizer();

export default cacheOptimizer;
