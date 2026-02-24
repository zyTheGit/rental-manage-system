<template>
  <n-modal
    :show="show"
    @update:show="emit('close')"
    preset="card"
    :title="house ? '编辑房屋' : '添加房屋'"
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
      <n-form-item label="标题" path="title">
        <n-input
          v-model:value="form.title"
          placeholder="请输入房屋标题"
        />
      </n-form-item>

      <n-form-item label="地址" path="address">
        <n-input
          v-model:value="form.address"
          placeholder="请输入地址"
        />
      </n-form-item>

      <n-form-item label="租金" path="rent">
        <n-input-number
          v-model:value="form.rent"
          :min="0"
          placeholder="0"
          :show-button="false"
        />
      </n-form-item>

      <n-form-item label="押金" path="deposit">
        <n-input-number
          v-model:value="form.deposit"
          :min="0"
          placeholder="0"
          :show-button="false"
        />
      </n-form-item>

      <n-form-item label="面积" path="area">
        <n-input-number
          v-model:value="form.area"
          :min="0"
          placeholder="0"
          :show-button="false"
        />
      </n-form-item>

      <n-form-item label="描述" path="description">
        <n-input
          v-model:value="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入描述"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="closeModal">取消</n-button>
        <n-button type="primary" @click="handleSubmit">保存</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  house?: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: any): void
}>()

const formRef = ref()
const form = ref({
  title: '',
  address: '',
  rent: 0,
  deposit: 0,
  area: 0,
  description: ''
})

const rules = {
  title: { required: true, message: '请输入标题', trigger: ['blur', 'input'] },
  address: { required: true, message: '请输入地址', trigger: ['blur', 'input'] },
  rent: { required: true, type: 'number', message: '请输入租金', trigger: ['blur', 'change'] },
  deposit: { required: true, type: 'number', message: '请输入押金', trigger: ['blur', 'change'] },
  area: { required: true, type: 'number', message: '请输入面积', trigger: ['blur', 'change'] }
}

const closeModal = () => {
  emit('close')
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    emit('save', form.value)
  } catch (error) {
    console.error('验证失败', error)
  }
}

watch(() => props.show, (show) => {
  if (show) {
    if (props.house) {
      form.value = { ...props.house }
    } else {
      form.value = {
        title: '',
        address: '',
        rent: 0,
        deposit: 0,
        area: 0,
        description: ''
      }
    }
  }
}, { immediate: true })
</script>
