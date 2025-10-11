import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import redisService from './redisService';

interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: any;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

interface SystemMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  uptime: number;
  timestamp: Date;
}

interface ApiMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
}

class PerformanceMonitor extends EventEmitter {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private cacheMetrics: Map<string, CacheMetrics> = new Map();
  private apiMetrics: ApiMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startMonitoring();
  }

  // 开始监控 - 优化76: 增强错误处理
  startMonitoring() {
    try {
      if (this.isMonitoring) return;

      this.isMonitoring = true;
      
      // 系统指标监控（每30秒）- 优化76: 增强错误处理
      this.monitoringInterval = setInterval(() => {
          this.collectSystemMetrics();
        } catch (error) {
          console.error('Error collecting system metrics:', error);
        }
      }, 30000);

      console.log('Performance monitoring started');
    } catch (error) {
      console.error('Error starting performance monitoring:', error);
      this.isMonitoring = false;
    }
  }

  // 停止监控
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Performance monitoring stopped');
  }

  // 记录操作性能
  async recordOperation(operation: string, fn: Function, metadata?: any): Promise<any> {
    const startTime = performance.now();
    const startCpuUsage = process.cpuUsage();

    try {
      const result = await fn();
      const endTime = performance.now();
      const endCpuUsage = process.cpuUsage(startCpuUsage);
      
      const duration = endTime - startTime;
      
      const metric: PerformanceMetrics = {
        operation,
        duration,
        timestamp: new Date(),
        metadata: {
          ...metadata,
          cpuUsage: endCpuUsage,
          success: true
        }
      };

      this.addMetric(operation, metric);
      this.emit('operation_completed', metric);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const endCpuUsage = process.cpuUsage(startCpuUsage);
      
      const duration = endTime - startTime;
      
      const metric: PerformanceMetrics = {
        operation,
        duration,
        timestamp: new Date(),
        metadata: {
          ...metadata,
          cpuUsage: endCpuUsage,
          success: false,
          error: error.message
        }
      };

      this.addMetric(operation, metric);
      this.emit('operation_failed', metric);
      
      throw error;
    }
  }

  // 记录API性能
  recordApiCall(endpoint: string, method: string, responseTime: number, statusCode: number, userId?: string) {
    const metric: ApiMetrics = {
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: new Date(),
      userId
    };

    this.apiMetrics.push(metric);
    
    // 保持最近1000条记录
    if (this.apiMetrics.length > 1000) {
      this.apiMetrics = this.apiMetrics.slice(-1000);
    }

    this.emit('api_call', metric);
  }

  // 记录缓存命中
  recordCacheHit(key: string) {
    const metrics = this.cacheMetrics.get(key) || { hits: 0, misses: 0, hitRate: 0, totalRequests: 0 };
    metrics.hits++;
    metrics.totalRequests++;
    metrics.hitRate = metrics.hits / metrics.totalRequests;
    
    this.cacheMetrics.set(key, metrics);
    this.emit('cache_hit', { key, metrics });
  }

  // 记录缓存未命中
  recordCacheMiss(key: string) {
    const metrics = this.cacheMetrics.get(key) || { hits: 0, misses: 0, hitRate: 0, totalRequests: 0 };
    metrics.misses++;
    metrics.totalRequests++;
    metrics.hitRate = metrics.hits / metrics.totalRequests;
    
    this.cacheMetrics.set(key, metrics);
    this.emit('cache_miss', { key, metrics });
  }

  // 添加性能指标
  private addMetric(operation: string, metric: PerformanceMetrics) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const metrics = this.metrics.get(operation)!;
    metrics.push(metric);

    // 保持最近100条记录
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
  }

  // 收集系统指标
  private collectSystemMetrics() {
    const systemMetric: SystemMetrics = {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      timestamp: new Date()
    };

    this.systemMetrics.push(systemMetric);
    
    // 保持最近100条记录
    if (this.systemMetrics.length > 100) {
      this.systemMetrics = this.systemMetrics.slice(-100);
    }

    this.emit('system_metrics', systemMetric);
  }

  // 获取操作性能统计
  getOperationStats(operation: string, timeRange?: { start: Date; end: Date }) {
    const metrics = this.metrics.get(operation) || [];
    let filteredMetrics = metrics;

    if (timeRange) {
      filteredMetrics = metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return null;
    }

    const durations = filteredMetrics.map(m => m.duration);
    const successCount = filteredMetrics.filter(m => m.metadata?.success !== false).length;
    const errorCount = filteredMetrics.length - successCount;

    return {
      operation,
      count: filteredMetrics.length,
      successCount,
      errorCount,
      successRate: successCount / filteredMetrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p50Duration: this.percentile(durations, 0.5),
      p95Duration: this.percentile(durations, 0.95),
      p99Duration: this.percentile(durations, 0.99)
    };
  }

  // 获取API性能统计
  getApiStats(timeRange?: { start: Date; end: Date }) {
    let filteredMetrics = this.apiMetrics;

    if (timeRange) {
      filteredMetrics = this.apiMetrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return [];
    }

    // 按端点分组统计
    const endpointStats = new Map<string, any>();

    filteredMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      
      if (!endpointStats.has(key)) {
        endpointStats.set(key, {
          endpoint: metric.endpoint,
          method: metric.method,
          count: 0,
          totalResponseTime: 0,
          statusCodes: new Map<number, number>(),
          avgResponseTime: 0,
          minResponseTime: Infinity,
          maxResponseTime: 0
        });
      }

      const stats = endpointStats.get(key)!;
      stats.count++;
      stats.totalResponseTime += metric.responseTime;
      stats.minResponseTime = Math.min(stats.minResponseTime, metric.responseTime);
      stats.maxResponseTime = Math.max(stats.maxResponseTime, metric.responseTime);
      
      const statusCount = stats.statusCodes.get(metric.statusCode) || 0;
      stats.statusCodes.set(metric.statusCode, statusCount + 1);
    });

    // 计算平均值
    endpointStats.forEach(stats => {
      stats.avgResponseTime = stats.totalResponseTime / stats.count;
      stats.statusCodes = Object.fromEntries(stats.statusCodes);
    });

    return Array.from(endpointStats.values());
  }

  // 获取缓存统计
  getCacheStats() {
    return Object.fromEntries(this.cacheMetrics);
  }

  // 获取系统统计
  getSystemStats() {
    if (this.systemMetrics.length === 0) {
      return null;
    }

    const latest = this.systemMetrics[this.systemMetrics.length - 1];
    const memoryUsage = latest.memoryUsage;
    
    return {
      uptime: latest.uptime,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        heapUsedPercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      cpu: latest.cpuUsage,
      timestamp: latest.timestamp
    };
  }

  // 获取所有操作统计
  getAllOperationStats() {
    const stats = [];
    
    for (const operation of this.metrics.keys()) {
      const stat = this.getOperationStats(operation);
      if (stat) {
        stats.push(stat);
      }
    }

    return stats.sort((a, b) => b.count - a.count);
  }

  // 计算百分位数
  private percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }

  // 生成性能报告
  async generateReport(): Promise<any> {
    const report = {
      timestamp: new Date(),
      operations: this.getAllOperationStats(),
      apis: this.getApiStats(),
      cache: this.getCacheStats(),
      system: this.getSystemStats(),
      summary: {
        totalOperations: Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0),
        totalApiCalls: this.apiMetrics.length,
        avgOperationDuration: this.calculateOverallAvgDuration(),
        cacheHitRate: this.calculateOverallCacheHitRate()
      }
    };

    // 保存报告到Redis
    try {
      await redisService.set('performance_report', JSON.stringify(report), 3600); // 1小时
    } catch (error) {
      console.error('Failed to save performance report to Redis:', error);
    }

    return report;
  }

  // 计算整体平均持续时间
  private calculateOverallAvgDuration(): number {
    let totalDuration = 0;
    let totalCount = 0;

    for (const metrics of this.metrics.values()) {
      totalDuration += metrics.reduce((sum, m) => sum + m.duration, 0);
      totalCount += metrics.length;
    }

    return totalCount > 0 ? totalDuration / totalCount : 0;
  }

  // 计算整体缓存命中率
  private calculateOverallCacheHitRate(): number {
    let totalHits = 0;
    let totalRequests = 0;

    for (const metrics of this.cacheMetrics.values()) {
      totalHits += metrics.hits;
      totalRequests += metrics.totalRequests;
    }

    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }

  // 清理旧数据
  cleanup() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24小时前

    // 清理操作指标
    for (const [operation, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp > cutoffTime);
      this.metrics.set(operation, filtered);
    }

    // 清理API指标
    this.apiMetrics = this.apiMetrics.filter(m => m.timestamp > cutoffTime);

    // 清理系统指标
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoffTime);

    console.log('Performance data cleaned up');
  }
}

// 创建单例实例
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
