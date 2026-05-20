import { useState, type CSSProperties } from 'react'
import { type ConcertForecast, type Principal, type RosterState, type SectionKey } from '../types/core'
import { calculateSectionStrengths } from '../sim/roster'

interface RosterOverviewProps {
  roster: RosterState
  forecast: ConcertForecast
  currentSlotName: string | null
}

const sectionLabels: Record<SectionKey, string> = {
  strings: 'Strings',
  winds: 'Winds',
  brass: 'Brass',
  percussion: 'Percussion',
}

const principalOrder: Record<string, number> = {
  'Concertmaster': 10,
  'Principal Second Violin': 20,
  'Principal Viola': 30,
  'Principal Cello': 40,
  'Principal Double Bass': 50,
  'Principal Flute': 10,
  'Principal Oboe': 20,
  'Principal Clarinet': 30,
  'Principal Bassoon': 40,
  'Principal Horn': 10,
  'Principal Trumpet': 20,
  'Principal Trombone': 30,
  'Principal Tuba': 40,
  'Timpani': 10,
  'Principal Percussion': 20,
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

function sortedPrincipals(principals: Principal[], section: SectionKey): Principal[] {
  return principals
    .filter(principal => principal.section === section)
    .sort((a, b) => (principalOrder[a.position] ?? 100) - (principalOrder[b.position] ?? 100))
}

function PrincipalRow({ principal }: { principal: Principal }) {
  return (
    <div className="principal-ledger-row">
      <div className="principal-ledger-identity">
        <span>{principal.position}</span>
        <strong>{principal.name}</strong>
      </div>
      <div className="principal-ledger-score">
        <span>Overall</span>
        <strong className={ratingClass(principal.overall)}>{principal.overall}</strong>
      </div>
      <div className="principal-ledger-meter">
        <span>Form {principal.form}</span>
        <div className="principal-mini-track">
          <i style={{ width: `${principal.form}%` }} />
        </div>
      </div>
      <div className="principal-ledger-meter">
        <span>Morale {principal.morale}</span>
        <div className="principal-mini-track">
          <i style={{ width: `${principal.morale}%` }} />
        </div>
      </div>
      <p>{summarizePrincipal(principal)}</p>
    </div>
  )
}

export default function RosterOverview({ roster, forecast, currentSlotName }: RosterOverviewProps) {
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null)
  const strengths = forecast.sectionStrengths.length > 0
    ? forecast.sectionStrengths
    : calculateSectionStrengths(roster.principals)
  const fit = forecast.repertoireFit
  const orchestraStrength = Math.round(
    strengths.reduce((sum, row) => sum + row.strength, 0) / strengths.length,
  )
  const activeStrength = activeSection
    ? strengths.find(row => row.section === activeSection)
    : null
  const activeFit = activeSection
    ? fit.find(row => row.section === activeSection)
    : null
  const activePrincipals = activeSection
    ? sortedPrincipals(roster.principals, activeSection)
    : []

  return (
    <div className="roster-view">
      <div className="roster-heading">
        <div>
          <p className="concert-slot-label">{currentSlotName ?? 'Season complete'}</p>
          <h2>Roster Room</h2>
        </div>
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
                className={
                  activeSection === row.section
                    ? 'section-strength-rail section-strength-rail-active'
                    : 'section-strength-rail'
                }
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
                <button
                  className="section-inspect-button"
                  onClick={() => setActiveSection(row.section)}
                >
                  Inspect {row.label}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="roster-section-detail">
        {activeSection === null ? (
          <div className="roster-section-empty">
            <span>Choose a section above to inspect the principal desks.</span>
          </div>
        ) : (
          <>
            <div className="roster-section-detail-header">
              <div>
                <span>{sectionLabels[activeSection]}</span>
                <strong className={`strength-tone-${strengthTone(activeStrength?.strength ?? 0)}`}>
                  {activeStrength?.strength ?? 0}
                </strong>
              </div>
              <p>{activeFit?.note ?? activeStrength?.note}</p>
            </div>
            <div className="principal-ledger">
              {activePrincipals.map(principal => (
                <PrincipalRow key={principal.id} principal={principal} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
