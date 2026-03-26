# AGENTS.md - Coding Agent Guidelines

## Project Overview

Personal rental management system (租房管理系统) with NestJS backend and Vue 3 + Vant 4 frontend.

## Build/Lint/Test Commands

### Root Level (monorepo)
```bash
pnpm dev              # Start both frontend and backend
pnpm dev:f            # Frontend only
pnpm dev:b            # Backend only
pnpm build            # Build both
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run database migrations
```

### Backend (apps/backend)
```bash
pnpm build                      # Build NestJS
pnpm lint                       # ESLint with auto-fix
pnpm test                       # Run all tests
pnpm test:watch                 # Watch mode
pnpm test:cov                   # With coverage
pnpm test:e2e                   # E2E tests
pnpm test -- payments           # Run specific test file pattern
pnpm test -- --testPathPattern="payments.service"  # Run specific test
prisma studio                   # Database GUI
prisma db seed                  # Seed database
```

### Frontend (apps/frontend)
```bash
pnpm build            # Build Vite + typecheck
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check only
```

## Code Style Guidelines

### Backend (NestJS + Prisma)

**Imports Organization:**
```typescript
// 1. NestJS core
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
// 2. Swagger
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
// 3. Local modules (relative)
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/payment.dto';
// 4. Guards and decorators
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
```

**DTO Patterns:**
```typescript
import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUtilityStatsDto {
  @Type(() => Number)  // IMPORTANT: Required for query param number conversion
  @IsNumber()
  @IsOptional()
  tenantId?: number;
}
```

**Controller Route Ordering:**
Place specific routes BEFORE parameterized routes to avoid routing conflicts:
```typescript
@Controller('payments')
export class PaymentsController {
  @Get('stats/monthly')      // Specific route first
  @Get('utility-stats')       // Specific route first
  @Get('utility-stats/tenant/:tenantId')  // Parameterized route
  @Get(':id')                 // Generic parameterized route LAST
}
```

**Service Error Handling:**
```typescript
if (!payment) {
  throw new NotFoundException('缴费记录不存在');
}
```

**Prettier Config:**
- singleQuote: true
- trailingComma: 'all'
- semi: true
- printWidth: 100

### Frontend (Vue 3 + Vant)

**Vue Component Structure:**
```vue
<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { showToast } from 'vant'
import * as echarts from 'echarts'
import { paymentsApi } from '@/api'
import dayjs from 'dayjs'

// Reactive state first
const loading = ref(false)
const data = ref<any[]>([])

// Computed properties
const filtered = computed(() => data.value.filter(...))

// Methods
const fetchData = async () => { ... }

// Lifecycle
onMounted(() => { fetchData() })
</script>
```

**ECharts Initialization:**
```typescript
// Always use nextTick after data fetch before chart init
await nextTick()
if (chartRef.value) {
  chart = echarts.init(chartRef.value)
  chart.setOption({ ... })
}
// Always dispose charts in onUnmounted
onUnmounted(() => chart?.dispose())
```

**API Response Handling:**
```typescript
// Handle multiple response formats from backend
if (data && typeof data === 'object' && 'yearlyStats' in data) {
  yearlyData = data.yearlyStats
  detailData = Array.isArray(data.stats) ? data.stats : []
} else {
  detailData = Array.isArray(data) ? data : []
}
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (backend) | kebab-case | `payments.controller.ts` |
| Files (frontend) | PascalCase | `Dashboard.vue`, `useAuth.ts` |
| Vue components | PascalCase | `<PaymentList />` |
| Variables | camelCase | `selectedTenantId`, `yearlyStats` |
| Constants | SCREAMING_SNAKE | `PAYMENT_TYPE` |
| API endpoints | kebab-case | `/utility-stats` |
| Database models | PascalCase | `PaymentItem`, `UtilityStats` |

## Key Architectural Notes

1. **Database**: SQLite with Prisma ORM. Database file: `apps/backend/dev.db`

2. **API Prefix**: All backend routes prefixed with `/api`

3. **Authentication**: JWT Bearer token required for protected routes

4. **Query Param Types**: NestJS ValidationPipe requires `@Type(() => Number)` decorator for query params.

5. **ECharts**: Use `nextTick()` after data fetch before initializing charts. Always dispose in `onUnmounted`.

6. **State Management**: Pinia stores in `apps/frontend/src/stores/`

7. **API Layer**: Centralized in `apps/frontend/src/api/`

## Common Pitfalls

1. **Missing variable declaration**: Always declare reactive refs before use in template
2. **Route ordering**: Specific routes must come before `:id` routes in NestJS
3. **Query param conversion**: Add `@Type(() => Number)` for numeric query params
4. **Chart initialization**: Use `nextTick()` after DOM updates
5. **Empty data handling**: Provide fallback arrays for charts: `data || []`
6. **Number conversion in computed**: Use `Number()` when calculating totals from strings
7. **Horizontal scrolling**: Always use `overflow-x: hidden` and `box-sizing: border-box`
8. **Modal height**: Use `max-height: 70vh` for modal body with `overflow-y: auto`
9. **Select dropdown default**: Use empty string `""` instead of `null` for default options

## Mobile-First Design

1. **No Horizontal Scrolling**: All pages must not have horizontal scrollbars on mobile
   - Use `overflow-x: hidden` on containers
   - Use `width: 100%` with `box-sizing: border-box` for all inputs

2. **Modal/Popup Styling**:
   - Header: Title + Close button
   - Body: `max-height: 70vh; overflow-y: auto; overflow-x: hidden`
   - Footer: Two buttons side by side

3. **Form Inputs**:
   - Full width with proper padding
   - `box-sizing: border-box` required
   - Minimum touch target: 44px height

## Payment Modal Logic

**Fee Calculation Pattern:**
```typescript
// Use computed for real-time totals
const currentTotal = computed(() => {
  let total = 0
  if (feeChecks.value.rent) total += Number(feeAmounts.value.rent) || 0
  // ...
  return total.toFixed(2)
})

// Validation on submit (NOT real-time)
const handleSave = () => {
  if (feeChecks.electric && meterReads.electricEndRead < meterReads.lastElectricEndRead) {
    showToast({ type: 'fail', message: '电费结束读数不能小于起始读数' })
    return // Prevent submit
  }
}
```

**Auto-fill Pattern:**
```typescript
// When selecting tenant, auto-fill house info
const selectTenant = async (tenant: any) => {
  form.value.tenantId = tenant.id
  const house = await housesApi.getById(tenant.house.id)
  houseInfo.value = {
    rent: house.rent,
    electricRate: house.electricRate,
    waterRate: house.waterRate
  }
  feeChecks.value.rent = true
  feeAmounts.value.rent = house.rent
}
```