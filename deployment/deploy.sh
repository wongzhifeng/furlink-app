#!/bin/bash

# FurLink 部署脚本
# 基于道德经"道法自然"理念，提供简洁自然的部署流程

set -e

echo "🐾 FurLink 部署开始..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查部署依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 创建环境文件
create_env_file() {
    log_info "创建环境配置文件..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# FurLink 环境配置
NODE_ENV=production
PORT=8080

# 数据库配置
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=furlink123
MONGO_DATABASE=furlink

# Redis 配置
REDIS_ENABLED=true

# JWT 配置
JWT_SECRET=furlink-jwt-secret-key-$(date +%s)
JWT_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# 文件上传配置
UPLOAD_MAX_SIZE_MB=10

# API 配置
API_BASE_URL=http://localhost:8080
PRODUCTION_URL=https://furlink-api.example.com
EOF
        log_success "环境配置文件已创建"
    else
        log_warning "环境配置文件已存在，跳过创建"
    fi
}

# 创建 SSL 证书
create_ssl_certificates() {
    log_info "创建 SSL 证书..."
    
    mkdir -p nginx/ssl
    
    if [ ! -f nginx/ssl/furlink.crt ]; then
        # 生成自签名证书（生产环境请使用正式证书）
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/furlink.key \
            -out nginx/ssl/furlink.crt \
            -subj "/C=CN/ST=Beijing/L=Beijing/O=FurLink/OU=IT/CN=furlink.example.com"
        
        log_success "SSL 证书已创建"
    else
        log_warning "SSL 证书已存在，跳过创建"
    fi
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p logs
    mkdir -p nginx/conf.d
    mkdir -p nginx/ssl
    mkdir -p monitoring
    
    log_success "目录创建完成"
}

# 构建和启动服务
start_services() {
    log_info "构建和启动服务..."
    
    # 停止现有服务
    docker-compose down --remove-orphans
    
    # 构建镜像
    docker-compose build --no-cache
    
    # 启动服务
    docker-compose up -d
    
    log_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    log_info "等待服务就绪..."
    
    # 等待 MongoDB
    log_info "等待 MongoDB 启动..."
    until docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; do
        sleep 2
    done
    log_success "MongoDB 已就绪"
    
    # 等待 Redis
    log_info "等待 Redis 启动..."
    until docker-compose exec -T redis redis-cli ping &> /dev/null; do
        sleep 2
    done
    log_success "Redis 已就绪"
    
    # 等待后端服务
    log_info "等待后端服务启动..."
    until curl -f http://localhost:8080/api/health &> /dev/null; do
        sleep 5
    done
    log_success "后端服务已就绪"
    
    # 等待 Nginx
    log_info "等待 Nginx 启动..."
    until curl -f http://localhost/health &> /dev/null; do
        sleep 2
    done
    log_success "Nginx 已就绪"
}

# 显示部署信息
show_deployment_info() {
    log_success "FurLink 部署完成！"
    echo
    echo "📋 服务信息："
    echo "  - API 服务: http://localhost:8080"
    echo "  - Nginx 代理: http://localhost"
    echo "  - MongoDB: localhost:27017"
    echo "  - Redis: localhost:6379"
    echo
    echo "🔧 管理命令："
    echo "  - 查看日志: docker-compose logs -f"
    echo "  - 停止服务: docker-compose down"
    echo "  - 重启服务: docker-compose restart"
    echo "  - 更新服务: docker-compose pull && docker-compose up -d"
    echo
    echo "📊 监控信息："
    echo "  - 健康检查: http://localhost/api/health"
    echo "  - API 文档: http://localhost/api-docs"
    echo
    echo "⚠️  注意事项："
    echo "  - 请修改 .env 文件中的配置信息"
    echo "  - 生产环境请使用正式的 SSL 证书"
    echo "  - 建议配置防火墙和安全组"
    echo
}

# 主函数
main() {
    log_info "开始 FurLink 部署流程..."
    
    check_dependencies
    create_directories
    create_env_file
    create_ssl_certificates
    start_services
    wait_for_services
    show_deployment_info
    
    log_success "FurLink 部署成功完成！"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
