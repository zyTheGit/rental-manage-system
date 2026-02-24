<template>
  <n-space vertical :size="24">
    <n-h2>数据统计</n-h2>

    <n-grid :x-gap="16" :y-gap="16" :cols="{ xs: 1, sm: 2, lg: 3 }">
      <n-statistic label="本月收入" :value="stats.monthIncome || 0">
        <template #prefix>￥</template>
      </n-statistic>
      <n-statistic label="年度收入" :value="stats.yearIncome || 0">
        <template #prefix>￥</template>
      </n-statistic>
      <n-statistic label="房屋数量" :value="stats.houseCount || 0" />
      <n-statistic label="租户数量" :value="stats.tenantCount || 0" />
      <n-statistic 
        label="出租率" 
        :value="stats.occupancyRate || 0"
        :precision="1"
        suffix="%"
      />
    </n-grid>

    <n-card title="收入趋势" :bordered="false">
      <div ref="chartRef" class="h-80"></div>
    </n-card>

    <n-card title="费用占比" :bordered="false">
      <div ref="pieChartRef" class="h-80"></div>
    </n-card>
  </n-space>
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

const fetchStats = async () => {
  try {
    const data = await dashboardApi.getStats() as any
    stats.value = data

    if (chartRef.value && data.incomeTrend) {
      lineChart?.setOption({
        tooltip: {
          trigger: 'axis'
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
            color: '#3b82f6',
            opacity: 0.1
          },
          itemStyle: {
            color: '#3b82f6'
          }
        }]
      })
    }

    if (pieChartRef.value && data.paymentDistribution) {
      pieChart?.setOption({
        tooltip: {
          trigger: 'item'
        },
        series: [{
          type: 'pie',
          data: data.paymentDistribution,
          radius: '60%',
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
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
.h-80 {
  height: 320px;
}
</style>
