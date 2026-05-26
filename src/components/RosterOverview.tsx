import { useMemo, useState } from 'react'
import { type ConcertForecast, type Principal, type RosterState, type SectionKey } from '../types/core'
import { calculateSectionStrengths } from '../sim/roster'
import '../styles/roster.css'

interface RosterOverviewProps {
  roster: RosterState
  forecast: ConcertForecast
  currentSlotName: string | null
}

const SECTION_ORDER: SectionKey[] = ['strings', 'winds', 'brass', 'percussion']

const SECTION_LABELS: Record<SectionKey, string> = {
  strings: 'Strings',
  winds: 'Winds',
  brass: 'Brass',
  percussion: 'Percussion',
}

const SECTION_COLORS: Record<SectionKey, string> = {
  strings: 'var(--silver)',
  winds: 'var(--bark-dim)',
  brass: 'var(--ember)',
  percussion: 'var(--pine)',
}

const STAGE_VIEWBOX = { w: 600, h: 460, cx: 300, cy: 410 }

const STAGE_ARCS = [
  { section: 'strings' as SectionKey, radius: 100, from: 185, to: 355, chairs: 14 },
  { section: 'strings' as SectionKey, radius: 148, from: 185, to: 355, chairs: 16 },
  { section: 'winds' as SectionKey, radius: 198, from: 205, to: 335, chairs: 12 },
  { section: 'brass' as SectionKey, radius: 248, from: 215, to: 325, chairs: 10 },
  { section: 'percussion' as SectionKey, radius: 298, from: 240, to: 300, chairs: 5 },
]

const STAGE_LABELS = [
  { section: 'strings' as SectionKey, angle: 268, radius: 170 },
  { section: 'winds' as SectionKey, angle: 268, radius: 218 },
  { section: 'brass' as SectionKey, angle: 268, radius: 268 },
  { section: 'percussion' as SectionKey, angle: 268, radius: 318 },
]

function strengthTone(value: number): 'pine' | 'silver' | 'bark' | 'ember' {
  if (value >= 70) return 'pine'
  if (value >= 55) return 'silver'
  if (value >= 40) return 'bark'
  return 'ember'
}

function strengthLabel(value: number): string {
  if (value >= 80) return 'a commanding orchestra'
  if (value >= 65) return 'a strong, capable orchestra'
  if (value >= 50) return 'a steady, working orchestra'
  if (value >= 35) return 'a fragile, uneven orchestra'
  return 'an orchestra in crisis'
}

function toneClass(value: number): string {
  return `roster-tone-${strengthTone(value)}`
}

function splitStrengthHeadline(value: number): { article: string; phrase: string } {
  const label = strengthLabel(value)
  const match = label.match(/^(a|an)\s+(.+)$/)
  return match ? { article: match[1], phrase: match[2] } : { article: 'A', phrase: label }
}

function summarizePrincipal(principal: Principal): { best: string; watch: string } {
  const metrics = [
    ['leadership', principal.leadership],
    ['stress resistance', principal.stressResistance],
    ['endurance', principal.endurance],
    ['blend', principal.blend],
    ['solo reliability', principal.soloReliability],
    ['new music', principal.newMusicFluency],
    ['classical', principal.classicalFluency],
    ['romantic', principal.romanticFluency],
    ['intonation', principal.intonation],
    ['rhythm', principal.rhythm],
    ['tone', principal.tone],
  ] as const
  const ranked = [...metrics].sort((a, b) => b[1] - a[1])
  return {
    best: ranked[0][0],
    watch: ranked[ranked.length - 1][0],
  }
}

function sectionChairCounts(): Record<SectionKey, number> {
  return STAGE_ARCS.reduce(
    (counts, arc) => ({ ...counts, [arc.section]: counts[arc.section] + arc.chairs }),
    { strings: 0, winds: 0, brass: 0, percussion: 0 } as Record<SectionKey, number>,
  )
}

function buildStageChairs() {
  const chairs: Array<{ section: SectionKey; x: number; y: number; arcIndex: number }> = []

  STAGE_ARCS.forEach((arc, arcIndex) => {
    for (let i = 0; i < arc.chairs; i += 1) {
      const t = arc.chairs === 1 ? 0.5 : i / (arc.chairs - 1)
      const angleDeg = arc.from + (arc.to - arc.from) * t
      const angle = (angleDeg * Math.PI) / 180
      chairs.push({
        section: arc.section,
        x: STAGE_VIEWBOX.cx + arc.radius * Math.cos(angle),
        y: STAGE_VIEWBOX.cy + arc.radius * Math.sin(angle),
        arcIndex,
      })
    }
  })

  return chairs
}

function SectionCard({
  section,
  active,
  principalCount,
  chairCount,
  fit,
  onSelect,
}: {
  section: {
    section: SectionKey
    label: string
    strength: number
    note: string
    bottleneck: string
  }
  active: boolean
  principalCount: number
  chairCount: number
  fit?: {
    demand: number
    stress: number
    note: string
  }
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`roster-section-card ${active ? 'active' : ''}`}
      aria-pressed={active}
      onClick={onSelect}
    >
      <div className="roster-section-card-head">
        <div>
          <div className="roster-section-label">{section.label}</div>
          <div className="roster-section-meta">
            {chairCount} chairs · {principalCount} principal{principalCount === 1 ? '' : 's'}
          </div>
        </div>
        <div className="roster-section-strength-stack">
          <div className={`roster-section-strength ${toneClass(section.strength)}`}>{section.strength}</div>
          {active && <div className="roster-section-active">ACTIVE</div>}
        </div>
      </div>

      <div className="roster-section-strength-block">
        <div className="roster-section-strength-caption">Composite</div>
        <div className="roster-track">
          <span className={`roster-track-fill ${toneClass(section.strength)}`} style={{ width: `${section.strength}%` }} />
        </div>
      </div>

      <p className="roster-section-note">{section.note}</p>

      {fit && (
        <div className="roster-section-metrics">
          <div className="roster-section-metric">
            <div className="roster-section-metric-head">
              <span className="roster-section-metric-label">Demand</span>
              <span className="roster-section-metric-value">{fit.demand}</span>
            </div>
            <div className="roster-track">
              <span className="roster-track-fill roster-tone-silver" style={{ width: `${fit.demand}%` }} />
            </div>
          </div>

          <div className="roster-section-metric">
            <div className="roster-section-metric-head">
              <span className="roster-section-metric-label">Stress</span>
              <span className="roster-section-metric-value">{fit.stress}</span>
            </div>
            <div className="roster-track">
              <span className={`roster-track-fill ${toneClass(fit.stress)}`} style={{ width: `${fit.stress}%` }} />
            </div>
          </div>
        </div>
      )}
    </button>
  )
}

function PrincipalCard({ principal }: { principal: Principal }) {
  const overallTone = strengthTone(principal.overall)
  const { best, watch } = summarizePrincipal(principal)

  return (
    <article className="roster-principal-card">
      <div className="roster-principal-name-block">
        <div className="roster-principal-name">{principal.name}</div>
        <div className="roster-principal-position">{principal.position}</div>
      </div>

      <div className={`roster-principal-overall roster-tone-${overallTone}`}>{principal.overall}</div>

      <div className="roster-principal-meters">
        <div className="roster-principal-meter">
          <div className="roster-principal-meter-head">
            <span className="roster-principal-meter-label">Form</span>
            <span className="roster-principal-meter-value">{principal.form}</span>
          </div>
          <div className="roster-track">
            <span className={`roster-track-fill ${toneClass(principal.form)}`} style={{ width: `${principal.form}%` }} />
          </div>
        </div>

        <div className="roster-principal-meter">
          <div className="roster-principal-meter-head">
            <span className="roster-principal-meter-label">Morale</span>
            <span className="roster-principal-meter-value">{principal.morale}</span>
          </div>
          <div className="roster-track">
            <span className={`roster-track-fill ${toneClass(principal.morale)}`} style={{ width: `${principal.morale}%` }} />
          </div>
        </div>
      </div>

      <div className="roster-principal-watchline">
        <span className="roster-principal-best">↑ {best}</span>
        <span className="roster-principal-watch">watch · {watch}</span>
      </div>
    </article>
  )
}

export function RosterStrengthHeader({ roster, forecast }: Pick<RosterOverviewProps, 'roster' | 'forecast'>) {
  const sectionStrengths =
    forecast.sectionStrengths.length > 0 ? forecast.sectionStrengths : calculateSectionStrengths(roster.principals)
  const compositeStrength =
    sectionStrengths.length > 0
      ? Math.round(sectionStrengths.reduce((sum, row) => sum + row.strength, 0) / sectionStrengths.length)
      : 0
  const chairCounts = sectionChairCounts()
  const totalChairs = Object.values(chairCounts).reduce((sum, count) => sum + count, 0)
  return (
    <section className="roster-command-header" aria-label="Roster strength summary">
      <div className="roster-command-copy">
        <div className="roster-command-title">The Orchestra</div>
        <div className="roster-command-sublabels">
          <span>{roster.principals.length} principals</span>
          <span>{totalChairs} chairs</span>
        </div>
      </div>

      <div className="roster-command-score">
        <h1 className={`roster-command-strength-value ${toneClass(compositeStrength)}`}>
          {compositeStrength}
          <span className="roster-canopy-strength-suffix">/100</span>
        </h1>
        <div className="roster-canopy-strength-block">
          <div className="roster-canopy-strength-label">Strength range</div>
          <div className="roster-strength-scale">
            <span className="roster-strength-scale-end">fragile 0</span>
            <div className="roster-strength-scale-track">
              <span className={`roster-strength-scale-fill ${toneClass(compositeStrength)}`} style={{ width: `${compositeStrength}%` }} />
              <span className="roster-strength-scale-marker" aria-label="Stable threshold" />
            </div>
            <span className="roster-strength-scale-end right">commanding 100</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function RosterOverview({ roster, forecast, currentSlotName, showCanopy = true }: RosterOverviewProps & { showCanopy?: boolean }) {
  const sectionStrengths =
    forecast.sectionStrengths.length > 0 ? forecast.sectionStrengths : calculateSectionStrengths(roster.principals)
  const repertoireFit = forecast.repertoireFit
  const compositeStrength =
    sectionStrengths.length > 0
      ? Math.round(sectionStrengths.reduce((sum, row) => sum + row.strength, 0) / sectionStrengths.length)
      : 0
  const [activeSection, setActiveSection] = useState<SectionKey>('strings')
  const activePrincipals = roster.principals.filter(principal => principal.section === activeSection)
  const activeSectionStrength = sectionStrengths.find(row => row.section === activeSection)
  const activeSectionFit = repertoireFit.find(row => row.section === activeSection)
  const stageChairs = useMemo(() => buildStageChairs(), [])
  const chairCounts = useMemo(() => sectionChairCounts(), [])
  const totalChairs = Object.values(chairCounts).reduce((sum, count) => sum + count, 0)
  const slotLabel = currentSlotName ?? 'Season complete'
  const sortedSections = [...sectionStrengths].sort((a, b) => b.strength - a.strength)
  const strongestSection = sortedSections[0]
  const weakestSection = sortedSections[sortedSections.length - 1]
  const watchCount = sectionStrengths.filter(row => row.strength < 55).length
  const stableCount = sectionStrengths.length - watchCount
  const rosterDiagnosis = strongestSection && weakestSection
    ? `${strongestSection.label} carries the institution; ${weakestSection.label.toLowerCase()} is the section on watch. ${stableCount} section${stableCount === 1 ? '' : 's'} stable, ${watchCount} on watch.`
    : 'The orchestra is still settling into its first readable shape.'
  const headline = splitStrengthHeadline(compositeStrength)

  return (
    <div className="roster-page">
      {showCanopy && (
        <section className="roster-canopy">
          <div className="roster-canopy-copy-block">
            <div className="roster-kicker">
              The Orchestra · {roster.principals.length} principals · {totalChairs} chairs
            </div>
            <h1 className={`roster-canopy-strength-value ${toneClass(compositeStrength)}`}>
              {compositeStrength}
              <span className="roster-canopy-strength-suffix">/100</span>
            </h1>
            <div className="roster-canopy-status">
              Composite strength · {headline.article} {headline.phrase}.
            </div>
            <p className="roster-canopy-copy">{rosterDiagnosis}</p>
          </div>

          <div className="roster-canopy-strength-block">
            <div className="roster-canopy-strength-label">Strength range</div>
            <div className="roster-strength-scale">
              <span className="roster-strength-scale-end">fragile 0</span>
              <div className="roster-strength-scale-track">
                <span className={`roster-strength-scale-fill ${toneClass(compositeStrength)}`} style={{ width: `${compositeStrength}%` }} />
                <span className="roster-strength-scale-marker" aria-label="Stable threshold" />
              </div>
              <span className="roster-strength-scale-end right">commanding 100</span>
            </div>
          </div>
        </section>
      )}

      <section className="roster-floor">
        <div className="roster-side-stack">
          {SECTION_ORDER.slice(0, 2).map(section => {
            const row = sectionStrengths.find(item => item.section === section)
            if (!row) return null
            const fitRow = activeSectionFit?.section === section ? activeSectionFit : repertoireFit.find(item => item.section === section)
            const note = fitRow?.note ?? row.note
            const sectionPrincipalCount = roster.principals.filter(principal => principal.section === section).length

            return (
              <SectionCard
                key={section}
                section={{ ...row, note, bottleneck: row.bottleneck }}
                active={activeSection === section}
                principalCount={sectionPrincipalCount}
                chairCount={chairCounts[section]}
                fit={fitRow}
                onSelect={() => setActiveSection(section)}
              />
            )
          })}
        </div>

        <section className="roster-stage-shell" aria-label="Roster stage schematic">
          <div className="roster-stage-caption">
            <span className="roster-stage-caption-slot">The Stage · {slotLabel}</span>
            <span className="roster-stage-caption-side">Audience perspective</span>
          </div>

          <svg
            className="roster-stage-svg"
            viewBox={`0 0 ${STAGE_VIEWBOX.w} ${STAGE_VIEWBOX.h}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Semicircular roster stage schematic"
          >
            {STAGE_ARCS.map((arc, index) => {
              const fromA = (arc.from * Math.PI) / 180
              const toA = (arc.to * Math.PI) / 180
              const x1 = STAGE_VIEWBOX.cx + arc.radius * Math.cos(fromA)
              const y1 = STAGE_VIEWBOX.cy + arc.radius * Math.sin(fromA)
              const x2 = STAGE_VIEWBOX.cx + arc.radius * Math.cos(toA)
              const y2 = STAGE_VIEWBOX.cy + arc.radius * Math.sin(toA)
              const sectionActive = arc.section === activeSection
              return (
                <path
                  key={`${arc.section}-${index}`}
                  d={`M ${x1} ${y1} A ${arc.radius} ${arc.radius} 0 0 1 ${x2} ${y2}`}
                  fill="none"
                  stroke={sectionActive ? 'var(--silver)' : 'var(--hairline)'}
                  strokeWidth={sectionActive ? 1.2 : 0.7}
                  strokeDasharray={sectionActive ? 'none' : '2 4'}
                  opacity={sectionActive ? 0.95 : 0.55}
                />
              )
            })}

            {stageChairs.map((chair, index) => {
              const sectionActive = chair.section === activeSection
              const tone = SECTION_COLORS[chair.section]
              return (
                <circle
                  key={`${chair.section}-${chair.arcIndex}-${index}`}
                  cx={chair.x}
                  cy={chair.y}
                  r={sectionActive ? 6 : 4.25}
                  fill={sectionActive ? tone : 'var(--ink-2)'}
                  stroke={sectionActive ? tone : 'var(--bark-dim)'}
                  strokeWidth={sectionActive ? 1.2 : 0.8}
                  opacity={sectionActive ? 1 : 0.55}
                />
              )
            })}

            <circle
              cx={STAGE_VIEWBOX.cx}
              cy={STAGE_VIEWBOX.cy}
              r={14}
              fill="none"
              stroke="var(--bark-dim)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <circle cx={STAGE_VIEWBOX.cx} cy={STAGE_VIEWBOX.cy} r={4} fill="var(--bark-dim)" />
            <text
              x={STAGE_VIEWBOX.cx}
              y={STAGE_VIEWBOX.cy + 31}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="8"
              fill="var(--silver-dim)"
              letterSpacing="2"
            >
              CONDUCTOR
            </text>

            {STAGE_LABELS.map((label, index) => {
              const angle = (label.angle * Math.PI) / 180
              const x = STAGE_VIEWBOX.cx + label.radius * Math.cos(angle)
              const y = STAGE_VIEWBOX.cy + label.radius * Math.sin(angle)
              const row = sectionStrengths.find(item => item.section === label.section)
              const sectionActive = label.section === activeSection
              return (
                <g key={`${label.section}-${index}`}>
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fontFamily="Georgia, 'Times New Roman', serif"
                    fontStyle="italic"
                    fontSize={sectionActive ? 14 : 11.5}
                    fill={sectionActive ? 'var(--birch)' : 'var(--birch-dim)'}
                  >
                    {row?.label ?? SECTION_LABELS[label.section]} ·{' '}
                    <tspan fontFamily="var(--font-mono)" fontStyle="normal" fontSize={sectionActive ? 13 : 11}>
                      {row?.strength ?? 50}
                    </tspan>
                  </text>
                </g>
              )
            })}

            <line
              x1={40}
              y1={STAGE_VIEWBOX.cy + 36}
              x2={STAGE_VIEWBOX.w - 40}
              y2={STAGE_VIEWBOX.cy + 36}
              stroke="var(--hairline)"
              strokeWidth="0.7"
              strokeDasharray="3 4"
            />
            <text
              x={STAGE_VIEWBOX.w - 40}
              y={STAGE_VIEWBOX.cy + 50}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize="7.5"
              fill="var(--silver-dim)"
              letterSpacing="2"
            >
              AUDIENCE
            </text>
          </svg>
        </section>

        <div className="roster-side-stack">
          {SECTION_ORDER.slice(2).map(section => {
            const row = sectionStrengths.find(item => item.section === section)
            if (!row) return null
            const fitRow = repertoireFit.find(item => item.section === section)
            const note = fitRow?.note ?? row.note
            const sectionPrincipalCount = roster.principals.filter(principal => principal.section === section).length

            return (
              <SectionCard
                key={section}
                section={{ ...row, note, bottleneck: row.bottleneck }}
                active={activeSection === section}
                principalCount={sectionPrincipalCount}
                chairCount={chairCounts[section]}
                fit={fitRow}
                onSelect={() => setActiveSection(section)}
              />
            )
          })}
        </div>
      </section>

      <section className="roster-ledger">
        <div className="roster-ledger-head">
          <div>
            <div className="roster-ledger-kicker">Principal ledger</div>
            <h2 className="roster-ledger-title">{SECTION_LABELS[activeSection]}</h2>
            <p className="roster-ledger-copy">
              {activeSectionStrength?.note ?? 'Section detail stays anchored to the live roster.'}
            </p>
          </div>

          <div className="roster-ledger-meta">
            <span>{activePrincipals.length} principals</span>
            <span>{chairCounts[activeSection]} chairs</span>
            <span>{slotLabel}</span>
          </div>
        </div>

        <div className="roster-principal-grid">
          {activePrincipals.map(principal => (
            <PrincipalCard key={principal.id} principal={principal} />
          ))}
        </div>
      </section>
    </div>
  )
}
