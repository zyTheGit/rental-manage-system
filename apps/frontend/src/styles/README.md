# LESS 样式系统使用指南

## 📁 文件结构

```
src/styles/
├── index.less           # 主入口文件（全局导入）
├── theme.less           # CSS 变量定义
├── variables.less       # LESS 变量定义
├── mixins.less          # 通用 Mixins
├── components.less      # 组件样式
├── layouts.less         # 布局样式
└── utilities.less       # 工具类样式
```

## 🚀 快速开始

### 全局导入
样式系统已在 `src/main.ts` 中全局导入：
```typescript
import "./styles/index.less";
```

### 在组件中使用 LESS

#### 方式一：导入通用样式
```vue
<style scoped lang="less">
@import "@/styles/components.less";
@import "@/styles/utilities.less";

.my-component {
  .card-style();
  .p-lg;
}
</style>
```

#### 方式二：使用 Mixins
```vue
<style scoped lang="less">
@import "@/styles/mixins.less";

.my-container {
  .flex-center();
}
</style>
```

#### 方式三：使用工具类
```vue
<template>
  <div class="flex justify-between p-lg">
    <span class="text-primary">内容</span>
  </div>
</template>

<style scoped lang="less">
@import "@/styles/layouts.less";
</style>
```

## 📦 可用组件样式

### Modal/Dialog 模态框
```less
.modal-overlay     // 模态框遮罩
.modal-container  // 模态框容器
.modal-header     // 模态框头部
.modal-title      // 模态框标题
.modal-close      // 模态框关闭按钮
.modal-body       // 模态框内容区
.modal-footer     // 模态框底部
```

### Picker 选择器
```less
.picker-header           // 选择器头部
.picker-title            // 选择器标题
.picker-close            // 选择器关闭按钮
.picker-options          // 选项容器
.picker-option           // 选项
.picker-radio            // 单选按钮
.picker-option-content   // 选项内容
.picker-option-title     // 选项标题
.picker-option-subtitle  // 选项副标题
.picker-empty            // 空状态
```

### Button 按钮
```less
.btn            // 基础按钮
.btn-sm         // 小按钮
.btn-lg         // 大按钮
.btn-block      // 块级按钮
.btn-primary    // 主要按钮
.btn-secondary  // 次要按钮
.btn-outline    // 轮廓按钮
.btn-danger     // 危险按钮
.btn-text       // 文字按钮
```

### Form 表单
```less
.form-section        // 表单区块
.form-row            // 表单行
.form-label          // 表单标签
.form-value          // 表单值
.form-input-group    // 输入框组
.form-input          // 输入框
.form-textarea       // 文本域
```

### State 状态组件
```less
.empty-state         // 空状态
.empty-state__icon   // 空状态图标
.empty-state__text   // 空状态文本
.empty-state__button // 空状态按钮

.loading-state       // 加载状态
.loading-state__spinner // 加载动画
.loading-state__text // 加载文本
```

## 🔧 可用 Mixins

### Flex 布局
```less
.flex-center()      // 居中
.flex-between()     // 两端对齐
.flex-start()       // 左对齐
.flex-end()         // 右对齐
.flex-column()      // 垂直布局
```

### 文本处理
```less
.text-ellipsis()              // 单行省略
.text-ellipsis-multi(@lines)  // 多行省略
```

### 定位
```less
.absolute-center()  // 绝对居中
```

### 动画
```less
.slide-up()        // 上滑动画
.slide-in-bottom() // 下滑进入
.fade-in()        // 淡入动画
.spin()           // 旋转动画
```

### 响应式
```less
.mobile(@rules)   // 移动端
.tablet(@rules)   // 平板端
.desktop(@rules)  // 桌面端
```

### 组件样式
```less
.card-style()      // 卡片样式
.btn-base()        // 按钮基础样式
.input-base()      // 输入框基础样式
```

## 📐 可用布局类

### Flexbox
```less
.flex             // Flex 容器
.flex-row         // 水平布局
.flex-column      // 垂直布局
.justify-*        // 对齐方式
.items-*          // 对齐方式
.flex-*           // Flex 子元素属性
```

### Grid
```less
.grid              // Grid 容器
.grid-cols-*       // 列数
.gap-*             // 间距
```

## 🎨 可用工具类

### 间距
```less
.p-* / px-* / py-* / pt-* / pb-*   // 内边距
.m-* / mx-* / my-* / mt-* / mb-*   // 外边距
```

### 文本
```less
.text-*           // 文本颜色
.font-*           // 字体大小/粗细
.text-ellipsis    // 文本省略
.text-*           // 文本对齐
```

### 显示
```less
.hidden           // 隐藏
.visible          // 可见
.overflow-*       // 溢出处理
```

### 定位
```less
.relative         // 相对定位
.absolute         // 绝对定位
.fixed            // 固定定位
.sticky           // 粘性定位
```

### 尺寸
```less
.w-full           // 全宽
.h-full           // 全高
.min-h-screen     // 最小高度 100vh
```

### 样式
```less
.rounded-*        // 圆角
.shadow-*         // 阴影
.bg-*             // 背景
```

## 💡 使用示例

### 示例 1：创建一个卡片组件
```vue
<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">标题</h3>
    </div>
    <div class="card-content">
      <p class="card-text">内容</p>
    </div>
  </div>
</template>

<style scoped lang="less">
@import "@/styles/components.less";

.card {
  .card-style();
  padding: @spacing-xl;
}

.card-header {
  .flex-between();
  margin-bottom: @spacing-lg;
}

.card-title {
  font-size: @font-lg;
  font-weight: @font-semibold;
  color: var(--text-main);
  margin: 0;
}

.card-content {
  color: var(--text-secondary);
}
</style>
```

### 示例 2：使用工具类
```vue
<template>
  <div class="flex justify-between items-center p-lg bg-white rounded-md shadow-sm">
    <span class="text-primary font-semibold">标题</span>
    <button class="btn btn-sm btn-primary">按钮</button>
  </div>
</template>

<style scoped lang="less">
@import "@/styles/layouts.less";
@import "@/styles/utilities.less";
@import "@/styles/components.less";
</style>
```

### 示例 3：响应式组件
```vue
<template>
  <div class="responsive-grid">
    <div v-for="item in items" :key="item.id" class="card">
      {{ item.name }}
    </div>
  </div>
</template>

<style scoped lang="less">
@import "@/styles/layouts.less";
@import "@/styles/components.less";

.responsive-grid {
  .grid-responsive();

  .card {
    .card-style();
    padding: @spacing-lg;
  }
}
</style>
```

## 📋 渐进式迁移策略

### 新组件
所有新创建的组件都使用 LESS 和通用样式。

### 旧组件
保持原有 CSS 不变，只有在重写时才迁移到 LESS。

### 优先级
1. ✅ **已迁移**：CommonPicker, LoadingSpinner, EmptyState, ConfirmDialog
2. 🔄 **待迁移**：高频使用的 Modal, Button, Form 组件
3. ⏳ **低优先级**：页面级样式保持 CSS

## 🎯 注意事项

1. **不要过度依赖工具类** - 对于复杂组件，仍然建议使用 `scoped` 样式
2. **保持命名一致性** - 使用 kebab-case 命名
3. **按需导入** - 只导入需要的模块，避免样式膨胀
4. **测试兼容性** - 确保在移动端和桌面端都能正常显示
5. **遵循设计规范** - 参考现有页面的设计风格

## 🔗 相关资源

- [LESS 官方文档](https://lesscss.org/)
- [Vite CSS 预处理器](https://cn.vitejs.dev/guide/features.html#css-pre-processors)
- [项目设计规范](../AGENTS.md)