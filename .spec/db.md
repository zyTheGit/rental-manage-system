# 数据库设计文档

## 数据库概述

- 数据库类型: PostgreSQL
-字符集: UTF-8
- ORM: Prisma

## ER 图

```
User (用户表)
  ↓ one-to-many
Payment (缴费记录)

Tenant (租户表)
  ↓ one-to-many
Payment (缴费记录)

House (房屋表)
  ↓ one-to-many
Tenant (租户表)
```

## 表结构设计

### User 表

用户表，存储系统用户信息（管理员和只读用户）。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | Int | PK, Auto Increment | 用户 ID |
| username | String | UNIQUE, NOT NULL | 用户名 |
| password | String | NOT NULL | 密码（bcrypt 加密） |
| fullName | String | NOT NULL | 全名 |
| role | String | DEFAULT 'READER' | 角色（ADMIN/READER） |
| createdAt | DateTime | DEFAULT NOW() | 创建时间 |
| updatedAt | DateTime | AUTO UPDATE | 更新时间 |

**索引:**
- UNIQUE INDEX on `username`

### House 表

房屋表，存储房屋信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | Int | PK, Auto Increment | 房屋 ID |
| title | String | NOT NULL | 房屋标题 |
| address | String | NOT NULL | 地址 |
| rent | Float | NOT NULL | 租金 |
| deposit | Float | NOT NULL | 押金 |
| area | Float | NOT NULL | 面积（平方米） |
| status | Enum | DEFAULT 'AVAILABLE' | 状态（AVAILABLE/RENTED） |
| description | String | NULLABLE | 描述 |
| createdAt | DateTime | DEFAULT NOW() | 创建时间 |
| updatedAt | DateTime | AUTO UPDATE | 更新时间 |

**索引:**
- INDEX on `status`

**枚举类型:**
```sql
CREATE TYPE HouseStatus AS ENUM ('AVAILABLE', 'RENTED');
```

### Tenant 表

租户表，存储租户信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | Int | PK, Auto Increment | 租户 ID |
| name | String | NOT NULL | 姓名 |
| phone | String | NOT NULL | 电话 |
| idCard | String | NOT NULL | 身份证号 |
| houseId | Int | FK, NOT NULL | 房屋 ID |
| rentStart | DateTime | NOT NULL | 租期开始 |
| rentEnd | DateTime | NOT NULL | 租期结束 |
| createdAt | DateTime | DEFAULT NOW() | 创建时间 |
| updatedAt | DateTime | AUTO UPDATE | 更新时间 |

**外键:**
- `houseId` REFERENCES House(id) ON DELETE CASCADE

**索引:**
- INDEX on `houseId`
- INDEX on `phone`

### Payment 表

缴费记录表，存储所有缴费信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | Int | PK, Auto Increment | 缴费记录 ID |
| tenantId | Int | FK, NOT NULL | 租户 ID |
| type | Enum | NOT NULL | 缴费类型 |
| amount | Float | NOT NULL | 金额 |
| paidAt | DateTime | NOT NULL | 缴费时间 |
| remark | String | NULLABLE | 备注 |
| createdAt | DateTime | DEFAULT NOW() | 创建时间 |
| updatedAt | DateTime | AUTO UPDATE | 更新时间 |
| userId | Int | FK, NULLABLE | 操作用户 ID |

**外键:**
- `tenantId` REFERENCES Tenant(id) ON DELETE CASCADE
- `userId` REFERENCES User(id)

**索引:**
- INDEX on `tenantId`
- INDEX on `type`
- INDEX on `paidAt`
- INDEX on `userId`

**枚举类型:**
```sql
CREATE TYPE PaymentType AS ENUM ('RENT', 'WATER', 'ELECTRIC', 'OTHER');
```

## 业务规则

### 房屋规则
1. 新建房屋默认状态为 `AVAILABLE`（空置）
2. 房屋状态为 `RENTED` 时不能绑定新的租户
3. 删除房屋前需要确保没有关联的租户

### 租户规则
1. 新建租户时，房屋状态自动变更为 `RENTED`
2. 删除租户或退租时，房屋状态自动变更为 `AVAILABLE`
3. 租户的电话和身份证号唯一性由业务层保证

### 缴费规则
1. 缴费金额不能为负数
2. 缴费时间必须是有效的时间戳
3. 删除租户时，关联的缴费记录级联删除

## 数据迁移

### 初始化

```bash
# 生成 Prisma Client
pnpm prisma:generate

# 创建数据库迁移
pnpm prisma:migrate

# 运行种子数据（创建管理员账号）
pnpm prisma:seed
```

### 备份与恢复

```bash
# Docker 环境备份
docker exec rental-postgres pg_dump -U postgres rental_db > backup.sql

# Docker 环境恢复
docker exec -i rental-postgres psql -U postgres rental_db < backup.sql
```

## 性能优化建议

1. 为常用查询字段添加索引（已完成）
2. 使用连接池优化数据库连接
3. 考虑对大表进行分区（未来扩展）
4. 定期清理已删除租户的历史数据

## 数据安全

1. 所有密码使用 bcrypt 加密存储（盐值 10 轮）
2. 敏感信息（如身份证号）需在前端显示时脱敏
3. JWT Token 有效期默认为 7 天
4. 数据库连接使用环境变量配置，不硬编码

## 扩展性考虑

### 未来可能的扩展表

1. **Contract 表**: 合同管理
2. **Notice 表**: 消息通知
3. **Maintenance 表**: 维修记录
4. **Bill 表**: 账单管理

### 分表策略

当数据量过大时，可考虑：
- Payment 表按年份分表
- 日志表定期归档
