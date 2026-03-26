<template>
  <van-popup
    :show="show"
    position="right"
    :close-on-click-overlay="false"
    class="payment-detail-modal fullscreen-modal"
    @update:show="$emit('update:show', $event)"
  >
    <div class="modal-header">
      <div class="header-bg-pattern"></div>
      <div class="header-content">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            <path d="M9 14l2 2 4-4"/>
          </svg>
        </div>
        <h2 class="modal-title">缴费详情</h2>
        <p class="modal-subtitle">查看缴费记录详细信息</p>
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
      </div>

      <div class="form-section">
        <div class="section-header">
          <span class="section-icon">📅</span>
          <span class="section-title">缴费信息</span>
        </div>
        <div class="section-content">
          <div class="info-row">
            <span class="info-label">缴费时间</span>
            <span class="info-value">{{ formatTime(payment.paidAt) }}</span>
          </div>
          <div class="info-row total">
            <span class="info-label">总金额</span>
            <span class="info-value price">¥{{ payment.amount }}</span>
          </div>
        </div>
      </div>

      <div v-if="payment.items?.length" class="form-section">
        <div class="section-header">
          <span class="section-icon">💰</span>
          <span class="section-title">缴费项目</span>
        </div>
        <div class="section-content">
          <div v-for="(item, index) in payment.items" :key="index" class="item-card">
            <div class="item-header">
              <span class="item-tag" :class="getItemClass(item.type)">{{ getTypeLabel(item.type) }}</span>
              <span class="item-amount">¥{{ item.amount }}</span>
            </div>
            <div v-if="item.type === 'ELECTRIC'" class="meter-info">
              <div class="meter-row">
                <span class="meter-label">电表读数</span>
                <span class="meter-value">{{ item.electricStartRead || 0 }} → {{ item.electricEndRead || 0 }}</span>
              </div>
              <div class="meter-row">
                <span class="meter-label">用电量</span>
                <span class="meter-value highlight">{{ item.electricUsage || 0 }} 度</span>
              </div>
            </div>
            <div v-if="item.type === 'WATER'" class="meter-info">
              <div class="meter-row">
                <span class="meter-label">水表读数</span>
                <span class="meter-value">{{ item.waterStartRead || 0 }} → {{ item.waterEndRead || 0 }}</span>
              </div>
              <div class="meter-row">
                <span class="meter-label">用水量</span>
                <span class="meter-value highlight">{{ item.waterUsage || 0 }} 吨</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="payment.remark" class="form-section">
        <div class="section-header">
          <span class="section-icon">📝</span>
          <span class="section-title">备注信息</span>
        </div>
        <div class="section-content">
          <p class="remark-text">{{ payment.remark }}</p>
        </div>
      </div>
    </div>

    <div class="form-footer">
      <button class="btn btn-cancel" @click="$emit('update:show', false)">关闭</button>
      <button class="btn btn-share" @click="$emit('share')">
        <span>分享</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
        </svg>
      </button>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { Payment } from '@/api/payments'
import { type TagType } from 'vant'

defineProps<{
  show: boolean
  payment: Payment | null
}>()

defineEmits<{
  'update:show': [value: boolean]
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
.fullscreen-modal {
  width: 100%;
  height: 100%;
}

.payment-detail-modal {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  position: relative;
  padding: 16px 20px;
  background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
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
  background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
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

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
  
  &:last-child {
    border-bottom: none;
  }
  
  &.total {
    background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
    margin: 0 -16px -16px;
    padding: 16px;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    border-bottom: none;
  }
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  
  &.price {
    font-size: 22px;
    font-weight: 700;
    color: #0EA5E9;
  }
}

.item-card {
  padding: 14px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
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
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
}

.meter-info {
  padding-top: 8px;
  border-top: 1px solid var(--border-light);
}

.meter-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.meter-label {
  color: var(--text-secondary);
}

.meter-value {
  color: var(--text-main);
  font-weight: 500;
  
  &.highlight {
    color: #0EA5E9;
    font-weight: 600;
  }
}

.remark-text {
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.6;
  margin: 0;
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

.btn-share {
  background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  
  svg {
    width: 18px;
    height: 18px;
    transition: transform 0.2s ease;
  }
  
  &:active {
    svg {
      transform: translateY(-2px);
    }
  }
}
</style>