import { ChartColumn, Heart, ReceiptText, UserRound } from 'lucide-react'
import type { EdaAnalysis, FeatureStats } from '../../api/analytics'
import { formatCurrency, formatInteger } from '../../utils/format'
import { categoryLabel, formatOneDecimal, formatPercent, ORDER_STATUS_LABELS, TABLE_COUNT_LABELS } from './analyticsLabels'
import { BarList, Card, Empty, StatTile } from './charts'

const USER_FEATURES: { key: string; label: string; format: (value: number) => string }[] = [
  { key: 'age', label: 'Idade', format: (value) => `${Math.round(value)} anos` },
  { key: 'n_orders', label: 'Pedidos pagos', format: formatOneDecimal },
  { key: 'n_favorites', label: 'Eventos favoritados', format: formatOneDecimal },
  { key: 'avg_ticket', label: 'Valor médio por pedido', format: formatCurrency },
  { key: 'checkin_rate', label: 'Taxa de check-in', format: formatPercent },
]

export function OverviewTab({ data }: { data: EdaAnalysis }) {
  const counts = TABLE_COUNT_LABELS.filter(([key]) => data.tableCounts?.[key] !== undefined)
  const eventsByCategory = data.eventsByCategory ?? []
  const categoryUsers = data.transactionsSummary?.categoryUserCounts ?? []
  const ordersByStatus = data.ordersByStatus ?? []
  const totalOrders = ordersByStatus.reduce((sum, item) => sum + item.count, 0)
  const totalEvents = eventsByCategory.reduce((sum, item) => sum + item.count, 0)
  const stats = USER_FEATURES.filter(({ key }) => data.userFeatureStats?.[key])

  return (
    <div className="space-y-6">
      {counts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {counts.map(([key, label]) => (
            <StatTile key={key} label={label} value={formatInteger(data.tableCounts[key])} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card
          title="Eventos por categoria"
          icon={<ChartColumn className="w-4 h-4 text-brand" />}
          description="Quantidade de eventos cadastrados em cada categoria."
        >
          {eventsByCategory.length === 0 ? (
            <Empty />
          ) : (
            <BarList
              items={eventsByCategory.map((item) => ({
                key: item.category,
                label: categoryLabel(item.category),
                value: item.count,
                display: formatInteger(item.count),
                detail: totalEvents > 0 ? `${formatPercent(item.count / totalEvents)} dos eventos` : undefined,
              }))}
            />
          )}
        </Card>

        <Card
          title="Público interessado por categoria"
          icon={<Heart className="w-4 h-4 text-brand" />}
          description={
            <>
              Usuários que compraram ou favoritaram eventos de cada categoria. Em média, cada usuário se interessa por{' '}
              <strong className="text-zinc-700">{formatOneDecimal(data.transactionsSummary?.avgCategoriesPerUser)}</strong> categorias.
            </>
          }
        >
          {categoryUsers.length === 0 ? (
            <Empty />
          ) : (
            <BarList
              items={categoryUsers.map((item) => ({
                key: item.category,
                label: categoryLabel(item.category),
                value: item.users,
                display: formatInteger(item.users),
                detail: data.transactionsSummary.nTransactions
                  ? `${formatPercent(item.users / data.transactionsSummary.nTransactions)} dos usuários ativos`
                  : undefined,
              }))}
            />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        <Card
          className="lg:col-span-2"
          title="Pedidos por situação"
          icon={<ReceiptText className="w-4 h-4 text-brand" />}
          description={`${formatInteger(totalOrders)} pedidos no total.`}
        >
          {ordersByStatus.length === 0 ? (
            <Empty />
          ) : (
            <BarList
              items={ordersByStatus.map((item) => ({
                key: item.status,
                label: ORDER_STATUS_LABELS[item.status] ?? item.status,
                value: item.count,
                display: (
                  <>
                    {formatInteger(item.count)}
                    <span className="ml-1.5 font-medium text-zinc-400">{formatPercent(totalOrders ? item.count / totalOrders : 0)}</span>
                  </>
                ),
              }))}
            />
          )}
        </Card>

        <Card
          className="lg:col-span-3"
          title="Comportamento dos usuários"
          icon={<UserRound className="w-4 h-4 text-brand" />}
          description="Distribuição dos principais indicadores por usuário. A faixa central reúne metade dos usuários."
        >
          {stats.length === 0 ? <Empty /> : <FeatureStatsTable stats={data.userFeatureStats} />}
        </Card>
      </div>
    </div>
  )
}

function FeatureStatsTable({ stats }: { stats: Record<string, FeatureStats> }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs min-w-[30rem]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-400">
            <th className="font-semibold px-1 pb-2">Indicador</th>
            <th className="font-semibold px-1 pb-2 text-right">Média</th>
            <th className="font-semibold px-1 pb-2 text-right">Mediana</th>
            <th className="font-semibold px-1 pb-2 text-right">Faixa central</th>
            <th className="font-semibold px-1 pb-2 text-right">Mín. – máx.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {USER_FEATURES.filter(({ key }) => stats[key]).map(({ key, label, format }) => {
            const stat = stats[key]
            return (
              <tr key={key} className="tabular-nums">
                <th scope="row" className="text-left font-semibold text-zinc-700 px-1 py-2">
                  {label}
                </th>
                <td className="text-right font-bold text-zinc-950 px-1 py-2">{format(stat.mean)}</td>
                <td className="text-right text-zinc-700 px-1 py-2">{format(stat.p50)}</td>
                <td className="text-right text-zinc-700 px-1 py-2 whitespace-nowrap">
                  {format(stat.p25)} – {format(stat.p75)}
                </td>
                <td className="text-right text-zinc-500 px-1 py-2 whitespace-nowrap">
                  {format(stat.min)} – {format(stat.max)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
