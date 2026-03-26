<template>
  <div class="utility-stats-page">
    <div class="header-section">
      <h1 class="page-title">水电统计</h1>
      <div class="toolbar">
        <div class="select-wrapper">
          <div class="select-box" @click="showTenantPicker = true">
            <span class="select-label">租户</span>
            <span class="select-value">{{ selectedTenantText || '全部租户' }}</span>
            <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        <div class="select-wrapper">
          <div class="select-box" @click="showYearPicker = true">
            <span class="select-label">年份</span>
            <span class="select-value">{{ selectedYearText }}</span>
            <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        <button class="search-btn" @click="searchStats">
          <span>查询</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else class="content">
      <SummaryCards :yearly-stats="yearlyStats" />
      
      <TrendChart ref="chartRef" :monthly-data="monthlyStats" />
      
      <StatsDetail :stats="detailStats" @view="showStatDetail" />
    </div>

    <van-popup v-model:show="showTenantPicker" position="bottom" round>
      <van-picker
        :columns="tenantOptions"
        @confirm="onTenantConfirm"
        @cancel="showTenantPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showYearPicker" position="bottom" round>
      <van-picker
        :columns="yearOptions"
        :model-value="selectedYearValues"
        @confirm="onYearConfirm"
        @cancel="showYearPicker = false"
      />
    </van-popup>

    <StatsDetailModal
      v-if="showDetailModal"
      :stat="selectedStat"
      @close="showDetailModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showToast } from 'vant'
import { paymentsApi, tenantsApi } from '@/api'
import SummaryCards from './components/SummaryCards.vue'
import TrendChart from './components/TrendChart.vue'
import StatsDetail from './components/StatsDetail.vue'
import StatsDetailModal from './components/StatsDetailModal.vue'

const tenants = ref<any[]>([])
const loading = ref(false)

const selectedTenantId = ref<number | undefined>(undefined)
const selectedTenantText = ref('')
const selectedYear = ref(new Date().getFullYear())
const selectedYearText = ref(`${new Date().getFullYear()}年`)

const showTenantPicker = ref(false)
const showYearPicker = ref(false)
const showDetailModal = ref(false)

const yearlyStats = ref<any>(null)
const monthlyStats = ref<any[]>([])
const detailStats = ref<any[]>([])
const selectedStat = ref<any>(null)

const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const years = []
  for (let i = 2020; i <= currentYear + 1; i++) {
    years.push({ text: `${i}年`, value: i })
  }
  return years.reverse()
})

const selectedYearValues = computed(() => [selectedYear.value])

const tenantOptions = computed(() => {
  const options = [{ text: '全部租户', value: 0 }]
  return options.concat(tenants.value.map(tenant => ({
    text: `${tenant.name} - ${tenant.house?.title || ''}`,
    value: tenant.id
  })))
})

const fetchTenants = async () => {
  try {
    const data = await tenantsApi.getList() as unknown as any[]
    tenants.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取租户列表失败', error)
    tenants.value = []
  }
}

const fetchStats = async () => {
  loading.value = true
  try {
    let data: any
    if (selectedTenantId.value) {
      data = await paymentsApi.getTenantUtilityByYear(selectedTenantId.value, selectedYear.value)
    } else {
      data = await paymentsApi.getUtilityStats({ year: selectedYear.value })
    }
    
    if (data && typeof data === 'object') {
      if ('yearlyStats' in data) {
        yearlyStats.value = data.yearlyStats || { totalElectricUsage: 0, totalWaterUsage: 0 }
        monthlyStats.value = data.yearlyStats?.monthlyStats || []
        detailStats.value = Array.isArray(data.stats) ? data.stats : []
      } else if ('monthlyStats' in data) {
        yearlyStats.value = { 
          totalElectricUsage: data.totalElectricUsage || 0, 
          totalWaterUsage: data.totalWaterUsage || 0 
        }
        monthlyStats.value = data.monthlyStats || []
        detailStats.value = []
      } else {
        yearlyStats.value = { totalElectricUsage: 0, totalWaterUsage: 0 }
        monthlyStats.value = []
        detailStats.value = []
      }
    } else {
      yearlyStats.value = { totalElectricUsage: 0, totalWaterUsage: 0 }
      monthlyStats.value = []
      detailStats.value = Array.isArray(data) ? data : []
    }
  } catch (error) {
    showToast({ type: 'fail', message: '获取统计数据失败' })
    yearlyStats.value = { totalElectricUsage: 0, totalWaterUsage: 0 }
    monthlyStats.value = []
    detailStats.value = []
  } finally {
    loading.value = false
  }
}

const searchStats = () => {
  fetchStats()
}

const onTenantConfirm = ({ selectedOptions }: any) => {
  const option = selectedOptions[0]
  if (option.value === 0) {
    selectedTenantId.value = undefined
    selectedTenantText.value = ''
  } else {
    selectedTenantId.value = option.value
    selectedTenantText.value = option.text
  }
  showTenantPicker.value = false
}

const onYearConfirm = ({ selectedOptions, selectedValues }: any) => {
  const value = selectedValues?.[0] || selectedOptions?.[0]?.value
  if (value) {
    selectedYear.value = value
    selectedYearText.value = `${value}年`
  }
  showYearPicker.value = false
}

const showStatDetail = (stat: any) => {
  selectedStat.value = stat
  showDetailModal.value = true
}

onMounted(async () => {
  await fetchTenants()
  await fetchStats()
})
</script>

<style scoped lang="less">

.utility-stats-page {
  padding: 16px;
  background: var(--bg-page);
  min-height: 100vh;
  padding-bottom: 60px;
}

.header-section {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 16px 0;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.select-wrapper {
  flex: 1;
}

.select-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  cursor: pointer;
}

.select-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-right: 8px;
}

.select-value {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.select-arrow {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.search-btn {
  padding: 12px 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--primary-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>