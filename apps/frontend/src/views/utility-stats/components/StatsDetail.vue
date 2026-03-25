<template>
  <div class="detail-section">
    <div class="section-header">
      <h2 class="section-title">详细记录</h2>
      <span class="record-count">{{ stats.length }} 条记录</span>
    </div>
    <div v-if="stats.length > 0" class="detail-list">
      <div
        v-for="(stat, index) in stats"
        :key="stat.id"
        class="detail-item"
        :style="{ animationDelay: `${index * 0.05}s` }"
        @click="$emit('view', stat)"
      >
        <div class="item-header">
          <span class="item-month">{{ stat.month }}月</span>
          <span class="item-year">{{ stat.year }}</span>
        </div>
        <div class="item-body">
          <div class="tenant-info">
            <span>{{ stat.tenant?.name }} - {{ stat.tenant?.house?.title }}</span>
          </div>
          <div class="usage-info">
            <div class="usage-item electric">
              <span class="usage-label">电</span>
              <span class="usage-value">{{ stat.electricUsage || 0 }}</span>
              <span class="usage-unit">度</span>
            </div>
            <div class="usage-item water">
              <span class="usage-label">水</span>
              <span class="usage-value">{{ stat.waterUsage || 0 }}</span>
              <span class="usage-unit">吨</span>
            </div>
          </div>
        </div>
        <div class="item-arrow">›</div>
      </div>
    </div>
    <div v-else class="empty-state">
      <span>暂无记录</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: any[]
}>()

defineEmits<{
  view: [stat: any]
}>()
</script>

<style scoped lang="less">
.detail-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.record-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  cursor: pointer;
  animation: fadeInUp 0.3s ease forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.item-header {
  display: flex;
  flex-direction: column;
  margin-right: 16px;
  min-width: 60px;
}

.item-month {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.item-year {
  font-size: 12px;
  color: var(--text-secondary);
}

.item-body {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tenant-info {
  font-size: 14px;
  color: var(--text-main);
  flex: 1;
}

.usage-info {
  display: flex;
  gap: 16px;
}

.usage-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.usage-label {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  color: white;
}

.usage-item.electric .usage-label {
  background: #F59E0B;
}

.usage-item.water .usage-label {
  background: #3B82F6;
}

.usage-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.usage-unit {
  font-size: 12px;
  color: var(--text-secondary);
}

.item-arrow {
  font-size: 20px;
  color: var(--text-placeholder);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}
</style>