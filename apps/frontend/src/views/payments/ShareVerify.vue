<template>
  <div class="share-verify-page">
    <div class="verify-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <template v-else-if="!verified">
        <div class="verify-header">
          <div class="verify-icon">🔒</div>
          <h1 class="verify-title">验证身份</h1>
          <p class="verify-subtitle">请输入租户身份证后6位以查看缴费记录</p>
        </div>

        <div v-if="verifyInfo" class="verify-info">
          <div class="info-row">
            <span class="info-label">租户姓名</span>
            <span class="info-value">{{ verifyInfo.tenantName }}</span>
          </div>
        </div>

        <div class="verify-form">
          <div class="form-group">
            <label class="form-label">身份证后6位</label>
            <input
              v-model="idCardLast6"
              type="text"
              maxlength="6"
              class="form-input"
              placeholder="请输入身份证后6位"
              @input="onInputChange"
            />
          </div>

          <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

          <button class="btn btn-primary" :disabled="submitting || idCardLast6.length !== 6" @click="handleVerify">
            {{ submitting ? '验证中...' : '验证并查看' }}
          </button>
        </div>
      </template>

      <template v-else>
        <div class="detail-container">
          <div class="detail-header">
            <div class="success-icon">✓</div>
            <h1 class="detail-title">缴费记录</h1>
          </div>

          <div v-if="shareData" class="detail-content">
            <div class="tenant-card">
              <div class="tenant-name">{{ shareData.tenant?.name }}</div>
              <div class="tenant-info">
                <span v-if="shareData.tenant?.house">{{ shareData.tenant.house.title }}</span>
                <span v-if="shareData.tenant?.phone"> · {{ shareData.tenant.phone }}</span>
              </div>
            </div>

            <div class="stats-card">
              <div class="stat-item">
                <div class="stat-value">{{ shareData.payments?.length || 0 }}</div>
                <div class="stat-label">缴费次数</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-value">¥{{ totalAmount }}</div>
                <div class="stat-label">累计金额</div>
              </div>
            </div>

            <div class="payments-section">
              <div class="section-title">缴费明细</div>
              <div v-if="shareData.payments && shareData.payments.length > 0" class="payments-list">
                <div
                  v-for="payment in shareData.payments"
                  :key="payment.id"
                  class="payment-card"
                  @click="togglePaymentDetail(payment.id)"
                >
                  <div class="payment-header">
                    <div class="payment-info">
                      <div class="payment-date">{{ formatDate(payment.paidAt) }}</div>
                    </div>
                    <div class="payment-amount">¥{{ formatAmount(payment.amount) }}</div>
                  </div>
                  <div class="payment-items-preview">
                    <span
                      v-for="(item, idx) in payment.items?.slice(0, 3)"
                      :key="idx"
                      class="item-tag"
                      :class="getItemClass(item.type)"
                    >
                      {{ getTypeLabel(item.type) }}
                    </span>
                    <span v-if="payment.items?.length > 3" class="more-tag">+{{ payment.items.length - 3 }}</span>
                  </div>
                  
                  <div v-if="expandedPaymentId === payment.id" class="payment-detail">
                    <div v-for="(item, idx) in payment.items" :key="idx" class="detail-item">
                      <span class="detail-type" :class="getItemClass(item.type)">{{ getTypeLabel(item.type) }}</span>
                      <span class="detail-amount">¥{{ formatAmount(item.amount) }}</span>
                      <div v-if="item.type === 'ELECTRIC' && item.electricUsage" class="detail-meter">
                        电表: {{ item.electricStartRead || 0 }} → {{ item.electricEndRead || 0 }} = {{ item.electricUsage }}度
                      </div>
                      <div v-if="item.type === 'WATER' && item.waterUsage" class="detail-meter">
                        水表: {{ item.waterStartRead || 0 }} → {{ item.waterEndRead || 0 }} = {{ item.waterUsage }}吨
                      </div>
                    </div>
                    <div v-if="payment.remark" class="detail-remark">备注: {{ payment.remark }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <span class="empty-icon">💰</span>
                <p>暂无缴费记录</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import request from '@/utils/request'

const route = useRoute()
const loading = ref(true)
const submitting = ref(false)
const verified = ref(false)
const verifyInfo = ref<any>(null)
const shareData = ref<any>(null)
const idCardLast6 = ref('')
const errorMsg = ref('')
const expandedPaymentId = ref<number | null>(null)

const typesMap: Record<string, { label: string; class: string }> = {
  RENT: { label: '房租', class: 'tag-success' },
  WATER: { label: '水费', class: 'tag-primary' },
  ELECTRIC: { label: '电费', class: 'tag-warning' },
  OTHER: { label: '其他', class: 'tag-default' }
}

const getTypeLabel = (type: string) => typesMap[type]?.label || type
const getItemClass = (type: string) => typesMap[type]?.class || 'tag-default'
const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
const formatAmount = (amount: number) => Number(amount || 0).toFixed(2)

const totalAmount = computed(() => {
  if (!shareData.value?.payments) return '0.00'
  const total = shareData.value.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
  return total.toFixed(2)
})

const onInputChange = () => {
  idCardLast6.value = idCardLast6.value.replace(/\D/g, '')
  errorMsg.value = ''
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
    errorMsg.value = '请输入6位数字'
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

onMounted(() => fetchVerifyInfo())
</script>

<style scoped>
@import '../../styles/theme.css';

.share-verify-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding: 24px 16px;
}

.verify-container {
  max-width: 500px;
  margin: 0 auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
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

.verify-header {
  text-align: center;
  margin-bottom: 32px;
}

.verify-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.verify-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 8px 0;
}

.verify-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.verify-info {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 500;
}

.verify-form {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 18px;
  color: var(--text-main);
  background: var(--bg-input);
  text-align: center;
  letter-spacing: 8px;
  box-sizing: border-box;
  transition: var(--transition);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  background: white;
}

.form-input::placeholder {
  color: var(--text-placeholder);
  letter-spacing: normal;
}

.error-msg {
  color: var(--accent);
  font-size: 13px;
  margin: 0 0 16px 0;
  text-align: center;
}

.btn {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 18px;
}

.detail-container {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.detail-header {
  text-align: center;
  margin-bottom: 24px;
}

.success-icon {
  width: 48px;
  height: 48px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto 16px;
}

.detail-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.tenant-card {
  background: linear-gradient(135deg, var(--primary) 0%, #0d9488 100%);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;
  color: white;
}

.tenant-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.tenant-info {
  font-size: 14px;
  opacity: 0.9;
}

.stats-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border-light);
}

.payments-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.payments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: var(--transition);
}

.payment-card:hover {
  box-shadow: var(--shadow-md);
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.payment-date {
  font-size: 14px;
  color: var(--text-secondary);
}

.payment-amount {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary);
}

.payment-items-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.item-tag {
  padding: 2px 8px;
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
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-secondary);
}

.payment-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.detail-type {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.detail-amount {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.detail-meter {
  width: 100%;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 0;
}

.detail-remark {
  margin-top: 8px;
  padding: 8px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}
</style>