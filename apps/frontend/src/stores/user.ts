import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type User } from '@/api'
import { localStorage } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  const login = async (username: string, password: string) => {
    const res = await authApi.login({ username, password }) as any
    token.value = res.access_token
    user.value = res.user
    localStorage.setToken(res.access_token)
    localStorage.setUser(res.user)
    return res
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeToken()
    localStorage.removeUser()
  }

  const loadFromStorage = () => {
    const savedToken = localStorage.getToken()
    const savedUser = localStorage.getUser()
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = savedUser
    }
  }

  const fetchCurrentUser = async () => {
    const res = await authApi.getCurrentUser() as unknown as User
    user.value = res
    localStorage.setUser(res)
    return res
  }

  loadFromStorage()

  return {
    token,
    user,
    isLoggedIn,
    login,
    logout,
    fetchCurrentUser
  }
})
