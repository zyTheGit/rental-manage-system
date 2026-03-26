<template>
  <div class="detail-section">
    <div class="section-header">
      <div class="header-left">
        <span class="section-icon">📋</span>
        <h2 class="section-title">详细记录</h2>
      </div>
      <div class="header-right">
        <span class="record-count">{{ stats.length }} 条记录</span>
      </div>
    </div>
    
    <div v-if="stats.length > 0" class="detail-list">
      <div
        v-for="(stat, index) in stats"
        :key="stat.id"
        class="detail-card"
        :style="{ animationDelay: `${index * 0.05}s` }"
        @click="$emit('view', stat)"
      >
        <div class="card-date">
          <div class="date-month">{{ stat.month }}</div>
          <div class="date-label">月</div>
          <div class="date-year">{{ stat.year }}</div>
        </div>
        
        <div class="card-content">
          <div class="tenant-row">
            <div class="tenant-avatar">
              {{ stat.tenant?.name?.charAt(0) || '?' }}
            </div>
            <div class="tenant-info">
              <span class="tenant-name">{{ stat.tenant?.name }}</span>
              <span class="tenant-house">{{ stat.tenant?.house?.title || '未绑定房屋' }}</span>
            </div>
          </div>
          
          <div class="usage-row">
            <div class="usage-badge electric">
              <div class="badge-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div class="badge-content">
                <span class="badge-value">{{ stat.electricUsage || 0 }}</span>
                <span class="badge-unit">度</span>
              </div>
            </div>
            <div class="usage-badge water">
              <div class="badge-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z"/>
                </svg>
              </div>
              <div class="badge-content">
                <span class="badge-value">{{ stat.waterUsage || 0 }}</span>
                <span class="badge-unit">吨</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card-action">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          <path d="M9 12h6M9 16h6"/>
        </svg>
      </div>
      <p class="empty-text">暂无用水电记录</p>
      <p class="empty-hint">添加缴费记录后这里会显示统计数据</p>
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
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--bg-input) 0%, rgba(241, 245, 249, 0.5) 100%);
  border-bottom: 1px solid var(--border-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  font-size: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.record-count {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-card);
  padding: 4px 10px;
  border-radius: 12px;
}

.detail-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-card {
  display: flex;
  align-items: stretch;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  animation: fadeInUp 0.3s ease forwards;
  opacity: 0;
  overflow: hidden;
  
  &:active {
    transform: scale(0.99);
  }
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

.card-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 14px;
  background: linear-gradient(135deg, #64748B 0%, #475569 100%);
  min-width: 60px;
}

.date-month {
  font-size: 22px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.date-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  margin: 2px 0;
}

.date-year {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.card-content {
  flex: 1;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tenant-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tenant-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.tenant-info {
  flex: 1;
  min-width: 0;
}

.tenant-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 2px;
}

.tenant-house {
  font-size: 12px;
  color: var(--text-secondary);
}

.usage-row {
  display: flex;
  gap: 10px;
}

.usage-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  
  &.electric {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    border: 1px solid #FCD34D;
  }
  
  &.water {
    background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
    border: 1px solid #93C5FD;
  }
}

.badge-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 14px;
    height: 14px;
  }
  
  .electric & svg {
    color: #F59E0B;
  }
  
  .water & svg {
    color: #3B82F6;
  }
}

.badge-content {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.badge-value {
  font-size: 15px;
  font-weight: 700;
  
  .electric & {
    color: #D97706;
  }
  
  .water & {
    color: #2563EB;
  }
}

.badge-unit {
  font-size: 11px;
  font-weight: 500;
  
  .electric & {
    color: #B45309;
  }
  
  .water & {
    color: #1D4ED8;
  }
}

.card-action {
  display: flex;
  align-items: center;
  padding: 0 12px;
  
  svg {
    width: 18px;
    height: 18px;
    color: var(--text-placeholder);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 20px;
  text-align: center;
}

.empty-icon {
  width: 56px;
  height: 56px;
  background: var(--bg-input);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  
  svg {
    width: 28px;
    height: 28px;
    color: var(--text-placeholder);
  }
}

.empty-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-placeholder);
  margin: 0;
}
</style>