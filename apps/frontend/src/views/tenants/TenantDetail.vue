<template>
  <van-popup
    v-model:show="show"
    round
    position="bottom"
    :style="{ padding: '20px 16px' }"
    @update:show="emit('close')"
  >
    <div class="detail-modal">
      <div class="modal-title">租户详情</div>
      
      <div v-if="tenant" class="detail-content">
        <van-cell-group title="基本信息" inset>
          <van-cell title="姓名" :value="tenant.name" />
          <van-cell title="电话" :value="tenant.phone" />
          <van-cell title="身份证号" :value="tenant.idCard" />
          <van-cell>
            <template #title>
              <span>状态</span>
              <van-tag
                :type="tenant.status === 'RENTED' ? 'success' : 'default'"
                style="margin-left: 8px"
              >
                {{ tenant.status === 'RENTED' ? '已租' : '已退租' }}
              </van-tag>
            </template>
          </van-cell>
        </van-cell-group>

        <van-cell-group title="房屋信息" inset>
          <van-cell title="房屋标题" :value="tenant.house?.title || '-'" />
          <van-cell title="房屋地址" :value="tenant.house?.address || '-'" />
          <van-cell title="租金" :value="`¥${tenant.house?.rent?.toLocaleString() || 0}/月`" />
          <van-cell title="押金" :value="`¥${tenant.house?.deposit?.toLocaleString() || 0}`" />
        </van-cell-group>

        <van-cell-group title="租期信息" inset>
          <van-cell title="租期开始" :value="formatDate(tenant.rentStart)" />
          <van-cell title="租期结束" :value="formatDate(tenant.rentEnd)" />
          <van-cell title="租期时长">
            <template #value>
              {{ formatRentPeriod(tenant.rentStart, tenant.rentEnd) }}
            </template>
          </van-cell>
        </van-cell-group>

        <van-cell-group title="其他信息" inset>
          <van-cell title="创建时间" :value="formatDateTime(tenant.createdAt)" />
          <van-cell title="更新时间" :value="formatDateTime(tenant.updatedAt)" />
        </van-cell-group>

        <div class="modal-actions">
          <van-button
            v-if="tenant.status === 'RENTED'"
            type="danger"
            block
            @click="handleCheckout"
          >
            退租
          </van-button>
          <van-button type="primary" block @click="handleClose">关闭</van-button>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { showToast, showConfirmDialog, showLoadingToast, closeToast } from 'vant'
import dayjs from 'dayjs'
import { tenantsApi } from '@/api'

const props = defineProps<{
  show: boolean
  tenant?: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
}>()

const formatDate = (value: string) => {
  return value ? dayjs(value).format('YYYY-MM-DD') : '-'
}

const formatDateTime = (value: string) => {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const formatRentPeriod = (start: string, end: string) => {
  if (!start || !end) return '-'
  const startTime = dayjs(start)
  const endTime = dayjs(end)
  const months = endTime.diff(startTime, 'month', true)
  if (months < 1) {
    const days = endTime.diff(startTime, 'day')
    return `${days} 天`
  }
  const years = Math.floor(months / 12)
  const remainingMonths = Math.round(months % 12)
  if (years > 0) {
    return remainingMonths > 0 ? `${years} 年 ${remainingMonths} 个月` : `${years} 年`
  }
  return `${remainingMonths} 个月`
}

const handleCheckout = () => {
  if (!props.tenant) return
  
  showConfirmDialog({
    title: '确认退租',
    message: `确认租户 ${props.tenant.name} 退租？退租后房屋将自动释放。`
  })
    .then(async () => {
      showLoadingToast({
        message: '处理中...',
        forbidClick: true,
        duration: 0
      })
      try {
        await tenantsApi.checkout(props.tenant.id)
        closeToast()
        showToast({ type: 'success', message: '退租成功' })
        emit('refresh')
        emit('close')
      } catch (error: any) {
        closeToast()
        showToast({
          type: 'fail',
          message: error.response?.data?.message || '退租失败'
        })
      }
    })
    .catch(() => {})
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.detail-modal {
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  text-align: center;
}

.detail-content {
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}
</style>
