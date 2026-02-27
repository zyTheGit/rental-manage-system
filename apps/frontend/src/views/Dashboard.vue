<template>
  <div class="dashboard-page">
    <h1 class="page-title">数据统计</h1>

    <div class="stats-grid">
      <div class="stat-card stat-primary">
        <div class="stat-label">本月收入</div>
        <div class="stat-value">{{ formatCurrency(stats.monthIncome || 0) }}</div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-label">年度收入</div>
        <div class="stat-value">{{ formatCurrency(stats.yearIncome || 0) }}</div>
      </div>
      <div class="stat-card stat-warning">
        <div class="stat-label">房屋数量</div>
        <div class="stat-value">{{ stats.houseCount || 0 }}</div>
      </div>
      <div class="stat-card stat-info">
        <div class="stat-label">租户数量</div>
        <div class="stat-value">{{ stats.tenantCount || 0 }}</div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-label">出租率</div>
        <div class="stat-value">{{ ((stats.occupancyRate || 0) * 100).toFixed(0) }}%</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <h2 class="chart-title">收入趋势</h2>
        <div ref="chartRef" class="chart-container"></div>
      </div>
      <div class="chart-card">
        <h2 class="chart-title">费用占比</h2>
        <div ref="pieChartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { dashboardApi } from '@/api'
import { formatCurrency } from '@/utils/helpers'

const chartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
let lineChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const stats = ref<any>({})

const fetchStats = async () => {
  try {
    const data = await dashboardApi.getStats() as any
    stats.value = data

    if (chartRef.value && data.incomeTrend) {
      lineChart?.setOption({
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.incomeTrend.map((i: any) => i.month)
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: data.incomeTrend.map((i: any) => i.amount),
          type: 'line',
          smooth: true,
          areaStyle: {
            color: '#0F766E',
            opacity: 0.1
          },
          itemStyle: {
            color: '#0F766E'
          },
          lineStyle: {
            color: '#0F766E'
          }
        }]
      })
    }

    if (pieChartRef.value && data.paymentDistribution) {
      const typeMap: Record<string, string> = {
        RENT: '房租',
        WATER: '水费',
        ELECTRIC: '电费',
        OTHER: '其他'
      }
      const pieData = data.paymentDistribution.map((item: any) => ({
        name: typeMap[item.name] || item.name,
        value: item.value
      }))
      pieChart?.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: ¥{c} ({d}%)'
        },
        color: ['#0F766E', '#0D5F59', '#CCFBF1', '#FF6B6B', '#FFE5E5'],
        series: [{
          type: 'pie',
          data: pieData,
          radius: '60%',
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            formatter: '{b}\n{d}%'
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

<style scoped>
@import '@/styles/theme.css';

.dashboard-page {
  padding: 16px;
  background: var(--bg-page);
  min-height: 100vh;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 20px 0;
  padding-top: 16px;
  color: var(--text-main);
}

.stats-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  margin-bottom: 20px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
  transition: var(--transition);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-light);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.stat-primary .stat-value {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-success .stat-value {
  color: #16a34a;
}

.stat-warning .stat-value {
  color: #ea580c;
}

.stat-info .stat-value {
  color: var(--primary);
}

.charts-grid {
  display: grid;
  gap: 16px;
}

.chart-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-main);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light);
}

.chart-container {
  height: 300px;
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 12px;
    padding-bottom: 60px; /* 为 tabbar 预留空间 */
  }

  .page-title {
    font-size: 20px;
    padding-top: 12px;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-container {
    height: 280px;
  }
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
  }

  .charts-grid {
    grid-template-columns: 2fr 1fr;
  }

  .chart-container {
    height: 350px;
  }
}
</style>
