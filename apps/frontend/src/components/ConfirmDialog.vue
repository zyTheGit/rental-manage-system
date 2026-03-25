<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('cancel')">
    <div class="confirm-dialog">
      <div class="confirm-content">
        <span class="confirm-icon">{{ icon }}</span>
        <p class="confirm-message">{{ message }}</p>
      </div>
      <div class="confirm-actions">
        <button class="btn btn-outline" @click="$emit('cancel')">{{ cancelText }}</button>
        <button class="btn btn-danger" @click="$emit('confirm')">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  message: string
  icon?: string
  confirmText?: string
  cancelText?: string
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped lang="less">
.confirm-dialog {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 300px;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.confirm-content {
  text-align: center;
  margin-bottom: 20px;
}

.confirm-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.confirm-message {
  font-size: 16px;
  color: var(--text-main, #1E293B);
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.confirm-actions .btn {
  flex: 1;
}
</style>