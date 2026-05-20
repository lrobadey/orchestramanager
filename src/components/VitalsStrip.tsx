import type { InstitutionState, InstitutionalDeltas } from '../types/core'

interface VitalsStripProps {
  institution: InstitutionState
  deltas?: InstitutionalDeltas
}

function fmtCash(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1000)}K`
  return `$${n}`
}

interface VitalProps {
  label: string
  value: string | number
  pct?: number
  delta?: number
  deltaIsCash?: boolean
  noBar?: boolean
}

function Vital({ label, value, pct, delta, deltaIsCash, noBar }: VitalProps) {
  const deltaDisplay =
    delta == null || delta === 0
      ? null
      : deltaIsCash
        ? `${delta >= 0 ? '+' : ''}${fmtCash(delta)}`
        : `${delta >= 0 ? '+' : ''}${delta}`
  const deltaClass = delta == null || delta === 0 ? '' : delta > 0 ? 'up' : 'down'

  return (
    <div className="vital">
      <span className="vital-label">{label}</span>
      <div className="vital-row">
        <span className="vital-value">{value}</span>
        {deltaDisplay && <span className={`vital-delta ${deltaClass}`}>{deltaDisplay}</span>}
      </div>
      {!noBar && pct != null && (
        <div className="vital-bar">
          <i style={{ ['--pct' as string]: `${Math.max(0, Math.min(100, pct))}%` }} />
        </div>
      )}
    </div>
  )
}

export default function VitalsStrip({ institution, deltas }: VitalsStripProps) {
  const id = institution.identity
  const dominant = ['adventurous', 'communityFocused', 'scholarly'].reduce<keyof typeof id>(
    (acc, k) => (id[k as keyof typeof id] > id[acc] ? (k as keyof typeof id) : acc),
    'adventurous',
  )

  return (
    <div className="vitals-strip">
      <div className="vitals-strip-inner">
        <div className="vitals-row">
          <Vital
            label="Cash"
            value={fmtCash(institution.cash)}
            delta={deltas?.cash}
            deltaIsCash
            noBar
          />
          <Vital
            label="Reputation"
            value={institution.artisticReputation}
            pct={institution.artisticReputation}
            delta={deltas?.artisticReputation}
          />
          <Vital
            label="Trust"
            value={institution.audienceTrust}
            pct={institution.audienceTrust}
            delta={deltas?.audienceTrust}
          />
          <Vital
            label="Donors"
            value={institution.donorConfidence}
            pct={institution.donorConfidence}
            delta={deltas?.donorConfidence}
          />
          <Vital
            label="Morale"
            value={institution.musicianMorale}
            pct={institution.musicianMorale}
            delta={deltas?.musicianMorale}
          />
          <Vital
            label="Tech"
            value={institution.technicalQuality}
            pct={institution.technicalQuality}
            delta={deltas?.technicalQuality}
          />
        </div>
        <div className="vitals-identity">
          <span className="vitals-identity-label">Identity</span>
          <span className={`vitals-identity-item ${dominant === 'adventurous' ? 'dominant' : ''}`}>
            Adventurous <strong>{id.adventurous}</strong>
          </span>
          <span className={`vitals-identity-item ${dominant === 'communityFocused' ? 'dominant' : ''}`}>
            Community <strong>{id.communityFocused}</strong>
          </span>
          <span className={`vitals-identity-item ${dominant === 'scholarly' ? 'dominant' : ''}`}>
            Scholarly <strong>{id.scholarly}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
