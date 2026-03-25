<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    @update:show="$emit('update:show', $event)"
  >
    <div class="picker-header">
      <span class="picker-title">{{ title }}</span>
      <button class="picker-close" @click="$emit('update:show', false)">✕</button>
    </div>
    <div class="picker-options">
      <div
        v-for="option in options"
        :key="option.value"
        class="picker-option"
        :class="{ active: modelValue === option.value }"
        @click="handleSelect(option.value)"
      >
        <span class="picker-radio"></span>
        <div class="picker-option-content">
          <div class="picker-option-title">{{ option.label }}</div>
          <div v-if="option.subtitle" class="picker-option-subtitle">{{ option.subtitle }}</div>
        </div>
      </div>
      <div v-if="options.length === 0" class="picker-empty">
        <span class="picker-empty__icon">📋</span>
        <p>暂无选项</p>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
interface PickerOption {
  value: any
  label: string
  subtitle?: string
}

defineProps<{
  show: boolean
  title: string
  options: PickerOption[]
  modelValue: any
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'update:modelValue': [value: any]
  'change': [value: any]
}>()

const handleSelect = (value: any) => {
  emit('update:modelValue', value)
  emit('change', value)
  emit('update:show', false)
}
</script>

<style scoped>
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.picker-close {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
}

.picker-options {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px 20px 16px;
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

.picker-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border-light);
  margin-right: 12px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.picker-option.active .picker-radio {
  border-color: var(--primary);
  position: relative;
}

.picker-option.active .picker-radio::after {
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

.picker-option-content {
  flex: 1;
}

.picker-option-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
}

.picker-option-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

.picker-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.picker-empty__icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}
</style>
