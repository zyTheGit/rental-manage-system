<template>
  <van-popup
    :show="show"
    @update:show="$emit('update:show', $event)"
    position="bottom"
    round
    class="house-modal-popup"
  >
    <div class="modal-header">
      <div class="header-bg-pattern"></div>
      <div class="header-content">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path d="M9 22V12h6v10"/>
          </svg>
        </div>
        <h2 class="modal-title">{{ house ? '编辑房屋' : '添加新房屋' }}</h2>
        <p class="modal-subtitle">{{ house ? '修改房屋信息' : '填写房屋详细信息' }}</p>
      </div>
      <button class="btn-close" @click="handleClose">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div class="form-body">
      <div class="form-section">
        <div class="section-header">
          <span class="section-icon">📍</span>
          <span class="section-title">基本信息</span>
        </div>
        <div class="section-content">
          <div class="input-group" :class="{ error: errors.title }">
            <label class="input-label">房屋标题 <span class="required">*</span></label>
            <input
              v-model="form.title"
              type="text"
              class="input-field"
              placeholder="如：温馨一居室"
              @focus="errors.title = false"
            />
            <span v-if="errors.title" class="error-text">请输入房屋标题</span>
          </div>
          <div class="input-group" :class="{ error: errors.address }">
            <label class="input-label">详细地址 <span class="required">*</span></label>
            <input
              v-model="form.address"
              type="text"
              class="input-field"
              placeholder="请输入完整地址"
              @focus="errors.address = false"
            />
            <span v-if="errors.address" class="error-text">请输入详细地址</span>
          </div>
          <div class="input-row">
            <div class="input-group half" :class="{ error: errors.rent }">
              <label class="input-label">月租金 <span class="required">*</span></label>
              <div class="input-with-suffix">
                <input
                  v-model.number="form.rent"
                  type="number"
                  class="input-field"
                  placeholder="0"
                  @focus="errors.rent = false"
                />
                <span class="input-suffix">元</span>
              </div>
              <span v-if="errors.rent" class="error-text">请输入租金</span>
            </div>
            <div class="input-group half">
              <label class="input-label">押金金额</label>
              <div class="input-with-suffix">
                <input
                  v-model.number="form.deposit"
                  type="number"
                  class="input-field"
                  placeholder="0"
                />
                <span class="input-suffix">元</span>
              </div>
            </div>
          </div>
          <div class="input-group" :class="{ error: errors.area }">
            <label class="input-label">房屋面积 <span class="required">*</span></label>
            <div class="input-with-suffix">
              <input
                v-model.number="form.area"
                type="number"
                class="input-field"
                placeholder="0"
                @focus="errors.area = false"
              />
              <span class="input-suffix">㎡</span>
            </div>
            <span v-if="errors.area" class="error-text">请输入房屋面积</span>
          </div>
          <div class="input-group">
            <label class="input-label">房屋描述</label>
            <textarea
              v-model="form.description"
              class="input-field textarea"
              placeholder="描述房屋特点、配套等信息..."
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-header">
          <span class="section-icon">⚡</span>
          <span class="section-title">水电配置</span>
        </div>
        <div class="section-content">
          <div class="utility-grid">
            <div class="utility-card">
              <div class="utility-icon water">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z"/>
                </svg>
              </div>
              <div class="utility-info">
                <span class="utility-label">水表初始读数</span>
                <input
                  v-model.number="form.waterInitialRead"
                  type="number"
                  class="utility-input"
                  placeholder="0"
                />
              </div>
            </div>
            <div class="utility-card">
              <div class="utility-icon electric">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div class="utility-info">
                <span class="utility-label">电表初始读数</span>
                <input
                  v-model.number="form.electricInitialRead"
                  type="number"
                  class="utility-input"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          
          <button
            v-if="house"
            class="fetch-btn"
            :class="{ loading: fetchingLastRead }"
            :disabled="fetchingLastRead"
            @click="fetchLastRead"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
              <polyline points="21 3 21 9 15 9"/>
            </svg>
            <span>{{ fetchingLastRead ? '获取中...' : '同步上期读数' }}</span>
          </button>

          <div class="input-row rate-row">
            <div class="input-group half">
              <label class="input-label">水费单价</label>
              <div class="input-with-suffix">
                <input
                  v-model.number="form.waterRate"
                  type="number"
                  class="input-field"
                  placeholder="0"
                  step="0.01"
                />
                <span class="input-suffix">元/吨</span>
              </div>
            </div>
            <div class="input-group half">
              <label class="input-label">电费单价</label>
              <div class="input-with-suffix">
                <input
                  v-model.number="form.electricRate"
                  type="number"
                  class="input-field"
                  placeholder="0"
                  step="0.01"
                />
                <span class="input-suffix">元/度</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="form-footer">
      <button class="btn btn-cancel" @click="handleClose">取消</button>
      <button class="btn btn-submit" @click="handleSubmit">
        <span>{{ house ? '保存修改' : '添加房屋' }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { showToast } from 'vant'
import { housesApi } from '@/api'

const props = defineProps<{
  show: boolean
  house?: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
  (e: 'update:show', value: boolean): void
}>()

const fetchingLastRead = ref(false)
const errors = ref({
  title: false,
  address: false,
  rent: false,
  area: false
})
const form = ref({
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

const handleClose = () => {
  emit('update:show', false)
  emit('close')
}

const fetchLastRead = async () => {
  if (!props.house?.id) return
  
  fetchingLastRead.value = true
  try {
    const data = await housesApi.getByIdWithLastRead(props.house.id) as any
    form.value.waterInitialRead = data.lastWaterEndRead || 0
    form.value.electricInitialRead = data.lastElectricEndRead || 0
    showToast({ type: 'success', message: '已同步上期读数' })
  } catch (error) {
    showToast({ type: 'fail', message: '获取读数失败' })
  } finally {
    fetchingLastRead.value = false
  }
}

const handleSubmit = () => {
  errors.value = { title: false, address: false, rent: false, area: false }
  
  let hasError = false
  if (!form.value.title.trim()) {
    errors.value.title = true
    hasError = true
  }
  if (!form.value.address.trim()) {
    errors.value.address = true
    hasError = true
  }
  if (!form.value.rent || form.value.rent <= 0) {
    errors.value.rent = true
    hasError = true
  }
  if (!form.value.area || form.value.area <= 0) {
    errors.value.area = true
    hasError = true
  }
  
  if (hasError) {
    showToast({ type: 'fail', message: '请完善必填信息' })
    return
  }
  emit('save', form.value)
}

watch(() => props.show, (show) => {
  if (show) {
    errors.value = { title: false, address: false, rent: false, area: false }
    if (props.house) {
      form.value = {
        ...props.house,
        waterInitialRead: props.house.waterInitialRead ?? 0,
        electricInitialRead: props.house.electricInitialRead ?? 0,
        waterRate: props.house.waterRate ?? 0,
        electricRate: props.house.electricRate ?? 0
      }
    } else {
      form.value = {
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
      }
    }
  }
}, { immediate: true })
</script>

<style scoped lang="less">

.house-modal-popup {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  position: relative;
  padding: 24px 20px 20px;
  background: linear-gradient(135deg, var(--primary) 0%, #0D5F59 100%);
  overflow: hidden;
}

.header-bg-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%);
  pointer-events: none;
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.15);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  backdrop-filter: blur(10px);
  
  svg {
    width: 26px;
    height: 26px;
    color: white;
  }
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.modal-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  margin: 0;
}

.btn-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  
  svg {
    width: 16px;
    height: 16px;
    color: white;
  }
  
  &:active {
    background: rgba(255,255,255,0.25);
    transform: scale(0.95);
  }
}

.form-body {
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
    .input-field {
      border-color: #EF4444;
      background: #FEF2F2;
      
      &:focus {
        border-color: #EF4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
      }
    }
    
    .input-label {
      color: #EF4444;
    }
  }
}

.error-text {
  display: block;
  font-size: 12px;
  color: #EF4444;
  margin-top: 6px;
  padding-left: 2px;
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
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

.textarea {
  resize: none;
  min-height: 80px;
  line-height: 1.5;
}

.input-row {
  display: flex;
  gap: 12px;
}

.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
  
  .input-field {
    padding-right: 50px;
  }
  
  .input-suffix {
    position: absolute;
    right: 14px;
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
    pointer-events: none;
  }
}

.utility-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.utility-card {
  background: linear-gradient(135deg, var(--bg-input) 0%, #F8FAFC 100%);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border-light);
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.98);
  }
}

.utility-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &.water {
    background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
    color: white;
  }
  
  &.electric {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
    color: white;
  }
}

.utility-info {
  flex: 1;
  min-width: 0;
}

.utility-label {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  font-weight: 500;
}

.utility-input {
  width: 100%;
  padding: 8px 0;
  background: transparent;
  border: none;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: var(--text-placeholder);
    font-weight: 400;
  }
}

.fetch-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, var(--primary-light) 0%, #B8FCE8 100%);
  border: 1.5px dashed var(--primary);
  border-radius: var(--radius-md);
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.98);
    background: linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%);
  }
  
  &.loading {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.rate-row {
  margin-top: 0;
}

.form-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px 24px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-light);
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
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
  
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

@media (max-width: 360px) {
  .utility-grid {
    grid-template-columns: 1fr;
  }
  
  .input-row {
    flex-direction: column;
    gap: 16px;
    
    .input-group.half {
      width: 100%;
    }
  }
}
</style>