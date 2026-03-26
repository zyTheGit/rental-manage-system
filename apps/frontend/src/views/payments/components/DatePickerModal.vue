<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('cancel')">
    <div class="picker-content slide-in-bottom">
      <div class="picker-header">
        <button class="btn btn-outline btn-sm" @click="$emit('cancel')">取消</button>
        <h3 class="picker-title">{{ title }}</h3>
        <button class="btn btn-primary btn-sm" @click="handleConfirm">确认</button>
      </div>
      <van-date-picker
        v-model="selectedValues"
        :show-toolbar="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{
  show: boolean
  title?: string
  defaultDate?: string
}>()

const emit = defineEmits<{
  confirm: [val: { selectedValues: string[] }]
  cancel: []
}>()

const getDefaultDateValues = () => {
  if (props.defaultDate) {
    const d = dayjs(props.defaultDate)
    return [d.format('YYYY'), d.format('MM'), d.format('DD')]
  }
  return [dayjs().format('YYYY'), dayjs().format('MM'), dayjs().format('DD')]
}

const selectedValues = ref(getDefaultDateValues())

watch(() => props.show, (val) => {
  if (val) {
    selectedValues.value = getDefaultDateValues()
  }
})

const handleConfirm = () => {
  emit('confirm', { selectedValues: selectedValues.value })
}
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
  background: var(--bg-card);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
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