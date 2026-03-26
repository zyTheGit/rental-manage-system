<template>
  <div class="tenants-page page-container">
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <div class="header-info">
          <h1 class="page-title">租户管理</h1>
          <p class="page-subtitle">{{ tenants.length }} 位租户</p>
        </div>
      </div>
      <button class="btn-add" @click="openAddModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>

    <div class="toolbar">
      <div class="search-bar">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          :value="searchText"
          type="text"
          placeholder="搜索租户..."
          @input="handleSearchInput(($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="filter-chip" @click="showStatusPicker = true">
        <span>{{ filterStatusText }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-pulse"></div>
      <span>加载中...</span>
    </div>

    <div v-else class="tenants-list">
      <div 
        v-for="(tenant, index) in tenants" 
        :key="tenant.id" 
        class="tenant-card"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div class="card-top">
          <div class="tenant-avatar">
            {{ tenant.name?.charAt(0) || '?' }}
          </div>
          <div class="status-badge" :class="tenant.status === 'RENTED' ? 'active' : 'inactive'">
            {{ tenant.status === 'RENTED' ? '在租' : '已退租' }}
          </div>
        </div>

        <div class="card-content">
          <div class="tenant-header">
            <h3 class="tenant-name">{{ tenant.name }}</h3>
            <span class="tenant-phone">{{ tenant.phone }}</span>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M3 10h18"/>
              </svg>
              <span>{{ tenant.house?.title || '未分配' }}</span>
            </div>
            <div class="info-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <span>{{ formatDateRange(tenant.rentStart, tenant.rentEnd) }}</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button class="action-btn secondary" @click="viewPaymentRecords(tenant)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            <span>缴费</span>
          </button>
          <button class="action-btn secondary" @click="editTenant(tenant)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>编辑</span>
          </button>
          <button 
            v-if="tenant.status === 'RENTED'"
            class="action-btn danger" 
            @click="confirmCheckoutFn(tenant)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>退租</span>
          </button>
        </div>
      </div>

      <div v-if="tenants.length === 0" class="empty-state">
        <div class="empty-visual">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <path d="M20 8v6M23 11h-6"/>
          </svg>
        </div>
        <h3>还没有租户</h3>
        <p>添加您的第一位租户开始管理</p>
        <button class="btn-add-large" @click="openAddModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>添加租户</span>
        </button>
      </div>
    </div>

    <TenantModal
      v-if="showModal"
      :show="showModal"
      :available-houses="availableHouses"
      :tenant="editingTenant"
      @close="closeModal"
      @save="handleSave"
    />

    <CommonPicker
      :show="showStatusPicker"
      title="选择状态"
      :options="statusOptions"
      v-model="filterStatus"
      @update:show="showStatusPicker = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import dayjs from 'dayjs'
import { tenantsApi, housesApi } from '@/api'
import TenantModal from './TenantModal.vue'
import CommonPicker from '@/components/CommonPicker.vue'

const router = useRouter()
const tenants = ref<any[]>([])
const availableHouses = ref<any[]>([])
const loading = ref(false)
const searchText = ref('')
const filterStatus = ref<string>('')
const showModal = ref(false)
const editingTenant = ref<any>(null)
const showStatusPicker = ref(false)

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'RENTED', label: '在租' },
  { value: 'CHECKED_OUT', label: '已退租' },
]

const filterStatusText = computed(() => {
  const option = statusOptions.find(o => o.value === filterStatus.value)
  return option?.label || '全部'
})

const formatDateRange = (start: string, end: string) => {
  if (!start) return '未设置'
  return `${dayjs(start).format('MM/DD')}${end ? ' - ' + dayjs(end).format('MM/DD') : ''}`
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

const fetchAvailableHouses = async (currentHouseId?: number) => {
  try {
    const data = await housesApi.getList({ status: 'AVAILABLE' }) as unknown as any[]
    let houses = Array.isArray(data) ? data : []
    
    if (currentHouseId) {
      const currentHouse = await housesApi.getById(currentHouseId) as any
      if (currentHouse && !houses.find((h: any) => h.id === currentHouseId)) {
        houses = [currentHouse, ...houses]
      }
    }
    
    availableHouses.value = houses
  } catch (error) {
    console.error('获取可用房屋列表失败', error)
    availableHouses.value = []
  }
}

const openAddModal = async () => {
  editingTenant.value = null
  await fetchAvailableHouses()
  showModal.value = true
}

const editTenant = async (tenant: any) => {
  editingTenant.value = tenant
  await fetchAvailableHouses(tenant.houseId)
  showModal.value = true
}

const fetchTenants = async (search?: string) => {
  loading.value = true
  try {
    const params: any = {}
    if (search || searchText.value) {
      params.search = search || searchText.value
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    const data = await tenantsApi.getList(Object.keys(params).length > 0 ? params : undefined) as unknown as any[]
    tenants.value = Array.isArray(data) ? data : []
  } catch (error) {
    showToast({ type: 'fail', message: '获取租户列表失败' })
    tenants.value = []
  } finally {
    loading.value = false
  }
}

const handleSearchInput = (value: string) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    fetchTenants(value)
  }, 300)
}

watch(filterStatus, () => {
  fetchTenants()
})

const closeModal = () => {
  showModal.value = false
  editingTenant.value = null
}

const handleSave = async (data: any) => {
  try {
    const saveData: any = {
      name: data.name,
      phone: data.phone,
      idCard: data.idCard,
      houseId: data.houseId,
      rentStart: data.rentStart,
    }
    
    if (data.email) {
      saveData.email = data.email
    }
    if (data.rentEnd) {
      saveData.rentEnd = data.rentEnd
    }
    
    if (editingTenant.value) {
      await tenantsApi.update(editingTenant.value.id, saveData)
      showToast({ type: 'success', message: '更新成功' })
    } else {
      await tenantsApi.create(saveData)
      showToast({ type: 'success', message: '添加成功' })
    }
    closeModal()
    fetchTenants()
  } catch (error: any) {
    showToast({ type: 'fail', message: error.response?.data?.message || '操作失败' })
  }
}

const viewPaymentRecords = (tenant: any) => {
  router.push({ path: '/payments', query: { tenantId: tenant.id, tenantName: tenant.name } })
}

const confirmCheckoutFn = async (tenant: any) => {
  try {
    await showDialog({
      title: '确认退租',
      message: `确定要办理 "${tenant.name}" 的退租手续吗？`,
      showCancelButton: true,
      confirmButtonText: '确认退租',
      cancelButtonText: '取消'
    })
    await tenantsApi.checkout(tenant.id)
    showToast({ type: 'success', message: '退租成功' })
    fetchTenants()
  } catch (error: any) {
    if (error !== 'cancel') {
      showToast({ type: 'fail', message: error.response?.data?.message || '退租失败' })
    }
  }
}

onMounted(() => fetchTenants())
</script>

<style scoped lang="less">
.tenants-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 100px;
  overflow-x: hidden;
}

* {
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.header-icon {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  
  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
}

.header-info {
  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: white;
    margin: 0 0 2px 0;
  }
  
  .page-subtitle {
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    margin: 0;
  }
}

.btn-add {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  svg {
    width: 22px;
    height: 22px;
    color: white;
  }
  
  &:active {
    transform: scale(0.92);
    background: rgba(255,255,255,0.3);
  }
}

.toolbar {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  overflow-x: hidden;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-input);
  border-radius: 10px;
  transition: all 0.2s ease;
  min-width: 0;
  
  &:focus-within {
    background: white;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
  }
  
  .search-icon {
    width: 18px;
    height: 18px;
    color: var(--text-secondary);
    flex-shrink: 0;
  }
  
  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    color: var(--text-main);
    outline: none;
    min-width: 0;
    
    &::placeholder {
      color: var(--text-placeholder);
    }
  }
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--bg-input);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  
  svg {
    width: 14px;
    height: 14px;
    color: var(--text-secondary);
  }
  
  &:active {
    transform: scale(0.97);
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.loading-pulse {
  width: 40px;
  height: 40px;
  background: #7C3AED;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.5; }
}

.tenants-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow-x: hidden;
}

.tenant-card {
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  animation: slideUp 0.4s ease backwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 12px;
}

.tenant-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  
  &.active {
    background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
    color: #5B21B6;
  }
  
  &.inactive {
    background: var(--bg-input);
    color: var(--text-secondary);
  }
}

.card-content {
  padding: 0 16px 16px;
}

.tenant-header {
  margin-bottom: 12px;
  
  .tenant-name {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-main);
    margin: 0 0 4px 0;
  }
  
  .tenant-phone {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  
  svg {
    width: 16px;
    height: 16px;
    color: #7C3AED;
    opacity: 0.6;
  }
}

.card-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px 16px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &.secondary {
    background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
    color: #5B21B6;
    
    &:active {
      background: #7C3AED;
      color: white;
    }
  }
  
  &.danger {
    background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
    color: #DC2626;
    
    &:active {
      background: #DC2626;
      color: white;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  text-align: center;
  
  .empty-visual {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    
    svg {
      width: 40px;
      height: 40px;
      color: #7C3AED;
    }
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-main);
    margin: 0 0 8px 0;
  }
  
  p {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 24px 0;
  }
}

.btn-add-large {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  &:active {
    transform: scale(0.97);
  }
}
</style>