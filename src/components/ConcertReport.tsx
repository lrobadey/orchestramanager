import { type AudienceBreakdown, type ConcertReport, type Work } from '../types/core'

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

function ledeFor(report: ConcertReport, works: Work[]): React.ReactNode {
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
    <div className="audience-mix-list">
      {rows.map(row => (
        <div key={row.segmentId} className="audience-mix-row audience-mix-row-report">
          <span className="audience-segment-name">{row.segmentName}</span>
          <span className="audience-segment-count">{row.attendance.toLocaleString()}</span>
          <span className="audience-segment-share">{Math.round(row.shareOfHouse * 100)}%</span>
          <span className="audience-segment-revenue">{fmt$(row.ticketRevenue)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ConcertReportView({ report, selectedWorks, onDone, concertNumber, totalConcerts }: ConcertReportProps) {
  const d = report.institutionalDeltas

  return (
    <div className="screen screen-report report-page">
      <span className="eyebrow report-eyebrow">Concert {concertNumber ?? ''} Report</span>
      <h1 className="report-lede">{ledeFor(report, selectedWorks)}</h1>
      <p className="report-byline">{selectedWorks.map(w => w.title).join(' · ')}</p>

      <div className="report-stat-row">
        <div className="report-stat">
          <span className="report-stat-label">Attendance</span>
          <span className="report-stat-num">{report.attendance.toLocaleString()}</span>
        </div>
        <div className="report-stat">
          <span className="report-stat-label">Ticket rev.</span>
          <span className="report-stat-num">{fmt$(report.revenue)}</span>
        </div>
        {report.donorUplift > 0 && (
          <div className="report-stat">
            <span className="report-stat-label">Donor support</span>
            <span className="report-stat-num aurora">{fmt$(report.donorUplift)}</span>
          </div>
        )}
        <div className="report-stat">
          <span className="report-stat-label">Expenses</span>
          <span className="report-stat-num">{fmt$(report.expenses)}</span>
        </div>
        <div className="report-stat">
          <span className="report-stat-label">Net</span>
          <span className={`report-stat-num ${report.net >= 0 ? 'aurora' : 'berry'}`}>
            {fmt$(report.net)}
          </span>
        </div>
        <div className="report-stat">
          <span className="report-stat-label">Quality</span>
          <span className={`report-stat-num ${qualityClass(report.performanceQuality)}`}>
            {report.performanceQuality}
          </span>
          <span className="text-muted text-mono" style={{ fontSize: '0.55rem', letterSpacing: '0.1em', marginTop: '0.1rem' }}>
            {qualityLabel(report.performanceQuality)}
          </span>
        </div>
        <div className="report-stat">
          <span className="report-stat-label">Critics</span>
          <span className={`report-stat-num ${qualityClass(report.criticResponse)}`}>
            {report.criticResponse}
          </span>
          <span className="text-muted text-mono" style={{ fontSize: '0.55rem', letterSpacing: '0.1em', marginTop: '0.1rem' }}>
            {qualityLabel(report.criticResponse)}
          </span>
        </div>
      </div>

      <div className="report-block">
        <span className="eyebrow report-block-title">Expense Breakdown</span>
        <div className="report-section-list">
          {([
            ['Base', report.expenseBreakdown.baseConcert],
            ['Rehearsal', report.expenseBreakdown.rehearsal],
            ['Marketing', report.expenseBreakdown.marketing],
            ...(report.expenseBreakdown.production > 0 ? [['Production', report.expenseBreakdown.production] as [string, number]] : []),
          ] as [string, number][]).map(([label, amount]) => (
            <div key={label} className="report-section-line">
              <span className="report-section-line-label">{label}</span>
              <span className="report-section-line-score">{fmt$(amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="report-block">
        <span className="eyebrow report-block-title">Audience Mix</span>
        <AudienceMix rows={report.audienceBreakdown} />
      </div>

      {report.financialNotes.length > 0 && (
        <div className="report-block">
          <span className="eyebrow report-block-title">Financial Notes</span>
          <ul className="notes-list">
            {report.financialNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="report-block">
        <span className="eyebrow report-block-title">Section Outcomes</span>
        <div className="report-section-list">
          {report.sectionOutcomes.map(outcome => (
            <div key={outcome.section} className="report-section-line">
              <span className="report-section-line-label">{outcome.label}</span>
              <span className={`report-section-line-score ${outcomeClass(outcome.quality)}`}>{outcome.quality}</span>
              <span className="report-section-line-note">{outcome.note}</span>
            </div>
          ))}
        </div>
      </div>

      {report.notableMoments.length > 0 && (
        <div className="report-block">
          <span className="eyebrow report-block-title">Notable Moments</span>
          <ul className="notes-list">
            {report.notableMoments.map((moment, i) => (
              <li key={i}>{moment}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="report-block">
        <span className="eyebrow report-block-title">Roster Aftermath</span>
        <div className="report-roster-list">
          {report.rosterChanges
            .filter(c => c.formDelta !== 0 || c.moraleDelta !== 0)
            .sort((a, b) => Math.abs(b.formDelta) + Math.abs(b.moraleDelta) - Math.abs(a.formDelta) - Math.abs(a.moraleDelta))
            .slice(0, 8)
            .map(change => (
              <div key={change.principalId} className="report-roster-row">
                <span className="report-roster-name">
                  {change.principalName}
                  <small>{change.position}</small>
                </span>
                <span className={`report-roster-delta ${deltaCls(change.formDelta)}`}>
                  Form {deltaStr(change.formDelta)}
                </span>
                <span className={`report-roster-delta ${deltaCls(change.moraleDelta)}`}>
                  Morale {deltaStr(change.moraleDelta)}
                </span>
                <span className="report-roster-note">{change.note}</span>
              </div>
            ))}
          {report.rosterChanges.every(c => c.formDelta === 0 && c.moraleDelta === 0) && (
            <p className="text-muted">The principals held steady; no form or morale movement.</p>
          )}
        </div>
      </div>

      <div className="report-block">
        <span className="eyebrow report-block-title">Institutional Impact</span>
        <div className="report-delta-grid">
          <div className="report-delta">
            <span className="report-delta-label">Cash</span>
            <span className={`report-delta-value ${deltaCls(d.cash)}`}>
              {d.cash >= 0 ? '+' : ''}{fmt$(d.cash)}
            </span>
          </div>
          <div className="report-delta">
            <span className="report-delta-label">Reputation</span>
            <span className={`report-delta-value ${deltaCls(d.artisticReputation)}`}>
              {deltaStr(d.artisticReputation)}
            </span>
          </div>
          <div className="report-delta">
            <span className="report-delta-label">Trust</span>
            <span className={`report-delta-value ${deltaCls(d.audienceTrust)}`}>
              {deltaStr(d.audienceTrust)}
            </span>
          </div>
          <div className="report-delta">
            <span className="report-delta-label">Donors</span>
            <span className={`report-delta-value ${deltaCls(d.donorConfidence)}`}>
              {deltaStr(d.donorConfidence)}
            </span>
          </div>
          <div className="report-delta">
            <span className="report-delta-label">Morale</span>
            <span className={`report-delta-value ${deltaCls(d.musicianMorale)}`}>
              {deltaStr(d.musicianMorale)}
            </span>
          </div>
          <div className="report-delta">
            <span className="report-delta-label">Tech</span>
            <span className={`report-delta-value ${deltaCls(d.technicalQuality)}`}>
              {deltaStr(d.technicalQuality)}
            </span>
          </div>
          {(d.identity.adventurous ?? 0) !== 0 && (
            <div className="report-delta">
              <span className="report-delta-label">Adventurous</span>
              <span className="report-delta-value pos">+{d.identity.adventurous}</span>
            </div>
          )}
          {(d.identity.scholarly ?? 0) !== 0 && (
            <div className="report-delta">
              <span className="report-delta-label">Scholarly</span>
              <span className="report-delta-value pos">+{d.identity.scholarly}</span>
            </div>
          )}
          {(d.identity.communityFocused ?? 0) !== 0 && (
            <div className="report-delta">
              <span className="report-delta-label">Community</span>
              <span className="report-delta-value pos">+{d.identity.communityFocused}</span>
            </div>
          )}
        </div>
      </div>

      <div className="report-foot">
        <button type="button" className="cta-aurora" onClick={onDone}>
          {concertNumber != null && totalConcerts != null && concertNumber < totalConcerts
            ? `Continue to Concert ${concertNumber + 1}`
            : 'View Season Summary'}
        </button>
      </div>
    </div>
  )
}
