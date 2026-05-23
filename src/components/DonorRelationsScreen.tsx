import { useMemo, useState } from 'react'
import type { Donor, DonorPreferences, InstitutionState, SeasonState } from '../types/core'
import CanopyHeader from './home/CanopyHeader'
import UnderstoryVitals from './home/UnderstoryVitals'
import '../styles/home.css'

interface DonorRelationsScreenProps {
  season: SeasonState
  institution: InstitutionState
  onNavigate: (key: 'home' | 'roster' | 'programme' | 'library' | 'ledger' | 'donors') => void
}

const TASTE_LABELS: Array<{ key: keyof DonorPreferences; label: string }> = [
  { key: 'canon', label: 'Canon' },
  { key: 'romanticModernist', label: '19th/20th c.' },
  { key: 'contemporary', label: 'Contemporary' },
  { key: 'communityAccess', label: 'Access' },
  { key: 'institutionalStability', label: 'Stability' },
  { key: 'criticalPrestige', label: 'Prestige' },
  { key: 'audienceReach', label: 'Reach' },
]

export default function DonorRelationsScreen({
  season,
  institution,
  onNavigate,
}: DonorRelationsScreenProps) {
  const [activeId, setActiveId] = useState(season.donors.donors[0]?.id ?? '')
  const activeDonor = season.donors.donors.find(donor => donor.id === activeId) ?? season.donors.donors[0]
  const averageRelationship = Math.round(
    season.donors.donors.reduce((sum, donor) => sum + donor.relationship, 0) /
      Math.max(1, season.donors.donors.length),
  )
  const totalCapacity = season.donors.donors.reduce((sum, donor) => sum + donor.capacity, 0)
  const highestRisk = useMemo(
    () => [...season.donors.donors].sort((a, b) => a.relationship - b.relationship)[0],
    [season.donors.donors],
  )

  return (
    <div className="home-console">
      <div className="home-strata">
        <CanopyHeader
          institution={institution}
          season={season}
          activeNav="donors"
          onNavigate={onNavigate}
        />
        <UnderstoryVitals institution={institution} />
        <div className="home-stratum floor console-screen-floor">
          <section className="donor-page">
            <section className="donor-canopy">
              <div>
                <span className="hc-eyebrow">Advancement office</span>
                <h2 className="donor-title hc-display">Cultivation map.</h2>
                <p className="donor-copy hc-serif">
                  Five major funders now sit around the season with different tastes, anxieties,
                  and definitions of success. Their money is not one voice — it is a coalition.
                </p>
              </div>
              <div className="donor-summary-grid">
                <SummaryTile label="Relationship avg" value={`${averageRelationship}`} suffix="/100" />
                <SummaryTile label="Annual capacity" value={money(totalCapacity)} />
                <SummaryTile label="Most at risk" value={highestRisk?.name ?? '—'} compact />
              </div>
            </section>

            <section className="donor-floor">
              <div className="donor-list" aria-label="Major donor list">
                {season.donors.donors.map(donor => (
                  <button
                    key={donor.id}
                    type="button"
                    className={`donor-card ${donor.id === activeDonor.id ? 'active' : ''}`}
                    onClick={() => setActiveId(donor.id)}
                  >
                    <div className="donor-card-head">
                      <div>
                        <div className="donor-name">{donor.name}</div>
                        <div className="donor-archetype">{donor.archetype}</div>
                      </div>
                      <div className={`donor-score ${toneClass(donor.relationship)}`}>
                        {donor.relationship}
                      </div>
                    </div>
                    <RelationshipBar value={donor.relationship} />
                    <div className="donor-card-tags">
                      {topTastes(donor).map(taste => <span key={taste}>{taste}</span>)}
                    </div>
                  </button>
                ))}
              </div>

              <article className="donor-profile">
                <div className="donor-profile-head">
                  <div>
                    <span className="hc-eyebrow">Selected relationship</span>
                    <h3 className="donor-profile-name hc-display">{activeDonor.name}</h3>
                    <p className="donor-profile-desc hc-serif">{activeDonor.description}</p>
                  </div>
                  <div className="donor-profile-score-block">
                    <span className="hc-label">Relationship</span>
                    <strong className={toneClass(activeDonor.relationship)}>{activeDonor.relationship}</strong>
                    <RelationshipBar value={activeDonor.relationship} />
                  </div>
                </div>

                <div className="donor-profile-grid">
                  <section className="donor-taste-panel">
                    <div className="donor-panel-head">
                      <span className="hc-label">Taste chart</span>
                      <span className="donor-restriction">{restrictionLabel(activeDonor)}</span>
                    </div>
                    <div className="donor-taste-bars">
                      {TASTE_LABELS.map(({ key, label }) => (
                        <TasteBar key={key} label={label} value={activeDonor.preferences[key]} />
                      ))}
                    </div>
                  </section>

                  <section className="donor-radar-panel" aria-label="Donor preference radar chart">
                    <span className="hc-label">Taste radar</span>
                    <DonorRadarChart donor={activeDonor} />
                  </section>
                </div>

                <div className="donor-note-row">
                  <div>
                    <span className="hc-label">Recent read</span>
                    <p>{activeDonor.recentReaction}</p>
                  </div>
                  <div>
                    <span className="hc-label">Cultivation idea</span>
                    <p>{cultivationIdea(activeDonor)}</p>
                  </div>
                </div>
              </article>
            </section>
          </section>
        </div>
      </div>
    </div>
  )
}

function SummaryTile({ label, value, suffix = '', compact = false }: { label: string; value: string; suffix?: string; compact?: boolean }) {
  return (
    <div className={`donor-summary-tile ${compact ? 'compact' : ''}`}>
      <span className="hc-label">{label}</span>
      <strong>{value}<small>{suffix}</small></strong>
    </div>
  )
}

function RelationshipBar({ value }: { value: number }) {
  return <div className="donor-relationship-track"><i className={toneClass(value)} style={{ width: `${value}%` }} /></div>
}

function TasteBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="donor-taste-row">
      <div className="donor-taste-row-head">
        <span>{label}</span>
        <em>{preferenceGlyph(value)}</em>
      </div>
      <div className="donor-taste-track"><i style={{ width: `${value}%` }} /></div>
    </div>
  )
}

function topTastes(donor: Donor): string[] {
  return TASTE_LABELS
    .map(({ key, label }) => ({ label, value: donor.preferences[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map(taste => taste.label)
}

function toneClass(value: number): string {
  if (value >= 75) return 'donor-tone-pine'
  if (value >= 55) return 'donor-tone-silver'
  if (value >= 35) return 'donor-tone-bark'
  return 'donor-tone-ember'
}

function preferenceGlyph(value: number): string {
  if (value >= 85) return '+++'
  if (value >= 65) return '++'
  if (value >= 45) return '+'
  if (value >= 25) return '·'
  return '−'
}

function restrictionLabel(donor: Donor): string {
  return `${donor.restrictionStyle.replace('-', ' ')} gifts · capacity ${money(donor.capacity)}`
}

function cultivationIdea(donor: Donor): string {
  if (donor.restrictionStyle === 'new-music') return 'Invite them into a rehearsal room before the boldest contemporary program.'
  if (donor.restrictionStyle === 'education') return 'Frame the next ask around student access, pricing, and first-time listeners.'
  if (donor.id === 'eleanor-voss') return 'A quiet dinner about stewardship, continuity, and the canon would land best.'
  if (donor.id === 'victor-saye') return 'Bring attendance, cash, and press optics; he responds to momentum.'
  return 'Offer an artist-led salon around Romantic and early modern repertoire.'
}

function DonorRadarChart({ donor }: { donor: Donor }) {
  const center = 150
  const maxRadius = 104
  const axes = TASTE_LABELS.map(({ key, label }, index) => {
    const angle = (Math.PI * 2 * index) / TASTE_LABELS.length - Math.PI / 2
    const value = donor.preferences[key]
    return {
      key,
      label,
      value,
      x: center + Math.cos(angle) * maxRadius,
      y: center + Math.sin(angle) * maxRadius,
      dataX: center + Math.cos(angle) * maxRadius * (value / 100),
      dataY: center + Math.sin(angle) * maxRadius * (value / 100),
      labelX: center + Math.cos(angle) * (maxRadius + 26),
      labelY: center + Math.sin(angle) * (maxRadius + 26),
    }
  })
  const polygonPoints = axes.map(axis => `${axis.dataX},${axis.dataY}`).join(' ')
  const rings = [25, 50, 75, 100].map(percent =>
    axes
      .map(axis => {
        const dx = axis.x - center
        const dy = axis.y - center
        return `${center + dx * (percent / 100)},${center + dy * (percent / 100)}`
      })
      .join(' '),
  )

  return (
    <div className="donor-radar-wrap">
      <svg className="donor-radar-svg" viewBox="0 0 300 300" role="img">
        <title>{donor.name} taste radar</title>
        {rings.map((points, index) => (
          <polygon key={index} className="donor-radar-ring" points={points} />
        ))}
        {axes.map(axis => (
          <line
            key={`${axis.key}-axis`}
            className="donor-radar-axis"
            x1={center}
            y1={center}
            x2={axis.x}
            y2={axis.y}
          />
        ))}
        <polygon className="donor-radar-shape" points={polygonPoints} />
        {axes.map(axis => (
          <circle
            key={`${axis.key}-point`}
            className="donor-radar-dot"
            cx={axis.dataX}
            cy={axis.dataY}
            r="3.5"
          />
        ))}
        {axes.map(axis => (
          <text
            key={`${axis.key}-label`}
            className="donor-radar-label"
            x={axis.labelX}
            y={axis.labelY}
            textAnchor={axis.labelX < center - 8 ? 'end' : axis.labelX > center + 8 ? 'start' : 'middle'}
            dominantBaseline="middle"
          >
            {axis.label}
          </text>
        ))}
      </svg>
      <div className="donor-radar-caption">
        <span>Center = indifferent</span>
        <span>Edge = defining priority</span>
      </div>
    </div>
  )
}

function money(value: number): string {
  return `$${Math.round(value / 1000)}K`
}
