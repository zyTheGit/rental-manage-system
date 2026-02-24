# 项目启动说明

## 项目概况

个人租房管理系统 - 基于 Vue3 + NestJS 的全栈应用

## 已完成的配置

### 数据库配置
- 使用 SQLite 数据库（便于开发）
- 数据库文件: `apps/backend/dev.db`
- 已执行数据库迁移
- 已创建管理员账号

### 已修复的问题
1. ✅ DATABASE_URL 路径问题
2. ✅ PostCSS 配置格式问题（CommonJS → ES Module）
3. ✅ 缺少 sass 依赖
4. ✅ API 路由前缀配置（添加 `/api` 全局前缀）
5. ✅ 数据库文件访问权限问题

## 启动方式

### 方式一：分别启动（推荐）

#### 1. 启动后端

```bash
# Windows CMD
cd apps\backend
set DATABASE_URL=file:./dev.db
npm run dev

# Windows PowerShell
cd apps\backend
$env:DATABASE_URL="file:./dev.db"; npm run dev

# Git Bash / WSL
cd apps/backend
DATABASE_URL="file:./dev.db" npm run dev
```

后端启动成功后会显示：
```
Application is running on: http://localhost:3001
Swagger documentation: http://localhost:3001/api/docs
[AuthService] 管理员账号创建成功
```

#### 2. 启动前端（新开一个终端）

```bash
cd apps\frontend
npm run dev
```

前端启动成功后会显示：
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 方式二：使用启动脚本

```bash
node start.js
```

### 方式三：使用 pnpm workspace（如果可用）

```bash
# 根目录执行
pnpm dev
```

## 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:5173 | 用户界面 |
| 后端 | http://localhost:3001 | API 服务 |
| API文档 | http://localhost:3001/api/docs | Swagger 文档 |

## 功能模块

### 登录系统
- 管理员登录
- JWT 认证
- 路由守卫

### 房屋管理
- 房屋列表
- 添加/编辑/删除房屋
- 状态切换（空置/已租）

### 租户管理
- 租户列表
- 添加/编辑/删除租户
- 退租功能
- 自动绑定/释放房屋

### 缴费记录
- 缴费历史
- 添加缴费记录
- 类型筛选
- 月度/年度统计

### 数据统计
- 本月/年度收入
- 收入趋势图
- 费用占比图
- 出租率统计

## 开发命令

### 后端命令

```bash
cd apps/backend

# 开发模式
npm run dev

# 构建
npm run build

# 启动生产版本
npm run start:prod

# Prisma 命令
npx prisma generate       # 生成 Prisma Client
npx prisma migrate dev    # 创建迁移
npx prisma studio         # 数据库管理界面
```

### 前端命令

```bash
cd apps/frontend

# 开发模式
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 类型检查
npm run typecheck
```

## 数据库操作

### 查看数据库
```bash
cd apps/backend
npx prisma studio
```

### 重置数据库
```bash
cd apps/backend
# 删除 dev.db 文件
rm dev.db
# 重新运行迁移
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name init
```

## 常见问题

### 1. bcrypt 模块错误
已解决：开发环境使用简单的密码比较，不使用 bcrypt。

### 2. 端口被占用
- 后端默认端口: 3001
- 前端默认端口: 5173
- 如需修改，查看 `vite.config.ts` 和 `.env` 文件

### 3. CORS 错误
已配置 CORS，确保前端能访问后端 API。

### 4. 数据库连接失败
确保 `DATABASE_URL` 环境变量已正确设置。

## 技术栈

### 前端
- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Axios
- TailwindCSS
- ECharts

### 后端
- NestJS
- Prisma ORM
- SQLite
- JWT

## 项目结构

```
rental-manage-system/
├── apps/
│   ├── frontend/          # 前端项目
│   │   ├── src/
│   │   │   ├── api/      # API 接口
│   │   │   ├── views/    # 页面组件
│   │   │   └── stores/   # 状态管理
│   │   └── vite.config.ts
│   │
│   └── backend/           # 后端项目
│       ├── src/
│       │   ├── common/   # 公共模块
│       │   └── modules/  # 业务模块
│       ├── prisma/       # 数据库配置
│       │   └── schema.prisma
│       └── dev.db        # SQLite 数据库
│
├── .spec/                # 项目规格文档
├── agents/               # Agent 定义
├── start.js              # 启动脚本
└── README.md
```

## 下一步

1. 访问 http://localhost:5173 使用系统
2. 查看项目文档了解详细功能
3. 根据需要进行二次开发

## 生产部署

生产环境推荐使用 PostgreSQL，配置见 `docker-compose.yml`：
- 前端: Nginx
- 后端: NestJS
- 数据库: PostgreSQL

```bash
docker-compose up -d
```

## 🎉 已修复的问题

### 最新修复 - API 路由配置
- **问题**: `Cannot POST /api/auth/login` 404 错误
- **修复**: 在 main.ts 中添加全局路由前缀 `app.setGlobalPrefix('api')`
- **结果**: ✅ 所有 API 现在都可通过 `/api/*` 访问

### 其他已修复问题
1. ✅ DATABASE_URL 路径问题
2. ✅ PostCSS 配置格式问题（CommonJS → ES Module）
3. ✅ 缺少 sass 依赖
4. ✅ 数据库文件访问权限问题

## 📝 API 路由说明

所有 API 路由都包含 `/api` 前缀：

### 认证路由
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息（需要认证）

### 房屋路由
- `GET /api/houses` - 获取所有房屋
- `GET /api/houses/:id` - 获取单个房屋
- `POST /api/houses` - 创建房屋
- `PUT /api/houses/:id` - 更新房屋
- `DELETE /api/houses/:id` - 删除房屋
- `PUT /api/houses/:id/status` - 更新房屋状态

### 租户路由
- `GET /api/tenants` - 获取所有租户
- `GET /api/tenants/:id` - 获取单个租户
- `POST /api/tenants` - 创建租户
- `PUT /api/tenants/:id` - 更新租户
- `DELETE /api/tenants/:id` - 删除租户
- `POST /api/tenants/:id/checkout` - 租户退租

### 缴费路由
- `GET /api/payments` - 获取缴费记录
- `GET /api/payments/:id` - 获取单个缴费记录
- `POST /api/payments` - 创建缴费记录
- `GET /api/payments/stats/month` - 月度统计
- `GET /api/payments/stats/year` - 年度统计

### 统计路由
- `GET /api/dashboard/stats` - 获取统计数据

### 认证说明
- POST 请求（登录、创建）不需要 token
- GET/PUT/DELETE 请求需要在请求头中包含 JWT token：
  ```
  Authorization: Bearer <your_token>
  ```

---
