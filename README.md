# 个人租房管理系统

一个轻量级的个人房东租房管理系统，支持 PC + 移动端自适应。

## 项目特点

- 简洁易用，专为个人房东设计
- 前后端分离架构
- 移动端优先的响应式设计
- 完整的 CRUD 操作
- 数据统计可视化
- Docker 一键部署

## 技术栈

**前端**
- Vue 3 + TypeScript + Vite
- TailwindCSS + ECharts
- Vue Router + Pinia

**后端**
- NestJS + Prisma ORM
- PostgreSQL
- JWT 认证
- Swagger 文档

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 14

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，修改数据库连接等配置
```

### 启动开发服务

```bash
# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:frontend
pnpm dev:backend
```

### 数据库迁移

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

### Docker 部署

```bash
cp .env.example .env
pnpm docker:up
```

## 功能模块

- 房屋管理
- 租户管理
- 缴费记录
- 数据统计
- 权限管理

## 目录结构

```
rental-manage-system/
├── apps/
│   ├── frontend/      # 前端项目
│   └── backend/       # 后端项目
├── packages/          # 共享包
├── .spec/             # 项目规格文档
├── agents/            # Agent 定义
├── docker-compose.yml # Docker 编排
└── pnpm-workspace.yaml
```

## 开发文档

详见 `.spec/` 目录下的规格文档。

## License

MIT
