<template>
  <div class="tenants-page">
    <div class="page-header">
      <div class="page-info">
        <h1 class="page-title">租户管理</h1>
        <p class="page-subtitle">管理租户信息与租房合同</p>
      </div>
      <button class="btn btn-primary ripple-effect" @click="openAddModal">
        <span class="btn-icon">➕</span>
        <span>添加租户</span>
      </button>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchText"
            type="text"
            class="search-input"
            placeholder="搜索姓名、电话、身份证..."
          />
        </div>
<div class="filter-group" @click="showStatusPicker = true">
           <div class="filter-select-custom">
             <span>{{ filterStatusText }}</span>
             <span class="filter-arrow">▼</span>
           </div>
         </div>
      </div>
      <button class="btn btn-secondary ripple-effect" @click="exportToCSV" :disabled="exporting">
        <span class="btn-icon">📥</span>
        <span>{{ exporting ? '导出中...' : '导出' }}</span>
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="tenants-list">
      <div v-for="tenant in filteredTenants" :key="tenant.id" class="tenant-card">
        <div class="card-header">
          <div class="tenant-info">
            <h3 class="tenant-name">{{ tenant.name }}</h3>
            <span class="tenant-contact">{{ tenant.phone }}</span>
          </div>
          <span class="status-tag" :class="tenant.status === 'RENTED' ? 'status-active' : 'status-inactive'">
            {{ tenant.status === 'RENTED' ? '已租' : '已退租' }}
          </span>
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="info-label">身份证:</span>
            <span class="info-value">{{ tenant.idCard }}</span>
          </div>
          <div class="info-row" v-if="tenant.house?.title">
            <span class="info-label">房屋:</span>
            <span class="info-value">{{ tenant.house.title }}</span>
          </div>
          <div class="info-row info-highlight">
            <span class="info-label">租期:</span>
            <span class="info-value">{{ formatDateRange(tenant.rentStart, tenant.rentEnd) }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-action btn-view" @click="viewPaymentRecords(tenant)">
            <span>📋 缴费</span>
          </button>
          <button class="btn-action btn-edit" @click="editTenant(tenant)">
            <span>✏️ 编辑</span>
          </button>
          <button
            class="btn-action"
            :class="tenant.status === 'RENTED' ? 'btn-checkout' : 'btn-disabled'"
            @click="confirmCheckoutFn(tenant)"
            :disabled="tenant.status === 'CHECKED_OUT'"
          >
            <span>🔄 退租</span>
          </button>
        </div>
      </div>

      <div v-if="filteredTenants.length === 0" class="empty-state">
        <span class="empty-icon">👥</span>
        <p class="empty-text">暂无租户数据</p>
        <button class="btn btn-primary" @click="openAddModal">
          添加第一个租户
        </button>
      </div>
    </div>

    <TenantModal
      v-if="showModal"
      :show="showModal"
      :tenants="tenants"
      :houses="houses"
      :editing-tenant="editingTenant"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import dayjs from 'dayjs'
import { tenantsApi, housesApi } from '@/api'
import TenantModal from './TenantModal.vue'
import CommonPicker from '@/components/CommonPicker.vue'

const router = useRouter()
const tenants = ref<any[]>([])
const houses = ref<any[]>([])
const loading = ref(false)
const exporting = ref(false)
const searchText = ref('')
const filterStatus = ref<string | null>(null)
const showModal = ref(false)
const editingTenant = ref<any>(null)
const showStatusPicker = ref(false)

const statusOptions = [
  { value: null, label: '全部状态' },
  { value: 'RENTED', label: '已租' },
  { value: 'CHECKED_OUT', label: '已退租' },
]

const filterStatusText = computed(() => {
  const option = statusOptions.find(o => o.value === filterStatus.value)
  return option?.label || '全部状态'
})

const filteredTenants = computed(() => {
  let filtered = tenants.value
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(search) ||
      t.phone.includes(search) ||
      t.idCard.includes(search)
    )
  }
  if (filterStatus.value) {
    filtered = filtered.filter(t => t.status === filterStatus.value)
  }
  return filtered
})

const formatDateRange = (start: string, end: string) => {
  return `${dayjs(start).format('YYYY-MM-DD')} ~ ${dayjs(end).format('YYYY-MM-DD')}`
}

const fetchTenants = async () => {
  loading.value = true
  try {
    const data = await tenantsApi.getList() as unknown as any[]
    tenants.value = data
  } catch (error) {
    showToast({ type: 'fail', message: '获取租户列表失败' })
  } finally {
    loading.value = false
  }
}

const fetchHouses = async () => {
  try {
    const data = await housesApi.getList() as unknown as any[]
    houses.value = data
  } catch (error) {
    console.error('获取房屋列表失败', error)
  }
}

const openAddModal = async () => {
  editingTenant.value = null
  await fetchHouses()
  showModal.value = true
}

const editTenant = async (tenant: any) => {
  editingTenant.value = tenant
  await fetchHouses()
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingTenant.value = null
}

const handleSave = async (data: any) => {
  try {
    if (editingTenant.value) {
      await tenantsApi.update(editingTenant.value.id, data)
      showToast({ type: 'success', message: '更新成功' })
    } else {
      await tenantsApi.create(data)
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

const exportToCSV = () => {
  exporting.value = true
  try {
    const data = filteredTenants.value
    const rows = data.map(t => [
      t.name, t.phone, t.idCard, t.house?.title || '',
      t.rentStart ? dayjs(t.rentStart).format('YYYY-MM-DD') : '',
      t.rentEnd ? dayjs(t.rentEnd).format('YYYY-MM-DD') : '',
      t.status === 'RENTED' ? '已租' : '已退租'
    ].map(v => `"${v || ''}"`).join(','))

    const csvContent = ['姓名,电话,身份证,房屋,租期开始,租期结束,状态', ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `租户列表_${dayjs().format('YYYY-MM-DD')}.csv`
    link.click()
    showToast({ type: 'success', message: '导出成功' })
  } catch (error) {
    showToast({ type: 'fail', message: '导出失败' })
  } finally {
    exporting.value = false
  }
}

onMounted(() => fetchTenants())
</script>

<style scoped lang="less">

.tenants-page {
  padding: 16px;
  background: var(--bg-page);
  min-height: 100vh;
  padding-bottom: 60px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0 0;
  margin-bottom: 16px;
}

.page-info h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 4px 0 0 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-secondary {
  background: white;
  color: var(--text-main);
  border: 2px solid var(--border-light);
}

.btn-secondary:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 18px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.toolbar-left > * {
  min-width: 0;
  flex: 1 1 auto;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  min-width: 0;
}

.search-box .search-input {
  min-width: 0;
  width: 100px;
}

.search-icon {
  font-size: 16px;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}

.filter-group {
  min-width: 0;
  flex: 1 1 auto;
}

.filter-select-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.filter-arrow {
  font-size: 10px;
  color: var(--text-secondary);
  margin-left: 8px;
}

/* 移动端响应式 */
@media (max-width: 640px) {
  .toolbar {
    padding: 10px 12px;
  }

  .toolbar-left {
    flex-wrap: wrap;
    width: 100%;
  }

  .search-box {
    flex: 1 1 100%;
    order: 1;
  }

  .filter-select-custom {
    flex: 0 0 auto;
    order: 2;
  }

  .btn-secondary {
    order: 3;
    width: 100%;
    margin-top: 4px;
  }

  .btn-secondary .btn-icon {
    display: none;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--text-secondary);
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

.tenants-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.tenant-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.tenant-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 4px 0;
}

.tenant-contact {
  font-size: 14px;
  color: var(--text-secondary);
}

.status-tag {
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: #DCFCE7;
  color: #166534;
}

.status-inactive {
  background: #F1F5F9;
  color: #64748B;
}

.card-body {
  margin-bottom: 0;
}

.info-row {
  display: flex;
  padding: 6px 0;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
  width: 60px;
}

.info-value {
  font-size: 14px;
  color: var(--text-main);
  flex: 1;
}

.info-highlight .info-value {
  font-weight: 500;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-page);
}

.btn-action {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action:active {
  transform: scale(0.98);
}

.btn-view {
  background: var(--primary-light);
  color: var(--primary);
}

.btn-edit {
  background: var(--primary-light);
  color: var(--primary);
}

.btn-checkout {
  background: var(--accent-light);
  color: var(--accent);
}

.btn-disabled {
  background: var(--bg-input);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.btn-view {
  background: var(--primary-light);
  color: var(--primary);
}

.btn-edit {
  background: var(--primary-light);
  color: var(--primary);
}

.btn-checkout {
  background: var(--accent-light);
  color: var(--accent);
}

.btn-disabled {
  background: var(--bg-input);
  color: var(--text-placeholder);
  cursor: not-allowed;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 32px 0;
}

.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect:active {
  transform: scale(0.98);
}
</style>