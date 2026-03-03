<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    :close-on-click-overlay="false"
    @update:show="$emit('close')"
  >
    <div class="modal-header">
      <h2 class="modal-title">{{ editingReminder ? '编辑提醒' : '添加提醒' }}</h2>
      <button class="btn-close" @click="$emit('close')">✕</button>
    </div>

    <div class="modal-body">
      <!-- 租户选择 -->
      <div class="form-section">
        <div class="form-row" @click="showTenantPicker = true">
          <span class="form-label">租户</span>
          <span class="form-value">{{ selectedTenant?.name || '点击选择 ›' }}</span>
        </div>
      </div>

      <!-- 提醒设置 -->
      <div class="form-section">
        <div class="section-title">提醒设置</div>
        
        <div class="form-row" @click="showReminderDayPicker = true">
          <span class="form-label">提醒日</span>
          <span class="form-value">{{ form.reminderDay ? `每月 ${form.reminderDay} 号` : '点击选择 ›' }}</span>
        </div>

        <div class="form-row" @click="showDueDayPicker = true">
          <span class="form-label">逾期日</span>
          <span class="form-value">{{ form.dueDay ? `每月 ${form.dueDay} 号` : '点击选择 ›' }}</span>
        </div>
      </div>

      <!-- 通知方式 -->
      <div class="form-section">
        <div class="section-title">通知方式</div>
        
        <div class="notify-options">
          <label class="notify-option" :class="{ active: form.notifyByEmail }">
            <input type="checkbox" v-model="form.notifyByEmail" />
            <span class="notify-check">
              <span v-if="form.notifyByEmail">✓</span>
            </span>
            <span class="notify-icon">📧</span>
            <span class="notify-text">邮件通知</span>
          </label>

          <label class="notify-option" :class="{ active: form.notifyBySms }">
            <input type="checkbox" v-model="form.notifyBySms" />
            <span class="notify-check">
              <span v-if="form.notifyBySms">✓</span>
            </span>
            <span class="notify-icon">💬</span>
            <span class="notify-text">短信通知</span>
          </label>
        </div>
      </div>

      <!-- 保存按钮 -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="!isValid">
          保存
        </button>
      </div>
    </div>

    <!-- 租户选择器 -->
    <van-popup
      :show="showTenantPicker"
      position="bottom"
      round
      @update:show="showTenantPicker = $event"
    >
      <div class="picker-header">
        <span class="picker-title">选择租户</span>
        <button class="btn-close" @click="showTenantPicker = false">✕</button>
      </div>
      <div class="picker-options">
        <div
          v-for="tenant in tenants"
          :key="tenant.id"
          class="picker-option"
          :class="{ active: form.tenantId === tenant.id }"
          @click="selectTenant(tenant)"
        >
          <span class="option-radio"></span>
          <div class="option-content">
            <div class="option-title">{{ tenant.name }}</div>
            <div class="option-subtitle">{{ tenant.house?.title || '未绑定房屋' }}</div>
          </div>
        </div>
        <div v-if="tenants.length === 0" class="empty-tenant">
          <span class="empty-icon">👤</span>
          <p>暂无租户</p>
        </div>
      </div>
    </van-popup>

    <!-- 提醒日选择器 -->
    <van-popup
      :show="showReminderDayPicker"
      position="bottom"
      round
      @update:show="showReminderDayPicker = $event"
    >
      <div class="picker-header">
        <span class="picker-title">选择提醒日</span>
        <button class="btn-close" @click="showReminderDayPicker = false">✕</button>
      </div>
      <div class="day-picker">
        <div
          v-for="day in 28"
          :key="'reminder-' + day"
          class="day-option"
          :class="{ active: form.reminderDay === day }"
          @click="selectReminderDay(day)"
        >
          {{ day }} 号
        </div>
      </div>
    </van-popup>

    <!-- 逾期日选择器 -->
    <van-popup
      :show="showDueDayPicker"
      position="bottom"
      round
      @update:show="showDueDayPicker = $event"
    >
      <div class="picker-header">
        <span class="picker-title">选择逾期日</span>
        <button class="btn-close" @click="showDueDayPicker = false">✕</button>
      </div>
      <div class="day-picker">
        <div
          v-for="day in 31"
          :key="'due-' + day"
          class="day-option"
          :class="{ active: form.dueDay === day }"
          @click="selectDueDay(day)"
        >
          {{ day }} 号
        </div>
      </div>
    </van-popup>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Tenant {
  id: number
  name: string
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

const showTenantPicker = ref(false)
const showReminderDayPicker = ref(false)
const showDueDayPicker = ref(false)

const form = ref<Reminder>({
  tenantId: 0,
  reminderDay: 1,
  dueDay: 5,
  notifyByEmail: true,
  notifyBySms: false,
  enabled: true
})

const selectedTenant = computed(() => {
  return props.tenants.find(t => t.id === form.value.tenantId)
})

const isValid = computed(() => {
  return form.value.tenantId > 0 && form.value.reminderDay > 0 && form.value.dueDay > 0
})

// 初始化/编辑时填充数据
watch(() => props.editingReminder, (reminder) => {
  if (reminder) {
    form.value = {
      tenantId: reminder.tenantId,
      reminderDay: reminder.reminderDay,
      dueDay: reminder.dueDay,
      notifyByEmail: reminder.notifyByEmail,
      notifyBySms: reminder.notifyBySms,
      enabled: reminder.enabled
    }
  } else {
    // 重置表单
    form.value = {
      tenantId: 0,
      reminderDay: 1,
      dueDay: 5,
      notifyByEmail: true,
      notifyBySms: false,
      enabled: true
    }
  }
}, { immediate: true })

const selectTenant = (tenant: Tenant) => {
  form.value.tenantId = tenant.id
  showTenantPicker.value = false
}

const selectReminderDay = (day: number) => {
  form.value.reminderDay = day
  showReminderDayPicker.value = false
}

const selectDueDay = (day: number) => {
  form.value.dueDay = day
  showDueDayPicker.value = false
}

const handleSave = () => {
  if (!isValid.value) return
  emit('save', { ...form.value })
}
</script>

<style scoped>
@import '../../../styles/theme.css';

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
}

.modal-body {
  padding: 0 20px 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
  padding-top: 8px;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  cursor: pointer;
}

.form-row:active {
  background: var(--border-light);
}

.form-label {
  font-size: 15px;
  color: var(--text-main);
}

.form-value {
  font-size: 15px;
  color: var(--text-secondary);
}

.notify-options {
  display: flex;
  gap: 12px;
}

.notify-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 2px solid transparent;
}

.notify-option.active {
  border-color: var(--primary);
  background: var(--primary-light);
}

.notify-option input {
  display: none;
}

.notify-check {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
  background: white;
}

.notify-option.active .notify-check {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.notify-icon {
  font-size: 20px;
}

.notify-text {
  font-size: 14px;
  color: var(--text-main);
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-light);
}

.btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-secondary {
  background: var(--bg-input);
  color: var(--text-main);
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
}

.picker-options {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px 20px;
}

.picker-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  cursor: pointer;
  border: 2px solid transparent;
}

.picker-option:hover {
  background: var(--bg-input);
}

.picker-option.active {
  border-color: var(--primary);
  background: var(--primary-light);
}

.option-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border-light);
  margin-right: 12px;
}

.picker-option.active .option-radio {
  border-color: var(--primary);
  position: relative;
}

.picker-option.active .option-radio::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
}

.option-content {
  flex: 1;
}

.option-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
}

.option-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

.empty-tenant {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.day-picker {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  padding: 16px 20px;
  max-height: 300px;
  overflow-y: auto;
}

.day-option {
  padding: 12px 8px;
  text-align: center;
  border-radius: var(--radius-md);
  background: var(--bg-input);
  font-size: 14px;
  color: var(--text-main);
  cursor: pointer;
}

.day-option:hover {
  background: var(--primary-light);
}

.day-option.active {
  background: var(--primary);
  color: white;
  font-weight: 600;
}
</style>