import { ChartScatter, ChartSpline, UsersRound } from 'lucide-react'
import type { KmeansAnalysis, KmeansCluster } from '../../api/analytics'
import { Alert } from '../../components/ui/Alert'
import { formatCurrency, formatInteger } from '../../utils/format'
import { categoryLabel, clusterName, formatDecimal, formatOneDecimal, formatPercent, seriesColor } from './analyticsLabels'
import { Card, Empty, Meter, MiniLineChart, ScatterPlot, SegmentedBar, StatTile } from './charts'

const CENTROID_METRICS: { key: keyof Omit<KmeansCluster['centroid'], 'categories'>; label: string; format: (value: number) => string }[] = [
  { key: 'age', label: 'Idade média', format: (value) => `${Math.round(value)} anos` },
  { key: 'n_orders', label: 'Pedidos pagos', format: formatOneDecimal },
  { key: 'total_spent', label: 'Total gasto', format: formatCurrency },
  { key: 'avg_ticket', label: 'Valor médio por pedido', format: formatCurrency },
  { key: 'n_favorites', label: 'Eventos favoritados', format: formatOneDecimal },
  { key: 'n_tickets', label: 'Ingressos', format: formatOneDecimal },
  { key: 'checkin_rate', label: 'Taxa de check-in', format: formatPercent },
  { key: 'account_age_days', label: 'Tempo de conta', format: (value) => `${formatInteger(Math.round(value))} dias` },
]

export function SegmentsTab({ data }: { data: KmeansAnalysis }) {
  const clusters = [...(data.clusters ?? [])].sort((a, b) => a.clusterId - b.clusterId)
  const totalUsers = clusters.reduce((sum, cluster) => sum + cluster.size, 0)
  const topSpender = clusters.reduce<KmeansCluster | null>(
    (best, cluster) => ((cluster.centroid.total_spent ?? 0) > (best?.centroid.total_spent ?? -1) ? cluster : best),
    null,
  )
  const variance = data.pcaSample?.explainedVarianceRatio ?? []
  const candidates = data.kSelection?.candidates ?? []
  const bestK = data.kSelection?.bestK ?? data.metrics?.nClusters

  if (clusters.length === 0) {
    return (
      <Card title="Perfis de público" icon={<UsersRound className="w-4 h-4 text-brand" />}>
        <Empty />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Alert tone="info">
        O algoritmo <strong>K-Means</strong> agrupa os usuários pelo comportamento (compras, gastos, favoritos, check-ins e
        categorias de interesse). Cada grupo é um perfil de público com características parecidas.
      </Alert>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Perfis encontrados" value={formatInteger(data.metrics?.nClusters ?? clusters.length)} />
        <StatTile label="Usuários agrupados" value={formatInteger(totalUsers)} />
        <StatTile
          label="Silhueta"
          value={formatDecimal(data.metrics?.silhouette)}
          hint="De −1 a 1: quanto maior, mais separados os perfis"
        />
        <StatTile
          label="Variância no mapa"
          value={formatPercent(variance.slice(0, 2).reduce((sum, value) => sum + value, 0))}
          hint="Quanto do comportamento o mapa 2D representa"
        />
      </div>

      <Card title="Tamanho de cada perfil" icon={<UsersRound className="w-4 h-4 text-brand" />}>
        <SegmentedBar
          segments={clusters.map((cluster) => ({
            key: String(cluster.clusterId),
            label: clusterName(cluster.clusterId),
            value: cluster.size,
            color: seriesColor(cluster.clusterId),
            display: `${formatInteger(cluster.size)} · ${formatPercent(cluster.share)}`,
          }))}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        {clusters.map((cluster) => (
          <ClusterCard key={cluster.clusterId} cluster={cluster} highlight={clusters.length > 1 && cluster === topSpender} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        <Card
          className="lg:col-span-3"
          title="Mapa dos perfis"
          icon={<ChartScatter className="w-4 h-4 text-brand" />}
          description="Cada ponto é um usuário (amostra), projetado em duas dimensões por PCA. Pontos próximos têm comportamento parecido."
        >
          <ScatterPlot
            ariaLabel="Dispersão dos usuários por perfil"
            xTitle={`Componente 1${variance[0] !== undefined ? ` (${formatPercent(variance[0])})` : ''}`}
            yTitle={`Componente 2${variance[1] !== undefined ? ` (${formatPercent(variance[1])})` : ''}`}
            series={clusters.map((cluster) => ({
              key: String(cluster.clusterId),
              label: clusterName(cluster.clusterId),
              color: seriesColor(cluster.clusterId),
              points: (data.pcaSample?.points ?? []).filter((point) => point.clusterId === cluster.clusterId),
            }))}
          />
        </Card>

        <Card
          className="lg:col-span-2"
          title="Escolha do número de perfis"
          icon={<ChartSpline className="w-4 h-4 text-brand" />}
          description={
            bestK
              ? `Foram testadas de ${candidates[0]?.k ?? '?'} a ${candidates.at(-1)?.k ?? '?'} divisões; ${bestK} teve a melhor silhueta.`
              : 'Divisões testadas pelo algoritmo.'
          }
        >
          {candidates.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1">Silhueta por nº de perfis (maior é melhor)</p>
                <MiniLineChart
                  ariaLabel="Silhueta por número de perfis"
                  points={candidates.filter((item) => item.silhouette != null).map((item) => ({ x: item.k, y: item.silhouette as number }))}
                  highlightX={bestK}
                  formatY={(value) => formatDecimal(value)}
                  xLabel={(x) => `${x} perfis`}
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1">Inércia por nº de perfis (método do cotovelo)</p>
                <MiniLineChart
                  ariaLabel="Inércia por número de perfis"
                  points={candidates.filter((item) => item.inertia != null).map((item) => ({ x: item.k, y: item.inertia as number }))}
                  highlightX={bestK}
                  formatY={(value) => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}
                  xLabel={(x) => `${x} perfis`}
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function ClusterCard({ cluster, highlight }: { cluster: KmeansCluster; highlight: boolean }) {
  const color = seriesColor(cluster.clusterId)
  const topCategories = Object.entries(cluster.centroid.categories ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
  const maxCategory = topCategories[0]?.[1] ?? 0

  return (
    <section className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 space-y-4" aria-label={clusterName(cluster.clusterId)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <h3 className="text-sm font-bold text-zinc-950">{clusterName(cluster.clusterId)}</h3>
          {highlight && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-tint text-brand">Maior gasto</span>
          )}
        </div>
        <span className="text-xs text-zinc-500 tabular-nums text-right">
          <strong className="text-zinc-950">{formatInteger(cluster.size)}</strong> usuários · {formatPercent(cluster.share)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {CENTROID_METRICS.filter(({ key }) => cluster.centroid[key] != null).map(({ key, label, format }) => (
          <div key={key} className="min-w-0">
            <dt className="text-[11px] text-zinc-500 truncate">{label}</dt>
            <dd className="font-bold text-zinc-950 tabular-nums">{format(cluster.centroid[key] as number)}</dd>
          </div>
        ))}
      </dl>

      {topCategories.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-zinc-100">
          <p className="text-[11px] font-semibold text-zinc-500">Categorias de maior interesse</p>
          {topCategories.map(([category, value]) => (
            <div key={category} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-700 font-medium truncate">{categoryLabel(category)}</span>
                <span className="text-zinc-500 tabular-nums shrink-0">{formatDecimal(value)} por usuário</span>
              </div>
              <Meter value={maxCategory > 0 ? value / maxCategory : 0} color={color} label={categoryLabel(category)} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
