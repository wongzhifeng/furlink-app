#!/bin/bash

# FurLink Zion平台部署状态监控脚本
# 监控Zion后端部署状态和API可用性

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 服务配置
SERVICES=(
    "zeabur-frontend:https://furlink-frontend-us.zeabur.app"
    "zion-backend-local:http://localhost:8081"
    "zion-backend-production:https://your-zion-backend-url.zion.com"
)

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

# 检查单个服务状态
check_service() {
    local service_name=$1
    local service_url=$2
    local timeout=10
    
    log_info "检查 $service_name: $service_url"
    
    # 跳过生产环境Zion后端（还未部署）
    if [[ "$service_name" == "zion-backend-production" ]]; then
        log_warning "⚠ $service_name - 待部署到Zion平台"
        return 2
    fi
    
    # 尝试访问服务
    local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $timeout "$service_url" 2>/dev/null)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        case $response in
            200)
                log_success "✓ $service_name - 服务正常 (HTTP $response)"
                return 0
                ;;
            502|503|504)
                log_warning "⚠ $service_name - 服务启动中 (HTTP $response)"
                return 1
                ;;
            404)
                log_error "✗ $service_name - 服务未找到 (HTTP $response)"
                return 2
                ;;
            *)
                log_warning "⚠ $service_name - 服务异常 (HTTP $response)"
                return 3
                ;;
        esac
    else
        log_error "✗ $service_name - 连接失败 (超时或网络错误)"
        return 4
    fi
}

# 检查API端点
check_api_endpoints() {
    local service_name=$1
    local base_url=$2
    
    if [[ "$service_name" == *"backend"* ]]; then
        log_info "检查 $service_name API端点"
        
        # 健康检查
        local health_url="${base_url}/api/health"
        local health_response=$(curl -s --max-time 5 "$health_url" 2>/dev/null)
        
        if [ $? -eq 0 ] && [ -n "$health_response" ]; then
            log_success "✓ $service_name - 健康检查通过"
            
            # 尝试解析JSON响应
            if echo "$health_response" | grep -q '"status"'; then
                local status=$(echo "$health_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
                log_info "  状态: $status"
            fi
            
            # 检查Zion信息
            if echo "$health_response" | grep -q '"zion"'; then
                log_info "  Zion集成: 已配置"
            fi
        else
            log_warning "⚠ $service_name - 健康检查失败"
        fi
    fi
}

# 监控所有服务
monitor_all_services() {
    log_header "FurLink 部署状态监控"
    echo -e "${CYAN}监控时间: $(date)${NC}"
    echo ""
    
    local total_services=${#SERVICES[@]}
    local healthy_services=0
    local starting_services=0
    local failed_services=0
    local pending_services=0
    
    for service in "${SERVICES[@]}"; do
        IFS=':' read -r service_name service_url <<< "$service"
        
        check_service "$service_name" "$service_url"
        local result=$?
        
        case $result in
            0) ((healthy_services++)) ;;
            1) ((starting_services++)) ;;
            2) ((pending_services++)) ;;
            *) ((failed_services++)) ;;
        esac
        
        # 检查API端点
        check_api_endpoints "$service_name" "$service_url"
        
        echo ""
    done
    
    # 显示总结
    log_header "服务状态总结"
    echo -e "${GREEN}正常服务: $healthy_services${NC}"
    echo -e "${YELLOW}启动中服务: $starting_services${NC}"
    echo -e "${BLUE}待部署服务: $pending_services${NC}"
    echo -e "${RED}异常服务: $failed_services${NC}"
    echo -e "${CYAN}总服务数: $total_services${NC}"
    
    # 计算健康率
    local health_rate=$((healthy_services * 100 / total_services))
    echo -e "${CYAN}健康率: ${health_rate}%${NC}"
    
    # 部署建议
    echo ""
    log_header "部署建议"
    if [ $pending_services -gt 0 ]; then
        log_info "📋 下一步: 部署Zion后端到Zion平台"
        log_info "   1. 登录 https://zion.com"
        log_info "   2. 使用账号: vx18668020218@qq.com"
        log_info "   3. 进入项目: Furlink-app"
        log_info "   4. 创建后端服务并上传代码"
        log_info "   5. 配置环境变量"
        log_info "   6. 启动部署"
    fi
    
    if [ $failed_services -gt 0 ]; then
        log_warning "⚠️ 有服务异常，请检查日志"
    fi
    
    if [ $healthy_services -eq $total_services ]; then
        log_success "🎉 所有服务运行正常！"
    fi
    
    return $failed_services
}

# 显示部署指南
show_deployment_guide() {
    log_header "Zion平台部署指南"
    
    echo -e "${BLUE}步骤1: 登录Zion平台${NC}"
    echo "  访问: https://zion.com"
    echo "  账号: vx18668020218@qq.com"
    echo "  密码: q96321478"
    echo ""
    
    echo -e "${BLUE}步骤2: 创建后端服务${NC}"
    echo "  1. 点击'创建新服务'"
    echo "  2. 选择'后端服务'"
    echo "  3. 选择'Docker'部署类型"
    echo "  4. 上传backend-zion代码"
    echo ""
    
    echo -e "${BLUE}步骤3: 配置环境变量${NC}"
    echo "  NODE_ENV=production"
    echo "  PORT=8080"
    echo "  ZION_PROJECT_ID=KrABb5Mb0qw"
    echo "  ZION_DATABASE_ID=mgm6x7a6"
    echo "  ZION_API_KEY=mgm6x7a6"
    echo "  ALLOWED_ORIGINS=https://furlink-frontend-us.zeabur.app"
    echo ""
    
    echo -e "${BLUE}步骤4: 启动部署${NC}"
    echo "  1. 保存配置"
    echo "  2. 启动构建"
    echo "  3. 等待构建完成"
    echo "  4. 检查服务状态"
    echo ""
    
    echo -e "${BLUE}步骤5: 测试API端点${NC}"
    echo "  GET /api/health - 健康检查"
    echo "  GET /api/metrics - 性能指标"
    echo "  GET /api/zion/info - Zion项目信息"
    echo "  GET /api/zion/data/account - 数据查询"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "FurLink Zion平台部署状态监控脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -m, --monitor  监控所有服务状态"
    echo "  -g, --guide    显示部署指南"
    echo "  -s, --status   显示当前状态"
    echo ""
    echo "示例:"
    echo "  $0                    # 监控所有服务"
    echo "  $0 -g                # 显示部署指南"
    echo "  $0 -s                # 显示当前状态"
    echo ""
}

# 主函数
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -g|--guide)
            show_deployment_guide
            ;;
        -s|--status|-m|--monitor|"")
            monitor_all_services
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
