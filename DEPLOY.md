# 租房管理系统 - 部署文档

## 快速部署

### Windows 一键部署

以管理员身份运行 PowerShell：

```powershell
# 首次部署
.\scripts\deploy-windows.ps1

# 更新部署
.\scripts\deploy-windows.ps1 -Update

# 指定安装目录
.\scripts\deploy-windows.ps1 -InstallDir "D:\rental-system"
```

### Linux 一键部署

```bash
# 赋予执行权限
chmod +x scripts/deploy-linux.sh

# 首次部署
sudo ./scripts/deploy-linux.sh

# 更新部署
sudo ./scripts/deploy-linux.sh --update

# 指定安装目录
sudo ./scripts/deploy-linux.sh --dir /opt/rental-system
```

---

## 环境要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18.0.0 | JavaScript 运行时 |
| pnpm | >= 8.0.0 | 包管理器 |
| SQLite | >= 3.0 | 数据库 |

---

## 手动部署

### 1. 安装依赖

```bash
npm install -g pnpm
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，修改必要配置
```

**重要配置项：**
```env
DATABASE_URL="file:./dev.db"
BACKEND_PORT=3001
JWT_SECRET=your-production-secret-key
ADMIN_PASSWORD=your-secure-password
```

### 3. 初始化数据库

```bash
pnpm prisma:generate
pnpm prisma:migrate
cd apps/backend && pnpm prisma:seed
```

### 4. 构建项目

```bash
pnpm build
```

### 5. 启动服务

```bash
# 生产环境（推荐 PM2）
npm install -g pm2
cd apps/backend
pm2 start dist/main.js --name rental-backend
pm2 startup
pm2 save
```

---

## 数据备份

### 手动备份

**Windows:**
```powershell
.\scripts\backup\backup.ps1
```

**Linux:**
```bash
./scripts/backup/backup.sh
```

### 定时自动备份

**Windows 任务计划程序：**
1. 打开"任务计划程序"
2. 创建基本任务 → 每天凌晨 2 点执行
3. 操作：`powershell.exe -File "完整路径\scripts\backup\backup.ps1"`

**Linux Cron:**
```bash
crontab -e
# 添加：每天凌晨 2 点执行
0 2 * * * /path/to/scripts/backup/backup.sh >> /var/log/rental-backup.log 2>&1
```

### API 备份

```bash
curl -X POST http://localhost:3001/api/system/backup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o backup.zip
```

### 数据恢复

**Windows:**
```powershell
.\scripts\backup\restore.ps1 -BackupFile "C:\backup\rental\backup-20240101.zip"
```

**Linux:**
```bash
./scripts/backup/restore.sh /var/backup/rental/backup-20240101.zip
```

---

## Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/apps/frontend/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 常见问题

### 端口被占用

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux
lsof -i :3001
kill -9 <PID>
```

### 数据库迁移失败

```bash
cd apps/backend
rm -f dev.db
pnpm prisma:migrate
pnpm prisma:seed
```

### 依赖安装失败

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm store prune
pnpm install
```

---

## 命令参考

```bash
# 开发
pnpm dev              # 启动前后端
pnpm dev:f            # 只启动前端
pnpm dev:b            # 只启动后端

# 构建
pnpm build            # 构建全部

# 数据库
pnpm prisma:generate  # 生成 Prisma 客户端
pnpm prisma:migrate   # 数据库迁移
prisma studio         # 数据库管理界面

# PM2
pm2 status            # 查看状态
pm2 logs              # 查看日志
pm2 restart all       # 重启所有
pm2 monit             # 监控面板
```