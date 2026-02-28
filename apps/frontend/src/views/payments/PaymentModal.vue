<template>
  <van-popup
    :show="show"
    :close-on-click-overlay="false"
    round
    position="bottom"
    class="payment-modal"
    @update:show="emit('close')"
  >
    <div class="modal-header">
      <h2 class="modal-title">添加缴费记录</h2>
      <button class="btn-close" @click="closeModal">✕</button>
    </div>

    <div class="modal-scroll">
      <div class="form-section">
        <div class="section-label">选择租户</div>
        <div class="tenant-selector" @click="showTenantPicker = true">
          <div class="tenant-info">
            <span class="tenant-avatar">👤</span>
            <span class="tenant-name">{{ tenantText || '点击选择租户' }}</span>
          </div>
          <span class="selector-arrow">›</span>
        </div>
      </div>

      <div class="form-section">
        <div class="section-label">缴费时间</div>
        <div class="date-selector" @click="showDateTimePicker = true">
          <span class="date-icon">📅</span>
          <span class="date-value">{{ paidAtText || '选择日期' }}</span>
        </div>
      </div>

      <div class="form-section">
        <div class="section-label">缴费类型 <span class="hint">可多选</span></div>
        <div class="type-grid">
          <div
            v-for="t in typeOptions"
            :key="t.value"
            class="type-card"
            :class="{ active: selectedTypes.includes(t.value), [t.class]: true }"
            @click="toggleType(t.value)"
          >
            <span class="type-icon">{{ t.icon }}</span>
            <span class="type-name">{{ t.text }}</span>
            <span v-if="selectedTypes.includes(t.value)" class="check-mark">✓</span>
          </div>
        </div>
      </div>

      <template v-for="(item, index) in form.items" :key="index">
        <div v-if="item.type" class="item-panel">
          <div class="panel-header">
            <span class="panel-type" :class="getTypeClass(item.type)">
              {{ getTypeIcon(item.type) }} {{ getTypeText(item.type) }}
            </span>
            <button class="btn-remove" @click="removeItem(index)">移除</button>
          </div>
          
          <div class="panel-body">
            <div class="amount-row">
              <span class="amount-label">金额</span>
              <div class="amount-input-wrap">
                <span class="currency">¥</span>
                <input
                  v-model.number="item.amount"
                  type="number"
                  class="amount-input"
                  placeholder="0.00"
                  @input="recalculateTotal"
                />
              </div>
            </div>

            <template v-if="item.type === 'ELECTRIC'">
              <div class="meter-section">
                <div class="meter-row">
                  <div class="meter-field">
                    <label>起始读数</label>
                    <input v-model.number="item.electricStartRead" type="number" placeholder="0" @input="calcElectric(index)">
                  </div>
                  <div class="meter-arrow">→</div>
                  <div class="meter-field">
                    <label>结束读数</label>
                    <input v-model.number="item.electricEndRead" type="number" placeholder="0" @input="calcElectric(index)">
                  </div>
                </div>
                <div class="meter-result">
                  <span>用量 <b>{{ item.electricUsage || 0 }}</b> 度</span>
                  <span v-if="item.electricRate">× {{ item.electricRate }} 元/度</span>
                </div>
              </div>
            </template>

            <template v-if="item.type === 'WATER'">
              <div class="meter-section">
                <div class="meter-row">
                  <div class="meter-field">
                    <label>起始读数</label>
                    <input v-model.number="item.waterStartRead" type="number" placeholder="0" @input="calcWater(index)">
                  </div>
                  <div class="meter-arrow">→</div>
                  <div class="meter-field">
                    <label>结束读数</label>
                    <input v-model.number="item.waterEndRead" type="number" placeholder="0" @input="calcWater(index)">
                  </div>
                </div>
                <div class="meter-result">
                  <span>用量 <b>{{ item.waterUsage || 0 }}</b> 吨</span>
                  <span v-if="item.waterRate">× {{ item.waterRate }} 元/吨</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>

      <div class="total-bar">
        <span class="total-label">合计金额</span>
        <span class="total-amount">¥ {{ totalAmount }}</span>
      </div>

      <div class="form-section">
        <div class="section-label">备注 <span class="hint">选填</span></div>
        <textarea
          v-model="form.remark"
          class="remark-input"
          placeholder="添加备注信息..."
          rows="2"
        ></textarea>
      </div>
    </div>

    <div class="modal-footer">
      <van-button round block type="primary" class="btn-save" @click="handleSubmit">
        保存记录
      </van-button>
    </div>

    <van-popup v-model:show="showTenantPicker" position="bottom" round>
      <div class="picker-sheet">
        <div class="picker-header">
          <span>选择租户</span>
          <button class="picker-close" @click="showTenantPicker = false">✕</button>
        </div>
        <div class="picker-list">
          <div
            v-for="tenant in tenantOptions"
            :key="tenant.value"
            class="picker-item"
            :class="{ active: form.tenantId === tenant.value }"
            @click="selectTenant(tenant)"
          >
            <span class="item-avatar">👤</span>
            <div class="item-content">
              <div class="item-name">{{ tenant.text.split(' - ')[0] }}</div>
              <div class="item-house">{{ tenant.text.split(' - ')[1] || '' }}</div>
            </div>
            <span v-if="form.tenantId === tenant.value" class="item-check">✓</span>
          </div>
        </div>
      </div>
    </van-popup>

    <van-popup v-model:show="showDateTimePicker" position="bottom" round>
      <van-date-picker
        v-model="dateValue"
        title="选择缴费日期"
        @confirm="onDateConfirm"
        @cancel="showDateTimePicker = false"
      />
    </van-popup>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import { tenantsApi, housesApi } from '@/api'

const props = defineProps<{
  show: boolean
  tenants?: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
}>()

const form = ref({
  tenantId: null as number | null,
  items: [] as any[],
  paidAt: '',
  remark: ''
})

const showTenantPicker = ref(false)
const showDateTimePicker = ref(false)
const dateValue = ref(['2024', '01', '01'])
const tenantText = ref('')
const paidAtText = ref('')
const lastMeterReads = ref<{ lastWaterEndRead: number; lastElectricEndRead: number } | null>(null)
const houseRates = ref<{ waterRate: number; electricRate: number }>({ waterRate: 0, electricRate: 0 })

const typeOptions = [
  { text: '房租', value: 'RENT', icon: '🏠', class: 'type-rent' },
  { text: '水费', value: 'WATER', icon: '💧', class: 'type-water' },
  { text: '电费', value: 'ELECTRIC', icon: '⚡', class: 'type-electric' },
  { text: '其他', value: 'OTHER', icon: '📝', class: 'type-other' }
]

const tenantOptions = computed(() => {
  return (props.tenants || []).map(tenant => ({
    text: `${tenant.name} - ${tenant.house?.title || ''}`,
    value: tenant.id
  }))
})

const selectedTypes = computed(() => {
  return form.value.items.map(item => item.type).filter(Boolean)
})

const totalAmount = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2)
})

const closeModal = () => emit('close')

const recalculateTotal = () => {}

const getTypeText = (type: string) => typeOptions.find(t => t.value === type)?.text || ''
const getTypeIcon = (type: string) => typeOptions.find(t => t.value === type)?.icon || ''
const getTypeClass = (type: string) => `type-${type.toLowerCase()}`

const toggleType = (type: string) => {
  const index = form.value.items.findIndex(item => item.type === type)
  if (index > -1) {
    form.value.items.splice(index, 1)
  } else {
    const newItem: any = {
      type,
      amount: 0
    }
    if (type === 'ELECTRIC') {
      newItem.electricStartRead = lastMeterReads.value?.lastElectricEndRead || 0
      newItem.electricEndRead = 0
      newItem.electricUsage = 0
      newItem.electricRate = houseRates.value.electricRate
    }
    if (type === 'WATER') {
      newItem.waterStartRead = lastMeterReads.value?.lastWaterEndRead || 0
      newItem.waterEndRead = 0
      newItem.waterUsage = 0
      newItem.waterRate = houseRates.value.waterRate
    }
    form.value.items.push(newItem)
  }
}

const removeItem = (index: number) => {
  form.value.items.splice(index, 1)
}

const calcElectric = (index: number) => {
  const item = form.value.items[index]
  const start = Number(item.electricStartRead) || 0
  const endRaw = item.electricEndRead
  
  // 允许清空
  if (endRaw === null || endRaw === undefined || endRaw === '') {
    item.electricUsage = 0
    item.amount = 0
    return
  }
  
  const end = Number(endRaw)
  if (isNaN(end)) {
    item.electricUsage = 0
    item.amount = 0
    return
  }
  
  if (end < start) {
    showToast({ type: 'fail', message: `当前读数 ${end} 小于上期读数 ${start}，请检查输入` })
    item.electricUsage = 0
    item.amount = 0
  } else {
    item.electricUsage = end - start
    if (item.electricRate > 0) {
      item.amount = Math.round(item.electricUsage * item.electricRate * 100) / 100
    }
  }
}

const calcWater = (index: number) => {
  const item = form.value.items[index]
  const start = Number(item.waterStartRead) || 0
  const endRaw = item.waterEndRead
  
  // 允许清空
  if (endRaw === null || endRaw === undefined || endRaw === '') {
    item.waterUsage = 0
    item.amount = 0
    return
  }
  
  const end = Number(endRaw)
  if (isNaN(end)) {
    item.waterUsage = 0
    item.amount = 0
    return
  }
  
  if (end < start) {
    showToast({ type: 'fail', message: `当前读数 ${end} 小于上期读数 ${start}，请检查输入` })
    item.waterUsage = 0
    item.amount = 0
  } else {
    item.waterUsage = end - start
    if (item.waterRate > 0) {
      item.amount = Math.round(item.waterUsage * item.waterRate * 100) / 100
    }
  }
}

const selectTenant = async (tenant: any) => {
  form.value.tenantId = tenant.value
  tenantText.value = tenant.text
  showTenantPicker.value = false
  
  try {
    const meterData = await tenantsApi.getLastMeterReads(tenant.value) as any
    lastMeterReads.value = {
      lastWaterEndRead: meterData.lastWaterEndRead || 0,
      lastElectricEndRead: meterData.lastElectricEndRead || 0
    }
    
    const tenantInfo = props.tenants?.find(t => t.id === tenant.value)
    if (tenantInfo?.house?.id) {
      const house = await housesApi.getById(tenantInfo.house.id) as any
      houseRates.value = {
        waterRate: house.waterRate || 0,
        electricRate: house.electricRate || 0
      }
    }
    
    form.value.items.forEach((item) => {
      if (item.type === 'WATER') {
        item.waterStartRead = lastMeterReads.value?.lastWaterEndRead || 0
        item.waterRate = houseRates.value.waterRate
      }
      if (item.type === 'ELECTRIC') {
        item.electricStartRead = lastMeterReads.value?.lastElectricEndRead || 0
        item.electricRate = houseRates.value.electricRate
      }
    })
  } catch (error) {
    console.error('获取数据失败', error)
  }
}

const onDateConfirm = ({ selectedValues }: any) => {
  const date = dayjs(selectedValues.join('-')).format('YYYY-MM-DD')
  form.value.paidAt = dayjs(date).toISOString()
  paidAtText.value = date
  showDateTimePicker.value = false
}

const handleSubmit = async () => {
  if (!form.value.tenantId) {
    showToast({ type: 'fail', message: '请选择租户' })
    return
  }
  if (form.value.items.length === 0) {
    showToast({ type: 'fail', message: '请添加缴费项目' })
    return
  }
  
  // 验证水电读数
  for (const item of form.value.items) {
    if (item.type === 'ELECTRIC') {
      const start = Number(item.electricStartRead) || 0
      const end = Number(item.electricEndRead) || 0
      if (end < start) {
        showToast({ type: 'fail', message: `电费读数无效，当前读数不能小于${start}` })
        return
      }
    }
    if (item.type === 'WATER') {
      const start = Number(item.waterStartRead) || 0
      const end = Number(item.waterEndRead) || 0
      if (end < start) {
        showToast({ type: 'fail', message: `水费读数无效，当前读数不能小于${start}` })
        return
      }
    }
  }
  
  const items = form.value.items.map(item => ({
    type: item.type,
    amount: Number(item.amount),
    electricStartRead: item.type === 'ELECTRIC' ? Number(item.electricStartRead) || 0 : undefined,
    electricEndRead: item.type === 'ELECTRIC' ? Number(item.electricEndRead) || 0 : undefined,
    electricUsage: item.type === 'ELECTRIC' ? Number(item.electricUsage) || 0 : undefined,
    waterStartRead: item.type === 'WATER' ? Number(item.waterStartRead) || 0 : undefined,
    waterEndRead: item.type === 'WATER' ? Number(item.waterEndRead) || 0 : undefined,
    waterUsage: item.type === 'WATER' ? Number(item.waterUsage) || 0 : undefined
  }))

  emit('save', {
    tenantId: form.value.tenantId,
    items,
    paidAt: form.value.paidAt,
    remark: form.value.remark
  })
}

watch(() => props.show, (show) => {
  if (show) {
    const now = dayjs()
    form.value = { tenantId: null, items: [], paidAt: now.toISOString(), remark: '' }
    dateValue.value = [String(now.year()), String(now.month() + 1).padStart(2, '0'), String(now.date()).padStart(2, '0')]
    paidAtText.value = now.format('YYYY-MM-DD')
    tenantText.value = ''
    lastMeterReads.value = null
    houseRates.value = { waterRate: 0, electricRate: 0 }
  }
}, { immediate: true })
</script>

<style scoped>
@import '@/styles/theme.css';

.payment-modal {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-input);
  border-radius: 50%;
  font-size: 16px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.form-section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hint {
  font-weight: 400;
  color: var(--text-placeholder);
  font-size: 12px;
}

.tenant-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.tenant-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tenant-avatar {
  font-size: 20px;
}

.tenant-name {
  font-size: 15px;
  color: var(--text-main);
}

.selector-arrow {
  color: var(--text-placeholder);
  font-size: 18px;
}

.date-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.date-icon {
  font-size: 18px;
}

.date-value {
  font-size: 15px;
  color: var(--text-main);
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.type-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 8px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 2px solid var(--border-light);
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-card:active {
  transform: scale(0.96);
}

.type-card.active {
  border-color: var(--primary);
  background: var(--primary-light);
}

.type-icon {
  font-size: 24px;
  margin-bottom: 6px;
}

.type-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-main);
}

.check-mark {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-panel {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-input);
}

.panel-type {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-type.type-rent { color: #16a34a; }
.panel-type.type-water { color: #2563eb; }
.panel-type.type-electric { color: #ea580c; }
.panel-type.type-other { color: #6b7280; }

.btn-remove {
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: var(--accent);
  font-size: 12px;
  cursor: pointer;
}

.panel-body {
  padding: 16px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.amount-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.amount-input-wrap {
  display: flex;
  align-items: center;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  padding: 0 12px;
}

.currency {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-right: 4px;
}

.amount-input {
  width: 100px;
  padding: 10px 0;
  border: none;
  background: transparent;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-main);
  text-align: right;
}

.amount-input:focus {
  outline: none;
}

.meter-section {
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  padding: 12px;
}

.meter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.meter-field {
  flex: 1;
}

.meter-field label {
  display: block;
  font-size: 11px;
  color: var(--text-placeholder);
  margin-bottom: 4px;
}

.meter-field input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 16px;
  background: var(--bg-card);
  box-sizing: border-box;
}

.meter-arrow {
  color: var(--text-placeholder);
  font-size: 16px;
  padding-top: 20px;
}

.meter-result {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
  padding-top: 8px;
  border-top: 1px dashed var(--border-light);
}

.meter-result b {
  color: var(--primary);
  font-size: 15px;
}

.total-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  border: 1px solid var(--primary-light);
}

.total-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.total-amount {
  font-size: 26px;
  font-weight: 700;
  color: var(--primary);
}

.remark-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 14px;
  resize: none;
  background: var(--bg-card);
  box-sizing: border-box;
}

.modal-footer {
  padding: 16px 20px 24px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-light);
  flex-shrink: 0;
}

.btn-save {
  font-weight: 600;
  height: 48px;
}

.picker-sheet {
  background: var(--bg-card);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  max-height: 60vh;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
  font-weight: 600;
  color: var(--text-main);
}

.picker-close {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--bg-input);
  border-radius: 50%;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}

.picker-list {
  padding: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.picker-item {
  display: flex;
  align-items: center;
  padding: 14px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s;
}

.picker-item:active,
.picker-item.active {
  background: var(--primary-light);
}

.item-avatar {
  font-size: 20px;
  margin-right: 12px;
}

.item-content {
  flex: 1;
}

.item-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-main);
}

.item-house {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.item-check {
  color: var(--primary);
  font-weight: bold;
  font-size: 16px;
}
</style>