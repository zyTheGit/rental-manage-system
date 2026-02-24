<template>
  <n-space vertical :size="24">
    <n-space justify="space-between" vertical :size="12">
      <n-h2>缴费记录</n-h2>
      <n-space wrap>
        <n-input
          v-model:value="filters.searchText"
          placeholder="搜索租户姓名"
          clearable
          style="width: 200px"
        >
          <template #prefix>
            <n-icon><SearchIcon /></n-icon>
          </template>
        </n-input>
        <n-select
          v-model:value="filters.type"
          :options="typeOptions"
          placeholder="全部类型"
          clearable
          style="width: 150px"
        />
        <n-date-picker
          v-model:value="filters.dateRange"
          type="daterange"
          clearable
          is-date-type
        />
        <n-button @click="exportToCSV" :loading="exporting">
          <template #icon>
            <n-icon><DownloadIcon /></n-icon>
          </template>
          导出
        </n-button>
        <n-button type="primary" @click="fetchTenants">
          <template #icon>
            <n-icon><AddIcon /></n-icon>
          </template>
          添加记录
        </n-button>
      </n-space>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="filteredPayments"
      :pagination="pagination"
      :bordered="false"
      striped
      size="medium"
    >
      <template #empty>
        <n-empty description="暂无缴费记录" />
      </template>
    </n-data-table>

    <payment-modal
      :show="showModal"
      :tenants="tenants"
      @close="showModal = false"
      @save="handleSave"
    />
  </n-space>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMessage } from 'naive-ui'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { paymentsApi } from '@/api'
import { tenantsApi } from '@/api'
import PaymentModal from './PaymentModal.vue'
import { AddOutline as AddIcon, SearchOutline as SearchIcon, DownloadOutline as DownloadIcon } from '@vicons/ionicons5'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const message = useMessage()
const payments = ref<any[]>([])
const tenants = ref<any[]>([])
const showModal = ref(false)
const exporting = ref(false)
const filters = ref({
  searchText: '',
  type: null,
  dateRange: null as Array<Date> | null
})

const typeOptions = [
  { label: '全部', value: null },
  { label: '房租', value: 'RENT' },
  { label: '水费', value: 'WATER' },
  { label: '电费', value: 'ELECTRIC' },
  { label: '其他', value: 'OTHER' }
]

const typeMap: Record<string, { label: string; type: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  RENT: { label: '房租', type: 'success' },
  WATER: { label: '水费', type: 'info' },
  ELECTRIC: { label: '电费', type: 'warning' },
  OTHER: { label: '其他', type: 'default' }
}

const columns = [
  {
    title: '租户',
    key: 'tenant',
    width: 120,
    render: (row: any) => row.tenant?.name || '-',
    sorter: (a: any, b: any) => {
      const nameA = a.tenant?.name || ''
      const nameB = b.tenant?.name || ''
      return nameA.localeCompare(nameB)
    }
  },
  {
    title: '类型',
    key: 'type',
    width: 100,
    render: (row: any) => {
      const info = typeMap[row.type] || { label: row.type || '-', type: 'default' }
      return info.label
    },
    sorter: (a: any, b: any) => a.type.localeCompare(b.type)
  },
  {
    title: '金额',
    key: 'amount',
    width: 120,
    render: (row: any) => `¥${row.amount.toFixed(2)}`,
    sorter: (a: any, b: any) => a.amount - b.amount
  },
  {
    title: '缴费时间',
    key: 'paidAt',
    width: 180,
    render: (row: any) => formatDate(row.paidAt),
    sorter: (a: any, b: any) => dayjs(a.paidAt).unix() - dayjs(b.paidAt).unix()
  },
  {
    title: '备注',
    key: 'remark',
    render: (row: any) => row.remark || '-',
    ellipsis: {
      tooltip: true
    }
  }
]

const pagination = {
  pageSize: 10
}

const filteredPayments = computed(() => {
  let filtered = payments.value

  if (filters.value.searchText) {
    const search = filters.value.searchText.toLowerCase()
    filtered = filtered.filter((p) =>
      p.tenant?.name.toLowerCase().includes(search)
    )
  }

  if (filters.value.type) {
    filtered = filtered.filter((p) => p.type === filters.value.type)
  }

  if (filters.value.dateRange && filters.value.dateRange.length === 2) {
    const [start, end] = filters.value.dateRange
    filtered = filtered.filter((p) => {
      const paidDate = dayjs(p.paidAt)
      return paidDate.isSameOrAfter(start, 'day') && paidDate.isSameOrBefore(end, 'day')
    })
  }

  return filtered
})

const fetchPayments = async () => {
  const data = await paymentsApi.getList() as unknown as any[]
  payments.value = data
}

const fetchTenants = async () => {
  const data = await tenantsApi.getList() as unknown as any[]
  tenants.value = data
  showModal.value = true
}

const handleSave = async (data: any) => {
  try {
    await paymentsApi.create(data)
    showModal.value = false
    fetchPayments()
  } catch (error: any) {
    console.error('创建缴费记录失败', error)
  }
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const exportToCSV = () => {
  exporting.value = true
  try {
    const data = filteredPayments.value
    const headers = ['租户', '类型', '金额', '缴费时间', '备注']
    const csvContent = [
      headers.join(','),
      ...data.map((p) => [
        p.tenant?.name || '',
        typeMap[p.type]?.label || p.type || '',
        p.amount,
        p.paidAt ? dayjs(p.paidAt).format('YYYY-MM-DD HH:mm') : '',
        p.remark || ''
      ].map((v) => `"${v || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `缴费记录_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    message.success('导出成功')
  } catch (error) {
    message.error('导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchPayments()
})
</script>
