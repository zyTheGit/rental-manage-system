import request from '@/utils/request'
import type { Tenant } from './tenants'

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
  update: (id: number, data: any) => {
    return request.patch(`/payments/${id}`, data)
  },
  delete: (id: number) => {
    return request.delete(`/payments/${id}`)
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