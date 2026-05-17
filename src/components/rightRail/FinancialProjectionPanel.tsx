import { InstitutionState, SeasonState } from '../../types/core'

interface FinancialProjectionPanelProps {
  institution: InstitutionState
  season: SeasonState
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function Sparkline({ values }: { values: number[] }) {
  const w = 280
  const h = 60
  const pad = 4
  if (values.length === 0) {
    return (
      <svg className="spark-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--bg-panel-edge)" strokeWidth="1" />
      </svg>
    )
  }
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  const range = Math.max(1, max - min)
  const xStep = (w - pad * 2) / Math.max(1, values.length - 1)
  const points = values.map((v, i) => ({
    x: pad + i * xStep,
    y: h - pad - ((v - min) / range) * (h - pad * 2),
  }))
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
  // Zero baseline
  const zeroY = h - pad - ((0 - min) / range) * (h - pad * 2)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <line x1={pad} y1={zeroY} x2={w - pad} y2={zeroY} stroke="var(--bg-panel-edge)" strokeWidth="1" strokeDasharray="2 3" />
      <path d={path} fill="none" stroke="var(--gold-deep)" strokeWidth="1.5" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth="0.75" />
      ))}
    </svg>
  )
}

export default function FinancialProjectionPanel({ institution, season }: FinancialProjectionPanelProps) {
  const resolved = season.slots.filter(s => s.report !== null && s.institutionBefore !== null)
  const remaining = 4 - resolved.length
  // Cash trajectory
  const cashTrajectory = [
    season.slots[0].institutionBefore?.cash ?? institution.cash,
    ...resolved.map(s => s.report!.net + (s.institutionBefore?.cash ?? 0)),
  ]

  const seasonNet = resolved.reduce((sum, s) => sum + (s.report?.net ?? 0), 0)
  const seasonRevenue = resolved.reduce((sum, s) => sum + (s.report?.revenue ?? 0), 0)
  const seasonExpenses = resolved.reduce((sum, s) => sum + (s.report?.expenses ?? 0), 0)

  // Crude projection if any concerts remain: scale by average net
  const avgNet = resolved.length > 0 ? seasonNet / resolved.length : 0
  const projectedNet = seasonNet + avgNet * remaining
  const projectedRevenue = seasonRevenue + (resolved.length > 0 ? (seasonRevenue / resolved.length) * remaining : 0)
  const projectedExpenses = seasonExpenses + (resolved.length > 0 ? (seasonExpenses / resolved.length) * remaining : 0)
  const surplus = projectedNet

  return (
    <div className="rail-panel">
      <h3>Financial Projection</h3>

      <div className="financial-summary">
        <div className="financial-headline">
          <span className="financial-headline-label">Projected Surplus</span>
          <span className="financial-headline-value">{fmt(surplus)}</span>
          {projectedExpenses > 0 && (
            <span className="financial-headline-meta">
              {((surplus / projectedExpenses) * 100).toFixed(1)}% of expenses
            </span>
          )}
        </div>
      </div>

      <div className="financial-ledger">
        <span className="financial-ledger-key">Revenue</span>
        <span className="financial-ledger-val">{fmt(projectedRevenue)}</span>
        <span className="financial-ledger-key">Expenses</span>
        <span className="financial-ledger-val">{fmt(projectedExpenses)}</span>
        <span className="financial-ledger-key">Surplus</span>
        <span className="financial-ledger-val">{fmt(surplus)}</span>
      </div>

      <div className="spark-wrap">
        <Sparkline values={cashTrajectory} />
      </div>
    </div>
  )
}
