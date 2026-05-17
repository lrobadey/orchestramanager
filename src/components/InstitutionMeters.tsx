import { InstitutionState, InstitutionalDeltas } from '../types/core'

interface InstitutionMetersProps {
  institution: InstitutionState
  deltas?: InstitutionalDeltas
}

function fmtCash(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}

function deltaLabel(d: number | undefined): string {
  if (d === undefined || d === 0) return ''
  return d > 0 ? `↑${d}` : `↓${Math.abs(d)}`
}

function deltaClass(d: number | undefined): string {
  if (!d) return ''
  return d > 0 ? 'delta-positive' : 'delta-negative'
}

function directorQuote(identity: InstitutionState['identity']): string {
  const max = Math.max(identity.adventurous, identity.communityFocused, identity.scholarly)
  if (max <= 5) return 'We are building something timeless. Take bold, intelligent risks.'
  if (identity.adventurous === max) return 'The work that matters is rarely the work that\'s asked for.'
  if (identity.communityFocused === max) return 'Music belongs to the city before it belongs to the stage.'
  return 'Every program is an argument. Make ours rigorous.'
}

interface HealthRowProps {
  label: string
  value: number
  delta?: number
  glyph?: string
}

function HealthRow({ label, value, delta, glyph }: HealthRowProps) {
  const dl = deltaLabel(delta)
  return (
    <div className="health-meter-row">
      {glyph && <span className="health-meter-icon">{glyph}</span>}
      <span className="health-meter-label">{label}</span>
      <span className="health-meter-value">{value}</span>
      {dl && <span className={`health-meter-delta ${deltaClass(delta)}`}>{dl}</span>}
    </div>
  )
}

interface IdentityRowProps {
  label: string
  value: number
  delta?: number
}

function IdentityRow({ label, value, delta }: IdentityRowProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="identity-meter-row">
      <span className="identity-meter-label">{label}</span>
      <div className="identity-meter-track">
        <div className="identity-meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="identity-meter-value">
        {value}
        {delta && delta !== 0 ? (delta > 0 ? `↑` : `↓`) : ''}
      </span>
    </div>
  )
}

export default function InstitutionMeters({ institution, deltas }: InstitutionMetersProps) {
  const { identity } = institution

  return (
    <>
      <div className="brand-block">
        <div className="brand-crest">✦</div>
        <div className="brand-name">ORCHESTRA<br />MANAGER</div>
        <div className="brand-tagline">Artistry. Strategy. Legacy.</div>
      </div>

      <div className="institution-block">
        <div className="sidebar-section-label">Institution</div>
        <div className="institution-name">LUMINOSA<br />SYMPHONY</div>
        <div className="institution-season">SEASON 2030–31</div>
      </div>

      <div>
        <div className="sidebar-section-label">Institution Health</div>
        <div className="health-cash-row">
          <span className="health-cash-label">Cash</span>
          <span className="health-cash-value">{fmtCash(institution.cash)}</span>
        </div>
        <HealthRow label="Artistic Reputation" value={institution.artisticReputation} delta={deltas?.artisticReputation} glyph="♛" />
        <HealthRow label="Financial Stability" value={Math.round(Math.min(100, institution.cash / 3000))} glyph="◈" />
        <HealthRow label="Audience Trust" value={institution.audienceTrust} delta={deltas?.audienceTrust} glyph="◉" />
        <HealthRow label="Donor Confidence" value={institution.donorConfidence} delta={deltas?.donorConfidence} glyph="✦" />
        <HealthRow label="Musician Morale" value={institution.musicianMorale} delta={deltas?.musicianMorale} glyph="♪" />
        <HealthRow label="Technical Quality" value={institution.technicalQuality} delta={deltas?.technicalQuality} glyph="✧" />
      </div>

      <div className="director-block">
        <div className="director-row">
          <div className="director-avatar" />
          <div className="director-meta">
            <div className="director-label">Artistic Director</div>
            <div className="director-name">Evelyn Park</div>
          </div>
        </div>
        <div className="director-quote">{directorQuote(identity)}</div>
      </div>

      <div>
        <div className="sidebar-section-label">Identity</div>
        <div className="identity-meter-block">
          <IdentityRow label="Adventurous" value={identity.adventurous} delta={deltas?.identity?.adventurous} />
          <IdentityRow label="Community" value={identity.communityFocused} delta={deltas?.identity?.communityFocused} />
          <IdentityRow label="Scholarly" value={identity.scholarly} delta={deltas?.identity?.scholarly} />
        </div>
      </div>
    </>
  )
}
