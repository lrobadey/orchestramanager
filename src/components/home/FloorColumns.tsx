import { useState } from 'react'
import type {
  ConcertProgram,
  InstitutionState,
  Principal,
  RosterState,
  SeasonState,
  Work,
} from '../../types/core'
import { calculateSectionStrengths } from '../../sim/roster'
import { VENUE_NAME } from '../../data/homeStubs'
import { fmtCash } from '../../format'
import { formatShortDate } from '../../sim/calendar'
import { CONCERT_ROMAN, SLOT_ROMAN } from '../../data/numerals'

interface FloorColumnsProps {
  roster: RosterState
  season: SeasonState
  program: ConcertProgram
  works: Work[]
  onOpenProgramme: () => void
}

type FloorPanelKey = 'roster' | 'programme' | 'inbox'

const SLOT_HINTS = [
  'Open · curtain-raiser slot',
  'Open · concerto or anchor candidate',
  'Open · symphonic anchor',
]

export default function FloorColumns({
  roster,
  season,
  program,
  works,
  onOpenProgramme,
}: FloorColumnsProps) {
  const [collapsed, setCollapsed] = useState<Record<FloorPanelKey, boolean>>({
    roster: true,
    programme: true,
    inbox: true,
  })

  const idx = Math.min(season.currentSlotIndex, 3)
  const seasonComplete = season.currentSlotIndex >= 4
  const currentSlot = seasonComplete ? season.slots[3] : season.slots[idx]

  // Real calendar-driven scheduling — the same source the canopy countdown uses,
  // so the floor card and the header never disagree.
  const { currentDay, startDate } = season.calendar
  const currentDays = Math.max(0, currentSlot.scheduledDay - currentDay)
  const currentDate = formatShortDate(currentSlot.scheduledDate, startDate)
  const followUpSlot = season.slots[Math.min(idx + 1, 3)]
  const followUpDate = formatShortDate(followUpSlot.scheduledDate, startDate)
  const resolvedSlots = season.slots.filter(s => s.status === 'resolved')
  const lastNet = resolvedSlots.length
    ? resolvedSlots[resolvedSlots.length - 1].report?.net ?? null
    : null

  const sectionStrengths = calculateSectionStrengths(roster.principals, [])
  const compositeStrength = Math.round(
    sectionStrengths.reduce((sum, s) => sum + s.strength, 0) / sectionStrengths.length,
  )

  const watchPrincipals = pickWatchPrincipals(roster.principals)

  const selectedWorks: (Work | null)[] = program.workIds.map(id =>
    id ? works.find(w => w.id === id) ?? null : null,
  )
  const usedIds = new Set(program.workIds.filter((id): id is string => id !== null))
  const suggested = suggestWorks(works, usedIds, 3)
  const gridClass = [
    'floor-grid',
    collapsed.roster ? 'roster-collapsed' : '',
    collapsed.programme ? 'programme-collapsed' : '',
    collapsed.inbox ? 'inbox-collapsed' : '',
  ].filter(Boolean).join(' ')

  const setPanelCollapsed = (panel: FloorPanelKey, value: boolean) => {
    setCollapsed(current => ({ ...current, [panel]: value }))
  }

  return (
    <div className="home-stratum floor">
      <div className="floor-focus-bar" aria-label="Home screen focus presets">
        <button type="button" onClick={() => setCollapsed({ roster: false, programme: false, inbox: false })}>Full desk</button>
        <button type="button" onClick={() => setCollapsed({ roster: true, programme: false, inbox: true })}>Programme focus</button>
        <button type="button" onClick={() => setCollapsed({ roster: false, programme: true, inbox: false })}>Institution focus</button>
        <button type="button" onClick={() => setCollapsed({ roster: true, programme: true, inbox: true })}>Quiet</button>
      </div>
      <div className={gridClass}>
        {collapsed.roster ? (
          <CollapsedRail
            label="Orchestra"
            value={`${compositeStrength}`}
            detail={conditionLabel(compositeStrength)}
            tone={conditionTone(compositeStrength)}
            onExpand={() => setPanelCollapsed('roster', false)}
          />
        ) : (
          <RosterColumn sections={sectionStrengths} composite={compositeStrength} watch={watchPrincipals} onCollapse={() => setPanelCollapsed('roster', true)} />
        )}
        {collapsed.programme ? (
          <CollapsedRail label="Next" value={CONCERT_ROMAN[idx]} detail={seasonComplete ? 'closed' : `T−${currentDays}d`} onExpand={() => setPanelCollapsed('programme', false)} />
        ) : (
          <NextConcertColumn slotName={currentSlot.name} idx={idx} days={currentDays} date={currentDate} followUpDate={followUpDate} workCount={program.workCount} selectedWorks={selectedWorks} suggested={suggested} seasonComplete={seasonComplete} onOpenProgramme={onOpenProgramme} onCollapse={() => setPanelCollapsed('programme', true)} />
        )}
        {collapsed.inbox ? (
          <CollapsedRail label="Pressure" value={`${season.institution.donorConfidence}`} detail={donorRead(season.institution.donorConfidence)} tone={donorTone(season.institution.donorConfidence)} onExpand={() => setPanelCollapsed('inbox', false)} />
        ) : (
          <InboxFinanceColumn institution={season.institution} lastNet={lastNet} onCollapse={() => setPanelCollapsed('inbox', true)} />
        )}
      </div>
    </div>
  )
}

function CollapsedRail({
  label,
  value,
  detail,
  tone,
  onExpand,
}: {
  label: string
  value: string
  detail: string
  tone?: 'pine' | 'bark' | 'ember'
  onExpand: () => void
}) {
  const classes = ['floor-collapsed-rail']
  if (tone) classes.push(`tone-${tone}`)

  return (
    <button type="button" className={classes.join(' ')} onClick={onExpand} aria-label={`Expand ${label}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{detail}</em>
    </button>
  )
}

interface RosterColumnProps {
  sections: ReturnType<typeof calculateSectionStrengths>
  composite: number
  watch: Principal[]
  onCollapse: () => void
}

function RosterColumn({ sections, composite, watch, onCollapse }: RosterColumnProps) {
  const weakest = [...sections].sort((a, b) => a.strength - b.strength)[0]
  const highestStress = [...sections].sort((a, b) => stressFromStrength(b.strength) - stressFromStrength(a.strength))[0]
  const headline = orchestraDiagnosis(composite, weakest?.label)

  return (
    <section className="floor-panel floor-panel-roster roster-condition-card">
      <div className="floor-col-head roster-condition-head">
        <span className="hc-eyebrow">Orchestra condition</span>
        <span className="roster-condition-score hc-num">{composite} / 100</span>
        <button type="button" className="floor-collapse-btn" onClick={onCollapse} aria-label="Collapse roster panel">−</button>
      </div>
      <div className="floor-panel-body roster-condition-body">
        <div className="roster-overall-read">
          <div>
            <div className="roster-overall-number hc-display">{composite}</div>
            <div className={`roster-overall-state ${conditionTone(composite)}`}>{conditionLabel(composite)}</div>
          </div>
          <p>{headline}</p>
        </div>

        <div className="roster-pressure-pair" aria-label="Orchestra pressure summary">
          <div>
            <span>Weakest desk</span>
            <strong>{weakest?.label ?? '—'}</strong>
          </div>
          <div>
            <span>Highest stress</span>
            <strong>{highestStress?.label ?? '—'}</strong>
          </div>
        </div>

        <div className="roster-ledger-list">
          {sections.map(s => {
            const status = sectionStatus(s.strength)
            return (
              <div key={s.section} className="roster-ledger-row">
                <span className="roster-ledger-section">{s.label}</span>
                <span className="roster-ledger-note">{s.note}</span>
                <strong>{s.strength}</strong>
                <em className={status.tone}>{status.label}</em>
              </div>
            )
          })}
        </div>

        <div className="roster-watch roster-watch-ledger">
          <div className="roster-watch-head">
            <span className="hc-eyebrow">Watch list</span>
            <span className="hc-eyebrow" style={{ color: 'var(--bark)' }}>{watch.length} principals</span>
          </div>
          {watch.map(p => (
            <div key={p.id} className="roster-watch-row">
              <span><span className="roster-watch-name">{p.name}</span><span className="roster-watch-position">{p.position}</span></span>
              <span className={`roster-watch-stat ${p.form < 60 ? 'low' : 'ok'}`}>form {p.form}</span>
              <span className={`roster-watch-stat ${p.morale < 60 ? 'low' : 'ok'}`}>morale {p.morale}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

interface NextConcertColumnProps {
  slotName: string
  idx: number
  days: number
  date: string
  followUpDate: string
  workCount: 2 | 3
  selectedWorks: (Work | null)[]
  suggested: Work[]
  seasonComplete: boolean
  onOpenProgramme: () => void
  onCollapse: () => void
}

function NextConcertColumn({ slotName, idx, days, date, followUpDate, workCount, selectedWorks, suggested, seasonComplete, onOpenProgramme, onCollapse }: NextConcertColumnProps) {
  const visibleWorks = selectedWorks.slice(0, workCount)
  const openSlots = visibleWorks.filter(w => !w).length
  const assignedWorks = visibleWorks.filter((w): w is Work => Boolean(w))
  const avgDraw = averageMetric(assignedWorks, 'audienceDraw')
  const avgLoad = averageMetric(assignedWorks, 'rehearsalLoad')
  const stakes = concertStakes(openSlots, avgDraw, avgLoad, seasonComplete)

  return (
    <section className="floor-panel floor-panel-programme next-decision-card">
      <div className="floor-col-head next-decision-head">
        <span className="hc-eyebrow" style={{ color: 'var(--bark)' }}>Next decision</span>
        <span className="hc-eyebrow">{seasonComplete ? 'Season closed' : idx < 3 ? `Concert ${CONCERT_ROMAN[idx + 1]} follows on ${followUpDate}` : 'Final concert of the season'}</span>
        <button type="button" className="floor-collapse-btn" onClick={onCollapse} aria-label="Collapse programme panel">−</button>
      </div>
      <div className="floor-panel-body next-decision-body">
        <div className="next-decision-hero">
          <div>
            <div className="next-decision-kicker">Program {CONCERT_ROMAN[idx]}</div>
            <div className="next-title-line"><span className="accent">{slotName}</span></div>
            <div className="next-meta">{VENUE_NAME} · {seasonComplete ? '—' : date}</div>
          </div>
          <div className="next-days-block" aria-label={`${days} days until curtain`}>
            <strong>{days}</strong>
            <span>{seasonComplete ? 'closed' : 'days'}</span>
          </div>
        </div>

        <div className="next-stakes-strip" aria-label="Concert state of play">
          <div><span>Shape</span><strong>{openSlots} open</strong></div>
          <div><span>Audience</span><strong className={stakes.audienceTone}>{stakes.audience}</strong></div>
          <div><span>Load</span><strong className={stakes.loadTone}>{stakes.load}</strong></div>
          <div><span>Pressure</span><strong className={stakes.pressureTone}>{stakes.pressure}</strong></div>
        </div>

        <p className="next-decision-read">{stakes.read}</p>

        <div className="next-slots next-slot-ledger">
          {visibleWorks.map((w, i) => (
            <div key={i} className={`next-slot-row${w ? ' assigned' : ' open'}`}>
              <span className="next-slot-roman">{SLOT_ROMAN[i] ?? `${i + 1}`}.</span>
              <div>{w ? <><span className="next-slot-title"><span className="next-slot-composer">{w.composer},</span> <span style={{ fontStyle: 'italic' }}>{w.title}</span></span><div className="next-slot-hint">{w.durationMinutes}m · prestige {w.artisticPrestige} · draw {w.audienceDraw} · load {w.rehearsalLoad}</div></> : <><span className="next-slot-title empty">Open slot</span><div className="next-slot-hint">{SLOT_HINTS[i] ?? 'Open slot'}</div></>}</div>
              <span className="next-slot-assign">{w ? 'set' : 'needs choice'}</span>
            </div>
          ))}
        </div>

        <div className="next-suggested next-suggestion-ledger">
          <div className="next-suggestion-head">
            <span className="hc-eyebrow">Useful library pulls</span>
            <span className="hc-eyebrow" style={{ color: 'var(--bark)' }}>not assigned</span>
          </div>
          {suggested.map(w => (
            <div key={w.id} className="next-suggested-row">
              <span><span className="next-suggested-name">{w.composer},</span> <span className="next-suggested-title">{w.title}</span></span>
              <span className="next-suggested-stat muted" title="Duration in minutes">{w.durationMinutes}m</span>
              <span className="next-suggested-stat" title="Artistic prestige">P{w.artisticPrestige}</span>
              <span className="next-suggested-stat" title="Audience draw">D{w.audienceDraw}</span>
              <span className={`next-suggested-stat${w.rehearsalLoad > 60 ? ' ember' : ' muted'}`} title="Rehearsal load">L{w.rehearsalLoad}</span>
            </div>
          ))}
        </div>
        <button type="button" className="next-cta next-decision-cta" onClick={onOpenProgramme}>
          <span className="next-cta-arrow">▸</span>
          <span className="next-cta-label">{seasonComplete ? 'Open Season Summary' : `Open Programme Builder`}</span>
          <span className="next-cta-trail">{seasonComplete ? 'IV / IV' : `T−${days}d`}</span>
        </button>
      </div>
    </section>
  )
}

function InboxFinanceColumn({ institution, lastNet, onCollapse }: { institution: InstitutionState; lastNet: number | null; onCollapse: () => void }) {
  const donor = institution.donorConfidence
  const trust = institution.audienceTrust
  const institutionalRead = inboxInstitutionRead(donor, trust, lastNet ?? 0)

  return (
    <section className="floor-panel floor-panel-inbox inbox-pressure-card">
      <div className="floor-col-head inbox-pressure-head">
        <span className="hc-eyebrow">Institution pressure</span>
        <button type="button" className="floor-collapse-btn" onClick={onCollapse} aria-label="Collapse pressure panel">−</button>
      </div>
      <div className="floor-panel-body inbox-pressure-body">
        <div className="inbox-pressure-hero">
          <div>
            <div className={`inbox-pressure-state ${institutionalRead.tone}`}>{institutionalRead.label}</div>
            <p>{institutionalRead.text}</p>
          </div>
          <div className="inbox-cash-block">
            <strong>{fmtCash(institution.cash)}</strong>
            <span>cash on hand</span>
          </div>
        </div>

        <div className="inbox-pressure-strip" aria-label="Institution pressure summary">
          <div><span>Donors</span><strong className={donorTone(donor)}>{donorRead(donor)}</strong></div>
          <div><span>Audience</span><strong className={trustTone(trust)}>{trustRead(trust)}</strong></div>
          <div><span>Last net</span><strong className={lastNet == null ? 'muted' : lastNet >= 0 ? 'pine' : 'ember'}>{lastNet == null ? '—' : `${lastNet >= 0 ? '+' : '−'}${fmtCash(Math.abs(lastNet))}`}</strong></div>
        </div>

        <div className="inbox-coming-soon">
          <div className="inbox-message-head">
            <span className="hc-eyebrow">Inbox &amp; signals</span>
            <span className="coming-soon-tag">coming soon</span>
          </div>
          <p className="coming-soon-text">Donor letters, press notices, and musician requests will surface here once the inbox and event systems come online.</p>
        </div>

        <div className="inbox-coming-soon">
          <div className="inbox-message-head">
            <span className="hc-eyebrow">Finance trace</span>
            <span className="coming-soon-tag">coming soon</span>
          </div>
          <p className="coming-soon-text">Week-by-week cash history will chart here once per-week ledger tracking lands.</p>
        </div>
      </div>
    </section>
  )
}

function donorTone(score: number): 'pine' | 'bark' | 'ember' {
  if (score >= 62) return 'pine'
  if (score >= 42) return 'bark'
  return 'ember'
}

function donorRead(score: number): string {
  if (score >= 62) return 'holding'
  if (score >= 42) return 'soft'
  return 'nervous'
}

function trustTone(score: number): 'pine' | 'bark' | 'ember' {
  if (score >= 62) return 'pine'
  if (score >= 44) return 'bark'
  return 'ember'
}

function trustRead(score: number): string {
  if (score >= 62) return 'warm'
  if (score >= 44) return 'uncertain'
  return 'thin'
}

function inboxInstitutionRead(donor: number, trust: number, netK: number): { label: string; tone: 'pine' | 'bark' | 'ember'; text: string } {
  if (donor < 40 && trust < 45) return { label: 'exposed', tone: 'ember', text: 'Both money and public confidence are asking for a steadier next result.' }
  if (donor < 45) return { label: 'donor pressure', tone: 'ember', text: 'The board room is more fragile than the hall. Avoid making the institution look reckless.' }
  if (trust < 45) return { label: 'public uncertainty', tone: 'bark', text: 'The audience read is unsettled. The next programme needs a clearer invitation.' }
  if (netK < 0) return { label: 'cash drag', tone: 'bark', text: 'The institution is stable enough to choose, but the ledger is beginning to pull downward.' }
  return { label: 'room to move', tone: 'pine', text: 'External pressure is contained. The next concert can afford a measured risk.' }
}

function averageMetric(works: Work[], key: 'audienceDraw' | 'rehearsalLoad'): number | null {
  if (!works.length) return null
  return Math.round(works.reduce((sum, work) => sum + work[key], 0) / works.length)
}

function concertStakes(openSlots: number, avgDraw: number | null, avgLoad: number | null, seasonComplete: boolean): {
  audience: string
  audienceTone: 'pine' | 'bark' | 'ember'
  load: string
  loadTone: 'pine' | 'bark' | 'ember'
  pressure: string
  pressureTone: 'pine' | 'bark' | 'ember'
  read: string
} {
  if (seasonComplete) {
    return {
      audience: 'settled',
      audienceTone: 'pine',
      load: 'past',
      loadTone: 'bark',
      pressure: 'closed',
      pressureTone: 'bark',
      read: 'The season is complete. Review the pattern before moving into the next cycle.',
    }
  }

  const audience = avgDraw == null ? 'unknown' : avgDraw >= 68 ? 'promising' : avgDraw >= 52 ? 'uncertain' : 'thin'
  const audienceTone = avgDraw == null ? 'bark' : avgDraw >= 68 ? 'pine' : avgDraw >= 52 ? 'bark' : 'ember'
  const load = avgLoad == null ? 'unknown' : avgLoad >= 72 ? 'heavy' : avgLoad >= 55 ? 'workable' : 'light'
  const loadTone = avgLoad == null ? 'bark' : avgLoad >= 72 ? 'ember' : avgLoad >= 55 ? 'bark' : 'pine'
  const pressure = openSlots >= 3 ? 'unformed' : openSlots >= 1 ? 'active' : 'set'
  const pressureTone = openSlots >= 3 ? 'ember' : openSlots >= 1 ? 'bark' : 'pine'

  const read = openSlots >= 3
    ? 'The concert has no public argument yet. Choose an anchor before polishing the edges.'
    : openSlots > 0
      ? 'The concert has a shape, but its remaining gaps still decide the evening.'
      : 'The programme is set. The question now shifts to rehearsal risk and public appetite.'

  return { audience, audienceTone, load, loadTone, pressure, pressureTone, read }
}

function conditionTone(score: number): 'pine' | 'bark' | 'ember' {
  if (score >= 78) return 'pine'
  if (score >= 62) return 'bark'
  return 'ember'
}

function conditionLabel(score: number): string {
  if (score >= 82) return 'strong'
  if (score >= 70) return 'steady'
  if (score >= 58) return 'strained'
  return 'fragile'
}

function orchestraDiagnosis(score: number, weakest?: string): string {
  const weakPoint = weakest ? ` Watch ${weakest.toLowerCase()} before choosing heavy repertoire.` : ''
  if (score >= 82) return `The orchestra can carry an ambitious programme.${weakPoint}`
  if (score >= 70) return `The orchestra can carry a normal programme.${weakPoint}`
  if (score >= 58) return `A normal programme is possible, but the margin is thin.${weakPoint}`
  return `The orchestra is exposed. Keep the next programme playable.${weakPoint}`
}

function sectionStatus(strength: number): { label: string; tone: 'pine' | 'bark' | 'ember' } {
  if (strength >= 78) return { label: 'strong', tone: 'pine' }
  if (strength >= 66) return { label: 'steady', tone: 'bark' }
  if (strength >= 56) return { label: 'tense', tone: 'bark' }
  return { label: 'fragile', tone: 'ember' }
}

function stressFromStrength(strength: number): number {
  return Math.max(0, Math.min(100, 90 - strength))
}

function pickWatchPrincipals(principals: Principal[]): Principal[] {
  return [...principals]
    .sort((a, b) => a.form + a.morale - (b.form + b.morale))
    .slice(0, 3)
}

function suggestWorks(works: Work[], usedIds: Set<string>, n: number): Work[] {
  return [...works]
    .filter(w => !usedIds.has(w.id))
    .sort((a, b) => b.audienceDraw + b.artisticPrestige - (a.audienceDraw + a.artisticPrestige))
    .slice(0, n)
}
