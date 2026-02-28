# 租房管理系统 - 本地部署文档

> 本教程详细说明如何在本地服务器部署租房管理系统，不使用 Docker。

## 目录

- [环境要求](#环境要求)
- [安装步骤](#安装步骤)
- [初始化数据库](#初始化数据库)
- [启动服务](#启动服务)
- [数据库备份](#数据库备份)
- [数据库恢复](#数据库恢复)
- [生产环境部署](#生产环境部署)
- [常见问题](#常见问题)

---

## 环境要求

### 必需软件

| 软件 | 版本要求 | 下载链接 |
|------|----------|----------|
| Node.js | >= 18.0.0 | https://nodejs.org/ |
| pnpm | >= 8.0.0 | https://pnpm.io/ |
| Git | 最新版 | https://git-scm.com/ |

### 验证安装

```bash
# 检查 Node.js 版本
node -v
# 应输出：v18.x.x 或更高

# 检查 pnpm 版本
pnpm -v
# 应输出：8.x.x 或更高

# 检查 Git
git --version
```

---

## 安装步骤

### 1. 克隆项目

```bash
# 克隆项目代码
git clone <项目地址> rental-manage-system
cd rental-manage-system
```

### 2. 安装依赖

```bash
# 使用 pnpm 安装所有依赖
pnpm install
```

### 3. 配置环境变量

#### 后端配置

编辑 `apps/backend/.env` 文件：

```bash
# 数据库配置（SQLite 文件路径）
DATABASE_URL="file:./dev.db"

# 后端服务配置
BACKEND_PORT=3001
BACKEND_HOST=0.0.0.0

# JWT 配置（生产环境请修改为随机字符串）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# 前端 API 地址
VITE_API_BASE_URL=http://localhost:3001/api

# 管理员账号（首次初始化使用）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=管理员
```

> **安全提示**：生产环境务必修改 `JWT_SECRET`，可使用以下命令生成随机字符串：
> ```bash
> # Linux/Mac
> openssl rand -base64 32
> 
> # Windows PowerShell
> [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))
> ```

---

## 初始化数据库

### 1. 生成 Prisma 客户端

```bash
cd apps/backend
pnpm prisma:generate
```

### 2. 执行数据库迁移

```bash
pnpm prisma:migrate
```

此命令会：
- 创建 SQLite 数据库文件（`apps/backend/dev.db`）
- 执行所有迁移文件
- 创建数据库表结构

### 3. 初始化种子数据

```bash
pnpm prisma:seed
```

此命令会创建：
- 管理员账号（admin/admin123）
- 10 套测试房屋
- 10 个测试租户
- 10 条测试缴费记录

### 一键初始化（可选）

创建初始化脚本 `apps/backend/init-db.sh`（Linux/Mac）或 `init-db.bat`（Windows）：

**Windows (init-db.bat):**
```batch
@echo off
echo 正在初始化数据库...
call pnpm prisma:generate
call pnpm prisma:migrate
call pnpm prisma:seed
echo 数据库初始化完成!
```

**Linux/Mac (init-db.sh):**
```bash
#!/bin/bash
echo "正在初始化数据库..."
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
echo "数据库初始化完成!"
```

---

## 启动服务

### 开发模式（推荐开发时使用）

```bash
# 在项目根目录执行

# 方式 1：同时启动前后端
pnpm dev

# 方式 2：分别启动
pnpm dev:f    # 只启动前端（Vite 开发服务器）
pnpm dev:b    # 只启动后端（NestJS 开发服务器）
```

**访问地址：**
- 前端：http://localhost:5173
- 后端 API：http://localhost:3001/api
- Swagger 文档：http://localhost:3001/api/docs

### 生产模式

#### 1. 构建项目

```bash
# 构建前端和后端
pnpm build

# 或分别构建
pnpm build:frontend
pnpm build:backend
```

#### 2. 启动后端服务

```bash
cd apps/backend

# 方式 1：使用 PM2（推荐）
pm2 start dist/main.js --name rental-backend

# 方式 2：直接启动
node dist/main.js

# 方式 3：后台运行（Linux）
nohup node dist/main.js > output.log 2>&1 &
```

#### 3. 配置前端静态文件服务

前端构建后的文件在 `apps/frontend/dist` 目录，需要配置 Web 服务器：

**Nginx 配置示例 1：根路径部署**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/rental-manage-system/apps/frontend/dist;
    index index.html;

    # 前端路由处理（SPA 必需）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 反向代理 API 请求
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Nginx 配置示例 2：子路径部署（如 /rental）**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 子路径部署前端
    location /rental {
        alias /path/to/rental-manage-system/apps/frontend/dist;
        index index.html;
        
        # SPA 路由处理
        try_files $uri $uri/ /rental/index.html;
        
        # 静态资源缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 反向代理 API 请求（后端接口已带 /api 前缀）
    location /rental/api {
        # 将 /rental/api/xxx 转发到后端的 /api/xxx
        rewrite ^/rental/api/(.*) /api/$1 break;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**子路径部署前端配置：**

如果部署在子路径（如 `/rental`），需要修改前端构建配置：

编辑 `apps/frontend/vite.config.ts`：

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/rental/',  // 修改为子路径
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
```

同时修改 `apps/backend/.env` 中的前端 API 地址（用于 Swagger 等）：

```bash
# 子路径部署时使用相对路径
VITE_API_BASE_URL=/rental/api
```

---

## 数据库备份

### SQLite 数据库位置

```
apps/backend/dev.db
```

### 备份方法

#### 方法 1：直接复制文件（推荐）

```bash
# 备份到当前目录
cp apps/backend/dev.db apps/backend/dev.db.backup

# 备份到带时间戳的文件
cp apps/backend/dev.db apps/backend/dev.db.$(date +%Y%m%d_%H%M%S)

# Windows PowerShell
Copy-Item apps\backend\dev.db "apps\backend\dev.db.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
```

#### 方法 2：使用 SQLite 命令

```bash
# 进入数据库目录
cd apps/backend

# 使用 SQLite 备份
sqlite3 dev.db ".backup 'dev.db.backup'"
```

#### 方法 3：创建自动备份脚本

**Windows (backup.bat):**
```batch
@echo off
set BACKUP_DIR=apps\backend\backups
set DB_FILE=apps\backend\dev.db
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%

if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%
copy %DB_FILE% %BACKUP_DIR%\dev.db.%TIMESTAMP%.bak
echo 备份完成：%BACKUP_DIR%\dev.db.%TIMESTAMP%.bak
```

**Linux/Mac (backup.sh):**
```bash
#!/bin/bash
BACKUP_DIR="apps/backend/backups"
DB_FILE="apps/backend/dev.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_FILE $BACKUP_DIR/dev.db.$TIMESTAMP.bak
echo "备份完成：$BACKUP_DIR/dev.db.$TIMESTAMP.bak"

# 保留最近 30 天的备份
find $BACKUP_DIR -name "dev.db.*.bak" -mtime +30 -delete
```

#### 设置定时备份（Linux）

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh
```

---

## 数据库恢复

### 方法 1：直接替换文件

```bash
# 停止后端服务
pm2 stop rental-backend
# 或找到进程 kill 掉

# 恢复数据库
cp apps/backend/dev.db.backup apps/backend/dev.db

# 重启后端服务
pm2 restart rental-backend
```

### 方法 2：使用 SQLite 命令

```bash
cd apps/backend

# 从备份恢复
sqlite3 dev.db ".restore dev.db.backup"
```

---

## 生产环境部署

### 1. 系统优化

#### Linux 系统配置

```bash
# 增加文件打开数限制
ulimit -n 65535

# 永久生效（添加到 /etc/security/limits.conf）
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf
```

### 2. 使用 PM2 管理 Node.js 进程

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
cd apps/backend
pm2 start dist/main.js --name rental-backend --instances 1 --autorestart

# 设置开机自启
pm2 startup
pm2 save

# 常用命令
pm2 list           # 查看进程状态
pm2 logs           # 查看日志
pm2 restart        # 重启
pm2 stop           # 停止
pm2 delete         # 删除进程
```

### 3. 配置 HTTPS（可选）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 4. 监控和日志

#### 查看应用日志

```bash
# PM2 日志
pm2 logs rental-backend

# 查看后端日志文件
tail -f apps/backend/output.log
```

#### 设置日志轮转（PM2）

在 `ecosystem.config.js` 中配置：

```javascript
module.exports = {
  apps: [{
    name: 'rental-backend',
    script: './dist/main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_rotate: true
  }]
}
```

---

## 常见问题

### 1. 端口被占用

**错误信息：** `EADDRINUSE: address already in use`

**解决方案：**
```bash
# 查看占用端口的进程
lsof -i :3001  # Linux/Mac
netstat -ano | findstr :3001  # Windows

# 杀死进程
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows

# 或修改端口（编辑 apps/backend/.env）
BACKEND_PORT=3002
```

### 2. Prisma 客户端错误

**错误信息：** `@prisma/client did not initialize yet`

**解决方案：**
```bash
cd apps/backend
rm -rf node_modules/.prisma
pnpm prisma:generate
```

### 3. 权限问题（Linux）

**错误信息：** `EACCES: permission denied`

**解决方案：**
```bash
# 修改目录权限
chmod -R 755 apps/backend
chown -R $USER:$USER apps/backend
```

### 4. 数据库锁定

**错误信息：** `database is locked`

**解决方案：**
1. 停止所有访问数据库的进程
2. 删除数据库锁文件：
   ```bash
   rm apps/backend/dev.db-journal
   rm apps/backend/dev.db-shm
   rm apps/backend/dev.db-wal
   ```

### 5. 前端构建失败

**错误信息：** `vite build failed`

**解决方案：**
```bash
# 清理依赖重新安装
rm -rf node_modules apps/frontend/node_modules
pnpm install

# 检查 Node.js 版本
node -v  # 确保 >= 18.0.0

# 清除缓存
pnpm store prune
```

### 6. 后端启动失败

**检查步骤：**
```bash
# 1. 检查 .env 文件是否存在
ls apps/backend/.env

# 2. 检查数据库文件
ls apps/backend/dev.db

# 3. 重新生成 Prisma 客户端
cd apps/backend
pnpm prisma:generate

# 4. 查看详细错误日志
pnpm start:debug
```

---

## 附录：目录结构

```
rental-manage-system/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # 数据库模型定义
│   │   │   ├── migrations/       # 数据库迁移文件
│   │   │   └── seed.ts          # 种子数据脚本
│   │   ├── src/                  # 源代码
│   │   ├── dist/                 # 构建输出目录
│   │   ├── .env                  # 环境变量配置
│   │   └── dev.db                # SQLite 数据库文件
│   │
│   └── frontend/
│       ├── src/                  # 源代码
│       ├── dist/                 # 构建输出目录
│       ├── public/               # 静态资源
│       └── index.html            # 入口 HTML
│
├── package.json                  # 根项目配置
├── pnpm-workspace.yaml           # pnpm 工作区配置
├── DEPLOY.md                     # 本部署文档
└── README.md                     # 项目说明
```

---

## 快速命令参考

```bash
# 开发
pnpm dev              # 启动前后端
pnpm dev:f            # 只启动前端
pnpm dev:b            # 只启动后端

# 构建
pnpm build            # 构建全部
pnpm build:frontend   # 只构建前端
pnpm build:backend    # 只构建后端

# 数据库
pnpm prisma:generate  # 生成 Prisma 客户端
pnpm prisma:migrate   # 执行数据库迁移
pnpm prisma:seed      # 执行种子数据
prisma studio         # 打开数据库管理工具

# Docker（如使用）
pnpm docker:up        # 启动 Docker 容器
pnpm docker:down      # 停止 Docker 容器
```

---

## 技术支持

如遇到问题，请检查：
1. [README.md](./README.md) - 项目说明
2. [Prisma 文档](https://www.prisma.io/docs)
3. [NestJS 文档](https://docs.nestjs.com)
4. [Vue 3 文档](https://vuejs.org)
