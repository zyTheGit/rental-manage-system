<template>
  <div v-if="payment" class="modal-overlay" @click.self="$emit('close')">
    <div class="detail-modal slide-in-bottom">
      <div class="detail-header">
        <h2 class="detail-title">缴费详情</h2>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>
      <div class="detail-content modal-scroll">
        <div class="detail-row">
          <span class="detail-label">租户:</span>
          <span class="detail-value">{{ payment.tenant?.name }} - {{ payment.tenant?.house?.title }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">缴费时间:</span>
          <span class="detail-value">{{ formatTime(payment.paidAt) }}</span>
        </div>
        <div class="detail-row emphasis">
          <span class="detail-label">总金额:</span>
          <span class="detail-value price">¥{{ payment.amount }}</span>
        </div>

        <div v-if="payment.items?.length" class="items-section">
          <div class="section-title">缴费项目</div>
          <div class="items-list">
            <div v-for="(item, index) in payment.items" :key="index" class="item-detail">
              <span class="item-tag" :class="getItemClass(item.type)">{{ getTypeLabel(item.type) }}</span>
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

        <div v-if="payment.remark" class="detail-row">
          <span class="detail-label">备注:</span>
          <span class="detail-value">{{ payment.remark }}</span>
        </div>
      </div>
      <div class="detail-footer">
        <button class="btn btn-secondary" @click="$emit('close')">关闭</button>
        <button class="btn btn-primary" @click="$emit('share')">
          <span class="btn-icon">📤</span>
          <span>分享</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { Payment } from '@/api/payments'
import { type TagType } from 'vant'

defineProps<{
  payment: Payment | null
}>()

defineEmits<{
  close: []
  share: []
}>()

const typesMap: Record<string, { label: string; tagType: TagType | 'default' }> = {
  RENT: { label: '房租', tagType: 'success' },
  WATER: { label: '水费', tagType: 'primary' },
  ELECTRIC: { label: '电费', tagType: 'warning' },
  OTHER: { label: '其他', tagType: 'default' }
}

const getTypeLabel = (type: string) => typesMap[type]?.label || type
const getItemClass = (type: string) => `tag-${typesMap[type]?.tagType || 'default'}`
const formatTime = (paidAt: string) => dayjs(paidAt).format('YYYY-MM-DD HH:mm')
</script>

<style scoped lang="less">

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

.detail-modal {
  width: 100%;
  max-width: 500px;
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

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-page);
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
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
}

.detail-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

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

.detail-value.price {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

.items-section {
  margin: 16px 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 12px;
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
  flex-wrap: wrap;
}

.item-tag {
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
}

.tag-success { background: #DCFCE7; color: #166534; }
.tag-primary { background: #DBEAFE; color: #1E40AF; }
.tag-warning { background: #FEF3C7; color: #92400E; }
.tag-default { background: #F1F5F9; color: #64748B; }

.item-amount {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
}

.meter-detail {
  width: 100%;
  text-align: right;
  font-size: 12px;
  color: var(--text-secondary);
  padding-top: 8px;
}

.detail-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-light);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  flex-shrink: 0;
}

.detail-footer .btn {
  flex: 1;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-secondary {
  background: white;
  color: var(--text-main);
  border: 2px solid var(--border-light);
}

.btn-icon {
  font-size: 18px;
}
</style>