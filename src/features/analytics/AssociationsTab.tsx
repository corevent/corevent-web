import { useState } from 'react'
import { ArrowRight, ChevronDown, Layers, Network } from 'lucide-react'
import type { AprioriAnalysis, AprioriRule } from '../../api/analytics'
import { Alert } from '../../components/ui/Alert'
import { formatInteger } from '../../utils/format'
import { categoryLabel, formatDecimal, formatPercent } from './analyticsLabels'
import { BarList, Card, Empty, Meter, StatTile } from './charts'

type RuleSort = 'lift' | 'confidence' | 'support'

const SORT_LABELS: Record<RuleSort, string> = {
  lift: 'Mais fortes (lift)',
  confidence: 'Mais confiáveis',
  support: 'Mais comuns',
}

const INITIAL_RULES = 8

const joinCategories = (categories: string[]) => categories.map(categoryLabel).join(' + ')

export function AssociationsTab({ data }: { data: AprioriAnalysis }) {
  const [sort, setSort] = useState<RuleSort>('lift')
  const [showAll, setShowAll] = useState(false)
  const rules = [...(data.rules ?? [])].sort((a, b) => b[sort] - a[sort])
  const visibleRules = showAll ? rules : rules.slice(0, INITIAL_RULES)
  const combos = (data.frequentItemsets ?? [])
    .filter((itemset) => itemset.items.length > 1)
    .sort((a, b) => b.support - a.support)
    .slice(0, 10)
  const meta = data.meta

  return (
    <div className="space-y-6">
      <Alert tone="info">
        Para cada usuário, reunimos as categorias dos eventos que ele comprou ou favoritou. O algoritmo <strong>Apriori</strong>{' '}
        procura categorias que costumam aparecer juntas, útil para escolher o tema de um evento ou divulgá-lo para o público
        certo.
      </Alert>

      {meta && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Usuários analisados" value={formatInteger(meta.nTransactions)} />
          <StatTile label="Combinações frequentes" value={formatInteger(meta.nItemsets)} />
          <StatTile label="Regras encontradas" value={formatInteger(meta.nRules)} />
          <StatTile
            label="Critérios mínimos"
            value={<span className="text-base sm:text-lg">{formatPercent(meta.minSupport)} · {formatPercent(meta.minConfidence)}</span>}
            hint="Suporte · confiança"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <Card
          className="lg:col-span-2"
          title="Regras de associação"
          icon={<Network className="w-4 h-4 text-brand" />}
          description="“Quem se interessa por A também se interessa por B.” Confiança é a chance de B dado A; lift indica quantas vezes isso é mais provável que o acaso."
          action={
            rules.length > 1 && (
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as RuleSort)}
                aria-label="Ordenar regras"
                className="shrink-0 px-2 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {(Object.keys(SORT_LABELS) as RuleSort[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
            )
          }
        >
          {rules.length === 0 ? (
            <p className="text-xs text-zinc-500">
              Nenhuma regra atingiu os critérios mínimos. Com mais compras e favoritos na plataforma, novas associações devem
              aparecer.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-zinc-100">
                {visibleRules.map((rule, index) => (
                  <RuleRow key={`${rule.antecedents.join('|')}>${rule.consequents.join('|')}-${index}`} rule={rule} />
                ))}
              </ul>
              {rules.length > INITIAL_RULES && (
                <button
                  onClick={() => setShowAll((value) => !value)}
                  aria-expanded={showAll}
                  className="flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                  {showAll ? 'Mostrar menos' : `Ver todas as ${rules.length} regras`}
                </button>
              )}
            </>
          )}
        </Card>

        <Card
          title="Combinações mais frequentes"
          icon={<Layers className="w-4 h-4 text-brand" />}
          description="Porcentagem dos usuários que se interessam por todas as categorias do grupo."
        >
          {combos.length === 0 ? (
            <Empty />
          ) : (
            <BarList
              items={combos.map((itemset) => ({
                key: itemset.items.join('|'),
                label: joinCategories(itemset.items),
                value: itemset.support,
                display: formatPercent(itemset.support),
                detail: meta ? `${formatInteger(Math.round(itemset.support * meta.nTransactions))} usuários` : undefined,
              }))}
            />
          )}
        </Card>
      </div>
    </div>
  )
}

function RuleRow({ rule }: { rule: AprioriRule }) {
  return (
    <li className="py-3 first:pt-0 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {rule.antecedents.map((category) => (
          <span key={category} className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-semibold">
            {categoryLabel(category)}
          </span>
        ))}
        <ArrowRight className="w-3.5 h-3.5 text-zinc-400" aria-label="leva a" />
        {rule.consequents.map((category) => (
          <span key={category} className="px-2 py-0.5 rounded-md bg-brand-tint text-brand font-semibold">
            {categoryLabel(category)}
          </span>
        ))}
      </div>
      <p className="text-xs text-zinc-600">
        <strong className="text-zinc-950">{formatPercent(rule.confidence)}</strong> de quem se interessa por{' '}
        {joinCategories(rule.antecedents)} também se interessa por {joinCategories(rule.consequents)}.
      </p>
      <div className="grid grid-cols-3 gap-3 text-[11px]">
        <div className="space-y-1">
          <div className="flex justify-between text-zinc-500">
            <span>Confiança</span>
            <span className="font-bold text-zinc-800 tabular-nums">{formatPercent(rule.confidence)}</span>
          </div>
          <Meter value={rule.confidence} label="Confiança" />
        </div>
        <div className="text-zinc-500">
          Lift <span className="block font-bold text-zinc-800 tabular-nums">{formatDecimal(rule.lift)}×</span>
        </div>
        <div className="text-zinc-500">
          Suporte <span className="block font-bold text-zinc-800 tabular-nums">{formatPercent(rule.support)}</span>
        </div>
      </div>
    </li>
  )
}
