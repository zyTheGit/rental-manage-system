<template>
  <div class="login-page">
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-header">
          <h1 class="title">租房管理系统</h1>
          <p class="subtitle">房东登录</p>
        </div>

        <van-form @submit="handleSubmit" ref="formRef">
          <van-cell-group inset>
            <van-field
              v-model="form.username"
              clearable
              label="用户名"
              placeholder="请输入用户名"
              :rules="fieldValidators.username"
            >
              <template #left-icon>
                <van-icon name="user-o" />
              </template>
            </van-field>

            <van-field
              v-model="form.password"
              type="password"
              clearable
              label="密码"
              placeholder="请输入密码"
              :rules="fieldValidators.password"
            >
              <template #left-icon>
                <van-icon name="lock" />
              </template>
            </van-field>
          </van-cell-group>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <van-button
            block
            type="primary"
            native-type="submit"
            size="large"
            :loading="loading"
            loading-text="登录中..."
          >
            登录
          </van-button>
        </van-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { fieldValidators } from '@/utils/validate'

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

const handleSubmit = async () => {
  error.value = ''
  
  try {
    await formRef.value.validate()
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

<style scoped lang="less">

.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.login-wrapper {
  width: 100%;
  max-width: 420px;
}

.login-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.error-message {
  color: var(--accent);
  font-size: 14px;
  text-align: left;
  padding: 12px 16px;
  background: var(--accent-light);
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  border: 1px solid rgba(255, 107, 107, 0.2);
}

:deep(.van-cell-group--inset) {
  background: var(--bg-input);
  border-radius: var(--radius-md);
}

:deep(.van-field__left-icon) {
  color: var(--text-secondary);
}

:deep(.van-button--primary) {
  background: var(--primary);
  border-color: var(--primary);
  font-weight: 600;
}

:deep(.van-button--primary:active) {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
}
</style>
