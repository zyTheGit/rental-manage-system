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
          @input="handleSearchInput(($event.target as HTMLInputElement).value)"
        />
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
interface Filters {
  searchText: string
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
  clearTenantFilter: []
  search: [text: string]
}>()

let searchTimer: ReturnType<typeof setTimeout> | null = null

const handleSearchInput = (value: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    searchText: value,
  })
  
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    emit('search', value)
  }, 300)
}
</script>

<style scoped lang="less">

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

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  flex: 1;
  min-width: 0;
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
  min-width: 0;
}

@media (max-width: 640px) {
  .toolbar {
    padding: 10px 12px;
  }

  .search-box {
    flex: 1;
  }

  .btn-secondary {
    flex-shrink: 0;
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
  padding: 10px 20px;
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