#!/bin/bash

# FurLink Zion平台部署脚本
# 自动部署backend-zion到Zion平台

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

# Zion平台配置
ZION_CONFIG=(
    "NODE_ENV=production"
    "PORT=8080"
    "NODE_OPTIONS=--max-old-space-size=400 --max-semi-space-size=64 --optimize-for-size"
    "ZION_PROJECT_ID=KrABb5Mb0qw"
    "ZION_DATABASE_ID=mgm6x7a6"
    "ZION_API_BASE_URL=https://api.zion.com"
    "ZION_API_KEY=mgm6x7a6"
    "ALLOWED_ORIGINS=https://furlink-frontend.zeabur.app,http://localhost:8080"
    "JWT_SECRET=your_super_secret_jwt_key_change_in_production"
)

# 检查本地服务状态
check_local_service() {
    log_header "检查本地Zion后端服务"
    
    if curl -s http://localhost:8081/api/health > /dev/null 2>&1; then
        log_success "本地Zion后端服务运行正常"
        
        # 获取服务信息
        local service_info=$(curl -s http://localhost:8081/api/zion/info)
        local project_id=$(echo "$service_info" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        local database_id=$(echo "$service_info" | grep -o '"databaseId":"[^"]*"' | cut -d'"' -f4)
        
        log_info "项目ID: $project_id"
        log_info "数据库ID: $database_id"
        
        return 0
    else
        log_error "本地Zion后端服务未运行"
        log_warning "请先启动本地服务: cd backend-zion && PORT=8081 npm start"
        return 1
    fi
}

# 检查部署文件
check_deployment_files() {
    log_header "检查部署文件"
    
    local backend_dir="/Users/mac/Desktop/code/FurLink/backend-zion"
    
    if [ ! -d "$backend_dir" ]; then
        log_error "backend-zion目录不存在: $backend_dir"
        return 1
    fi
    
    local required_files=(
        "package.json"
        "Dockerfile"
        "src/index.js"
        "zion.yml"
        "env.example"
        "README.md"
        "DEPLOYMENT_GUIDE.md"
        "DEPLOYMENT_CHECKLIST.md"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$backend_dir/$file" ]; then
            log_success "✓ $file"
        else
            log_error "✗ $file 缺失"
            return 1
        fi
    done
    
    log_success "所有部署文件检查通过"
    return 0
}

# 显示部署信息
show_deployment_info() {
    log_header "Zion平台部署信息"
    
    echo -e "${BLUE}项目信息:${NC}"
    echo "  项目名称: Furlink-app"
    echo "  项目ID: KrABb5Mb0qw"
    echo "  数据库ID: mgm6x7a6"
    echo "  API密钥: mgm6x7a6"
    echo ""
    
    echo -e "${BLUE}账号信息:${NC}"
    echo "  邮箱: vx18668020218@qq.com"
    echo "  密码: q96321478"
    echo ""
    
    echo -e "${BLUE}部署URL:${NC}"
    echo "  Zion平台: https://zion.com"
    echo "  项目地址: https://zion.com/projects/KrABb5Mb0qw"
    echo ""
    
    echo -e "${BLUE}环境变量:${NC}"
    for config in "${ZION_CONFIG[@]}"; do
        echo "  $config"
    done
    echo ""
}

# 显示部署步骤
show_deployment_steps() {
    log_header "Zion平台部署步骤"
    
    echo -e "${YELLOW}步骤1: 登录Zion平台${NC}"
    echo "  1. 访问 https://zion.com"
    echo "  2. 使用账号: vx18668020218@qq.com"
    echo "  3. 密码: q96321478"
    echo "  4. 进入项目: Furlink-app"
    echo ""
    
    echo -e "${YELLOW}步骤2: 创建后端服务${NC}"
    echo "  1. 点击'创建新服务'"
    echo "  2. 选择'后端服务'"
    echo "  3. 选择'Docker'部署类型"
    echo "  4. 上传backend-zion目录代码"
    echo ""
    
    echo -e "${YELLOW}步骤3: 配置环境变量${NC}"
    echo "  复制以下环境变量到Zion平台:"
    for config in "${ZION_CONFIG[@]}"; do
        echo "    $config"
    done
    echo ""
    
    echo -e "${YELLOW}步骤4: 启动部署${NC}"
    echo "  1. 保存配置"
    echo "  2. 启动构建"
    echo "  3. 等待构建完成"
    echo "  4. 检查服务状态"
    echo ""
    
    echo -e "${YELLOW}步骤5: 测试API端点${NC}"
    echo "  1. GET /api/health - 健康检查"
    echo "  2. GET /api/metrics - 性能指标"
    echo "  3. GET /api/zion/info - Zion项目信息"
    echo "  4. GET /api/zion/data/account - 数据查询"
    echo ""
}

# 生成部署报告
generate_deployment_report() {
    log_header "生成部署报告"
    
    local report_file="/Users/mac/Desktop/code/FurLink/backend-zion/DEPLOYMENT_REPORT.md"
    
    cat > "$report_file" << EOF
# FurLink Zion平台部署报告

## 📊 部署状态
- **生成时间**: $(date)
- **项目版本**: 1.0.0
- **部署类型**: Docker容器
- **平台**: Zion

## 🏢 Zion项目信息
- **项目名称**: Furlink-app
- **项目ID**: KrABb5Mb0qw
- **数据库ID**: mgm6x7a6
- **API密钥**: mgm6x7a6

## 🔧 环境变量配置
EOF

    for config in "${ZION_CONFIG[@]}"; do
        echo "- \`$config\`" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

## 📁 部署文件
- package.json - 项目配置
- Dockerfile - Docker配置
- src/index.js - 主服务文件
- zion.yml - Zion平台配置
- env.example - 环境变量模板
- README.md - 项目文档
- DEPLOYMENT_GUIDE.md - 部署指南
- DEPLOYMENT_CHECKLIST.md - 检查清单

## 🧪 测试端点
- \`GET /api/health\` - 健康检查
- \`GET /api/metrics\` - 性能指标
- \`GET /api/zion/info\` - Zion项目信息
- \`GET /api/zion/data/:table\` - 数据查询

## 🔗 多平台集成
- **Zion平台**: 主要服务 (优先级1)
- **Zeabur平台**: 备用服务 (优先级2)
- **前端**: 支持自动切换

## 📞 支持信息
- **Zion平台**: https://zion.com
- **项目仓库**: https://gitee.com/hangzhou_thousand_army_wangzhifeng/furlink.git
- **部署文档**: DEPLOYMENT_GUIDE.md

---
**报告生成时间**: $(date)  
**FurLink Team** - 宠物紧急寻回平台
EOF

    log_success "部署报告已生成: $report_file"
}

# 主函数
main() {
    log_header "FurLink Zion平台部署准备"
    
    # 检查本地服务
    if ! check_local_service; then
        log_error "本地服务检查失败，请先启动服务"
        exit 1
    fi
    
    # 检查部署文件
    if ! check_deployment_files; then
        log_error "部署文件检查失败"
        exit 1
    fi
    
    # 显示部署信息
    show_deployment_info
    
    # 显示部署步骤
    show_deployment_steps
    
    # 生成部署报告
    generate_deployment_report
    
    log_header "部署准备完成"
    log_success "所有检查通过，可以开始Zion平台部署"
    log_info "请按照上述步骤在Zion平台进行部署"
    log_info "部署完成后，请运行测试脚本验证服务"
}

# 执行主函数
main "$@"
