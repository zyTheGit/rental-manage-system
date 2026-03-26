<template>
  <van-popup
    :show="show"
    position="right"
    :close-on-click-overlay="false"
    class="reminder-modal-popup fullscreen-modal"
    @update:show="handlePopupUpdate"
  >
    <div class="modal-header">
      <div class="header-bg-pattern"></div>
      <div class="header-content">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </div>
        <h2 class="modal-title">{{ editingReminder ? '编辑提醒' : '添加新提醒' }}</h2>
        <p class="modal-subtitle">{{ editingReminder ? '修改提醒设置' : '设置租金缴纳提醒' }}</p>
      </div>
      <button class="btn-close" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div class="modal-body">
      <div class="form-section">
        <div class="section-header">
          <span class="section-icon">👤</span>
          <span class="section-title">租户信息</span>
        </div>
        <div class="section-content">
          <div class="input-group" :class="{ error: errors.tenant }">
            <label class="input-label">选择租户 <span class="required">*</span></label>
            <div class="select-field" :class="{ active: form.tenantId }" @click="showTenantPicker = true">
              <div class="select-left">
                <div v-if="selectedTenant" class="tenant-avatar">
                  {{ selectedTenant.name.charAt(0) }}
                </div>
                <div v-else class="tenant-avatar placeholder">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <path d="M20 8v6M23 11h-6"/>
                  </svg>
                </div>
                <span class="select-value">{{ selectedTenant?.name || '请选择租户' }}</span>
              </div>
              <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            <span v-if="errors.tenant" class="error-text">请选择租户</span>
          </div>
          
          <div v-if="needsEmailInput" class="input-group" :class="{ error: errors.email }">
            <label class="input-label">
              邮箱地址 <span class="required">*</span>
            </label>
            <input
              v-model="form.email"
              type="email"
              class="input-field"
              placeholder="请输入邮箱地址"
              @input="errors.email = false"
            />
            <span v-if="errors.email" class="error-text">{{ emailErrorText }}</span>
          </div>
          
          <div v-if="form.tenantId && form.notifyByEmail && selectedTenant?.email" class="email-preview">
            <div class="email-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            <div class="email-info">
              <span class="email-label">邮箱已配置</span>
              <span class="email-value">{{ selectedTenant.email }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-header">
          <span class="section-icon">📅</span>
          <span class="section-title">提醒设置</span>
        </div>
        <div class="section-content">
          <div class="date-cards">
            <div class="date-card" :class="{ selected: form.reminderDay }" @click="showReminderDayPicker = true">
              <div class="date-card-icon reminder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
                </svg>
              </div>
              <div class="date-card-info">
                <span class="date-card-label">提醒日</span>
                <span class="date-card-value">{{ form.reminderDay ? `每月 ${form.reminderDay} 号` : '点击设置' }}</span>
              </div>
              <svg class="date-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>

            <div class="date-card" :class="{ selected: form.dueDay }" @click="showDueDayPicker = true">
              <div class="date-card-icon due">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                </svg>
              </div>
              <div class="date-card-info">
                <span class="date-card-label">逾期日</span>
                <span class="date-card-value">{{ form.dueDay ? `每月 ${form.dueDay} 号` : '点击设置' }}</span>
              </div>
              <svg class="date-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>

          <div class="date-preview" v-if="form.reminderDay && form.dueDay" :class="{ 'date-error': errors.dateRange }">
            <div class="preview-icon">{{ errors.dateRange ? '⚠️' : '💡' }}</div>
            <div class="preview-text" :class="{ 'error-text': errors.dateRange }">
              <template v-if="errors.dateRange">
                提醒日 <strong>{{ form.reminderDay }}号</strong> 不能大于逾期日 <strong>{{ form.dueDay }}号</strong>
              </template>
              <template v-else>
                将在每月 <strong>{{ form.reminderDay }}号</strong> 发送提醒，
                <strong>{{ form.dueDay }}号</strong> 后视为逾期
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-header">
          <span class="section-icon">📬</span>
          <span class="section-title">通知方式</span>
        </div>
        <div class="section-content">
          <div class="notify-grid">
            <label class="notify-card" :class="{ active: form.notifyByEmail }">
              <input type="checkbox" v-model="form.notifyByEmail" @change="errors.notifyMethod = false; errors.email = false" />
              <div class="notify-icon email">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <div class="notify-info">
                <span class="notify-name">邮件通知</span>
                <span class="notify-desc">发送邮件提醒</span>
              </div>
              <div class="notify-check">
                <svg v-if="form.notifyByEmail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </label>

            <label class="notify-card" :class="{ active: form.notifyBySms }">
              <input type="checkbox" v-model="form.notifyBySms" @change="errors.notifyMethod = false" />
              <div class="notify-icon sms">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                </svg>
              </div>
              <div class="notify-info">
                <span class="notify-name">短信通知</span>
                <span class="notify-desc">发送短信提醒</span>
              </div>
              <div class="notify-check">
                <svg v-if="form.notifyBySms" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </label>
          </div>
          <div v-if="errors.notifyMethod" class="notify-error">
            请至少选择一种通知方式
          </div>
        </div>
      </div>
    </div>

    <div class="form-footer">
      <button class="btn btn-cancel" @click="$emit('close')">取消</button>
      <button class="btn btn-submit" :disabled="!isValid" @click="handleSave">
        <span>{{ editingReminder ? '保存修改' : '添加提醒' }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <van-popup
      :show="showTenantPicker"
      position="bottom"
      round
      class="tenant-picker-popup"
      @update:show="showTenantPicker = $event"
    >
      <div class="picker-header">
        <h3 class="picker-title">选择租户</h3>
        <button class="picker-close" @click="showTenantPicker = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="picker-list">
        <div
          v-for="tenant in tenants"
          :key="tenant.id"
          class="picker-item"
          :class="{ active: form.tenantId === tenant.id }"
          @click="selectTenant(tenant)"
        >
          <div class="picker-avatar">{{ tenant.name.charAt(0) }}</div>
          <div class="picker-info">
            <span class="picker-name">{{ tenant.name }}</span>
            <span class="picker-house">{{ tenant.house?.title || '未绑定房屋' }}</span>
          </div>
          <div class="picker-check" v-if="form.tenantId === tenant.id">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        <div v-if="tenants.length === 0" class="picker-empty">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <p>暂无可选租户</p>
        </div>
      </div>
    </van-popup>

    <van-popup
      :show="showReminderDayPicker"
      position="bottom"
      round
      class="day-picker-popup"
      @update:show="showReminderDayPicker = $event"
    >
      <div class="picker-header">
        <h3 class="picker-title">选择提醒日</h3>
        <button class="picker-close" @click="showReminderDayPicker = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="day-picker-hint">选择每月固定日期发送提醒</div>
      <div class="day-grid">
        <div
          v-for="day in 28"
          :key="'reminder-' + day"
          class="day-item"
          :class="{ active: form.reminderDay === day }"
          @click="selectReminderDay(day)"
        >
          {{ day }}
        </div>
      </div>
    </van-popup>

    <van-popup
      :show="showDueDayPicker"
      position="bottom"
      round
      class="day-picker-popup"
      @update:show="showDueDayPicker = $event"
    >
      <div class="picker-header">
        <h3 class="picker-title">选择逾期日</h3>
        <button class="picker-close" @click="showDueDayPicker = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="day-picker-hint">超过此日期视为逾期</div>
      <div class="day-grid">
        <div
          v-for="day in 31"
          :key="'due-' + day"
          class="day-item"
          :class="{ active: form.dueDay === day }"
          @click="selectDueDay(day)"
        >
          {{ day }}
        </div>
      </div>
    </van-popup>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'

interface Tenant {
  id: number
  name: string
  email?: string
  house?: {
    title: string
  }
}

interface Reminder {
  id?: number
  tenantId: number
  reminderDay: number
  dueDay: number
  notifyByEmail: boolean
  notifyBySms: boolean
  enabled?: boolean
  email?: string
}

const props = defineProps<{
  show: boolean
  tenants: Tenant[]
  editingReminder?: Reminder | null
}>()

const emit = defineEmits<{
  close: []
  save: [data: Reminder]
}>()

const handlePopupUpdate = (val: boolean) => {
  if (!val) {
    emit('close')
  }
}

const showTenantPicker = ref(false)
const showReminderDayPicker = ref(false)
const showDueDayPicker = ref(false)

const errors = ref({
  tenant: false,
  email: false,
  dateRange: false,
  notifyMethod: false
})

const emailErrorText = ref('请输入有效的邮箱地址')

const form = ref<Reminder>({
  tenantId: 0,
  reminderDay: 1,
  dueDay: 5,
  notifyByEmail: true,
  notifyBySms: false,
  enabled: true,
  email: ''
})

const selectedTenant = computed(() => {
  return props.tenants.find(t => t.id === form.value.tenantId)
})

const needsEmailInput = computed(() => {
  return form.value.notifyByEmail && selectedTenant.value && !selectedTenant.value.email
})

const isValid = computed(() => {
  const reminderDay = Number(form.value.reminderDay)
  const dueDay = Number(form.value.dueDay)
  
  if (!form.value.tenantId) return false
  if (reminderDay <= 0 || dueDay <= 0) return false
  if (reminderDay > dueDay) return false
  
  if (!form.value.notifyByEmail && !form.value.notifyBySms) return false
  
  if (form.value.notifyByEmail && selectedTenant.value && !selectedTenant.value.email) {
    if (!form.value.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
      return false
    }
  }
  
  return true
})

watch(() => props.editingReminder, (reminder) => {
  if (reminder) {
    form.value = {
      tenantId: reminder.tenantId,
      reminderDay: reminder.reminderDay,
      dueDay: reminder.dueDay,
      notifyByEmail: reminder.notifyByEmail,
      notifyBySms: reminder.notifyBySms,
      enabled: reminder.enabled,
      email: ''
    }
  } else {
    form.value = {
      tenantId: 0,
      reminderDay: 1,
      dueDay: 5,
      notifyByEmail: true,
      notifyBySms: false,
      enabled: true,
      email: ''
    }
  }
  errors.value = { tenant: false, email: false, dateRange: false, notifyMethod: false }
}, { immediate: true })

const selectTenant = (tenant: Tenant) => {
  form.value.tenantId = tenant.id
  form.value.email = ''
  errors.value.tenant = false
  errors.value.email = false
  showTenantPicker.value = false
}

const selectReminderDay = (day: number) => {
  form.value.reminderDay = day
  showReminderDayPicker.value = false
  
  const dueDay = Number(form.value.dueDay)
  if (dueDay && day > dueDay) {
    errors.value.dateRange = true
  } else {
    errors.value.dateRange = false
  }
}

const selectDueDay = (day: number) => {
  form.value.dueDay = day
  showDueDayPicker.value = false
  
  const reminderDay = Number(form.value.reminderDay)
  if (reminderDay && reminderDay > day) {
    errors.value.dateRange = true
  } else {
    errors.value.dateRange = false
  }
}

const handleSave = () => {
  errors.value = { tenant: false, email: false, dateRange: false, notifyMethod: false }
  
  if (!form.value.tenantId) {
    errors.value.tenant = true
    return
  }
  
  if (!form.value.notifyByEmail && !form.value.notifyBySms) {
    errors.value.notifyMethod = true
    showToast({ type: 'fail', message: '请至少选择一种通知方式' })
    return
  }
  
  if (form.value.notifyByEmail && selectedTenant.value && !selectedTenant.value.email) {
    if (!form.value.email) {
      errors.value.email = true
      emailErrorText.value = '请输入邮箱地址'
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
      errors.value.email = true
      emailErrorText.value = '请输入有效的邮箱地址'
      return
    }
  }
  
  const reminderDay = Number(form.value.reminderDay)
  const dueDay = Number(form.value.dueDay)
  
  if (!reminderDay || !dueDay) {
    showToast({ type: 'fail', message: '请设置提醒日和逾期日' })
    return
  }
  
  if (reminderDay > dueDay) {
    errors.value.dateRange = true
    showToast({ type: 'fail', message: '提醒日不能大于逾期日' })
    return
  }
  
  const saveData = { ...form.value }
  if (selectedTenant.value?.email) {
    delete saveData.email
  }
  emit('save', saveData)
}
</script>

<style scoped lang="less">

.fullscreen-modal {
  width: 100%;
  height: 100%;
}

.reminder-modal-popup {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  position: relative;
  padding: 16px 20px;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-bg-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%);
  pointer-events: none;
}

.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  
  svg {
    width: 20px;
    height: 20px;
    color: white;
  }
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -0.02em;
}

.modal-subtitle {
  display: none;
}

.btn-close {
  position: relative;
  width: 28px;
  height: 28px;
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  flex-shrink: 0;
  z-index: 1;
  
  svg {
    width: 14px;
    height: 14px;
    color: white;
  }
  
  &:active {
    background: rgba(255,255,255,0.25);
    transform: scale(0.95);
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--bg-page);
}

.form-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, var(--bg-input) 0%, rgba(241,245,249,0.5) 100%);
  border-bottom: 1px solid var(--border-light);
}

.section-icon {
  font-size: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.section-content {
  padding: 16px;
}

.input-group {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.error {
    .select-field,
    .input-field {
      border-color: #EF4444;
      background: #FEF2F2;
    }
    
    .input-label {
      color: #EF4444;
    }
  }
}

.input-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.label-hint {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-secondary);
  text-transform: none;
  letter-spacing: 0;
}

.input-field {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-input);
  border: 1.5px solid transparent;
  border-radius: var(--radius-md);
  font-size: 15px;
  color: var(--text-main);
  transition: all 0.2s ease;
  box-sizing: border-box;
  
  &::placeholder {
    color: var(--text-placeholder);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    background: white;
    box-shadow: 0 0 0 3px var(--primary-light);
  }
}

.email-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  border-radius: var(--radius-md);
  margin-top: 12px;
}

.email-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
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

.email-info {
  flex: 1;
}

.email-label {
  display: block;
  font-size: 12px;
  color: #1E40AF;
  margin-bottom: 2px;
}

.email-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.required {
  color: #EF4444;
  font-size: 14px;
  font-weight: 700;
  margin-left: 2px;
}

.error-text {
  display: block;
  font-size: 12px;
  color: #EF4444;
  margin-top: 6px;
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.select-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-input);
  border: 1.5px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.active {
    border-color: var(--primary);
    background: white;
  }
  
  &:active {
    transform: scale(0.99);
  }
}

.select-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tenant-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
  
  &.placeholder {
    background: var(--bg-input);
    
    svg {
      width: 18px;
      height: 18px;
      color: var(--text-secondary);
    }
  }
}

.select-value {
  font-size: 15px;
  color: var(--text-main);
  font-weight: 500;
}

.select-arrow {
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.date-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.date-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  
  &.selected {
    border-color: var(--primary);
    background: white;
  }
  
  &:active {
    transform: scale(0.99);
  }
}

.date-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 22px;
    height: 22px;
    color: white;
  }
  
  &.reminder {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  }
  
  &.due {
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  }
}

.date-card-info {
  flex: 1;
}

.date-card-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.date-card-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.date-card-arrow {
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
}

.date-preview {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-radius: var(--radius-md);
  border-left: 3px solid #F59E0B;
  
  &.date-error {
    background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
    border-left-color: #EF4444;
  }
}

.preview-icon {
  font-size: 18px;
}

.preview-text {
  flex: 1;
  font-size: 13px;
  color: #92400E;
  line-height: 1.5;
  
  &.error-text {
    color: #DC2626;
    
    strong {
      color: #B91C1C;
    }
  }
  
  strong {
    font-weight: 600;
    color: #B45309;
  }
}

.notify-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.notify-error {
  margin-top: 12px;
  padding: 10px 14px;
  background: #FEF2F2;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: #DC2626;
  text-align: center;
}

.notify-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  
  input {
    display: none;
  }
  
  &.active {
    border-color: var(--primary);
    background: var(--primary-light);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.notify-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
  
  &.email {
    background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  }
  
  &.sms {
    background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  }
}

.notify-info {
  text-align: center;
}

.notify-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 2px;
}

.notify-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.notify-check {
  width: 24px;
  height: 24px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 14px;
    height: 14px;
    color: white;
  }
}

.notify-card:not(.active) .notify-check {
  background: var(--border-light);
}

.form-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px 24px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-light);
  flex-shrink: 0;
}

.btn {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:active {
    transform: scale(0.98);
  }
}

.btn-cancel {
  background: var(--bg-input);
  color: var(--text-main);
}

.btn-submit {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  
  svg {
    width: 18px;
    height: 18px;
    transition: transform 0.2s ease;
  }
  
  &:active {
    svg {
      transform: translateX(4px);
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.tenant-picker-popup,
.day-picker-popup {
  max-height: 70vh;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.picker-close {
  width: 28px;
  height: 28px;
  background: var(--bg-input);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 14px;
    height: 14px;
    color: var(--text-secondary);
  }
}

.picker-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 12px 16px;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  background: var(--bg-input);
  transition: all 0.2s ease;
  
  &.active {
    border-color: var(--primary);
    background: var(--primary-light);
  }
  
  &:active {
    transform: scale(0.99);
  }
}

.picker-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.picker-info {
  flex: 1;
}

.picker-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 2px;
}

.picker-house {
  font-size: 12px;
  color: var(--text-secondary);
}

.picker-check {
  width: 24px;
  height: 24px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 14px;
    height: 14px;
    color: white;
  }
}

.picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  
  .empty-icon {
    width: 48px;
    height: 48px;
    background: var(--bg-input);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    
    svg {
      width: 24px;
      height: 24px;
      color: var(--text-placeholder);
    }
  }
  
  p {
    font-size: 14px;
    margin: 0;
  }
}

.day-picker-hint {
  padding: 12px 20px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-input);
  border-bottom: 1px solid var(--border-light);
}

.day-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  padding: 16px;
}

.day-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--bg-input);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
  }
  
  &.active {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
    color: white;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  }
}
</style>