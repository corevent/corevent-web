import { apiRequest } from './client'
import type { ApiData, Paginated, PaymentInfo, PaymentInfoListItem, PaymentInfoPayload } from './types'

const BASE = '/users/me/organizer-payment-info'

export function listPaymentInfo(page = 1, limit = 100): Promise<Paginated<PaymentInfoListItem>> {
  return apiRequest(BASE, { query: { page, limit } })
}

export function getPaymentInfo(id: string): Promise<ApiData<PaymentInfo>> {
  return apiRequest(`${BASE}/${id}`)
}

/** Requires the user to be 18+ and a complete PIX and/or bank group. */
export function createPaymentInfo(payload: PaymentInfoPayload): Promise<ApiData<PaymentInfo>> {
  return apiRequest(BASE, { method: 'POST', body: payload })
}

export function updatePaymentInfo(id: string, payload: PaymentInfoPayload): Promise<ApiData<PaymentInfo>> {
  return apiRequest(`${BASE}/${id}`, { method: 'PATCH', body: payload })
}

export function deletePaymentInfo(id: string): Promise<void> {
  return apiRequest(`${BASE}/${id}`, { method: 'DELETE' })
}
