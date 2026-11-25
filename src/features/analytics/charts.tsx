import { useState, type ReactNode } from 'react'

// Small, dependency-free chart pieces for the analytics page. Marks follow one spec: thin bars with a
// rounded data end, 1px recessive grid, values in text colors (never the series color), and a hover
// layer on every plotted mark.

export function Card({
  title,
  description,
  icon,
  action,
  children,
  className = '',
}: {
  title: string
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 space-y-4 min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            {icon}
            {title}
          </h3>
          {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Empty() {
  return <p className="text-xs text-zinc-500">Sem dados suficientes para esta visualização.</p>
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-zinc-200 min-w-0">
      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider truncate">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-zinc-950 mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-zinc-400 mt-0.5">{hint}</p>}
    </div>
  )
}

export interface BarItem {
  key: string
  label: ReactNode
  value: number
  /** Text shown at the bar tip (defaults to the raw value). */
  display?: ReactNode
  /** Extra line shown on hover / focus. */
  detail?: ReactNode
}

/** Ranked horizontal bars (one series): label above, bar with its value at the tip. */
export function BarList({ items, color = 'var(--color-brand)', max }: { items: BarItem[]; color?: string; max?: number }) {
  const [active, setActive] = useState<string | null>(null)
  const top = max ?? Math.max(...items.map((item) => item.value), 0)

  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const width = top > 0 ? Math.max((item.value / top) * 100, item.value > 0 ? 1.5 : 0) : 0
        const isActive = active === item.key
        return (
          <li
            key={item.key}
            tabIndex={0}
            onMouseEnter={() => setActive(item.key)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(item.key)}
            onBlur={() => setActive(null)}
            className={`rounded-lg px-2 py-1 -mx-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              isActive ? 'bg-zinc-50' : ''
            }`}
          >
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-zinc-700 font-medium truncate">{item.label}</span>
              <span className="text-zinc-950 font-bold tabular-nums shrink-0">{item.display ?? item.value}</span>
            </div>
            <div className="mt-1 h-2 rounded-r bg-zinc-100 overflow-hidden" aria-hidden="true">
              <div className="h-full rounded-r" style={{ width: `${width}%`, backgroundColor: color, opacity: active && !isActive ? 0.45 : 1 }} />
            </div>
            {isActive && item.detail && <p className="mt-1 text-[11px] text-zinc-500">{item.detail}</p>}
          </li>
        )
      })}
    </ul>
  )
}

/** Thin progress meter for a 0–1 ratio. */
export function Meter({ value, color = 'var(--color-brand)', label }: { value: number; color?: string; label: string }) {
  const width = Math.min(Math.max(value, 0), 1) * 100
  return (
    <div className="h-1.5 rounded-full bg-brand-soft overflow-hidden" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={1} aria-valuenow={value}>
      <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
    </div>
  )
}

export interface Segment {
  key: string
  label: string
  value: number
  color: string
  display: ReactNode
}

/** One whole split into parts (2px gaps between segments) with a legend underneath. */
export function SegmentedBar({ segments }: { segments: Segment[] }) {
  const [active, setActive] = useState<string | null>(null)
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  if (total <= 0) return null

  return (
    <div className="space-y-3">
      <div className="flex h-4 gap-0.5" aria-hidden="true">
        {segments.map((segment) => (
          <div
            key={segment.key}
            onMouseEnter={() => setActive(segment.key)}
            onMouseLeave={() => setActive(null)}
            title={`${segment.label}: ${typeof segment.display === 'string' ? segment.display : ''}`}
            className="h-full first:rounded-l last:rounded-r transition-opacity"
            style={{
              width: `${(segment.value / total) * 100}%`,
              backgroundColor: segment.color,
              opacity: active && active !== segment.key ? 0.35 : 1,
            }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((segment) => (
          <li
            key={segment.key}
            onMouseEnter={() => setActive(segment.key)}
            onMouseLeave={() => setActive(null)}
            className="flex items-center gap-1.5 text-xs"
          >
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: segment.color }} />
            <span className="text-zinc-700 font-medium">{segment.label}</span>
            <span className="text-zinc-950 font-bold tabular-nums">{segment.display}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const niceTicks = (min: number, max: number, count = 4): number[] => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min]
  const step = (max - min) / count
  return Array.from({ length: count + 1 }, (_, index) => min + step * index)
}

/** Single-series line over a small integer x axis (e.g. k = 2…8), with an optional highlighted x. */
export function MiniLineChart({
  points,
  highlightX,
  formatY,
  xLabel,
  ariaLabel,
}: {
  points: { x: number; y: number }[]
  highlightX?: number | null
  formatY: (value: number) => string
  /** Long label used in the tooltip; the axis shows the bare x. */
  xLabel: (x: number) => string
  ariaLabel: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  if (points.length === 0) return <p className="text-xs text-zinc-500">Sem dados para exibir.</p>

  const width = 320
  const height = 150
  const pad = { top: 12, right: 12, bottom: 24, left: 52 }
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const ySpread = Math.max(...ys) - Math.min(...ys) || Math.abs(ys[0]) || 1
  const yMin = Math.min(...ys) - ySpread * 0.1
  const yMax = Math.max(...ys) + ySpread * 0.1
  const sx = (x: number) => pad.left + (xMax === xMin ? 0.5 : (x - xMin) / (xMax - xMin)) * (width - pad.left - pad.right)
  const sy = (y: number) => pad.top + (1 - (y - yMin) / (yMax - yMin)) * (height - pad.top - pad.bottom)
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${sx(point.x)},${sy(point.y)}`).join(' ')
  const active = hovered === null ? null : points[hovered]

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
        {niceTicks(yMin, yMax, 3).map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={sy(tick)} y2={sy(tick)} stroke="#f4f4f5" strokeWidth={1} />
            <text x={pad.left - 6} y={sy(tick)} textAnchor="end" dominantBaseline="middle" className="fill-zinc-400 text-[9px]">
              {formatY(tick)}
            </text>
          </g>
        ))}
        {points.map((point) => (
          <text key={point.x} x={sx(point.x)} y={height - 6} textAnchor="middle" className="fill-zinc-400 text-[9px]">
            {point.x}
          </text>
        ))}
        {active && <line x1={sx(active.x)} x2={sx(active.x)} y1={pad.top} y2={height - pad.bottom} stroke="#e4e4e7" strokeWidth={1} />}
        <path d={path} fill="none" stroke="var(--color-brand)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => {
          const highlighted = point.x === highlightX
          return (
            <g key={point.x}>
              <circle
                cx={sx(point.x)}
                cy={sy(point.y)}
                r={highlighted || hovered === index ? 5 : 4}
                fill={highlighted ? 'var(--color-brand)' : '#ffffff'}
                stroke={highlighted ? '#ffffff' : 'var(--color-brand)'}
                strokeWidth={2}
              />
              <rect
                x={sx(point.x) - 14}
                y={pad.top}
                width={28}
                height={height - pad.top - pad.bottom}
                fill="transparent"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          )
        })}
      </svg>
      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full px-2 py-1 rounded-md bg-zinc-900 text-white text-[11px] font-semibold whitespace-nowrap shadow"
          style={{ left: `${(sx(active.x) / width) * 100}%`, top: `${(sy(active.y) / height) * 100}%`, marginTop: -8 }}
        >
          {xLabel(active.x)}: {formatY(active.y)}
          {active.x === highlightX && ' · escolhido'}
        </div>
      )}
    </div>
  )
}

export interface ScatterSeries {
  key: string
  label: string
  color: string
  points: { x: number; y: number }[]
}

/** 2D projection scatter; hovering a legend entry (or a point) brings that group forward. */
export function ScatterPlot({ series, ariaLabel, xTitle, yTitle }: { series: ScatterSeries[]; ariaLabel: string; xTitle: string; yTitle: string }) {
  const [active, setActive] = useState<string | null>(null)
  const all = series.flatMap((group) => group.points)
  if (all.length === 0) return <p className="text-xs text-zinc-500">Sem pontos para exibir.</p>

  const width = 480
  const height = 300
  const pad = 16
  const xs = all.map((point) => point.x)
  const ys = all.map((point) => point.y)
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)
  const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin || 1)) * (width - pad * 2)
  const sy = (y: number) => pad + (1 - (y - yMin) / (yMax - yMin || 1)) * (height - pad * 2)
  const ordered = active ? [...series.filter((group) => group.key !== active), ...series.filter((group) => group.key === active)] : series

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto rounded-lg bg-zinc-50/60" role="img" aria-label={ariaLabel}>
          {xMin < 0 && xMax > 0 && <line x1={sx(0)} x2={sx(0)} y1={pad} y2={height - pad} stroke="#e4e4e7" strokeWidth={1} />}
          {yMin < 0 && yMax > 0 && <line x1={pad} x2={width - pad} y1={sy(0)} y2={sy(0)} stroke="#e4e4e7" strokeWidth={1} />}
          {ordered.map((group) => (
            <g
              key={group.key}
              opacity={active && active !== group.key ? 0.12 : 0.85}
              onMouseEnter={() => setActive(group.key)}
              onMouseLeave={() => setActive(null)}
            >
              {group.points.map((point, index) => (
                <circle key={index} cx={sx(point.x)} cy={sy(point.y)} r={4} fill={group.color} stroke="#ffffff" strokeWidth={1}>
                  <title>{group.label}</title>
                </circle>
              ))}
            </g>
          ))}
        </svg>
        <span className="absolute bottom-1 right-2 text-[10px] text-zinc-400">{xTitle} →</span>
        <span className="absolute top-1 left-2 text-[10px] text-zinc-400">↑ {yTitle}</span>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {series.map((group) => (
          <li key={group.key}>
            <button
              type="button"
              onMouseEnter={() => setActive(group.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(group.key)}
              onBlur={() => setActive(null)}
              className="flex items-center gap-1.5 text-xs text-zinc-700 font-medium rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
              {group.label}
              <span className="text-zinc-400 tabular-nums">({group.points.length})</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 2×2 confusion matrix; cell shade = share of the row (sequential brand ramp). */
export function ConfusionMatrix({ matrix, labels }: { matrix: number[][]; labels: [negative: string, positive: string] }) {
  if (matrix.length !== 2 || matrix.some((row) => row.length !== 2)) {
    return <p className="text-xs text-zinc-500">Matriz indisponível.</p>
  }
  return (
    <table className="w-full text-xs border-separate border-spacing-0.5">
      <thead>
        <tr>
          <th className="text-left font-medium text-zinc-400 p-1">Real ↓ / Previsto →</th>
          {labels.map((label) => (
            <th key={label} className="font-semibold text-zinc-600 p-1">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {matrix.map((row, rowIndex) => {
          const rowTotal = row.reduce((sum, value) => sum + value, 0)
          return (
            <tr key={rowIndex}>
              <th scope="row" className="text-left font-semibold text-zinc-600 p-1">
                {labels[rowIndex]}
              </th>
              {row.map((value, colIndex) => {
                const share = rowTotal > 0 ? value / rowTotal : 0
                const correct = rowIndex === colIndex
                return (
                  <td
                    key={colIndex}
                    className="rounded-md text-center p-2 tabular-nums"
                    style={{ backgroundColor: `rgb(255 85 40 / ${0.06 + share * 0.5})` }}
                    title={`${correct ? 'Acertos' : 'Erros'}: ${value} (${Math.round(share * 100)}% da linha)`}
                  >
                    <span className="block text-sm font-bold text-zinc-950">{value}</span>
                    <span className="block text-[10px] text-zinc-600">{correct ? 'acertos' : 'erros'}</span>
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
