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

function LedgerRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="ledger-row">
      <span className="ledger-key">{label}</span>
      <span className="ledger-val">{value}</span>
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
      <div className="book-page elevated">
        <div className="concert-header">
          <div>
            <div className="concert-slot-name">The Season · 2030–31</div>
            <div className="concert-title">EPILOGUE</div>
            <div className="concert-meta">Four concerts · Harmonia Hall</div>
            <p className="concert-flavor">
              A debut season completes. What follows is the institution we have become.
            </p>
          </div>
          <div className="quality-crest">
            <div className="quality-crest-label">Avg Quality</div>
            <div className="quality-crest-wreath">
              <div className="quality-crest-value">{s.averagePerformanceQuality}</div>
            </div>
            <div className="quality-crest-band">{qualityLabel(s.averagePerformanceQuality)}</div>
          </div>
        </div>
      </div>

      <div className="book-page">
        <h2 className="section-title">Season Financials</h2>
        <div className="ledger-grid">
          <LedgerRow label="Total Attendance" value={s.totalAttendance.toLocaleString()} />
          <LedgerRow label="Total Revenue" value={fmt(s.totalRevenue)} />
          <LedgerRow label="Total Expenses" value={fmt(s.totalExpenses)} />
          <LedgerRow
            label="Total Net"
            value={
              <span className={s.totalNet >= 0 ? 'risk-low' : 'risk-high'}>
                {fmt(s.totalNet)}
              </span>
            }
          />
        </div>
      </div>

      <div className="book-page">
        <h2 className="section-title">Artistic Performance</h2>
        <div className="ledger-grid">
          <LedgerRow
            label="Avg Performance Quality"
            value={`${s.averagePerformanceQuality} · ${qualityLabel(s.averagePerformanceQuality)}`}
          />
          <LedgerRow
            label="Avg Audience Response"
            value={`${s.averageAudienceResponse} · ${qualityLabel(s.averageAudienceResponse)}`}
          />
        </div>
      </div>

      <div className="book-page">
        <h2 className="section-title">Institutional Arc</h2>
        <div className="ledger-grid">
          <LedgerRow
            label="Cash"
            value={<span className={deltaClass(cashDelta)}>{cashDelta >= 0 ? '+' : ''}{fmt(cashDelta)}</span>}
          />
          <LedgerRow
            label="Artistic Reputation"
            value={<span className={deltaClass(repDelta)}>{deltaStr(repDelta)}</span>}
          />
          <LedgerRow
            label="Audience Trust"
            value={<span className={deltaClass(trustDelta)}>{deltaStr(trustDelta)}</span>}
          />
          <LedgerRow
            label="Donor Confidence"
            value={<span className={deltaClass(donorDelta)}>{deltaStr(donorDelta)}</span>}
          />
          <LedgerRow
            label="Musician Morale"
            value={<span className={deltaClass(moraleDelta)}>{deltaStr(moraleDelta)}</span>}
          />
          <LedgerRow
            label="Technical Quality"
            value={<span className={deltaClass(qualityDelta)}>{deltaStr(qualityDelta)}</span>}
          />
        </div>
      </div>

      <div className="book-page">
        <h2 className="section-title">Identity That Emerged</h2>
        <ul className="notes-list">
          {s.identityNarrative.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </div>

      <div className="row-between" style={{ marginTop: '1.5rem' }}>
        <span className="text-muted text-italic" style={{ fontSize: '0.85rem' }}>
          A new season awaits.
        </span>
        <button onClick={onNewSeason}>Begin a New Season →</button>
      </div>

      <div className="book-footer-flourish">
        Great orchestras aren't built by accident. They are composed.
      </div>
    </div>
  )
}
