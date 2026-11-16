import { describe, expect, it } from '@jest/globals'
import { buildCsv, slugify } from '../../src/utils/csv'

describe('buildCsv', () => {
  it('builds a ";"-separated CSV with CRLF line breaks', () => {
    expect(buildCsv(['Nome', 'Ingressos'], [['Ana', 2]])).toBe('Nome;Ingressos\r\nAna;2')
  })

  it('quotes cells containing separators, quotes or line breaks', () => {
    expect(buildCsv(['a'], [['x;y'], ['diz "oi"'], ['linha\nnova']])).toBe('a\r\n"x;y"\r\n"diz ""oi"""\r\n"linha\nnova"')
  })

  it.each(['=1+1', '+5511', '-2', '@SUM(A1)'])('neutralizes spreadsheet formulas (%s)', (value) => {
    expect(buildCsv(['a'], [[value]])).toBe(`a\r\n'${value}`)
  })

  it('does not alter negative numbers passed as numbers', () => {
    expect(buildCsv(['n'], [[-2]])).toBe('n\r\n-2')
  })
})

describe('slugify', () => {
  it('creates safe file names', () => {
    expect(slugify('Festival São João 2026!')).toBe('festival-sao-joao-2026')
  })
})
