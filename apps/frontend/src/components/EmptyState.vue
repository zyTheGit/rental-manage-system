<template>
  <div class="empty-state">
    <span class="empty-icon">{{ icon }}</span>
    <p class="empty-text">{{ text }}</p>
    <button v-if="showButton" class="btn btn-primary" @click="$emit('click')">
      {{ buttonText }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  text?: string
  showButton?: boolean
  buttonText?: string
}>()

defineEmits<{
  click: []
}>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  color: var(--text-secondary, #64748B);
  font-size: 14px;
  margin-bottom: 20px;
}
</style>