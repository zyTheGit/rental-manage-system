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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>查询</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else class="content">
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
          <div class="card-decoration"></div>
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
          <div class="card-decoration"></div>
        </div>
      </div>

        <div class="chart-section">
          <div class="section-header">
            <h2 class="section-title">月度趋势</h2>
            <div class="chart-legend">
              <span class="legend-item electric">
                <span class="legend-dot"></span>
                用电
              </span>
              <span class="legend-item water">
                <span class="legend-dot"></span>
                用水
              </span>
            </div>
          </div>
          <div ref="chartRef" class="chart-container"></div>
        </div>

        <div class="detail-section">
          <div class="section-header">
            <h2 class="section-title">详细记录</h2>
            <span class="record-count">{{ detailStats.length }} 条记录</span>
          </div>
          <div v-if="detailStats.length > 0" class="detail-list">
            <div
              v-for="(stat, index) in detailStats"
              :key="stat.id"
              class="detail-item"
              :style="{ animationDelay: `${index * 0.05}s` }"
              @click="showStatDetail(stat)"
            >
              <div class="item-header">
                <span class="item-month">{{ stat.month }}月</span>
                <span class="item-year">{{ stat.year }}</span>
              </div>
              <div class="item-body">
                <div class="tenant-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
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
              <div class="item-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>暂无记录</span>
          </div>
        </div>
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
        @confirm="onYearConfirm"
        @cancel="showYearPicker = false"
      />
    </van-popup>

    <van-popup
      v-model:show="showDetailModal"
      round
      position="bottom"
      :style="{ height: '70%' }"
      class="detail-popup"
    >
      <div class="detail-modal">
        <div class="modal-header">
          <div class="modal-title">水电详情</div>
          <div class="modal-close" @click="showDetailModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        </div>
        <div v-if="selectedStat" class="modal-body">
          <div class="modal-section">
            <div class="info-row">
              <span class="info-label">租户</span>
              <span class="info-value">{{ selectedStat.tenant?.name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">房屋</span>
              <span class="info-value">{{ selectedStat.tenant?.house?.title }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">统计周期</span>
              <span class="info-value highlight">{{ selectedStat.year }}年{{ selectedStat.month }}月</span>
            </div>
          </div>

          <div class="meter-section">
            <div class="meter-card electric">
              <div class="meter-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span>电表统计</span>
              </div>
              <div class="meter-grid">
                <div class="meter-item">
                  <span class="meter-label">起始读数</span>
                  <span class="meter-num">{{ selectedStat.electricStartRead || 0 }}</span>
                  <span class="meter-unit">度</span>
                </div>
                <div class="meter-item">
                  <span class="meter-label">结束读数</span>
                  <span class="meter-num">{{ selectedStat.electricEndRead || 0 }}</span>
                  <span class="meter-unit">度</span>
                </div>
                <div class="meter-item total">
                  <span class="meter-label">本月用量</span>
                  <span class="meter-num">{{ selectedStat.electricUsage || 0 }}</span>
                  <span class="meter-unit">度</span>
                </div>
              </div>
            </div>

            <div class="meter-card water">
              <div class="meter-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg>
                <span>水表统计</span>
              </div>
              <div class="meter-grid">
                <div class="meter-item">
                  <span class="meter-label">起始读数</span>
                  <span class="meter-num">{{ selectedStat.waterStartRead || 0 }}</span>
                  <span class="meter-unit">吨</span>
                </div>
                <div class="meter-item">
                  <span class="meter-label">结束读数</span>
                  <span class="meter-num">{{ selectedStat.waterEndRead || 0 }}</span>
                  <span class="meter-unit">吨</span>
                </div>
                <div class="meter-item total">
                  <span class="meter-label">本月用量</span>
                  <span class="meter-num">{{ selectedStat.waterUsage || 0 }}</span>
                  <span class="meter-unit">吨</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-section">
            <div class="info-row">
              <span class="info-label">记录时间</span>
              <span class="info-value">{{ formatTime(selectedStat.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { showToast } from 'vant'
import * as echarts from 'echarts'
import { paymentsApi, tenantsApi } from '@/api'
import dayjs from 'dayjs'

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

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const years = []
  for (let i = 2020; i <= currentYear + 1; i++) {
    years.push({ text: `${i}年`, value: i })
  }
  return years.reverse()
})

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
    tenants.value = data
    searchStats()
  } catch (error) {
    showToast({ type: 'fail', message: '获取租户列表失败' })
  }
}

const searchStats = async () => {
  loading.value = true
  try {
    const tenantIdParam = selectedTenantId.value && selectedTenantId.value > 0 ? selectedTenantId.value : undefined
    
    const monthly = await paymentsApi.getUtilityStats({
      tenantId: tenantIdParam,
      year: selectedYear.value
    })

    let yearlyData: any = null
    let detailData: any[] = []

    if (tenantIdParam) {
      const yearly = await paymentsApi.getTenantUtilityByYear(tenantIdParam, selectedYear.value)
      yearlyData = yearly
      detailData = Array.isArray(monthly) ? monthly : []
    } else {
      if (monthly && typeof monthly === 'object' && 'yearlyStats' in monthly) {
        yearlyData = monthly.yearlyStats
        detailData = Array.isArray((monthly as any).stats) ? (monthly as any).stats : []
      } else {
        detailData = Array.isArray(monthly) ? monthly : []
      }
    }

    yearlyStats.value = yearlyData
    if (yearlyData && yearlyData.monthlyStats) {
      monthlyStats.value = yearlyData.monthlyStats
    } else {
      monthlyStats.value = []
    }
    detailStats.value = detailData
  } catch (error: any) {
    showToast({
      type: 'fail',
      message: error.response?.data?.message || '查询失败'
    })
  } finally {
    loading.value = false
  }
  
  await nextTick()
  initChart()
}

const initChart = () => {
  if (!chartRef.value) return

  if (chart) {
    chart.dispose()
  }

  chart = echarts.init(chartRef.value)

  const months = monthlyStats.value.length > 0 
    ? monthlyStats.value.map(s => s.month) 
    : Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
  const electricData = monthlyStats.value.length > 0 
    ? monthlyStats.value.map(s => s.electricUsage || 0)
    : Array(12).fill(0)
  const waterData = monthlyStats.value.length > 0 
    ? monthlyStats.value.map(s => s.waterUsage || 0)
    : Array(12).fill(0)

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      textStyle: {
        color: '#1E293B'
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: {
        lineStyle: {
          color: '#E2E8F0'
        }
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: '#F1F5F9'
        }
      }
    },
    series: [
      {
        name: '用电',
        type: 'bar',
        data: electricData,
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#F97316' },
            { offset: 1, color: '#FB923C' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '用水',
        type: 'bar',
        data: waterData,
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#0F766E' },
            { offset: 1, color: '#14B8A6' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  })
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

const onYearConfirm = ({ selectedOptions }: any) => {
  const option = selectedOptions[0]
  selectedYear.value = option.value
  selectedYearText.value = option.text
  showYearPicker.value = false
}

const showStatDetail = (stat: any) => {
  selectedStat.value = stat
  showDetailModal.value = true
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchTenants()
  window.addEventListener('resize', () => {
    chart?.resize()
  })
})

onUnmounted(() => {
  chart?.dispose()
})

watch(showDetailModal, (val) => {
  if (!val) {
    selectedStat.value = null
  }
})
</script>

<style scoped>
@import '@/styles/theme.css';

.utility-stats-page {
  padding: 16px;
  background: var(--bg-page);
  min-height: 100vh;
  padding-bottom: 80px;
}

.header-section {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 20px 0;
  padding-top: 16px;
  color: var(--text-main);
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.select-wrapper {
  flex: 1;
  min-width: 120px;
}

.select-box {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
}

.select-box:hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
}

.select-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.select-value {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 500;
  padding-right: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
  transition: var(--transition);
}

.select-box:hover .select-arrow {
  color: var(--primary);
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 118, 110, 0.4);
}

.search-btn:active {
  transform: translateY(0);
}

.search-btn svg {
  width: 16px;
  height: 16px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
  transition: var(--transition);
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.summary-card .card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.summary-card .card-icon svg {
  width: 24px;
  height: 24px;
}

.electric-card .card-icon {
  background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
  color: #EA580C;
}

.water-card .card-icon {
  background: linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%);
  color: var(--primary);
}

.summary-card .card-content {
  display: flex;
  flex-direction: column;
}

.summary-card .card-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.summary-card .card-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.electric-card .card-value {
  color: #EA580C;
}

.water-card .card-value {
  color: var(--primary);
}

.summary-card .card-unit {
  font-size: 12px;
  color: var(--text-secondary);
}

.summary-card .card-decoration {
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.1;
}

.electric-card .card-decoration {
  background: #EA580C;
}

.water-card .card-decoration {
  background: var(--primary);
}

.chart-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.chart-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.legend-item.electric .legend-dot {
  background: linear-gradient(180deg, #F97316 0%, #FB923C 100%);
}

.legend-item.water .legend-dot {
  background: linear-gradient(180deg, #0F766E 0%, #14B8A6 100%);
}

.chart-container {
  height: 250px;
  width: 100%;
}

.detail-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
}

.record-count {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-input);
  padding: 4px 10px;
  border-radius: 20px;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  background: var(--bg-page);
  border-radius: var(--radius-md);
  padding: 16px;
  cursor: pointer;
  transition: var(--transition);
  border: 1px solid transparent;
  animation: slideIn 0.3s ease forwards;
  opacity: 0;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.detail-item:hover {
  border-color: var(--border-light);
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.detail-item:active {
  background: var(--bg-input);
}

.item-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16px;
  min-width: 50px;
}

.item-month {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}

.item-year {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.item-body {
  flex: 1;
  min-width: 0;
}

.tenant-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tenant-info svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.usage-info {
  display: flex;
  gap: 16px;
}

.usage-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.usage-label {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-input);
}

.usage-item.electric .usage-label {
  color: #EA580C;
  background: #FFF7ED;
}

.usage-item.water .usage-label {
  color: var(--primary);
  background: #CCFBF1;
}

.usage-value {
  font-size: 15px;
  font-weight: 600;
}

.usage-item.electric .usage-value {
  color: #EA580C;
}

.usage-item.water .usage-value {
  color: var(--primary);
}

.usage-unit {
  font-size: 11px;
  color: var(--text-secondary);
}

.item-arrow {
  color: var(--text-placeholder);
  transition: var(--transition);
}

.item-arrow svg {
  width: 20px;
  height: 20px;
}

.detail-item:hover .item-arrow {
  color: var(--primary);
  transform: translateX(4px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
  color: var(--text-secondary);
}

.empty-state svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.empty-state.large {
  padding: 80px 20px;
}

.empty-state.large svg {
  width: 64px;
  height: 64px;
}

.detail-popup :deep(.van-popup) {
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.detail-modal {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  color: var(--text-secondary);
}

.modal-close:hover {
  background: var(--bg-input);
  color: var(--text-main);
}

.modal-close svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.modal-section {
  background: var(--bg-page);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 500;
}

.info-value.highlight {
  color: var(--primary);
  font-weight: 600;
}

.meter-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.meter-card {
  background: var(--bg-page);
  border-radius: var(--radius-md);
  padding: 16px;
  border-left: 4px solid;
}

.meter-card.electric {
  border-left-color: #EA580C;
}

.meter-card.water {
  border-left-color: var(--primary);
}

.meter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}

.meter-card.electric .meter-header {
  color: #EA580C;
}

.meter-card.water .meter-header {
  color: var(--primary);
}

.meter-header svg {
  width: 18px;
  height: 18px;
}

.meter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.meter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px 8px;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
}

.meter-item.total {
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.meter-card.electric .meter-item.total {
  background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
}

.meter-card.water .meter-item.total {
  background: linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%);
}

.meter-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.meter-num {
  font-size: 18px;
  font-weight: 700;
}

.meter-card.electric .meter-num {
  color: #EA580C;
}

.meter-card.water .meter-num {
  color: var(--primary);
}

.meter-unit {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 2px;
}

@media (max-width: 768px) {
  .utility-stats-page {
    padding: 12px;
    padding-bottom: 70px;
  }

  .page-title {
    font-size: 20px;
    padding-top: 12px;
  }

  .toolbar {
    gap: 8px;
  }

  .select-wrapper {
    min-width: 100px;
  }

  .search-btn {
    padding: 10px 16px;
  }

  .summary-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .summary-card {
    padding: 16px;
  }

  .summary-card .card-value {
    font-size: 28px;
  }

  .chart-container {
    height: 220px;
  }

  .detail-item {
    padding: 12px;
  }

  .item-month {
    font-size: 18px;
  }

  .usage-info {
    flex-wrap: wrap;
    gap: 12px;
  }

  .meter-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .chart-container {
    height: 300px;
  }

  .detail-item {
    padding: 20px;
  }
}
</style>