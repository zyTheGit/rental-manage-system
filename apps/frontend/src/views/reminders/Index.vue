<template>
  <div class="reminders-page page-container">
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </div>
        <div class="header-info">
          <h1 class="page-title">缴费提醒</h1>
          <p class="page-subtitle">{{ reminders.length }} 个提醒</p>
        </div>
      </div>
      <button class="btn-add" @click="addReminder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>

    <div v-if="overdueReminders.length > 0" class="overdue-banner">
      <div class="overdue-header">
        <div class="overdue-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <div class="overdue-info">
          <span class="overdue-label">逾期提醒</span>
          <span class="overdue-count">{{ overdueReminders.length }} 条需要处理</span>
        </div>
      </div>
      <div class="overdue-list">
        <div v-for="reminder in overdueReminders" :key="reminder.id" class="overdue-item">
          <div class="overdue-content">
            <span class="overdue-tenant">{{ reminder.tenant?.name }}</span>
            <span class="overdue-house">{{ reminder.tenant?.house?.title }}</span>
          </div>
          <button class="btn-handle" @click="markAsHandled(reminder)">
            处理
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-pulse"></div>
      <span>加载中...</span>
    </div>

    <div v-else class="reminders-list">
      <div 
        v-for="(reminder, index) in reminders" 
        :key="reminder.id" 
        class="reminder-card"
        :class="{ disabled: !reminder.enabled }"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div class="card-top">
          <div class="reminder-avatar">
            {{ reminder.tenant?.name?.charAt(0) || '?' }}
          </div>
          <div class="reminder-info">
            <h3 class="reminder-tenant">{{ reminder.tenant?.name }}</h3>
            <span class="reminder-house">{{ reminder.tenant?.house?.title }}</span>
          </div>
          <div class="toggle-switch" @click.stop>
            <van-switch v-model="reminder.enabled" size="20" @change="toggleEnabled(reminder)" />
          </div>
        </div>

        <div class="card-content">
          <div class="schedule-grid">
            <div class="schedule-item">
              <div class="schedule-icon reminder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              </div>
              <div class="schedule-detail">
                <span class="schedule-label">提醒日</span>
                <span class="schedule-value">每月 {{ reminder.reminderDay }} 号</span>
              </div>
            </div>
            <div class="schedule-item">
              <div class="schedule-icon due">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                </svg>
              </div>
              <div class="schedule-detail">
                <span class="schedule-label">逾期日</span>
                <span class="schedule-value">每月 {{ reminder.dueDay }} 号</span>
              </div>
            </div>
          </div>

          <div class="notify-methods">
            <div 
              class="notify-chip" 
              :class="{ active: reminder.notifyByEmail }"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <span>邮件</span>
            </div>
            <div 
              class="notify-chip" 
              :class="{ active: reminder.notifyBySms }"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
              </svg>
              <span>短信</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button v-if="reminder.notifyByEmail" class="action-btn email" @click="sendTestEmail(reminder)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span>测试邮件</span>
          </button>
          <button class="action-btn secondary" @click="editReminder(reminder)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>编辑</span>
          </button>
          <button class="action-btn danger" @click="deleteReminder(reminder)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            <span>删除</span>
          </button>
        </div>
      </div>

      <div v-if="reminders.length === 0" class="empty-state">
        <div class="empty-visual">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </div>
        <h3>还没有提醒</h3>
        <p>设置缴费提醒，不再错过收款日期</p>
        <button class="btn-add-large" @click="addReminder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>添加提醒</span>
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
  
  const existingTenantIds = reminders.value.map(r => r.tenantId)
  tenants.value = tenants.value.filter((t: any) => !existingTenantIds.includes(t.id))
  
  if (tenants.value.length === 0) {
    showToast({ type: 'fail', message: '所有租户都已设置提醒' })
    return
  }
  
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

const sendTestEmail = async (reminder: any) => {
  if (!reminder.tenant?.email) {
    showToast({ type: 'fail', message: '该租户未配置邮箱地址' })
    return
  }
  
  try {
    const result = await remindersApi.sendTestEmail(reminder.tenantId) as any
    showToast({ type: 'success', message: result.message || '测试邮件已发送' })
  } catch (error: any) {
    showToast({ type: 'fail', message: error.response?.data?.message || '发送失败' })
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
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
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

.overdue-banner {
  margin: 16px;
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #FCD34D;
}

.overdue-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(252, 211, 77, 0.5);
}

.overdue-icon {
  width: 36px;
  height: 36px;
  background: #F59E0B;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
    color: white;
  }
}

.overdue-info {
  .overdue-label {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: #92400E;
  }
  
  .overdue-count {
    font-size: 12px;
    color: #B45309;
  }
}

.overdue-list {
  padding: 12px 16px;
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
  border-radius: 10px;
}

.overdue-content {
  .overdue-tenant {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
  }
  
  .overdue-house {
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.btn-handle {
  padding: 8px 16px;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
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
  background: #F59E0B;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.5; }
}

.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow-x: hidden;
}

.reminder-card {
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  animation: slideUp 0.4s ease backwards;
  transition: opacity 0.2s ease;
  
  &.disabled {
    opacity: 0.5;
  }
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
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.reminder-avatar {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.reminder-info {
  flex: 1;
  
  .reminder-tenant {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-main);
    margin: 0 0 2px 0;
  }
  
  .reminder-house {
    font-size: 13px;
    color: var(--text-secondary);
  }
}

.toggle-switch {
  flex-shrink: 0;
}

.card-content {
  padding: 0 16px 16px;
}

.schedule-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--bg-input);
  border-radius: 10px;
}

.schedule-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 18px;
    height: 18px;
    color: white;
  }
  
  &.reminder {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  }
  
  &.due {
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  }
}

.schedule-detail {
  .schedule-label {
    display: block;
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: 2px;
  }
  
  .schedule-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-main);
  }
}

.notify-methods {
  display: flex;
  gap: 8px;
}

.notify-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--bg-input);
  border-radius: 20px;
  font-size: 12px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  
  svg {
    width: 14px;
    height: 14px;
  }
  
  &.active {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    color: #92400E;
    
    svg {
      color: #F59E0B;
    }
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
  
  &.email {
    background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
    color: #1E40AF;
    
    &:active {
      background: #3B82F6;
      color: white;
    }
  }
  
  &.secondary {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    color: #92400E;
    
    &:active {
      background: #F59E0B;
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
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    
    svg {
      width: 40px;
      height: 40px;
      color: #F59E0B;
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
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  &:active {
    transform: scale(0.97);
  }
}
</style>