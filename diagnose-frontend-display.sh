#!/bin/bash

# 前端显示问题诊断工具
# 检查前端页面无法显示的具体原因

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

# 检查前端服务状态
check_frontend_service() {
    log_header "检查前端服务状态"
    
    local frontend_url="https://furlink-frontend-us.zeabur.app"
    
    log_info "检查前端URL: $frontend_url"
    
    # 检查HTTP状态
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" "$frontend_url")
    log_info "HTTP状态码: $http_status"
    
    if [ "$http_status" = "200" ]; then
        log_success "✓ 前端服务正常"
        return 0
    else
        log_error "✗ 前端服务异常 (HTTP $http_status)"
        return 1
    fi
}

# 检查页面内容
check_page_content() {
    log_header "检查页面内容"
    
    local frontend_url="https://furlink-frontend-us.zeabur.app"
    
    # 检查页面标题
    local title=$(curl -s "$frontend_url" | grep -o '<title>[^<]*</title>' | sed 's/<title>\(.*\)<\/title>/\1/')
    log_info "页面标题: $title"
    
    if [[ "$title" == *"毛茸茸"* ]]; then
        log_success "✓ 页面标题正确"
    else
        log_error "✗ 页面标题错误: $title"
    fi
    
    # 检查页面大小
    local page_size=$(curl -s "$frontend_url" | wc -c)
    log_info "页面大小: $page_size 字节"
    
    if [ "$page_size" -gt 1000 ]; then
        log_success "✓ 页面内容完整"
    else
        log_error "✗ 页面内容过小，可能有问题"
    fi
}

# 检查静态资源
check_static_resources() {
    log_header "检查静态资源"
    
    local frontend_url="https://furlink-frontend-us.zeabur.app"
    
    # 获取资源列表
    local js_files=$(curl -s "$frontend_url" | grep -o 'src="/assets/js/[^"]*\.js"' | sed 's/src="//g' | sed 's/"//g')
    local css_files=$(curl -s "$frontend_url" | grep -o 'href="/assets/[^"]*\.css"' | sed 's/href="//g' | sed 's/"//g')
    
    log_info "检查JavaScript文件:"
    for js_file in $js_files; do
        local js_url="$frontend_url$js_file"
        local js_status=$(curl -s -o /dev/null -w "%{http_code}" "$js_url")
        if [ "$js_status" = "200" ]; then
            log_success "✓ $js_file"
        else
            log_error "✗ $js_file (HTTP $js_status)"
        fi
    done
    
    log_info "检查CSS文件:"
    for css_file in $css_files; do
        local css_url="$frontend_url$css_file"
        local css_status=$(curl -s -o /dev/null -w "%{http_code}" "$css_url")
        if [ "$css_status" = "200" ]; then
            log_success "✓ $css_file"
        else
            log_error "✗ $css_file (HTTP $css_status)"
        fi
    done
}

# 检查API配置
check_api_config() {
    log_header "检查API配置"
    
    local frontend_url="https://furlink-frontend-us.zeabur.app"
    
    # 检查页面中是否包含API配置
    local api_config=$(curl -s "$frontend_url" | grep -o 'furlink-backend-us.zeabur.app' | head -1)
    if [ -n "$api_config" ]; then
        log_success "✓ 页面包含正确的API配置"
    else
        log_warning "⚠ 页面中未找到API配置，可能使用默认配置"
    fi
    
    # 检查后端API状态
    local backend_url="https://furlink-backend-us.zeabur.app"
    local backend_status=$(curl -s -o /dev/null -w "%{http_code}" "$backend_url/api/health")
    
    if [ "$backend_status" = "200" ]; then
        log_success "✓ 后端API正常"
        
        # 获取后端响应
        local backend_response=$(curl -s "$backend_url/api/health")
        log_info "后端响应: $backend_response"
    else
        log_error "✗ 后端API异常 (HTTP $backend_status)"
    fi
}

# 检查浏览器兼容性
check_browser_compatibility() {
    log_header "检查浏览器兼容性"
    
    local frontend_url="https://furlink-frontend-us.zeabur.app"
    
    # 检查页面是否包含现代JavaScript特性
    local page_content=$(curl -s "$frontend_url")
    
    if echo "$page_content" | grep -q "type=\"module\""; then
        log_success "✓ 使用ES模块，支持现代浏览器"
    else
        log_warning "⚠ 未使用ES模块，可能兼容性问题"
    fi
    
    if echo "$page_content" | grep -q "react"; then
        log_success "✓ 使用React框架"
    else
        log_warning "⚠ 未检测到React框架"
    fi
}

# 检查CORS配置
check_cors_config() {
    log_header "检查CORS配置"
    
    local frontend_url="https://furlink-frontend-us.zeabur.app"
    local backend_url="https://furlink-backend-us.zeabur.app"
    
    # 检查CORS头
    local cors_headers=$(curl -s -I "$backend_url/api/health" | grep -i "access-control")
    
    if [ -n "$cors_headers" ]; then
        log_success "✓ 后端配置了CORS头"
        log_info "CORS配置: $cors_headers"
    else
        log_warning "⚠ 后端未配置CORS头，可能影响前端API调用"
    fi
}

# 生成问题诊断
generate_diagnosis() {
    log_header "问题诊断"
    
    echo -e "${CYAN}前端无法显示的可能原因:${NC}"
    echo "1. 🌐 浏览器缓存问题"
    echo "2. 🔧 JavaScript执行错误"
    echo "3. 🎨 CSS样式问题"
    echo "4. 🔌 API调用失败"
    echo "5. 🌍 网络连接问题"
    echo "6. 🔒 CORS跨域问题"
    echo "7. 📱 设备兼容性问题"
    echo ""
    
    echo -e "${CYAN}解决方案:${NC}"
    echo "1. 🔄 清除浏览器缓存 (Ctrl+F5 或 Cmd+Shift+R)"
    echo "2. 🔍 打开浏览器开发者工具查看控制台错误"
    echo "3. 🌐 尝试不同浏览器访问"
    echo "4. 📱 尝试移动设备访问"
    echo "5. 🔧 检查网络连接"
    echo "6. 🚀 等待几分钟后重试"
    echo ""
    
    echo -e "${CYAN}调试步骤:${NC}"
    echo "1. 打开浏览器开发者工具 (F12)"
    echo "2. 查看 Console 标签页的错误信息"
    echo "3. 查看 Network 标签页的网络请求"
    echo "4. 查看 Elements 标签页的HTML结构"
    echo "5. 尝试禁用浏览器扩展"
    echo ""
    
    echo -e "${CYAN}如果问题持续存在:${NC}"
    echo "1. 检查Zeabur平台的服务日志"
    echo "2. 确认前端构建是否成功"
    echo "3. 检查环境变量配置"
    echo "4. 尝试重新部署前端服务"
    echo "5. 联系技术支持"
}

# 主函数
main() {
    log_header "前端显示问题诊断"
    echo -e "${CYAN}检查时间: $(date)${NC}"
    echo ""
    
    # 检查前端服务
    check_frontend_service
    local frontend_status=$?
    
    echo ""
    
    # 检查页面内容
    check_page_content
    
    echo ""
    
    # 检查静态资源
    check_static_resources
    
    echo ""
    
    # 检查API配置
    check_api_config
    
    echo ""
    
    # 检查浏览器兼容性
    check_browser_compatibility
    
    echo ""
    
    # 检查CORS配置
    check_cors_config
    
    echo ""
    
    # 生成问题诊断
    generate_diagnosis
    
    echo ""
    log_header "诊断完成"
    
    if [ $frontend_status -eq 0 ]; then
        log_success "前端服务正常，问题可能在于浏览器端"
        log_info "建议: 清除浏览器缓存或检查开发者工具"
    else
        log_error "前端服务异常，需要检查Zeabur平台"
        log_info "建议: 检查Zeabur平台的服务日志"
    fi
}

# 执行主函数
main "$@"
