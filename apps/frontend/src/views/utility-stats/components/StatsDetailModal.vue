<template>
  <van-popup v-model:show="show" round position="bottom" :style="{ height: '70%' }">
    <div class="detail-modal">
      <div class="modal-header">
        <div class="modal-title">水电详情</div>
        <div class="modal-close" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </div>
      <div v-if="stat" class="modal-body">
        <div class="modal-section">
          <div class="info-row">
            <span class="info-label">租户</span>
            <span class="info-value">{{ stat.tenant?.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">房屋</span>
            <span class="info-value">{{ stat.tenant?.house?.title }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">统计周期</span>
            <span class="info-value highlight">{{ stat.year }}年{{ stat.month }}月</span>
          </div>
        </div>

        <div class="meter-section">
          <div class="meter-card electric">
            <div class="meter-header">
              <span>电表统计</span>
            </div>
            <div class="meter-grid">
              <div class="meter-item">
                <span class="meter-label">起始读数</span>
                <span class="meter-num">{{ stat.electricStartRead || 0 }}</span>
                <span class="meter-unit">度</span>
              </div>
              <div class="meter-item">
                <span class="meter-label">结束读数</span>
                <span class="meter-num">{{ stat.electricEndRead || 0 }}</span>
                <span class="meter-unit">度</span>
              </div>
              <div class="meter-item total">
                <span class="meter-label">本月用量</span>
                <span class="meter-num">{{ stat.electricUsage || 0 }}</span>
                <span class="meter-unit">度</span>
              </div>
            </div>
          </div>

          <div class="meter-card water">
            <div class="meter-header">
              <span>水表统计</span>
            </div>
            <div class="meter-grid">
              <div class="meter-item">
                <span class="meter-label">起始读数</span>
                <span class="meter-num">{{ stat.waterStartRead || 0 }}</span>
                <span class="meter-unit">吨</span>
              </div>
              <div class="meter-item">
                <span class="meter-label">结束读数</span>
                <span class="meter-num">{{ stat.waterEndRead || 0 }}</span>
                <span class="meter-unit">吨</span>
              </div>
              <div class="meter-item total">
                <span class="meter-label">本月用量</span>
                <span class="meter-num">{{ stat.waterUsage || 0 }}</span>
                <span class="meter-unit">吨</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  stat: any
}>()

const show = ref(true)

watch(() => props.stat, (val) => {
  show.value = !!val
}, { immediate: true })
</script>

<style scoped>
.detail-modal {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.modal-close svg {
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-section {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-main);
}

.info-value.highlight {
  color: var(--primary);
  font-weight: 600;
}

.meter-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meter-card {
  background: var(--bg-input);
  border-radius: var(--radius-md);
  padding: 16px;
}

.meter-header {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 12px;
}

.meter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.meter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.meter-item.total {
  background: var(--bg-card);
  padding: 12px;
  border-radius: var(--radius-sm);
}

.meter-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.meter-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
}

.meter-item.total .meter-num {
  color: var(--primary);
}

.meter-unit {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>