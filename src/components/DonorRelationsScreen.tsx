import { useMemo, useState } from 'react'
import type {
  Donor,
  DonorInstitutionalPriorities,
  DonorMusicTaste,
  InstitutionState,
  SeasonState,
} from '../types/core'
import CanopyHeader from './home/CanopyHeader'
import UnderstoryVitals from './home/UnderstoryVitals'
import '../styles/home.css'

interface DonorRelationsScreenProps {
  season: SeasonState
  institution: InstitutionState
  onNavigate: (key: 'home' | 'roster' | 'programme' | 'library' | 'ledger' | 'donors' | 'audience') => void
}

type RadarAxis<T> = { key: keyof T; label: string }

const MUSIC_AXES: Array<RadarAxis<DonorMusicTaste>> = [
  { key: 'classicalCanon', label: 'Canon' },
  { key: 'romantic', label: 'Romantic' },
  { key: 'modernist', label: 'Modernist' },
  { key: 'contemporary', label: 'Contemporary' },
  { key: 'experimental', label: 'Experimental' },
  { key: 'accessible', label: 'Accessible' },
]

const PRIORITY_AXES: Array<RadarAxis<DonorInstitutionalPriorities>> = [
  { key: 'prestige', label: 'Prestige' },
  { key: 'stability', label: 'Stability' },
  { key: 'access', label: 'Access' },
  { key: 'reach', label: 'Reach' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'innovation', label: 'Innovation' },
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
        <CanopyHeader institution={institution} season={season} activeNav="donors" onNavigate={onNavigate} compact />
        <UnderstoryVitals institution={institution} />
        <div className="home-stratum floor console-screen-floor donor-screen-floor">
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
                      <div className="donor-card-metrics">
                        <div className={`donor-score ${toneClass(donor.relationship)}`}>{donor.relationship}</div>
                        <LastDeltaBadge delta={donor.lastDelta} compact />
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
                    <LastDeltaBadge delta={activeDonor.lastDelta} />
                  </div>
                </div>

                <div className="donor-influence-panel">
                  <div>
                    <span className="hc-label">Influence model</span>
                    <p>
                      Music taste drives {activeDonor.influenceWeights.music}% of this donor's read;
                      institutional priorities drive {activeDonor.influenceWeights.institutional}%.
                    </p>
                  </div>
                  <div className="donor-influence-track">
                    <i style={{ width: `${activeDonor.influenceWeights.music}%` }} />
                    <span>Music {activeDonor.influenceWeights.music}%</span>
                    <em>Institution {activeDonor.influenceWeights.institutional}%</em>
                  </div>
                </div>

                <div className="donor-radar-grid">
                  <section className="donor-radar-panel" aria-label="Donor music taste radar chart">
                    <div className="donor-panel-head">
                      <span className="hc-label">Music taste</span>
                      <span className="donor-restriction">{restrictionLabel(activeDonor)}</span>
                    </div>
                    <DonorRadarChart
                      title={`${activeDonor.name} music taste`}
                      axes={MUSIC_AXES}
                      values={activeDonor.musicTaste}
                    />
                  </section>

                  <section className="donor-radar-panel" aria-label="Donor institutional priority radar chart">
                    <div className="donor-panel-head">
                      <span className="hc-label">Institutional priorities</span>
                      <span className="donor-restriction">weight {activeDonor.influenceWeights.institutional}%</span>
                    </div>
                    <DonorRadarChart
                      title={`${activeDonor.name} institutional priorities`}
                      axes={PRIORITY_AXES}
                      values={activeDonor.institutionalPriorities}
                    />
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

function LastDeltaBadge({ delta, compact = false }: { delta: number; compact?: boolean }) {
  const normalized = Object.is(delta, -0) ? 0 : delta
  const direction = normalized > 0 ? 'up' : normalized < 0 ? 'down' : 'flat'
  const label = normalized > 0 ? `+${normalized}` : `${normalized}`
  const ariaLabel = normalized > 0
    ? `Relationship warmed by ${normalized}`
    : normalized < 0
      ? `Relationship cooled by ${Math.abs(normalized)}`
      : 'No relationship movement yet'

  return (
    <div className={`donor-delta-badge ${direction} ${compact ? 'compact' : ''}`} aria-label={ariaLabel}>
      <span className="donor-delta-spark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="donor-delta-copy">
        <em>{direction === 'up' ? '↗' : direction === 'down' ? '↘' : '→'}</em>
        <strong>{label}</strong>
        {!compact && <small>{direction === 'flat' ? 'Last concert' : 'Last move'}</small>}
      </span>
    </div>
  )
}

function topTastes(donor: Donor): string[] {
  return MUSIC_AXES
    .map(({ key, label }) => ({ label, value: donor.musicTaste[key] }))
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

function DonorRadarChart<T extends object>({
  title,
  axes,
  values,
}: {
  title: string
  axes: Array<RadarAxis<T>>
  values: T
}) {
  const center = 150
  const maxRadius = 96
  const plotted = axes.map(({ key, label }, index) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2
    const value = Number(values[key])
    return {
      key: String(key),
      label,
      value,
      x: center + Math.cos(angle) * maxRadius,
      y: center + Math.sin(angle) * maxRadius,
      dataX: center + Math.cos(angle) * maxRadius * (value / 100),
      dataY: center + Math.sin(angle) * maxRadius * (value / 100),
      labelX: center + Math.cos(angle) * (maxRadius + 30),
      labelY: center + Math.sin(angle) * (maxRadius + 30),
    }
  })
  const polygonPoints = plotted.map(axis => `${axis.dataX},${axis.dataY}`).join(' ')
  const rings = [25, 50, 75, 100].map(percent =>
    plotted
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
        <title>{title}</title>
        {rings.map((points, index) => <polygon key={index} className="donor-radar-ring" points={points} />)}
        {plotted.map(axis => (
          <line key={`${axis.key}-axis`} className="donor-radar-axis" x1={center} y1={center} x2={axis.x} y2={axis.y} />
        ))}
        <polygon className="donor-radar-shape" points={polygonPoints} />
        {plotted.map(axis => <circle key={`${axis.key}-point`} className="donor-radar-dot" cx={axis.dataX} cy={axis.dataY} r="3.5" />)}
        {plotted.map(axis => (
          <g key={`${axis.key}-label`}>
            <text
              className="donor-radar-label"
              x={axis.labelX}
              y={axis.labelY - 5}
              textAnchor={axis.labelX < center - 8 ? 'end' : axis.labelX > center + 8 ? 'start' : 'middle'}
              dominantBaseline="middle"
            >
              {axis.label}
            </text>
            <text
              className="donor-radar-glyph"
              x={axis.labelX}
              y={axis.labelY + 8}
              textAnchor={axis.labelX < center - 8 ? 'end' : axis.labelX > center + 8 ? 'start' : 'middle'}
              dominantBaseline="middle"
            >
              {preferenceGlyph(axis.value)}
            </text>
          </g>
        ))}
      </svg>
      <div className="donor-radar-caption">
        <span>− low</span>
        <span>+++ defining priority</span>
      </div>
    </div>
  )
}

function money(value: number): string {
  return `$${Math.round(value / 1000)}K`
}
