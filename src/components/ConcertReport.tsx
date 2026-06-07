import type { ReactNode } from 'react'
import { type AudienceBreakdown, type ConcertReport, type PrincipalRosterChange, type Work } from '../types/core'
import { HALL_CAPACITY } from '../sim/scoring'

interface ConcertReportProps {
  report: ConcertReport
  selectedWorks: Work[]
  onDone: () => void
  concertNumber?: number
  totalConcerts?: number
}

function fmt$(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtK(n: number): string {
  const sign = n >= 0 ? '+' : '-'
  const value = Math.abs(n) / 1000
  return `${sign}$${value >= 100 ? value.toFixed(0) : value.toFixed(1)}K`
}

function qualityClass(value: number): string {
  if (value >= 70) return 'aurora'
  if (value >= 40) return ''
  return 'berry'
}

function qualityLabel(value: number): string {
  if (value >= 85) return 'Exceptional'
  if (value >= 70) return 'Strong'
  if (value >= 55) return 'Solid'
  if (value >= 40) return 'Uneven'
  if (value >= 25) return 'Weak'
  return 'Poor'
}

function ledeFor(report: ConcertReport, works: Work[]): ReactNode {
  const q = report.performanceQuality
  const critic = report.criticResponse
  const verdict =
    q >= 80 ? 'triumphant' :
    q >= 65 ? 'a strong outing' :
    q >= 50 ? 'a working performance' :
    q >= 35 ? 'uneven' :
    'a disappointment'
  const subject = works[0]?.title ?? 'the concert'
  return (
    <>
      <em>{subject}</em>: <strong>{verdict}</strong>
      {critic >= 70 ? ', and the critics agree.' : critic <= 40 ? ', though the critics were sharp.' : '.'}
    </>
  )
}

function deltaStr(d: number): string {
  return d >= 0 ? `+${d}` : `${d}`
}

function deltaCls(d: number): string {
  return d > 0 ? 'pos' : d < 0 ? 'neg' : ''
}

function outcomeClass(quality: number): string {
  if (quality >= 70) return 'outcome-pass'
  if (quality >= 40) return 'outcome-ok'
  return 'outcome-fail'
}

function AudienceMix({ rows }: { rows: AudienceBreakdown[] }) {
  return (
    <div className="report-audience-panel">
      <div className="report-audience-stack" aria-hidden="true">
        {rows.map((row, i) => (
          <span
            key={row.segmentId}
            className={`report-audience-stack-seg seg-${i % 4}`}
            style={{ width: `${Math.max(2, row.shareOfHouse * 100)}%` }}
          />
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={row.segmentId} className="report-audience-row">
          <span className={`report-audience-dot seg-${i % 4}`} />
          <span className="report-audience-name">{row.segmentName}</span>
          <span className="report-audience-meta">{row.attendance.toLocaleString()} · {Math.round(row.shareOfHouse * 100)}%</span>
          <span className="report-audience-money">{fmt$(row.ticketRevenue)}</span>
        </div>
      ))}
    </div>
  )
}

function RosterChangeRow({ change }: { change: PrincipalRosterChange }) {
  return (
    <div className="report-roster-row-modern">
      <div>
        <span className="report-roster-modern-name">{change.principalName}</span>
        <span className="report-roster-modern-position">{change.position}</span>
      </div>
      <span className={`report-roster-pill ${deltaCls(change.formDelta)}`}>F {deltaStr(change.formDelta)}</span>
      <span className={`report-roster-pill ${deltaCls(change.moraleDelta)}`}>M {deltaStr(change.moraleDelta)}</span>
      <p>{change.note}</p>
    </div>
  )
}

export default function ConcertReportView({ report, selectedWorks, onDone, concertNumber, totalConcerts }: ConcertReportProps) {
  const d = report.institutionalDeltas
  const capacityPercent = Math.round((report.attendance / HALL_CAPACITY) * 100)
  const hasNextConcert = concertNumber != null && totalConcerts != null && concertNumber < totalConcerts
  const topRosterChanges = report.rosterChanges
    .filter(c => c.formDelta !== 0 || c.moraleDelta !== 0)
    .sort((a, b) => Math.abs(b.formDelta) + Math.abs(b.moraleDelta) - Math.abs(a.formDelta) - Math.abs(a.moraleDelta))
    .slice(0, 7)

  return (
    <div className="screen screen-report report-page report-page-modern">
      <section className="report-hero">
        <div className="report-hero-copy">
          <span className="hc-eyebrow report-resolved">● Resolved · Concert {concertNumber ?? ''} of {totalConcerts ?? 4}</span>
          <h1 className="report-lede report-lede-modern">{ledeFor(report, selectedWorks)}</h1>
          <p className="report-byline report-byline-modern">{selectedWorks.map(w => w.title).join(' · ')}</p>
        </div>
        <div className="report-hero-metrics">
          <HeroMetric label="Quality" value={report.performanceQuality} sub={qualityLabel(report.performanceQuality)} tone={qualityClass(report.performanceQuality)} />
          <HeroMetric label="Audience" value={report.audienceResponse} sub={qualityLabel(report.audienceResponse)} tone={qualityClass(report.audienceResponse)} />
          <HeroMetric label="Attendance" value={report.attendance.toLocaleString()} sub={`${capacityPercent}% capacity`} />
          <HeroMetric label="Net" value={fmtK(report.net)} sub="cash impact" tone={report.net >= 0 ? 'aurora' : 'berry'} />
        </div>
      </section>

      <section className="report-modern-grid">
        <div className="report-column">
          <ReportPanel title="Section outcomes" meta="quality per desk">
            {report.sectionOutcomes.map(outcome => (
              <div key={outcome.section} className="report-section-card">
                <div className="report-section-card-head">
                  <span>{outcome.label}</span>
                  <strong className={outcomeClass(outcome.quality)}>{outcome.quality}</strong>
                </div>
                <div className="report-quality-bar"><i style={{ width: `${outcome.quality}%` }} /></div>
                <p>{outcome.note}</p>
              </div>
            ))}
          </ReportPanel>

          {report.notableMoments.length > 0 && (
            <ReportPanel title="Notable moments">
              <ol className="report-moments-list">
                {report.notableMoments.map((moment, i) => <li key={i}>{moment}</li>)}
              </ol>
            </ReportPanel>
          )}
        </div>

        <div className="report-column">
          <ReportPanel title="Audience mix" meta={`${report.attendance.toLocaleString()} seats`}>
            <AudienceMix rows={report.audienceBreakdown} />
          </ReportPanel>

          <ReportPanel title="Finance" meta="settlement">
            <div className="report-finance-grid">
              <FinanceCell label="Ticket rev." value={fmt$(report.revenue)} />
              <FinanceCell label="Concert pledges" value={fmt$(report.donorUplift)} tone={report.donorUplift > 0 ? 'pos' : ''} />
              <FinanceCell label="Operating" value={fmt$(report.operatingSupport ?? 0)} tone={(report.operatingSupport ?? 0) > 0 ? 'pos' : ''} />
              <FinanceCell label="Expenses" value={fmt$(report.expenses)} />
              <FinanceCell label="Net" value={fmt$(report.net)} tone={report.net >= 0 ? 'pos' : 'neg'} />
            </div>
            <div className="report-expense-breakdown">
              {([
                ['Base', report.expenseBreakdown.baseConcert],
                ['Rehearsal', report.expenseBreakdown.rehearsal],
                ['Marketing', report.expenseBreakdown.marketing],
                ...(report.expenseBreakdown.production > 0
                  ? [['Production', report.expenseBreakdown.production] as [string, number]]
                  : []),
              ] as [string, number][]).map(([label, amount]) => (
                <div key={label} className="report-expense-row">
                  <span>{label}</span>
                  <strong>{fmt$(amount)}</strong>
                </div>
              ))}
            </div>
            {report.financialNotes.length > 0 && (
              <ul className="report-notes-compact">
                {report.financialNotes.map((note, i) => <li key={i}>{note}</li>)}
              </ul>
            )}
          </ReportPanel>
        </div>

        <div className="report-column">
          <ReportPanel title="Roster aftermath" meta="form & morale">
            {topRosterChanges.length > 0 ? topRosterChanges.map(change => (
              <RosterChangeRow key={change.principalId} change={change} />
            )) : <p className="text-muted">The principals held steady; no form or morale movement.</p>}
          </ReportPanel>

          <ReportPanel title="Institutional impact">
            <div className="report-impact-grid">
              <ImpactCell label="Cash" value={`${d.cash >= 0 ? '+' : ''}${fmt$(d.cash)}`} delta={d.cash} />
              <ImpactCell label="Reputation" value={deltaStr(d.artisticReputation)} delta={d.artisticReputation} />
              <ImpactCell label="Trust" value={deltaStr(d.audienceTrust)} delta={d.audienceTrust} />
              <ImpactCell label="Donors" value={deltaStr(d.donorConfidence)} delta={d.donorConfidence} />
              <ImpactCell label="Morale" value={deltaStr(d.musicianMorale)} delta={d.musicianMorale} />
              <ImpactCell label="Tech" value={deltaStr(d.technicalQuality)} delta={d.technicalQuality} />
              {(d.identity.adventurous ?? 0) !== 0 && (
                <ImpactCell label="Adventurous" value={deltaStr(d.identity.adventurous!)} delta={d.identity.adventurous!} />
              )}
              {(d.identity.scholarly ?? 0) !== 0 && (
                <ImpactCell label="Scholarly" value={deltaStr(d.identity.scholarly!)} delta={d.identity.scholarly!} />
              )}
              {(d.identity.communityFocused ?? 0) !== 0 && (
                <ImpactCell label="Community" value={deltaStr(d.identity.communityFocused!)} delta={d.identity.communityFocused!} />
              )}
            </div>
          </ReportPanel>
        </div>
      </section>

      <div className="report-foot report-foot-modern">
        <span className="hc-serif">Concert {concertNumber ?? ''} resolved. {hasNextConcert ? 'The season pressure moves forward.' : 'The board packet is ready.'}</span>
        <button type="button" className="report-continue-button" onClick={onDone}>
          <span>▸</span>
          {hasNextConcert ? `Continue to Concert ${(concertNumber ?? 0) + 1}` : 'View Season Summary'}
        </button>
      </div>
    </div>
  )
}

function HeroMetric({ label, value, sub, tone = '' }: { label: string; value: string | number; sub: string; tone?: string }) {
  return <div className="report-hero-metric"><span>{label}</span><strong className={tone}>{value}</strong><small>{sub}</small></div>
}

function ReportPanel({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  return <div className="report-panel"><div className="report-panel-head"><span>{title}</span>{meta && <small>{meta}</small>}</div>{children}</div>
}

function FinanceCell({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
  return <div className="report-finance-cell"><span>{label}</span><strong className={tone}>{value}</strong></div>
}

function ImpactCell({ label, value, delta }: { label: string; value: string; delta: number }) {
  return <div className="report-impact-cell"><span>{label}</span><strong className={deltaCls(delta)}>{value}</strong></div>
}
