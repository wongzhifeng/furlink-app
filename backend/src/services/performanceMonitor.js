// FurLink 性能监控服务
// 简化版本，专注于基础监控功能

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = new Map();
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  // 开始监控
  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    // 系统指标监控（每30秒）
    this.monitoringInterval = setInterval(() => {
      try {
        this.collectSystemMetrics();
      } catch (error) {
        console.error('Error collecting system metrics:', error);
      }
    }, 30000);

    console.log('✅ 性能监控启动');
  }

  // 停止监控
  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('⏹️ 性能监控停止');
  }

  // 记录操作性能
  async recordOperation(operation, fn, metadata = {}) {
    const startTime = performance.now();

    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const metric = {
        operation,
        duration,
        timestamp: new Date(),
        metadata: {
          ...metadata,
          success: true
        }
      };

      this.addMetric(operation, metric);
      this.emit('operation_completed', metric);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const metric = {
        operation,
        duration,
        timestamp: new Date(),
        metadata: {
          ...metadata,
          success: false,
          error: error.message
        }
      };

      this.addMetric(operation, metric);
      this.emit('operation_failed', metric);
      
      throw error;
    }
  }

  // 添加性能指标
  addMetric(operation, metric) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const metrics = this.metrics.get(operation);
    metrics.push(metric);

    // 保持最近50条记录
    if (metrics.length > 50) {
      metrics.splice(0, metrics.length - 50);
    }
  }

  // 收集系统指标
  collectSystemMetrics() {
    const systemMetric = {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date()
    };

    this.emit('system_metrics', systemMetric);
  }

  // 获取操作性能统计
  getOperationStats(operation) {
    const metrics = this.metrics.get(operation) || [];

    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration);
    const successCount = metrics.filter(m => m.metadata?.success !== false).length;
    const errorCount = metrics.length - successCount;

    return {
      operation,
      count: metrics.length,
      successCount,
      errorCount,
      successRate: successCount / metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations)
    };
  }

  // 获取系统统计
  getSystemStats() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
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

  // 生成性能报告
  generateReport() {
    return {
      timestamp: new Date(),
      operations: this.getAllOperationStats(),
      system: this.getSystemStats(),
      summary: {
        totalOperations: Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0),
        avgOperationDuration: this.calculateOverallAvgDuration()
      }
    };
  }

  // 计算整体平均持续时间
  calculateOverallAvgDuration() {
    let totalDuration = 0;
    let totalCount = 0;

    for (const metrics of this.metrics.values()) {
      totalDuration += metrics.reduce((sum, m) => sum + m.duration, 0);
      totalCount += metrics.length;
    }

    return totalCount > 0 ? totalDuration / totalCount : 0;
  }

  // 清理旧数据
  cleanup() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24小时前

    // 清理操作指标
    for (const [operation, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp > cutoffTime);
      this.metrics.set(operation, filtered);
    }

    console.log('🧹 性能数据清理完成');
  }
}

// 创建单例实例
const performanceMonitor = new PerformanceMonitor();

export { performanceMonitor };