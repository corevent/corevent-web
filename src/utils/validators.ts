// Mirrors the backend rules so the user gets feedback before a request that
// would fail (notably /auth/register, which consumes the e-mail code first).

export const onlyDigits = (value: string): string => value.replace(/\D/g, '')

/** Same algorithm as api/src/common/utils/cpf-cnpj.util.ts */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  const digit = (length: number): number => {
    let sum = 0
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value)
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false

  const digit = (length: number): number => {
    let weight = length - 7
    let sum = 0
    for (let i = 0; i < length; i++) {
      sum += Number(cnpj[i]) * weight
      weight = weight - 1 < 2 ? 9 : weight - 1
    }
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }
  return digit(12) === Number(cnpj[12]) && digit(13) === Number(cnpj[13])
}

export const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

/** Brazilian mobile number with DDD (same rule used for PIX "phone" keys). */
export function isValidCellphone(value: string): boolean {
  const digits = onlyDigits(value)
  const local = digits.length === 13 && digits.startsWith('55') ? digits.slice(2) : digits
  return local.length === 11 && !local.startsWith('0') && local[2] === '9'
}

/** Landline (10 digits) or mobile (11 digits) with DDD, as accepted by IsPhoneNumber('BR'). */
export function isValidPhone(value: string): boolean {
  const digits = onlyDigits(value)
  if (digits.length === 11) return isValidCellphone(digits)
  return digits.length === 10 && !digits.startsWith('0') && /[2-5]/.test(digits[2])
}

export const isValidPixRandomKey = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim())

export type PasswordRule = 'length' | 'upper' | 'lower' | 'number' | 'symbol'

export const PASSWORD_RULES: { rule: PasswordRule; label: string; test: (value: string) => boolean }[] = [
  { rule: 'length', label: '8 caracteres ou mais', test: (v) => v.length >= 8 },
  { rule: 'upper', label: 'Uma letra maiúscula', test: (v) => /[A-Z]/.test(v) },
  { rule: 'lower', label: 'Uma letra minúscula', test: (v) => /[a-z]/.test(v) },
  { rule: 'number', label: 'Um número', test: (v) => /[0-9]/.test(v) },
  // The API only accepts these symbols.
  { rule: 'symbol', label: 'Um símbolo (!@#$%^&*)', test: (v) => /[!@#$%^&*]/.test(v) },
]

export const isStrongPassword = (value: string): boolean => PASSWORD_RULES.every(({ test }) => test(value))

/** Builds a YYYY-MM-DD string from day/month/year inputs, or null if the date does not exist. */
export function toIsoDate(day: string, month: string, year: string): string | null {
  const d = Number(day)
  const m = Number(month)
  const y = Number(year)
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y) || year.length !== 4) return null
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export function ageFromIsoDate(isoDate: string, now = new Date()): number {
  const [year, month, day] = isoDate.split('-').map(Number)
  let age = now.getFullYear() - year
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) age--
  return age
}
