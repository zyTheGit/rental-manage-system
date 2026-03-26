import request from '@/utils/request'
import type { Tenant } from './tenants'

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
  },
  sendEmails: () => {
    return request.post('/reminders/send-emails')
  },
  sendTestEmail: (tenantId: number) => {
    return request.post(`/reminders/test-email/${tenantId}`)
  }
}