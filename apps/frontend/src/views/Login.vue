<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center p-4">
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      class="card w-full max-w-md"
      size="large"
    >
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-800">租房管理系统</h1>
        <p class="text-gray-600 mt-2">房东登录</p>
      </div>

      <n-form-item label="用户名" path="username">
        <n-input
          v-model:value="form.username"
          placeholder="请输入用户名"
          :disabled="loading"
        />
      </n-form-item>

      <n-form-item label="密码" path="password">
        <n-input
          v-model:value="form.password"
          type="password"
          placeholder="请输入密码"
          show-password-on="click"
          :disabled="loading"
        />
      </n-form-item>

      <div class="text-red-500 text-sm mb-4">
        {{ error }}
      </div>

      <n-button
        type="primary"
        block
        size="large"
        :loading="loading"
        @click="handleSubmit"
      >
        登录
      </n-button>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()
const form = ref({
  username: '',
  password: ''
})
const loading = ref(false)
const error = ref('')

const rules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: ['blur', 'input']
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: ['blur', 'input']
  }
}

const handleSubmit = async () => {
  error.value = ''
  
  try {
    await formRef.value?.validate()
    loading.value = true
    
    await userStore.login(form.value.username, form.value.password)
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (e: any) {
    error.value = e.response?.data?.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>
