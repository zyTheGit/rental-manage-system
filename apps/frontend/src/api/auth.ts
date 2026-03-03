import request from '@/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface User {
  id: number
  username: string
  fullName: string
  role: string
}

export const authApi = {
  login: (params: LoginParams) => {
    return request.post('/auth/login', params)
  },
  getCurrentUser: () => {
    return request.get('/auth/me')
  }
}