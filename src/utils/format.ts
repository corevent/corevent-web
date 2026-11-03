import type { DocumentType } from '../api/types'
import { onlyDigits } from './validators'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const integerFormatter = new Intl.NumberFormat('pt-BR')
const timeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** Decimal columns (price, totalAmount) can be serialized as strings by the API. */
export const toNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const formatCurrency = (value: number): string => currencyFormatter.format(value)
export const formatInteger = (value: number): string => integerFormatter.format(value)

/** "14 de Novembro, 2026" — same style as the mockup. */
export function formatLongDate(iso: string): string {
  const date = new Date(iso)
  return `${String(date.getDate()).padStart(2, '0')} de ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`
}

export const formatTime = (iso: string): string => timeFormatter.format(new Date(iso))
export const formatDateTime = (iso: string): string => dateTimeFormatter.format(new Date(iso))

/** "YYYY-MM-DD" → "DD/MM/YYYY" without timezone shifts. */
export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

export function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}

export const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? name

export function maskCpf(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCnpj(value: string): string {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export const maskDocument = (value: string, type: DocumentType): string =>
  type === 'cpf' ? maskCpf(value) : maskCnpj(value)

export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function maskZipCode(value: string): string {
  return onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d{1,3})$/, '$1-$2')
}

/** Value for <input type="datetime-local"> in the browser timezone. */
export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** datetime-local value → ISO with "Z", as required by the API's strict date validator. */
export function dateTimeLocalToIso(value: string): string {
  return new Date(value).toISOString()
}
