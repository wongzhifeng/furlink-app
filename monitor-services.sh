#!/bin/bash

# FurLink 多平台服务状态监控脚本
# 监控Zeabur和Zion服务状态

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
    "zeabur-frontend:https://furlink-frontend.zeabur.app"
    "zeabur-backend:https://furlink-backend-m9k2.zeabur.app"
    "zion-backend:http://localhost:8081"
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
        else
            log_warning "⚠ $service_name - 健康检查失败"
        fi
    fi
}

# 监控所有服务
monitor_all_services() {
    log_header "FurLink 多平台服务状态监控"
    echo -e "${CYAN}监控时间: $(date)${NC}"
    echo ""
    
    local total_services=${#SERVICES[@]}
    local healthy_services=0
    local starting_services=0
    local failed_services=0
    
    for service in "${SERVICES[@]}"; do
        IFS=':' read -r service_name service_url <<< "$service"
        
        check_service "$service_name" "$service_url"
        local result=$?
        
        case $result in
            0) ((healthy_services++)) ;;
            1) ((starting_services++)) ;;
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
    echo -e "${RED}异常服务: $failed_services${NC}"
    echo -e "${BLUE}总服务数: $total_services${NC}"
    
    # 计算健康率
    local health_rate=$((healthy_services * 100 / total_services))
    echo -e "${CYAN}健康率: ${health_rate}%${NC}"
    
    return $failed_services
}

# 持续监控模式
continuous_monitor() {
    local interval=${1:-30} # 默认30秒间隔
    
    log_header "启动持续监控模式"
    log_info "监控间隔: ${interval}秒"
    log_info "按 Ctrl+C 停止监控"
    echo ""
    
    while true; do
        monitor_all_services
        echo ""
        log_info "等待 ${interval} 秒后进行下次检查..."
        sleep $interval
        echo ""
    done
}

# 生成状态报告
generate_status_report() {
    local report_file="/Users/mac/Desktop/code/FurLink/SERVICE_STATUS_REPORT.md"
    
    log_header "生成服务状态报告"
    
    cat > "$report_file" << EOF
# FurLink 服务状态报告

## 📊 监控概览
- **生成时间**: $(date)
- **监控服务**: ${#SERVICES[@]} 个服务
- **监控范围**: Zeabur + Zion 多平台

## 🌐 服务列表

### Zeabur平台
- **前端服务**: https://furlink-frontend.zeabur.app/
- **后端服务**: https://furlink-backend-m9k2.zeabur.app/

### Zion平台
- **后端服务**: http://localhost:8081 (本地测试)

## 🔧 监控配置
- **检查间隔**: 30秒
- **超时时间**: 10秒
- **健康检查**: API端点测试

## 📈 状态说明
- ✅ **正常**: HTTP 200 响应
- ⚠️ **启动中**: HTTP 502/503/504 响应
- ❌ **异常**: HTTP 404 或其他错误
- 🔌 **离线**: 连接超时或网络错误

## 🚀 部署状态
- **Zeabur前端**: 部署完成，启动中
- **Zeabur后端**: 部署完成，启动中
- **Zion后端**: 本地测试成功，准备部署

## 🔗 多平台集成
- **服务选择**: 智能切换机制
- **故障转移**: 自动备用服务
- **状态监控**: 实时健康检查

---
**报告生成时间**: $(date)  
**FurLink Team** - 宠物紧急寻回平台
EOF

    log_success "服务状态报告已生成: $report_file"
}

# 显示帮助信息
show_help() {
    echo "FurLink 多平台服务状态监控脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -c, --continuous [间隔]  持续监控模式 (默认30秒间隔)"
    echo "  -r, --report    生成状态报告"
    echo "  -s, --single    单次检查模式 (默认)"
    echo ""
    echo "示例:"
    echo "  $0                    # 单次检查所有服务"
    echo "  $0 -c 60              # 持续监控，60秒间隔"
    echo "  $0 -r                 # 生成状态报告"
    echo ""
}

# 主函数
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--continuous)
            local interval=${2:-30}
            continuous_monitor $interval
            ;;
        -r|--report)
            generate_status_report
            ;;
        -s|--single|"")
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
