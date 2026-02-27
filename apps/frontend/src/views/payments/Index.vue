<template>
  <div class="payments-page">
    <!-- 页面头部：标题 + 新增按钮 -->
    <div class="page-header">
      <div class="page-info">
        <h1 class="page-title">缴费记录</h1>
        <p class="page-subtitle">管理房租、水电费等缴费记录</p>
      </div>
      <button class="btn btn-primary ripple-effect" @click="fetchTenants">
        <span class="btn-icon">➕</span>
        <span>添加记录</span>
      </button>
    </div>

    <div v-if="filters.tenantId" class="tenant-filter-bar">
      <span class="filter-label">当前筛选租户:</span>
      <span class="filter-value">{{ filters.tenantName }}</span>
      <button class="btn-clear" @click="clearTenantFilter">✕ 清除</button>
    </div>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="filters.searchText"
            type="text"
            class="search-input"
            placeholder="搜索租户姓名..."
          />
        </div>
        <div class="filter-group">
          <select v-model="filters.type" class="filter-select">
            <option :value="null">全部类型</option>
            <option value="RENT">房租</option>
            <option value="WATER">水费</option>
            <option value="ELECTRIC">电费</option>
            <option value="OTHER">其他</option>
          </select>
        </div>
      </div>
      <button class="btn btn-secondary ripple-effect" @click="exportToCSV" :disabled="exporting">
        <span class="btn-icon">📥</span>
        <span>{{ exporting ? '导出中...' : '导出' }}</span>
      </button>
    </div>

    <!-- 日期范围 -->
    <div class="date-range-bar">
      <div class="date-field" @click="showStartDatePicker = true">
        <span class="date-value">{{ filters.startDate || '开始日期' }}</span>
        <span class="date-icon">📅</span>
      </div>
      <span class="date-separator">→</span>
      <div class="date-field" @click="showEndDatePicker = true">
        <span class="date-value">{{ filters.endDate || '结束日期' }}</span>
        <span class="date-icon">📅</span>
      </div>
    </div>

    <!-- 缴费列表 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else class="payments-list">
      <div
        v-for="payment in filteredPayments"
        :key="payment.id"
        class="payment-card"
        @click="viewPaymentDetail(payment)"
      >
        <div class="card-header">
          <div class="payment-info">
            <h3 class="tenant-name">{{ payment.tenant?.name || '-' }}</h3>
            <span class="payment-time">{{ formatPaymentTime(payment.paidAt) }}</span>
          </div>
          <div class="price-section">
            <span class="price">¥{{ formatCurrency(payment.amount || 0, '') }}</span>
          </div>
        </div>

        <div class="card-body">
          <div class="payment-items">
            <span
              v-for="(item, index) in payment.items?.slice(0, 3)"
              :key="index"
              class="payment-item-tag"
              :class="getItemClass(item.type)"
            >
              {{ getTypeLabel(item.type) }} ¥{{ item.amount }}
            </span>
            <span v-if="payment.items?.length > 3" class="more-tag">
              +{{ payment.items.length - 3 }}
            </span>
          </div>
          <div v-if="payment.remark" class="payment-remark">{{ payment.remark }}</div>
        </div>
      </div>

      <div v-if="filteredPayments.length === 0" class="empty-state">
        <span class="empty-icon">💰</span>
        <p class="empty-text">暂无缴费记录</p>
        <button class="btn btn-primary" @click="fetchTenants">
          添加第一笔缴费
        </button>
      </div>
    </div>

    <!-- 日期选择弹框 -->
    <div v-if="showStartDatePicker || showEndDatePicker" class="modal-overlay" @click.self="closeDatePickers">
      <div class="picker-content slide-in-bottom">
        <div class="picker-header">
          <button class="btn-link" @click="closeDatePickers">取消</button>
          <h3 class="picker-title">选择日期</h3>
        </div>
        <van-date-picker
          :model-value="currentDateValue"
          @confirm="onDateConfirm"
          @cancel="closeDatePickers"
        />
      </div>
    </div>

    <!-- 缴费弹框 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content slide-in-bottom payment-modal-new">
        <div class="modal-header">
          <h2 class="modal-title">添加缴费</h2>
          <button class="btn-close ripple-effect" @click="closeModal">✕</button>
        </div>
        <div class="modal-body modal-scroll">
          <div class="compact-row">
            <div class="compact-field" @click="showTenantPicker = true">
              <span class="field-label">租户</span>
              <span class="field-value">{{ tenantText || '选择租户' }} ›</span>
            </div>
            <div class="compact-field" @click="showDatePicker = true">
              <span class="field-label">日期</span>
              <span class="field-value">{{ paidAtText?.split(' ')[0] || '选择日期' }} ›</span>
            </div>
          </div>

          <div class="type-section">
            <div class="type-label">选择类型</div>
            <div class="type-cards">
              <div
                v-for="t in typeOptions"
                :key="t.value"
                class="type-chip"
                :class="{ active: activeTypes.includes(t.value) }"
                @click="toggleTypeQuick(t.value)"
              >
                <span class="chip-icon">{{ t.icon }}</span>
                <span class="chip-text">{{ t.text }}</span>
              </div>
            </div>
          </div>

          <div v-for="(item, index) in form.items.filter(i => i.type)" :key="index" class="quick-item">
            <div class="quick-item-header">
              <span class="quick-type" :class="'type-' + item.type.toLowerCase()">{{ getTypeLabel(item.type) }}</span>
              <button class="quick-remove" @click="removeItemQuick(item.type)">✕</button>
            </div>
            <div class="quick-input-row">
              <span class="quick-currency">¥</span>
              <input v-model.number="item.amount" type="number" class="quick-amount" placeholder="0" />
            </div>
            <template v-if="item.type === 'ELECTRIC' || item.type === 'WATER'">
              <div class="quick-meter">
                <input
                  v-if="item.type === 'ELECTRIC'"
                  v-model.number="item.electricEndRead"
                  type="number"
                  class="quick-meter-input"
                  placeholder="电表读数"
                  @input="calculateElectricFee(index)"
                />
                <input
                  v-else
                  v-model.number="item.waterEndRead"
                  type="number"
                  class="quick-meter-input"
                  placeholder="水表读数"
                  @input="calculateWaterFee(index)"
                />
                <span class="quick-usage">
                  {{ item.type === 'ELECTRIC' ? (item.electricUsage || 0) + '度' : (item.waterUsage || 0) + '吨' }}
                </span>
              </div>
            </template>
          </div>

          <div class="quick-total">
            <div class="total-row">
              <span>本期费用</span>
              <span class="total-value">¥{{ totalAmount }}</span>
            </div>
            <div v-if="form.previousBalance !== 0" class="total-row balance-row">
              <span>{{ form.previousBalance > 0 ? '上次欠费' : '上次结余' }}</span>
              <span class="balance-value" :class="{ 'balance-negative': form.previousBalance < 0 }">
                {{ form.previousBalance > 0 ? '+' : '' }}¥{{ form.previousBalance.toFixed(2) }}
              </span>
            </div>
            <div class="total-row grand-total-row">
              <span>应缴金额</span>
              <span class="grand-total">¥{{ grandTotal }}</span>
            </div>
          </div>

          <div class="actual-payment">
            <div class="payment-row">
              <span class="payment-label">实缴金额</span>
              <div class="payment-input-wrapper">
                <span class="payment-currency">¥</span>
                <input v-model.number="form.actualPaid" type="number" class="payment-input" placeholder="0" />
              </div>
            </div>
            <div class="balance-result" :class="{ 'balance-due': Number(newBalance) > 0, 'balance-change': Number(newBalance) < 0 }">
              <span v-if="Number(newBalance) > 0">剩余欠费: ¥{{ newBalance }}</span>
              <span v-else-if="Number(newBalance) < 0">找零: ¥{{ Math.abs(Number(newBalance)).toFixed(2) }}</span>
              <span v-else>已结清</span>
            </div>
          </div>

          <textarea v-model="form.remark" class="quick-remark" placeholder="备注（选填）" rows="1"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary ripple-effect btn-block" @click="handleSave">保存</button>
        </div>
      </div>
    </div>

    <!-- 详情弹框 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="detail-modal slide-in-bottom">
        <div class="detail-header">
          <h2 class="detail-title">缴费详情</h2>
          <button class="btn-close ripple-effect" @click="showDetailModal = false">✕</button>
        </div>
        <div v-if="selectedPayment" class="detail-content modal-scroll">
          <div class="detail-row">
            <span class="detail-label">租户:</span>
            <span class="detail-value">{{ selectedPayment.tenant?.name }} - {{ selectedPayment.tenant?.house?.title }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">缴费时间:</span>
            <span class="detail-value">{{ formatPaymentTime(selectedPayment.paidAt) }}</span>
          </div>
          <div class="detail-row emphasis">
            <span class="detail-label">总金额:</span>
            <span class="detail-value price">¥{{ formatCurrency(selectedPayment.amount || 0, '') }}</span>
          </div>

          <div v-if="selectedPayment.items && selectedPayment.items.length > 0" class="items-section">
            <div class="section-title">缴费项目</div>
            <div class="items-list">
              <div
                v-for="(item, index) in selectedPayment.items"
                :key="index"
                class="item-detail"
              >
                <span class="item-tag" :class="getItemClass(item.type)">
                  {{ getTypeLabel(item.type) }}
                </span>
                <span class="item-amount">¥{{ item.amount }}</span>
                  <div v-if="item.type === 'ELECTRIC'" class="meter-detail">
                    电表: {{ item.electricStartRead || 0 }} → {{ item.electricEndRead || 0 }} = {{ item.electricUsage || 0 }}度
                </div>
                <div v-if="item.type === 'WATER'" class="meter-detail">
                    水表: {{ item.waterStartRead || 0 }} → {{ item.waterEndRead || 0 }} = {{ item.waterUsage || 0 }}吨
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedPayment.remark" class="detail-row">
            <span class="detail-label">备注:</span>
            <span class="detail-value">{{ selectedPayment.remark }}</span>
          </div>
        </div>
        <div class="detail-footer">
          <button class="btn btn-secondary ripple-effect" @click="showDetailModal = false">关闭</button>
          <button class="btn btn-primary ripple-effect" @click="handleShare">
            <span class="btn-icon">📤</span>
            <span>分享</span>
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
          <button class="btn-link btn-primary" @click="confirmTenantWithSelection">确认</button>
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
              <div class="option-subtitle">{{ tenant.house?.title || '' }} - {{ tenant.phone }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 类型选择弹框 -->
    <div v-if="showTypePicker" class="modal-overlay" @click.self="showTypePicker = false">
      <div class="picker-content slide-in-bottom">
        <div class="picker-header">
          <button class="btn-link" @click="showTypePicker = false">取消</button>
          <h3 class="picker-title">选择类型</h3>
          <button class="btn-link btn-primary" @click="confirmTypeWithSelection">确认</button>
        </div>
        <div class="picker-options">
          <div
            v-for="option in typeOptions"
            :key="option.value"
            class="picker-option"
            :class="{ active: form.items[selectedItemIndex]?.type === option.value }"
            @click="selectType(option)"
          >
            <span class="option-radio"></span>
            <span class="option-text">{{ option.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 缴费时间选择弹框 -->
    <div v-if="showDatePicker" class="modal-overlay" @click.self="showDatePicker = false">
      <div class="picker-content slide-in-bottom">
        <div class="picker-header">
          <button class="btn-link" @click="showDatePicker = false">取消</button>
          <h3 class="picker-title">选择缴费时间</h3>
          <button class="btn-link btn-primary" @click="confirmDatePicker">确认</button>
        </div>
        <van-date-picker
          v-model="datePickerValue"
          :show-toolbar="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type TagType, showToast, showLoadingToast, closeToast } from 'vant'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { DatePicker as VanDatePicker } from 'vant'
import { paymentsApi } from '@/api'
import { tenantsApi, housesApi } from '@/api'
import { formatCurrency } from '@/utils/helpers'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const route = useRoute()
const router = useRouter()

const payments = ref<any[]>([])
const tenants = ref<any[]>([])
const showModal = ref(false)
const showDetailModal = ref(false)
const showTenantPicker = ref(false)
const showTypePicker = ref(false)
const showDatePicker = ref(false)
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)
const currentDateValue = ref(['2024', '01', '01'])
const exporting = ref(false)
const loading = ref(false)
const selectedItemIndex = ref(0)

const filters = ref({
  searchText: '',
  type: null as string | null,
  startDate: '',
  endDate: '',
  tenantId: null as number | null,
  tenantName: ''
})

interface PaymentFormItem {
  type: string
  typeText: string
  amount: number
  electricStartRead?: number
  electricEndRead?: number
  electricUsage?: number
  electricRate?: number
  waterStartRead?: number
  waterEndRead?: number
  waterUsage?: number
  waterRate?: number
}

const form = ref({
  tenantId: null as number | null,
  items: [{ type: '', typeText: '', amount: 0 }] as PaymentFormItem[],
  paidAt: new Date().toISOString(),
  remark: '',
  previousBalance: 0,
  actualPaid: 0
})

const tenantText = ref('')
const paidAtText = ref('')
const datePickerValue = ref([dayjs().format('YYYY'), dayjs().format('MM'), dayjs().format('DD')])

const typeOptions = [
  { text: '房租', value: 'RENT', icon: '🏠' },
  { text: '水费', value: 'WATER', icon: '💧' },
  { text: '电费', value: 'ELECTRIC', icon: '⚡' },
  { text: '其他', value: 'OTHER', icon: '📝' }
]

const typesMap: Record<string, { label: string; tagType: TagType | 'default' }> = {
  RENT: { label: '房租', tagType: 'success' },
  WATER: { label: '水费', tagType: 'primary' },
  ELECTRIC: { label: '电费', tagType: 'warning' },
  OTHER: { label: '其他', tagType: 'default' }
}

const selectedPayment = ref<any>(null)

const getTypeLabel = (type: string) => typesMap[type]?.label || type || '-'

const getItemClass = (type: string) => {
  const tagType = typesMap[type]?.tagType || 'default'
  return `tag-${tagType}`
}

const formatPaymentTime = (paidAt: string) => {
  return dayjs(paidAt).format('YYYY-MM-DD HH:mm')
}

const filteredPayments = computed(() => {
  let filtered = payments.value
  if (filters.value.searchText) {
    const search = filters.value.searchText.toLowerCase()
    filtered = filtered.filter((p) =>
      p.tenant?.name.toLowerCase().includes(search)
    )
  }
  if (filters.value.tenantId) {
    filtered = filtered.filter((p) => p.tenantId === filters.value.tenantId)
  }
  if (filters.value.type) {
    filtered = filtered.filter((p) =>
      p.items?.some((item: any) => item.type === filters.value.type)
    )
  }
  if (filters.value.startDate && filters.value.endDate) {
    const start = dayjs(filters.value.startDate)
    const end = dayjs(filters.value.endDate)
    filtered = filtered.filter((p) => {
      const paidDate = dayjs(p.paidAt)
      return paidDate.isSameOrAfter(start, 'day') && paidDate.isSameOrBefore(end, 'day')
    })
  }
  return filtered
})

const totalAmount = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2)
})

const grandTotal = computed(() => {
  return (Number(totalAmount.value) + (form.value.previousBalance || 0)).toFixed(2)
})

const newBalance = computed(() => {
  return (Number(grandTotal.value) - (form.value.actualPaid || 0)).toFixed(2)
})

const fetchPayments = async () => {
  loading.value = true
  try {
    const data = await paymentsApi.getList() as unknown as any[]
    payments.value = data
    if (route.query.tenantId) {
      filters.value.tenantId = Number(route.query.tenantId)
      filters.value.tenantName = (route.query.tenantName as string) || ''
    }
  } catch (error) {
    showToast({ type: 'fail', message: '获取缴费记录失败' })
  } finally {
    loading.value = false
  }
}

const fetchTenants = async () => {
  try {
    const data = await tenantsApi.getList() as unknown as any[]
    tenants.value = data
    form.value = {
      tenantId: null,
      items: [{ type: '', typeText: '', amount: 0 }],
      paidAt: new Date().toISOString(),
      remark: '',
      previousBalance: 0,
      actualPaid: 0
    }
    tenantText.value = ''
    paidAtText.value = dayjs().format('YYYY-MM-DD HH:mm')
    showModal.value = true
  } catch (error) {
    showToast({ type: 'fail', message: '获取租户列表失败' })
  }
}

const closeModal = () => {
  showModal.value = false
}

const activeTypes = computed(() => form.value.items.filter(i => i.type).map(i => i.type))

const toggleTypeQuick = async (type: string) => {
  const existingIndex = form.value.items.findIndex(i => i.type === type)
  if (existingIndex > -1) {
    form.value.items.splice(existingIndex, 1)
    return
  }
  
  const newItem: PaymentFormItem = {
    type,
    typeText: getTypeLabel(type),
    amount: 0,
    electricStartRead: 0,
    electricEndRead: 0,
    electricUsage: 0,
    electricRate: 0,
    waterStartRead: 0,
    waterEndRead: 0,
    waterUsage: 0,
    waterRate: 0
  }
  
  if (form.value.tenantId) {
    const tenant = tenants.value.find((t: any) => t.id === form.value.tenantId)
    if (tenant?.house?.id) {
      try {
        const house = await housesApi.getByIdWithLastRead(tenant.house.id) as any
        if (type === 'ELECTRIC') {
          newItem.electricStartRead = house.lastElectricEndRead || house.electricInitialRead || 0
          newItem.electricRate = house.electricRate || 0
        } else if (type === 'WATER') {
          newItem.waterStartRead = house.lastWaterEndRead || house.waterInitialRead || 0
          newItem.waterRate = house.waterRate || 0
        }
      } catch (e) { console.error(e) }
    }
  }
  
  form.value.items.push(newItem)
}

const removeItemQuick = (type: string) => {
  const index = form.value.items.findIndex(i => i.type === type)
  if (index > -1) form.value.items.splice(index, 1)
}

const clearTenantFilter = () => {
  filters.value.tenantId = null
  filters.value.tenantName = ''
  router.replace({ path: '/payments' })
}

const closeDatePickers = () => {
  showStartDatePicker.value = false
  showEndDatePicker.value = false
}

const onDateConfirm = ({ selectedValues }: any) => {
  const date = selectedValues.join('-')
  if (showStartDatePicker.value) {
    filters.value.startDate = date
  } else {
    filters.value.endDate = date
  }
  closeDatePickers()
}

const selectTenant = async (tenant: any) => {
  form.value.tenantId = tenant.id
  form.value.previousBalance = tenant.balance || 0

  // 获取租户上次水电表读数
  try {
    const meterReads = await tenantsApi.getLastMeterReads(tenant.id) as any
    form.value.items.forEach((item, index) => {
      if (item.type === 'ELECTRIC') {
        item.electricStartRead = meterReads.lastElectricEndRead || 0
        calculateElectricFee(index)
      } else if (item.type === 'WATER') {
        item.waterStartRead = meterReads.lastWaterEndRead || 0
        calculateWaterFee(index)
      }
    })
  } catch (error) {
    console.error('获取上次读数失败', error)
  }

  // 获取房屋的水电费率配置
  if (tenant.house?.id) {
    try {
      const house = await housesApi.getById(tenant.house.id) as any
      form.value.items.forEach((item) => {
        item.electricRate = house.electricRate || 0
        item.waterRate = house.waterRate || 0
      })
    } catch (error) {
      console.error('获取房屋配置失败', error)
    }
  }
}

const confirmTenantWithSelection = () => {
  if (!form.value.tenantId) return
  const tenant = tenants.value.find((t: any) => t.id === form.value.tenantId)
  tenantText.value = tenant ? `${tenant.name} - ${tenant.house?.title || ''}` : ''
  showTenantPicker.value = false
}

const selectType = async (option: any) => {
  const index = selectedItemIndex.value
  form.value.items[index].type = option.value
  form.value.items[index].typeText = option.text

  // 如果已选择租户，自动设置费率和起始读数
  if (form.value.tenantId) {
    const tenant = tenants.value.find((t: any) => t.id === form.value.tenantId)
    if (tenant?.house?.id) {
      try {
        const house = await housesApi.getByIdWithLastRead(tenant.house.id) as any
        if (option.value === 'ELECTRIC') {
          form.value.items[index].electricRate = house.electricRate || 0
          form.value.items[index].electricStartRead = house.lastElectricEndRead || house.electricInitialRead || 0
        } else if (option.value === 'WATER') {
          form.value.items[index].waterRate = house.waterRate || 0
          form.value.items[index].waterStartRead = house.lastWaterEndRead || house.waterInitialRead || 0
        }
      } catch (error) {
        console.error('获取房屋配置失败', error)
      }
    }
  }
}

const confirmTypeWithSelection = () => {
  showTypePicker.value = false
}

const confirmDatePicker = () => {
  const date = dayjs(datePickerValue.value.join('-'))
  form.value.paidAt = date.toISOString()
  paidAtText.value = date.format('YYYY-MM-DD HH:mm')
  showDatePicker.value = false
}

const calculateElectricFee = (index: number) => {
  const item = form.value.items[index]
  const start = Number(item.electricStartRead) || 0
  const end = Number(item.electricEndRead) || 0
  item.electricUsage = end > start ? end - start : 0
  // 如果有单价，自动计算金额
  if (item.electricRate && item.electricRate > 0) {
    item.amount = item.electricUsage * item.electricRate
  }
}

const calculateWaterFee = (index: number) => {
  const item = form.value.items[index]
  const start = Number(item.waterStartRead) || 0
  const end = Number(item.waterEndRead) || 0
  item.waterUsage = end > start ? end - start : 0
  // 如果有单价，自动计算金额
  if (item.waterRate && item.waterRate > 0) {
    item.amount = item.waterUsage * item.waterRate
  }
}

const handleSave = async () => {
  if (!form.value.tenantId || form.value.items.length === 0 || !form.value.items[0].type || form.value.items[0].amount <= 0) {
    showToast({ type: 'fail', message: '请填写必填项' })
    return
  }
  showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 })
  try {
    const items = form.value.items
      .filter(item => item.type)
      .map(item => ({
        type: item.type as 'RENT' | 'WATER' | 'ELECTRIC' | 'OTHER',
        amount: Number(item.amount),
        electricStartRead: item.type === 'ELECTRIC' ? Number(item.electricStartRead) || 0 : undefined,
        electricEndRead: item.type === 'ELECTRIC' ? Number(item.electricEndRead) || 0 : undefined,
        electricUsage: item.type === 'ELECTRIC' ? Number(item.electricUsage) : undefined,
        waterStartRead: item.type === 'WATER' ? Number(item.waterStartRead) || 0 : undefined,
        waterEndRead: item.type === 'WATER' ? Number(item.waterEndRead) || 0 : undefined,
        waterUsage: item.type === 'WATER' ? Number(item.waterUsage) : undefined
      }))

    await paymentsApi.create({
      tenantId: form.value.tenantId!,
      items,
      paidAt: form.value.paidAt,
      remark: form.value.remark,
      actualPaid: form.value.actualPaid || Number(totalAmount.value)
    })
    closeToast()
    showToast({ type: 'success', message: '添加成功' })
    closeModal()
    fetchPayments()
  } catch (error: any) {
    closeToast()
    showToast({ type: 'fail', message: error.response?.data?.message || '添加失败' })
  }
}

const viewPaymentDetail = async (payment: any) => {
  try {
    const data = await paymentsApi.getById(payment.id) as unknown as any
    selectedPayment.value = data
    showDetailModal.value = true
  } catch (error) {
    showToast({ type: 'fail', message: '获取详情失败' })
  }
}

const handleShare = () => {
  if (!selectedPayment.value) return
  const shareUrl = `${window.location.origin}/share/${selectedPayment.value.id}`
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast({ type: 'success', message: '分享链接已复制到剪贴板' })
    }).catch(() => {
      fallbackCopy(shareUrl)
    })
  } else {
    fallbackCopy(shareUrl)
  }
}

const fallbackCopy = (text: string) => {
  const input = document.createElement('input')
  input.value = text
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
  showToast({ type: 'success', message: '分享链接已复制到剪贴板' })
}

const exportToCSV = () => {
  exporting.value = true
  try {
    const data = filteredPayments.value
    const rows: string[] = []
    data.forEach((payment) => {
      if (payment.items && payment.items.length > 0) {
        payment.items.forEach((item: any) => {
          rows.push([
            payment.tenant?.name || '',
            payment.tenant?.house?.title || '',
            payment.paidAt ? dayjs(payment.paidAt).format('YYYY-MM-DD HH:mm') : '',
            typesMap[item.type]?.label || item.type || '',
            item.amount || 0,
            payment.remark || ''
          ].map((v) => `"${v || ''}"`).join(','))
        })
      } else {
        rows.push([
          payment.tenant?.name || '',
          payment.tenant?.house?.title || '',
          payment.paidAt ? dayjs(payment.paidAt).format('YYYY-MM-DD HH:mm') : '',
          '', '', ''
        ].map((v) => `"${v || ''}"`).join(','))
      }
    })

    const csvContent = [
      '租户,房号,缴费时间,缴费类型,金额,备注',
      ...rows
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `缴费记录_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    showToast({ type: 'success', message: '导出成功' })
  } catch (error) {
    showToast({ type: 'fail', message: '导出失败' })
  } finally {
    exporting.value = false
  }
}

onMounted(() => fetchPayments())
</script>

<style scoped>
@import '../../styles/theme.css';

.payments-page {
  padding: 16px;
  background: var(--bg-page);
  min-height: 100vh;
}

/* 页面头部 */
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
  white-space: nowrap;
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

.btn-secondary:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn-small {
  padding: 8px 16px;
  font-size: 13px;
}

.btn-icon {
  font-size: 18px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex: 1;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  flex: 1;
  max-width: 360px;
  transition: var(--transition);
}

.search-box:focus-within {
  background: white;
  box-shadow: 0 0 0 2px var(--primary-light);
}

.search-icon {
  font-size: 16px;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-main);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

.filter-select {
  padding: 10px 16px;
  background: var(--bg-input);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-main);
  cursor: pointer;
  transition: var(--transition);
}

.filter-select:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-light);
}

.date-range-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.date-field {
  padding: 10px 16px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  transition: var(--transition);
}

.date-field:hover {
  border-color: var(--primary);
  background: white;
}

.date-value {
  font-size: 14px;
  color: var(--text-main);
}

.date-icon {
  font-size: 16px;
}

.date-separator {
  color: var(--text-placeholder);
  font-size: 18px;
}

.tenant-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--primary-light);
  border-radius: var(--radius-md);
  border: 1px solid var(--primary);
}

.filter-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.filter-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.btn-clear {
  margin-left: auto;
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: var(--transition);
}

.btn-clear:hover {
  color: var(--accent);
}

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

/* 缴费列表 */
.payments-list {
  display: grid;
  gap: 16px;
}

.payment-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  border: 1px solid var(--border-light);
  cursor: pointer;
}

.payment-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.tenant-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 4px 0;
}

.payment-time {
  font-size: 13px;
  color: var(--text-secondary);
}

.price {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.card-body {
  margin-bottom: 0;
}

.payment-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.payment-item-tag,
.more-tag {
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.tag-success {
  background: #DCFCE7;
  color: #166534;
}

.tag-primary {
  background: #DBEAFE;
  color: #1E40AF;
}

.tag-warning {
  background: #FEF3C7;
  color: #92400E;
}

.tag-default {
  background: #F1F5F9;
  color: #64748B;
}

.more-tag {
  color: var(--text-secondary);
}

.payment-remark {
  font-size: 13px;
  color: var(--text-secondary);
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
.picker-content,
.detail-modal {
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-card);
  flex-shrink: 0;
}

@keyframes slideInBottom {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
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
.picker-title,
.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-page);
}

.btn-link {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.btn-link:hover {
  color: var(--text-main);
}

.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect:active {
  transform: scale(0.98);
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
  transition: var(--transition);
}

.btn-close:hover {
  background: var(--accent-light);
  color: var(--accent);
}

.modal-body,
.detail-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.modal-scroll {
  max-height: none;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-card);
  position: sticky;
  bottom: 0;
  z-index: 1;
  flex-shrink: 0;
}

.modal-footer .btn {
  flex: 1;
  justify-content: center;
}

.detail-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-card);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  flex-shrink: 0;
}

.detail-footer .btn {
  flex: 1;
  justify-content: center;
}

.detail-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-card);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  flex-shrink: 0;
}

.detail-footer .btn {
  flex: 1;
  justify-content: center;
}

/* 表单 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: 8px;
}

.required-mark {
  color: var(--accent);
  margin-left: 4px;
  font-size: 16px;
  line-height: 1;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-row.row-compact {
  gap: 12px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-main);
  background: var(--bg-card);
  transition: var(--transition);
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--bg-input);
}

.form-input::placeholder {
  color: var(--text-placeholder);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
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
  transition: var(--transition);
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

/* 缴费项目 */
.items-section {
  margin: 24px 0;
  padding: 16px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.entry-item {
  background: var(--bg-card);
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 12px;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.entry-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.btn-delete {
  padding: 6px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.5;
  transition: var(--transition);
}

.btn-delete:hover {
  opacity: 1;
  color: var(--accent);
}

.empty-hint {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.meter-info {
  text-align: center;
  padding: 8px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.meter-info .usage-value {
  color: var(--primary);
  font-weight: 600;
}

.meter-info .rate-value {
  color: var(--text-main);
  font-weight: 500;
}

.meter-info .amount-value {
  color: #ea580c;
  font-weight: 700;
  font-size: 14px;
}

.total-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.total-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.total-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

/* 详情内容 */
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}

.detail-row.emphasis {
  padding: 16px 0;
}

.detail-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 14px;
  color: var(--text-main);
  text-align: right;
}

.detail-row.emphasis .detail-value.price {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

.items-list {
  margin: 16px 0;
}

.item-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
}

.item-tag {
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
}

.item-amount {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
}

.meter-detail {
  text-align: right;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 0 8px 0;
}

/* 选择器选项样式 */
.picker-options {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 16px 16px;
}

.picker-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  cursor: pointer;
  transition: var(--transition);
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
  position: relative;
  flex-shrink: 0;
}

.picker-option.active .option-radio {
  border-color: var(--primary);
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
  overflow: hidden;
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

.option-text {
  font-size: 15px;
  color: var(--text-main);
  font-weight: 500;
}

/* 新缴费弹框样式 */
.payment-modal-new .modal-body {
  padding: 12px 16px;
}

.compact-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.compact-field {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  cursor: pointer;
}

.field-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.field-value {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 500;
}

.type-section {
  margin-bottom: 16px;
}

.type-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.type-cards {
  display: flex;
  gap: 10px;
}

.type-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.type-chip.active {
  border-color: var(--primary);
  background: var(--primary-light);
}

.chip-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.chip-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-main);
}

.quick-item {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-bottom: 10px;
  border: 1px solid var(--border-light);
}

.quick-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.quick-type {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: var(--radius-sm);
}

.quick-type.type-rent { background: #DCFCE7; color: #166534; }
.quick-type.type-water { background: #DBEAFE; color: #1E40AF; }
.quick-type.type-electric { background: #FEF3C7; color: #92400E; }
.quick-type.type-other { background: #F1F5F9; color: #64748B; }

.quick-remove {
  background: none;
  border: none;
  color: var(--text-placeholder);
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}

.quick-input-row {
  display: flex;
  align-items: center;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  padding: 0 12px;
}

.quick-currency {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-right: 4px;
}

.quick-amount {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-main);
  padding: 10px 0;
}

.quick-amount:focus {
  outline: none;
}

.quick-meter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-light);
}

.quick-meter-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 16px;
  background: var(--bg-input);
}

.quick-usage {
  font-size: 14px;
  color: var(--primary);
  font-weight: 600;
  white-space: nowrap;
}

.quick-total {
  padding: 14px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);
  padding: 6px 0;
}

.total-row:not(:last-child) {
  border-bottom: 1px dashed var(--border-light);
}

.total-value {
  font-weight: 600;
  color: var(--text-main);
}

.balance-row .balance-value {
  color: var(--accent);
}

.balance-row .balance-value.balance-negative {
  color: var(--primary);
}

.grand-total-row {
  padding-top: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.grand-total-row .grand-total {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.actual-payment {
  background: var(--bg-card);
  border: 2px solid var(--primary);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-bottom: 12px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.payment-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  padding: 0 12px;
}

.payment-currency {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-right: 4px;
}

.payment-input {
  width: 120px;
  border: none;
  background: transparent;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main);
  text-align: right;
  padding: 8px 0;
}

.payment-input:focus {
  outline: none;
}

.balance-result {
  text-align: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-light);
  font-size: 14px;
  color: var(--primary);
  font-weight: 500;
}

.balance-result.balance-due {
  color: var(--accent);
}

.balance-result.balance-change {
  color: #16a34a;
}

.quick-total-amount {
  font-size: 26px;
  font-weight: 700;
  color: var(--primary);
}

.quick-remark {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 14px;
  resize: none;
  background: var(--bg-card);
  box-sizing: border-box;
}

.btn-block {
  width: 100%;
}

/* 响应式 */
@media (max-width: 768px) {
  .payments-page {
    padding: 12px;
    padding-bottom: 60px; /* 为 tabbar 预留空间 */
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 12px 0 0;
    margin-bottom: 12px;
  }

  .page-info h1 {
    font-size: 20px;
  }

  .toolbar {
    flex-direction: column;
    gap: 12px;
  }

  .toolbar-left {
    flex-direction: column;
  }

  .search-box {
    max-width: 100%;
  }

  .date-range-bar {
    flex-direction: column;
  }

  .date-separator {
    transform: rotate(90deg);
  }

  .form-row,
  .form-row.row-compact {
    grid-template-columns: 1fr;
  }
}
</style>
