import { describe, expect, it } from '@jest/globals'
import { ApiError, getErrorMessage, parseErrorBody, translateMessage } from '../../src/api/errors'

describe('parseErrorBody (NestJS error format)', () => {
  it('reads string and array messages', () => {
    expect(parseErrorBody({ statusCode: 400, message: 'Invalid code' })).toEqual(['Invalid code'])
    expect(parseErrorBody({ statusCode: 400, message: ['a', 'b'] })).toEqual(['a', 'b'])
  })

  it('returns an empty list for unexpected bodies', () => {
    expect(parseErrorBody(undefined)).toEqual([])
    expect(parseErrorBody('<html>')).toEqual([])
  })
})

describe('translateMessage', () => {
  it('translates known API messages', () => {
    expect(translateMessage('Invalid credentials')).toBe('E-mail ou senha incorretos.')
    expect(translateMessage('User is not a organizer')).toMatch(/dados de recebimento/)
  })

  it('translates messages with dynamic parts', () => {
    expect(translateMessage('Invalid code, 3 attempts left')).toBe('Código incorreto. Restam 3 tentativa(s).')
    expect(translateMessage('Cannot update because event is not draft')).toMatch(/rascunho/)
  })

  it('returns null for unknown messages', () => {
    expect(translateMessage('something new')).toBeNull()
  })
})

describe('ApiError', () => {
  it('exposes translated messages and keeps raw ones', () => {
    const error = new ApiError(401, ['Invalid credentials'])
    expect(error.message).toBe('E-mail ou senha incorretos.')
    expect(error.hasRawMessage('Invalid credentials')).toBe(true)
    expect(error.hasRawMessage(/^Invalid/)).toBe(true)
  })

  it('uses generic messages for network and server errors', () => {
    expect(new ApiError(0, []).message).toMatch(/Não foi possível conectar/)
    expect(new ApiError(500, ['TypeError: x is undefined']).message).toMatch(/Erro interno/)
    expect(new ApiError(429, ['ThrottlerException: Too Many Requests']).message).toMatch(/Muitas tentativas/)
  })

  it('falls back to the status message when there are no details', () => {
    expect(new ApiError(403, []).message).toBe('Você não tem permissão para esta ação.')
  })

  it('has dedicated errors for unexpected responses and timeouts', () => {
    expect(ApiError.unexpectedResponse(200).message).toMatch(/Resposta inesperada/)
    expect(ApiError.timeout().message).toMatch(/demorou demais/)
  })
})

describe('getErrorMessage', () => {
  it('handles ApiError, Error and unknown values', () => {
    expect(getErrorMessage(new ApiError(404, []))).toBe('Recurso não encontrado.')
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
    expect(getErrorMessage('x')).toBe('Algo deu errado. Tente novamente.')
  })
})
