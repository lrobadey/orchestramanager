import { SeasonSummary } from '../types/core'

interface SeasonSummaryPanelProps {
  summary: SeasonSummary
  onNewSeason: () => void
}

function fmt$(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function deltaStr(d: number): string {
  return d >= 0 ? `+${d}` : `${d}`
}

function deltaCls(d: number): string {
  return d > 0 ? 'pos' : d < 0 ? 'neg' : ''
}

function qualityLabel(value: number): string {
  if (value >= 85) return 'Exceptional'
  if (value >= 70) return 'Strong'
  if (value >= 55) return 'Solid'
  if (value >= 40) return 'Uneven'
  if (value >= 25) return 'Weak'
  return 'Poor'
}

function ledeFor(summary: SeasonSummary): React.ReactNode {
  const q = summary.averagePerformanceQuality
  const id = summary.finalInstitution.identity
  const arc = id.adventurous - summary.startingInstitution.identity.adventurous
  const scholar = id.scholarly - summary.startingInstitution.identity.scholarly
  const community = id.communityFocused - summary.startingInstitution.identity.communityFocused
  const character =
    arc >= 12 ? 'an adventurous voice' :
    scholar >= 12 ? 'a scholarly institution' :
    community >= 12 ? 'a community anchor' :
    'a working orchestra'
  const adjective =
    q >= 75 ? 'commanding' :
    q >= 60 ? 'capable' :
    q >= 45 ? 'serviceable' :
    'unsteady'
  return (
    <>
      Four concerts in, you've built <strong>{adjective}</strong> — and {character}.
    </>
  )
}

export default function SeasonSummaryPanel({ summary, onNewSeason }: SeasonSummaryPanelProps) {
  const fi = summary.finalInstitution
  const si = summary.startingInstitution

  const repDelta = fi.artisticReputation - si.artisticReputation
  const trustDelta = fi.audienceTrust - si.audienceTrust
  const donorDelta = fi.donorConfidence - si.donorConfidence
  const moraleDelta = fi.musicianMorale - si.musicianMorale
  const qualityDelta = fi.technicalQuality - si.technicalQuality
  const cashDelta = fi.cash - si.cash

  return (
    <div className="screen screen-summary summary-page">
      <p className="summary-byline">Season I · Debut · Four concerts complete</p>
      <h1 className="summary-lede">{ledeFor(summary)}</h1>

      <div className="summary-stats">
        <div className="report-stat">
          <span className="report-stat-label">Total attendance</span>
          <span className="report-stat-num">{summary.totalAttendance.toLocaleString()}</span>
        </div>
        <div className="report-stat">
          <span className="report-stat-label">Avg capacity</span>
          <span className="report-stat-num">{summary.averageCapacityPercent}%</span>
        </div>
        <div className="report-stat">
          <span className="report-stat-label">Total revenue</span>
          <span className="report-stat-num">{fmt$(summary.totalRevenue)}</span>
        </div>
        <div className="report-stat">
          <span className="report-stat-label">Total expenses</span>
          <span className="report-stat-num">{fmt$(summary.totalExpenses)}</span>
        </div>
        <div className="report-stat">
          <span className="report-stat-label">Net</span>
          <span className={`report-stat-num ${summary.totalNet >= 0 ? 'aurora' : 'berry'}`}>
            {fmt$(summary.totalNet)}
          </span>
        </div>
      </div>

      <div className="summary-block">
        <span className="eyebrow summary-block-title">Artistic Average</span>
        <div className="report-stat-row" style={{ borderTop: 'none', borderBottom: 'none', padding: 0, gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="report-stat">
            <span className="report-stat-label">Performance</span>
            <span className="report-stat-num">{summary.averagePerformanceQuality}</span>
            <span className="text-muted text-mono" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
              {qualityLabel(summary.averagePerformanceQuality)}
            </span>
          </div>
          <div className="report-stat">
            <span className="report-stat-label">Audience</span>
            <span className="report-stat-num">{summary.averageAudienceResponse}</span>
            <span className="text-muted text-mono" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
              {qualityLabel(summary.averageAudienceResponse)}
            </span>
          </div>
        </div>
      </div>

      <div className="summary-block">
        <span className="eyebrow summary-block-title">Audience Segments</span>
        <div className="report-delta-grid">
          <div className="report-delta">
            <span className="report-delta-label">Best segment</span>
            <span className="report-delta-value pos">{summary.bestSegment}</span>
          </div>
          <div className="report-delta">
            <span className="report-delta-label">Weakest segment</span>
            <span className="report-delta-value neg">{summary.worstSegment}</span>
          </div>
        </div>
      </div>

      <div className="summary-block">
        <span className="eyebrow summary-block-title">Institutional Arc</span>
        <div className="report-delta-grid">
          <div className="report-delta">
            <span className="report-delta-label">Cash</span>
            <span className={`report-delta-value ${deltaCls(cashDelta)}`}>
              {cashDelta >= 0 ? '+' : ''}{fmt$(cashDelta)}
            </span>
          </div>
          <div className="report-delta">
            <span className="report-delta-label">Reputation</span>
            <span className={`report-delta-value ${deltaCls(repDelta)}`}>
              {deltaStr(repDelta)}
            </span>
          </div>
          <div className="report-delta">
            <span className="report-delta-label">Audience Trust</span>
            <span className={`report-delta-value ${deltaCls(trustDelta)}`}>
              {deltaStr(trustDelta)}
            </span>
          </div>
          <div className="report-delta">
            <span className="report-delta-label">Donors</span>
            <span className={`report-delta-value ${deltaCls(donorDelta)}`}>
              {deltaStr(donorDelta)}
            </span>
          </div>
          <div className="report-delta">
            <span className="report-delta-label">Morale</span>
            <span className={`report-delta-value ${deltaCls(moraleDelta)}`}>
              {deltaStr(moraleDelta)}
            </span>
          </div>
          <div className="report-delta">
            <span className="report-delta-label">Tech Quality</span>
            <span className={`report-delta-value ${deltaCls(qualityDelta)}`}>
              {deltaStr(qualityDelta)}
            </span>
          </div>
        </div>
      </div>

      {summary.financialRiskFlags.length > 0 && (
        <div className="summary-block">
          <span className="eyebrow summary-block-title">Financial Risk</span>
          <ul className="notes-list">
            {summary.financialRiskFlags.map((flag, i) => (
              <li key={i} className="berry">{flag}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="summary-block summary-narrative">
        <span className="eyebrow summary-block-title">Identity That Emerged</span>
        <ul>
          {summary.identityNarrative.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </div>

      <div className="summary-foot">
        <button type="button" className="cta-aurora" onClick={onNewSeason}>
          Begin Next Season
        </button>
      </div>
    </div>
  )
}
