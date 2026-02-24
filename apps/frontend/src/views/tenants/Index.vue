<template>
  <n-space vertical :size="24">
    <n-space justify="space-between" vertical :size="12">
      <n-h2>租户管理</n-h2>
      <n-space>
        <n-input
          v-model:value="searchText"
          placeholder="搜索姓名、电话、身份证"
          clearable
          style="width: 280px"
        >
          <template #prefix>
            <n-icon><SearchIcon /></n-icon>
          </template>
        </n-input>
        <n-select
          v-model:value="filterStatus"
          :options="statusOptions"
          placeholder="全部状态"
          clearable
          style="width: 120px"
        />
        <n-button @click="exportToCSV" :loading="exporting">
          <template #icon>
            <n-icon><DownloadIcon /></n-icon>
          </template>
          导出
        </n-button>
        <n-button type="primary" @click="fetchAvailableHouses">
          <template #icon>
            <n-icon><AddIcon /></n-icon>
          </template>
          添加租户
        </n-button>
      </n-space>
    </n-space>

    <n-data-table
      :columns="columns"
      :data="filteredTenants"
      :pagination="pagination"
      :bordered="false"
      striped
      size="medium"
    />

    <tenant-modal
      :show="showModal"
      :tenant="editingTenant"
      :availableHouses="availableHouses"
      @close="showModal = false"
      @save="handleSave"
    />
    
    <n-modal
      v-model:show="confirmCheckout"
      preset="dialog"
      title="确认退租"
      :content="`确认租户 ${checkoutTenant?.name} 退租？退租后房屋将自动释放。`"
      :positive-text="positiveText"
      :negative-text="'取消'"
      @positive-click="executeCheckout"
      @negative-click="confirmCheckout = false"
    />
  </n-space>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { NButton, NSpace, NTag, useMessage } from 'naive-ui'
import dayjs from 'dayjs'
import { tenantsApi } from '@/api'
import { housesApi } from '@/api'
import TenantModal from './TenantModal.vue'
import { AddOutline as AddIcon, SearchOutline as SearchIcon, DownloadOutline as DownloadIcon } from '@vicons/ionicons5'

const message = useMessage()
const tenants = ref<any[]>([])
const availableHouses = ref<any[]>([])
const showModal = ref(false)
const editingTenant = ref<any>(null)
const confirmCheckout = ref(false)
const checkoutTenant = ref<any>(null)
const positiveText = ref('确认退租')
const searchText = ref('')
const filterStatus = ref<string | null>(null)
const exporting = ref(false)

const statusOptions = [
  { label: '已租', value: 'RENTED' },
  { label: '已退租', value: 'CHECKED_OUT' }
]

const columns = [
  {
    title: '姓名',
    key: 'name',
    width: 120,
    sorter: (a: any, b: any) => a.name.localeCompare(b.name)
  },
  {
    title: '电话',
    key: 'phone',
    width: 140,
    render: (row: any) => row.phone,
    sorter: (a: any, b: any) => a.phone.localeCompare(b.phone)
  },
  {
    title: "身份证",
    key: 'idCard',
    width: 180,
    ellipsis: {
      tooltip: true
    },
    sorter: (a: any, b: any) => a.idCard.localeCompare(b.idCard)
  },
  {
    title: '房屋',
    key: 'houseId',
    width: 150,
    render: (row: any) => row.house?.title || '-',
    sorter: (a: any, b: any) => {
      const titleA = a.house?.title || ''
      const titleB = b.house?.title || ''
      return titleA.localeCompare(titleB)
    }
  },
  {
    title: '租期',
    key: 'rentPeriod',
    width: 180,
    render: (row: any) => `${formatDate(row.rentStart)} - ${formatDate(row.rentEnd)}`,
    sorter: (a: any, b: any) => dayjs(a.rentEnd).unix() - dayjs(b.rentEnd).unix()
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: any) => h(NTag, {
      type: row.status === 'RENTED' ? 'success' : 'default',
      bordered: false
    }, { default: () => row.status === 'RENTED' ? '已租' : '已退租' }),
    sorter: (a: any, b: any) => a.status.localeCompare(b.status)
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: (row: any) => h(NSpace, {}, { default: () => [
      h(NButton, {
        size: 'small',
        onClick: () => editTenant(row)
      }, { default: () => '编辑' }),
      h(NButton, {
        size: 'small',
        type: 'error',
        disabled: row.status === 'CHECKED_OUT',
        onClick: () => confirmCheckoutFn(row)
      }, { default: () => '退租' })
    ]})
  }
]

const pagination = {
  pageSize: 10
}

const filteredTenants = computed(() => {
  let filtered = tenants.value

  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    filtered = filtered.filter((t) =>
      t.name.toLowerCase().includes(search) ||
      t.phone.toLowerCase().includes(search) ||
      t.idCard.toLowerCase().includes(search)
    )
  }

  if (filterStatus.value) {
    filtered = filtered.filter((t) => t.status === filterStatus.value)
  }

  return filtered
})

const fetchTenants = async () => {
  try {
    const data = await tenantsApi.getList() as unknown as any[]
    tenants.value = data
  } catch (error) {
    message.error('获取租户列表失败')
  }
}

const fetchAvailableHouses = async () => {
  try {
    const data = await housesApi.getList({ status: 'AVAILABLE' }) as unknown as any[]
    availableHouses.value = data
    editingTenant.value = null
    showModal.value = true
  } catch (error) {
    message.error('获取可用房屋失败')
  }
}

const editTenant = (tenant: any) => {
  editingTenant.value = tenant
  showModal.value = true
}

const confirmCheckoutFn = async (tenant: any) => {
  checkoutTenant.value = tenant
  confirmCheckout.value = true
}

const executeCheckout = async () => {
  if (!checkoutTenant.value) return
  
  try {
    await tenantsApi.checkout(checkoutTenant.value.id)
    message.success('退租成功')
    confirmCheckout.value = false
    fetchTenants()
  } catch (error) {
    message.error('退租失败')
  }
}

const handleSave = async (data: any) => {
  try {
    if (editingTenant.value) {
      await tenantsApi.update(editingTenant.value.id, data)
      message.success('更新成功')
    } else {
      await tenantsApi.create(data)
      message.success('创建成功')
    }
    showModal.value = false
    editingTenant.value = null
    fetchTenants()
  } catch (error: any) {
    message.error(error.response?.data?.message || '操作失败')
  }
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const exportToCSV = () => {
  exporting.value = true
  try {
    const data = filteredTenants.value
    const headers = ['姓名', '电话', '身份证', '房屋', '租期开始', '租期结束', '状态']
    const csvContent = [
      headers.join(','),
      ...data.map((t) => [
        t.name,
        t.phone,
        t.idCard,
        t.house?.title || '',
        t.rentStart ? dayjs(t.rentStart).format('YYYY-MM-DD') : '',
        t.rentEnd ? dayjs(t.rentEnd).format('YYYY-MM-DD') : '',
        t.status === 'RENTED' ? '已租' : '已退租'
      ].map((v) => `"${v || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `租户列表_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
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
  fetchTenants()
})
</script>
