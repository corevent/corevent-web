import { BrainCircuit, Grid2x2, Scale } from 'lucide-react'
import type { ClassificationAnalysis, ClassificationModel } from '../../api/analytics'
import { Alert } from '../../components/ui/Alert'
import { formatInteger } from '../../utils/format'
import { featureLabel, formatPercent } from './analyticsLabels'
import { BarList, Card, ConfusionMatrix, Empty, Meter, StatTile } from './charts'

const MODELS: { key: keyof ClassificationAnalysis['models']; label: string; short: string }[] = [
  { key: 'randomForest', label: 'Random Forest', short: 'Random Forest' },
  { key: 'mlp', label: 'Rede neural (MLP)', short: 'Rede neural' },
]

const METRICS: { key: 'accuracy' | 'precision' | 'recall' | 'f1'; label: string; help: string }[] = [
  { key: 'accuracy', label: 'Acurácia', help: 'Acertos sobre todos os usuários de teste.' },
  { key: 'precision', label: 'Precisão', help: 'Dos que o modelo disse que comprariam, quantos compraram.' },
  { key: 'recall', label: 'Recall', help: 'Dos que compraram, quantos o modelo identificou.' },
  { key: 'f1', label: 'F1', help: 'Equilíbrio entre precisão e recall.' },
]

const MATRIX_LABELS: [string, string] = ['Não comprou', 'Comprou']

const metric = (model: ClassificationModel | undefined, key: (typeof METRICS)[number]['key']) => model?.[key] ?? null

export function ConversionTab({ data }: { data: ClassificationAnalysis }) {
  const models = MODELS.filter(({ key }) => data.models?.[key])
  const conversion = data.classBalance?.['1']
  const baseline = Math.max(...Object.values(data.classBalance ?? {}), 0)
  const best = models.reduce<(typeof MODELS)[number] | null>(
    (winner, model) => ((metric(data.models[model.key], 'f1') ?? -1) > (winner ? (metric(data.models[winner.key], 'f1') ?? -1) : -1) ? model : winner),
    null,
  )
  const bestAccuracy = best ? metric(data.models[best.key], 'accuracy') : null
  const weakModels = bestAccuracy != null && baseline > 0 && bestAccuracy - baseline < 0.05
  const importances = [...(data.models?.randomForest?.featureImportances ?? [])]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10)

  if (models.length === 0 || data.nSamples === 0) {
    return (
      <Card title="Conversão de favoritos em compra" icon={<BrainCircuit className="w-4 h-4 text-brand" />}>
        <Empty />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Alert tone="info">
        Entre os usuários que favoritaram pelo menos um evento, dois modelos de classificação tentam prever quem chega a{' '}
        <strong>comprar ingresso</strong>, usando só idade, tempo de conta, favoritos e categorias de interesse. Uma parte dos
        usuários treina os modelos e a outra serve de teste.
      </Alert>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Usuários analisados" value={formatInteger(data.nSamples)} />
        <StatTile label="Taxa de conversão" value={formatPercent(conversion)} hint="Favoritaram e compraram" />
        <StatTile label="Treino · teste" value={`${formatInteger(data.nTrain)} · ${formatInteger(data.nTest)}`} />
        <StatTile label="Melhor modelo (F1)" value={<span className="text-base sm:text-lg">{best?.short ?? '—'}</span>} />
      </div>

      {weakModels && (
        <Alert tone="warning">
          A acurácia dos modelos ({formatPercent(bestAccuracy)}) está próxima de simplesmente chutar a resposta mais comum (
          {formatPercent(baseline)}). Com os dados atuais, essas características ainda não explicam bem quem compra.
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card title="Comparação dos modelos" icon={<Scale className="w-4 h-4 text-brand" />} description="Desempenho nos usuários de teste.">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[22rem]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="font-semibold px-1 pb-2">Métrica</th>
                  {models.map((model) => (
                    <th key={model.key} className="font-semibold px-1 pb-2">
                      {model.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {METRICS.map(({ key, label, help }) => {
                  const values = models.map((model) => metric(data.models[model.key], key))
                  const top = Math.max(...values.map((value) => value ?? -1))
                  return (
                    <tr key={key}>
                      <th scope="row" className="text-left px-1 py-2.5 align-top">
                        <span className="block font-semibold text-zinc-700">{label}</span>
                        <span className="block text-[10px] font-normal text-zinc-400 max-w-40">{help}</span>
                      </th>
                      {values.map((value, index) => (
                        <td key={models[index].key} className="px-1 py-2.5 align-top w-1/3">
                          <span className={`block tabular-nums mb-1 ${value === top && models.length > 1 ? 'font-bold text-zinc-950' : 'text-zinc-700'}`}>
                            {formatPercent(value)}
                          </span>
                          <Meter value={value ?? 0} label={`${label} — ${models[index].label}`} />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="O que mais pesa na previsão"
          icon={<BrainCircuit className="w-4 h-4 text-brand" />}
          description="Importância de cada característica para o Random Forest."
        >
          {importances.length === 0 ? (
            <Empty />
          ) : (
            <BarList
              items={importances.map((item) => ({
                key: item.feature,
                label: featureLabel(item.feature),
                value: item.importance,
                display: formatPercent(item.importance),
              }))}
            />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {models.map((model) => (
          <Card
            key={model.key}
            title={`Matriz de confusão — ${model.label}`}
            icon={<Grid2x2 className="w-4 h-4 text-brand" />}
            description="Quantos usuários de teste o modelo acertou e errou em cada situação."
          >
            <ConfusionMatrix matrix={data.models[model.key].confusionMatrix ?? []} labels={MATRIX_LABELS} />
          </Card>
        ))}
      </div>
    </div>
  )
}
