<template>
  <div class="tenants-page">
    <!-- 页面头部：标题 + 新增按钮 -->
    <div class="page-header">
      <div class="page-info">
        <h1 class="page-title">租户管理</h1>
        <p class="page-subtitle">管理租户信息与租房合同</p>
      </div>
      <button class="btn btn-primary ripple-effect" @click="fetchAvailableHouses">
        <span class="btn-icon">➕</span>
        <span>添加租户</span>
      </button>
    </div>

    <!-- 筛选工具栏 -->
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
        <div class="filter-group">
          <select v-model="filterStatus" class="filter-select">
            <option :value="null">全部状态</option>
            <option value="RENTED">已租</option>
            <option value="CHECKED_OUT">已退租</option>
          </select>
        </div>
      </div>
      <button class="btn btn-secondary ripple-effect" @click="exportToCSV" :disabled="exporting">
        <span class="btn-icon">📥</span>
        <span>{{ exporting ? '导出中...' : '导出' }}</span>
      </button>
    </div>

    <!-- 租户列表 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="tenants-list">
      <div
        v-for="tenant in filteredTenants"
        :key="tenant.id"
        class="tenant-card"
      >
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
        <button class="btn btn-primary" @click="fetchAvailableHouses">
          添加第一个租户
        </button>
      </div>
    </div>

    <!-- 状态选择器弹框 -->
    <div v-if="showStatusPicker" class="modal-overlay" @click.self="showStatusPicker = false">
      <div class="picker-content slide-in-bottom">
        <div class="picker-header">
          <button class="btn-link" @click="showStatusPicker = false">取消</button>
          <h3 class="picker-title">选择状态</h3>
          <button class="btn-link btn-primary" @click="confirmStatusFilter">确认</button>
        </div>
        <div class="picker-options">
          <div
            v-for="option in statusOptions"
            :key="option.value"
            class="picker-option"
            :class="{ active: tempFilterStatus === option.value }"
            @click="tempFilterStatus = option.value"
          >
            <span class="option-radio"></span>
            <span class="option-text">{{ option.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 租户弹框 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content slide-in-bottom">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingTenant ? '编辑租户' : '添加租户' }}</h2>
          <button class="btn-close ripple-effect" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">姓名 <span class="required-mark">*</span></label>
            <input v-model="tempForm.name" type="text" class="form-input" placeholder="请输入姓名" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">电话 <span class="required-mark">*</span></label>
              <input v-model="tempForm.phone" type="tel" class="form-input" placeholder="请输入电话" />
            </div>
            <div class="form-group">
              <label class="form-label">身份证号 <span class="required-mark">*</span></label>
              <input v-model="tempForm.idCard" type="text" class="form-input" placeholder="请输入身份证号" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">选择房屋 <span class="required-mark">*</span></label>
            <div class="selector-field" @click="showHousePicker = true">
              <span class="selector-value">{{ houseText || '请选择房屋' }}</span>
              <span class="selector-arrow">▼</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">
              租期起止
              <span class="required-mark">*</span>
              <span class="optional-hint">结束日期选填</span>
            </label>
            <div class="date-range">
              <div class="date-field" @click="showStartDatePicker = true">
                <span class="date-value">{{ tempForm.rentStart || '起始日期' }}</span>
                <span class="date-icon">📅</span>
              </div>
              <div class="date-separator">→</div>
              <div class="date-field" @click="showEndDatePicker = true">
                <span class="date-value">{{ tempForm.rentEnd || '结束日期' }}</span>
                <span class="date-icon">📅</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary ripple-effect" @click="closeModal">取消</button>
          <button class="btn btn-primary ripple-effect" @click="handleSave">
            {{ editingTenant ? '更新' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 房屋选择弹框 -->
    <div v-if="showHousePicker" class="modal-overlay" @click.self="showHousePicker = false">
      <div class="picker-content slide-in-bottom">
        <div class="picker-header">
          <button class="btn-link" @click="showHousePicker = false">取消</button>
          <h3 class="picker-title">选择房屋</h3>
          <button class="btn-link btn-primary" @click="confirmHouse">确认</button>
        </div>
        <div class="picker-options">
          <div
            v-for="house in availableHouses"
            :key="house.id"
            class="picker-option"
            :class="{ active: tempForm.houseId === house.id }"
            @click="tempForm.houseId = house.id"
          >
            <span class="option-radio"></span>
            <div class="option-content">
              <div class="option-title">{{ house.title }}</div>
              <div class="option-subtitle">{{ house.address }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日期选择弹框 -->
    <div v-if="showStartDatePicker || showEndDatePicker" class="modal-overlay" @click.self="closeDatePickers">
      <div class="picker-content slide-in-bottom">
        <div class="picker-header">
          <button class="btn-link" @click="closeDatePickers">取消</button>
          <h3 class="picker-title">选择日期</h3>
        </div>
        <van-date-picker
          :model-value="currentDateValue"
          @confirm="onDateConfirm"
          @cancel="closeDatePickers"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog, showLoadingToast, closeToast } from 'vant'
import dayjs from 'dayjs'
import { tenantsApi } from '@/api'
import { housesApi } from '@/api'
import { formatDateRange } from '@/utils/helpers'
import { DatePicker as VanDatePicker } from 'vant'

const tenants = ref<any[]>([])
const availableHouses = ref<any[]>([])
const showModal = ref(false)
const editingTenant = ref<any>(null)
const tempForm = ref({
  name: '',
  phone: '',
  idCard: '',
  houseId: null as number | null,
  rentStart: '',
  rentEnd: ''
})
const houseText = ref('')
const searchText = ref('')
const filterStatus = ref<string | null>(null)
const tempFilterStatus = ref<string | null>(null)
const showStatusPicker = ref(false)
const showHousePicker = ref(false)
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)
const exporting = ref(false)
const loading = ref(false)
const router = useRouter()

const currentDateValue = computed(() => {
  const dateStr = showStartDatePicker.value ? tempForm.value.rentStart : tempForm.value.rentEnd
  if (dateStr) {
    const parts = dateStr.split('-')
    return parts
  }
  const now = dayjs()
  return [now.format('YYYY'), now.format('MM'), now.format('DD')]
})

const statusOptions = [
  { text: '已租', value: 'RENTED' },
  { text: '已退租', value: 'CHECKED_OUT' }
]

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

const viewPaymentRecords = (tenant: any) => {
  router.push({
    path: '/payments',
    query: { tenantId: tenant.id, tenantName: tenant.name }
  })
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

const fetchAvailableHouses = async () => {
  try {
    const data = await housesApi.getList({ status: 'AVAILABLE' }) as unknown as any[]
    availableHouses.value = data
    editingTenant.value = null

    const now = dayjs()
    const today = now.format('YYYY-MM-DD')

    tempForm.value = {
      name: '',
      phone: '',
      idCard: '',
      houseId: null,
      rentStart: today,
      rentEnd: ''
    }
    houseText.value = ''
    showModal.value = true
  } catch (error) {
    showToast({ type: 'fail', message: '获取可用房屋失败' })
  }
}

const editTenant = async (tenant: any) => {
  try {
    const data = await housesApi.getList() as unknown as any[]
    availableHouses.value = data
    editingTenant.value = tenant

    const now = dayjs()
    const today = now.format('YYYY-MM-DD')

    tempForm.value = {
      name: tenant.name,
      phone: tenant.phone,
      idCard: tenant.idCard,
      houseId: tenant.houseId,
      rentStart: tenant.rentStart ? dayjs(tenant.rentStart).format('YYYY-MM-DD') : today,
      rentEnd: tenant.rentEnd ? dayjs(tenant.rentEnd).format('YYYY-MM-DD') : ''
    }
    if (tenant.house) {
      houseText.value = `${tenant.house.title} - ${tenant.house.address}`
    } else {
      houseText.value = ''
    }
    showModal.value = true
  } catch (error) {
    showToast({ type: 'fail', message: '获取房屋列表失败' })
  }
}

const closeModal = () => {
  showModal.value = false
  editingTenant.value = null
}

const confirmHouse = () => {
  if (tempForm.value.houseId) {
    const house = availableHouses.value.find(h => h.id === tempForm.value.houseId)
    if (house) {
      houseText.value = `${house.title} - ${house.address}`
    }
  }
  showHousePicker.value = false
}

const closeDatePickers = () => {
  showStartDatePicker.value = false
  showEndDatePicker.value = false
}

const onDateConfirm = ({ selectedValues }: any) => {
  if (showStartDatePicker.value) {
    tempForm.value.rentStart = selectedValues.join('-')
  } else {
    // 结束日期支持清空
    tempForm.value.rentEnd = selectedValues?.length ? selectedValues.join('-') : ''
  }
  closeDatePickers()
}

const confirmStatusFilter = () => {
  filterStatus.value = tempFilterStatus.value
  showStatusPicker.value = false
}

const confirmCheckoutFn = (tenant: any) => {
  showConfirmDialog({
    title: '确认退租',
    message: `确认租户 ${tenant.name} 退租？退租后房屋将自动释放。`
  }).then(async () => {
    showLoadingToast({ message: '处理中...', forbidClick: true, duration: 0 })
    try {
      await tenantsApi.checkout(tenant.id)
      closeToast()
      showToast({ type: 'success', message: '退租成功' })
      fetchTenants()
    } catch (error) {
      closeToast()
      showToast({ type: 'fail', message: '退租失败' })
    }
  }).catch(() => {})
}

const handleSave = async () => {
  if (!tempForm.value.name || !tempForm.value.phone || !tempForm.value.idCard || !tempForm.value.houseId || !tempForm.value.rentStart) {
    showToast({ type: 'fail', message: '请填写必填项' })
    return
  }
  showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 })
  try {
    // 构建提交数据，rentEnd 为空时使用 rentStart 作为默认值
    const submitData: any = {
      name: tempForm.value.name,
      phone: tempForm.value.phone,
      idCard: tempForm.value.idCard,
      houseId: tempForm.value.houseId,
      rentStart: tempForm.value.rentStart,
      rentEnd: tempForm.value.rentEnd || tempForm.value.rentStart
    }

    if (editingTenant.value) {
      await tenantsApi.update(editingTenant.value.id, submitData)
      closeToast()
      showToast({ type: 'success', message: '更新成功' })
    } else {
      await tenantsApi.create(submitData)
      closeToast()
      showToast({ type: 'success', message: '创建成功' })
    }
    closeModal()
    fetchTenants()
  } catch (error: any) {
    closeToast()
    showToast({ type: 'fail', message: error.response?.data?.message || '操作失败' })
  }
}

const exportToCSV = () => {
  exporting.value = true
  try {
    const data = filteredTenants.value
    const headers = ['姓名', '电话', '身份证', '房屋', '租期开始', '租期结束', '状态']
    const csvContent = [
      headers.join(','),
      ...data.map((t) => [
        t.name, t.phone, t.idCard,
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
    showToast({ type: 'success', message: '导出成功' })
  } catch (error) {
    showToast({ type: 'fail', message: '导出失败' })
  } finally {
    exporting.value = false
  }
}

onMounted(() => fetchTenants())
</script>

<style scoped>
@import '../../styles/theme.css';

.tenants-page {
  padding: 16px;
  background: var(--bg-page);
  min-height: 100vh;
}

/* 页面头部 */
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
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: white;
  color: var(--text-main);
  border: 2px solid var(--border-light);
}

.btn-secondary:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-icon {
  font-size: 18px;
}

.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect:active {
  transform: scale(0.98);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex: 1;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  flex: 1;
  max-width: 360px;
  transition: var(--transition);
}

.search-box:focus-within {
  background: white;
  box-shadow: 0 0 0 2px var(--primary-light);
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
  color: var(--text-main);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

.filter-select {
  padding: 10px 16px;
  background: var(--bg-input);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-main);
  cursor: pointer;
  transition: var(--transition);
}

.filter-select:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-light);
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

/* 租户卡片 */
.tenants-list {
  display: grid;
  gap: 16px;
}

.tenant-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  border: 1px solid var(--border-light);
}

.tenant-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.tenant-info h3 {
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
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-active {
  background: #DCFCE7;
  color: #166534;
}

.status-inactive {
  background: #FEE2E2;
  color: #991B1B;
}

.card-body {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.info-row.info-highlight {
  padding: 12px 0;
  border-top: 1px solid var(--border-light);
  margin-top: 12px;
  margin-bottom: 0;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
  min-width: 60px;
}

.info-value {
  font-size: 14px;
  color: var(--text-main);
}

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.btn-action {
  flex: 1;
  padding: 10px;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  cursor: pointer;
  transition: var(--transition);
}

.btn-action:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

.btn-action.btn-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-action.btn-view {
  border-color: var(--primary-light);
  color: var(--primary);
}

.btn-action.btn-view:hover {
  background: var(--primary-light);
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

/* 弹框 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-content,
.picker-content {
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  background: var(--bg-card);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideInBottom 0.3s ease-out;
}

@keyframes slideInBottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header,
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title,
.picker-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.btn-link {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.btn-link.btn-primary {
  color: var(--primary);
}

.btn-link:hover {
  color: var(--text-main);
}

.btn-close {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.btn-close:hover {
  background: var(--accent-light);
  color: var(--accent);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-card);
  position: sticky;
  bottom: 0;
  z-index: 1;
  flex-shrink: 0;
}

.modal-footer .btn {
  flex: 1;
  justify-content: center;
}

/* 表单 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: 8px;
}

.required-mark {
  color: var(--accent);
  margin-left: 4px;
  font-size: 16px;
  line-height: 1;
}

.optional-hint {
  font-size: 12px;
  color: var(--text-placeholder);
  font-weight: normal;
  margin-left: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-main);
  background: var(--bg-card);
  transition: var(--transition);
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--bg-input);
}

.form-input::placeholder {
  color: var(--text-placeholder);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.selector-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  cursor: pointer;
  transition: var(--transition);
}

.selector-field:hover {
  border-color: var(--primary);
}

.selector-value {
  font-size: 14px;
  color: var(--text-main);
}

.selector-arrow {
  font-size: 12px;
  color: var(--text-placeholder);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-field {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  cursor: pointer;
  transition: var(--transition);
}

.date-field:hover {
  border-color: var(--primary);
}

.date-value {
  font-size: 14px;
  color: var(--text-main);
}

.date-icon {
  font-size: 16px;
}

.date-separator {
  color: var(--text-placeholder);
  font-size: 18px;
}

/* 选项列表 */
.picker-options {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.picker-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.picker-option:hover {
  background: var(--bg-input);
}

.picker-option.active {
  background: var(--primary-light);
}

.option-radio {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}

.picker-option.active .option-radio {
  border-color: var(--primary);
  background: var(--primary);
}

.picker-option.active .option-radio::after {
  content: '';
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

.option-text,
.option-title {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 500;
}

.option-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 响应式 */
@media (max-width: 768px) {
  .tenants-page {
    padding: 12px;
    padding-bottom: 60px; /* 为 tabbar 预留空间 */
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 12px 0 0;
    margin-bottom: 12px;
  }

  .page-info h1 {
    font-size: 20px;
  }

  .toolbar {
    flex-direction: column;
    gap: 12px;
  }

  .toolbar-left {
    flex-direction: column;
  }

  .search-box {
    max-width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .date-range {
    flex-direction: column;
  }

  .date-separator {
    transform: rotate(90deg);
  }
}
</style>
