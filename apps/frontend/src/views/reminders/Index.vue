<template>
  <div class="reminders-page">
    <div class="page-header">
      <div class="page-info">
        <h1 class="page-title">缴费提醒</h1>
        <p class="page-subtitle">管理租户缴费提醒配置</p>
      </div>
      <button class="btn btn-primary ripple-effect" @click="addReminder">
        <span class="btn-icon">➕</span>
        <span>添加提醒</span>
      </button>
    </div>

    <!-- 逾期提醒 -->
    <div v-if="overdueReminders.length > 0" class="overdue-section">
      <div class="overdue-header">
        <span class="overdue-icon">⚠️</span>
        <span class="overdue-title">逾期提醒 ({{ overdueReminders.length }})</span>
      </div>
      <div class="overdue-list">
        <div
          v-for="reminder in overdueReminders"
          :key="reminder.id"
          class="overdue-item"
        >
          <div class="overdue-content">
            <span class="overdue-tenant">{{ reminder.tenant?.name }} - {{ reminder.tenant?.house?.title }}</span>
            <span class="overdue-days">已逾期 {{ reminder.dueDay }} 号</span>
          </div>
          <button class="btn-action btn-mark" @click="markAsHandled()">
            标记已处理
          </button>
        </div>
      </div>
    </div>

    <!-- 提醒列表 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="reminders-list">
      <div
        v-for="reminder in reminders"
        :key="reminder.id"
        class="reminder-card"
        :class="{ disabled: !reminder.enabled }"
      >
        <div class="card-header">
          <div class="reminder-info">
            <h3 class="reminder-tenant">{{ reminder.tenant?.name }}</h3>
            <span class="reminder-house">{{ reminder.tenant?.house?.title }}</span>
          </div>
          <van-switch
            v-model="reminder.enabled"
            size="20"
            @change="toggleEnabled(reminder)"
          />
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="info-label">提醒日:</span>
            <span class="info-value">每月 {{ reminder.reminderDay }} 号</span>
          </div>
          <div class="info-row">
            <span class="info-label">逾期日:</span>
            <span class="info-value">每月 {{ reminder.dueDay }} 号</span>
          </div>
          <div class="info-row">
            <span class="info-label">通知方式:</span>
            <span class="info-value">
              <van-tag v-if="reminder.notifyByEmail" type="primary">邮件</van-tag>
              <van-tag v-if="reminder.notifyBySms" type="success">短信</van-tag>
              <span v-if="!reminder.notifyByEmail && !reminder.notifyBySms" class="text-secondary">无</span>
            </span>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-action btn-edit" @click="editReminder(reminder)">
            <span>✏️ 编辑</span>
          </button>
          <button class="btn-action btn-delete" @click="deleteReminder(reminder)">
            <span>🗑️ 删除</span>
          </button>
        </div>
      </div>

      <div v-if="reminders.length === 0" class="empty-state">
        <span class="empty-icon">🔔</span>
        <p class="empty-text">暂无提醒配置</p>
        <button class="btn btn-primary" @click="addReminder">
          添加第一个提醒
        </button>
      </div>
    </div>

    <!-- 添加/编辑弹框 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content slide-in-bottom">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingReminder ? '编辑提醒' : '添加提醒' }}</h2>
          <button class="btn-close ripple-effect" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">选择租户 <span class="required-mark">*</span></label>
            <div class="selector-field" @click="showTenantPicker = true">
              <span class="selector-value">{{ tenantText || '请选择租户' }}</span>
              <span class="selector-arrow">▼</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">提醒日 <span class="required-mark">*</span></label>
              <van-stepper
                v-model="tempForm.reminderDay"
                min="1"
                max="28"
                integer
              />
            </div>
            <div class="form-group">
              <label class="form-label">逾期日 <span class="required-mark">*</span></label>
              <van-stepper
                v-model="tempForm.dueDay"
                min="1"
                max="28"
                integer
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">通知方式</label>
            <div class="checkbox-group">
              <van-checkbox v-model="tempForm.notifyByEmail" icon-size="18px">邮件通知</van-checkbox>
              <van-checkbox v-model="tempForm.notifyBySms" icon-size="18px">短信通知</van-checkbox>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary ripple-effect" @click="closeModal">取消</button>
          <button class="btn btn-primary ripple-effect" @click="handleSave">
            {{ editingReminder ? '更新' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 租户选择弹框 -->
    <div v-if="showTenantPicker" class="modal-overlay" @click.self="showTenantPicker = false">
      <div class="picker-content slide-in-bottom">
        <div class="picker-header">
          <button class="btn-link" @click="showTenantPicker = false">取消</button>
          <h3 class="picker-title">选择租户</h3>
          <button class="btn-link btn-primary" @click="confirmTenant">确认</button>
        </div>
        <div class="picker-options">
          <div
            v-for="tenant in tenants"
            :key="tenant.id"
            class="picker-option"
            :class="{ active: tempForm.tenantId === tenant.id }"
            @click="tempForm.tenantId = tenant.id"
          >
            <span class="option-radio"></span>
            <div class="option-content">
              <div class="option-title">{{ tenant.name }}</div>
              <div class="option-subtitle">{{ tenant.house?.title || '-' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { remindersApi, tenantsApi } from '@/api'

const reminders = ref<any[]>([])
const overdueReminders = ref<any[]>([])
const tenants = ref<any[]>([])
const showModal = ref(false)
const showTenantPicker = ref(false)
const editingReminder = ref<any>(null)
const tempForm = ref({
  tenantId: null as number | null,
  reminderDay: 1,
  dueDay: 5,
  enabled: true,
  notifyByEmail: false,
  notifyBySms: false
})
const tenantText = ref('')
const loading = ref(false)

const fetchReminders = async () => {
  loading.value = true
  try {
    const data = await remindersApi.getList() as unknown as any[]
    reminders.value = data
  } catch (error) {
    showToast({ type: 'fail', message: '获取提醒列表失败' })
  } finally {
    loading.value = false
  }
}

const fetchOverdueReminders = async () => {
  try {
    const data = await remindersApi.getOverdue() as unknown as any[]
    overdueReminders.value = data
  } catch (error) {
    console.error('获取逾期提醒失败', error)
  }
}

const fetchTenants = async () => {
  try {
    const data = await tenantsApi.getList() as unknown as any[]
    tenants.value = data.filter((t: any) => t.status === 'RENTED')
  } catch (error) {
    console.error('获取租户列表失败', error)
  }
}

const addReminder = async () => {
  editingReminder.value = null
  tempForm.value = {
    tenantId: null,
    reminderDay: 1,
    dueDay: 5,
    enabled: true,
    notifyByEmail: false,
    notifyBySms: false
  }
  tenantText.value = ''
  await fetchTenants()
  showModal.value = true
}

const editReminder = (reminder: any) => {
  editingReminder.value = reminder
  tempForm.value = {
    tenantId: reminder.tenantId,
    reminderDay: reminder.reminderDay,
    dueDay: reminder.dueDay,
    enabled: reminder.enabled,
    notifyByEmail: reminder.notifyByEmail,
    notifyBySms: reminder.notifyBySms
  }
  if (reminder.tenant) {
    tenantText.value = `${reminder.tenant.name} - ${reminder.tenant.house?.title || ''}`
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingReminder.value = null
}

const confirmTenant = () => {
  if (tempForm.value.tenantId) {
    const tenant = tenants.value.find(t => t.id === tempForm.value.tenantId)
    if (tenant) {
      tenantText.value = `${tenant.name} - ${tenant.house?.title || ''}`
    }
  }
  showTenantPicker.value = false
}

const handleSave = async () => {
  if (!tempForm.value.tenantId) {
    showToast({ type: 'fail', message: '请选择租户' })
    return
  }

  try {
    if (editingReminder.value) {
      await remindersApi.update(editingReminder.value.id, { ...tempForm.value, tenantId: tempForm.value.tenantId! })
      showToast({ type: 'success', message: '更新成功' })
    } else {
      // 检查该租户是否已有提醒配置
      const existing = await remindersApi.getByTenant(tempForm.value.tenantId)
      if (existing) {
        showToast({ type: 'fail', message: '该租户已有提醒配置' })
        return
      }
      await remindersApi.create({ ...tempForm.value, tenantId: tempForm.value.tenantId! }, tempForm.value.tenantId!)
      showToast({ type: 'success', message: '创建成功' })
    }
    closeModal()
    fetchReminders()
  } catch (error: any) {
    showToast({ type: 'fail', message: error.response?.data?.message || '操作失败' })
  }
}

const toggleEnabled = async (reminder: any) => {
  try {
    await remindersApi.update(reminder.id, { enabled: reminder.enabled })
    showToast({ type: 'success', message: reminder.enabled ? '已启用' : '已禁用' })
  } catch (error) {
    reminder.enabled = !reminder.enabled
    showToast({ type: 'fail', message: '操作失败' })
  }
}

const deleteReminder = async (reminder: any) => {
  showConfirmDialog({
    title: '确认删除',
    message: `确认删除 ${reminder.tenant?.name} 的提醒配置？`
  }).then(async () => {
    try {
      await remindersApi.delete(reminder.id)
      showToast({ type: 'success', message: '删除成功' })
      fetchReminders()
    } catch (error) {
      showToast({ type: 'fail', message: '删除失败' })
    }
  }).catch(() => {})
}

const markAsHandled = async () => {
  showToast({ type: 'success', message: '已标记为已处理' })
  fetchOverdueReminders()
}

onMounted(() => {
  fetchReminders()
  fetchOverdueReminders()
})
</script>

<style scoped>
@import '@/styles/theme.css';

.reminders-page {
  padding: 16px;
  background: var(--bg-page);
  min-height: 100vh;
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
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
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

/* 逾期提醒 */
.overdue-section {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: var(--radius-lg);
  padding: 16px;
  border: 1px solid #f59e0b;
}

.overdue-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.overdue-icon {
  font-size: 20px;
}

.overdue-title {
  font-size: 16px;
  font-weight: 600;
  color: #92400e;
}

.overdue-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.overdue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-radius: var(--radius-sm);
}

.overdue-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.overdue-tenant {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.overdue-days {
  font-size: 12px;
  color: #dc2626;
}

.btn-mark {
  padding: 6px 12px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
}

/* 提醒列表 */
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

.reminders-list {
  display: grid;
  gap: 16px;
}

.reminder-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  border: 1px solid var(--border-light);
}

.reminder-card.disabled {
  opacity: 0.6;
}

.reminder-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.reminder-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 4px 0;
}

.reminder-house {
  font-size: 14px;
  color: var(--text-secondary);
}

.card-body {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
  min-width: 70px;
}

.info-value {
  font-size: 14px;
  color: var(--text-main);
}

.text-secondary {
  color: var(--text-secondary);
  font-size: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
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

.btn-action.btn-delete:hover {
  border-color: #dc2626;
  color: #dc2626;
  background: #fee2e2;
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
}

.btn-link.btn-primary {
  color: var(--primary);
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
}

.modal-footer .btn {
  flex: 1;
  justify-content: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: 8px;
}

.required-mark {
  color: var(--accent);
  margin-left: 4px;
  font-size: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.option-content {
  flex: 1;
}

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
  .reminders-page {
    padding: 12px;
    padding-bottom: 60px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
