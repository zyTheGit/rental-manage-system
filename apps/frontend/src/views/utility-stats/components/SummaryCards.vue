<template>
  <div class="summary-cards">
    <div class="summary-card electric-card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>
      <div class="card-content">
        <span class="card-label">年度用电</span>
        <span class="card-value">{{ yearlyStats?.totalElectricUsage || 0 }}</span>
        <span class="card-unit">度</span>
      </div>
    </div>
    <div class="summary-card water-card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        </svg>
      </div>
      <div class="card-content">
        <span class="card-label">年度用水</span>
        <span class="card-value">{{ yearlyStats?.totalWaterUsage || 0 }}</span>
        <span class="card-unit">吨</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  yearlyStats: {
    totalElectricUsage?: number
    totalWaterUsage?: number
  } | null
}>()
</script>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.summary-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
}

.electric-card {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
}

.water-card {
  background: linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%);
}

.card-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.electric-card .card-icon svg {
  color: #F59E0B;
}

.water-card .card-icon svg {
  color: #3B82F6;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-main);
}

.card-unit {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>