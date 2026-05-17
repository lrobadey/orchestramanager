import type { ReactNode } from 'react'
import { SeasonSummary } from '../types/core'

interface SeasonSummaryPanelProps {
  summary: SeasonSummary
  onNewSeason: () => void
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function deltaStr(d: number): string {
  return d >= 0 ? `+${d}` : `${d}`
}

function deltaClass(d: number): string {
  return d >= 0 ? 'delta-positive' : 'delta-negative'
}

function qualityLabel(value: number): string {
  if (value >= 85) return 'Exceptional'
  if (value >= 70) return 'Strong'
  if (value >= 55) return 'Solid'
  if (value >= 40) return 'Uneven'
  if (value >= 25) return 'Weak'
  return 'Poor'
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="forecast-item">
      <span className="forecast-key">{label}</span>
      <span className="forecast-val">{value}</span>
    </div>
  )
}

export default function SeasonSummaryPanel({ summary, onNewSeason }: SeasonSummaryPanelProps) {
  const s = summary
  const fi = s.finalInstitution
  const si = s.startingInstitution

  const repDelta = fi.artisticReputation - si.artisticReputation
  const trustDelta = fi.audienceTrust - si.audienceTrust
  const donorDelta = fi.donorConfidence - si.donorConfidence
  const moraleDelta = fi.musicianMorale - si.musicianMorale
  const qualityDelta = fi.technicalQuality - si.technicalQuality
  const cashDelta = fi.cash - si.cash

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, marginBottom: '0.25rem' }}>Season Summary</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
          Four-concert debut season complete
        </p>
      </div>

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Season Financials</h3>
        <div className="forecast-grid">
          <SummaryRow label="Total Attendance" value={s.totalAttendance.toLocaleString()} />
          <SummaryRow label="Total Revenue" value={fmt(s.totalRevenue)} />
          <SummaryRow label="Total Expenses" value={fmt(s.totalExpenses)} />
          <SummaryRow
            label="Total Net"
            value={
              <span className={s.totalNet >= 0 ? 'risk-low' : 'risk-high'}>
                {fmt(s.totalNet)}
              </span>
            }
          />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Artistic Performance</h3>
        <div className="forecast-grid">
          <SummaryRow
            label="Avg Performance Quality"
            value={`${s.averagePerformanceQuality} — ${qualityLabel(s.averagePerformanceQuality)}`}
          />
          <SummaryRow
            label="Avg Audience Response"
            value={`${s.averageAudienceResponse} — ${qualityLabel(s.averageAudienceResponse)}`}
          />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Institutional Arc</h3>
        <div className="forecast-grid">
          <SummaryRow
            label="Cash"
            value={<span className={deltaClass(cashDelta)}>{cashDelta >= 0 ? '+' : ''}{fmt(cashDelta)}</span>}
          />
          <SummaryRow
            label="Artistic Reputation"
            value={<span className={deltaClass(repDelta)}>{deltaStr(repDelta)}</span>}
          />
          <SummaryRow
            label="Audience Trust"
            value={<span className={deltaClass(trustDelta)}>{deltaStr(trustDelta)}</span>}
          />
          <SummaryRow
            label="Donor Confidence"
            value={<span className={deltaClass(donorDelta)}>{deltaStr(donorDelta)}</span>}
          />
          <SummaryRow
            label="Musician Morale"
            value={<span className={deltaClass(moraleDelta)}>{deltaStr(moraleDelta)}</span>}
          />
          <SummaryRow
            label="Technical Quality"
            value={<span className={deltaClass(qualityDelta)}>{deltaStr(qualityDelta)}</span>}
          />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.6rem' }}>Identity That Emerged</h3>
        <ul className="notes-list">
          {s.identityNarrative.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </div>

      <button onClick={onNewSeason} style={{ fontSize: '1rem', padding: '0.65rem 2rem' }}>
        New Season →
      </button>
    </div>
  )
}
