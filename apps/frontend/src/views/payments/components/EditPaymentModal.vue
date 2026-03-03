<template>
  <div v-if="payment" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content slide-in-bottom modal-popup">
      <div class="modal-header">
        <h2 class="modal-title">编辑缴费记录</h2>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>
      <div class="detail-content modal-scroll">
        <div class="detail-row">
          <span class="detail-label">租户:</span>
          <span class="detail-value">{{ payment.tenant?.name }} - {{ payment.tenant?.house?.title }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">缴费日期:</span>
          <div @click="showDatePicker = true" class="selector-field">
            <span>{{ paidAtText || '点击选择' }}</span>
            <span class="selector-arrow">›</span>
          </div>
        </div>

        <div class="fee-section">
          <div class="section-title">费用明细</div>
          
          <div class="fee-item" :class="{ 'fee-selected': feeChecks.rent }">
            <div class="fee-header" @click="feeChecks.rent = !feeChecks.rent">
              <label class="fee-check-large" @click.stop>
                <input type="checkbox" v-model="feeChecks.rent" />
                <span class="checkmark-large"></span>
              </label>
              <span class="fee-name">🏠 房租</span>
              <span v-if="feeChecks.rent" class="fee-amount-badge">¥{{ feeAmounts.rent }}</span>
            </div>
            <div v-if="feeChecks.rent" class="fee-input">
              <span class="currency">¥</span>
              <input v-model.number="feeAmounts.rent" type="number" placeholder="金额" />
            </div>
          </div>

          <div class="fee-item" :class="{ 'fee-selected': feeChecks.electric }">
            <div class="fee-header" @click="feeChecks.electric = !feeChecks.electric">
              <label class="fee-check-large" @click.stop>
                <input type="checkbox" v-model="feeChecks.electric" />
                <span class="checkmark-large"></span>
              </label>
              <span class="fee-name">⚡ 电费</span>
              <span v-if="feeChecks.electric" class="fee-amount-badge">¥{{ feeAmounts.electric }}</span>
            </div>
            <div v-if="feeChecks.electric" class="fee-meter">
              <div class="meter-row">
                <span class="meter-label">上期读数</span>
                <span class="meter-value">{{ meterReads.electricStartRead }}</span>
              </div>
              <div class="meter-row">
                <span class="meter-label">本期读数</span>
                <input 
                  v-model.number="meterReads.electricEndRead" 
                  type="number" 
                  class="meter-input" 
                  placeholder="输入"
                  @input="calculateElectricUsage"
                  @blur="calculateElectricUsage"
                />
              </div>
              <div class="meter-row">
                <span class="meter-label">用电量</span>
                <span class="meter-value highlight">{{ meterReads.electricUsage || 0 }} 度</span>
              </div>
              <div class="meter-row total">
                <span class="meter-label">电费金额</span>
                <span class="meter-value price">¥{{ feeAmounts.electric || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="fee-item" :class="{ 'fee-selected': feeChecks.water }">
            <div class="fee-header" @click="feeChecks.water = !feeChecks.water">
              <label class="fee-check-large" @click.stop>
                <input type="checkbox" v-model="feeChecks.water" />
                <span class="checkmark-large"></span>
              </label>
              <span class="fee-name">💧 水费</span>
              <span v-if="feeChecks.water" class="fee-amount-badge">¥{{ feeAmounts.water }}</span>
            </div>
            <div v-if="feeChecks.water" class="fee-meter">
              <div class="meter-row">
                <span class="meter-label">上期读数</span>
                <span class="meter-value">{{ meterReads.waterStartRead }}</span>
              </div>
              <div class="meter-row">
                <span class="meter-label">本期读数</span>
                <input 
                  v-model.number="meterReads.waterEndRead" 
                  type="number" 
                  class="meter-input" 
                  placeholder="输入"
                  @input="calculateWaterUsage"
                  @blur="calculateWaterUsage"
                />
              </div>
              <div class="meter-row">
                <span class="meter-label">用水量</span>
                <span class="meter-value highlight">{{ meterReads.waterUsage || 0 }} 吨</span>
              </div>
              <div class="meter-row total">
                <span class="meter-label">水费金额</span>
                <span class="meter-value price">¥{{ feeAmounts.water || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="summary-section">
            <div class="summary-row total">
              <span>费用合计</span>
              <span class="summary-grand">¥{{ currentTotal }}</span>
            </div>
          </div>
        </div>

        <div class="detail-row">
          <span class="detail-label">备注:</span>
          <textarea v-model="remark" class="edit-input" rows="2" placeholder="备注（选填）"></textarea>
        </div>
      </div>
      <div class="detail-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSave">保存</button>
      </div>
    </div>
  </div>

  <div v-if="showDatePicker" class="modal-overlay" @click.self="showDatePicker = false">
    <div class="picker-content slide-in-bottom">
      <div class="picker-header">
        <button class="btn btn-outline btn-sm" @click="showDatePicker = false">取消</button>
        <h3 class="picker-title">选择日期</h3>
        <button class="btn btn-primary btn-sm" @click="confirmDate">确认</button>
      </div>
      <van-date-picker v-model="datePickerValue" :show-toolbar="false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import type { Payment } from '@/api/payments'

const props = defineProps<{
  payment: Payment | null
}>()

const emit = defineEmits<{
  close: []
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

const currentTotal = computed(() => {
  let total = 0
  if (feeChecks.rent) total += Number(feeAmounts.rent) || 0
  if (feeChecks.electric) total += Number(feeAmounts.electric) || 0
  if (feeChecks.water) total += Number(feeAmounts.water) || 0
  if (feeChecks.other) total += Number(feeAmounts.other) || 0
  return total.toFixed(2)
})

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
  
  meterReads.electricUsage = endNum - start
  // 电费单价假设为 0.6 元/度（可从房屋配置获取）
  feeAmounts.electric = Number((meterReads.electricUsage * 0.6).toFixed(2))
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
  
  meterReads.waterUsage = endNum - start
  // 水费单价假设为 3 元/吨（可从房屋配置获取）
  feeAmounts.water = Number((meterReads.waterUsage * 3).toFixed(2))
}

const confirmDate = () => {
  paidAtText.value = datePickerValue.value.join('-')
  showDatePicker.value = false
}

const handleSave = () => {
  // 验证电费读数
  if (feeChecks.electric && meterReads.electricEndRead < meterReads.electricStartRead) {
    showToast({ type: 'fail', message: `电费结束读数不能小于起始读数` })
    return
  }
  
  // 验证水费读数
  if (feeChecks.water && meterReads.waterEndRead < meterReads.waterStartRead) {
    showToast({ type: 'fail', message: `水费结束读数不能小于起始读数` })
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
    datePickerValue.value = [String(dayjs(val.paidAt).year()), String(dayjs(val.paidAt).month() + 1).padStart(2, '0'), String(dayjs(val.paidAt).date()).padStart(2, '0')]
    
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
      if (item.type === 'RENT') { feeChecks.rent = true; feeAmounts.rent = item.amount }
      else if (item.type === 'ELECTRIC') { 
        feeChecks.electric = true; 
        feeAmounts.electric = item.amount
        meterReads.electricStartRead = item.electricStartRead || 0
        meterReads.electricEndRead = item.electricEndRead || 0
        meterReads.electricUsage = item.electricUsage || 0
      }
      else if (item.type === 'WATER') { 
        feeChecks.water = true; 
        feeAmounts.water = item.amount
        meterReads.waterStartRead = item.waterStartRead || 0
        meterReads.waterEndRead = item.waterEndRead || 0
        meterReads.waterUsage = item.waterUsage || 0
      }
      else if (item.type === 'OTHER') { feeChecks.other = true; feeAmounts.other = item.amount }
    }
  }
}, { immediate: true })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
  padding: 0;
}

.modal-content,
.picker-content {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: var(--bg-card);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  display: flex;
  flex-direction: column;
  animation: slideInBottom 0.3s ease-out;
}

@keyframes slideInBottom {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  background: var(--bg-card);
}

.modal-title { font-size: 18px; font-weight: 600; margin: 0; }

.btn-close {
  width: 32px; height: 32px; border: none; background: var(--bg-input);
  border-radius: var(--radius-sm); font-size: 18px; cursor: pointer;
  flex-shrink: 0;
}

.detail-content { padding: 20px; overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch; }

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}

.detail-label { font-size: 14px; color: var(--text-secondary); }
.detail-value { font-size: 14px; color: var(--text-main); }

.selector-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.selector-arrow { font-size: 12px; color: var(--text-placeholder); }

.fee-section { margin-top: 16px; }

.section-title {
  font-size: 13px; color: var(--text-secondary);
  padding: 10px 16px; background: var(--bg-input);
}

.fee-item {
  background: var(--bg-card); margin-bottom: 8px;
  border-radius: var(--radius-md); overflow: hidden;
  border: 2px solid transparent;
}

.fee-item.fee-selected { border-color: var(--primary); background: var(--primary-light); }

.fee-header {
  display: flex; align-items: center; padding: 14px 16px;
  cursor: pointer; gap: 12px;
}

.fee-name { flex: 1; font-size: 15px; font-weight: 500; }

.fee-amount-badge { font-size: 16px; font-weight: 700; color: var(--primary); }

.fee-check-large { position: relative; width: 26px; height: 26px; }
.fee-check-large input { opacity: 0; width: 100%; height: 100%; position: absolute; cursor: pointer; z-index: 1; }

.checkmark-large {
  position: absolute; top: 0; left: 0;
  width: 26px; height: 26px;
  border: 2px solid var(--border); border-radius: 6px; background: var(--bg-card);
}

.fee-check-large input:checked + .checkmark-large { background: var(--primary); border-color: var(--primary); }
.fee-check-large input:checked + .checkmark-large::after {
  content: '✓'; position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); color: white; font-size: 14px;
}

.fee-input { display: flex; align-items: center; padding: 0 16px 14px; gap: 8px; }
.currency { font-size: 16px; font-weight: 600; color: var(--text-secondary); }
.fee-input input { flex: 1; border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 10px; font-size: 16px; }

.fee-meter { padding: 0 16px 14px; }
.meter-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; align-items: center; }
.meter-label { color: var(--text-secondary); }
.meter-value { color: var(--text-main); font-weight: 500; }
.meter-value.highlight { color: var(--primary); font-weight: 600; }
.meter-value.price { color: var(--accent); font-weight: 700; font-size: 16px; }
.meter-value.total { font-weight: 600; }

.meter-input { 
  width: 100px; 
  padding: 6px 10px; 
  border: 1px solid var(--border-light); 
  border-radius: var(--radius-sm); 
  font-size: 14px; 
  text-align: right;
}
.meter-input:focus {
  border-color: var(--primary);
  outline: none;
}

.summary-section { background: var(--bg-card); border-radius: var(--radius-md); padding: 16px; margin-top: 12px; }
.summary-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
.summary-row.total { border-top: 2px solid var(--primary); margin-top: 8px; padding-top: 12px; }
.summary-grand { font-size: 24px; font-weight: 700; color: var(--primary); }

.edit-input { flex: 1; padding: 8px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); font-size: 14px; }

.detail-footer {
  display: flex; gap: 12px; padding: 20px; border-top: 1px solid var(--border-light);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  background: var(--bg-card);
}

.detail-footer .btn { flex: 1; justify-content: center; }

.btn { display: inline-flex; align-items: center; justify-content: center; padding: 12px 24px; border: none; border-radius: var(--radius-md); font-size: 14px; font-weight: 500; cursor: pointer; }
.btn-primary { background: var(--primary); color: white; }
.btn-secondary { background: white; color: var(--text-main); border: 2px solid var(--border-light); }

.picker-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-light); }
.picker-title { font-size: 18px; font-weight: 600; margin: 0; }
.btn-sm { padding: 8px 16px; font-size: 13px; }
.btn-outline { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); }
</style>