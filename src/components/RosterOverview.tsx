import type { CSSProperties } from 'react'
import { type ConcertForecast, type Principal, type RosterState, type SectionKey } from '../types/core'
import { calculateSectionStrengths } from '../sim/roster'

interface RosterOverviewProps {
  roster: RosterState
  forecast: ConcertForecast
  currentSlotName: string | null
}

const sections: SectionKey[] = ['strings', 'winds', 'brass', 'percussion']

const sectionLabels: Record<SectionKey, string> = {
  strings: 'Strings',
  winds: 'Winds',
  brass: 'Brass',
  percussion: 'Percussion',
}

function ratingClass(value: number): string {
  if (value >= 70) return 'risk-low'
  if (value >= 50) return 'risk-med'
  return 'risk-high'
}

function strengthTone(value: number): string {
  if (value >= 70) return 'strong'
  if (value >= 50) return 'steady'
  return 'fragile'
}

function summarizePrincipal(principal: Principal): string {
  const attributes = [
    ['leadership', principal.leadership],
    ['stress resistance', principal.stressResistance],
    ['endurance', principal.endurance],
    ['blend', principal.blend],
    ['solo reliability', principal.soloReliability],
    ['new music', principal.newMusicFluency],
    ['classical', principal.classicalFluency],
    ['romantic', principal.romanticFluency],
  ] as const
  const strongest = [...attributes].sort((a, b) => b[1] - a[1])[0]
  const weakest = [...attributes].sort((a, b) => a[1] - b[1])[0]
  return `Best: ${strongest[0]}. Watch: ${weakest[0]}.`
}

function PrincipalCard({ principal }: { principal: Principal }) {
  return (
    <article className="principal-card">
      <div className="principal-card-header">
        <div>
          <h4>{principal.name}</h4>
          <p>{principal.position}</p>
        </div>
        <span className={`principal-overall ${ratingClass(principal.overall)}`}>
          {principal.overall}
        </span>
      </div>
      <div className="principal-meter-grid">
        <span>Form</span>
        <strong className={ratingClass(principal.form)}>{principal.form}</strong>
        <span>Morale</span>
        <strong className={ratingClass(principal.morale)}>{principal.morale}</strong>
        <span>Stress</span>
        <strong className={ratingClass(principal.stressResistance)}>
          {principal.stressResistance}
        </strong>
        <span>Lead</span>
        <strong className={ratingClass(principal.leadership)}>{principal.leadership}</strong>
      </div>
      <p className="principal-note">{summarizePrincipal(principal)}</p>
    </article>
  )
}

export default function RosterOverview({ roster, forecast, currentSlotName }: RosterOverviewProps) {
  const strengths = forecast.sectionStrengths.length > 0
    ? forecast.sectionStrengths
    : calculateSectionStrengths(roster.principals)
  const fit = forecast.repertoireFit
  const orchestraStrength = Math.round(
    strengths.reduce((sum, row) => sum + row.strength, 0) / strengths.length,
  )

  return (
    <div className="roster-view">
      <div className="roster-heading">
        <div>
          <p className="concert-slot-label">{currentSlotName ?? 'Season complete'}</p>
          <h2>Roster Room</h2>
        </div>
        <p>
          Principals are the live bottlenecks of the orchestra. Form and morale move
          across the season after each concert.
        </p>
      </div>

      <section className="orchestra-strength-hero" aria-label="Orchestra strength">
        <div className="orchestra-strength-core">
          <span className="orchestra-strength-kicker">Orchestra Strength</span>
          <strong
            className={`orchestra-strength-number strength-tone-${strengthTone(orchestraStrength)}`}
          >
            {orchestraStrength}
          </strong>
          <div
            className="strength-spectrum strength-spectrum-large"
            style={{ '--strength': `${orchestraStrength}%` } as CSSProperties}
            aria-label={`Overall orchestra strength ${orchestraStrength} out of 100`}
          >
            <span className="strength-spectrum-fill" />
            <span className="strength-spectrum-marker" />
          </div>
          <div className="strength-scale">
            <span>fragile</span>
            <span>stable</span>
            <span>commanding</span>
          </div>
        </div>

        <div className="section-strength-routes">
          {strengths.map(row => {
            const fitRow = fit.find(candidate => candidate.section === row.section)
            return (
              <div
                key={row.section}
                className="section-strength-rail"
                style={{ '--strength': `${row.strength}%` } as CSSProperties}
              >
                <div className="section-strength-readout">
                  <span>{row.label}</span>
                  <strong className={`strength-tone-${strengthTone(row.strength)}`}>
                    {row.strength}
                  </strong>
                </div>
                <div
                  className="strength-spectrum"
                  aria-label={`${row.label} strength ${row.strength} out of 100`}
                >
                  <span className="strength-spectrum-fill" />
                  <span className="strength-spectrum-marker" />
                </div>
                {fitRow && (
                  <div className="section-pressure-line">
                    <span>Demand {fitRow.demand}</span>
                    <span>Stress {fitRow.stress}</span>
                  </div>
                )}
                <p>{fitRow?.note ?? row.note}</p>
              </div>
            )
          })}
        </div>
      </section>

      {sections.map(section => (
        <section key={section} className="roster-section">
          <h3>{sectionLabels[section]}</h3>
          <div className="principal-grid">
            {roster.principals
              .filter(principal => principal.section === section)
              .map(principal => (
                <PrincipalCard key={principal.id} principal={principal} />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
