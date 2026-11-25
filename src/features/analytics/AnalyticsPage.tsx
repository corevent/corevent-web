import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { BrainCircuit, ChartColumn, Database, FlaskConical, Network, RefreshCw, UsersRound } from 'lucide-react'
import { getAnalysis, type AnalyticsByKind, type AnalyticsKind } from '../../api/analytics'
import { ApiError, getErrorMessage } from '../../api/errors'
import { Alert } from '../../components/ui/Alert'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { formatDateTime } from '../../utils/format'
import { AssociationsTab } from './AssociationsTab'
import { ConversionTab } from './ConversionTab'
import { OverviewTab } from './OverviewTab'
import { SegmentsTab } from './SegmentsTab'

const TABS: { id: string; kind: AnalyticsKind; label: string; icon: typeof ChartColumn }[] = [
  { id: 'visao-geral', kind: 'eda', label: 'Visão geral', icon: ChartColumn },
  { id: 'associacoes', kind: 'apriori', label: 'Categorias associadas', icon: Network },
  { id: 'perfis', kind: 'kmeans', label: 'Perfis de público', icon: UsersRound },
  { id: 'conversao', kind: 'classification', label: 'Conversão', icon: BrainCircuit },
]

type Loadable<T> =
  | { status: 'loading' }
  | { status: 'error'; error: string; notGenerated: boolean }
  | { status: 'ready'; data: T }

type AnalyticsState = { [K in AnalyticsKind]?: Loadable<AnalyticsByKind[K]> }

/** Platform-wide insights produced by the corevent-analytics pipeline (EDA, Apriori, K-Means, classification). */
export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.find((item) => item.id === searchParams.get('aba')) ?? TABS[0]
  const [analyses, setAnalyses] = useState<AnalyticsState>({})

  // A missing entry renders as "loading", so the first load only sets state once the request settles.
  const load = useCallback(async (kind: AnalyticsKind) => {
    try {
      const data = await getAnalysis(kind)
      setAnalyses((current) => ({ ...current, [kind]: { status: 'ready', data } }))
    } catch (err) {
      const status = err instanceof ApiError ? err.status : null
      // 404: the pipeline has not published this file yet. 503: storage unreachable or invalid file.
      const error = status === 503 ? 'As análises estão temporariamente indisponíveis.' : getErrorMessage(err)
      setAnalyses((current) => ({ ...current, [kind]: { status: 'error', error, notGenerated: status === 404 } }))
    }
  }, [])

  const current = analyses[tab.kind] as Loadable<AnalyticsByKind[AnalyticsKind]> | undefined
  useEffect(() => {
    if (!current) void load(tab.kind)
  }, [current, tab.kind, load])

  const selectTab = (id: string) => {
    setSearchParams(id === TABS[0].id ? {} : { aba: id }, { replace: true })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="pb-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Análises</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Indicadores de toda a plataforma Corevent gerados por mineração de dados: interesses do público, perfis de
            usuários e conversão de favoritos em compra.
          </p>
        </div>
        {current?.status === 'ready' && <SourceInfo source={current.data.source} generatedAt={current.data.generatedAt} />}
      </div>

      <div role="tablist" aria-label="Tipo de análise" className="flex flex-wrap gap-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const selected = id === tab.id
          return (
            <button
              key={id}
              role="tab"
              id={`tab-${id}`}
              aria-selected={selected}
              aria-controls={`painel-${id}`}
              onClick={() => selectTab(id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                selected ? 'bg-brand-tint text-brand' : 'text-zinc-600 hover:bg-white hover:text-zinc-950'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id={`painel-${tab.id}`} aria-labelledby={`tab-${tab.id}`}>
        <AnalysisContent
          state={current}
          onRetry={() => {
            setAnalyses((state) => ({ ...state, [tab.kind]: { status: 'loading' } }))
            void load(tab.kind)
          }}
        >
          {(data) => renderTab(tab.kind, data)}
        </AnalysisContent>
      </div>
    </div>
  )
}

function renderTab(kind: AnalyticsKind, data: AnalyticsByKind[AnalyticsKind]): ReactNode {
  switch (kind) {
    case 'eda':
      return <OverviewTab data={data as AnalyticsByKind['eda']} />
    case 'apriori':
      return <AssociationsTab data={data as AnalyticsByKind['apriori']} />
    case 'kmeans':
      return <SegmentsTab data={data as AnalyticsByKind['kmeans']} />
    case 'classification':
      return <ConversionTab data={data as AnalyticsByKind['classification']} />
  }
}

function AnalysisContent<T>({
  state,
  onRetry,
  children,
}: {
  state: Loadable<T> | undefined
  onRetry: () => void
  children: (data: T) => ReactNode
}) {
  if (!state || state.status === 'loading') {
    return (
      <div className="bg-white p-10 rounded-xl border border-zinc-200 flex flex-col items-center gap-3 text-xs text-zinc-500">
        <Spinner />
        Carregando análise…
      </div>
    )
  }
  if (state.status === 'error') {
    if (state.notGenerated) {
      return (
        <EmptyState
          icon={<FlaskConical className="w-5 h-5" />}
          title="Esta análise ainda não foi gerada"
          description="Os resultados aparecem aqui assim que o processamento de analytics da plataforma for executado."
        />
      )
    }
    return (
      <Alert
        action={
          <button onClick={onRetry} className="flex items-center gap-1 font-semibold whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
          </button>
        }
      >
        Não foi possível carregar esta análise. {state.error}
      </Alert>
    )
  }
  return <>{children(state.data)}</>
}

function SourceInfo({ source, generatedAt }: { source: string; generatedAt: string }) {
  const date = new Date(generatedAt)
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] shrink-0">
      {source === 'synthetic' ? (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold"
          title="O processamento não encontrou dados suficientes na plataforma e usou uma base gerada para demonstração."
        >
          <FlaskConical className="w-3 h-3" /> Dados de demonstração
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
          <Database className="w-3 h-3" /> Dados da plataforma
        </span>
      )}
      {!Number.isNaN(date.getTime()) && <span className="text-zinc-500">Atualizado em {formatDateTime(generatedAt)}</span>}
    </div>
  )
}
