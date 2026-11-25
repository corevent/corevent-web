import { apiRequest } from './client'

// Read-only results of the offline data-mining pipeline (corevent-analytics). The API serves the
// JSON files the pipeline publishes, so every analysis covers the whole platform, not one event.

/** "postgres" = real platform data; "synthetic" = generated demo data (database unavailable or empty). */
export type AnalyticsSource = 'postgres' | 'synthetic' | (string & {})

interface AnalyticsBase {
  source: AnalyticsSource
  generatedAt: string
}

export interface FeatureStats {
  count: number
  mean: number
  std: number
  min: number
  p25: number
  p50: number
  p75: number
  max: number
}

export interface EdaAnalysis extends AnalyticsBase {
  tableCounts: Record<string, number>
  eventsByCategory: { category: string; count: number }[]
  ordersByStatus: { status: string; count: number }[]
  transactionsSummary: {
    nTransactions: number
    avgCategoriesPerUser: number
    categoryUserCounts: { category: string; users: number }[]
  }
  userFeatureStats: Record<string, FeatureStats>
}

export interface AprioriRule {
  antecedents: string[]
  consequents: string[]
  antecedentSupport: number
  consequentSupport: number
  support: number
  confidence: number
  lift: number
  leverage?: number | null
  conviction?: number | null
}

export interface AprioriAnalysis extends AnalyticsBase {
  meta: { nTransactions: number; minSupport: number; minConfidence: number; nItemsets: number; nRules: number }
  frequentItemsets: { items: string[]; support: number }[]
  rules: AprioriRule[]
}

export interface KmeansCentroid {
  age?: number
  account_age_days?: number
  n_orders?: number
  total_spent?: number
  avg_ticket?: number
  n_favorites?: number
  n_tickets?: number
  checkin_rate?: number
  categories: Record<string, number>
}

export interface KmeansCluster {
  clusterId: number
  size: number
  share: number
  centroid: KmeansCentroid
}

export interface KmeansAnalysis extends AnalyticsBase {
  metrics: { nClusters: number; inertia?: number | null; silhouette?: number | null }
  kSelection: { bestK?: number | null; candidates: { k: number; inertia?: number | null; silhouette?: number | null }[] }
  clusters: KmeansCluster[]
  pcaSample: { explainedVarianceRatio: number[]; points: { x: number; y: number; clusterId: number }[] }
}

export interface ClassificationModel {
  accuracy?: number | null
  precision?: number | null
  recall?: number | null
  f1?: number | null
  confusionMatrix: number[][]
  featureImportances?: { feature: string; importance: number }[]
}

export interface ClassificationAnalysis extends AnalyticsBase {
  nSamples: number
  nTrain: number
  nTest: number
  classBalance: Record<string, number>
  featureColumns: string[]
  models: { randomForest: ClassificationModel; mlp: ClassificationModel }
}

export interface AnalyticsByKind {
  eda: EdaAnalysis
  apriori: AprioriAnalysis
  kmeans: KmeansAnalysis
  classification: ClassificationAnalysis
}

export type AnalyticsKind = keyof AnalyticsByKind

export async function getAnalysis<K extends AnalyticsKind>(kind: K): Promise<AnalyticsByKind[K]> {
  const { data } = await apiRequest<{ data: AnalyticsByKind[K] }>(`/analytics/${kind}`)
  return data
}
