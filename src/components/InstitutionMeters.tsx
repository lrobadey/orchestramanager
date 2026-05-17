import { InstitutionState, InstitutionalDeltas } from '../types/core'

interface InstitutionMetersProps {
  institution: InstitutionState
  deltas?: InstitutionalDeltas
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function deltaLabel(d: number | undefined): string | null {
  if (d === undefined || d === 0) return null
  return d > 0 ? `+${d}` : `${d}`
}

function deltaClass(d: number | undefined): string {
  if (!d) return ''
  return d > 0 ? 'delta-positive' : 'delta-negative'
}

interface MeterRowProps {
  label: string
  value: number
  max?: number
  delta?: number
  deltaDisplay?: string
  asBar?: boolean
  cashMode?: boolean
}

function MeterRow({ label, value, delta, deltaDisplay, asBar = true, cashMode = false }: MeterRowProps) {
  const pct = cashMode ? 0 : Math.round(Math.min(100, Math.max(0, value)))
  const dl = deltaDisplay ?? deltaLabel(delta)

  return (
    <div className="meter-row">
      <span className="meter-label">{label}</span>
      {asBar && !cashMode && (
        <div className="meter-track">
          <div className="meter-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
      <span className="meter-value" style={cashMode ? { width: 'auto', flex: 1 } : undefined}>
        {cashMode ? fmt(value) : value}
      </span>
      {dl && <span className={`meter-delta ${deltaClass(delta)}`}>{dl}</span>}
    </div>
  )
}

export default function InstitutionMeters({ institution, deltas }: InstitutionMetersProps) {
  const { identity } = institution

  return (
    <div className="meters-panel">
      <h2>Institution</h2>

      <div className="meters-section">
        <MeterRow
          label="Cash"
          value={institution.cash}
          delta={deltas?.cash}
          deltaDisplay={deltas?.cash != null ? `${deltas.cash >= 0 ? '+' : ''}${fmt(deltas.cash)}` : undefined}
          asBar={false}
          cashMode
        />
      </div>

      <div className="meters-section">
        <h3>Resources</h3>
        <MeterRow label="Reputation" value={institution.artisticReputation} delta={deltas?.artisticReputation} />
        <MeterRow label="Audience Trust" value={institution.audienceTrust} delta={deltas?.audienceTrust} />
        <MeterRow label="Donor Confidence" value={institution.donorConfidence} delta={deltas?.donorConfidence} />
        <MeterRow label="Morale" value={institution.musicianMorale} delta={deltas?.musicianMorale} />
        <MeterRow label="Tech Quality" value={institution.technicalQuality} delta={deltas?.technicalQuality} />
      </div>

      <div className="meters-section">
        <h3>Identity</h3>
        <MeterRow label="Adventurous" value={identity.adventurous} delta={deltas?.identity?.adventurous} />
        <MeterRow label="Community" value={identity.communityFocused} delta={deltas?.identity?.communityFocused} />
        <MeterRow label="Scholarly" value={identity.scholarly} delta={deltas?.identity?.scholarly} />
      </div>
    </div>
  )
}
