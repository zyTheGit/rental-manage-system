# Windows 数据恢复脚本
# 用法: .\restore.ps1 -BackupFile "备份文件路径"

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

# 颜色
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

# 获取项目目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)

# 查找已安装目录
if (-not (Test-Path "$ProjectRoot\apps\backend\dev.db")) {
    $PossibleDirs = @("C:\rental-system", "D:\rental-system", "$env:USERPROFILE\rental-system")
    foreach ($dir in $PossibleDirs) {
        if (Test-Path "$dir\apps\backend\dev.db") {
            $ProjectRoot = $dir
            break
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   租房管理系统 - 数据恢复" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 检查备份文件
if (-not (Test-Path $BackupFile)) {
    Write-Error "备份文件不存在: $BackupFile"
    exit 1
}

Write-Info "项目目录: $ProjectRoot"
Write-Info "备份文件: $BackupFile"

# 确认恢复
Write-Warning "恢复将覆盖当前数据，是否继续?"
$confirm = Read-Host "输入 YES 确认恢复"
if ($confirm -ne "YES") {
    Write-Info "已取消恢复"
    exit 0
}

# 停止服务
Write-Info "停止服务..."
pm2 stop rental-backend 2>$null
Write-Success "服务已停止"

# 创建临时目录
$TempDir = Join-Path $env:TEMP "restore-$([Guid]::NewGuid())"
New-Item -ItemType Directory -Path $TempDir | Out-Null

# 解压备份
Write-Info "解压备份文件..."
Expand-Archive -Path $BackupFile -DestinationPath $TempDir -Force
Write-Success "解压完成"

# 恢复数据库
Write-Info "恢复数据库..."
$BackupDb = "$TempDir\dev.db"
if (Test-Path $BackupDb) {
    # 备份当前数据库
    $CurrentDb = "$ProjectRoot\apps\backend\dev.db"
    if (Test-Path $CurrentDb) {
        $CurrentDbBackup = "$CurrentDb.before-restore"
        Copy-Item $CurrentDb $CurrentDbBackup
        Write-Info "当前数据库已备份到: $CurrentDbBackup"
    }
    
    Copy-Item $BackupDb "$ProjectRoot\apps\backend\dev.db" -Force
    Write-Success "数据库恢复完成"
} else {
    Write-Error "备份中未找到数据库文件"
}

# 恢复配置文件
$BackupEnv = "$TempDir\.env"
if (Test-Path $BackupEnv) {
    Copy-Item $BackupEnv "$ProjectRoot\.env" -Force
    Write-Success "配置文件恢复完成"
}

# 恢复上传文件
$BackupUploads = "$TempDir\uploads"
if (Test-Path $BackupUploads) {
    $TargetUploads = "$ProjectRoot\apps\backend\uploads"
    if (Test-Path $TargetUploads) {
        Remove-Item -Recurse -Force $TargetUploads
    }
    Copy-Item -Recurse $BackupUploads $TargetUploads
    Write-Success "上传文件恢复完成"
}

# 清理临时文件
Remove-Item -Recurse -Force $TempDir

# 重启服务
Write-Info "重启服务..."
pm2 start rental-backend 2>$null
Write-Success "服务已重启"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "          恢复完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""