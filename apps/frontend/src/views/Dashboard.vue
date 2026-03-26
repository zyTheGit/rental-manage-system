<template>
  <div class="dashboard-page page-container">
    <div class="page-header">
      <div class="page-info">
        <h1 class="page-title">数据统计</h1>
        <p class="page-subtitle">查看收入趋势和费用分析</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card income">
        <div class="card-bg"></div>
        <div class="card-content">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <div class="card-info">
            <span class="card-label">本月收入</span>
            <div class="card-value-row">
              <span class="card-currency">¥</span>
              <span class="card-value">{{ formatNumber(stats.monthIncome || 0) }}</span>
            </div>
          </div>
        </div>
        <div class="card-trend up">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
        </div>
      </div>

      <div class="stat-card yearly">
        <div class="card-bg"></div>
        <div class="card-content">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="card-info">
            <span class="card-label">年度收入</span>
            <div class="card-value-row">
              <span class="card-currency">¥</span>
              <span class="card-value">{{ formatNumber(stats.yearIncome || 0) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card house">
        <div class="card-bg"></div>
        <div class="card-content">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          <div class="card-info">
            <span class="card-label">房屋数量</span>
            <div class="card-value-row">
              <span class="card-value">{{ stats.houseCount || 0 }}</span>
              <span class="card-unit">套</span>
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card tenant">
        <div class="card-bg"></div>
        <div class="card-content">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <path d="M20 8v6M23 11h-6"/>
            </svg>
          </div>
          <div class="card-info">
            <span class="card-label">租户数量</span>
            <div class="card-value-row">
              <span class="card-value">{{ stats.tenantCount || 0 }}</span>
              <span class="card-unit">人</span>
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card rate">
        <div class="card-bg"></div>
        <div class="card-content">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="card-info">
            <span class="card-label">出租率</span>
            <div class="card-value-row">
              <span class="card-value">{{ ((stats.occupancyRate || 0) * 100).toFixed(0) }}</span>
              <span class="card-unit">%</span>
            </div>
          </div>
        </div>
        <div class="rate-bar">
          <div class="rate-fill" :style="{ width: `${(stats.occupancyRate || 0) * 100}%` }"></div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title-row">
            <div class="chart-icon income-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18"/>
                <path d="M18 17V9"/>
                <path d="M13 17V5"/>
                <path d="M8 17v-3"/>
              </svg>
            </div>
            <div class="chart-title-info">
              <h2 class="chart-title">收入趋势</h2>
              <span class="chart-subtitle">近12个月收入变化</span>
            </div>
          </div>
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title-row">
            <div class="chart-icon pie-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.21 15.89A10 10 0 118 2.83"/>
                <path d="M22 12A10 10 0 0012 2v10z"/>
              </svg>
            </div>
            <div class="chart-title-info">
              <h2 class="chart-title">费用占比</h2>
              <span class="chart-subtitle">各类型费用分布</span>
            </div>
          </div>
        </div>
        <div ref="pieChartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { dashboardApi } from '@/api'

const chartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
let lineChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const stats = ref<any>({})

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

const fetchStats = async () => {
  try {
    const data = await dashboardApi.getStats() as any
    stats.value = data

    if (chartRef.value && data.incomeTrend) {
      lineChart?.setOption({
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          textStyle: { color: '#1E293B' },
          formatter: (params: any) => {
            const item = params[0]
            return `<div style="padding: 4px 8px;"><strong>${item.axisValue}</strong><br/><span style="color:#0F766E;">●</span> 收入: ¥${item.value.toLocaleString()}</div>`
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '8%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.incomeTrend.map((i: any) => i.month),
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisLabel: { color: '#64748B', fontSize: 11 },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          name: '元',
          nameTextStyle: { color: '#94A3B8', fontSize: 11, padding: [0, 40, 0, 0] },
          axisLine: { show: false },
          axisLabel: {
            color: '#64748B',
            fontSize: 11,
            formatter: (value: number) => {
              if (value >= 10000) return (value / 10000).toFixed(1) + 'w'
              return value
            }
          },
          splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } }
        },
        series: [{
          data: data.incomeTrend.map((i: any) => i.amount),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(15, 118, 110, 0.2)' },
                { offset: 1, color: 'rgba(15, 118, 110, 0.02)' }
              ]
            }
          },
          itemStyle: { color: '#0F766E', borderWidth: 2 },
          lineStyle: { color: '#0F766E', width: 3 }
        }]
      })
    }

    if (pieChartRef.value && data.paymentDistribution) {
      const typeMap: Record<string, { name: string; color: string }> = {
        RENT: { name: '房租', color: '#0F766E' },
        WATER: { name: '水费', color: '#3B82F6' },
        ELECTRIC: { name: '电费', color: '#F59E0B' },
        OTHER: { name: '其他', color: '#8B5CF6' }
      }
      const pieData = data.paymentDistribution.map((item: any) => ({
        name: typeMap[item.name]?.name || item.name,
        value: item.value,
        itemStyle: { color: typeMap[item.name]?.color || '#94A3B8' }
      }))
      pieChart?.setOption({
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          textStyle: { color: '#1E293B' },
          formatter: '{b}: ¥{c} ({d}%)'
        },
        series: [{
          type: 'pie',
          data: pieData,
          radius: ['45%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 3
          },
          label: {
            show: true,
            position: 'outside',
            color: '#64748B',
            fontSize: 11,
            formatter: '{b}\n{d}%'
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 8,
            lineStyle: { color: '#E2E8F0' }
          },
          emphasis: {
            label: { show: true, fontWeight: 'bold' },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }]
      })
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  if (chartRef.value) {
    lineChart = echarts.init(chartRef.value)
  }
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
  }
  fetchStats()

  window.addEventListener('resize', () => {
    lineChart?.resize()
    pieChart?.resize()
  })
})

onUnmounted(() => {
  lineChart?.dispose()
  pieChart?.dispose()
})
</script>

<style scoped lang="less">

.dashboard-page {
  padding-bottom: 80px;
  
  @media (min-width: 768px) {
    padding-bottom: 24px;
  }
}

.stats-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: 20px;
  
  @media (min-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }
}

.stat-card {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:active {
    transform: scale(0.98);
  }
  
  @media (min-width: 768px) {
    padding: 20px;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
    }
  }
  
  &.income {
    .card-bg { background: linear-gradient(135deg, #059669 0%, #047857 100%); }
    .card-icon { background: rgba(255,255,255,0.2); }
    .card-label { color: rgba(255,255,255,0.8); }
    .card-value, .card-currency, .card-unit { color: white; }
    .card-trend { background: rgba(255,255,255,0.2); }
  }
  
  &.yearly {
    .card-bg { background: linear-gradient(135deg, #0F766E 0%, #0D5F59 100%); }
    .card-icon { background: rgba(255,255,255,0.2); }
    .card-label { color: rgba(255,255,255,0.8); }
    .card-value, .card-currency, .card-unit { color: white; }
  }
  
  &.house {
    .card-icon { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); }
    .card-value { color: #7C3AED; }
  }
  
  &.tenant {
    .card-icon { background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); }
    .card-value { color: #1D4ED8; }
  }
  
  &.rate {
    .card-icon { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); }
    .card-value { color: #D97706; }
  }
}

.card-bg {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  opacity: 0.1;
  pointer-events: none;
  
  .income &, .yearly & {
    opacity: 1;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
}

.stat-card:not(.income):not(.yearly) .card-bg {
  background: var(--bg-input);
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 20px;
    height: 20px;
    color: white;
  }
  
  .house &, .tenant &, .rate & {
    svg {
      color: white;
    }
  }
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  white-space: nowrap;
}

.card-value-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.card-currency {
  font-size: 14px;
  font-weight: 600;
}

.card-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  
  @media (min-width: 768px) {
    font-size: 26px;
  }
}

.card-unit {
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: 2px;
}

.card-trend {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 16px;
    height: 16px;
    color: white;
  }
  
  &.up svg { color: #10B981; }
  &.down svg { color: #EF4444; }
}

.rate-bar {
  position: relative;
  height: 6px;
  background: var(--bg-input);
  border-radius: 3px;
  margin-top: 12px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  background: linear-gradient(90deg, #F59E0B 0%, #D97706 100%);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.charts-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
  
  @media (min-width: 768px) {
    grid-template-columns: 1.5fr 1fr;
    gap: 20px;
  }
}

.chart-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.chart-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--bg-input) 0%, rgba(241, 245, 249, 0.5) 100%);
  border-bottom: 1px solid var(--border-light);
}

.chart-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 18px;
    height: 18px;
    color: white;
  }
  
  &.income-icon {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  }
  
  &.pie-icon {
    background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  }
}

.chart-title-info {
  flex: 1;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 2px 0;
}

.chart-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

.chart-container {
  height: 280px;
  padding: 16px;
  
  @media (min-width: 768px) {
    height: 320px;
  }
}
</style>