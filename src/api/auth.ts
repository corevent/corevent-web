import { apiRequest, assertAuthTokens } from './client'
import type { ApiData, AuthTokens, MessageResponse, RegisterPayload, User } from './types'

// All /auth routes are public (AuthController has no JWT guard).

export async function login(email: string, password: string): Promise<AuthTokens> {
  const body = await apiRequest<unknown>('/auth/login', { method: 'POST', body: { email, password }, auth: false })
  return assertAuthTokens(body)
}

export function logout(refreshToken: string): Promise<void> {
  return apiRequest('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false })
}

/** Sends the 6-digit code required by /auth/register. Throttled to 3 requests/minute. */
export function sendVerifyEmailCode(email: string): Promise<MessageResponse> {
  return apiRequest('/auth/verify-email', { method: 'POST', body: { email }, auth: false })
}

/** Creates the account. Does not return tokens: log in afterwards. */
export function register(payload: RegisterPayload): Promise<ApiData<User>> {
  return apiRequest('/auth/register', { method: 'POST', body: payload, auth: false })
}

/** Throttled to 3 requests/minute. Succeeds even if the e-mail is not registered. */
export function forgotPassword(email: string): Promise<MessageResponse> {
  return apiRequest('/auth/forgot-password', { method: 'POST', body: { email }, auth: false })
}

export function resetPassword(email: string, code: string, newPassword: string): Promise<MessageResponse> {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: { email, code, newPassword },
    auth: false,
  })
}
