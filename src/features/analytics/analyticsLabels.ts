import type { EventCategory } from '../../api/types'
import { CATEGORY_LABELS } from '../../utils/categories'

export const categoryLabel = (category: string): string => CATEGORY_LABELS[category as EventCategory] ?? category

export const ORDER_STATUS_LABELS: Record<string, string> = {
  paid: 'Pagos',
  pending: 'Pendentes',
  cancelled: 'Cancelados',
  failed: 'Com falha',
  pending_refund: 'Reembolso pendente',
}

/** Platform tables shown as totals (in this order); the pipeline may report others, which are skipped. */
export const TABLE_COUNT_LABELS: [key: string, label: string][] = [
  ['users', 'Usuários'],
  ['events', 'Eventos'],
  ['orders', 'Pedidos'],
  ['tickets', 'Ingressos'],
  ['favorites', 'Favoritos'],
  ['event_ratings', 'Avaliações'],
]

export const FEATURE_LABELS: Record<string, string> = {
  age: 'Idade',
  account_age_days: 'Tempo de conta (dias)',
  n_orders: 'Pedidos pagos',
  total_spent: 'Total gasto',
  avg_ticket: 'Valor médio por pedido',
  n_favorites: 'Eventos favoritados',
  n_tickets: 'Ingressos',
  checkin_rate: 'Taxa de check-in',
  has_favorite: 'Tem favoritos',
}

export function featureLabel(feature: string): string {
  if (feature.startsWith('cat_')) return `Interesse em ${categoryLabel(feature.slice(4))}`
  return FEATURE_LABELS[feature] ?? feature
}

/** Categorical slots for clusters, in fixed order (validated: CVD-safe on white for every pair of the first three). */
export const SERIES_COLORS = ['#ff5528', '#257de0', '#00b894', '#f2a600', '#ee7fac', '#008a17', '#6a4ce2', '#ec4647']

export const seriesColor = (index: number): string => SERIES_COLORS[index % SERIES_COLORS.length]

export const clusterName = (clusterId: number): string => `Perfil ${String.fromCharCode(65 + (clusterId % 26))}`

const percentFormatter = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })
const decimalFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const oneDecimalFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export const formatPercent = (value: number | null | undefined): string =>
  value == null || !Number.isFinite(value) ? '—' : percentFormatter.format(value)

export const formatDecimal = (value: number | null | undefined): string =>
  value == null || !Number.isFinite(value) ? '—' : decimalFormatter.format(value)

export const formatOneDecimal = (value: number | null | undefined): string =>
  value == null || !Number.isFinite(value) ? '—' : oneDecimalFormatter.format(value)
