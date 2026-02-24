<template>
  <n-modal
    :show="show"
    @update:show="emit('close')"
    preset="card"
    :title="tenant ? '编辑租户' : '添加租户'"
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
      <n-form-item label="姓名" path="name">
        <n-input v-model:value="form.name" placeholder="请输入姓名" />
      </n-form-item>

      <n-form-item label="电话" path="phone">
        <n-input v-model:value="form.phone" placeholder="请输入电话" />
      </n-form-item>

      <n-form-item label="身份证号" path="idCard">
        <n-input v-model:value="form.idCard" placeholder="请输入身份证号" />
      </n-form-item>

      <n-form-item label="选择房屋" path="houseId">
        <n-select
          v-model:value="form.houseId"
          placeholder="请选择房屋"
          :options="houseOptions"
          :loading="loadingHouses"
          filterable
        />
      </n-form-item>

      <n-form-item label="租期起止" path="rentDate">
        <n-date-picker
          v-model:value="form.rentDate"
          type="daterange"
          is-range
          clearable
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('close')">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="loading">保存</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  show: boolean
  tenant?: any
  availableHouses?: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
}>()

const formRef = ref()
const loading = ref(false)
const loadingHouses = ref(false)
const form = ref({
  name: '',
  phone: '',
  idCard: '',
  houseId: null,
  rentDate: null as (Date | null)[] | null
})

const houseOptions = computed(() => {
  return (props.availableHouses || []).map(house => ({
    label: `${house.title} - ${house.address}`,
    value: house.id
  }))
})

const rules = {
  name: { required: true, message: '请输入姓名', trigger: ['blur', 'input'] },
  phone: { required: true, message: '请输入电话', trigger: ['blur', 'input'] },
  idCard: { required: true, message: '请输入身份证号', trigger: ['blur', 'input'] },
  houseId: {
    required: true,
    type: 'number',
    message: '请选择房屋',
    trigger: ['change', 'blur']
  },
  rentDate: {
    type: 'array',
    required: true,
    message: '请选择租期',
    trigger: ['change', 'blur']
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    const data: any = {
      ...form.value,
      rentStart: form.value.rentDate?.[0]?.toISOString() || '',
      rentEnd: form.value.rentDate?.[1]?.toISOString() || ''
    }
    
    delete data.rentDate
    
    emit('save', data)
  } catch (error) {
    console.error('验证失败', error)
  }
}

watch(() => props.show, (show) => {
  if (show) {
    if (props.tenant) {
      form.value = {
        name: props.tenant.name,
        phone: props.tenant.phone,
        idCard: props.tenant.idCard,
        houseId: props.tenant.houseId,
        rentDate: [
          props.tenant.rentStart ? new Date(props.tenant.rentStart) : null,
          props.tenant.rentEnd ? new Date(props.tenant.rentEnd) : null
        ]
      }
    } else {
      form.value = {
        name: '',
        phone: '',
        idCard: '',
        houseId: null,
        rentDate: null
      }
    }
  }
}, { immediate: true })
</script>
