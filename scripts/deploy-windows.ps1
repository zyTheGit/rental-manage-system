# Windows 一键部署脚本
# 用法: .\deploy-windows.ps1 [-Update] [-InstallDir "路径"]

param(
    [switch]$Update,
    [string]$InstallDir = ""
)

$ErrorActionPreference = "Stop"
$ProjectName = "rental-manage-system"
$DefaultInstallDir = "C:\rental-system"

# 颜色输出函数
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

# 检查管理员权限
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 检查软件是否安装
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 主流程
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   租房管理系统 - Windows 部署脚本" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 确定安装目录
if ($InstallDir -eq "") {
    $InstallDir = $DefaultInstallDir
}

if (-not $Update) {
    Write-Info "安装目录: $InstallDir"
    
    # 检查 Node.js
    Write-Info "检查 Node.js..."
    if (-not (Test-Command "node")) {
        Write-Error "未安装 Node.js，请先安装 Node.js 18+"
        Write-Info "下载地址: https://nodejs.org/"
        exit 1
    }
    $nodeVersion = node -v
    Write-Success "Node.js 版本: $nodeVersion"
    
    # 检查 pnpm
    Write-Info "检查 pnpm..."
    if (-not (Test-Command "pnpm")) {
        Write-Warning "未安装 pnpm，正在安装..."
        npm install -g pnpm
        if ($LASTEXITCODE -ne 0) {
            Write-Error "pnpm 安装失败"
            exit 1
        }
    }
    $pnpmVersion = pnpm -v
    Write-Success "pnpm 版本: $pnpmVersion"
    
    # 创建安装目录
    if (Test-Path $InstallDir) {
        Write-Warning "目录已存在: $InstallDir"
        $confirm = Read-Host "是否删除并重新安装? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Info "已取消安装"
            exit 0
        }
        Remove-Item -Recurse -Force $InstallDir
    }
    
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Success "创建目录: $InstallDir"
    
    # 复制项目文件
    Write-Info "复制项目文件..."
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptDir
    
    # 复制必要文件
    $itemsToCopy = @("apps", "package.json", "pnpm-workspace.yaml", ".env.example")
    foreach ($item in $itemsToCopy) {
        $src = Join-Path $projectRoot $item
        $dst = Join-Path $InstallDir $item
        if (Test-Path $src) {
            Copy-Item -Path $src -Destination $dst -Recurse -Force
        }
    }
    
    # 创建 .env 文件
    $envFile = Join-Path $InstallDir ".env"
    if (-not (Test-Path $envFile)) {
        Copy-Item -Path (Join-Path $InstallDir ".env.example") -Destination $envFile
        Write-Info "已创建 .env 配置文件"
    }
    
    # 复制脚本目录
    $scriptsDst = Join-Path $InstallDir "scripts"
    if (-not (Test-Path $scriptsDst)) {
        Copy-Item -Path (Join-Path $projectRoot "scripts") -Destination $scriptsDst -Recurse -Force
    }
    
    Write-Success "项目文件复制完成"
}

# 进入项目目录
Set-Location $InstallDir
Write-Info "工作目录: $InstallDir"

# 安装依赖
Write-Info "安装依赖..."
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "依赖安装失败"
    exit 1
}
Write-Success "依赖安装完成"

# 生成 Prisma 客户端
Write-Info "生成 Prisma 客户端..."
Set-Location "apps\backend"
pnpm prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Error "Prisma 客户端生成失败"
    exit 1
}
Write-Success "Prisma 客户端生成完成"

# 数据库迁移
Write-Info "执行数据库迁移..."
pnpm prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Warning "数据库迁移可能已存在，继续..."
}
Write-Success "数据库迁移完成"

# 检查是否需要初始化数据
$dbFile = "dev.db"
if (-not (Test-Path $dbFile) -or (Get-Item $dbFile).Length -eq 0) {
    Write-Info "初始化数据库..."
    pnpm prisma:seed
    Write-Success "数据库初始化完成"
}

Set-Location $InstallDir

# 构建项目
Write-Info "构建项目..."
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Error "项目构建失败"
    exit 1
}
Write-Success "项目构建完成"

# 安装 PM2（如果没有）
if (-not (Test-Command "pm2")) {
    Write-Info "安装 PM2..."
    npm install -g pm2-windows-startup
    npm install -g pm2
    pm2-startup install
    Write-Success "PM2 安装完成"
}

# 停止旧进程（如果存在）
Write-Info "停止旧进程..."
pm2 delete rental-backend 2>$null

# 启动服务
Write-Info "启动服务..."
Set-Location "apps\backend"
pm2 start dist/main.js --name rental-backend --time
pm2 save
Set-Location $InstallDir

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "          部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址：" -ForegroundColor Cyan
Write-Host "  前端: http://localhost:5173" -ForegroundColor White
Write-Host "  后端: http://localhost:3001/api" -ForegroundColor White
Write-Host "  文档: http://localhost:3001/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "默认账号：" -ForegroundColor Cyan
Write-Host "  用户名: admin" -ForegroundColor White
Write-Host "  密码: admin123" -ForegroundColor White
Write-Host ""
Write-Host "常用命令：" -ForegroundColor Cyan
Write-Host "  查看状态: pm2 status" -ForegroundColor White
Write-Host "  查看日志: pm2 logs rental-backend" -ForegroundColor White
Write-Host "  重启服务: pm2 restart rental-backend" -ForegroundColor White
Write-Host "  停止服务: pm2 stop rental-backend" -ForegroundColor White
Write-Host ""
Write-Warning "请及时修改 .env 中的 JWT_SECRET 和管理员密码！"
Write-Host ""