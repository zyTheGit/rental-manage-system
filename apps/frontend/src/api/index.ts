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
  waterInitialRead?: number
  electricInitialRead?: number
  waterRate?: number
  electricRate?: number
}

export const housesApi = {
  getList: (params?: any) => {
    return request.get('/houses', { params })
  },
  getById: (id: number) => {
    return request.get(`/houses/${id}`)
  },
  getByIdWithLastRead: (id: number) => {
    return request.get(`/houses/${id}/with-last-read`)
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
    return request.put(`/houses/${id}/status`, { status })
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
  status?: 'RENTED' | 'CHECKED_OUT'
  balance?: number
  createdAt: string
}

export const tenantsApi = {
  getList: (params?: any) => {
    return request.get('/tenants', { params })
  },
  getById: (id: number) => {
    return request.get(`/tenants/${id}`)
  },
  getLastMeterReads: (id: number) => {
    return request.get(`/tenants/${id}/last-meter-reads`)
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

export interface PaymentItem {
  id: number
  paymentId: number
  type: 'RENT' | 'WATER' | 'ELECTRIC' | 'OTHER'
  amount: number
  electricStartRead?: number
  electricEndRead?: number
  electricUsage?: number
  waterStartRead?: number
  waterEndRead?: number
  waterUsage?: number
}

export interface CreatePaymentItemDto {
  type: 'RENT' | 'WATER' | 'ELECTRIC' | 'OTHER'
  amount: number
  electricStartRead?: number
  electricEndRead?: number
  electricUsage?: number
  waterStartRead?: number
  waterEndRead?: number
  waterUsage?: number
}

export interface Payment {
  id: number
  tenantId: number
  tenant?: Tenant
  amount: number
  paidAt: string
  remark?: string
  createdAt: string
  userId?: number
  items?: PaymentItem[]
}

export interface CreatePaymentDto {
  tenantId: number
  items: CreatePaymentItemDto[]
  paidAt: string
  remark?: string
  actualPaid?: number
}

export const paymentsApi = {
  getList: (params?: any) => {
    return request.get('/payments', { params })
  },
  getById: (id: number) => {
    return request.get(`/payments/${id}`)
  },
  create: (data: CreatePaymentDto) => {
    return request.post('/payments', data)
  },
  getMonthlyStats: () => {
    return request.get('/payments/stats/monthly')
  },
  getYearlyStats: () => {
    return request.get('/payments/stats/yearly')
  },
  getUtilityStats: (params?: any) => {
    return request.get('/payments/utility-stats', { params })
  },
  getTenantUtilityByYear: (tenantId: number, year?: number) => {
    return request.get(`/payments/utility-stats/tenant/${tenantId}`, { params: year ? { year } : undefined })
  },
  getShareVerifyInfo: (id: number) => {
    return request.get(`/payments/share/${id}/verify`)
  },
  verifyShare: (id: number, idCardLast6: string) => {
    return request.post(`/payments/share/${id}/verify`, { idCardLast6 })
  }
}

export interface UtilityStats {
  id: number
  tenantId: number
  tenant?: Tenant
  year: number
  month: number
  electricStartRead: number
  electricEndRead: number
  electricUsage: number
  waterStartRead: number
  waterEndRead: number
  waterUsage: number
  createdAt: string
  updatedAt: string
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

export interface PaymentReminder {
  id: number
  tenantId: number
  tenant?: Tenant
  reminderDay: number
  dueDay: number
  enabled: boolean
  notifyByEmail: boolean
  notifyBySms: boolean
  lastReminderAt?: string
  lastDueAt?: string
  createdAt: string
  updatedAt: string
}

export const remindersApi = {
  getList: () => {
    return request.get('/reminders')
  },
  getById: (id: number) => {
    return request.get(`/reminders/${id}`)
  },
  getByTenant: (tenantId: number) => {
    return request.get(`/reminders/tenant/${tenantId}`)
  },
  create: (data: Partial<PaymentReminder>, tenantId: number) => {
    return request.post('/reminders', data, { params: { tenantId } })
  },
  update: (id: number, data: Partial<PaymentReminder>) => {
    return request.put(`/reminders/${id}`, data)
  },
  delete: (id: number) => {
    return request.delete(`/reminders/${id}`)
  },
  getOverdue: () => {
    return request.get('/reminders/overdue')
  }
}
