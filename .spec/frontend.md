# 前端开发文档

## 技术栈

- **框架**: Vue 3.4+ (Composition API)
- **语言**: TypeScript 5.3+
- **构建工具**: Vite 5.1+
- **路由**: Vue Router 4.3+
- **状态管理**: Pinia 2.1+
- **HTTP 客户端**: Axios 1.6+
- **样式框架**: TailwindCSS 3.4+
- **图表库**: ECharts 5.5+
- **日期处理**: Day.js 1.11+

## 目录结构

```
apps/frontend/
├── src/
│   ├── api/              # API 封装
│   │   └── index.ts      # API 接口定义
│   ├── components/       # 公共组件
│   │   └── MobileNav.vue # 移动端导航
│   ├── router/           # 路由配置
│   │   └── index.ts
│   ├── stores/           # 状态管理
│   │   └── user.ts       # 用户状态
│   ├── styles/           # 样式文件
│   │   └── index.scss    # 全局样式
│   ├── utils/            # 工具函数
│   │   ├── request.ts    # Axios 封装
│   │   └── storage.ts    # 本地存储
│   ├── views/            # 页面组件
│   │   ├── Login.vue     # 登录页
│   │   ├── Layout.vue    # 布局页
│   │   ├── Dashboard.vue # 数据统计
│   │   ├── houses/       # 房屋管理
│   │   ├── tenants/      # 租户管理
│   │   └── payments/     # 缴费记录
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── public/               # 静态资源
├── index.html            # HTML 模板
├── tailwind.config.js    # Tailwind 配置
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
└── package.json
```

## 开发规范

### 组件命名
- 页面组件: PascalCase (如 `Dashboard.vue`)
- 公共组件: PascalCase (如 `MobileNav.vue`)
- 工具函数: camelCase (如 `fetchHouses()`)

### 样式规范
- 使用 TailwindCSS 工具类
- 自定义样式放在 `<style scoped>` 中
- 避免使用 `!important`

### TypeScript 规范
- 严格模式: `"strict": true`
- 使用类型注解，避免 `any`
- 定义接口和类型时使用 `export`

### 响应式设计
- 移动端优先（Mobile First）
- 断点:
  - sm: 640px
  - md: 768px (侧边栏显示)
  - lg: 1024px
  - xl: 1280px
- 使用 TailwindCSS 响应式前缀 (`md:`, `lg:`)

## API 封装

### 请求拦截器
- 自动添加 Bearer Token
- 处理 401 未授权，自动跳转登录

### 响应拦截器
- 统一处理响应数据
- 错误处理和提示

### API 示例
```typescript
import request from '@/utils/request'

export const housesApi = {
  getList: (params?: any) => {
    return request.get('/houses', { params })
  },
  create: (data: any) => {
    return request.post('/houses', data)
  }
}
```

## 路由配置

### 路由守卫
```typescript
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.token) {
    next({ name: 'Login' })
  } else {
    next()
  }
})
```

### 路由结构
- `/login` - 登录页（无需认证）
- `/` - 主布局（需要认证）
  - `/dashboard` - 数据统计
  - `/houses` - 房屋管理
  - `/tenants` - 租户管理
  - `/payments` - 缴费记录

## 状态管理

### 用户 Store
```typescript
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const user = ref<User | null>(null)

  const login = async (username: string, password: string) => {
    // 登录逻辑
  }

  const logout = () => {
    // 退出逻辑
  }

  return { token, user, login, logout }
})
```

## 组件开发

### 页面组件结构
```vue
<template>
  <!-- 模板 -->
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// 逻辑代码
</script>

<style scoped>
/* 样式 */
</style>
```

### Modal 组件模式
```vue
<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50">
    <!-- Modal 内容 -->
  </div>
</template>

<script setup lang="ts">
defineProps<{ show: boolean }>()
defineEmits<{ (e: 'close'): void }>()
</script>
```

## 图表集成

### ECharts 使用
```typescript
import * as echarts from 'echarts'

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

onMounted(() => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    chart.setOption({ /* 配置 */ })
  }
  window.addEventListener('resize', () => chart?.resize())
})
```

## 样式主题

### 颜色系统
- Primary: Blue-500 ~ Blue-900
- Success: Green-500 ~ Green-700
- Warning: Yellow-500 ~ Yellow-600
- Error: Red-500 ~ Red-600

### 组件样式
- 按钮: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
- 输入框: `.input`
- 卡片: `.card`
- 容器: `.page-container`

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发服务器
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
```

## 性能优化

1. 路由懒加载: `() => import('@/views/xxx.vue')`
2. 组件按需引入
3. 图片懒加载（未来）
4. Vite 代码分割
5. ECharts 按需引入（未来）

## 兼容性

### 浏览器支持
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

### 移动端支持
- iOS >= 14
- Android >= 10

## 调试技巧

1. Vue DevTools 浏览器扩展
2. Vite 热更新（HMR）
3. Pinia DevTools
4. Network 面板查看 API 请求

## 部署

### Docker 构建
```bash
docker build -t rental-frontend ./apps/frontend
```

### 环境变量
```
VITE_API_BASE_URL=http://localhost:3001/api
```
