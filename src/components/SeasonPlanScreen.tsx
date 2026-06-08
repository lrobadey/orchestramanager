import { useMemo, useState } from 'react'
import type { ConcertForecast, ConcertProgram, InstitutionState, InstitutionalDeltas, SeasonState, SlotTuple, Work } from '../types/core'
import ConsoleScreen from './ConsoleScreen'
import ProgramBuilder from './ProgramBuilder'
import ConcertForecastView from './ConcertForecast'
import SeasonTrail from './home/SeasonTrail'
import SeasonFundingPanel from './funding/SeasonFundingPanel'
import type { HomeNavKey } from './HomeConsole'
import type { SeasonFundingResult } from '../sim/seasonFunding'
import type { SwayState } from '../sim/seasonSway'
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
  funding: SeasonFundingResult
  sway: SwayState
  goodwillRemaining: number
  dedicationsUsed: number
  maxDedications: number
  onToggleDedicate: (concertIndex: number, donorId: string) => void
  onAdjustAsk: (donorId: string, concertIndex: number, target: number) => void
  onToggleRestrict: (donorId: string, concertIndex: number) => void
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
  funding,
  sway,
  goodwillRemaining,
  dedicationsUsed,
  maxDedications,
  onToggleDedicate,
  onAdjustAsk,
  onToggleRestrict,
  onSelectSlot,
  onBeginSeason,
  onProgramChange,
  registerSlotRef,
  onSlotDragEnd,
  onNavigate,
}: SeasonPlanScreenProps) {
  const completeCount = completeFlags.filter(Boolean).length
  const selectedName = season.slots[selectedSlot]?.name ?? ''

  // Three workspaces, swapped under a persistent trail spine: the artistic
  // build, the season's money, and the live read on the selected concert.
  const [activeTab, setActiveTab] = useState<'program' | 'funding' | 'forecast'>('program')

  const forecastSlotWorks = useMemo(
    () =>
      program.workIds.map(id => (id ? works.find(work => work.id === id) ?? undefined : undefined)) as SlotTuple<
        Work | undefined
      >,
    [program.workIds, works],
  )

  // Soft funding gate: the player may begin a season with exposed concerts
  // ("fund it anyway because it's who you are"), but an underfunded plan asks
  // for explicit confirmation first.
  const [confirmingExposed, setConfirmingExposed] = useState(false)
  const exposedCount = funding.concerts.filter(concert => concert.coveragePercent < 0.999).length
  const totalGap = funding.concerts.reduce((sum, concert) => sum + concert.gap, 0)

  function handleBegin() {
    if (!planComplete) return
    if (exposedCount > 0 && !confirmingExposed) {
      setConfirmingExposed(true)
      return
    }
    onBeginSeason()
  }

  return (
    <ConsoleScreen
      institution={institution}
      season={season}
      activeNav="programme"
      onNavigate={onNavigate}
      deltas={deltas}
      compact
      navless
      strataClass="plan-season-strata"
      floorClass="plan-season-floor"
    >
      <div className="plan-season">
        <header className="plan-season-head">
          <div className="plan-season-head-copy">
            <span className="eyebrow">Found the season</span>
            <h1>Plan all four concerts before you open the doors.</h1>
            <p className="plan-season-sub">
              Pick a concert on the map, then build its program. The whole season commits at once.
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
            {confirmingExposed ? (
              <div className="plan-season-confirm" role="alertdialog" aria-label="Confirm underfunded season">
                <p className="plan-season-confirm-note">
                  {exposedCount === 1 ? 'One concert is' : `${exposedCount} concerts are`} underfunded —{' '}
                  <strong>{`$${Math.round(totalGap).toLocaleString()}`}</strong> uncovered. Begin anyway and
                  cover the gap from cash?
                </p>
                <div className="plan-season-confirm-actions">
                  <button type="button" className="plan-season-begin exposed" onClick={onBeginSeason}>
                    Begin exposed →
                  </button>
                  <button
                    type="button"
                    className="plan-season-keep"
                    onClick={() => setConfirmingExposed(false)}
                  >
                    Keep planning
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={`plan-season-begin ${planComplete && exposedCount > 0 ? 'exposed' : ''}`}
                onClick={handleBegin}
                disabled={!planComplete}
              >
                {!planComplete
                  ? `${completeCount}/4 concerts ready`
                  : exposedCount > 0
                    ? `Begin Season — ${exposedCount} exposed`
                    : 'Begin Season'}
              </button>
            )}
          </div>
        </header>

        {/* The trail is a pure navigation spine — it picks the concert and
            shows which are programmed. All money lives in the Funding tab. */}
        <SeasonTrail
          season={season}
          selectable
          selectedIndex={selectedSlot}
          completeFlags={completeFlags}
          onSelect={onSelectSlot}
        />

        <div className="plan-tabs" role="tablist" aria-label="Planning workspace">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'program'}
            className={`plan-tab ${activeTab === 'program' ? 'active' : ''}`}
            onClick={() => setActiveTab('program')}
          >
            Program
            <span className="plan-tab-meta">{CONCERT_ROMAN[selectedSlot]} · {selectedName}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'funding'}
            className={`plan-tab ${activeTab === 'funding' ? 'active' : ''}`}
            onClick={() => setActiveTab('funding')}
          >
            Funding
            <span className={`plan-tab-meta ${exposedCount > 0 ? 'tone-short' : 'tone-covered'}`}>
              {completeCount > 0
                ? exposedCount > 0
                  ? `${exposedCount} exposed`
                  : 'fully pledged'
                : 'awaiting programs'}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'forecast'}
            className={`plan-tab ${activeTab === 'forecast' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecast')}
          >
            Forecast
            <span className={`plan-tab-meta ${forecast.isComplete ? 'tone-covered' : ''}`}>
              {forecast.isComplete ? '● live' : '○ awaiting'}
            </span>
          </button>
        </div>

        <div className="plan-tab-panel" role="tabpanel">
          {activeTab === 'program' && (
            <div className="plan-season-editor">
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
                showForecast={false}
                rightRail={null}
              />
            </div>
          )}

          {activeTab === 'funding' && (
            <SeasonFundingPanel
              funding={funding}
              season={season}
              completeFlags={completeFlags}
              selectedSlot={selectedSlot}
              sway={sway}
              goodwillRemaining={goodwillRemaining}
              dedicationsUsed={dedicationsUsed}
              maxDedications={maxDedications}
              onToggleDedicate={onToggleDedicate}
              onAdjustAsk={onAdjustAsk}
              onToggleRestrict={onToggleRestrict}
            />
          )}

          {activeTab === 'forecast' && (
            <div className="plan-forecast-tab">
              <div className="plan-forecast-context">
                <span className="eyebrow">Live read</span>
                <span className="plan-season-editor-title">
                  {CONCERT_ROMAN[selectedSlot]} · {selectedName}
                </span>
              </div>
              <ConcertForecastView
                forecast={forecast}
                slotWorks={forecastSlotWorks}
                workCount={program.workCount}
              />
            </div>
          )}
        </div>
      </div>
    </ConsoleScreen>
  )
}
