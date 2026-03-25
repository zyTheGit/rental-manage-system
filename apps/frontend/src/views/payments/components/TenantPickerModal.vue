<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('cancel')">
    <div class="picker-content slide-in-bottom">
      <div class="picker-header">
        <button class="btn btn-outline btn-sm" @click="$emit('cancel')">取消</button>
        <h3 class="picker-title">选择租户</h3>
        <button class="btn btn-primary btn-sm" @click="$emit('confirm')">确认</button>
      </div>
      <div class="picker-options">
        <div
          v-for="tenant in tenants"
          :key="tenant.id"
          class="picker-option"
          :class="{ active: selectedId === tenant.id }"
          @click="$emit('select', tenant)"
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
</template>

<script setup lang="ts">
import type { Tenant } from '@/api/tenants'

defineProps<{
  show: boolean
  tenants: Tenant[]
  selectedId: number | null
}>()

defineEmits<{
  select: [tenant: Tenant]
  confirm: []
  cancel: []
}>()
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

.picker-content {
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

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.picker-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.picker-options {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 20px;
}

.picker-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.picker-option:hover {
  background: var(--bg-input);
}

.picker-option:active {
  transform: scale(0.98);
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
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.picker-option.active .option-radio {
  border-color: var(--primary);
  position: relative;
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

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-outline {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
</style>