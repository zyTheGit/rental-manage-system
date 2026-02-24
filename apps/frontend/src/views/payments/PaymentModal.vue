<template>
  <n-modal
    :show="show"
    @update:show="emit('close')"
    preset="card"
    title="添加缴费记录"
    :style="{ width: '600px' }"
    :segmented="{ content: 'soft', footer: 'soft' }"
  >
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="left"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="租户" path="tenantId">
        <n-select
          v-model:value="form.tenantId"
          placeholder="请选择租户"
          :options="tenantOptions"
          filterable
        />
      </n-form-item>

      <n-form-item label="类型" path="type">
        <n-select
          v-model:value="form.type"
          placeholder="请选择类型"
          :options="typeOptions"
        />
      </n-form-item>

      <n-form-item label="金额" path="amount">
        <n-input-number
          v-model:value="form.amount"
          :min="0"
          :precision="2"
          placeholder="0.00"
          :show-button="false"
        />
      </n-form-item>

      <n-form-item label="缴费时间" path="paidAt">
        <n-date-picker
          v-model:value="form.paidAt"
          type="datetime"
          placeholder="请选择时间"
          clearable
        />
      </n-form-item>

      <n-form-item label="备注" path="remark">
        <n-input
          v-model:value="form.remark"
          type="textarea"
          :rows="2"
          placeholder="请输入备注（可选）"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('close')">取消</n-button>
        <n-button type="primary" @click="handleSubmit">保存</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  show: boolean
  tenants?: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
}>()

const formRef = ref()
const form = ref({
  tenantId: null as number | null,
  type: '',
  amount: 0,
  paidAt: new Date(),
  remark: ''
})

const typeOptions = [
  { label: '房租', value: 'RENT' },
  { label: '水费', value: 'WATER' },
  { label: '电费', value: 'ELECTRIC' },
  { label: '其他', value: 'OTHER' }
]

const tenantOptions = computed(() => {
  return (props.tenants || []).map(tenant => ({
    label: `${tenant.name} - ${tenant.house?.title || ''}`,
    value: tenant.id
  }))
})

const rules = {
  tenantId: {
    required: true,
    type: 'number',
    message: '请选择租户',
    trigger: ['change', 'blur']
  },
  type: {
    required: true,
    message: '请选择缴费类型',
    trigger: ['change', 'blur']
  },
  amount: {
    required: true,
    type: 'number',
    message: '请输入金额',
    trigger: ['blur', 'change']
  },
  paidAt: {
    required: true,
    message: '请选择缴费时间',
    trigger: ['change', 'blur']
  }
}

const handleSubmit = () => {
  formRef.value?.validate().then(() => {
    emit('save', form.value)
  }).catch((error: any) => {
    console.error('验证失败', error)
  })
}

onMounted(() => {
  form.value.paidAt = new Date()
})
</script>
