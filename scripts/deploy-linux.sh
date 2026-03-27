#!/bin/bash

# Linux 一键部署脚本
# 用法: sudo ./deploy-linux.sh [--update] [--dir /path/to/install]

set -e

# 配置
PROJECT_NAME="rental-manage-system"
DEFAULT_INSTALL_DIR="/opt/rental-system"
UPDATE_MODE=false
INSTALL_DIR=""

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# 输出函数
info() { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --update) UPDATE_MODE=true; shift ;;
        --dir) INSTALL_DIR="$2"; shift 2 ;;
        *) shift ;;
    esac
done

# 设置安装目录
if [ -z "$INSTALL_DIR" ]; then
    INSTALL_DIR="$DEFAULT_INSTALL_DIR"
fi

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    error "请使用 root 权限运行: sudo $0"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   租房管理系统 - Linux 部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 安装依赖函数
install_dependencies() {
    info "安装系统依赖..."
    
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y curl git build-essential
    elif command -v yum &> /dev/null; then
        yum install -y curl git gcc-c++ make
    elif command -v dnf &> /dev/null; then
        dnf install -y curl git gcc-c++ make
    fi
    
    success "系统依赖安装完成"
}

# 安装 Node.js
install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            success "Node.js 已安装: $(node -v)"
            return
        fi
    fi
    
    info "安装 Node.js 20..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - 2>/dev/null || \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null || \
    error "Node.js 安装失败"
    
    if command -v apt-get &> /dev/null; then
        apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        yum install -y nodejs
    fi
    
    success "Node.js 安装完成: $(node -v)"
}

# 安装 pnpm
install_pnpm() {
    if command -v pnpm &> /dev/null; then
        success "pnpm 已安装: $(pnpm -v)"
        return
    fi
    
    info "安装 pnpm..."
    npm install -g pnpm
    success "pnpm 安装完成: $(pnpm -v)"
}

# 主流程
if [ "$UPDATE_MODE" = false ]; then
    info "安装目录: $INSTALL_DIR"
    
    # 安装依赖
    install_dependencies
    install_nodejs
    install_pnpm
    
    # 创建目录
    if [ -d "$INSTALL_DIR" ]; then
        warn "目录已存在: $INSTALL_DIR"
        read -p "是否删除并重新安装? (y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            info "已取消安装"
            exit 0
        fi
        rm -rf "$INSTALL_DIR"
    fi
    
    mkdir -p "$INSTALL_DIR"
    success "创建目录: $INSTALL_DIR"
    
    # 复制项目文件
    info "复制项目文件..."
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    
    # 复制必要文件
    cp -r "$PROJECT_ROOT/apps" "$INSTALL_DIR/"
    cp "$PROJECT_ROOT/package.json" "$INSTALL_DIR/"
    cp "$PROJECT_ROOT/pnpm-workspace.yaml" "$INSTALL_DIR/"
    cp "$PROJECT_ROOT/.env.example" "$INSTALL_DIR/"
    
    # 创建 .env
    if [ ! -f "$INSTALL_DIR/.env" ]; then
        cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
        info "已创建 .env 配置文件"
    fi
    
    # 复制脚本
    mkdir -p "$INSTALL_DIR/scripts/backup"
    cp -r "$PROJECT_ROOT/scripts"/* "$INSTALL_DIR/scripts/" 2>/dev/null || true
    chmod +x "$INSTALL_DIR/scripts"/*.sh 2>/dev/null || true
    chmod +x "$INSTALL_DIR/scripts/backup"/*.sh 2>/dev/null || true
    
    success "项目文件复制完成"
fi

# 进入项目目录
cd "$INSTALL_DIR"
info "工作目录: $INSTALL_DIR"

# 安装依赖
info "安装依赖..."
pnpm install
success "依赖安装完成"

# Prisma
info "生成 Prisma 客户端..."
cd apps/backend
pnpm prisma:generate
success "Prisma 客户端生成完成"

# 数据库迁移
info "执行数据库迁移..."
pnpm prisma:migrate || warn "数据库迁移可能已存在"
success "数据库迁移完成"

# 初始化数据
if [ ! -f "dev.db" ] || [ ! -s "dev.db" ]; then
    info "初始化数据库..."
    pnpm prisma:seed || warn "种子数据可能已存在"
fi

cd "$INSTALL_DIR"

# 构建
info "构建项目..."
pnpm build
success "项目构建完成"

# 安装 PM2
if ! command -v pm2 &> /dev/null; then
    info "安装 PM2..."
    npm install -g pm2
fi

# 停止旧进程
info "重启服务..."
pm2 delete rental-backend 2>/dev/null || true

# 启动服务
cd apps/backend
pm2 start dist/main.js --name rental-backend --time
pm2 save
pm2 startup 2>/dev/null | grep -E "^sudo" | bash 2>/dev/null || true
cd "$INSTALL_DIR"

# 配置防火墙
if command -v firewall-cmd &> /dev/null; then
    info "配置防火墙..."
    firewall-cmd --permanent --add-port=3001/tcp 2>/dev/null || true
    firewall-cmd --permanent --add-port=5173/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}          部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}访问地址：${NC}"
echo "  前端: http://$(hostname -I | awk '{print $1}'):5173"
echo "  后端: http://$(hostname -I | awk '{print $1}'):3001/api"
echo ""
echo -e "${CYAN}默认账号：${NC}"
echo "  用户名: admin"
echo "  密码: admin123"
echo ""
echo -e "${CYAN}常用命令：${NC}"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs rental-backend"
echo "  重启服务: pm2 restart rental-backend"
echo ""
echo -e "${YELLOW}请及时修改 .env 中的 JWT_SECRET 和管理员密码！${NC}"
echo ""