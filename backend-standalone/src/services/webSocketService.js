import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

interface StarSeedRadiation {
  starSeedId: string;
  luminosity: number;
  position: { x: number; y: number; z: number };
  timestamp: Date;
}

interface ClusterUpdate {
  clusterId: string;
  members: any[];
  averageResonance: number;
  timestamp: Date;
}

interface UserActivity {
  userId: string;
  activity: 'online' | 'offline' | 'typing' | 'viewing';
  timestamp: Date;
}

class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set<roomIds>

  // 构造函数 - 优化55: 增强配置和错误处理
  constructor(httpServer: HTTPServer) {
    try {
      // 优化55: 输入验证
      if (!httpServer) {
        throw new Error('HTTP server is required');
      }

      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: process.env.CORS_ORIGIN || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        // 优化55: 增强连接配置
        pingTimeout: 60000,
        pingInterval: 25000,
        maxHttpBufferSize: 1e6
      });

      this.setupMiddleware();
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket service initialization error:', error);
      throw error;
    }
  }

  // 设置中间件
  private setupMiddleware() {
    // 身份验证中间件
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'flulink-secret-key-2024') as any;
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // 连接日志中间件
    this.io.use((socket: AuthenticatedSocket, next) => {
      console.log(`Socket connecting: ${socket.userId} (${socket.user?.nickname})`);
      next();
    });
  }

  // 设置事件处理器
  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      const user = socket.user!;

      console.log(`User connected: ${user.nickname} (${userId})`);

      // 存储用户连接
      this.connectedUsers.set(userId, socket.id);

      // 发送连接成功事件
      socket.emit('connected', {
        userId,
        nickname: user.nickname,
        timestamp: new Date()
      });

      // 广播用户上线
      socket.broadcast.emit('user_online', {
        userId,
        nickname: user.nickname,
        timestamp: new Date()
      });

      // 加入用户房间
      socket.join(`user:${userId}`);

      // 处理星种辐射事件
      socket.on('star_seed_radiation', (data: StarSeedRadiation) => {
        this.handleStarSeedRadiation(socket, data);
      });

      // 处理星团更新事件
      socket.on('cluster_update', (data: ClusterUpdate) => {
        this.handleClusterUpdate(socket, data);
      });

      // 处理用户活动事件
      socket.on('user_activity', (data: UserActivity) => {
        this.handleUserActivity(socket, data);
      });

      // 处理加入房间事件
      socket.on('join_room', (roomId: string) => {
        this.handleJoinRoom(socket, roomId);
      });

      // 处理离开房间事件
      socket.on('leave_room', (roomId: string) => {
        this.handleLeaveRoom(socket, roomId);
      });

      // 处理星种互动事件
      socket.on('star_seed_interaction', (data: any) => {
        this.handleStarSeedInteraction(socket, data);
      });

      // 处理星团成员变化事件
      socket.on('cluster_member_change', (data: any) => {
        this.handleClusterMemberChange(socket, data);
      });

      // 处理断开连接
      socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${user.nickname} (${userId}) - ${reason}`);
        
        // 移除用户连接
        this.connectedUsers.delete(userId);
        
        // 离开所有房间
        const userRooms = this.userRooms.get(userId);
        if (userRooms) {
          userRooms.forEach(roomId => {
            socket.leave(roomId);
          });
          this.userRooms.delete(userId);
        }

        // 广播用户下线
        socket.broadcast.emit('user_offline', {
          userId,
          nickname: user.nickname,
          timestamp: new Date()
        });
      });

      // 处理错误
      socket.on('error', (error) => {
        console.error(`Socket error for user ${userId}:`, error);
      });
    });
  }

  // 处理星种辐射事件
  private handleStarSeedRadiation(socket: AuthenticatedSocket, data: StarSeedRadiation) {
    const userId = socket.userId!;
    
    // 验证用户权限（只有星种作者或星团成员可以触发辐射）
    // 这里可以添加权限验证逻辑
    
    // 广播辐射事件到相关房间
    const radiationData = {
      ...data,
      userId,
      timestamp: new Date()
    };

    // 发送到星种房间
    socket.to(`star_seed:${data.starSeedId}`).emit('star_seed_radiation', radiationData);
    
    // 发送到用户所在的星团房间
    const userRooms = this.userRooms.get(userId);
    if (userRooms) {
      userRooms.forEach(roomId => {
        if (roomId.startsWith('cluster:')) {
          socket.to(roomId).emit('star_seed_radiation', radiationData);
        }
      });
    }

    console.log(`Star seed radiation: ${data.starSeedId} by ${userId}`);
  }

  // 处理星团更新事件
  private handleClusterUpdate(socket: AuthenticatedSocket, data: ClusterUpdate) {
    const userId = socket.userId!;
    
    // 验证用户是否为星团成员
    const isMember = data.members.some(member => member.userId === userId);
    if (!isMember) {
      socket.emit('error', { message: 'Unauthorized: Not a cluster member' });
      return;
    }

    // 广播星团更新到星团房间
    const updateData = {
      ...data,
      updatedBy: userId,
      timestamp: new Date()
    };

    socket.to(`cluster:${data.clusterId}`).emit('cluster_update', updateData);
    
    console.log(`Cluster update: ${data.clusterId} by ${userId}`);
  }

  // 处理用户活动事件
  private handleUserActivity(socket: AuthenticatedSocket, data: UserActivity) {
    const userId = socket.userId!;
    
    // 广播用户活动到相关房间
    const activityData = {
      ...data,
      userId,
      timestamp: new Date()
    };

    // 发送到用户所在的房间
    const userRooms = this.userRooms.get(userId);
    if (userRooms) {
      userRooms.forEach(roomId => {
        socket.to(roomId).emit('user_activity', activityData);
      });
    }

    console.log(`User activity: ${data.activity} by ${userId}`);
  }

  // 处理加入房间事件
  private handleJoinRoom(socket: AuthenticatedSocket, roomId: string) {
    const userId = socket.userId!;
    
    socket.join(roomId);
    
    // 更新用户房间记录
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(roomId);

    // 通知房间内其他用户
    socket.to(roomId).emit('user_joined_room', {
      userId,
      nickname: socket.user!.nickname,
      roomId,
      timestamp: new Date()
    });

    console.log(`User ${userId} joined room: ${roomId}`);
  }

  // 处理离开房间事件
  private handleLeaveRoom(socket: AuthenticatedSocket, roomId: string) {
    const userId = socket.userId!;
    
    socket.leave(roomId);
    
    // 更新用户房间记录
    const userRooms = this.userRooms.get(userId);
    if (userRooms) {
      userRooms.delete(roomId);
      if (userRooms.size === 0) {
        this.userRooms.delete(userId);
      }
    }

    // 通知房间内其他用户
    socket.to(roomId).emit('user_left_room', {
      userId,
      nickname: socket.user!.nickname,
      roomId,
      timestamp: new Date()
    });

    console.log(`User ${userId} left room: ${roomId}`);
  }

  // 处理星种互动事件
  private handleStarSeedInteraction(socket: AuthenticatedSocket, data: any) {
    const userId = socket.userId!;
    
    const interactionData = {
      ...data,
      userId,
      timestamp: new Date()
    };

    // 广播到星种房间
    socket.to(`star_seed:${data.starSeedId}`).emit('star_seed_interaction', interactionData);
    
    // 广播到星团房间
    const userRooms = this.userRooms.get(userId);
    if (userRooms) {
      userRooms.forEach(roomId => {
        if (roomId.startsWith('cluster:')) {
          socket.to(roomId).emit('star_seed_interaction', interactionData);
        }
      });
    }

    console.log(`Star seed interaction: ${data.actionType} on ${data.starSeedId} by ${userId}`);
  }

  // 处理星团成员变化事件
  private handleClusterMemberChange(socket: AuthenticatedSocket, data: any) {
    const userId = socket.userId!;
    
    const changeData = {
      ...data,
      changedBy: userId,
      timestamp: new Date()
    };

    // 广播到星团房间
    socket.to(`cluster:${data.clusterId}`).emit('cluster_member_change', changeData);
    
    console.log(`Cluster member change: ${data.clusterId} by ${userId}`);
  }

  // 获取在线用户数量
  getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }

  // 获取在线用户列表
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // 向特定用户发送消息
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // 向房间发送消息
  sendToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data);
  }

  // 广播消息
  broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  // 获取Socket.IO实例
  getIO() {
    return this.io;
  }
}

export default WebSocketService;
