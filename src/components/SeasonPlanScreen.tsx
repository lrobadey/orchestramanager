import type { ConcertForecast, ConcertProgram, InstitutionState, InstitutionalDeltas, SeasonState, Work } from '../types/core'
import ConsoleScreen from './ConsoleScreen'
import ProgramBuilder from './ProgramBuilder'
import SeasonTrail from './home/SeasonTrail'
import type { HomeNavKey } from './HomeConsole'
import { CONCERT_ROMAN } from '../data/numerals'
import '../styles/plan-season.css'

interface SeasonPlanScreenProps {
  institution: InstitutionState
  season: SeasonState
  deltas?: InstitutionalDeltas
  works: Work[]
  program: ConcertProgram
  forecast: ConcertForecast
  selectedSlot: number
  completeFlags: boolean[]
  planComplete: boolean
  onSelectSlot: (index: number) => void
  onBeginSeason: () => void
  onProgramChange: (next: ConcertProgram) => void
  registerSlotRef: (index: number, el: HTMLDivElement | null) => void
  onSlotDragEnd: (sourceIdx: number, point: { x: number; y: number }) => void
  onNavigate: (key: HomeNavKey) => void
}

export default function SeasonPlanScreen({
  institution,
  season,
  deltas,
  works,
  program,
  forecast,
  selectedSlot,
  completeFlags,
  planComplete,
  onSelectSlot,
  onBeginSeason,
  onProgramChange,
  registerSlotRef,
  onSlotDragEnd,
  onNavigate,
}: SeasonPlanScreenProps) {
  const completeCount = completeFlags.filter(Boolean).length
  const selectedName = season.slots[selectedSlot]?.name ?? ''

  return (
    <ConsoleScreen
      institution={institution}
      season={season}
      activeNav="programme"
      onNavigate={onNavigate}
      deltas={deltas}
      compact
      floorClass="plan-season-floor"
    >
      <div className="plan-season">
        <header className="plan-season-head">
          <div className="plan-season-head-copy">
            <span className="eyebrow">Found the season</span>
            <h1>Plan all four concerts before you open the doors.</h1>
            <p className="plan-season-sub">
              Pick a concert on the map, then build its program. The whole season is
              committed at once — once it begins, the plan is locked.
            </p>
          </div>
          <div className="plan-season-commit">
            <div className="plan-season-progress" aria-label="Concerts programmed">
              {completeFlags.map((done, i) => (
                <span
                  key={i}
                  className={`plan-season-pip ${done ? 'done' : ''}`}
                  title={`${season.slots[i]?.name ?? `Concert ${CONCERT_ROMAN[i]}`}: ${done ? 'programmed' : 'incomplete'}`}
                >
                  {CONCERT_ROMAN[i]}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="plan-season-begin"
              onClick={onBeginSeason}
              disabled={!planComplete}
            >
              {planComplete ? 'Begin Season' : `${completeCount}/4 concerts ready`}
            </button>
          </div>
        </header>

        <SeasonTrail
          season={season}
          selectable
          selectedIndex={selectedSlot}
          completeFlags={completeFlags}
          onSelect={onSelectSlot}
        />

        <div className="plan-season-editor">
          <div className="plan-season-editor-head">
            <span className="eyebrow">Now programming</span>
            <span className="plan-season-editor-title">
              {CONCERT_ROMAN[selectedSlot]} · {selectedName}
            </span>
          </div>

          <ProgramBuilder
            works={works}
            program={program}
            forecast={forecast}
            slotName={selectedName}
            registerSlotRef={registerSlotRef}
            isDragging={false}
            onToggleRepertoire={() => undefined}
            onSlotDragEnd={onSlotDragEnd}
            onProgramChange={onProgramChange}
            onRunConcert={() => undefined}
            showLaunch={false}
            rightRail={null}
          />
        </div>

        {/* Funding rail — the season's donor-funding picture lands here in the
            funding phase. Inert placeholder for now so the layout is reserved. */}
        <aside className="plan-season-funding" aria-label="Season funding (coming soon)">
          <div className="plan-season-funding-head">
            <span className="eyebrow">Season Funding</span>
            <span className="plan-season-funding-tag">Coming in funding phase</span>
          </div>
          <p className="plan-season-funding-note">
            Donors will sponsor each concert against its cost based on the repertoire you
            choose — coverage gaps will show up here per concert.
          </p>
          <div className="plan-season-funding-rows" aria-hidden="true">
            {season.slots.map((slot, i) => (
              <div key={slot.index} className="plan-season-funding-row">
                <span className="plan-season-funding-roman">{CONCERT_ROMAN[i]}</span>
                <span className="plan-season-funding-bar" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </ConsoleScreen>
  )
}
