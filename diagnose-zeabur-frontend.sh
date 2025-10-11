#!/bin/bash

# Zeabur前端部署问题诊断和修复脚本
# 解决FluLink旧代码部署问题

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

# 检查前端部署状态
check_frontend_status() {
    log_header "检查Zeabur前端部署状态"
    
    local frontend_url="https://furlink-frontend-us.zeabur.app"
    
    log_info "检查前端URL: $frontend_url"
    
    # 检查HTTP状态
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" "$frontend_url")
    log_info "HTTP状态码: $http_status"
    
    if [ "$http_status" = "200" ]; then
        log_success "✓ 前端服务可访问"
    else
        log_error "✗ 前端服务不可访问"
        return 1
    fi
    
    # 检查页面标题
    local title=$(curl -s "$frontend_url" | grep -o '<title>[^<]*</title>' | sed 's/<[^>]*>//g')
    log_info "页面标题: $title"
    
    # 检查页面描述
    local description=$(curl -s "$frontend_url" | grep -o '<meta name="description" content="[^"]*"' | sed 's/<meta name="description" content="//g' | sed 's/"//g')
    log_info "页面描述: $description"
    
    if [[ "$title" == *"FluLink"* ]]; then
        log_error "✗ 检测到FluLink代码 (错误项目)"
        log_warning "Zeabur可能连接到了错误的Git仓库"
        log_warning "当前部署: $title"
        log_warning "预期部署: FurLink - 毛茸茸链接"
        return 2
    elif [[ "$title" == *"FurLink"* ]]; then
        log_success "✓ 检测到正确版本FurLink代码"
        return 0
    else
        log_warning "⚠ 无法确定代码版本"
        return 3
    fi
}

# 检查页面内容
check_page_content() {
    log_header "检查页面内容"
    
    local frontend_url="https://furlink-frontend-us.zeabur.app"
    local content=$(curl -s "$frontend_url")
    
    # 检查是否有换行符问题
    if echo "$content" | grep -q "\\\\n"; then
        log_error "✗ 检测到换行符显示问题"
        log_warning "页面显示 \\n\\n \\n \\n"
    else
        log_success "✓ 页面内容正常"
    fi
    
    # 检查JavaScript错误
    if echo "$content" | grep -q "querySelectorAll.*star-0.5"; then
        log_error "✗ 检测到JavaScript选择器错误"
        log_warning "错误: .star-0.5 is not a valid selector"
    else
        log_success "✓ 没有检测到JavaScript选择器错误"
    fi
    
    # 检查API配置
    if echo "$content" | grep -q "FluLink"; then
        log_error "✗ 检测到FluLink相关代码"
        log_warning "应该使用FurLink代码"
    else
        log_success "✓ 没有检测到FluLink代码"
    fi
}

# 检查本地构建
check_local_build() {
    log_header "检查本地构建状态"
    
    local frontend_dir="/Users/mac/Desktop/code/FurLink/frontend/web"
    
    if [ ! -d "$frontend_dir/dist" ]; then
        log_error "✗ 本地dist目录不存在"
        log_info "正在重新构建..."
        cd "$frontend_dir" && npm run build
        if [ $? -eq 0 ]; then
            log_success "✓ 本地构建成功"
        else
            log_error "✗ 本地构建失败"
            return 1
        fi
    else
        log_success "✓ 本地dist目录存在"
    fi
    
    # 检查本地构建的标题
    local local_title=$(cat "$frontend_dir/dist/index.html" | grep -o '<title>[^<]*</title>' | sed 's/<[^>]*>//g')
    log_info "本地构建标题: $local_title"
    
    if [[ "$local_title" == *"FurLink"* ]]; then
        log_success "✓ 本地构建使用正确版本"
        return 0
    else
        log_error "✗ 本地构建版本不正确"
        return 1
    fi
}

# 生成修复建议
generate_fix_suggestions() {
    log_header "生成修复建议"
    
    echo -e "${CYAN}问题诊断:${NC}"
    echo "1. Zeabur上部署的是FluLink星尘共鸣版 (错误项目)"
    echo "2. 应该部署的是FurLink宠物平台 (正确项目)"
    echo "3. Zeabur可能连接到了错误的Git仓库"
    echo ""
    
    echo -e "${CYAN}解决方案:${NC}"
    echo "1. 登录Zeabur平台: https://zeabur.com"
    echo "2. 找到 furlink-frontend-us 服务"
    echo "3. 检查源码设置:"
    echo "   - 仓库地址: https://gitee.com/hangzhou_thousand_army_wangzhifeng/furlink.git"
    echo "   - 分支: main"
    echo "   - 目录: frontend/web"
    echo "4. 如果配置错误，重新配置或重新创建服务"
    echo ""
    
    echo -e "${CYAN}如果配置正确但代码未更新:${NC}"
    echo "1. 点击 'Sync' 或 '同步' 按钮"
    echo "2. 点击 'Redeploy' 或 '重新部署'"
    echo "3. 等待构建完成"
    echo ""
    
    echo -e "${CYAN}验证步骤:${NC}"
    echo "1. 检查页面标题是否为 'FurLink - 毛茸茸链接'"
    echo "2. 检查页面内容是否正常显示"
    echo "3. 检查控制台是否有JavaScript错误"
    echo ""
}

# 显示Zeabur重新部署指南
show_redeploy_guide() {
    log_header "Zeabur重新部署指南"
    
    echo -e "${BLUE}步骤1: 登录Zeabur平台${NC}"
    echo "  访问: https://zeabur.com"
    echo "  登录您的账号"
    echo ""
    
    echo -e "${BLUE}步骤2: 检查源码配置${NC}"
    echo "  找到服务: furlink-frontend-us"
    echo "  点击进入服务详情"
    echo "  检查 'Source' 或 '源码' 设置:"
    echo "    - 仓库地址: https://gitee.com/hangzhou_thousand_army_wangzhifeng/furlink.git"
    echo "    - 分支: main"
    echo "    - 目录: frontend/web"
    echo ""
    
    echo -e "${BLUE}步骤3: 修复配置 (如果错误)${NC}"
    echo "  如果配置不正确:"
    echo "    1. 删除现有服务"
    echo "    2. 重新创建服务"
    echo "    3. 使用正确的仓库地址和目录"
    echo "  如果配置正确:"
    echo "    1. 点击 'Sync' 或 '同步' 按钮"
    echo "    2. 点击 'Redeploy' 或 '重新部署'"
    echo ""
    
    echo -e "${BLUE}步骤4: 验证部署结果${NC}"
    echo "  访问: https://furlink-frontend-us.zeabur.app"
    echo "  检查页面标题是否为 'FurLink - 毛茸茸链接'"
    echo "  检查页面内容是否正常显示"
    echo ""
    
    echo -e "${BLUE}如果问题仍然存在:${NC}"
    echo "  1. 检查Git仓库连接"
    echo "  2. 确认分支: main"
    echo "  3. 确认目录: frontend/web"
    echo "  4. 手动同步代码"
    echo ""
}

# 主函数
main() {
    log_header "Zeabur前端部署问题诊断"
    
    # 检查前端状态
    check_frontend_status
    local frontend_status=$?
    
    # 检查页面内容
    check_page_content
    
    # 检查本地构建
    check_local_build
    local build_status=$?
    
    echo ""
    
    # 生成修复建议
    generate_fix_suggestions
    
    # 显示重新部署指南
    show_redeploy_guide
    
    # 总结
    log_header "诊断总结"
    if [ $frontend_status -eq 2 ]; then
        log_error "确认问题: Zeabur部署的是FluLink星尘共鸣版 (错误项目)"
        log_warning "应该部署: FurLink宠物平台 (正确项目)"
        log_info "解决方案: 检查Zeabur源码配置，可能需要重新配置服务"
    elif [ $frontend_status -eq 0 ]; then
        log_success "前端部署正常"
    else
        log_warning "前端状态未知，建议检查Zeabur平台"
    fi
    
    if [ $build_status -eq 0 ]; then
        log_success "本地构建正常，可以重新部署"
    else
        log_error "本地构建有问题，需要先修复"
    fi
}

# 执行主函数
main "$@"
