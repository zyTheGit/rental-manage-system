import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios'
import { useUserStore } from '@/stores/user'
import { showToast } from 'vant'
import { useLoading } from '@/composables/useLoading'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const request: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    
    if (userStore.token && config.headers) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    
    if (config.showLoading !== false) {
      useLoading().start()
    }
    
    config.metadata = { startTime: new Date().getTime() }
    
    return config
  },
  (error: AxiosError) => {
    if (error.config?.showLoading !== false) {
      useLoading().stop()
    }
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.config?.showLoading !== false) {
      useLoading().stop()
    }
    
    return response.data
  },
  (error: AxiosError<any>) => {
    if (error.config?.showLoading !== false) {
      useLoading().stop()
    }
    
    const { response } = error
    
    if (response) {
      const status = response.status
      const message = response.data?.message || '请求失败'
      
      switch (status) {
        case 401:
          const currentPath = window.location.pathname
          if (currentPath === '/login') {
            // 登录页面返回401不跳转，让业务代码处理错误
            break
          }
          showToast('登录已过期，请重新登录')
          const userStore = useUserStore()
          userStore.logout()
          window.location.href = '/login'
          break
          
        case 403:
          showToast('没有权限访问')
          break
          
        case 404:
          showToast('请求的资源不存在')
          break
          
        case 422:
          const errors = response.data?.errors
          if (errors && typeof errors === 'object') {
            const errorMessages = Object.values(errors).flat().join('；')
            showToast(errorMessages || '表单验证失败')
          } else {
            showToast(message)
          }
          break
          
        case 500:
          showToast('服务器错误，请稍后重试')
          break
          
        default:
          showToast(message)
      }
    } else if (error.code === 'ECONNABORTED') {
      showToast('请求超时，请检查网络连接')
    } else {
      showToast('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    showLoading?: boolean
    metadata?: {
      startTime: number
    }
  }
}

export default request
