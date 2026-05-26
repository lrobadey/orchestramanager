import { type KeyboardEvent, useMemo, useState } from 'react'
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

const STAGE_VIEWBOX = { w: 600, h: 400, cx: 300, cy: 340 }

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

function sectionStatusLabel(value: number): string {
  if (value >= 70) return 'Current strength'
  if (value >= 55) return 'Playable but exposed'
  if (value >= 40) return 'Strategic risk'
  return 'Critical instability'
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

function stageArcPath(radius: number, from: number, to: number): string {
  const fromA = (from * Math.PI) / 180
  const toA = (to * Math.PI) / 180
  const x1 = STAGE_VIEWBOX.cx + radius * Math.cos(fromA)
  const y1 = STAGE_VIEWBOX.cy + radius * Math.sin(fromA)
  const x2 = STAGE_VIEWBOX.cx + radius * Math.cos(toA)
  const y2 = STAGE_VIEWBOX.cy + radius * Math.sin(toA)
  return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`
}

function buildStageChairs() {
  const chairs: Array<{ section: SectionKey; x: number; y: number; arcIndex: number; chairIndex: number }> = []
  const sectionIndexes: Record<SectionKey, number> = { strings: 0, winds: 0, brass: 0, percussion: 0 }

  STAGE_ARCS.forEach((arc, arcIndex) => {
    for (let i = 0; i < arc.chairs; i += 1) {
      const t = arc.chairs === 1 ? 0.5 : i / (arc.chairs - 1)
      const angleDeg = arc.from + (arc.to - arc.from) * t
      const angle = (angleDeg * Math.PI) / 180
      const chairIndex = sectionIndexes[arc.section]
      sectionIndexes[arc.section] += 1
      chairs.push({
        section: arc.section,
        x: STAGE_VIEWBOX.cx + arc.radius * Math.cos(angle),
        y: STAGE_VIEWBOX.cy + arc.radius * Math.sin(angle),
        arcIndex,
        chairIndex,
      })
    }
  })

  return chairs
}

function buildPrincipalChairIndexes(
  chairCounts: Record<SectionKey, number>,
  principalCounts: Record<SectionKey, number>,
): Record<SectionKey, Set<number>> {
  return SECTION_ORDER.reduce(
    (indexes, section) => {
      const chairs = chairCounts[section]
      const principals = Math.min(principalCounts[section], chairs)
      const sectionIndexes = new Set<number>()

      if (principals === 1) {
        sectionIndexes.add(Math.floor(chairs / 2))
      } else if (principals > 1) {
        const span = chairs - 1
        const divisor = principals - 1
        for (let i = 0; i < principals; i += 1) {
          sectionIndexes.add(Math.round((span * i) / divisor))
        }
      }

      return { ...indexes, [section]: sectionIndexes }
    },
    { strings: new Set<number>(), winds: new Set<number>(), brass: new Set<number>(), percussion: new Set<number>() } as Record<SectionKey, Set<number>>,
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
  return (
    <section className="roster-command-header" aria-label="Roster strength summary">
      <div className="roster-command-copy">
        <div className="roster-command-title">The Orchestra</div>
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
  const [hoveredSection, setHoveredSection] = useState<SectionKey | null>(null)
  const focusedSection = hoveredSection ?? activeSection
  const activePrincipals = roster.principals.filter(principal => principal.section === activeSection)
  const activeSectionStrength = sectionStrengths.find(row => row.section === activeSection)
  const activeSectionFit = repertoireFit.find(row => row.section === activeSection)
  const stageChairs = useMemo(() => buildStageChairs(), [])
  const chairCounts = useMemo(() => sectionChairCounts(), [])
  const principalCounts = useMemo(
    () =>
      SECTION_ORDER.reduce(
        (counts, section) => ({
          ...counts,
          [section]: roster.principals.filter(principal => principal.section === section).length,
        }),
        { strings: 0, winds: 0, brass: 0, percussion: 0 } as Record<SectionKey, number>,
      ),
    [roster.principals],
  )
  const principalChairIndexes = useMemo(
    () => buildPrincipalChairIndexes(chairCounts, principalCounts),
    [chairCounts, principalCounts],
  )
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

  const sectionSummary = (section: SectionKey) => {
    const row = sectionStrengths.find(item => item.section === section)
    const fit = repertoireFit.find(item => item.section === section)
    const strength = row?.strength ?? fit?.strength ?? 50
    return {
      section,
      label: row?.label ?? fit?.label ?? SECTION_LABELS[section],
      strength,
      note: fit?.note ?? row?.note ?? 'Section detail stays anchored to the live roster.',
      bottleneck: row?.bottleneck ?? 'coverage',
      status: sectionStatusLabel(strength),
      chairCount: chairCounts[section],
      principalCount: principalCounts[section],
      fit,
    }
  }

  const selectSection = (section: SectionKey) => {
    setActiveSection(section)
  }

  const handleStageSectionKeyDown = (event: KeyboardEvent<SVGGElement>, section: SectionKey) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectSection(section)
    }
  }

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
        <section className="roster-stage-shell" aria-label="Roster stage schematic">
          <div className="roster-stage-caption">
            <span className="roster-stage-caption-slot">The Stage · {slotLabel}</span>
          </div>

          <svg
            className="roster-stage-svg"
            viewBox={`0 0 ${STAGE_VIEWBOX.w} ${STAGE_VIEWBOX.h}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Interactive semicircular roster stage schematic"
          >
            <g className="roster-stage-focus-bands" aria-hidden="true">
              {STAGE_ARCS.map((arc, index) => {
                const sectionFocused = arc.section === focusedSection
                return (
                  <path
                    key={`${arc.section}-focus-${index}`}
                    className={`roster-stage-focus-band ${sectionFocused ? 'is-focused' : ''}`}
                    d={stageArcPath(arc.radius, arc.from, arc.to)}
                    fill="none"
                    stroke={SECTION_COLORS[arc.section]}
                    strokeWidth={arc.section === 'percussion' ? 52 : 38}
                    strokeLinecap="round"
                    pointerEvents="none"
                  />
                )
              })}
            </g>

            <g className="roster-stage-interaction-zones" aria-hidden="true">
              {STAGE_ARCS.map((arc, index) => (
                <path
                  key={`${arc.section}-hit-${index}`}
                  className="roster-stage-hit-zone"
                  d={stageArcPath(arc.radius, arc.from, arc.to)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={arc.section === 'percussion' ? 58 : 42}
                  strokeLinecap="round"
                  pointerEvents="stroke"
                  onMouseEnter={() => setHoveredSection(arc.section)}
                  onMouseLeave={() => setHoveredSection(null)}
                  onClick={() => selectSection(arc.section)}
                />
              ))}
            </g>

            {STAGE_ARCS.map((arc, index) => {
              const sectionFocused = arc.section === focusedSection
              const sectionSelected = arc.section === activeSection
              return (
                <path
                  key={`${arc.section}-${index}`}
                  d={stageArcPath(arc.radius, arc.from, arc.to)}
                  fill="none"
                  stroke={sectionFocused ? 'var(--silver)' : 'var(--hairline)'}
                  strokeWidth={sectionFocused ? 1.35 : 0.7}
                  strokeDasharray={sectionFocused ? 'none' : '2 4'}
                  opacity={sectionFocused ? 0.95 : sectionSelected ? 0.75 : 0.42}
                  pointerEvents="none"
                />
              )
            })}

            {stageChairs.map((chair, index) => {
              const sectionFocused = chair.section === focusedSection
              const sectionSelected = chair.section === activeSection
              const isPrincipalChair = principalChairIndexes[chair.section].has(chair.chairIndex)
              const tone = SECTION_COLORS[chair.section]
              return (
                <circle
                  key={`${chair.section}-${chair.arcIndex}-${index}`}
                  cx={chair.x}
                  cy={chair.y}
                  r={sectionFocused ? (isPrincipalChair ? 7.1 : 5.4) : 4.15}
                  fill={sectionFocused ? (isPrincipalChair ? 'var(--ink)' : tone) : 'var(--ink-2)'}
                  stroke={sectionFocused ? (isPrincipalChair ? 'var(--birch)' : tone) : 'var(--bark-dim)'}
                  strokeWidth={sectionFocused && isPrincipalChair ? 1.65 : sectionFocused ? 1.15 : 0.8}
                  opacity={sectionFocused ? 1 : sectionSelected ? 0.7 : 0.45}
                  pointerEvents="none"
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
              pointerEvents="none"
            />
            <circle cx={STAGE_VIEWBOX.cx} cy={STAGE_VIEWBOX.cy} r={4} fill="var(--bark-dim)" pointerEvents="none" />
            <text
              x={STAGE_VIEWBOX.cx}
              y={STAGE_VIEWBOX.cy + 31}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="8"
              fill="var(--silver-dim)"
              letterSpacing="2"
              pointerEvents="none"
            >
              CONDUCTOR
            </text>

            {STAGE_LABELS.map((label, index) => {
              const angle = (label.angle * Math.PI) / 180
              const x = STAGE_VIEWBOX.cx + label.radius * Math.cos(angle)
              const y = STAGE_VIEWBOX.cy + label.radius * Math.sin(angle)
              const summary = sectionSummary(label.section)
              const sectionActive = label.section === activeSection
              const sectionHovered = label.section === hoveredSection
              const sectionFocused = label.section === focusedSection
              const tooltipX = x + 72
              const tooltipY = Math.max(18, y - 36)
              const barWidth = 96
              return (
                <g
                  key={`${label.section}-${index}`}
                  className={`roster-stage-section-label ${sectionActive ? 'is-active' : ''} ${sectionHovered ? 'is-hovered' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${summary.label}: ${summary.strength} composite, ${summary.chairCount} chairs, ${summary.principalCount} principals`}
                  onMouseEnter={() => setHoveredSection(label.section)}
                  onMouseLeave={() => setHoveredSection(null)}
                  onClick={() => selectSection(label.section)}
                  onKeyDown={event => handleStageSectionKeyDown(event, label.section)}
                >
                  <rect
                    className="roster-stage-label-focus-ring"
                    x={x - 78}
                    y={y - 18}
                    width={156}
                    height={sectionFocused ? 34 : 26}
                    rx={13}
                  />
                  <text
                    className="roster-stage-label-text"
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fontFamily="Georgia, 'Times New Roman', serif"
                    fontStyle="italic"
                    fontSize={sectionFocused ? 14 : 11.5}
                  >
                    {summary.label} ·{' '}
                    <tspan fontFamily="var(--font-mono)" fontStyle="normal" fontSize={sectionFocused ? 13 : 11}>
                      {summary.strength}
                    </tspan>
                  </text>

                  {sectionFocused && (
                    <g className="roster-stage-label-composite" aria-hidden="true">
                      <rect x={x - barWidth / 2} y={y + 10} width={barWidth} height={3} rx={1.5} className="roster-stage-mini-track" />
                      <rect
                        x={x - barWidth / 2}
                        y={y + 10}
                        width={(barWidth * summary.strength) / 100}
                        height={3}
                        rx={1.5}
                        className={`roster-stage-mini-fill ${toneClass(summary.strength)}`}
                      />
                    </g>
                  )}

                  {sectionHovered && (
                    <g className="roster-stage-tooltip" transform={`translate(${tooltipX} ${tooltipY})`} aria-hidden="true">
                      <rect className="roster-stage-tooltip-frame" width={206} height={86} rx={2} />
                      <text className="roster-stage-tooltip-title" x={12} y={18}>
                        {summary.label} · {summary.strength}
                      </text>
                      <text className="roster-stage-tooltip-meta" x={12} y={36}>
                        {summary.chairCount} chairs · {summary.principalCount} principal{summary.principalCount === 1 ? '' : 's'}
                      </text>
                      <text className="roster-stage-tooltip-status" x={12} y={53}>
                        {summary.status}
                      </text>
                      <text className="roster-stage-tooltip-meta" x={12} y={69}>
                        Bottleneck · {summary.bottleneck}
                      </text>
                      <rect x={12} y={77} width={182} height={3} rx={1.5} className="roster-stage-mini-track" />
                      <rect
                        x={12}
                        y={77}
                        width={(182 * summary.strength) / 100}
                        height={3}
                        rx={1.5}
                        className={`roster-stage-mini-fill ${toneClass(summary.strength)}`}
                      />
                    </g>
                  )}
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
              pointerEvents="none"
            />
            <text
              x={STAGE_VIEWBOX.w - 40}
              y={STAGE_VIEWBOX.cy + 50}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize="7.5"
              fill="var(--silver-dim)"
              letterSpacing="2"
              pointerEvents="none"
            >
              AUDIENCE
            </text>
          </svg>
        </section>
      </section>

      <section className="roster-ledger" aria-live="polite">
        <div className="roster-ledger-head">
          <div>
            <div className="roster-ledger-kicker">Section inspection</div>
            <h2 className="roster-ledger-title">
              {SECTION_LABELS[activeSection]} <span>{activeSectionStrength?.strength ?? activeSectionFit?.strength ?? 50}</span>
            </h2>
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

        <div className="roster-ledger-diagnostics">
          <div className="roster-ledger-diagnostic-card">
            <div className="roster-ledger-diagnostic-label">Composite</div>
            <div className={`roster-ledger-diagnostic-value ${toneClass(activeSectionStrength?.strength ?? activeSectionFit?.strength ?? 50)}`}>
              {activeSectionStrength?.strength ?? activeSectionFit?.strength ?? 50}
            </div>
            <div className="roster-track">
              <span
                className={`roster-track-fill ${toneClass(activeSectionStrength?.strength ?? activeSectionFit?.strength ?? 50)}`}
                style={{ width: `${activeSectionStrength?.strength ?? activeSectionFit?.strength ?? 50}%` }}
              />
            </div>
          </div>

          <div className="roster-ledger-diagnostic-card">
            <div className="roster-ledger-diagnostic-label">Bottleneck</div>
            <div className="roster-ledger-diagnostic-copy">{activeSectionStrength?.bottleneck ?? 'coverage'}</div>
            <p>{activeSectionFit?.note ?? 'No programme-specific strain is currently visible.'}</p>
          </div>

          {activeSectionFit && (
            <>
              <div className="roster-ledger-diagnostic-card">
                <div className="roster-ledger-diagnostic-label">Demand</div>
                <div className="roster-ledger-diagnostic-value roster-tone-silver">{activeSectionFit.demand}</div>
                <div className="roster-track">
                  <span className="roster-track-fill roster-tone-silver" style={{ width: `${activeSectionFit.demand}%` }} />
                </div>
              </div>

              <div className="roster-ledger-diagnostic-card">
                <div className="roster-ledger-diagnostic-label">Stress</div>
                <div className={`roster-ledger-diagnostic-value ${toneClass(activeSectionFit.stress)}`}>{activeSectionFit.stress}</div>
                <div className="roster-track">
                  <span className={`roster-track-fill ${toneClass(activeSectionFit.stress)}`} style={{ width: `${activeSectionFit.stress}%` }} />
                </div>
              </div>
            </>
          )}
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
