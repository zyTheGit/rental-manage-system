#!/bin/bash

# Linux 数据备份脚本
# 用法: ./backup.sh [备份目录]

set -e

# 配置
BACKUP_DIR="${1:-/var/backup/rental-system}"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup-$TIMESTAMP"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

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
echo -e "${GREEN}   租房管理系统 - 数据备份${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

info "项目目录: $PROJECT_ROOT"
info "备份目录: $BACKUP_DIR"

# 创建备份目录
mkdir -p "$BACKUP_DIR"
success "备份目录准备完成"

# 创建临时目录
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# 备份数据库
info "备份数据库..."
DB_FILE="$PROJECT_ROOT/apps/backend/dev.db"
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$TEMP_DIR/dev.db"
    success "数据库备份完成"
else
    error "数据库文件不存在: $DB_FILE"
fi

# 备份配置文件
info "备份配置文件..."
if [ -f "$PROJECT_ROOT/.env" ]; then
    cp "$PROJECT_ROOT/.env" "$TEMP_DIR/.env"
    success "配置文件备份完成"
fi

# 备份上传文件
UPLOAD_DIR="$PROJECT_ROOT/apps/backend/uploads"
if [ -d "$UPLOAD_DIR" ]; then
    cp -r "$UPLOAD_DIR" "$TEMP_DIR/"
    success "上传文件备份完成"
fi

# 创建压缩包
info "创建压缩包..."
ZIP_FILE="$BACKUP_DIR/$BACKUP_NAME.zip"
cd "$TEMP_DIR"
zip -r "$ZIP_FILE" . -q
success "压缩包创建完成: $ZIP_FILE"

# 清理旧备份
info "清理超过 $RETENTION_DAYS 天的旧备份..."
find "$BACKUP_DIR" -name "backup-*.zip" -mtime +$RETENTION_DAYS -delete
OLD_COUNT=$(find "$BACKUP_DIR" -name "backup-*.zip" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
if [ "$OLD_COUNT" -gt 0 ]; then
    success "删除 $OLD_COUNT 个旧备份"
else
    info "没有需要清理的旧备份"
fi

# 显示备份信息
BACKUP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}          备份完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "备份文件: $ZIP_FILE"
echo "文件大小: $BACKUP_SIZE"
echo ""

# 列出所有备份
echo -e "${CYAN}现有备份列表：${NC}"
ls -lht "$BACKUP_DIR"/backup-*.zip 2>/dev/null | while read -r line; do
    echo "  $line"
done || echo "  暂无备份"
echo ""