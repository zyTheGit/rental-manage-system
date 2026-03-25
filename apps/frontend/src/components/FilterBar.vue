<template>
  <div class="filter-group">
    <select
      :value="modelValue"
      class="filter-select"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="(option, index) in options" :key="index" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
interface FilterOption {
  label: string
  value: string | null
}

defineProps<{
  modelValue: string | null
  options: FilterOption[]
}>()

defineEmits<{
  'update:modelValue': [value: string | null]
}>()
</script>

<style scoped lang="less">
.filter-group {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  min-width: 100px;
}

.filter-select:focus {
  border-color: var(--primary, #0F766E);
}
</style>