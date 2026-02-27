<template>
  <div class="houses-page">
    <!-- 页面头部：标题 + 新增按钮 -->
    <div class="page-header">
      <div class="page-info">
        <h1 class="page-title">房屋管理</h1>
        <p class="page-subtitle">管理您的所有房产信息</p>
      </div>
      <button class="btn btn-primary ripple-effect" @click="addHouse">
        <span class="btn-icon">➕</span>
        <span>添加房屋</span>
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
            placeholder="搜索标题、地址..."
          />
        </div>
        <div class="filter-group">
          <select v-model="filterStatus" class="filter-select">
            <option :value="null">全部状态</option>
            <option value="AVAILABLE">空置</option>
            <option value="RENTED">已租</option>
          </select>
        </div>
      </div>
      <button class="btn btn-secondary ripple-effect" @click="exportToCSV" :disabled="exporting">
        <span class="btn-icon">📥</span>
        <span>{{ exporting ? '导出中...' : '导出' }}</span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 房屋列表 -->
    <div v-else class="houses-grid">
      <div
        v-for="house in filteredHouses"
        :key="house.id"
        class="house-card"
      >
        <div class="card-header">
          <span class="house-tag" :class="house.status === 'AVAILABLE' ? 'tag-available' : 'tag-rented'">
            {{ house.status === 'AVAILABLE' ? '空置' : '已租' }}
          </span>
          <h3 class="house-title">{{ house.title }}</h3>
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="info-icon">📍</span>
            <span class="info-text">{{ house.address }}</span>
          </div>
          <div class="info-row">
            <span class="info-icon">📐</span>
            <span class="info-text">{{ house.area }}㎡</span>
          </div>
          <div class="info-row info-highlight">
            <span class="info-icon">💰</span>
            <span class="info-price">¥{{ house.rent.toLocaleString() }}<span class="price-unit">/月</span></span>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-action btn-edit" @click="editHouse(house)">
            <span>✏️ 编辑</span>
          </button>
          <button
            class="btn-action"
            :class="house.status === 'AVAILABLE' ? 'btn-rent' : 'btn-checkout'"
            @click="toggleStatus(house)"
          >
            <span>{{ house.status === 'AVAILABLE' ? '🏠 出租' : '🔄 退租' }}</span>
          </button>
        </div>
      </div>

      <div v-if="filteredHouses.length === 0" class="empty-state">
        <span class="empty-icon">🏚️</span>
        <p class="empty-text">暂无房屋数据</p>
        <button class="btn btn-primary" @click="addHouse">
          添加第一个房屋
        </button>
      </div>
    </div>

    <!-- 房屋弹框 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content slide-in-bottom">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingHouse ? '编辑房屋' : '添加房屋' }}</h2>
          <button class="btn-close ripple-effect" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">标题 <span class="required-mark">*</span></label>
            <input v-model="tempForm.title" type="text" class="form-input" placeholder="请输入房屋标题" />
          </div>
          <div class="form-group">
            <label class="form-label">地址 <span class="required-mark">*</span></label>
            <input v-model="tempForm.address" type="text" class="form-input" placeholder="请输入地址" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">租金 (元) <span class="required-mark">*</span></label>
              <input v-model.number="tempForm.rent" type="number" class="form-input" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">押金 (元)</label>
              <input v-model.number="tempForm.deposit" type="number" class="form-input" placeholder="0" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">面积 (㎡) <span class="required-mark">*</span></label>
            <input v-model.number="tempForm.area" type="number" class="form-input" placeholder="0" />
          </div>
          <div class="utility-section">
            <div class="utility-row">
              <div class="utility-field">
                <label class="form-label">水表初始值 <span class="required-mark">*</span></label>
                <input v-model.number="tempForm.waterInitialRead" type="number" class="form-input" placeholder="0" :readonly="!!editingHouse" />
              </div>
              <div class="utility-rate">
                <label class="form-label">水费单价</label>
                <div class="rate-input-wrapper">
                  <input v-model.number="tempForm.waterRate" type="number" class="form-input" placeholder="3" step="0.01" />
                  <span class="rate-unit">元/吨</span>
                </div>
              </div>
            </div>
            <div class="utility-row">
              <div class="utility-field">
                <label class="form-label">电表初始值 <span class="required-mark">*</span></label>
                <input v-model.number="tempForm.electricInitialRead" type="number" class="form-input" placeholder="0" :readonly="!!editingHouse" />
              </div>
              <div class="utility-rate">
                <label class="form-label">电费单价</label>
                <div class="rate-input-wrapper">
                  <input v-model.number="tempForm.electricRate" type="number" class="form-input" placeholder="1" step="0.01" />
                  <span class="rate-unit">元/度</span>
                </div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea v-model="tempForm.description" class="form-textarea" rows="3" placeholder="请输入描述..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary ripple-effect" @click="closeModal">取消</button>
          <button class="btn btn-primary ripple-effect" @click="handleSave">
            {{ editingHouse ? '更新' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import dayjs from 'dayjs'
import { showToast, showConfirmDialog } from 'vant'
import { housesApi } from '@/api'

const houses = ref<any[]>([])
const showModal = ref(false)
const editingHouse = ref<any>(null)
const tempForm = ref({
  title: '',
  address: '',
  rent: 0,
  deposit: 0,
  area: 0,
  description: '',
  waterInitialRead: 0,
  electricInitialRead: 0,
  waterRate: 0,
  electricRate: 0
})
const searchText = ref('')
const filterStatus = ref<string | null>(null)
const exporting = ref(false)
const loading = ref(false)

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

const fetchHouses = async () => {
  loading.value = true
  try {
    const data = await housesApi.getList() as unknown as any[]
    houses.value = data
  } catch (error) {
    showToast({ type: 'fail', message: '获取房屋列表失败' })
  } finally {
    loading.value = false
  }
}

const addHouse = () => {
  editingHouse.value = null
  tempForm.value = { title: '', address: '', rent: 0, deposit: 0, area: 0, description: '', waterInitialRead: 0, electricInitialRead: 0, waterRate: 3, electricRate: 1 }
  showModal.value = true
}

const editHouse = (house: any) => {
  editingHouse.value = house
  tempForm.value = { ...house }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingHouse.value = null
}

const toggleStatus = async (house: any) => {
  const newStatus = house.status === 'AVAILABLE' ? 'RENTED' : 'AVAILABLE'
  const action = newStatus === 'RENTED' ? '出租' : '退租'
  showConfirmDialog({
    title: `确认${action}`,
    message: `确认将该房屋${action}吗？`
  }).then(async () => {
    await housesApi.updateStatus(house.id, newStatus)
    house.status = newStatus
    showToast({ type: 'success', message: `${action}成功` })
  }).catch(() => {})
}

const handleSave = async () => {
  if (!tempForm.value.title || !tempForm.value.address || !tempForm.value.rent || !tempForm.value.area) {
    showToast({ type: 'fail', message: '请填写必填项' })
    return
  }
  if (tempForm.value.waterInitialRead === null || tempForm.value.waterInitialRead === undefined ||
      tempForm.value.electricInitialRead === null || tempForm.value.electricInitialRead === undefined) {
    showToast({ type: 'fail', message: '请填写水电表初始值' })
    return
  }
  if (!tempForm.value.waterRate || !tempForm.value.electricRate) {
    showToast({ type: 'fail', message: '请填写水电费单价' })
    return
  }
  try {
    if (editingHouse.value) {
      await housesApi.update(editingHouse.value.id, tempForm.value)
      showToast({ type: 'success', message: '更新成功' })
    } else {
      await housesApi.create(tempForm.value)
      showToast({ type: 'success', message: '创建成功' })
    }
    closeModal()
    fetchHouses()
  } catch (error: any) {
    showToast({ type: 'fail', message: error.response?.data?.message || '操作失败' })
  }
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
    showToast({ type: 'success', message: '导出成功' })
  } catch (error) {
    showToast({ type: 'fail', message: '导出失败' })
  } finally {
    exporting.value = false
  }
}

onMounted(() => fetchHouses())
</script>

<style scoped>
@import '../../styles/theme.css';

.houses-page {
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

/* 按钮样式 */
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

/* 工具栏 */
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

/* 加载状态 */
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

/* 房屋网格 */
.houses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

/* 房屋卡片 */
.house-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  border: 1px solid var(--border-light);
}

.house-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.house-tag {
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tag-available {
  background: #DCFCE7;
  color: #166534;
}

.tag-rented {
  background: #FEE2E2;
  color: #991B1B;
}

.house-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
  line-height: 1.4;
}

/* 卡片内容 */
.card-body {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.info-icon {
  font-size: 16px;
  opacity: 0.6;
}

.info-text {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-highlight {
  padding: 12px 0;
  border-top: 1px solid var(--border-light);
  margin-top: 12px;
}

.info-price {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.price-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

/* 卡片操作 */
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

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
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

.modal-content {
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
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
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
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

.section-divider {
  display: flex;
  align-items: center;
  margin: 24px 0 16px;
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-light);
}

.section-title {
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.utility-section {
  background: var(--bg-input);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 20px;
}

.utility-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.utility-row:not(:last-child) {
  margin-bottom: 16px;
}

.utility-field {
  flex: 1;
  min-width: 0;
}

.utility-rate {
  flex: 1;
  min-width: 0;
}

.rate-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-input-wrapper .form-input {
  flex: 1;
}

.rate-unit {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* 响应式 */
@media (max-width: 768px) {
  .houses-page {
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

  .houses-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-footer .btn {
    padding: 14px 24px;
  }
}

@media (min-width: 1024px) {
  .houses-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
  }
}
</style>
