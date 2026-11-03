import { apiRequest } from './client'
import type { ApiData, MessageResponse, User } from './types'

export function getMe(): Promise<ApiData<User>> {
  return apiRequest('/users/me')
}

export function updateMe(payload: { name?: string; phoneNumber?: string | null }): Promise<ApiData<User>> {
  return apiRequest('/users', { method: 'PATCH', body: payload })
}

export function changePassword(currentPassword: string, newPassword: string): Promise<MessageResponse> {
  return apiRequest('/users/pass', { method: 'PATCH', body: { currentPassword, newPassword } })
}

/** Confirms an avatar uploaded through the presign flow. */
export function confirmAvatar(key: string): Promise<ApiData<User>> {
  return apiRequest('/users/me/avatar', { method: 'PATCH', body: { key } })
}
