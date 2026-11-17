import { describe, expect, it } from '@jest/globals'
import {
  PASSWORD_RULES,
  ageFromIsoDate,
  isStrongPassword,
  isValidCellphone,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  isValidPhone,
  isValidPixRandomKey,
  onlyDigits,
  toIsoDate,
} from '../../src/utils/validators'

describe('onlyDigits', () => {
  it('removes every non-digit character', () => {
    expect(onlyDigits('529.982.247-25')).toBe('52998224725')
    expect(onlyDigits('(14) 98123-4567')).toBe('14981234567')
  })
})

describe('isValidCpf (same algorithm as the API)', () => {
  it.each(['52998224725', '529.982.247-25', '11144477735'])('accepts valid CPF %s', (cpf) => {
    expect(isValidCpf(cpf)).toBe(true)
  })

  it.each([
    ['wrong check digit', '52998224724'],
    ['repeated digits', '11111111111'],
    ['too short', '5299822472'],
    ['empty', ''],
  ])('rejects CPF with %s', (_, cpf) => {
    expect(isValidCpf(cpf)).toBe(false)
  })
})

describe('isValidCnpj', () => {
  it('accepts a valid CNPJ with or without mask', () => {
    expect(isValidCnpj('11222333000181')).toBe(true)
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
  })

  it('rejects invalid CNPJs', () => {
    expect(isValidCnpj('11222333000182')).toBe(false)
    expect(isValidCnpj('00000000000000')).toBe(false)
    expect(isValidCnpj('1122233300018')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('validates the basic e-mail shape', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail(' user@example.com ')).toBe(true)
    expect(isValidEmail('user@example')).toBe(false)
    expect(isValidEmail('user example.com')).toBe(false)
  })
})

describe('phones', () => {
  it('accepts Brazilian mobile numbers (with or without +55)', () => {
    expect(isValidCellphone('14981234567')).toBe(true)
    expect(isValidCellphone('+55 (14) 98123-4567')).toBe(true)
  })

  it('rejects mobile numbers without the leading 9 or with DDD 0X', () => {
    expect(isValidCellphone('1481234567')).toBe(false)
    expect(isValidCellphone('04981234567')).toBe(false)
  })

  it('accepts landlines and mobiles in isValidPhone', () => {
    expect(isValidPhone('1432345678')).toBe(true)
    expect(isValidPhone('14981234567')).toBe(true)
    expect(isValidPhone('123')).toBe(false)
  })
})

describe('isValidPixRandomKey', () => {
  it('accepts UUID keys and rejects other formats', () => {
    expect(isValidPixRandomKey('123e4567-e89b-42d3-a456-426614174000')).toBe(true)
    expect(isValidPixRandomKey('not-a-uuid')).toBe(false)
  })
})

describe('password rules (mirror the API)', () => {
  it('accepts a password that satisfies every rule', () => {
    expect(isStrongPassword('Senha@2026')).toBe(true)
  })

  it.each([
    ['length', 'Se@1a'],
    ['upper', 'senha@2026'],
    ['lower', 'SENHA@2026'],
    ['number', 'Senha@abcd'],
    ['symbol', 'Senha2026x'],
  ])('flags the "%s" rule', (rule, password) => {
    const failed = PASSWORD_RULES.filter(({ test }) => !test(password)).map(({ rule: name }) => name)
    expect(failed).toEqual([rule])
    expect(isStrongPassword(password)).toBe(false)
  })

  it('only accepts the symbols supported by the API', () => {
    expect(isStrongPassword('Senha.2026')).toBe(false)
    expect(isStrongPassword('Senha#2026')).toBe(true)
  })
})

describe('toIsoDate', () => {
  it('builds YYYY-MM-DD from day/month/year inputs', () => {
    expect(toIsoDate('9', '8', '2006')).toBe('2006-08-09')
  })

  it('returns null for dates that do not exist', () => {
    expect(toIsoDate('29', '2', '2023')).toBeNull()
    expect(toIsoDate('31', '4', '2024')).toBeNull()
    expect(toIsoDate('10', '10', '99')).toBeNull()
  })

  it('accepts leap days', () => {
    expect(toIsoDate('29', '2', '2024')).toBe('2024-02-29')
  })
})

describe('ageFromIsoDate', () => {
  const now = new Date(2026, 10, 5) // 05/11/2026

  it('counts full years only', () => {
    expect(ageFromIsoDate('2008-11-05', now)).toBe(18)
    expect(ageFromIsoDate('2008-11-06', now)).toBe(17)
    expect(ageFromIsoDate('2000-01-01', now)).toBe(26)
  })
})
