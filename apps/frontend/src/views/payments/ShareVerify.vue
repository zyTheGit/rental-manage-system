<template>
  <div class="share-page">
    <div class="page-bg"></div>
    
    <div class="share-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-ring">
          <div class="ring-segment"></div>
        </div>
        <span>加载中</span>
      </div>

      <template v-else-if="!verified">
        <div class="verify-card">
          <div class="card-glow"></div>
          <div class="verify-content">
            <div class="lock-visual">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 class="verify-title">身份验证</h1>
            <p class="verify-desc">请输入身份证后6位查看缴费详情</p>

            <div v-if="verifyInfo" class="tenant-hint">
              <span class="hint-label">验证账户</span>
              <span class="hint-value">{{ verifyInfo.tenantName }}</span>
            </div>

            <div class="input-group">
              <div class="digit-inputs">
                <input
                  v-for="i in 6"
                  :key="i"
                  :ref="el => digitInputs[i-1] = el as HTMLInputElement"
                  type="text"
                  maxlength="1"
                  class="digit-box"
                  :value="idCardLast6[i-1] || ''"
                  :class="{ filled: idCardLast6[i-1] }"
                  @input="onDigitInput($event, i-1)"
                  @keydown="onKeydown($event, i-1)"
                  @paste="onPaste"
                />
              </div>
            </div>

            <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

            <button 
              class="verify-btn" 
              :class="{ active: idCardLast6.length === 6 }"
              :disabled="submitting || idCardLast6.length !== 6"
              @click="handleVerify"
            >
              <span v-if="submitting">验证中</span>
              <span v-else>验证查看</span>
              <svg v-if="!submitting" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="receipt-card">
          <div class="receipt-header">
            <div class="brand-mark">
              <div class="mark-line"></div>
              <div class="mark-text">缴费账单</div>
              <div class="mark-line"></div>
            </div>
            <div class="receipt-date">{{ currentDate }}</div>
          </div>

          <div class="receipt-body" v-if="shareData">
            <div class="tenant-section">
              <div class="section-label">租户信息</div>
              <div class="tenant-row">
                <span class="tenant-name">{{ shareData.tenant?.name }}</span>
                <span class="tenant-house" v-if="shareData.tenant?.house">{{ shareData.tenant.house.title }}</span>
              </div>
              <div class="tenant-contact" v-if="shareData.tenant?.phone">{{ shareData.tenant.phone }}</div>
            </div>

            <div class="stats-section">
              <div class="stat-block">
                <div class="stat-num">{{ shareData.payments?.length || 0 }}</div>
                <div class="stat-label">缴费次数</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-block">
                <div class="stat-num">{{ totalAmount }}</div>
                <div class="stat-label">累计金额</div>
              </div>
            </div>

            <div v-if="shareData.tenant?.balance !== 0" class="balance-section">
              <div class="balance-row" :class="shareData.tenant.balance > 0 ? 'debt' : 'surplus'">
                <div class="balance-status">
                  <span class="status-dot"></span>
                  <span>{{ shareData.tenant.balance > 0 ? '待缴欠费' : '账户结余' }}</span>
                </div>
                <div class="balance-value">¥{{ Math.abs(shareData.tenant.balance).toFixed(2) }}</div>
              </div>
            </div>

            <div class="payments-section">
              <div class="section-header">
                <span class="section-title">缴费明细</span>
                <span class="section-count">共 {{ shareData.payments?.length || 0 }} 笔</span>
              </div>

              <div v-if="shareData.payments && shareData.payments.length > 0" class="payments-list">
                <div
                  v-for="(payment, pIdx) in shareData.payments"
                  :key="payment.id"
                  class="payment-item"
                  :style="{ animationDelay: `${pIdx * 0.05}s` }"
                  @click="togglePaymentDetail(payment.id)"
                >
                  <div class="item-main">
                    <div class="item-left">
                      <div class="item-date">{{ formatDate(payment.paidAt) }}</div>
                      <div class="item-tags">
                        <span
                          v-for="(item, idx) in payment.items?.slice(0, 3)"
                          :key="idx"
                          class="mini-tag"
                          :class="getTypeClass(item.type)"
                        >{{ getTypeLabel(item.type) }}</span>
                        <span v-if="payment.items?.length > 3" class="mini-tag more">+{{ payment.items.length - 3 }}</span>
                      </div>
                    </div>
                    <div class="item-right">
                      <div class="item-amount">¥{{ formatAmount(payment.amount) }}</div>
                      <svg class="expand-icon" :class="{ expanded: expandedPaymentId === payment.id }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  <Transition name="expand">
                    <div v-if="expandedPaymentId === payment.id" class="item-detail">
                      <div class="detail-grid">
                        <div v-for="(item, idx) in payment.items" :key="idx" class="detail-row">
                          <span class="detail-type" :class="getTypeClass(item.type)">{{ getTypeLabel(item.type) }}</span>
                          <span class="detail-amount">¥{{ formatAmount(item.amount) }}</span>
                        </div>
                        <div v-if="payment.items?.some((i: any) => i.type === 'ELECTRIC' && i.electricUsage)" class="meter-info">
                          <span class="meter-label">用电</span>
                          <span class="meter-value">{{ payment.items.find((i: any) => i.type === 'ELECTRIC')?.electricUsage || 0 }} 度</span>
                        </div>
                        <div v-if="payment.items?.some((i: any) => i.type === 'WATER' && i.waterUsage)" class="meter-info">
                          <span class="meter-label">用水</span>
                          <span class="meter-value">{{ payment.items.find((i: any) => i.type === 'WATER')?.waterUsage || 0 }} 吨</span>
                        </div>
                      </div>
                      <div v-if="payment.remark" class="detail-remark">{{ payment.remark }}</div>
                    </div>
                  </Transition>
                </div>
              </div>

              <div v-else class="empty-state">
                <div class="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="6" width="20" height="14" rx="2"/>
                    <path d="M22 10H2"/>
                  </svg>
                </div>
                <span>暂无缴费记录</span>
              </div>
            </div>
          </div>

          <div class="receipt-footer">
            <div class="footer-line"></div>
            <div class="footer-text">此账单仅供查看使用</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import request from '@/utils/request'
import { sum } from '@/utils/decimal'

const route = useRoute()
const loading = ref(true)
const submitting = ref(false)
const verified = ref(false)
const verifyInfo = ref<any>(null)
const shareData = ref<any>(null)
const idCardLast6 = ref('')
const errorMsg = ref('')
const expandedPaymentId = ref<number | null>(null)
const digitInputs = ref<HTMLInputElement[]>([])

const typesConfig: Record<string, { label: string; cls: string }> = {
  RENT: { label: '房租', cls: 'type-rent' },
  WATER: { label: '水费', cls: 'type-water' },
  ELECTRIC: { label: '电费', cls: 'type-electric' },
  OTHER: { label: '其他', cls: 'type-other' }
}

const getTypeLabel = (type: string) => typesConfig[type]?.label || type
const getTypeClass = (type: string) => typesConfig[type]?.cls || 'type-other'
const formatDate = (date: string) => dayjs(date).format('MM-DD HH:mm')
const formatAmount = (amount: number) => Number(amount || 0).toFixed(2)

const currentDate = computed(() => dayjs().format('YYYY年MM月DD日'))

const totalAmount = computed(() => {
  if (!shareData.value?.payments) return '0.00'
  const total = sum(...shareData.value.payments.map((p: any) => p.amount || 0))
  return total.toFixed(2)
})

const onDigitInput = (event: Event, index: number) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '').slice(-1)
  
  const chars = idCardLast6.value.split('')
  chars[index] = value
  idCardLast6.value = chars.join('').slice(0, 6)
  
  if (value && index < 5) {
    digitInputs.value[index + 1]?.focus()
  }
  
  errorMsg.value = ''
}

const onKeydown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'Backspace' && !idCardLast6.value[index] && index > 0) {
    digitInputs.value[index - 1]?.focus()
  }
}

const onPaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text') || ''
  const digits = text.replace(/\D/g, '').slice(0, 6)
  idCardLast6.value = digits
  nextTick(() => {
    digitInputs.value[Math.min(digits.length, 5)]?.focus()
  })
}

const togglePaymentDetail = (id: number) => {
  expandedPaymentId.value = expandedPaymentId.value === id ? null : id
}

const fetchVerifyInfo = async () => {
  const paymentId = route.params.id as string
  if (!paymentId) {
    showToast({ type: 'fail', message: '无效的分享链接' })
    return
  }

  try {
    const data = await request.get(`/payments/share/${paymentId}/verify`)
    verifyInfo.value = data
  } catch (error: any) {
    showToast({ type: 'fail', message: error.response?.data?.message || '获取信息失败' })
  } finally {
    loading.value = false
  }
}

const handleVerify = async () => {
  if (idCardLast6.value.length !== 6) {
    errorMsg.value = '请输入完整'
    return
  }

  const paymentId = route.params.id as string
  submitting.value = true
  errorMsg.value = ''

  try {
    const data = await request.post(`/payments/share/${paymentId}/verify`, {
      idCardLast6: idCardLast6.value
    })
    shareData.value = data
    verified.value = true
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message || '验证失败'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchVerifyInfo()
  nextTick(() => digitInputs.value[0]?.focus())
})
</script>

<style scoped lang="less">
.share-page {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px 16px 40px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.page-bg {
  position: fixed;
  inset: 0;
  background: 
    linear-gradient(180deg, #f8fafb 0%, #f0f4f5 50%, #e8f0f2 100%);
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.03;
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -30%;
    width: 80%;
    height: 80%;
    background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }
}

.share-container {
  position: relative;
  width: 100%;
  max-width: 420px;
  z-index: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  color: #64748b;
  font-size: 14px;
  gap: 16px;
}

.loading-ring {
  width: 44px;
  height: 44px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 2px solid #e2e8f0;
    border-radius: 50%;
  }
}

.ring-segment {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.verify-card {
  position: relative;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.06);
}

.card-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.verify-content {
  position: relative;
  padding: 48px 32px 40px;
  text-align: center;
}

.lock-visual {
  width: 56px;
  height: 56px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 28px;
    height: 28px;
    color: #64748b;
  }
}

.verify-title {
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.verify-desc {
  font-size: 14px;
  color: #94a3b8;
  margin: 0 0 28px;
}

.tenant-hint {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 24px;
}

.hint-label {
  font-size: 13px;
  color: #94a3b8;
}

.hint-value {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.input-group {
  margin-bottom: 20px;
}

.digit-inputs {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.digit-box {
  width: 44px;
  height: 52px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.2s ease;
  outline: none;
  box-sizing: border-box;
  
  &:focus {
    border-color: #10b981;
    background: white;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  }
  
  &.filled {
    border-color: #cbd5e1;
    background: white;
  }
}

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin: 0 0 16px;
}

.verify-btn {
  width: 100%;
  padding: 16px 24px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  color: white;
  background: #cbd5e1;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  svg {
    width: 18px;
    height: 18px;
    opacity: 0;
    transform: translateX(-8px);
    transition: all 0.3s ease;
  }
  
  &.active {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
    
    svg {
      opacity: 1;
      transform: translateX(0);
    }
    
    &:hover {
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
      transform: translateY(-1px);
    }
  }
  
  &:disabled:not(.active) {
    cursor: not-allowed;
  }
}

.receipt-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.06);
  animation: slideUp 0.4s ease;
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

.receipt-header {
  padding: 24px 24px 20px;
  text-align: center;
  background: linear-gradient(180deg, #f8fafb 0%, white 100%);
  border-bottom: 1px dashed #e2e8f0;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
}

.mark-line {
  width: 32px;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #cbd5e1 100%);
  
  &:last-child {
    background: linear-gradient(90deg, #cbd5e1 0%, transparent 100%);
  }
}

.mark-text {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.1em;
}

.receipt-date {
  font-size: 12px;
  color: #94a3b8;
}

.receipt-body {
  padding: 20px 20px 0;
}

.tenant-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.section-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.tenant-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 4px;
}

.tenant-name {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.tenant-house {
  font-size: 14px;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 10px;
  border-radius: 8px;
}

.tenant-contact {
  font-size: 13px;
  color: #94a3b8;
}

.stats-section {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 14px;
  margin-bottom: 16px;
}

.stat-block {
  flex: 1;
  text-align: center;
}

.stat-num {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  line-height: 1.2;
  
  &::before {
    content: '¥';
    font-size: 16px;
    font-weight: 500;
    color: #64748b;
    margin-right: 2px;
  }
}

.stat-block:first-child .stat-num::before {
  content: none;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: #e2e8f0;
  margin: 0 8px;
}

.balance-section {
  margin-bottom: 16px;
}

.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  
  &.debt {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  
  &.surplus {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
}

.balance-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  
  .debt & {
    color: #92400e;
  }
  
  .surplus & {
    color: #047857;
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  
  .debt & {
    background: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
  }
  
  .surplus & {
    background: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
}

.balance-value {
  font-size: 20px;
  font-weight: 700;
  
  .debt & {
    color: #dc2626;
  }
  
  .surplus & {
    color: #059669;
  }
}

.payments-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.section-count {
  font-size: 12px;
  color: #94a3b8;
}

.payments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-item {
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: fadeIn 0.3s ease backwards;
  
  &:active {
    transform: scale(0.99);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
}

.item-left {
  flex: 1;
  min-width: 0;
}

.item-date {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
  
  &.type-rent {
    background: #f3e8ff;
    color: #7c3aed;
  }
  
  &.type-water {
    background: #dbeafe;
    color: #2563eb;
  }
  
  &.type-electric {
    background: #fef3c7;
    color: #b45309;
  }
  
  &.type-other {
    background: #f1f5f9;
    color: #64748b;
  }
  
  &.more {
    background: #e2e8f0;
    color: #64748b;
  }
}

.item-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-amount {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.expand-icon {
  width: 16px;
  height: 16px;
  color: #94a3b8;
  transition: transform 0.2s ease;
  
  &.expanded {
    transform: rotate(180deg);
  }
}

.item-detail {
  padding: 0 16px 14px;
  border-top: 1px solid #e2e8f0;
  margin-top: 0;
}

.detail-grid {
  padding-top: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.detail-type {
  font-size: 13px;
  font-weight: 500;
  
  &.type-rent { color: #7c3aed; }
  &.type-water { color: #2563eb; }
  &.type-electric { color: #b45309; }
  &.type-other { color: #64748b; }
}

.detail-amount {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.meter-info {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  margin-top: 4px;
  border-top: 1px dashed #e2e8f0;
}

.meter-label {
  font-size: 12px;
  color: #94a3b8;
}

.meter-value {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.detail-remark {
  margin-top: 10px;
  padding: 8px 10px;
  background: white;
  border-radius: 8px;
  font-size: 12px;
  color: #64748b;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 300px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 14px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
  
  svg {
    width: 100%;
    height: 100%;
  }
}

.receipt-footer {
  padding: 16px 24px 20px;
  text-align: center;
}

.footer-line {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
  margin-bottom: 12px;
}

.footer-text {
  font-size: 11px;
  color: #94a3b8;
  letter-spacing: 0.02em;
}
</style>