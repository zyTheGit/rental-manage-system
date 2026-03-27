#!/bin/bash

# Linux 数据恢复脚本
# 用法: ./restore.sh <备份文件路径>

set -e

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 检查参数
if [ -z "$1" ]; then
    error "请指定备份文件路径\n用法: $0 <备份文件路径>"
fi

BACKUP_FILE="$1"

# 查找项目目录
find_project_dir() {
    local possible_dirs=(
        "/opt/rental-system"
        "/var/www/rental-system"
        "$HOME/rental-system"
        "$(dirname "$(dirname "$(dirname "$(readlink -f "$0")")")")"
    )
    
    for dir in "${possible_dirs[@]}"; do
        if [ -f "$dir/apps/backend/dev.db" ]; then
            echo "$dir"
            return
        fi
    done
    
    error "找不到项目目录"
}

PROJECT_ROOT=$(find_project_dir)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   租房管理系统 - 数据恢复${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查备份文件
if [ ! -f "$BACKUP_FILE" ]; then
    error "备份文件不存在: $BACKUP_FILE"
fi

info "项目目录: $PROJECT_ROOT"
info "备份文件: $BACKUP_FILE"

# 确认恢复
warn "恢复将覆盖当前数据，是否继续?"
echo -n "输入 YES 确认恢复: "
read -r confirm
if [ "$confirm" != "YES" ]; then
    info "已取消恢复"
    exit 0
fi

# 停止服务
info "停止服务..."
pm2 stop rental-backend 2>/dev/null || true
success "服务已停止"

# 创建临时目录
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# 解压备份
info "解压备份文件..."
unzip -q "$BACKUP_FILE" -d "$TEMP_DIR"
success "解压完成"

# 恢复数据库
info "恢复数据库..."
if [ -f "$TEMP_DIR/dev.db" ]; then
    # 备份当前数据库
    CURRENT_DB="$PROJECT_ROOT/apps/backend/dev.db"
    if [ -f "$CURRENT_DB" ]; then
        cp "$CURRENT_DB" "$CURRENT_DB.before-restore"
        info "当前数据库已备份到: $CURRENT_DB.before-restore"
    fi
    
    cp "$TEMP_DIR/dev.db" "$CURRENT_DB"
    success "数据库恢复完成"
else
    error "备份中未找到数据库文件"
fi

# 恢复配置文件
if [ -f "$TEMP_DIR/.env" ]; then
    cp "$TEMP_DIR/.env" "$PROJECT_ROOT/.env"
    success "配置文件恢复完成"
fi

# 恢复上传文件
if [ -d "$TEMP_DIR/uploads" ]; then
    rm -rf "$PROJECT_ROOT/apps/backend/uploads"
    cp -r "$TEMP_DIR/uploads" "$PROJECT_ROOT/apps/backend/"
    success "上传文件恢复完成"
fi

# 重启服务
info "重启服务..."
pm2 start rental-backend 2>/dev/null || true
success "服务已重启"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}          恢复完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""