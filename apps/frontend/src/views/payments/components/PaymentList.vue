<template>
  <div v-if="loading">
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>

  <div v-else class="payments-list">
    <div
      v-for="payment in payments"
      :key="payment.id"
      class="payment-card"
      @click="$emit('viewDetail', payment)"
    >
      <div class="card-header">
        <div class="payment-info">
          <h3 class="tenant-name">{{ payment.tenant?.name || '-' }}</h3>
          <span class="payment-time">{{ formatTime(payment.paidAt) }}</span>
        </div>
        <div class="price-section">
          <span class="price">¥{{ formatCurrency(payment.amount || 0, '') }}</span>
        </div>
      </div>

      <div class="card-body">
        <div class="payment-items">
          <span
            v-for="(item, index) in (payment.items || []).slice(0, 3)"
            :key="index"
            class="payment-item-tag"
            :class="getItemClass(item.type)"
          >
            {{ getTypeLabel(item.type) }} ¥{{ item.amount }}
          </span>
          <span v-if="payment.items && payment.items.length > 3" class="more-tag">
            +{{ payment.items.length - 3 }}
          </span>
        </div>
        <div v-if="payment.remark" class="payment-remark">{{ payment.remark }}</div>
      </div>

      <div class="card-actions" @click.stop>
        <button class="btn-action btn-edit" @click="$emit('edit', payment)">编辑</button>
        <button class="btn-action btn-delete-action" @click="$emit('delete', payment)">删除</button>
      </div>
    </div>

    <div v-if="payments.length === 0" class="empty-state">
      <span class="empty-icon">💰</span>
      <p class="empty-text">暂无缴费记录</p>
      <button class="btn btn-primary" @click="$emit('add')">
        添加第一笔缴费
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Payment } from '@/api/payments'
import { formatCurrency } from '@/utils/helpers'
import dayjs from 'dayjs'
import { type TagType } from 'vant'

defineProps<{
  payments: Payment[]
  loading?: boolean
}>()

defineEmits<{
  viewDetail: [payment: Payment]
  edit: [payment: Payment]
  delete: [payment: Payment]
  add: []
}>()

const typesMap: Record<string, { label: string; tagType: TagType | 'default' }> = {
  RENT: { label: '房租', tagType: 'success' },
  WATER: { label: '水费', tagType: 'primary' },
  ELECTRIC: { label: '电费', tagType: 'warning' },
  OTHER: { label: '其他', tagType: 'default' }
}

const getTypeLabel = (type: string) => typesMap[type]?.label || type || '-'

const getItemClass = (type: string) => {
  const tagType = typesMap[type]?.tagType || 'default'
  return `tag-${tagType}`
}

const formatTime = (paidAt: string) => {
  return dayjs(paidAt).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="less">

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

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-page);
}

.btn-action {
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}

.btn-edit {
  background: var(--primary-light);
  color: var(--primary);
}

.btn-edit:hover {
  background: var(--primary);
  color: white;
}

.btn-delete-action {
  background: var(--accent-light);
  color: var(--accent);
}

.btn-delete-action:hover {
  background: var(--accent);
  color: white;
}

.btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: var(--shadow-md);
}
</style>