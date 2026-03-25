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

    <div v-if="overdueReminders.length > 0" class="overdue-section">
      <div class="overdue-header">
        <span class="overdue-icon">⚠️</span>
        <span class="overdue-title">逾期提醒 ({{ overdueReminders.length }})</span>
      </div>
      <div class="overdue-list">
        <div v-for="reminder in overdueReminders" :key="reminder.id" class="overdue-item">
          <div class="overdue-content">
            <span class="overdue-tenant">{{ reminder.tenant?.name }} - {{ reminder.tenant?.house?.title }}</span>
            <span class="overdue-days">已逾期 {{ reminder.dueDay }} 号</span>
          </div>
          <button class="btn-action btn-mark" @click="markAsHandled(reminder)">
            标记已处理
          </button>
        </div>
      </div>
    </div>

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
          <van-switch v-model="reminder.enabled" size="20" @change="toggleEnabled(reminder)" />
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

    <ReminderModal
      v-if="showModal"
      :show="showModal"
      :tenants="tenants"
      :editing-reminder="editingReminder"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast, showDialog } from 'vant'
import { remindersApi, tenantsApi } from '@/api'
import ReminderModal from './components/ReminderModal.vue'

const reminders = ref<any[]>([])
const overdueReminders = ref<any[]>([])
const tenants = ref<any[]>([])
const loading = ref(false)
const showModal = ref(false)
const editingReminder = ref<any>(null)

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

const fetchOverdue = async () => {
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
    tenants.value = data
  } catch (error) {
    console.error('获取租户列表失败', error)
  }
}

const addReminder = async () => {
  editingReminder.value = null
  await fetchTenants()
  showModal.value = true
}

const editReminder = async (reminder: any) => {
  editingReminder.value = reminder
  await fetchTenants()
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingReminder.value = null
}

const handleSave = async (data: any) => {
  try {
    if (editingReminder.value) {
      await remindersApi.update(editingReminder.value.id, data)
      showToast({ type: 'success', message: '更新成功' })
    } else {
      await remindersApi.create(data, data.tenantId)
      showToast({ type: 'success', message: '添加成功' })
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
    showToast({ type: 'success', message: '更新成功' })
  } catch (error: any) {
    showToast({ type: 'fail', message: '更新失败' })
    reminder.enabled = !reminder.enabled
  }
}

const deleteReminder = async (reminder: any) => {
  try {
    await showDialog({
      title: '确认删除',
      message: `确定要删除 "${reminder.tenant?.name}" 的提醒吗？`,
      showCancelButton: true,
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await remindersApi.delete(reminder.id)
    showToast({ type: 'success', message: '删除成功' })
    fetchReminders()
  } catch (error: any) {
    if (error !== 'cancel') {
      showToast({ type: 'fail', message: error.response?.data?.message || '删除失败' })
    }
  }
}

const markAsHandled = async (reminder: any) => {
  overdueReminders.value = overdueReminders.value.filter(r => r.id !== reminder.id)
  showToast({ type: 'success', message: '已标记处理' })
}

onMounted(() => {
  fetchReminders()
  fetchOverdue()
})
</script>

<style scoped lang="less">

.reminders-page {
  padding: 16px;
  background: var(--bg-page);
  min-height: 100vh;
  padding-bottom: 60px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0;
}

.page-info h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
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

.btn-icon {
  font-size: 18px;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-icon {
  font-size: 18px;
}

.overdue-section {
  background: #FEF2F2;
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #FECACA;
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
  color: #DC2626;
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
  padding: 12px;
  background: white;
  border-radius: var(--radius-md);
}

.overdue-content {
  display: flex;
  flex-direction: column;
}

.overdue-tenant {
  font-size: 14px;
  color: var(--text-main);
}

.overdue-days {
  font-size: 12px;
  color: #DC2626;
}

.btn-mark {
  padding: 6px 12px;
  background: #DC2626;
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
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
}

.reminder-card.disabled {
  opacity: 0.6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.reminder-tenant {
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
  margin-bottom: 0;
}

.info-row {
  display: flex;
  padding: 8px 0;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
  width: 80px;
}

.info-value {
  font-size: 14px;
  color: var(--text-main);
}

.text-secondary {
  color: var(--text-secondary);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid var(--border-light);
}

.btn-action {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
}

.btn-edit {
  background: var(--primary-light);
  color: var(--primary);
}

.btn-delete {
  background: var(--accent-light);
  color: var(--accent);
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