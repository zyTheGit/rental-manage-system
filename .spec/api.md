# API 设计文档

## 基础信息

- Base URL: `/api`
- 认证方式: Bearer Token (JWT)
- 内容类型: `application/json`

## 通用响应格式

### 成功响应
```json
{
  "message": "success",
  "data": {}
}
```

### 错误响应
```json
{
  "statusCode": 400,
  "message": "错误信息",
  "path": "/api/xxx",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 认证模块 (`/auth`)

### 登录
- `POST /auth/login`
- Body:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- Response:
  ```json
  {
    "access_token": "string",
    "user": {
      "id": number,
      "username": "string",
      "fullName": "string",
      "role": "string"
    }
  }
  ```

### 获取当前用户
- `GET /auth/me`
- Headers: `Authorization: Bearer <token>`
- Response:
  ```json
  {
    "id": number,
    "username": "string",
    "fullName": "string",
    "role": "string"
  }
  ```

## 房屋模块 (`/houses`)

### 获取所有房屋
- `GET /houses`
- Query Params:
  - `status`: `AVAILABLE` | `RENTED` (可选)
- Response: `House[]`

### 获取单个房屋
- `GET /houses/:id`
- Response: `House`

### 创建房屋
- `POST /houses`
- Body:
  ```json
  {
    "title": "string",
    "address": "string",
    "rent": number,
    "deposit": number,
    "area": number,
    "description": "string"
  }
  ```
- Response: `House`

### 更新房屋
- `PATCH /houses/:id`
- Body:
  ```json
  {
    "title": "string",
    "address": "string",
    "rent": number,
    "deposit": number,
    "area": number,
    "status": "AVAILABLE" | "RENTED",
    "description": "string"
  }
  ```
- Response: `House`

### 删除房屋
- `DELETE /houses/:id`
- Response: `House`

### 更新房屋状态
- `PATCH /houses/:id/status`
- Body:
  ```json
  {
    "status": "AVAILABLE" | "RENTED"
  }
  ```

## 租户模块 (`/tenants`)

### 获取所有租户
- `GET /tenants`
- Response: `Tenant[]` (包含房屋信息)

### 获取单个租户
- `GET /tenants/:id`
- Response: `Tenant` (包含房屋信息)

### 创建租户
- `POST /tenants`
- Body:
  ```json
  {
    "name": "string",
    "phone": "string",
    "idCard": "string",
    "houseId": number,
    "rentStart": "ISO8601 datetime",
    "rentEnd": "ISO8601 datetime"
  }
  ```
- Response: `Tenant` (自动设置房屋为 RENTED 状态)

### 更新租户
- `PATCH /tenants/:id`
- Body:
  ```json
  {
    "name": "string",
    "phone": "string",
    "idCard": "string",
    "houseId": number,
    "rentStart": "ISO8601 datetime",
    "rentEnd": "ISO8601 datetime"
  }
  ```
- Response: `Tenant`

### 删除租户
- `DELETE /tenants/:id`
- Response: `Tenant` (自动释放房屋)

### 租户退租
- `POST /tenants/:id/checkout`
- Response: `Tenant` (自动释放房屋)

## 缴费记录模块 (`/payments`)

### 获取所有缴费记录
- `GET /payments`
- Query Params:
  - `type`: `RENT` | `WATER` | `ELECTRIC` | `OTHER` (可选)
  - `year`: `number` (可选)
- Response: `Payment[]` (包含租户信息)

### 获取单个缴费记录
- `GET /payments/:id`
- Response: `Payment` (包含租户信息)

### 创建缴费记录
- `POST /payments`
- Body:
  ```json
  {
    "tenantId": number,
    "type": "RENT" | "WATER" | "ELECTRIC" | "OTHER",
    "amount": number,
    "paidAt": "ISO8601 datetime",
    "remark": "string"
  }
  ```
- Response: `Payment`

### 月度统计
- `GET /payments/stats/month`
- Response:
  ```json
  {
    "totalIncome": number,
    "paymentDistribution": [
      { "name": "RENT", "value": number },
      { "name": "WATER", "value": number }
    ]
  }
  ```

### 年度统计
- `GET /payments/stats/year`
- Response:
  ```json
  {
    "totalIncome": number,
    "paymentDistribution": [...],
    "incomeTrend": [
      { "month": "1月", "amount": number },
      ...
    ]
  }
  ```

## 数据统计模块 (`/dashboard`)

### 获取统计数据
- `GET /dashboard/stats`
- Response:
  ```json
  {
    "totalIncome": number,
    "monthIncome": number,
    "yearIncome": number,
    "occupancyRate": number,
    "houseCount": number,
    "tenantCount": number,
    "incomeTrend": [...],
    "paymentDistribution": [...]
  }
  ```

## 数据类型定义

### House
```typescript
interface House {
  id: number;
  title: string;
  address: string;
  rent: number;
  deposit: number;
  area: number;
  status: 'AVAILABLE' | 'RENTED';
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Tenant
```typescript
interface Tenant {
  id: number;
  name: string;
  phone: string;
  idCard: string;
  houseId: number;
  house: House;
  rentStart: string;
  rentEnd: string;
  createdAt: string;
  updatedAt: string;
}
```

### Payment
```typescript
interface Payment {
  id: number;
  tenantId: number;
  tenant: Tenant;
  type: 'RENT' | 'WATER' | 'ELECTRIC' | 'OTHER';
  amount: number;
  paidAt: string;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token 无效或过期） |
| 403 | 禁止访问（权限不足） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## API 版本控制

当前版本: `v1`

所有 API 路径统一为 `/api/v1/...`（当前实现未启用版本前缀，未来可扩展）
