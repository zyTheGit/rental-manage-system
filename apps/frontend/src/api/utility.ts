import request from '@/utils/request'
import type { Tenant } from './tenants'

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

export interface YearlyStats {
  totalElectricUsage: number
  totalWaterUsage: number
  yearlyData?: {
    month: number
    electricUsage: number
    waterUsage: number
  }[]
}

export const utilityApi = {
  getStats: (params?: any) => {
    return request.get('/payments/utility-stats', { params })
  },
  getTenantByYear: (tenantId: number, year?: number) => {
    return request.get(`/payments/utility-stats/tenant/${tenantId}`, { params: year ? { year } : undefined })
  }
}