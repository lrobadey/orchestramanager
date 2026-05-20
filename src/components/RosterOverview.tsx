import { type CSSProperties } from 'react'
import { type ConcertForecast, type Principal, type RosterState, type SectionKey } from '../types/core'
import { calculateSectionStrengths } from '../sim/roster'

interface RosterOverviewProps {
  roster: RosterState
  forecast: ConcertForecast
  currentSlotName: string | null
}

const SECTION_LABELS: Record<SectionKey, string> = {
  strings: 'Strings',
  winds: 'Winds',
  brass: 'Brass',
  percussion: 'Percussion',
}

function strengthTone(value: number): 'aurora' | 'amber' | 'berry' {
  if (value >= 65) return 'aurora'
  if (value >= 45) return 'amber'
  return 'berry'
}

function strengthLabel(value: number): string {
  if (value >= 80) return 'a commanding orchestra'
  if (value >= 65) return 'a strong, capable orchestra'
  if (value >= 50) return 'a steady, working orchestra'
  if (value >= 35) return 'a fragile, uneven orchestra'
  return 'an orchestra in crisis'
}

function PrincipalRow({ principal }: { principal: Principal }) {
  const overallTone = strengthTone(principal.overall)
  return (
    <div className="roster-principal">
      <div className="roster-principal-name-block">
        <span className="roster-principal-name">{principal.name}</span>
        <span className="roster-principal-position">{principal.position}</span>
      </div>
      <div className="roster-principal-stat">
        <span className="roster-principal-stat-label">Overall</span>
        <span className={`roster-principal-stat-value ${overallTone}`}>{principal.overall}</span>
      </div>
      <div className="roster-principal-stat">
        <span className="roster-principal-stat-label">Form</span>
        <span className="roster-principal-stat-value">{principal.form}</span>
        <div className="roster-principal-mini-bar">
          <i style={{ width: `${principal.form}%` }} />
        </div>
      </div>
      <div className="roster-principal-stat">
        <span className="roster-principal-stat-label">Morale</span>
        <span className="roster-principal-stat-value">{principal.morale}</span>
        <div className="roster-principal-mini-bar">
          <i style={{ width: `${principal.morale}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function RosterOverview({ roster, forecast, currentSlotName }: RosterOverviewProps) {
  const strengths =
    forecast.sectionStrengths.length > 0 ? forecast.sectionStrengths : calculateSectionStrengths(roster.principals)
  const fit = forecast.repertoireFit
  const orchestraStrength = Math.round(
    strengths.reduce((sum, row) => sum + row.strength, 0) / strengths.length,
  )
  const overallTone = strengthTone(orchestraStrength)

  return (
    <div className="roster-page">
      <section className="roster-hero">
        <span className="eyebrow">{currentSlotName ?? 'Season complete'} · Orchestra Strength</span>
        <div className={`roster-hero-num ${overallTone}`}>{orchestraStrength}</div>
        <p className="roster-hero-sub">
          A score of <strong style={{ color: 'var(--birch)' }}>{orchestraStrength}</strong> reads as {strengthLabel(orchestraStrength)}.
        </p>
        <div
          className="roster-spectrum"
          style={{ ['--strength' as string]: `${orchestraStrength}%` } as CSSProperties}
          aria-label={`Overall orchestra strength ${orchestraStrength} out of 100`}
        >
          <i />
          <span className="roster-spectrum-marker" />
        </div>
        <div className="roster-spectrum-scale">
          <span>fragile</span>
          <span>stable</span>
          <span>commanding</span>
        </div>
      </section>

      <div>
        {strengths.map(row => {
          const fitRow = fit.find(c => c.section === row.section)
          const tone = strengthTone(row.strength)
          const principalsInSection = roster.principals.filter(p => p.section === row.section)
          return (
            <section key={row.section} className="roster-section">
              <div className="roster-section-head">
                <h2 className="roster-section-name">{SECTION_LABELS[row.section]}</h2>
                <div className={`roster-section-score ${tone}`}>{row.strength}</div>
                <p className="roster-section-note">{fitRow?.note ?? row.note}</p>
                {fitRow && (
                  <div className="roster-section-pressure">
                    <span>Demand {fitRow.demand}</span>
                    <span>Stress {fitRow.stress}</span>
                  </div>
                )}
              </div>
              <div className="roster-principals">
                {principalsInSection.map(p => (
                  <PrincipalRow key={p.id} principal={p} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
