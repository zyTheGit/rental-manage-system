<template>
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
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  monthlyData: any[]
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const initChart = async () => {
  if (!chartRef.value) return
  
  await nextTick()
  
  if (chart) {
    chart.dispose()
  }
  
  chart = echarts.init(chartRef.value)
  
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const electricData = new Array(12).fill(0)
  const waterData = new Array(12).fill(0)
  
  for (const stat of props.monthlyData || []) {
    const monthStr = stat.month || ''
    const monthMatch = monthStr.match(/(\d+)/)
    const monthIndex = monthMatch ? parseInt(monthMatch[1]) - 1 : -1
    if (monthIndex >= 0 && monthIndex < 12) {
      electricData[monthIndex] = stat.electricUsage || 0
      waterData[monthIndex] = stat.waterUsage || 0
    }
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((item: any) => {
          const unit = item.seriesName === '用电' ? '度' : '吨'
          result += `${item.marker}${item.seriesName}: ${item.value} ${unit}<br/>`
        })
        return result
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#64748B' }
    },
    yAxis: {
      type: 'value',
      name: '用量',
      nameTextStyle: { color: '#64748B', fontSize: 12 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
      axisLabel: { color: '#64748B' }
    },
    series: [
      {
        name: '用电',
        type: 'bar',
        data: electricData,
        itemStyle: { color: '#F59E0B', borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      },
      {
        name: '用水',
        type: 'bar',
        data: waterData,
        itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] },
        barWidth: '30%'
      }
    ]
  }
  
  chart.setOption(option)
}

watch(() => props.monthlyData, () => {
  if (props.monthlyData && props.monthlyData.length > 0) {
    initChart()
  }
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
  }
})
</script>

<style scoped lang="less">
.chart-section {
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

.chart-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-item.electric .legend-dot {
  background: #F59E0B;
}

.legend-item.water .legend-dot {
  background: #3B82F6;
}

.chart-container {
  width: 100%;
  height: 250px;
}
</style>