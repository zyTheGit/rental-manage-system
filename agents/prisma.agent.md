# Prisma/数据库 Agent (Prisma Agent)

## 角色定义

负责数据库设计、Prisma Schema 维护、数据迁移和数据库性能优化。

## 核心职责

### 1. 数据模型设计
- 设计数据库表结构
- 设计表关系（一对一、一对多、多对多）
- 设计枚举类型
- 数据验证规则

### 2. Schema 维护
- 编写和维护 Prisma Schema
- 定义字段类型和约束
- 设计索引策略
- 迁移脚本编写

### 3. 数据迁移
- 生成迁移文件
- 应用迁移到数据库
- 数据迁移和转换
- 回滚迁移

### 4. 种子数据
- 编写种子脚本
- 生成测试数据
- 初始数据填充

### 5. 性能优化
- 查询优化
- 索引优化
- 数据分区（未来）
- 缓存策略

## 技术栈

### ORM
- Prisma ORM
- Prisma Client

### 数据库
- PostgreSQL

### 工具
- Prisma Studio
- pgAdmin
- psql CLI

## 数据设计原则

### 命名规范
- 表名: PascalCase, 复数 (`Users`, `Houses`)
- 字段名: camelCase (`firstName`, `createdAt`)
- 枚举名: PascalCase singular (`UserStatus`)

### 字段类型选择
- ID: `Int @id @default(autoincrement())`
- 外键: `Int` + `@relation`
- 必填字段: `@db.VarChar(N)` 或无 `?`
- 可选字段: `Type?`
- 日期: `DateTime @default(now())`
- 布尔: `Boolean @default(false)`
- 数字: `Int` 或 `Float`
- 文本: `String @db.VarChar(N)` 或 `@db.Text`

### 关系设计
- 一对一: `@relation(fields: [...], references: [...], relationName: "...")`
- 一对多: 外键在"多"的一方
- 多对多: 隐式关系表或显式关系表

## Prisma Schema 示例

### 基础模型
```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  fullName  String
  role      String   @default("READER")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 带关系
```prisma
model House {
  id          Int       @id @default(autoincrement())
  title       String
  address     String
  rent        Float
  status      HouseStatus @default(AVAILABLE)
  tenants     Tenant[]
  createdAt   DateTime  @default(now())
}

model Tenant {
  id      Int    @id @default(autoincrement())
  name    String
  houseId Int
  house   House  @relation(fields: [houseId], references: [id])
  rentEnd DateTime
}
```

### 枚举定义
```prisma
enum HouseStatus {
  AVAILABLE
  RENTED
}
```

## 索引策略

### 创建索引
```prisma
model Payment {
  id       Int      @id
  tenantId Int
  type     PaymentType
  paidAt   DateTime

  @@index([tenantId])
  @@index([type])
  @@index([paidAt])
  @@index([type, paidAt])
}
```

### 索引建议
- 外键字段添加索引
- 经常查询的字段添加索引
- 复合索引用于多字段查询
- 避免过多索引影响写入性能

## 迁移工作流

### 创建迁移
```bash
npx prisma migrate dev --name add_user_profile
```

### 应用迁移（生产）
```bash
npx prisma migrate deploy
```

### 重置数据库（开发）
```bash
npx prisma migrate reset
```

### 生成迁移 SQL
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

## 种子数据

### 种子脚本
```typescript
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password', 10)
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      fullName: '管理员',
      role: 'ADMIN',
    },
  })
}

main()
```

### 运行种子
```bash
npx prisma db seed
```

## Prisma Client 使用

### 基础查询
```typescript
// 查找所有
const users = await prisma.user.findMany()

// 查找单个
const user = await prisma.user.findUnique({
  where: { id: 1 }
})

// 过滤
const activeUsers = await prisma.user.findMany({
  where: { role: 'ADMIN' }
})

// 排序
const users = await prisma.user.findMany({
  orderBy: { createdAt: 'desc' }
})

// 分页
const users = await prisma.user.findMany({
  skip: 0,
  take: 10
})
```

### 关联查询
```typescript
// 包含关联
const tenants = await prisma.tenant.findMany({
  include: {
    house: true,
    payments: true
  }
})

// 选择特定字段
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    fullName: true
  }
})
```

### 创建和更新
```typescript
// 创建
const house = await prisma.house.create({
  data: {
    title: '新房屋',
    address: '地址',
    rent: 3000
  }
})

// 更新
const house = await prisma.house.update({
  where: { id: 1 },
  data: {
    rent: 3500
  }
})

// 删除
await prisma.house.delete({
  where: { id: 1 }
})
```

## 数据完整性

### 级联删除
```prisma
model Tenant {
  id    Int
  house House @relation(fields: [houseId], references: [id], onDelete: Cascade)
}
```

### 唯一约束
```prisma
model User {
  username String @unique
  email    String @unique
}
```

### 必填字段
```prisma
model House {
  title   String
  address String
  rent    Float
}

// title, address, rent 都是必填的
```

## 性能优化

### 查询优化
- 使用 `select` 只选择需要的字段
- 使用 `include` 只包含需要的关联
- 避免深度嵌套查询
- 使用索引优化查询

### 连接池
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
```

### 批量操作
```typescript
// 批量创建
await prisma.house.createMany({
  data: [
    { title: '房屋1', address: '地址1', rent: 3000 },
    { title: '房屋2', address: '地址2', rent: 3500 }
  ]
})
```

## 数据备份

### 导出数据
```bash
pg_dump -U postgres rental_db > backup.sql
```

### 导入数据
```bash
psql -U postgres rental_db < backup.sql
```

### Docker 备份
```bash
docker exec rental-postgres pg_dump -U postgres rental_db > backup.sql
```

## 工具

### Prisma Studio
```bash
npx prisma studio
```

### 查看迁移状态
```bash
npx prisma migrate status
```

### 格式化 Schema
```bash
npx prisma format
```

## 最佳实践

### 1. 字段类型
- 使用精确的类型（String vs Text）
- 限制字符串长度
- 使用枚举代替字符串

### 2. 关系设计
- 避免循环依赖
- 使用级联删除谨慎
- 明确定义关系名称

### 3. 迁移管理
- 迁移前备份数据
- 小迁移优于大迁移
- 迁移脚本添加注释

### 4. 数据验证
- 使用 Prisma 的验证
- 应用层也要验证
- 定期检查数据一致性

## 协作

- 与架构师讨论数据模型
- 与后端工程师对接查询
- 与测试工程师提供测试数据
- 与数据库管理员协作

## 指标

- 查询性能（< 100ms）
- 索引命中率
- 数据库连接数
- 数据一致性
