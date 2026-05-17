import type { ReactNode } from 'react'
import { type ConcertReport, type Work } from '../types/core'
import MovementCard from './MovementCard'
import { flavorForSlot } from './concertFlavor'

interface ConcertReportProps {
  report: ConcertReport
  selectedWorks: Work[]
  slotIndex: number
  slotName: string
  onDone: () => void
  concertNumber?: number
  totalConcerts?: number
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function qualityClass(value: number): string {
  if (value >= 70) return 'risk-low'
  if (value >= 40) return 'risk-med'
  return 'risk-high'
}

function qualityLabel(value: number): string {
  if (value >= 85) return 'Exceptional'
  if (value >= 70) return 'Strong'
  if (value >= 55) return 'Solid'
  if (value >= 40) return 'Uneven'
  if (value >= 25) return 'Weak'
  return 'Poor'
}

function deltaStr(d: number): string {
  return d >= 0 ? `+${d}` : `${d}`
}

function LedgerRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="ledger-row">
      <span className="ledger-key">{label}</span>
      <span className="ledger-val">{value}</span>
    </div>
  )
}

function SealDelta({ value, isCash = false }: { value: number; isCash?: boolean }) {
  const cls = value > 0 ? 'positive' : value < 0 ? 'negative' : ''
  const text = isCash
    ? `${value >= 0 ? '+' : ''}${fmt(value)}`
    : deltaStr(value)
  return <span className={`seal-badge ${cls}`}>{text}</span>
}

export default function ConcertReport({
  report,
  selectedWorks,
  slotIndex,
  slotName,
  onDone,
  concertNumber,
  totalConcerts,
}: ConcertReportProps) {
  const flavor = flavorForSlot(slotIndex)
  const d = report.institutionalDeltas
  const isLastConcert = concertNumber != null && totalConcerts != null && concertNumber >= totalConcerts

  return (
    <div>
      <div className="book-page elevated">
        <div className="concert-header">
          <div>
            <div className="concert-slot-name">Report · {slotName}</div>
            <div className="concert-title">{flavor.title}</div>
            <div className="concert-meta">Performed · {flavor.venue}</div>
            <p className="concert-flavor">{selectedWorks.map(w => w.title).join(' · ')}</p>
          </div>
          <div className="quality-crest">
            <div className="quality-crest-label">Performance</div>
            <div className="quality-crest-wreath">
              <div className="quality-crest-value">{report.performanceQuality}</div>
            </div>
            <div className="quality-crest-band">{qualityLabel(report.performanceQuality)}</div>
          </div>
        </div>

        <div className="movement-grid">
          {selectedWorks.map((work, i) => (
            <MovementCard
              key={work.id}
              movement={i + 1}
              movementName={flavor.movementNames[i]}
              work={work}
            />
          ))}
        </div>
      </div>

      <div className="book-page">
        <h2 className="section-title">The Evening's Ledger</h2>
        <div className="ledger-grid">
          <LedgerRow label="Attendance" value={report.attendance.toLocaleString()} />
          <LedgerRow label="Revenue" value={fmt(report.revenue)} />
          <LedgerRow label="Expenses" value={fmt(report.expenses)} />
          <LedgerRow
            label="Net"
            value={<span className={report.net >= 0 ? 'risk-low' : 'risk-high'}>{fmt(report.net)}</span>}
          />
        </div>
      </div>

      <div className="book-page">
        <h2 className="section-title">Reception</h2>
        <div className="ledger-grid">
          <LedgerRow
            label="Audience Response"
            value={
              <span className={qualityClass(report.audienceResponse)}>
                {report.audienceResponse} · {qualityLabel(report.audienceResponse)}
              </span>
            }
          />
          <LedgerRow
            label="Critic Response"
            value={
              <span className={qualityClass(report.criticResponse)}>
                {report.criticResponse} · {qualityLabel(report.criticResponse)}
              </span>
            }
          />
        </div>
      </div>

      <div className="book-page">
        <h2 className="section-title">Section Outcomes</h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {report.sectionOutcomes.map(outcome => (
            <div key={outcome.section} className="section-outcome">
              <span className="section-outcome-name">{outcome.section}</span>
              <span className={`section-outcome-quality ${qualityClass(outcome.quality)}`}>
                {outcome.quality}
              </span>
              <span className="section-outcome-note">{outcome.note}</span>
            </div>
          ))}
        </div>
      </div>

      {report.notableMoments.length > 0 && (
        <div className="book-page">
          <h2 className="section-title">Notable Moments</h2>
          <ul className="notes-list">
            {report.notableMoments.map((moment, i) => (
              <li key={i}>{moment}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="book-page">
        <h2 className="section-title">Institutional Impact</h2>
        <div className="ledger-grid">
          <LedgerRow label="Cash" value={<SealDelta value={d.cash} isCash />} />
          <LedgerRow label="Reputation" value={<SealDelta value={d.artisticReputation} />} />
          <LedgerRow label="Audience Trust" value={<SealDelta value={d.audienceTrust} />} />
          <LedgerRow label="Donor Confidence" value={<SealDelta value={d.donorConfidence} />} />
          <LedgerRow label="Morale" value={<SealDelta value={d.musicianMorale} />} />
          <LedgerRow label="Tech Quality" value={<SealDelta value={d.technicalQuality} />} />
          {(d.identity.adventurous ?? 0) !== 0 && (
            <LedgerRow label="Adventurous" value={<SealDelta value={d.identity.adventurous!} />} />
          )}
          {(d.identity.scholarly ?? 0) !== 0 && (
            <LedgerRow label="Scholarly" value={<SealDelta value={d.identity.scholarly!} />} />
          )}
          {(d.identity.communityFocused ?? 0) !== 0 && (
            <LedgerRow label="Community" value={<SealDelta value={d.identity.communityFocused!} />} />
          )}
        </div>
      </div>

      <div className="row-between" style={{ marginTop: '1.5rem' }}>
        <span className="text-muted text-italic" style={{ fontSize: '0.85rem' }}>
          {isLastConcert ? 'Turn the page to close the season.' : 'Turn the page to plan the next concert.'}
        </span>
        <button onClick={onDone}>
          {isLastConcert ? 'View Season Summary →' : `Plan Concert ${(concertNumber ?? 0) + 1} →`}
        </button>
      </div>

      <div className="book-footer-flourish">
        Great orchestras aren't built by accident. They are composed.
      </div>
    </div>
  )
}
