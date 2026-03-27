# Windows 数据备份脚本
# 用法: .\backup.ps1 [-BackupDir "路径"]

param(
    [string]$BackupDir = "C:\backup\rental-system"
)

$ErrorActionPreference = "Stop"

# 配置
$RetentionDays = 30
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "backup-$Timestamp"

# 颜色
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

# 获取脚本目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)

# 如果默认目录不存在，使用项目目录
if (-not (Test-Path "$ProjectRoot\apps\backend\dev.db")) {
    # 尝试查找已安装的目录
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
Write-Host "   租房管理系统 - 数据备份" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Info "项目目录: $ProjectRoot"
Write-Info "备份目录: $BackupDir"

# 创建备份目录
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Success "创建备份目录"
}

# 创建临时备份目录
$TempDir = Join-Path $env:TEMP $BackupName
if (Test-Path $TempDir) {
    Remove-Item -Recurse -Force $TempDir
}
New-Item -ItemType Directory -Path $TempDir | Out-Null

# 备份数据库
Write-Info "备份数据库..."
$DbFile = "$ProjectRoot\apps\backend\dev.db"
if (Test-Path $DbFile) {
    Copy-Item $DbFile "$TempDir\dev.db"
    Write-Success "数据库备份完成"
} else {
    Write-Error "数据库文件不存在: $DbFile"
    exit 1
}

# 备份配置文件
Write-Info "备份配置文件..."
$EnvFile = "$ProjectRoot\.env"
if (Test-Path $EnvFile) {
    Copy-Item $EnvFile "$TempDir\.env"
    Write-Success "配置文件备份完成"
}

# 备份上传文件（如果有）
$UploadDir = "$ProjectRoot\apps\backend\uploads"
if (Test-Path $UploadDir) {
    Copy-Item -Recurse $UploadDir "$TempDir\uploads"
    Write-Success "上传文件备份完成"
}

# 创建压缩包
Write-Info "创建压缩包..."
$ZipFile = "$BackupDir\$BackupName.zip"
Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipFile -Force
Write-Success "压缩包创建完成: $ZipFile"

# 清理临时文件
Remove-Item -Recurse -Force $TempDir

# 清理旧备份
Write-Info "清理超过 $RetentionDays 天的旧备份..."
$CutoffDate = (Get-Date).AddDays(-$RetentionDays)
$OldBackups = Get-ChildItem $BackupDir -Filter "backup-*.zip" | Where-Object { $_.LastWriteTime -lt $CutoffDate }
$OldCount = ($OldBackups | Measure-Object).Count

if ($OldCount -gt 0) {
    $OldBackups | Remove-Item -Force
    Write-Success "删除 $OldCount 个旧备份"
} else {
    Write-Info "没有需要清理的旧备份"
}

# 显示备份信息
$BackupSize = (Get-Item $ZipFile).Length / 1MB
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "          备份完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "备份文件: $ZipFile"
Write-Host "文件大小: $([math]::Round($BackupSize, 2)) MB"
Write-Host ""

# 列出所有备份
$AllBackups = Get-ChildItem $BackupDir -Filter "backup-*.zip" | Sort-Object LastWriteTime -Descending
Write-Host "现有备份列表：" -ForegroundColor Cyan
$AllBackups | ForEach-Object {
    $Size = [math]::Round($_.Length / 1MB, 2)
    Write-Host "  $($_.Name) - $Size MB - $($_.LastWriteTime.ToString('yyyy-MM-dd HH:mm'))"
}
Write-Host ""