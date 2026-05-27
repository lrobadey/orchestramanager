import { useState } from 'react'
import type { InstitutionState, InstitutionalDeltas } from '../../types/core'

interface UnderstoryVitalsProps {
  institution: InstitutionState
  deltas?: InstitutionalDeltas
  variant?: 'bar' | 'rail'
}

function fmtCash(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1000).toFixed(1)}K`
  return `$${n}`
}

function fmtDelta(n?: number, isCash?: boolean): { text: string; tone: 'pine' | 'ember' | 'muted' } {
  if (n == null || n === 0) return { text: '—', tone: 'muted' }
  const sign = n > 0 ? '+' : ''
  const text = isCash ? `${sign}${fmtCash(n)} wk` : `${sign}${n}`
  return { text, tone: n > 0 ? 'pine' : 'ember' }
}

interface VitalCellProps {
  label: string
  value: string | number
  delta?: number
  isCash?: boolean
  pct?: number
  pctTone?: 'silver' | 'pine' | 'ember'
  cashClass?: boolean
}

function VitalCell({ label, value, delta, isCash, pct, pctTone, cashClass }: VitalCellProps) {
  const d = fmtDelta(delta, isCash)
  return (
    <div className={`understory-vital${cashClass ? ' cash' : ''}`}>
      <div className="v-label">{label}</div>
      <div className="v-big hc-display">{value}</div>
      <div className={`v-sub ${d.tone}`}>{d.text}</div>
      {pct != null && (
        <div className="v-bar">
          <i
            className={pctTone === 'pine' ? 'pine' : pctTone === 'ember' ? 'ember' : ''}
            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default function UnderstoryVitals({ institution, deltas, variant = 'bar' }: UnderstoryVitalsProps) {
  const [collapsed, setCollapsed] = useState(true)
  const id = institution.identity
  const dominantKey = (['adventurous', 'communityFocused', 'scholarly'] as const).reduce(
    (acc, k) => (id[k] > id[acc] ? k : acc),
    'adventurous' as const,
  )
  const dominantLabel =
    dominantKey === 'adventurous'
      ? 'adventurous'
      : dominantKey === 'communityFocused'
        ? 'community-focused'
        : 'scholarly'
  const undeclared = id.adventurous === 0 && id.communityFocused === 0 && id.scholarly === 0
  const identitySentence = undeclared ? (
    <>An identity has not yet emerged — early concerts still set the tone.</>
  ) : (
    <>
      Leaning <span className="accent">{dominantLabel}</span> — the dominant reading after the
      season so far.
    </>
  )

  const compactVitals = [
    { label: 'Cash', value: fmtCash(institution.cash) },
    { label: 'Rep', value: institution.artisticReputation },
    { label: 'Morale', value: institution.musicianMorale },
    { label: 'Trust', value: institution.audienceTrust },
    { label: 'Donors', value: institution.donorConfidence },
  ]

  if (variant === 'rail') {
    return (
      <aside className={`home-stratum understory understory-rail${collapsed ? ' collapsed' : ''}`} aria-label="Institutional state of play">
        {collapsed ? (
          <button
            className="understory-rail-collapsed-button"
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand institutional state of play"
            aria-expanded="false"
          >
            <span className="understory-rail-collapsed-title">State</span>
            <span className="understory-rail-collapsed-mark">⌄</span>
          </button>
        ) : (
          <div className="understory-rail-panel">
            <div className="understory-rail-head">
              <span className="hc-eyebrow">Institutional state of play</span>
              <button
                className="understory-collapse-toggle"
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse institutional state of play"
                aria-expanded="true"
              >
                ⌃
              </button>
            </div>

            <div className="understory-rail-vitals">
              <VitalCell label="Cash" value={fmtCash(institution.cash)} delta={deltas?.cash} isCash cashClass />
              <VitalCell
                label="Reputation"
                value={institution.artisticReputation}
                delta={deltas?.artisticReputation}
                pct={institution.artisticReputation}
              />
              <VitalCell
                label="Morale"
                value={institution.musicianMorale}
                delta={deltas?.musicianMorale}
                pct={institution.musicianMorale}
                pctTone="pine"
              />
              <VitalCell
                label="Trust"
                value={institution.audienceTrust}
                delta={deltas?.audienceTrust}
                pct={institution.audienceTrust}
              />
              <VitalCell
                label="Donors"
                value={institution.donorConfidence}
                delta={deltas?.donorConfidence}
                pct={institution.donorConfidence}
                pctTone={(deltas?.donorConfidence ?? 0) < 0 ? 'ember' : undefined}
              />
            </div>

            <div className="understory-rail-identity">
              <div className="hc-eyebrow">Identity</div>
              <div className="understory-identity-sentence">{identitySentence}</div>
              <div className="understory-identity-rows">
                <IdentityRow label="Adventure" value={id.adventurous} tone="silver" />
                <IdentityRow label="Community" value={id.communityFocused} tone="bark" />
                <IdentityRow label="Scholarly" value={id.scholarly} tone="pine" />
              </div>
            </div>
          </div>
        )}
      </aside>
    )
  }

  return (
    <div className={`home-stratum understory${collapsed ? ' collapsed' : ''}`}>
      <div className="hc-rule-brown" style={{ marginBottom: collapsed ? 8 : 12 }} />
      {collapsed ? (
        <div className="understory-compact-strip">
          <span className="hc-eyebrow understory-compact-title">Institutional state of play</span>
          <div className="understory-compact-vitals">
            {compactVitals.map((vital) => (
              <div className="understory-compact-item" key={vital.label}>
                <span className="understory-compact-label">{vital.label}</span>
                <span className="understory-compact-value">{vital.value}</span>
              </div>
            ))}
            <div className="understory-compact-identity">
              <span>Identity:</span> {undeclared ? 'undeclared' : dominantLabel}
            </div>
          </div>
          <button
            className="understory-collapse-toggle"
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand institutional state of play"
            aria-expanded="false"
          >
            ⌄
          </button>
        </div>
      ) : (
      <div className="understory-grid">
        <div>
          <div className="understory-vitals-head">
            <span className="hc-eyebrow">Institutional state of play</span>
            <div className="understory-head-actions">
              <span className="hc-eyebrow" style={{ color: 'var(--bark)' }}>read left to right</span>
              <button
                className="understory-collapse-toggle"
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse institutional state of play"
                aria-expanded="true"
              >
                ⌃
              </button>
            </div>
          </div>
          <div className="understory-vitals">
            <VitalCell label="Cash" value={fmtCash(institution.cash)} delta={deltas?.cash} isCash cashClass />
            <VitalCell
              label="Reputation"
              value={institution.artisticReputation}
              delta={deltas?.artisticReputation}
              pct={institution.artisticReputation}
            />
            <VitalCell
              label="Audience Trust"
              value={institution.audienceTrust}
              delta={deltas?.audienceTrust}
              pct={institution.audienceTrust}
            />
            <VitalCell
              label="Donor Confidence"
              value={institution.donorConfidence}
              delta={deltas?.donorConfidence}
              pct={institution.donorConfidence}
              pctTone={(deltas?.donorConfidence ?? 0) < 0 ? 'ember' : undefined}
            />
            <VitalCell
              label="Musician Morale"
              value={institution.musicianMorale}
              delta={deltas?.musicianMorale}
              pct={institution.musicianMorale}
              pctTone="pine"
            />
            <VitalCell
              label="Technical"
              value={institution.technicalQuality}
              delta={deltas?.technicalQuality}
              pct={institution.technicalQuality}
            />
          </div>
        </div>
        <div className="understory-identity">
          <div className="hc-eyebrow" style={{ marginBottom: 6 }}>Identity emerging</div>
          <div className="understory-identity-sentence">{identitySentence}</div>
          <div className="understory-identity-rows">
            <IdentityRow label="Adventurous" value={id.adventurous} tone="silver" />
            <IdentityRow label="Community" value={id.communityFocused} tone="bark" />
            <IdentityRow label="Scholarly" value={id.scholarly} tone="pine" />
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

function IdentityRow({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'silver' | 'bark' | 'pine'
}) {
  return (
    <div className="understory-identity-row">
      <span className="k">{label}</span>
      <div className="bar">
        <i className={tone} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className="v">{value}</span>
    </div>
  )
}
