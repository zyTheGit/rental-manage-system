import request from '@/utils/request'
import type { House } from './houses'

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
    return request.put(`/tenants/${id}`, data)
  },
  delete: (id: number) => {
    return request.delete(`/tenants/${id}`)
  },
  checkout: (id: number) => {
    return request.post(`/tenants/${id}/checkout`)
  }
}