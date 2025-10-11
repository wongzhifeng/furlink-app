#!/bin/bash

# Zeabur后端状态检查工具
# 诊断后端服务问题

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# 检查后端状态
check_backend_status() {
    log_header "检查Zeabur后端状态"
    
    local backend_url="https://furlink-backend-us.zeabur.app"
    
    log_info "检查后端URL: $backend_url"
    
    # 检查HTTP状态
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" "$backend_url")
    log_info "HTTP状态码: $http_status"
    
    case $http_status in
        200)
            log_success "✓ 后端服务正常"
            return 0
            ;;
        502)
            log_error "✗ Bad Gateway - 后端服务启动中或配置问题"
            return 1
            ;;
        503)
            log_warning "⚠ Service Unavailable - 后端服务暂时不可用"
            return 2
            ;;
        404)
            log_error "✗ Not Found - 后端服务未找到"
            return 3
            ;;
        000)
            log_error "✗ Connection Failed - 无法连接到后端服务"
            return 4
            ;;
        *)
            log_warning "⚠ 未知状态码: $http_status"
            return 5
            ;;
    esac
}

# 检查API端点
check_api_endpoints() {
    log_header "检查API端点"
    
    local backend_url="https://furlink-backend-us.zeabur.app"
    local endpoints=("/" "/api/health" "/api/metrics")
    
    for endpoint in "${endpoints[@]}"; do
        local full_url="$backend_url$endpoint"
        log_info "检查端点: $full_url"
        
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$full_url")
        local response=$(curl -s "$full_url" | head -c 100)
        
        if [ "$status" = "200" ]; then
            log_success "✓ $endpoint - 正常 (HTTP $status)"
            log_info "  响应: $response"
        else
            log_error "✗ $endpoint - 异常 (HTTP $status)"
            log_info "  响应: $response"
        fi
        echo ""
    done
}

# 检查本地后端对比
check_local_backend() {
    log_header "检查本地后端对比"
    
    local local_backend="http://localhost:8081"
    
    log_info "检查本地后端: $local_backend"
    
    local local_status=$(curl -s -o /dev/null -w "%{http_code}" "$local_backend/api/health")
    if [ "$local_status" = "200" ]; then
        log_success "✓ 本地后端服务正常"
        
        # 获取本地后端响应
        local local_response=$(curl -s "$local_backend/api/health")
        log_info "本地后端响应: $local_response"
    else
        log_warning "⚠ 本地后端服务异常 (HTTP $local_status)"
    fi
}

# 生成问题诊断
generate_diagnosis() {
    log_header "问题诊断"
    
    echo -e "${CYAN}HTTP 502 Bad Gateway 可能的原因:${NC}"
    echo "1. 🔄 服务正在启动中 (最常见)"
    echo "2. 🔧 服务配置问题"
    echo "3. 📦 依赖安装失败"
    echo "4. 🚀 启动脚本错误"
    echo "5. 🔌 端口配置问题"
    echo ""
    
    echo -e "${CYAN}解决方案:${NC}"
    echo "1. ⏳ 等待服务启动 (通常需要2-5分钟)"
    echo "2. 🔍 检查Zeabur平台的服务日志"
    echo "3. 🔧 检查环境变量配置"
    echo "4. 📦 确认Dockerfile和package.json正确"
    echo "5. 🚀 重新部署服务"
    echo ""
    
    echo -e "${CYAN}Zeabur平台检查步骤:${NC}"
    echo "1. 登录 https://zeabur.com"
    echo "2. 找到 furlink-backend-us 服务"
    echo "3. 查看 'Logs' 或 '日志' 标签页"
    echo "4. 检查构建日志和服务日志"
    echo "5. 确认服务状态为 'Running'"
    echo ""
    
    echo -e "${CYAN}如果问题持续存在:${NC}"
    echo "1. 检查Dockerfile语法"
    echo "2. 确认package.json中的start脚本"
    echo "3. 验证环境变量配置"
    echo "4. 尝试重新部署"
    echo "5. 联系Zeabur支持"
}

# 检查前端API配置
check_frontend_api_config() {
    log_header "检查前端API配置"
    
    local frontend_url="https://furlink-frontend-us.zeabur.app"
    
    log_info "检查前端API配置"
    
    # 检查前端是否配置了正确的后端URL
    local api_config=$(curl -s "$frontend_url" | grep -o 'connect-src[^;]*' | head -1)
    if [ -n "$api_config" ]; then
        log_info "前端API配置: $api_config"
        
        if echo "$api_config" | grep -q "furlink-backend-us.zeabur.app"; then
            log_success "✓ 前端已配置正确的后端URL"
        else
            log_warning "⚠ 前端可能未配置正确的后端URL"
        fi
    else
        log_warning "⚠ 无法获取前端API配置"
    fi
}

# 主函数
main() {
    log_header "Zeabur后端状态检查"
    echo -e "${CYAN}检查时间: $(date)${NC}"
    echo ""
    
    # 检查后端状态
    check_backend_status
    local backend_status=$?
    
    echo ""
    
    # 检查API端点
    check_api_endpoints
    
    # 检查本地后端对比
    check_local_backend
    
    echo ""
    
    # 检查前端API配置
    check_frontend_api_config
    
    echo ""
    
    # 生成问题诊断
    generate_diagnosis
    
    echo ""
    log_header "检查完成"
    
    if [ $backend_status -eq 0 ]; then
        log_success "后端服务正常，可以正常使用"
    else
        log_error "后端服务异常，需要进一步排查"
        log_info "建议: 检查Zeabur平台的服务日志"
    fi
}

# 执行主函数
main "$@"
