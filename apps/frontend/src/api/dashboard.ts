import request from '@/utils/request'

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