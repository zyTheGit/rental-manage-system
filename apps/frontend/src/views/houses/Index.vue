<template>
  <n-space vertical :size="24">
    <n-space justify="space-between" vertical :size="12">
      <n-h2>房屋管理</n-h2>
      <n-space>
        <n-input
          v-model:value="searchText"
          placeholder="搜索标题、地址"
          clearable
          style="width: 250px"
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
        <n-button type="primary" @click="showModal = true">
          <template #icon>
            <n-icon>
              <AddIcon />
            </n-icon>
          </template>
          添加房屋
        </n-button>
      </n-space>
    </n-space>

    <n-grid :x-gap="16" :y-gap="16" :cols="{ xs: 1, md: 2, lg: 3 }" responsive="screen">
      <n-gi v-for="house in filteredHouses" :key="house.id">
        <n-card :bordered="false" hoverable>
          <template #header>
            <n-space justify="space-between" align="center">
              <n-text strong>{{ house.title }}</n-text>
              <n-tag
                :type="house.status === 'AVAILABLE' ? 'success' : 'error'"
                size="small"
                :bordered="false"
              >
                {{ house.status === 'AVAILABLE' ? '空置' : '已租' }}
              </n-tag>
            </n-space>
          </template>
          
          <n-space vertical :size="8">
            <n-space align="center">
              <n-icon color="#3b82f6">
                <LocationIcon />
              </n-icon>
              <n-text depth="3" class="text-sm">{{ house.address }}</n-text>
            </n-space>
            
            <n-space align="center">
              <n-icon color="#3b82f6">
                <ResizeIcon />
              </n-icon>
              <n-text depth="3" class="text-sm">{{ house.area }}㎡</n-text>
            </n-space>
          </n-space>

          <n-statistic label="租金" :value="house.rent">
            <template #prefix>￥</template>
            <template #suffix>月</template>
          </n-statistic>

          <template #footer>
            <n-space justify="end">
              <n-button size="small" @click="editHouse(house)">
                <template #icon>
                  <n-icon><EditIcon /></n-icon>
                </template>
                编辑
              </n-button>
              <n-button
                size="small"
                :type="house.status === 'AVAILABLE' ? 'primary' : 'error'"
                @click="toggleStatus(house)"
              >
                <template #icon>
                  <n-icon>
                    <SwapHorizontalIcon />
                  </n-icon>
                </template>
                {{ house.status === 'AVAILABLE' ? '出租' : '退租' }}
              </n-button>
            </n-space>
          </template>
        </n-card>
      </n-gi>
    </n-grid>

    <house-modal
      :show="showModal"
      :house="editingHouse"
      @close="showModal = false"
      @save="handleSave"
    />
  </n-space>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMessage } from 'naive-ui'
import dayjs from 'dayjs'
import { housesApi } from '@/api'
import HouseModal from './HouseModal.vue'
import {
  AddOutline as AddIcon,
  LocationOutline as LocationIcon,
  ResizeOutline as ResizeIcon,
  CreateOutline as EditIcon,
  SwapHorizontalOutline as SwapHorizontalIcon,
  SearchOutline as SearchIcon,
  DownloadOutline as DownloadIcon
} from '@vicons/ionicons5'

const message = useMessage()
const houses = ref<any[]>([])
const showModal = ref(false)
const editingHouse = ref<any>(null)
const searchText = ref('')
const filterStatus = ref<string | null>(null)
const exporting = ref(false)

const statusOptions = [
  { label: '空置', value: 'AVAILABLE' },
  { label: '已租', value: 'RENTED' }
]

const fetchHouses = async () => {
  const data = await housesApi.getList() as unknown as any[]
  houses.value = data
}

const filteredHouses = computed(() => {
  let filtered = houses.value

  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    filtered = filtered.filter((h) =>
      h.title.toLowerCase().includes(search) ||
      h.address.toLowerCase().includes(search)
    )
  }

  if (filterStatus.value) {
    filtered = filtered.filter((h) => h.status === filterStatus.value)
  }

  return filtered
})

const editHouse = (house: any) => {
  editingHouse.value = house
  showModal.value = true
}

const toggleStatus = async (house: any) => {
  const newStatus = house.status === 'AVAILABLE' ? 'RENTED' : 'AVAILABLE'
  await housesApi.updateStatus(house.id, newStatus)
  house.status = newStatus
}

const exportToCSV = () => {
  exporting.value = true
  try {
    const data = filteredHouses.value
    const headers = ['标题', '地址', '面积', '租金', '押金', '状态', '创建时间']
    const csvContent = [
      headers.join(','),
      ...data.map((h) => [
        h.title,
        h.address,
        h.area,
        h.rent,
        h.deposit,
        h.status === 'AVAILABLE' ? '空置' : '已租',
        h.createdAt ? dayjs(h.createdAt).format('YYYY-MM-DD') : ''
      ].map((v) => `"${v || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `房屋列表_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    message.success('导出成功')
  } catch (error) {
    message.error('导出失败')
  } finally {
    exporting.value = false
  }
}

const handleSave = async (data: any) => {
  if (editingHouse.value) {
    await housesApi.update(editingHouse.value.id, data)
  } else {
    await housesApi.create(data)
  }
  showModal.value = false
  editingHouse.value = null
  fetchHouses()
}

onMounted(() => {
  fetchHouses()
})
</script>
