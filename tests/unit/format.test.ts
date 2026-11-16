import { describe, expect, it } from '@jest/globals'
import {
  dateTimeLocalToIso,
  firstName,
  formatCurrency,
  formatIsoDate,
  formatLongDate,
  getInitials,
  maskCnpj,
  maskCpf,
  maskDocument,
  maskPhone,
  maskZipCode,
  toDateTimeLocal,
  toNumber,
} from '../../src/utils/format'

// Intl uses non-breaking spaces in currency output.
const normalizeSpaces = (value: string) => value.replace(/\s/g, ' ')

describe('masks', () => {
  it('masks CPF progressively while typing', () => {
    expect(maskCpf('529')).toBe('529')
    expect(maskCpf('5299822')).toBe('529.982.2')
    expect(maskCpf('52998224725')).toBe('529.982.247-25')
    expect(maskCpf('529982247259999')).toBe('529.982.247-25')
  })

  it('masks CNPJ', () => {
    expect(maskCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('picks the mask by document type', () => {
    expect(maskDocument('52998224725', 'cpf')).toBe('529.982.247-25')
    expect(maskDocument('11222333000181', 'cnpj')).toBe('11.222.333/0001-81')
  })

  it('masks landline and mobile phones', () => {
    expect(maskPhone('14')).toBe('(14')
    expect(maskPhone('1432345678')).toBe('(14) 3234-5678')
    expect(maskPhone('14981234567')).toBe('(14) 98123-4567')
  })

  it('masks the zip code (CEP)', () => {
    expect(maskZipCode('17201000')).toBe('17201-000')
  })
})

describe('numbers and currency', () => {
  it('converts decimal strings sent by the API', () => {
    expect(toNumber('180.00')).toBe(180)
    expect(toNumber(42)).toBe(42)
    expect(toNumber(null)).toBe(0)
    expect(toNumber('abc')).toBe(0)
  })

  it('formats BRL currency', () => {
    expect(normalizeSpaces(formatCurrency(1234.5))).toBe('R$ 1.234,50')
  })
})

describe('dates', () => {
  it('formats long dates like the mockup', () => {
    expect(formatLongDate('2026-11-14T21:00:00.000Z')).toBe('14 de Novembro, 2026')
  })

  it('formats YYYY-MM-DD without timezone shifts', () => {
    expect(formatIsoDate('2000-01-01')).toBe('01/01/2000')
  })

  it('round-trips datetime-local values to ISO with Z (required by the API)', () => {
    const local = toDateTimeLocal(new Date(2026, 11, 20, 19, 30))
    expect(local).toBe('2026-12-20T19:30')
    expect(dateTimeLocalToIso(local)).toBe('2026-12-20T22:30:00.000Z')
  })
})

describe('names', () => {
  it('builds initials and first names', () => {
    expect(getInitials('Vinicius Cruz Silva')).toBe('VC')
    expect(getInitials('')).toBe('?')
    expect(firstName('  Vinicius Cruz ')).toBe('Vinicius')
  })
})
