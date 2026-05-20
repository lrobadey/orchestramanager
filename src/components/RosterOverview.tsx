import { useState, type CSSProperties } from 'react'
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
      <span className="roster-principal-note">{summarizePrincipal(principal)}</span>
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
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null)
  const activePrincipals = activeSection
    ? roster.principals.filter(p => p.section === activeSection)
    : []

  return (
    <div className="roster-page">
      <section className="roster-hero">
        <div className={`roster-hero-num ${overallTone}`}>{orchestraStrength}</div>
        <div className="roster-hero-info">
          <span className="eyebrow">{currentSlotName ?? 'Season complete'} · Orchestra Strength</span>
          <p className="roster-hero-sub">
            <strong style={{ color: 'var(--birch)' }}>{orchestraStrength}</strong> reads as {strengthLabel(orchestraStrength)}.
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
        </div>
      </section>

      <div className="roster-grid">
        {strengths.map(row => {
          const fitRow = fit.find(c => c.section === row.section)
          const tone = strengthTone(row.strength)
          const principalsInSection = roster.principals.filter(p => p.section === row.section).slice(0, 3)
          const isActive = activeSection === row.section
          return (
            <button
              key={row.section}
              type="button"
              className={`roster-section-cell ${isActive ? 'active' : ''}`}
              onClick={() => setActiveSection(prev => (prev === row.section ? null : row.section))}
            >
              <div>
                <h3 className="roster-section-name">{SECTION_LABELS[row.section]}</h3>
                <p className="roster-section-note">{fitRow?.note ?? row.note}</p>
                {fitRow && (
                  <div className="roster-section-pressure">
                    <span>Demand {fitRow.demand}</span>
                    <span>Stress {fitRow.stress}</span>
                  </div>
                )}
                <div className="roster-section-cell-preview">
                  {principalsInSection.map(p => (
                    <div key={p.id} className="roster-section-cell-preview-row">
                      <strong>{p.name}</strong>
                      <span>{p.position} · {p.overall}</span>
                    </div>
                  ))}
                </div>
                <div className="roster-section-cell-inspect">
                  {isActive ? '— Showing below' : 'Inspect →'}
                </div>
              </div>
              <div className={`roster-section-score ${tone}`}>{row.strength}</div>
            </button>
          )
        })}
      </div>

      {activeSection && activePrincipals.length > 0 && (
        <div className="roster-principal-ledger">
          <div className="roster-principal-ledger-head">
            <span className="eyebrow">{SECTION_LABELS[activeSection]} · Principal Ledger</span>
            <button type="button" className="text-link" onClick={() => setActiveSection(null)}>
              Close ✕
            </button>
          </div>
          <div className="roster-principals">
            {activePrincipals.map(p => (
              <PrincipalRow key={p.id} principal={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
