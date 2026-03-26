<template>
  <van-popup
    :show="show"
    position="right"
    :close-on-click-overlay="false"
    class="edit-payment-modal-popup fullscreen-modal"
    @update:show="$emit('update:show', $event)"
  >
    <div class="modal-header">
      <div class="header-bg-pattern"></div>
      <div class="header-content">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </div>
        <h2 class="modal-title">编辑缴费记录</h2>
        <p class="modal-subtitle">修改费用明细与读数信息</p>
      </div>
      <button class="btn-close" @click="$emit('update:show', false)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div class="modal-body" v-if="payment">
      <div class="tenant-info-card">
        <div class="tenant-avatar">
          {{ payment.tenant?.name?.charAt(0) || '?' }}
        </div>
        <div class="tenant-details">
          <span class="tenant-name">{{ payment.tenant?.name }}</span>
          <span class="tenant-house">{{ payment.tenant?.house?.title }}</span>
        </div>
        <div class="tenant-badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      </div>

      <div class="form-section">
        <div class="section-header">
          <span class="section-icon">📅</span>
          <span class="section-title">缴费日期</span>
        </div>
        <div class="section-content">
          <div class="select-field active" @click="showDatePicker = true">
            <span class="select-value">{{ paidAtText }}</span>
            <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="form-section fee-section">
        <div class="section-header">
          <span class="section-icon">💰</span>
          <span class="section-title">费用明细</span>
          <span class="section-hint">勾选需要缴费的项目</span>
        </div>
        <div class="section-content fee-content">
          <div class="fee-grid">
            <div 
              class="fee-card" 
              :class="{ selected: feeChecks.rent }"
              @click="toggleFeeCheck('rent')"
            >
              <div class="fee-card-header">
                <div class="fee-icon rent">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                  </svg>
                </div>
                <div class="fee-check">
                  <input type="checkbox" v-model="feeChecks.rent" @click.stop />
                  <span class="checkmark"></span>
                </div>
              </div>
              <div class="fee-card-body">
                <span class="fee-name">房租</span>
                <div v-if="feeChecks.rent" class="fee-amount-input">
                  <span class="currency">¥</span>
                  <input 
                    v-model.number="feeAmounts.rent" 
                    type="number" 
                    placeholder="金额"
                    @click.stop
                  />
                </div>
                <span v-else class="fee-hint">点击勾选</span>
              </div>
            </div>

            <div 
              class="fee-card" 
              :class="{ selected: feeChecks.electric }"
              @click="toggleFeeCheck('electric')"
            >
              <div class="fee-card-header">
                <div class="fee-icon electric">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div class="fee-check">
                  <input type="checkbox" v-model="feeChecks.electric" @click.stop />
                  <span class="checkmark"></span>
                </div>
              </div>
              <div class="fee-card-body">
                <span class="fee-name">电费</span>
                <span v-if="!feeChecks.electric" class="fee-hint">点击配置</span>
                <span v-else class="fee-amount-badge">¥{{ feeAmounts.electric || 0 }}</span>
              </div>
            </div>

            <div 
              class="fee-card" 
              :class="{ selected: feeChecks.water }"
              @click="toggleFeeCheck('water')"
            >
              <div class="fee-card-header">
                <div class="fee-icon water">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z"/>
                  </svg>
                </div>
                <div class="fee-check">
                  <input type="checkbox" v-model="feeChecks.water" @click.stop />
                  <span class="checkmark"></span>
                </div>
              </div>
              <div class="fee-card-body">
                <span class="fee-name">水费</span>
                <span v-if="!feeChecks.water" class="fee-hint">点击配置</span>
                <span v-else class="fee-amount-badge">¥{{ feeAmounts.water || 0 }}</span>
              </div>
            </div>

            <div 
              class="fee-card" 
              :class="{ selected: feeChecks.other }"
              @click="toggleFeeCheck('other')"
            >
              <div class="fee-card-header">
                <div class="fee-icon other">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <div class="fee-check">
                  <input type="checkbox" v-model="feeChecks.other" @click.stop />
                  <span class="checkmark"></span>
                </div>
              </div>
              <div class="fee-card-body">
                <span class="fee-name">其他</span>
                <div v-if="feeChecks.other" class="fee-amount-input" @click.stop>
                  <span class="currency">¥</span>
                  <input 
                    v-model.number="feeAmounts.other" 
                    type="number" 
                    placeholder="金额"
                  />
                </div>
                <span v-else class="fee-hint">自定义</span>
              </div>
            </div>
          </div>

          <div v-if="feeChecks.electric" class="meter-section">
            <div class="meter-header">
              <span class="meter-title">⚡ 电表读数</span>
              <span class="meter-rate">单价: ¥{{ houseInfo.electricRate || 0.6 }}/度</span>
            </div>
            <div class="meter-grid">
              <div class="meter-item">
                <span class="meter-label">上期读数</span>
                <span class="meter-value readonly">{{ meterReads.electricStartRead }}</span>
              </div>
              <div class="meter-item">
                <span class="meter-label">本期读数</span>
                <input
                  v-model.number="meterReads.electricEndRead"
                  type="number"
                  class="meter-input"
                  placeholder="输入"
                  @input="calculateElectricUsage"
                />
              </div>
              <div class="meter-item">
                <span class="meter-label">用电量</span>
                <span class="meter-value usage">{{ meterReads.electricUsage || 0 }} 度</span>
              </div>
              <div class="meter-item total">
                <span class="meter-label">电费金额</span>
                <span class="meter-value price">¥{{ feeAmounts.electric || 0 }}</span>
              </div>
            </div>
          </div>

          <div v-if="feeChecks.water" class="meter-section">
            <div class="meter-header">
              <span class="meter-title">💧 水表读数</span>
              <span class="meter-rate">单价: ¥{{ houseInfo.waterRate || 3 }}/吨</span>
            </div>
            <div class="meter-grid">
              <div class="meter-item">
                <span class="meter-label">上期读数</span>
                <span class="meter-value readonly">{{ meterReads.waterStartRead }}</span>
              </div>
              <div class="meter-item">
                <span class="meter-label">本期读数</span>
                <input
                  v-model.number="meterReads.waterEndRead"
                  type="number"
                  class="meter-input"
                  placeholder="输入"
                  @input="calculateWaterUsage"
                />
              </div>
              <div class="meter-item">
                <span class="meter-label">用水量</span>
                <span class="meter-value usage">{{ meterReads.waterUsage || 0 }} 吨</span>
              </div>
              <div class="meter-item total">
                <span class="meter-label">水费金额</span>
                <span class="meter-value price">¥{{ feeAmounts.water || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-row">
              <span class="summary-label">费用合计</span>
              <div class="summary-total">
                <span class="summary-currency">¥</span>
                <span class="summary-amount">{{ currentTotal }}</span>
              </div>
            </div>
          </div>

          <div class="input-group remark-group">
            <label class="input-label">备注</label>
            <textarea
              v-model="remark"
              class="input-field textarea"
              placeholder="添加备注信息（选填）"
              rows="2"
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <div class="form-footer">
      <button class="btn btn-cancel" @click="$emit('update:show', false)">取消</button>
      <button 
        class="btn btn-submit" 
        :disabled="currentTotalNum <= 0"
        @click="handleSave"
      >
        <span>保存修改</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="datePickerValue"
        title="选择缴费时间"
        @confirm="confirmDate"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import type { Payment } from '@/api/payments'
import { sum, subtract, multiply } from '@/utils/decimal'

const props = defineProps<{
  show: boolean
  payment: Payment | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  save: [data: any]
}>()

const remark = ref('')
const paidAtText = ref('')
const showDatePicker = ref(false)
const datePickerValue = ref([dayjs().format('YYYY'), dayjs().format('MM'), dayjs().format('DD')])

const feeChecks = reactive({ rent: false, electric: false, water: false, other: false })
const feeAmounts = reactive({ rent: 0, electric: 0, water: 0, other: 0 })
const meterReads = reactive({
  electricStartRead: 0, electricEndRead: 0, electricUsage: 0,
  waterStartRead: 0, waterEndRead: 0, waterUsage: 0
})

const houseInfo = reactive({
  electricRate: 0.6,
  waterRate: 3
})

const currentTotal = computed(() => {
  const amounts: number[] = []
  if (feeChecks.rent) amounts.push(Number(feeAmounts.rent) || 0)
  if (feeChecks.electric) amounts.push(Number(feeAmounts.electric) || 0)
  if (feeChecks.water) amounts.push(Number(feeAmounts.water) || 0)
  if (feeChecks.other) amounts.push(Number(feeAmounts.other) || 0)
  return sum(...amounts).toFixed(2)
})

const currentTotalNum = computed(() => {
  let total = 0
  if (feeChecks.rent) total += Number(feeAmounts.rent) || 0
  if (feeChecks.electric) total += Number(feeAmounts.electric) || 0
  if (feeChecks.water) total += Number(feeAmounts.water) || 0
  if (feeChecks.other) total += Number(feeAmounts.other) || 0
  return total
})

const toggleFeeCheck = (type: string) => {
  feeChecks[type as keyof typeof feeChecks] = !feeChecks[type as keyof typeof feeChecks]
}

const calculateElectricUsage = () => {
  const start = meterReads.electricStartRead || 0
  const end = meterReads.electricEndRead
  
  if (end === null || end === undefined || isNaN(Number(end)) || end === 0) {
    meterReads.electricUsage = 0
    feeAmounts.electric = 0
    return
  }
  
  const endNum = Number(end)
  if (isNaN(endNum)) {
    meterReads.electricUsage = 0
    feeAmounts.electric = 0
    return
  }
  
  meterReads.electricUsage = subtract(endNum, start)
  feeAmounts.electric = multiply(meterReads.electricUsage, houseInfo.electricRate)
}

const calculateWaterUsage = () => {
  const start = meterReads.waterStartRead || 0
  const end = meterReads.waterEndRead
  
  if (end === null || end === undefined || isNaN(Number(end)) || end === 0) {
    meterReads.waterUsage = 0
    feeAmounts.water = 0
    return
  }
  
  const endNum = Number(end)
  if (isNaN(endNum)) {
    meterReads.waterUsage = 0
    feeAmounts.water = 0
    return
  }
  
  meterReads.waterUsage = subtract(endNum, start)
  feeAmounts.water = multiply(meterReads.waterUsage, houseInfo.waterRate)
}

const confirmDate = () => {
  const date = dayjs(datePickerValue.value.join('-'))
  paidAtText.value = date.format('YYYY-MM-DD')
  showDatePicker.value = false
}

const handleSave = () => {
  if (feeChecks.electric && meterReads.electricEndRead < meterReads.electricStartRead) {
    showToast({ type: 'fail', message: '电费结束读数不能小于起始读数' })
    return
  }
  
  if (feeChecks.water && meterReads.waterEndRead < meterReads.waterStartRead) {
    showToast({ type: 'fail', message: '水费结束读数不能小于起始读数' })
    return
  }

  const items: any[] = []
  if (feeChecks.rent) items.push({ type: 'RENT', amount: Number(feeAmounts.rent) || 0 })
  if (feeChecks.electric) items.push({ 
    type: 'ELECTRIC', 
    amount: Number(feeAmounts.electric) || 0,
    electricStartRead: meterReads.electricStartRead,
    electricEndRead: meterReads.electricEndRead,
    electricUsage: meterReads.electricUsage
  })
  if (feeChecks.water) items.push({ 
    type: 'WATER', 
    amount: Number(feeAmounts.water) || 0,
    waterStartRead: meterReads.waterStartRead,
    waterEndRead: meterReads.waterEndRead,
    waterUsage: meterReads.waterUsage
  })
  if (feeChecks.other) items.push({ type: 'OTHER', amount: Number(feeAmounts.other) || 0 })

  emit('save', {
    paidAt: new Date(paidAtText.value).toISOString(),
    remark: remark.value,
    items
  })
}

watch(() => props.payment, (val) => {
  if (val) {
    remark.value = val.remark || ''
    paidAtText.value = dayjs(val.paidAt).format('YYYY-MM-DD')
    datePickerValue.value = [
      String(dayjs(val.paidAt).year()), 
      String(dayjs(val.paidAt).month() + 1).padStart(2, '0'), 
      String(dayjs(val.paidAt).date()).padStart(2, '0')
    ]
    
    feeChecks.rent = false
    feeChecks.electric = false
    feeChecks.water = false
    feeChecks.other = false
    feeAmounts.rent = 0
    feeAmounts.electric = 0
    feeAmounts.water = 0
    feeAmounts.other = 0
    meterReads.electricStartRead = 0
    meterReads.electricEndRead = 0
    meterReads.electricUsage = 0
    meterReads.waterStartRead = 0
    meterReads.waterEndRead = 0
    meterReads.waterUsage = 0

    for (const item of val.items || []) {
      if (item.type === 'RENT') { 
        feeChecks.rent = true
        feeAmounts.rent = item.amount 
      }
      else if (item.type === 'ELECTRIC') { 
        feeChecks.electric = true
        feeAmounts.electric = item.amount
        meterReads.electricStartRead = item.electricStartRead || 0
        meterReads.electricEndRead = item.electricEndRead || 0
        meterReads.electricUsage = item.electricUsage || 0
      }
      else if (item.type === 'WATER') { 
        feeChecks.water = true
        feeAmounts.water = item.amount
        meterReads.waterStartRead = item.waterStartRead || 0
        meterReads.waterEndRead = item.waterEndRead || 0
        meterReads.waterUsage = item.waterUsage || 0
      }
      else if (item.type === 'OTHER') { 
        feeChecks.other = true
        feeAmounts.other = item.amount 
      }
    }
  }
}, { immediate: true })
</script>

<style scoped lang="less">
.fullscreen-modal {
  width: 100%;
  height: 100%;
}

.edit-payment-modal-popup {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  position: relative;
  padding: 16px 20px;
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
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
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%);
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

.tenant-info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.tenant-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.tenant-details {
  flex: 1;
}

.tenant-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 2px;
}

.tenant-house {
  font-size: 13px;
  color: var(--text-secondary);
}

.tenant-badge {
  width: 28px;
  height: 28px;
  background: var(--primary-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 16px;
    height: 16px;
    color: var(--primary);
  }
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

.section-hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-secondary);
}

.section-content {
  padding: 16px;
}

.select-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
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

.fee-content {
  padding: 0;
}

.fee-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px;
}

.fee-card {
  background: var(--bg-input);
  border-radius: var(--radius-md);
  padding: 14px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.selected {
    border-color: var(--primary);
    background: var(--primary-light);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.fee-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.fee-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
    color: white;
  }
  
  &.rent {
    background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  }
  
  &.electric {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  }
  
  &.water {
    background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  }
  
  &.other {
    background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
  }
}

.fee-check {
  position: relative;
  width: 24px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    cursor: pointer;
    z-index: 1;
  }
  
  .checkmark {
    position: absolute;
    top: 0;
    left: 0;
    width: 24px;
    height: 24px;
    border: 2px solid var(--border);
    border-radius: 6px;
    background: white;
    transition: all 0.2s ease;
  }
  
  input:checked + .checkmark {
    background: var(--primary);
    border-color: var(--primary);
    
    &::after {
      content: "✓";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: 700;
    }
  }
}

.fee-card-body {
  .fee-name {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 4px;
  }
  
  .fee-hint {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .fee-amount-badge {
    font-size: 15px;
    font-weight: 700;
    color: var(--primary);
  }
}

.fee-amount-input {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  
  .currency {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
  }
  
  input {
    flex: 1;
    width: 100%;
    padding: 8px;
    border: 1px solid var(--border-light);
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
    background: white;
    
    &:focus {
      outline: none;
      border-color: var(--primary);
    }
  }
}

.meter-section {
  padding: 16px;
  border-top: 1px solid var(--border-light);
  background: linear-gradient(135deg, var(--bg-input) 0%, #F8FAFC 100%);
}

.meter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.meter-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.meter-rate {
  font-size: 12px;
  color: var(--text-secondary);
  background: white;
  padding: 4px 10px;
  border-radius: 12px;
}

.meter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.meter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  &.total {
    grid-column: span 2;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background: white;
    padding: 12px;
    border-radius: var(--radius-md);
    margin-top: 4px;
  }
}

.meter-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.meter-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  
  &.readonly {
    color: var(--text-secondary);
    font-size: 14px;
  }
  
  &.usage {
    color: var(--primary);
  }
  
  &.price {
    color: #EF4444;
    font-size: 18px;
  }
}

.meter-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 500;
  background: white;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--primary-light);
  }
}

.summary-card {
  margin: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  border-radius: var(--radius-md);
  color: white;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 14px;
  opacity: 0.9;
}

.summary-total {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.summary-currency {
  font-size: 16px;
  font-weight: 600;
}

.summary-amount {
  font-size: 28px;
  font-weight: 700;
}

.remark-group {
  margin: 0 16px 16px;
}

.input-group {
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
  min-height: 60px;
  line-height: 1.5;
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
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  
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

@media (max-width: 360px) {
  .fee-grid {
    grid-template-columns: 1fr;
  }
  
  .meter-grid {
    grid-template-columns: 1fr;
    
    .meter-item.total {
      grid-column: span 1;
    }
  }
}
</style>