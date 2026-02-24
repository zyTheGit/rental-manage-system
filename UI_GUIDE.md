# UI 框架使用指南

## 前端技术栈
- Vue 3.4.21
- TypeScript 5.3.3
- Vite 5.1.4
- TailwindCSS 3.4.1
- Naive UI 2.43.2 ✅ 新增
- @vicons/ionicons5 0.13.0 ✅ 新增

## Naive UI 核心配置

### 已安装的依赖
```
naive-ui@^2.43.2        # 主 UI 框架
@iconify/vue@^5.0.0        # 图标组件
@vicons/ionicons5@^0.13.0   # IonIcons 5
unplugin-vue-components@^31.0.0  # 组件自动导入
unplugin-auto-import@^21.0.0  # API 自动导入
``

### vite.config.ts 配置
``typescript
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [NaiveUiResolver()],
      dts: true,
    }),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', 'naive-ui'],
      dts: true,
    }),
  ],
  // ...
})
``

### App.vue 配置
``typescript
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'

const themeOverrides = {
  common: {
    primaryColor: '#3b82f6',
    borderRadius: '0.5rem',
  },
}
``

## 快速示例

### 使用
``typescript
// 自动导入，无需手动导入
const message = useMessage()
const dialog = useDialog()
``

``vue
<!-- 按需引用，无需导入直接使用 -->
<n-input v-model:value="form.title" />
<n-button type="primary">提交</n-button>
<n-modal v-model:show="showModal">...</n-modal>
``

### 图标
``vue
<script setup>
import { HomeOutline } from '@vicons/ionicons5'
</script>

<template>
  <n-icon><HomeOutline /></n-icon>
</template>
``

### 表单验证
``typescript
const rules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: ['blur', 'input']
  }
}
``

## 文档
- Naive UI: https://www.naiveui.com/
- Vue 3: https://vuejs.org/
- IonIcons: https://ionic.io/ionicons5/
