<template>
  <div class="payments-page page-container">
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
          </svg>
        </div>
        <div class="header-info">
          <h1 class="page-title">缴费记录</h1>
          <p class="page-subtitle">{{ payments.length }} 笔记录</p>
        </div>
      </div>
      <button class="btn-add" @click="openAddModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>

    <div class="toolbar">
      <div class="search-bar">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          :value="filters.searchText"
          type="text"
          placeholder="搜索租户..."
          @input="handleSearchInput(($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="date-range">
        <button class="date-btn" @click="showStartDatePicker = true">
          <span>{{ filters.startDate || '开始' }}</span>
        </button>
        <span class="date-arrow">→</span>
        <button class="date-btn" @click="showEndDatePicker = true">
          <span>{{ filters.endDate || '结束' }}</span>
        </button>
      </div>
    </div>

    <div v-if="filters.tenantId" class="tenant-chip">
      <span>{{ filters.tenantName }}</span>
      <button @click="clearTenantFilter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-pulse"></div>
      <span>加载中...</span>
    </div>

    <div v-else class="payments-list">
      <div 
        v-for="(payment, index) in payments" 
        :key="payment.id" 
        class="payment-card"
        :style="{ animationDelay: `${index * 0.05}s` }"
        @click="viewPaymentDetail(payment)"
      >
        <div class="card-top">
          <div class="payment-avatar">
            {{ payment.tenant?.name?.charAt(0) || '?' }}
          </div>
          <div class="payment-info">
            <h3 class="tenant-name">{{ payment.tenant?.name || '-' }}</h3>
            <span class="payment-house">{{ payment.tenant?.house?.title }}</span>
          </div>
          <div class="payment-amount">
            <span class="amount-value">¥{{ formatCurrency(payment.amount || 0, '') }}</span>
            <span class="amount-time">{{ formatTime(payment.paidAt) }}</span>
          </div>
        </div>

        <div class="card-content">
          <div class="fee-tags">
            <span
              v-for="(item, idx) in (payment.items || []).slice(0, 3)"
              :key="idx"
              class="fee-tag"
              :class="getItemClass(item.type)"
            >
              {{ getTypeLabel(item.type) }}
            </span>
            <span v-if="payment.items && payment.items.length > 3" class="fee-tag more">
              +{{ payment.items.length - 3 }}
            </span>
          </div>
          <p v-if="payment.remark" class="payment-remark">{{ payment.remark }}</p>
        </div>

        <div class="card-actions" @click.stop>
          <button class="action-btn" @click="handleEdit(payment)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="action-btn danger" @click="handleDelete(payment)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="payments.length === 0" class="empty-state">
        <div class="empty-visual">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
          </svg>
        </div>
        <h3>还没有缴费记录</h3>
        <p>添加第一笔缴费开始记录</p>
        <button class="btn-add-large" @click="openAddModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>添加记录</span>
        </button>
      </div>
    </div>

    <PaymentFormModal
      v-if="showModal"
      :show="showModal"
      :tenants="tenants"
      @update:show="showModal = $event"
      @save="handleSave"
    />

    <PaymentDetailModal
      v-if="showDetailModal"
      :show="showDetailModal"
      :payment="selectedPayment"
      @update:show="showDetailModal = $event"
      @share="handleShare"
    />

    <EditPaymentModal
      v-if="showEditModal"
      :show="showEditModal"
      :payment="selectedPayment"
      @update:show="showEditModal = $event"
      @save="confirmEdit"
    />

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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { showToast, showDialog } from "vant"
import dayjs from "dayjs"
import { paymentsApi, tenantsApi } from "@/api"
import { formatCurrency } from "@/utils/helpers"
import PaymentFormModal from "./components/PaymentFormModal.vue"
import PaymentDetailModal from "./components/PaymentDetailModal.vue"
import EditPaymentModal from "./components/EditPaymentModal.vue"

const route = useRoute()
const router = useRouter()

const payments = ref<any[]>([])
const tenants = ref<any[]>([])
const loading = ref(false)

const filters = reactive({
  searchText: "",
  startDate: "",
  endDate: "",
  tenantId: null as number | null,
  tenantName: "",
})

const showModal = ref(false)
const showDetailModal = ref(false)
const showEditModal = ref(false)
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)

const selectedPayment = ref<any>(null)

const startDateValue = ref([dayjs().format("YYYY"), dayjs().format("MM"), dayjs().format("DD")])
const endDateValue = ref([dayjs().format("YYYY"), dayjs().format("MM"), dayjs().format("DD")])

let searchTimer: ReturnType<typeof setTimeout> | null = null

const typesMap: Record<string, string> = {
  RENT: "房租",
  WATER: "水费",
  ELECTRIC: "电费",
  OTHER: "其他"
}

const getTypeLabel = (type: string) => typesMap[type] || type

const getItemClass = (type: string) => {
  const classMap: Record<string, string> = {
    RENT: "rent",
    WATER: "water",
    ELECTRIC: "electric",
    OTHER: "other"
  }
  return classMap[type] || "other"
}

const formatTime = (paidAt: string) => dayjs(paidAt).format("MM-DD HH:mm")

const fetchPayments = async (searchText?: string) => {
  loading.value = true
  try {
    const params: any = {}
    if (searchText || filters.searchText) {
      params.search = searchText || filters.searchText
    }
    if (filters.tenantId) {
      params.tenantId = filters.tenantId
    }
    if (filters.startDate) {
      params.startDate = filters.startDate
    }
    if (filters.endDate) {
      params.endDate = filters.endDate
    }
    
    const data = (await paymentsApi.getList(Object.keys(params).length > 0 ? params : undefined)) as unknown as any[]
    payments.value = Array.isArray(data) ? data : []
    
    if (route.query.tenantId) {
      filters.tenantId = Number(route.query.tenantId)
      filters.tenantName = (route.query.tenantName as string) || ""
    }
  } catch (error) {
    showToast({ type: "fail", message: "获取缴费记录失败" })
    payments.value = []
  } finally {
    loading.value = false
  }
}

const handleSearchInput = (value: string) => {
  filters.searchText = value
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    fetchPayments(value)
  }, 300)
}

watch([() => filters.startDate, () => filters.endDate], () => {
  fetchPayments()
})

const openAddModal = async () => {
  try {
    const data = (await tenantsApi.getList()) as unknown as any[]
    tenants.value = data
    showModal.value = true
  } catch (error) {
    showToast({ type: "fail", message: "获取租户列表失败" })
  }
}

const clearTenantFilter = () => {
  filters.tenantId = null
  filters.tenantName = ""
  router.replace({ path: "/payments" })
}

const onStartDateConfirm = ({ selectedValues }: any) => {
  filters.startDate = selectedValues.join("-")
  showStartDatePicker.value = false
}

const onEndDateConfirm = ({ selectedValues }: any) => {
  filters.endDate = selectedValues.join("-")
  showEndDatePicker.value = false
}

const handleSave = async (data: any) => {
  try {
    await paymentsApi.create(data)
    showToast({ type: "success", message: "添加成功" })
    showModal.value = false
    fetchPayments()
  } catch (error: any) {
    showToast({ type: "fail", message: error.response?.data?.message || "添加失败" })
  }
}

const handleEdit = async (payment: any) => {
  try {
    const data = (await paymentsApi.getById(payment.id)) as unknown as any
    selectedPayment.value = data
    showEditModal.value = true
  } catch (error) {
    showToast({ type: "fail", message: "获取详情失败" })
  }
}

const confirmEdit = async (data: any) => {
  try {
    await paymentsApi.update(selectedPayment.value.id, data)
    showToast({ type: "success", message: "更新成功" })
    showEditModal.value = false
    fetchPayments()
  } catch (error: any) {
    showToast({ type: "fail", message: error.response?.data?.message || "更新失败" })
  }
}

const handleDelete = async (payment: any) => {
  try {
    await showDialog({
      title: "确认删除",
      message: `确定要删除 "${payment.tenant?.name}" 的缴费记录吗？`,
      showCancelButton: true,
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    })
    await paymentsApi.delete(payment.id)
    showToast({ type: "success", message: "删除成功" })
    fetchPayments()
  } catch (error: any) {
    if (error !== "cancel") {
      showToast({ type: "fail", message: error.response?.data?.message || "删除失败" })
    }
  }
}

const viewPaymentDetail = async (payment: any) => {
  try {
    const data = (await paymentsApi.getById(payment.id)) as unknown as any
    selectedPayment.value = data
    showDetailModal.value = true
  } catch (error) {
    showToast({ type: "fail", message: "获取详情失败" })
  }
}

const handleShare = () => {
  if (!selectedPayment.value) return
  const shareUrl = `${window.location.origin}/share/${selectedPayment.value.id}`
  navigator.clipboard?.writeText(shareUrl)
    .then(() => showToast({ type: "success", message: "分享链接已复制" }))
    .catch(() => showToast({ type: "success", message: "分享链接已复制" }))
}

onMounted(() => fetchPayments())
</script>

<style scoped lang="less">
.payments-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 100px;
  overflow-x: hidden;
  box-sizing: border-box;
}

* {
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
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
  flex-shrink: 0;
  
  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
}

.header-info {
  min-width: 0;
  overflow: hidden;
  
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
  flex-shrink: 0;
  
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

.toolbar {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  overflow-x: hidden;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-input);
  border-radius: 10px;
  transition: all 0.2s ease;
  min-width: 0;
  
  &:focus-within {
    background: white;
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
  }
  
  .search-icon {
    width: 18px;
    height: 18px;
    color: var(--text-secondary);
    flex-shrink: 0;
  }
  
  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    color: var(--text-main);
    outline: none;
    min-width: 0;
    
    &::placeholder {
      color: var(--text-placeholder);
    }
  }
}

.date-range {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.date-btn {
  padding: 10px;
  background: var(--bg-input);
  border: none;
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:active {
    transform: scale(0.97);
  }
}

.date-arrow {
  font-size: 12px;
  color: var(--text-secondary);
}

.tenant-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
  border-radius: 10px;
  font-size: 14px;
  color: #0369A1;
  overflow: hidden;
  
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  button {
    width: 20px;
    height: 20px;
    background: rgba(14, 165, 233, 0.2);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    
    svg {
      width: 12px;
      height: 12px;
      color: #0EA5E9;
    }
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
  background: #0EA5E9;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.5; }
}

.payments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow-x: hidden;
}

.payment-card {
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  animation: slideUp 0.4s ease backwards;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.99);
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
  min-width: 0;
}

.payment-avatar {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.payment-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  
  .tenant-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-main);
    margin: 0 0 2px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .payment-house {
    font-size: 13px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }
}

.payment-amount {
  text-align: right;
  flex-shrink: 0;
  margin-left: 8px;
  
  .amount-value {
    display: block;
    font-size: 18px;
    font-weight: 700;
    color: #0EA5E9;
  }
  
  .amount-time {
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.card-content {
  padding: 0 16px 16px;
  overflow: hidden;
}

.fee-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.fee-tag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  
  &.rent {
    background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
    color: #5B21B6;
  }
  
  &.water {
    background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
    color: #1E40AF;
  }
  
  &.electric {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    color: #92400E;
  }
  
  &.other {
    background: var(--bg-input);
    color: var(--text-secondary);
  }
  
  &.more {
    background: var(--bg-input);
    color: var(--text-secondary);
  }
}

.payment-remark {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px 16px;
}

.action-btn {
  width: 36px;
  height: 36px;
  background: var(--bg-input);
  border: none;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  svg {
    width: 18px;
    height: 18px;
    color: var(--text-secondary);
  }
  
  &:active {
    background: #0EA5E9;
    
    svg {
      color: white;
    }
  }
  
  &.danger:active {
    background: #EF4444;
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
    background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    
    svg {
      width: 40px;
      height: 40px;
      color: #0EA5E9;
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
  background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  &:active {
    transform: scale(0.97);
  }
}
</style>