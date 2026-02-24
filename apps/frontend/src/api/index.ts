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

export interface House {
  id: number
  title: string
  address: string
  rent: number
  deposit: number
  area: number
  status: 'AVAILABLE' | 'RENTED'
  description: string
  createdAt: string
}

export const housesApi = {
  getList: (params?: any) => {
    return request.get('/houses', { params })
  },
  getById: (id: number) => {
    return request.get(`/houses/${id}`)
  },
  create: (data: Partial<House>) => {
    return request.post('/houses', data)
  },
  update: (id: number, data: Partial<House>) => {
    return request.patch(`/houses/${id}`, data)
  },
  delete: (id: number) => {
    return request.delete(`/houses/${id}`)
  },
  updateStatus: (id: number, status: string) => {
    return request.patch(`/houses/${id}/status`, { status })
  }
}

export interface Tenant {
  id: number
  name: string
  phone: string
  idCard: string
  houseId: number
  house?: House
  rentStart: string
  rentEnd: string
  createdAt: string
}

export const tenantsApi = {
  getList: (params?: any) => {
    return request.get('/tenants', { params })
  },
  getById: (id: number) => {
    return request.get(`/tenants/${id}`)
  },
  create: (data: Partial<Tenant>) => {
    return request.post('/tenants', data)
  },
  update: (id: number, data: Partial<Tenant>) => {
    return request.patch(`/tenants/${id}`, data)
  },
  delete: (id: number) => {
    return request.delete(`/tenants/${id}`)
  },
  checkout: (id: number) => {
    return request.post(`/tenants/${id}/checkout`)
  }
}

export interface Payment {
  id: number
  tenantId: number
  tenant?: Tenant
  type: 'RENT' | 'WATER' | 'ELECTRIC' | 'OTHER'
  amount: number
  paidAt: string
  remark?: string
  createdAt: string
}

export const paymentsApi = {
  getList: (params?: any) => {
    return request.get('/payments', { params })
  },
  create: (data: Partial<Payment>) => {
    return request.post('/payments', data)
  },
  stats: (type: 'month' | 'year') => {
    return request.get(`/payments/stats/${type}`)
  }
}

export interface DashboardStats {
  totalIncome: number
  monthIncome: number
  yearIncome: number
  occupancyRate: number
  houseCount: number
  tenantCount: number
  incomeTrend: any[]
  paymentDistribution: any[]
}

export const dashboardApi = {
  getStats: () => {
    return request.get('/dashboard/stats')
  }
}
