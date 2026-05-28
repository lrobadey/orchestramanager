import { useMemo, useState } from 'react'
import { cityAudienceSegments } from '../data/audienceSegments'
import type { AudienceRelationship, CityAudienceSegment, InstitutionState, SeasonState } from '../types/core'
import CanopyHeader from './home/CanopyHeader'
import UnderstoryVitals from './home/UnderstoryVitals'
import '../styles/home.css'

interface AudienceRelationsScreenProps {
  season: SeasonState
  institution: InstitutionState
  onNavigate: (key: 'home' | 'roster' | 'programme' | 'library' | 'ledger' | 'donors' | 'audience') => void
}

type AudienceProfile = CityAudienceSegment & AudienceRelationship

type RadarValues = {
  canonAffinity: number
  noveltyAffinity: number
  prestigeAffinity: number
  communityAffinity: number
  orchestralLiteracy: number
  socialSpread: number
}

type RadarAxis<T> = { key: keyof T; label: string }

const AUDIENCE_AXES: Array<RadarAxis<RadarValues>> = [
  { key: 'canonAffinity', label: 'Canon' },
  { key: 'noveltyAffinity', label: 'Novelty' },
  { key: 'prestigeAffinity', label: 'Prestige' },
  { key: 'communityAffinity', label: 'Community' },
  { key: 'orchestralLiteracy', label: 'Literacy' },
  { key: 'socialSpread', label: 'Spread' },
]

export default function AudienceRelationsScreen({
  season,
  institution,
  onNavigate,
}: AudienceRelationsScreenProps) {
  const profiles = useMemo(() => joinAudienceProfiles(season), [season])
  const [activeId, setActiveId] = useState(profiles[0]?.id ?? '')
  const activeAudience = profiles.find(segment => segment.id === activeId) ?? profiles[0]
  const averageTrust = Math.round(profiles.reduce((sum, segment) => sum + segment.trust, 0) / Math.max(1, profiles.length))
  const averageHabit = Math.round(profiles.reduce((sum, segment) => sum + segment.habit, 0) / Math.max(1, profiles.length))
  const totalReachable = profiles.reduce((sum, segment) => sum + segment.size, 0)
  const mostPriceSensitive = useMemo(
    () => [...profiles].sort((a, b) => b.priceSensitivity - a.priceSensitivity)[0],
    [profiles],
  )

  return (
    <div className="home-console">
      <div className="home-strata">
        <CanopyHeader institution={institution} season={season} activeNav="audience" onNavigate={onNavigate} compact />
        <UnderstoryVitals institution={institution} />
        <div className="home-stratum floor console-screen-floor donor-screen-floor">
          <section className="donor-page audience-page">
            <section className="donor-canopy">
              <div>
                <span className="hc-eyebrow">Public formation</span>
                <h2 className="donor-title hc-display">Audience map.</h2>
                <p className="donor-copy hc-serif">
                  The city is not one public. Each audience forms habit, trust, and appetite at a different pace —
                  a living ecology shaped by price, welcome, repertoire, and repeated experience.
                </p>
              </div>
              <div className="donor-summary-grid">
                <SummaryTile label="Trust avg" value={`${averageTrust}`} suffix="/100" />
                <SummaryTile label="Habit avg" value={`${averageHabit}`} suffix="/100" />
                <SummaryTile label="Reachable public" value={compactNumber(totalReachable)} compact />
              </div>
            </section>

            <section className="donor-floor">
              <div className="donor-list" aria-label="Audience segment list">
                {profiles.map(segment => (
                  <button
                    key={segment.id}
                    type="button"
                    className={`donor-card ${segment.id === activeAudience.id ? 'active' : ''}`}
                    onClick={() => setActiveId(segment.id)}
                  >
                    <div className="donor-card-head">
                      <div>
                        <div className="donor-name">{segment.name}</div>
                        <div className="donor-archetype">{listeningPosture(segment)}</div>
                      </div>
                      <div className="donor-card-metrics">
                        <div className={`donor-score ${toneClass(segment.trust)}`}>{segment.trust}</div>
                        <LastDeltaBadge delta={segment.lastDelta} compact />
                      </div>
                    </div>
                    <RelationshipBar value={segment.trust} />
                    <div className="donor-card-tags">
                      {topAffinities(segment).map(affinity => <span key={affinity}>{affinity}</span>)}
                    </div>
                  </button>
                ))}
              </div>

              <article className="donor-profile">
                <div className="donor-profile-head">
                  <div>
                    <span className="hc-eyebrow">Selected public</span>
                    <h3 className="donor-profile-name hc-display">{activeAudience.name}</h3>
                    <p className="donor-profile-desc hc-serif">{segmentDescription(activeAudience)}</p>
                  </div>
                  <div className="donor-profile-score-block">
                    <span className="hc-label">Trust</span>
                    <strong className={toneClass(activeAudience.trust)}>{activeAudience.trust}</strong>
                    <RelationshipBar value={activeAudience.trust} />
                    <LastDeltaBadge delta={activeAudience.lastDelta} />
                  </div>
                </div>

                <div className="audience-metric-grid">
                  <Metric label="Awareness" value={activeAudience.awareness} />
                  <Metric label="Trust" value={activeAudience.trust} />
                  <Metric label="Habit" value={activeAudience.habit} />
                  <Metric label="Price sensitivity" value={activeAudience.priceSensitivity} urgent={activeAudience.priceSensitivity >= 70} />
                </div>

                <div className="donor-radar-grid audience-radar-grid">
                  <section className="donor-radar-panel" aria-label="Audience affinity radar chart">
                    <div className="donor-panel-head">
                      <span className="hc-label">Taste and social shape</span>
                      <span className="donor-restriction">size {compactNumber(activeAudience.size)}</span>
                    </div>
                    <AudienceRadarChart
                      title={`${activeAudience.name} audience profile`}
                      axes={AUDIENCE_AXES}
                      values={activeAudience}
                    />
                  </section>

                  <section className="donor-radar-panel audience-posture-panel">
                    <span className="hc-label">Listening posture</span>
                    <p>{listeningPostureDetail(activeAudience)}</p>
                    <span className="hc-label">Visible barrier</span>
                    <p>{priceSensitivityRead(activeAudience)}</p>
                    <span className="hc-label">Evolution note</span>
                    <p>{evolutionNote(activeAudience)}</p>
                  </section>
                </div>

                <div className="donor-note-row">
                  <div>
                    <span className="hc-label">Recent read</span>
                    <p>{activeAudience.recentReaction}</p>
                  </div>
                  <div>
                    <span className="hc-label">Most price-sensitive public</span>
                    <p>{mostPriceSensitive?.name ?? '—'} is currently the clearest affordability pressure in the city ecology.</p>
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

function joinAudienceProfiles(season: SeasonState): AudienceProfile[] {
  return cityAudienceSegments.map(segment => {
    const relationship = season.audience.relationships.find(row => row.segmentId === segment.id)
    return {
      ...segment,
      segmentId: segment.id,
      awareness: relationship?.awareness ?? 0,
      trust: relationship?.trust ?? 0,
      habit: relationship?.habit ?? 0,
      alignmentMemory: relationship?.alignmentMemory ?? 0,
      recentReaction: relationship?.recentReaction ?? 'Has not yet formed an opinion of the orchestra.',
      lastDelta: relationship?.lastDelta ?? 0,
    }
  })
}

function SummaryTile({ label, value, suffix = '', compact = false }: { label: string; value: string; suffix?: string; compact?: boolean }) {
  return <div className={`donor-summary-tile ${compact ? 'compact' : ''}`}><span className="hc-label">{label}</span><strong>{value}<small>{suffix}</small></strong></div>
}

function Metric({ label, value, urgent = false }: { label: string; value: number; urgent?: boolean }) {
  return <div className="audience-metric"><span className="hc-label">{label}</span><strong className={urgent ? 'donor-tone-ember' : toneClass(value)}>{value}</strong><RelationshipBar value={value} /></div>
}

function RelationshipBar({ value }: { value: number }) {
  return <div className="donor-relationship-track"><i className={toneClass(value)} style={{ width: `${value}%` }} /></div>
}

function LastDeltaBadge({ delta, compact = false }: { delta: number; compact?: boolean }) {
  const normalized = Object.is(delta, -0) ? 0 : delta
  const direction = normalized > 0 ? 'up' : normalized < 0 ? 'down' : 'flat'
  const label = normalized > 0 ? `+${normalized}` : `${normalized}`
  return <div className={`donor-delta-badge ${direction} ${compact ? 'compact' : ''}`}><span className="donor-delta-spark" aria-hidden="true"><i /><i /><i /></span><span className="donor-delta-copy"><em>{direction === 'up' ? '↗' : direction === 'down' ? '↘' : '→'}</em><strong>{label}</strong>{!compact && <small>Last move</small>}</span></div>
}

function topAffinities(segment: AudienceProfile): string[] {
  return AUDIENCE_AXES.map(({ key, label }) => ({ label, value: Number(segment[key]) })).sort((a, b) => b.value - a.value).slice(0, 3).map(item => item.label)
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

function compactNumber(value: number): string {
  return value >= 1000 ? `${Number((value / 1000).toFixed(1))}K` : `${value}`
}

function listeningPosture(segment: AudienceProfile): string {
  if (segment.id === 'classical-core') return 'Repertoire and interpretation'
  if (segment.id === 'new-music-public') return 'Risk and artistic relevance'
  if (segment.id === 'students-emerging-artists') return 'Access, discovery, proximity'
  if (segment.id === 'civic-tech-professionals') return 'Event prestige and belonging'
  if (segment.id === 'community-neighborhood-public') return 'Welcome and local meaning'
  return 'Breadth, novelty, cultural fluency'
}

function segmentDescription(segment: AudienceProfile): string {
  return `${listeningPosture(segment)}. A public of roughly ${compactNumber(segment.size)} people whose relationship with the orchestra is still evolving through awareness, trust, habit, and price access.`
}

function listeningPostureDetail(segment: AudienceProfile): string {
  return `This audience listens through ${listeningPosture(segment).toLowerCase()}. Programming can deepen the relationship when the experience confirms that the institution understands why they came.`
}

function priceSensitivityRead(segment: AudienceProfile): string {
  if (segment.priceSensitivity >= 75) return 'Affordability is a primary gate. Even strong artistic alignment can fail to become habit if the ticket feels socially or materially out of reach.'
  if (segment.priceSensitivity >= 50) return 'Price matters visibly. Clear value, access pathways, and low-friction invitations can convert curiosity into repeat attendance.'
  return 'Price is not the main barrier; awareness, prestige signal, repertoire fit, or habit formation probably matter more.'
}

function evolutionNote(segment: AudienceProfile): string {
  if (segment.habit < 20 && segment.awareness < 25) return 'A latent public: the first task is being noticed at all.'
  if (segment.trust > segment.habit + 20) return 'Trust is ahead of habit. They may believe in the orchestra before attendance has become routine.'
  if (segment.habit > segment.trust + 10) return 'Habit is ahead of trust. Attendance may be inherited or convenient rather than deeply renewed.'
  return 'Trust and habit are moving together; repeated good experiences can slowly turn this segment into a durable public.'
}

function AudienceRadarChart<T extends object>({ title, axes, values }: { title: string; axes: Array<RadarAxis<T>>; values: T }) {
  const center = 150
  const maxRadius = 96
  const plotted = axes.map(({ key, label }, index) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2
    const value = Number(values[key])
    return { key: String(key), label, value, x: center + Math.cos(angle) * maxRadius, y: center + Math.sin(angle) * maxRadius, dataX: center + Math.cos(angle) * maxRadius * (value / 100), dataY: center + Math.sin(angle) * maxRadius * (value / 100), labelX: center + Math.cos(angle) * (maxRadius + 30), labelY: center + Math.sin(angle) * (maxRadius + 30) }
  })
  const polygonPoints = plotted.map(axis => `${axis.dataX},${axis.dataY}`).join(' ')
  const rings = [25, 50, 75, 100].map(percent => plotted.map(axis => `${center + (axis.x - center) * (percent / 100)},${center + (axis.y - center) * (percent / 100)}`).join(' '))

  return <div className="donor-radar-wrap"><svg className="donor-radar-svg" viewBox="0 0 300 300" role="img"><title>{title}</title>{rings.map((points, index) => <polygon key={index} className="donor-radar-ring" points={points} />)}{plotted.map(axis => <line key={`${axis.key}-axis`} className="donor-radar-axis" x1={center} y1={center} x2={axis.x} y2={axis.y} />)}<polygon className="donor-radar-shape" points={polygonPoints} />{plotted.map(axis => <circle key={`${axis.key}-point`} className="donor-radar-dot" cx={axis.dataX} cy={axis.dataY} r="3.5" />)}{plotted.map(axis => <g key={`${axis.key}-label`}><text className="donor-radar-label" x={axis.labelX} y={axis.labelY - 5} textAnchor={axis.labelX < center - 8 ? 'end' : axis.labelX > center + 8 ? 'start' : 'middle'} dominantBaseline="middle">{axis.label}</text><text className="donor-radar-glyph" x={axis.labelX} y={axis.labelY + 8} textAnchor={axis.labelX < center - 8 ? 'end' : axis.labelX > center + 8 ? 'start' : 'middle'} dominantBaseline="middle">{preferenceGlyph(axis.value)}</text></g>)}</svg><div className="donor-radar-caption"><span>− low</span><span>+++ defining trait</span></div></div>
}
