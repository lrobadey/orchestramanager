import type { ReactNode } from 'react'
import { type AudienceBreakdown, type ConcertReport, type Work } from '../types/core'

interface ConcertReportProps {
  report: ConcertReport
  selectedWorks: Work[]
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

function ReportRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="forecast-item">
      <span className="forecast-key">{label}</span>
      <span className="forecast-val">{value}</span>
    </div>
  )
}

function AudienceMix({ rows }: { rows: AudienceBreakdown[] }) {
  return (
    <div className="audience-mix-list">
      {rows.map(row => (
        <div key={row.segmentId} className="audience-mix-row audience-mix-row-report">
          <span className="audience-segment-name">{row.segmentName}</span>
          <span className="audience-segment-count">{row.attendance.toLocaleString()}</span>
          <span className="audience-segment-share">
            {Math.round(row.shareOfHouse * 100)}%
          </span>
          <span className="audience-segment-revenue">{fmt(row.ticketRevenue)}</span>
        </div>
      ))}
    </div>
  )
}

function outcomeClass(quality: number): string {
  if (quality >= 70) return 'outcome-pass'
  if (quality >= 40) return 'outcome-ok'
  return 'outcome-fail'
}

export default function ConcertReport({ report, selectedWorks, onDone, concertNumber, totalConcerts }: ConcertReportProps) {
  const netClass = report.net >= 0 ? 'risk-low' : 'risk-high'
  const d = report.institutionalDeltas

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, marginBottom: '0.25rem' }}>Concert Report</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
          {selectedWorks.map(w => w.title).join(' · ')}
        </p>
      </div>

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Audience Mix</h3>
        <AudienceMix rows={report.audienceBreakdown} />
      </div>

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Results</h3>
        <div className="forecast-grid">
          <ReportRow label="Attendance" value={report.attendance.toLocaleString()} />
          <ReportRow label="Revenue" value={fmt(report.revenue)} />
          <ReportRow label="Expenses" value={fmt(report.expenses)} />
          <ReportRow
            label="Net"
            value={<span className={netClass}>{fmt(report.net)}</span>}
          />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Performance</h3>
        <div className="forecast-grid">
          <ReportRow
            label="Overall Quality"
            value={
              <span className={qualityClass(report.performanceQuality)}>
                {report.performanceQuality} — {qualityLabel(report.performanceQuality)}
              </span>
            }
          />
          <ReportRow
            label="Audience Response"
            value={
              <span className={qualityClass(report.audienceResponse)}>
                {report.audienceResponse} — {qualityLabel(report.audienceResponse)}
              </span>
            }
          />
          <ReportRow
            label="Critic Response"
            value={
              <span className={qualityClass(report.criticResponse)}>
                {report.criticResponse} — {qualityLabel(report.criticResponse)}
              </span>
            }
          />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.6rem' }}>Section Outcomes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {report.sectionOutcomes.map(outcome => (
            <div key={outcome.section} className="section-outcome">
              <span style={{ fontWeight: 'bold', width: '7rem', flexShrink: 0 }}>
                {outcome.label}
              </span>
              <span className={`${outcomeClass(outcome.quality)}`} style={{ width: '4rem', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                {outcome.quality}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{outcome.note}</span>
            </div>
          ))}
        </div>
      </div>

      {report.notableMoments.length > 0 && (
        <div className="panel" style={{ marginBottom: '0.75rem' }}>
          <h3 style={{ marginBottom: '0.6rem' }}>Notable Moments</h3>
          <ul className="notes-list">
            {report.notableMoments.map((moment, i) => (
              <li key={i}>{moment}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.6rem' }}>Roster Aftermath</h3>
        <div className="roster-change-list">
          {report.rosterChanges
            .filter(change => change.formDelta !== 0 || change.moraleDelta !== 0)
            .sort((a, b) => Math.abs(b.formDelta) + Math.abs(b.moraleDelta) - Math.abs(a.formDelta) - Math.abs(a.moraleDelta))
            .slice(0, 6)
            .map(change => (
              <div key={change.principalId} className="roster-change-row">
                <span className="roster-change-name">
                  {change.principalName}
                  <small>{change.position}</small>
                </span>
                <span className={change.formDelta >= 0 ? 'delta-positive' : 'delta-negative'}>
                  Form {deltaStr(change.formDelta)}
                </span>
                <span className={change.moraleDelta >= 0 ? 'delta-positive' : 'delta-negative'}>
                  Morale {deltaStr(change.moraleDelta)}
                </span>
                <span className="roster-change-note">{change.note}</span>
              </div>
            ))}
          {report.rosterChanges.every(change => change.formDelta === 0 && change.moraleDelta === 0) && (
            <p className="text-muted">The principals held steady; no form or morale movement this concert.</p>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Institutional Impact</h3>
        <div className="forecast-grid">
          <ReportRow
            label="Cash"
            value={<span className={d.cash >= 0 ? 'delta-positive' : 'delta-negative'}>{d.cash >= 0 ? '+' : ''}{fmt(d.cash)}</span>}
          />
          <ReportRow
            label="Reputation"
            value={<span className={d.artisticReputation >= 0 ? 'delta-positive' : 'delta-negative'}>{deltaStr(d.artisticReputation)}</span>}
          />
          <ReportRow
            label="Audience Trust"
            value={<span className={d.audienceTrust >= 0 ? 'delta-positive' : 'delta-negative'}>{deltaStr(d.audienceTrust)}</span>}
          />
          <ReportRow
            label="Donor Confidence"
            value={<span className={d.donorConfidence >= 0 ? 'delta-positive' : 'delta-negative'}>{deltaStr(d.donorConfidence)}</span>}
          />
          <ReportRow
            label="Morale"
            value={<span className={d.musicianMorale >= 0 ? 'delta-positive' : 'delta-negative'}>{deltaStr(d.musicianMorale)}</span>}
          />
          <ReportRow
            label="Tech Quality"
            value={<span className={d.technicalQuality >= 0 ? 'delta-positive' : 'delta-negative'}>{deltaStr(d.technicalQuality)}</span>}
          />
          {(d.identity.adventurous ?? 0) !== 0 && (
            <ReportRow
              label="Identity: Adventurous"
              value={<span className="delta-positive">+{d.identity.adventurous}</span>}
            />
          )}
          {(d.identity.scholarly ?? 0) !== 0 && (
            <ReportRow
              label="Identity: Scholarly"
              value={<span className="delta-positive">+{d.identity.scholarly}</span>}
            />
          )}
        </div>
      </div>

      <button onClick={onDone} style={{ fontSize: '1rem', padding: '0.65rem 2rem' }}>
        {concertNumber != null && totalConcerts != null && concertNumber < totalConcerts
          ? `Apply & Plan Concert ${concertNumber + 1} →`
          : 'Apply & View Season Summary →'}
      </button>
    </div>
  )
}
