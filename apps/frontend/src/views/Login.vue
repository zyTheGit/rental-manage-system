<template>
  <div class="login-page">
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
      <div class="grid-pattern"></div>
    </div>
    
    <div class="login-wrapper">
      <div class="login-card">
        <div class="card-glow"></div>
        
        <div class="login-header">
          <div class="logo-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="16" width="32" height="20" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M4 20L20 10L36 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <rect x="16" y="26" width="8" height="10" fill="currentColor"/>
            </svg>
          </div>
          <h1 class="title">租房管理系统</h1>
          <p class="subtitle">欢迎回来，请登录您的账户</p>
        </div>

        <van-form @submit="handleSubmit" ref="formRef" class="login-form">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <div class="input-wrapper" :class="{ focused: focusedField === 'username' }">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                v-model="form.username"
                type="text"
                placeholder="请输入用户名"
                @focus="focusedField = 'username'"
                @blur="focusedField = ''"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">密码</label>
            <div class="input-wrapper" :class="{ focused: focusedField === 'password' }">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                @focus="focusedField = 'password'"
                @blur="focusedField = ''"
              />
              <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <transition name="shake">
            <div v-if="error" class="error-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ error }}</span>
            </div>
          </transition>

          <button type="submit" class="submit-btn" :disabled="loading" :class="{ loading }">
            <span class="btn-text">{{ loading ? '登录中' : '登录' }}</span>
            <svg v-if="!loading" class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
            <div v-else class="btn-loader"></div>
          </button>
        </van-form>
      </div>
      
      <p class="footer-text">安全登录 · 数据加密传输</p>
    </div>
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
const focusedField = ref('')
const showPassword = ref(false)

const handleSubmit = async () => {
  if (!form.value.username.trim()) {
    error.value = '请输入用户名'
    return
  }
  if (!form.value.password.trim()) {
    error.value = '请输入密码'
    return
  }
  
  error.value = ''
  
  try {
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
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;700&family=Noto+Sans+SC:wght@400;500;600&display=swap');

.login-page {
  min-height: 100vh;
  height: 100vh;
  background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 30%, #99f6e4 70%, #5eead4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.4;
  filter: blur(40px);
}

.circle-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  top: -80px;
  right: -80px;
  animation: float 20s ease-in-out infinite;
}

.circle-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #2dd4bf, #14b8a6);
  bottom: -40px;
  left: -40px;
  animation: float 15s ease-in-out infinite reverse;
}

.circle-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #5eead4, #99f6e4);
  top: 50%;
  left: 20%;
  animation: float 18s ease-in-out infinite 2s;
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(15, 118, 110, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 118, 110, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.05); }
  50% { transform: translate(-10px, 20px) scale(0.95); }
  75% { transform: translate(-20px, -10px) scale(1.02); }
}

.login-wrapper {
  width: 100%;
  max-width: 380px;
  position: relative;
  z-index: 1;
}

.login-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px 28px;
  box-shadow: 
    0 4px 24px rgba(15, 118, 110, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
  position: relative;
  animation: cardEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
  width: 100%;
  box-sizing: border-box;
}

@keyframes cardEnter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-glow {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 3px;
  background: linear-gradient(90deg, transparent, #14b8a6, #0f766e, #14b8a6, transparent);
  border-radius: 2px;
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  color: #0f766e;
  animation: logoFloat 3s ease-in-out infinite;
  background: linear-gradient(135deg, #f0fdfa, #ccfbf1);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(15, 118, 110, 0.15);
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.title {
  font-family: 'Noto Serif SC', serif;
  font-size: 28px;
  font-weight: 700;
  color: #134e4a;
  margin: 0 0 6px 0;
  letter-spacing: 2px;
}

.subtitle {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 14px;
  color: #14b8a6;
  margin: 0;
  font-weight: 500;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #0f766e;
  padding-left: 4px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f0fdfa;
  border: 2px solid transparent;
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0 4px;
}

.input-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  padding: 2px;
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.input-wrapper.focused {
  background: #fff;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.15);
}

.input-wrapper.focused::before {
  opacity: 1;
}

.input-icon {
  width: 24px;
  height: 24px;
  color: #14b8a6;
  margin-left: 14px;
  flex-shrink: 0;
  transition: color 0.3s;
}

.input-wrapper.focused .input-icon {
  color: #0f766e;
}

.input-wrapper input {
  flex: 1;
  height: 48px;
  padding: 0 12px;
  border: none;
  background: transparent;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 16px;
  color: #134e4a;
  outline: none;
  min-width: 0;
}

.input-wrapper input::placeholder {
  color: #99f6e4;
}

.toggle-password {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #14b8a6;
  transition: color 0.2s;
  flex-shrink: 0;
}

.toggle-password:hover {
  color: #0f766e;
}

.toggle-password svg {
  width: 22px;
  height: 22px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border-radius: 12px;
  border: 1px solid #fecaca;
  animation: shake 0.5s ease-in-out;
}

.error-message svg {
  width: 20px;
  height: 20px;
  color: #ef4444;
  flex-shrink: 0;
}

.error-message span {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 14px;
  color: #dc2626;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.shake-enter-active {
  animation: shake 0.5s ease-in-out;
}

.submit-btn {
  height: 50px;
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%);
  border: none;
  border-radius: 12px;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 4px;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.submit-btn:hover::before {
  left: 100%;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 118, 110, 0.35);
}

.submit-btn:active {
  transform: translateY(0);
}

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-text {
  transition: transform 0.3s;
}

.submit-btn:hover .btn-text {
  transform: translateX(-4px);
}

.btn-arrow {
  width: 22px;
  height: 22px;
  transition: transform 0.3s;
}

.submit-btn:hover .btn-arrow {
  transform: translateX(4px);
}

.btn-loader {
  width: 22px;
  height: 22px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.footer-text {
  text-align: center;
  margin-top: 16px;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 12px;
  color: #0f766e;
  opacity: 0.6;
}

@media (max-width: 480px) {
  .login-page {
    padding: 12px;
  }
  
  .login-card {
    padding: 24px 20px;
  }
  
  .logo-icon {
    width: 52px;
    height: 52px;
    padding: 10px;
    margin-bottom: 12px;
  }
  
  .title {
    font-size: 24px;
    letter-spacing: 1px;
  }
  
  .subtitle {
    font-size: 13px;
  }
  
  .login-header {
    margin-bottom: 20px;
  }
  
  .login-form {
    gap: 14px;
  }
  
  .input-wrapper input {
    font-size: 16px;
  }
  
  .submit-btn {
    font-size: 16px;
    height: 48px;
  }
}
</style>
