<template>
  <van-popup
    :show="show"
    :close-on-click-overlay="false"
    position="right"
    class="tenant-modal-popup fullscreen-modal"
    @update:show="emit('close')"
  >
    <div class="modal-header">
      <div class="header-bg-pattern"></div>
      <div class="header-content">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <path d="M20 8v6M23 11h-6"/>
          </svg>
        </div>
        <h2 class="modal-title">{{ tenant ? '编辑租户' : '添加新租户' }}</h2>
        <p class="modal-subtitle">{{ tenant ? '修改租户信息' : '填写租户基本信息' }}</p>
      </div>
      <button class="btn-close" @click="closeModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div class="modal-body">
      <div class="form-section">
        <div class="section-header">
          <span class="section-icon">👤</span>
          <span class="section-title">基本信息</span>
        </div>
        <div class="section-content">
          <div class="input-group" :class="{ error: errors.name }">
            <label class="input-label">姓名 <span class="required">*</span></label>
            <input
              v-model="form.name"
              type="text"
              class="input-field"
              placeholder="请输入租户姓名"
              @focus="errors.name = false"
            />
            <span v-if="errors.name" class="error-text">请输入姓名</span>
          </div>
          <div class="input-group" :class="{ error: errors.phone }">
            <label class="input-label">联系电话 <span class="required">*</span></label>
            <input
              v-model="form.phone"
              type="tel"
              class="input-field"
              placeholder="请输入手机号码"
              maxlength="11"
              @focus="errors.phone = false"
            />
            <span v-if="errors.phone" class="error-text">{{ phoneErrorText }}</span>
          </div>
          <div class="input-group" :class="{ error: errors.idCard }">
            <label class="input-label">身份证号 <span class="required">*</span></label>
            <input
              v-model="form.idCard"
              type="text"
              class="input-field"
              placeholder="请输入身份证号码"
              maxlength="18"
              @focus="errors.idCard = false"
            />
            <span v-if="errors.idCard" class="error-text">{{ idCardErrorText }}</span>
          </div>
          <div class="input-group" :class="{ error: errors.email }">
            <label class="input-label">邮箱地址</label>
            <input
              v-model="form.email"
              type="email"
              class="input-field"
              placeholder="请输入邮箱地址（用于接收提醒）"
              @focus="errors.email = false"
            />
            <span v-if="errors.email" class="error-text">{{ emailErrorText }}</span>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-header">
          <span class="section-icon">🏠</span>
          <span class="section-title">房屋信息</span>
        </div>
        <div class="section-content">
          <div class="input-group" :class="{ error: errors.house }">
            <label class="input-label">选择房屋 <span class="required">*</span></label>
            <div class="select-field" :class="{ active: form.houseId }" @click="showHousePicker = true">
              <span class="select-value">{{ houseText || '请选择出租房屋' }}</span>
              <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            <span v-if="errors.house" class="error-text">请选择房屋</span>
          </div>

          <div class="date-grid">
            <div class="input-group half">
              <label class="input-label">租期开始 <span class="required">*</span></label>
              <div class="select-field" :class="{ active: form.rentStart }" @click="showStartDatePicker = true">
                <span class="select-value">{{ form.rentStart || '选择日期' }}</span>
                <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
            <div class="input-group half">
              <label class="input-label">租期结束</label>
              <div class="select-field" :class="{ active: form.rentEnd }" @click="showEndDatePicker = true">
                <span class="select-value">{{ form.rentEnd || '选择日期' }}</span>
                <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>

          <div v-if="form.rentStart && form.rentEnd" class="duration-preview">
            <div class="duration-icon">📅</div>
            <div class="duration-text">
              租期共 <strong>{{ calculateDuration() }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="form-footer">
      <button class="btn btn-cancel" @click="closeModal">取消</button>
      <button class="btn btn-submit" @click="handleSubmit">
        <span>{{ tenant ? '保存修改' : '添加租户' }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <van-popup v-model:show="showHousePicker" position="bottom" round class="house-picker-popup">
      <div class="picker-header">
        <h3 class="picker-title">选择房屋</h3>
        <button class="picker-close" @click="showHousePicker = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="picker-list">
        <div
          v-for="house in availableHouses"
          :key="house.id"
          class="picker-item"
          :class="{ active: form.houseId === house.id }"
          @click="selectHouse(house)"
        >
          <div class="house-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          <div class="picker-info">
            <span class="picker-title-text">{{ house.title }}</span>
            <span class="picker-address">{{ house.address }}</span>
          </div>
          <div class="picker-check" v-if="form.houseId === house.id">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        <div v-if="!availableHouses?.length" class="picker-empty">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path d="M9 22V12h6v10"/>
            </svg>
          </div>
          <p>暂无可选房屋</p>
        </div>
      </div>
    </van-popup>

    <van-popup v-model:show="showStartDatePicker" position="bottom" round>
      <van-date-picker
        v-model="startDateValue"
        title="选择开始日期"
        @confirm="onStartDateConfirm"
        @cancel="showStartDatePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showEndDatePicker" position="bottom" round>
      <van-date-picker
        v-model="endDateValue"
        title="选择结束日期"
        @confirm="onEndDateConfirm"
        @cancel="showEndDatePicker = false"
      />
    </van-popup>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{
  show: boolean
  tenant?: any
  availableHouses?: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
}>()

const form = ref({
  name: '',
  phone: '',
  idCard: '',
  email: '',
  houseId: null as number | null,
  rentStart: '',
  rentEnd: ''
})

const errors = ref({
  name: false,
  phone: false,
  idCard: false,
  email: false,
  house: false
})

const phoneErrorText = ref('请输入手机号码')
const idCardErrorText = ref('请输入身份证号')
const emailErrorText = ref('请输入邮箱地址')

const showHousePicker = ref(false)
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)
const startDateValue = ref(['1970', '01', '01'])
const endDateValue = ref(['1970', '01', '01'])

const houseText = ref('')

const closeModal = () => {
  emit('close')
}

const calculateDuration = () => {
  if (!form.value.rentStart || !form.value.rentEnd) return ''
  const start = dayjs(form.value.rentStart)
  const end = dayjs(form.value.rentEnd)
  const months = end.diff(start, 'month')
  const days = end.diff(start.add(months, 'month'), 'day')
  let result = ''
  if (months > 0) result += `${months}个月`
  if (days > 0) result += `${days}天`
  return result || '1天'
}

const selectHouse = (house: any) => {
  form.value.houseId = house.id
  houseText.value = `${house.title} - ${house.address}`
  errors.value.house = false
  showHousePicker.value = false
}

const onStartDateConfirm = ({ selectedValues }: any) => {
  form.value.rentStart = selectedValues.join('-')
  showStartDatePicker.value = false
}

const onEndDateConfirm = ({ selectedValues }: any) => {
  form.value.rentEnd = selectedValues.length ? selectedValues.join('-') : ''
  showEndDatePicker.value = false
}

const handleSubmit = () => {
  errors.value = { name: false, phone: false, idCard: false, email: false, house: false }
  
  let hasError = false
  
  if (!form.value.name.trim()) {
    errors.value.name = true
    hasError = true
  }
  
  if (!form.value.phone.trim()) {
    errors.value.phone = true
    phoneErrorText.value = '请输入手机号码'
    hasError = true
  } else if (!/^1[3-9]\d{9}$/.test(form.value.phone)) {
    errors.value.phone = true
    phoneErrorText.value = '请输入有效的手机号码'
    hasError = true
  }
  
  if (!form.value.idCard.trim()) {
    errors.value.idCard = true
    idCardErrorText.value = '请输入身份证号'
    hasError = true
  } else if (!/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(form.value.idCard)) {
    errors.value.idCard = true
    idCardErrorText.value = '请输入有效的身份证号'
    hasError = true
  }
  
  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = true
    emailErrorText.value = '请输入有效的邮箱地址'
    hasError = true
  }
  
  if (!form.value.houseId) {
    errors.value.house = true
    hasError = true
  }
  
  if (!form.value.rentStart) {
    hasError = true
  }
  
  if (hasError) return
  
  emit('save', form.value)
}

watch(() => props.show, (show) => {
  if (show) {
    errors.value = { name: false, phone: false, idCard: false, email: false, house: false }
    
    if (props.tenant) {
      const startDate = props.tenant.rentStart ? dayjs(props.tenant.rentStart) : dayjs()
      const endDate = props.tenant.rentEnd ? dayjs(props.tenant.rentEnd) : dayjs()

      form.value = {
        name: props.tenant.name,
        phone: props.tenant.phone,
        idCard: props.tenant.idCard,
        email: props.tenant.email || '',
        houseId: props.tenant.houseId,
        rentStart: startDate.format('YYYY-MM-DD'),
        rentEnd: endDate.format('YYYY-MM-DD')
      }
      startDateValue.value = [startDate.format('YYYY'), startDate.format('MM'), startDate.format('DD')]
      endDateValue.value = [endDate.format('YYYY'), endDate.format('MM'), endDate.format('DD')]

      if (props.tenant.house) {
        houseText.value = `${props.tenant.house.title} - ${props.tenant.house.address}`
      } else {
        houseText.value = ''
      }
    } else {
      const now = dayjs()
      const today = now.format('YYYY-MM-DD')
      const todayArray = [now.format('YYYY'), now.format('MM'), now.format('DD')]

      form.value = {
        name: '',
        phone: '',
        idCard: '',
        email: '',
        houseId: null,
        rentStart: today,
        rentEnd: ''
      }
      houseText.value = ''
      startDateValue.value = todayArray
      endDateValue.value = todayArray
    }
  }
}, { immediate: true })
</script>

<style scoped lang="less">

.fullscreen-modal {
  width: 100%;
  height: 100%;
}

.tenant-modal-popup {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  position: relative;
  padding: 16px 20px;
  background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
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
  background: rgba(255,255,255,0.15);
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
    .input-field,
    .select-field {
      border-color: #EF4444;
      background: #FEF2F2;
    }
    
    .input-label {
      color: #EF4444;
    }
  }
}

.input-group.half {
  flex: 1;
  margin-bottom: 0;
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
    border-color: #7C3AED;
    background: white;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
  }
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
    border-color: #7C3AED;
    background: white;
  }
  
  &:active {
    transform: scale(0.99);
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

.date-grid {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.duration-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
  border-radius: var(--radius-md);
  border-left: 3px solid #7C3AED;
}

.duration-icon {
  font-size: 18px;
}

.duration-text {
  flex: 1;
  font-size: 13px;
  color: #5B21B6;
  
  strong {
    font-weight: 600;
    color: #6D28D9;
  }
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
  background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  
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
}

.house-picker-popup {
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
    border-color: #7C3AED;
    background: #EDE9FE;
  }
  
  &:active {
    transform: scale(0.99);
  }
}

.house-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 20px;
    height: 20px;
    color: white;
  }
}

.picker-info {
  flex: 1;
}

.picker-title-text {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 2px;
}

.picker-address {
  font-size: 12px;
  color: var(--text-secondary);
}

.picker-check {
  width: 24px;
  height: 24px;
  background: #7C3AED;
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

@media (max-width: 360px) {
  .date-grid {
    flex-direction: column;
    gap: 16px;
    
    .input-group.half {
      width: 100%;
    }
  }
}
</style>