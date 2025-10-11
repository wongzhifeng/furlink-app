#!/bin/bash

# 网页错误诊断工具
# 帮助确定是前端问题还是后端问题

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

# 检查前端状态
check_frontend() {
    log_header "检查前端状态"
    
    local frontend_url="https://furlink-frontend-us.zeabur.app"
    
    log_info "检查前端URL: $frontend_url"
    
    # 检查HTTP状态
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" "$frontend_url")
    log_info "HTTP状态码: $http_status"
    
    if [ "$http_status" = "200" ]; then
        log_success "✓ 前端服务可访问"
    else
        log_error "✗ 前端服务不可访问 (HTTP $http_status)"
        return 1
    fi
    
    # 检查页面标题
    local title=$(curl -s "$frontend_url" | grep -o '<title>[^<]*</title>' | sed 's/<[^>]*>//g')
    log_info "页面标题: $title"
    
    # 检查JavaScript文件
    local js_files=$(curl -s "$frontend_url" | grep -o 'src="/assets/js/[^"]*"' | sed 's/src="//g' | sed 's/"//g')
    if [ -n "$js_files" ]; then
        log_info "JavaScript文件: $js_files"
        for js_file in $js_files; do
            local js_status=$(curl -s -o /dev/null -w "%{http_code}" "$frontend_url$js_file")
            if [ "$js_status" = "200" ]; then
                log_success "✓ $js_file 可访问"
            else
                log_error "✗ $js_file 不可访问 (HTTP $js_status)"
            fi
        done
    fi
    
    # 检查CSS文件
    local css_files=$(curl -s "$frontend_url" | grep -o 'href="/assets/[^"]*\.css"' | sed 's/href="//g' | sed 's/"//g')
    if [ -n "$css_files" ]; then
        log_info "CSS文件: $css_files"
        for css_file in $css_files; do
            local css_status=$(curl -s -o /dev/null -w "%{http_code}" "$frontend_url$css_file")
            if [ "$css_status" = "200" ]; then
                log_success "✓ $css_file 可访问"
            else
                log_error "✗ $css_file 不可访问 (HTTP $css_status)"
            fi
        done
    fi
    
    return 0
}

# 检查后端状态
check_backend() {
    log_header "检查后端状态"
    
    # 检查本地后端
    local local_backend="http://localhost:8081"
    log_info "检查本地后端: $local_backend"
    
    local local_status=$(curl -s -o /dev/null -w "%{http_code}" "$local_backend/api/health")
    if [ "$local_status" = "200" ]; then
        log_success "✓ 本地后端服务正常"
    else
        log_warning "⚠ 本地后端服务异常 (HTTP $local_status)"
    fi
    
    # 检查Zeabur后端
    local zeabur_backend="https://furlink-backend-m9k2.zeabur.app"
    log_info "检查Zeabur后端: $zeabur_backend"
    
    local zeabur_status=$(curl -s -o /dev/null -w "%{http_code}" "$zeabur_backend/api/health")
    if [ "$zeabur_status" = "200" ]; then
        log_success "✓ Zeabur后端服务正常"
    else
        log_warning "⚠ Zeabur后端服务异常 (HTTP $zeabur_status)"
    fi
    
    # 检查Zion后端 (如果已部署)
    local zion_backend="https://your-zion-backend-url.zion.com"
    log_info "检查Zion后端: $zion_backend"
    
    local zion_status=$(curl -s -o /dev/null -w "%{http_code}" "$zion_backend/api/health")
    if [ "$zion_status" = "200" ]; then
        log_success "✓ Zion后端服务正常"
    else
        log_warning "⚠ Zion后端服务未部署或异常 (HTTP $zion_status)"
    fi
}

# 检查API调用
check_api_calls() {
    log_header "检查API调用"
    
    local frontend_url="https://furlink-frontend-us.zeabur.app"
    
    # 检查前端API配置
    log_info "检查前端API配置"
    local api_config=$(curl -s "$frontend_url" | grep -o 'connect-src[^;]*' | head -1)
    if [ -n "$api_config" ]; then
        log_info "API配置: $api_config"
    fi
    
    # 检查是否有API调用错误
    log_info "检查可能的API调用问题"
    log_warning "请检查浏览器控制台是否有以下错误:"
    echo "  - CORS错误"
    echo "  - 网络请求失败"
    echo "  - API端点404/500错误"
    echo "  - 认证失败"
}

# 生成诊断报告
generate_report() {
    log_header "诊断报告"
    
    echo -e "${CYAN}前端状态:${NC}"
    if check_frontend; then
        echo "  ✅ 前端服务正常"
        echo "  ✅ 页面可访问"
        echo "  ✅ 静态资源正常"
    else
        echo "  ❌ 前端服务异常"
    fi
    
    echo ""
    echo -e "${CYAN}后端状态:${NC}"
    check_backend
    
    echo ""
    echo -e "${CYAN}API调用:${NC}"
    check_api_calls
    
    echo ""
    echo -e "${CYAN}问题排查建议:${NC}"
    echo "1. 如果前端正常但页面显示错误:"
    echo "   - 检查浏览器控制台JavaScript错误"
    echo "   - 检查网络请求是否失败"
    echo "   - 检查API调用是否正常"
    echo ""
    echo "2. 如果前端异常:"
    echo "   - 检查Zeabur部署状态"
    echo "   - 检查构建日志"
    echo "   - 重新部署前端服务"
    echo ""
    echo "3. 如果后端异常:"
    echo "   - 检查后端服务状态"
    echo "   - 检查API端点是否可访问"
    echo "   - 检查CORS配置"
    echo ""
    echo "4. 浏览器调试步骤:"
    echo "   - 打开浏览器开发者工具 (F12)"
    echo "   - 查看Console标签页的错误信息"
    echo "   - 查看Network标签页的请求状态"
    echo "   - 查看Sources标签页的代码加载情况"
}

# 主函数
main() {
    log_header "网页错误诊断工具"
    echo -e "${CYAN}诊断时间: $(date)${NC}"
    echo ""
    
    generate_report
    
    echo ""
    log_header "诊断完成"
    log_info "请根据上述报告确定问题类型:"
    log_info "  - 前端问题: 页面无法加载、JavaScript错误、静态资源404"
    log_info "  - 后端问题: API调用失败、数据获取错误、认证问题"
    log_info "  - 网络问题: CORS错误、超时、连接失败"
}

# 执行主函数
main "$@"
