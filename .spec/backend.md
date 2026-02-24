# 后端开发文档

## 技术栈

- **框架**: NestJS 10.3+
- **语言**: TypeScript 5.3+
- **ORM**: Prisma 5.9+
- **数据库**: PostgreSQL 15+
- **认证**: JWT (Passport)
- **验证**: class-validator
- **文档**: Swagger (OpenAPI 3.0)
- **日志**: Nest Logger

## 目录结构

```
apps/backend/
├── src/
│   ├── common/               # 公共模块
│   │   ├── decorators/       # 装饰器
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/          # 异常过滤器
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/           # 守卫
│   │   │   └── jwt-auth.guard.ts
│   │   └── interceptors/     # 拦截器
│   │       └── logging.interceptor.ts
│   ├── modules/              # 业务模块
│   │   ├── auth/             # 认证模块
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   └── dto/
│   │   │       └── login.dto.ts
│   │   ├── dashboard/        # 数据统计
│   │   ├── houses/           # 房屋管理
│   │   ├── payments/         # 缴费记录
│   │   ├── prisma/           # Prisma 服务
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   └── tenants/          # 租户管理
│   ├── app.module.ts         # 根模块
│   └── main.ts               # 入口文件
├── prisma/
│   ├── schema.prisma         # 数据模型
│   └── seed.ts               # 种子数据
├── test/                     # 测试文件
├── .eslintrc.js              # ESLint 配置
├── .prettierrc               # Prettier 配置
├── nest-cli.json             # Nest CLI 配置
├── tsconfig.json             # TypeScript 配置
└── package.json
```

## 开发规范

### 模块结构
每个业务模块包含:
- `*.controller.ts` - 控制器
- `*.service.ts` - 服务
- `*.module.ts` - 模块
- `dto/` - 数据传输对象
- `entities/` - 实体（如需）

### 命名规范
- 类名: PascalCase (`AuthService`)
- 方法名: camelCase (`findAll`)
- 常量: UPPER_SNAKE_CASE (`JWT_SECRET`)
- 文件名: kebab-case (`auth.service.ts`)

### TypeScript 规范
- 严格类型检查
- 使用接口定义 DTO
- 避免使用 `any`
- 使用 `readonly` 修饰常量属性

### 装饰器使用
- 控制器: `@Controller()`, `@Get()`, `@Post()`, `@Put()`, `@Delete()`
- 参数: `@Param()`, `@Body()`, `@Query()`
- 验证: `@IsString()`, `@IsNumber()`, `@IsNotEmpty()`
- 文档: `@ApiTags()`, `@ApiOperation()`, `@ApiBearerAuth()`

## 核心模块

### Prisma 模块

提供数据库连接和访问服务。

```typescript
@Injectable()
export class PrismaService extends PrismaClient {
  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
```

### Auth 模块

处理用户认证和 JWT 颁发。

```typescript
@Injectable()
export class AuthService {
  async login(loginDto: LoginDto) {
    // 验证用户
    // 生成 JWT
    return { access_token, user }
  }
}
```

### Houses 模块

房屋 CRUD 操作。

```typescript
@Injectable()
export class HousesService {
  findAll(params) { }
  findOne(id) { }
  create(data) { }
  update(id, data) { }
  remove(id) { }
  updateStatus(id, status) { }
}
```

### Tenants 模块

租户管理，自动处理房屋状态。

```typescript
@Injectable()
export class TenantsService {
  async create(createTenantDto) {
    // 创建租户
    // 自动设置房屋为 RENTED
  }

  async checkout(id) {
    // 删除租户
    // 自动释放房屋
  }
}
```

### Payments 模块

缴费记录和统计。

```typescript
@Injectable()
export class PaymentsService {
  async getMonthlyStats() { }
  async getYearlyStats() { }
}
```

### Dashboard 模块

聚合数据统计。

```typescript
@Injectable()
export class DashboardService {
  async getStats() {
    return {
      totalIncome,
      monthIncome,
      yearIncome,
      occupancyRate,
      houseCount,
      tenantCount,
      incomeTrend,
      paymentDistribution
    }
  }
}
```

## 中间件和拦截器

### 全局异常过滤
```typescript
@Catch()
export class HttpExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 统一错误处理
    // 记录日志
  }
}
```

### 日志拦截器
```typescript
@Injectable()
export class LoggingInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    // 记录请求
    // 记录响应时间
  }
}
```

### JWT 认证守卫
```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    // 验证 JWT
    // 注入用户信息
  }
}
```

## DTO 验证

### 使用 class-validator
```typescript
export class CreateHouseDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsNumber()
  @IsNotEmpty()
  rent: number
}
```

### 全局验证管道
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  transform: true
}))
```

## API 文档

### Swagger 配置
```typescript
const config = new DocumentBuilder()
  .setTitle('租房管理系统 API')
  .setVersion('1.0')
  .addBearerAuth()
  .build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api/docs', app, document)
```

访问地址: `http://localhost:3001/api/docs`

## 环境变量

```env
# 数据库
DATABASE_URL=postgresql://user:password@host:5432/db?schema=public

# 服务
BACKEND_PORT=3001
BACKEND_HOST=0.0.0.0

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# 管理员
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=管理员

# 环境
NODE_ENV=development
```

## 数据库操作

### 迁移
```bash
# 生成迁移
npx prisma migrate dev --name migration_name

# 应用迁移
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate
```

### 种子数据
```bash
# 运行种子脚本
npx prisma db seed
```

### Prisma Studio
```bash
# 可视化数据库管理
npx prisma studio
```

## 测试

### 单元测试
```bash
# 运行测试
pnpm test

# 覆盖率
pnpm test:cov
```

### 测试示例
```typescript
describe('AuthService', () => {
  it('should login successfully', async () => {
    const result = await authService.login(loginDto)
    expect(result).toHaveProperty('access_token')
  })
})
```

## 开发命令

```bash
# 开发服务器
pnpm dev

# 构建
pnpm build

# 生产环境运行
pnpm start:prod

# Lint
pnpm lint

# Format
pnpm format
```

## 性能优化

1. 使用 Prisma 查询优化（select, include）
2. 添加数据库索引
3. 使用缓存（Redis - 未来）
4. 分页查询（未来）
5. 查询结果压缩（未来）

## 安全措施

1. JWT 认证
2. 密码 bcrypt 加密
3. SQL 注入防护
4. DTO 验证和清洗
5. CORS 配置
6. Rate Limiting（未来）
7. Helmet 安全头（未来）

## 部署

### Docker 构建
```bash
docker build -t rental-backend ./apps/backend
```

### 健康检查
```typescript
@Get('health')
getHealth() {
  return { status: 'ok', timestamp: new Date() }
}
```

## 日志

### 日志级别
- ERROR: 错误信息
- WARN: 警告信息
- LOG: 一般信息
- DEBUG: 调试信息
- VERBOSE: 详细信息

### 日志格式
```
[Nest] INFO [AuthService] User login: username=admin
[Nest] INFO [LoggingInterceptor] POST /api/auth/login 200 45ms
```

## 错误处理

### 自定义异常
```typescript
@Catch(NotFoundException)
export class NotFoundExceptionFilter {
  catch(exception: NotFoundException) {
    // 特定错误处理
  }
}
```

### 错误响应格式
```json
{
  "statusCode": 404,
  "message": "资源不存在",
  "path": "/api/xxx",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
