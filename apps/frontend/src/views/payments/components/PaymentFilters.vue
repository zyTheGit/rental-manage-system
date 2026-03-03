<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          :value="modelValue.searchText"
          type="text"
          class="search-input"
          placeholder="搜索租户姓名..."
          @input="updateFilter('searchText', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="filter-group" @click="$emit('typeClick')">
        <div class="filter-select-custom">
          <span>{{ typeText }}</span>
          <span class="filter-arrow">▼</span>
        </div>
      </div>
    </div>
    <button class="btn btn-secondary ripple-effect" @click="$emit('export')" :disabled="exporting">
      <span class="btn-icon">📥</span>
      <span>{{ exporting ? '导出中...' : '导出' }}</span>
    </button>
  </div>

  <div class="date-range-bar">
    <div class="date-field" @click="$emit('startDateClick')">
      <span class="date-value">{{ modelValue.startDate || '开始日期' }}</span>
      <span class="date-icon">📅</span>
    </div>
    <span class="date-separator">→</span>
    <div class="date-field" @click="$emit('endDateClick')">
      <span class="date-value">{{ modelValue.endDate || '结束日期' }}</span>
      <span class="date-icon">📅</span>
    </div>
  </div>

  <div v-if="modelValue.tenantId" class="tenant-filter-bar">
    <span class="filter-label">当前筛选租户:</span>
    <span class="filter-value">{{ modelValue.tenantName }}</span>
    <button class="btn-clear" @click="$emit('clearTenantFilter')">✕ 清除</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Filters {
  searchText: string
  type: string | null
  startDate: string
  endDate: string
  tenantId: number | null
  tenantName: string
}

const props = defineProps<{
  modelValue: Filters
  exporting?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Filters]
  export: []
  startDateClick: []
  endDateClick: []
  typeClick: []
  clearTenantFilter: []
}>()

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'RENT', label: '房租' },
  { value: 'WATER', label: '水费' },
  { value: 'ELECTRIC', label: '电费' },
  { value: 'OTHER', label: '其他' },
]

const typeText = computed(() => {
  const option = typeOptions.find(o => o.value === (props.modelValue.type ?? ''))
  return option?.label || '全部类型'
})

const updateFilter = (key: keyof Filters, value: any) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}
</script>

<style scoped>
@import '../../../styles/theme.css';

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.toolbar-left > * {
  min-width: 0;
  flex: 1 1 auto;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  min-width: 0;
}

.search-box .search-input {
  min-width: 0;
  width: 100px;
}

.search-icon {
  font-size: 16px;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}

.filter-group {
  min-width: 0;
  flex: 1 1 auto;
}

.filter-select-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.filter-arrow {
  font-size: 10px;
  color: var(--text-secondary);
  margin-left: 8px;
}

/* 移动端响应式 */
@media (max-width: 640px) {
  .toolbar {
    padding: 10px 12px;
  }

  .toolbar-left {
    flex-wrap: wrap;
    width: 100%;
  }

  .search-box {
    flex: 1 1 100%;
    order: 1;
  }

  .filter-select-custom {
    flex: 0 0 auto;
    order: 2;
  }

  .btn-secondary {
    order: 3;
    width: 100%;
    margin-top: 4px;
  }

  .btn-secondary .btn-icon {
    display: none;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary {
  background: white;
  color: var(--text-main);
  border: 2px solid var(--border-light);
}

.btn-icon {
  font-size: 18px;
}

.date-range-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.date-field {
  padding: 10px 16px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.date-value {
  font-size: 14px;
  color: var(--text-main);
}

.date-icon {
  font-size: 16px;
}

.date-separator {
  color: var(--text-placeholder);
  font-size: 18px;
}

.tenant-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--primary-light);
  border-radius: var(--radius-md);
  border: 1px solid var(--primary);
}

.filter-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.filter-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.btn-clear {
  margin-left: auto;
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect:active {
  transform: scale(0.98);
}
</style>