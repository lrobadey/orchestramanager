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
import {
  FINANCE_SPARKLINE,
  INBOX_MESSAGES,
  VENUE_NAME,
  concertDate,
  daysToCurtain,
} from '../../data/homeStubs'
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
          <CollapsedRail label="Roster" value={`${compositeStrength}`} detail="composite" onExpand={() => setPanelCollapsed('roster', false)} />
        ) : (
          <RosterColumn sections={sectionStrengths} composite={compositeStrength} watch={watchPrincipals} onCollapse={() => setPanelCollapsed('roster', true)} />
        )}
        {collapsed.programme ? (
          <CollapsedRail label="Next" value={CONCERT_ROMAN[idx]} detail={seasonComplete ? 'closed' : `T−${daysToCurtain(idx)}d`} onExpand={() => setPanelCollapsed('programme', false)} />
        ) : (
          <NextConcertColumn slotName={currentSlot.name} idx={idx} workCount={program.workCount} selectedWorks={selectedWorks} suggested={suggested} seasonComplete={seasonComplete} onOpenProgramme={onOpenProgramme} onCollapse={() => setPanelCollapsed('programme', true)} />
        )}
        {collapsed.inbox ? (
          <CollapsedRail label="Inbox" value={`${INBOX_MESSAGES.length}`} detail="messages" onExpand={() => setPanelCollapsed('inbox', false)} />
        ) : (
          <InboxFinanceColumn institution={season.institution} onCollapse={() => setPanelCollapsed('inbox', true)} />
        )}
      </div>
    </div>
  )
}

function CollapsedRail({ label, value, detail, onExpand }: { label: string; value: string; detail: string; onExpand: () => void }) {
  return (
    <button type="button" className="floor-collapsed-rail" onClick={onExpand} aria-label={`Expand ${label}`}>
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
  return (
    <section className="floor-panel floor-panel-roster">
      <div className="floor-col-head">
        <span className="hc-eyebrow">Roster · sections</span>
        <span className="hc-num" style={{ fontSize: 9.5, color: 'var(--silver-dim)' }}>
          {composite}/100 composite
        </span>
        <button type="button" className="floor-collapse-btn" onClick={onCollapse} aria-label="Collapse roster panel">−</button>
      </div>
      <div className="floor-panel-body">
        <div className="hc-rule-silver" style={{ marginBottom: 12, opacity: 0.5 }} />
        {sections.map(s => {
          const stress = stressFromStrength(s.strength)
          const tone = stress > 50 ? 'ember' : stress > 30 ? 'bark' : 'pine'
          return (
            <div key={s.section} className="roster-section-row">
              <div className="roster-section-grid">
                <span className="roster-section-label">{s.label}</span>
                <span className="roster-section-strength hc-display">{s.strength}</span>
                <span className={`roster-section-stress ${tone}`}>STR {stress}</span>
              </div>
              <div className="roster-section-note">{s.note}</div>
            </div>
          )
        })}
        <div className="roster-watch">
          <span className="hc-eyebrow">Watch · principals</span>
          <div className="hc-rule-silver" style={{ margin: '6px 0 8px', opacity: 0.4 }} />
          {watch.map(p => (
            <div key={p.id} className="roster-watch-row">
              <span><span className="roster-watch-name">{p.name}</span><span className="roster-watch-position">{p.position}</span></span>
              <span className={`roster-watch-stat ${p.form < 60 ? 'low' : 'ok'}`}>F{p.form}</span>
              <span className={`roster-watch-stat ${p.morale < 60 ? 'low' : 'ok'}`}>M{p.morale}</span>
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
  workCount: 2 | 3
  selectedWorks: (Work | null)[]
  suggested: Work[]
  seasonComplete: boolean
  onOpenProgramme: () => void
  onCollapse: () => void
}

function NextConcertColumn({ slotName, idx, workCount, selectedWorks, suggested, seasonComplete, onOpenProgramme, onCollapse }: NextConcertColumnProps) {
  const days = daysToCurtain(idx)
  const date = concertDate(idx)
  const followUpDate = concertDate(Math.min(idx + 1, 3))

  return (
    <section className="floor-panel floor-panel-programme">
      <div className="floor-col-head">
        <span className="hc-eyebrow" style={{ color: 'var(--bark)' }}>The next concert</span>
        <span className="hc-eyebrow">{seasonComplete ? 'Season closed' : idx < 3 ? `Concert ${CONCERT_ROMAN[idx + 1]} follows on ${followUpDate}` : 'Final concert of the season'}</span>
        <button type="button" className="floor-collapse-btn" onClick={onCollapse} aria-label="Collapse programme panel">−</button>
      </div>
      <div className="floor-panel-body">
        <div className="hc-rule-brown" style={{ marginBottom: 12 }} />
        <div className="next-title-line"><span className="accent">{slotName}</span></div>
        <div className="next-meta">{VENUE_NAME} · {seasonComplete ? '—' : date}</div>
        <div className="next-slots">
          {selectedWorks.slice(0, workCount).map((w, i) => (
            <div key={i} className="next-slot-row">
              <span className="next-slot-roman">{SLOT_ROMAN[i] ?? `${i + 1}`}.</span>
              <div>{w ? <><span className="next-slot-title"><span className="next-slot-composer">{w.composer},</span> <span style={{ fontStyle: 'italic' }}>{w.title}</span></span><div className="next-slot-hint">{w.durationMinutes}m · P{w.artisticPrestige} · D{w.audienceDraw} · L{w.rehearsalLoad}</div></> : <><span className="next-slot-title empty">— open —</span><div className="next-slot-hint">{SLOT_HINTS[i] ?? 'Open slot'}</div></>}</div>
              <span className="next-slot-assign">{w ? 'ASSIGNED' : '＋ ASSIGN'}</span>
            </div>
          ))}
        </div>
        <div className="next-suggested">
          <span className="hc-eyebrow">From the library · suggested</span>
          <div className="hc-rule-silver" style={{ margin: '6px 0 8px', opacity: 0.4 }} />
          {suggested.map(w => (
            <div key={w.id} className="next-suggested-row">
              <span><span className="next-suggested-name">{w.composer},</span> <span className="next-suggested-title">{w.title}</span></span>
              <span className="next-suggested-stat muted">{w.durationMinutes}m</span>
              <span className="next-suggested-stat">P{w.artisticPrestige}</span>
              <span className="next-suggested-stat">D{w.audienceDraw}</span>
              <span className={`next-suggested-stat${w.rehearsalLoad > 60 ? ' ember' : ' muted'}`}>L{w.rehearsalLoad}</span>
            </div>
          ))}
        </div>
        <button type="button" className="next-cta" onClick={onOpenProgramme}>
          <span className="next-cta-arrow">▸</span>
          <span className="next-cta-label">{seasonComplete ? 'Open Season Summary' : `Open Programme Builder for ${CONCERT_ROMAN[idx]}`}</span>
          <span className="next-cta-trail">{seasonComplete ? 'IV / IV' : `T−${days}d`}</span>
        </button>
      </div>
    </section>
  )
}

function InboxFinanceColumn({ institution, onCollapse }: { institution: InstitutionState; onCollapse: () => void }) {
  const netK = FINANCE_SPARKLINE.reduce((a, b) => a + b, 0)
  const donor = institution.donorConfidence
  const financeNote = donor < 35 ? { tone: 'ember' as const, text: 'Donor confidence is sliding — the next concert needs a steadying result.' } : donor < 55 ? { tone: 'ember' as const, text: 'Donor confidence is soft — keep an eye on the next report.' } : { tone: 'pine' as const, text: 'Donors are holding — the institution has room to take a risk.' }
  return (
    <section className="floor-panel floor-panel-inbox">
      <div className="floor-col-head">
        <span className="hc-eyebrow">Inbox</span>
        <span className="hc-num" style={{ fontSize: 9, color: 'var(--bark)' }}>{INBOX_MESSAGES.length} STUB</span>
        <button type="button" className="floor-collapse-btn" onClick={onCollapse} aria-label="Collapse inbox panel">−</button>
      </div>
      <div className="floor-panel-body">
        <div className="hc-rule-silver" style={{ marginBottom: 8, opacity: 0.5 }} />
        {INBOX_MESSAGES.map((m, i) => <div key={i} className="inbox-msg"><div className="inbox-meta"><span className="inbox-kind">{m.kind}</span><span className="inbox-time">{m.time}</span></div><div className="inbox-text">{m.text}</div></div>)}
        <div className="inbox-stub-flag">— stub messages, no event sim yet —</div>
        <div className="finance-trace">
          <div className="finance-trace-head"><span className="hc-eyebrow">Finance · 14 wk trace (stub)</span><span className="hc-num" style={{ fontSize: 9.5, color: 'var(--pine)' }}>+${netK}K net</span></div>
          <div className="hc-rule-silver" style={{ marginBottom: 8, opacity: 0.5 }} />
          <svg className="finance-spark" viewBox="0 0 300 44" preserveAspectRatio="none" role="img" aria-label="Finance sparkline (stub)">
            <line x1="0" y1="34" x2="300" y2="34" stroke="var(--hairline)" strokeWidth="0.5" />
            <polyline points={FINANCE_SPARKLINE.map((v, i) => `${(i / (FINANCE_SPARKLINE.length - 1)) * 300},${42 - v * 1.4}`).join(' ')} fill="none" stroke="var(--silver)" strokeWidth="1.2" />
            {FINANCE_SPARKLINE.map((v, i) => <circle key={i} cx={(i / (FINANCE_SPARKLINE.length - 1)) * 300} cy={42 - v * 1.4} r="1.4" fill="var(--silver)" />)}
          </svg>
          <div className="finance-note"><span className={`hc-dot ${financeNote.tone}`} style={{ marginTop: 4 }} /><span className={`finance-note-text ${financeNote.tone}`}>{financeNote.text}</span></div>
        </div>
      </div>
    </section>
  )
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
