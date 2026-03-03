import request from '@/utils/request'

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