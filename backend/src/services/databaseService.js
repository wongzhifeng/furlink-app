const mongoose = require('mongoose');
const redisService = require('../services/redisService');

class DatabaseService {
  constructor() {
    this.mongoConnected = false;
    this.redisConnected = false;
  }

  // 连接MongoDB - 优化49: 增强连接配置和性能优化
  async connectMongoDB() {
    try {
      // 优化49: 输入验证
      const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/flulink';
      
      if (!mongoUrl || typeof mongoUrl !== 'string') {
        throw new Error('MongoDB URL配置错误');
      }
      
      // 检查是否禁用数据库连接
      if (process.env.MONGODB_ENABLED === 'false') {
        console.warn('MongoDB is disabled by environment variable.');
        this.mongoConnected = false;
        return false;
      }
      
      // 优化49: 增强连接池配置
      await mongoose.connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // 优化49.1: 增强连接池配置
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 20,
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 5,
        maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 30000,
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
        socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
        // 优化49.2: 添加连接优化选项
        bufferMaxEntries: 0,
        bufferCommands: false,
        // 优化49.3: 添加读写关注点
        readPreference: 'secondaryPreferred',
        writeConcern: { w: 'majority', j: true }
      });

      this.mongoConnected = true;
      console.log('✅ MongoDB connected successfully');

      // 优化50: 监听连接事件，增强错误处理
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.mongoConnected = false;
        // 优化50: 添加错误恢复机制
        setTimeout(() => {
          this.connectMongoDB().catch(console.error);
        }, 5000);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.mongoConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.mongoConnected = true;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.mongoConnected = true;
      });

      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      this.mongoConnected = false;
      
      // 在Zeabur环境中，如果数据库连接失败，不抛出错误，允许服务降级运行
      if (process.env.NODE_ENV === 'production' && process.env.ZEABUR === 'true') {
        console.warn('⚠️ Running in degraded mode without MongoDB');
        return false;
      }
      
      return false;
    }
  }

  // 连接Redis
  async connectRedis() {
    try {
      this.redisConnected = await redisService.connect();
      if (this.redisConnected) {
        console.log('✅ Redis connected successfully');
      } else {
        console.log('⚠️ Redis connection failed, continuing without cache');
      }
      return this.redisConnected;
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      this.redisConnected = false;
      return false;
    }
  }

  // 初始化所有数据库连接
  async initialize() {
    console.log('🚀 Initializing database connections...');
    
    const mongoResult = await this.connectMongoDB();
    const redisResult = await this.connectRedis();

    if (mongoResult) {
      console.log('✅ Database initialization completed');
      return true;
    } else {
      console.error('❌ Database initialization failed');
      return false;
    }
  }

  // 断开所有连接
  async disconnect() {
    try {
      if (this.mongoConnected) {
        await mongoose.disconnect();
        this.mongoConnected = false;
        console.log('✅ MongoDB disconnected');
      }

      if (this.redisConnected) {
        await redisService.disconnect();
        this.redisConnected = false;
        console.log('✅ Redis disconnected');
      }

      return true;
    } catch (error) {
      console.error('❌ Error disconnecting databases:', error);
      return false;
    }
  }

  // 检查连接状态
  getStatus() {
    return {
      mongodb: {
        connected: this.mongoConnected,
        readyState: mongoose.connection.readyState
      },
      redis: {
        connected: this.redisConnected
      }
    };
  }

  // 健康检查
  async healthCheck() {
    const status = this.getStatus();
    
    try {
      // 测试MongoDB连接
      if (status.mongodb.connected) {
        await mongoose.connection.db.admin().ping();
        status.mongodb.healthy = true;
      } else {
        status.mongodb.healthy = false;
      }

      // 测试Redis连接
      if (status.redis.connected) {
        await redisService.client.ping();
        status.redis.healthy = true;
      } else {
        status.redis.healthy = false;
      }

      return status;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        ...status,
        mongodb: { ...status.mongodb, healthy: false },
        redis: { ...status.redis, healthy: false },
        error: error.message
      };
    }
  }

  // 创建索引
  async createIndexes() {
    try {
      const { User, StarSeed, Cluster, Interaction, Resonance } = require('../models');

      // 用户索引
      await User.collection.createIndex({ phone: 1 }, { unique: true });
      await User.collection.createIndex({ currentCluster: 1 });
      await User.collection.createIndex({ tags: 1 });
      await User.collection.createIndex({ isActive: 1 });
      await User.collection.createIndex({ lastActiveAt: 1 });

      // 星种索引
      await StarSeed.collection.createIndex({ authorId: 1 });
      await StarSeed.collection.createIndex({ clusterId: 1 });
      await StarSeed.collection.createIndex({ luminosity: 1 });
      await StarSeed.collection.createIndex({ createdAt: 1 });
      await StarSeed.collection.createIndex({ jumpEligible: 1 });

      // 星团索引
      await Cluster.collection.createIndex({ members: 1 });
      await Cluster.collection.createIndex({ expiresAt: 1 });
      await Cluster.collection.createIndex({ isActive: 1 });
      await Cluster.collection.createIndex({ createdAt: 1 });

      // 互动索引
      await Interaction.collection.createIndex({ userId: 1 });
      await Interaction.collection.createIndex({ targetId: 1 });
      await Interaction.collection.createIndex({ targetType: 1 });
      await Interaction.collection.createIndex({ createdAt: 1 });

      // 共鸣索引
      await Resonance.collection.createIndex({ userA: 1, userB: 1 });
      await Resonance.collection.createIndex({ totalResonance: 1 });
      await Resonance.collection.createIndex({ calculatedAt: 1 });

      console.log('✅ Database indexes created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
      return false;
    }
  }
}

// 创建单例实例
const databaseService = new DatabaseService();

module.exports = databaseService;

