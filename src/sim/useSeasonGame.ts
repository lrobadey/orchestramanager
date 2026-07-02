import { useMemo, useState } from 'react'
import { works } from '../data/works'
import { startingInstitution } from '../data/institution'
import { dedicationsUsed, MAX_DEDICATIONS, START_GOODWILL } from './seasonSway'
import { createNewGame, type GameState } from '../engine/state'
import {
  computeBreachPreview,
  computeLiveSeasonFunding,
  getActiveProgram,
  getActiveProgramIndex,
  getForecastForSlot,
  isPlanComplete,
} from '../engine/selectors'
import * as engine from '../engine/actions'
import { EngineError } from '../engine/errors'
import { ConcertProgram, SlotTuple } from '../types/core'
import type { HomeNavKey } from '../components/HomeConsole'

export type Phase = 'planning' | 'report'
export type MainView =
  | 'enter'
  | 'founding'
  | 'plan-season'
  | 'home'
  | 'programme'
  | 'roster'
  | 'library'
  | 'ledger'
  | 'donors'
  | 'audience'

// The UI ignores illegal moves (a disabled button that still fires, a stale
// click) rather than surfacing engine refusals, so swallow EngineError and
// keep the previous state — the same silent no-op the old hook implemented
// with early returns.
function guard(fn: () => GameState, prev: GameState): GameState {
  try {
    return fn()
  } catch (error) {
    if (error instanceof EngineError) return prev
    throw error
  }
}

// Thin React shell over the pure engine: all rules live in src/engine/, this
// hook holds one GameState plus UI-only state (selected slot, current view)
// and re-derives the display values the components expect.
export function useSeasonGame() {
  const [game, setGame] = useState<GameState>(() => createNewGame(startingInstitution.name))
  // Which slot the season-plan screen is editing (pre-season only).
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [mainView, setMainView] = useState<MainView>('enter')

  const season = game.season
  const institution = season.institution
  const seasonStarted = game.seasonStarted
  const report = game.pendingReport
  const phase: Phase = report ? 'report' : 'planning'
  const seasonComplete = season.currentSlotIndex >= 4

  const activeProgramIndex = getActiveProgramIndex(game, selectedSlot)
  const isEditing = seasonStarted && game.editDraft != null
  const program = getActiveProgram(game, activeProgramIndex)

  const planComplete = useMemo(() => isPlanComplete(game), [game])

  // Live donor auto-fill while planning; the frozen commitment lives in
  // season.funding once the season begins.
  const seasonFunding = useMemo(() => computeLiveSeasonFunding(game), [game])
  const goodwillRemaining = Math.max(0, START_GOODWILL - seasonFunding.goodwillSpent)

  const forecast = useMemo(
    () => getForecastForSlot(game, activeProgramIndex),
    [game, activeProgramIndex],
  )

  const breachPreview = useMemo(() => computeBreachPreview(game), [game])

  // The committed funding for the concert currently being revised (for coverage
  // context in the revise UI).
  const editingConcertFunding = isEditing
    ? season.funding?.concerts.find(c => c.concertIndex === activeProgramIndex) ?? null
    : null

  function apply(action: (state: GameState) => GameState) {
    setGame(prev => guard(() => action(prev), prev))
  }

  function toggleDedication(concertIndex: number, donorId: string) {
    apply(g => engine.toggleDedication(g, concertIndex, donorId))
  }

  function setAsk(donorId: string, concertIndex: number, target: number) {
    apply(g => engine.setAsk(g, donorId, concertIndex, target))
  }

  function toggleRestricted(donorId: string, concertIndex: number) {
    apply(g => engine.toggleRestricted(g, donorId, concertIndex))
  }

  function setProgram(next: ConcertProgram) {
    apply(g => engine.setProgram(g, getActiveProgramIndex(g, selectedSlot), next))
  }

  function confirmEdit() {
    apply(engine.confirmEdit)
  }

  function cancelEdit() {
    apply(engine.cancelEdit)
  }

  function beginSeason() {
    if (!planComplete || seasonStarted) return
    apply(engine.beginSeason)
    setMainView('home')
  }

  function handleRunConcert() {
    apply(g => engine.runConcert(g, Math.random() * 100))
  }

  function applyPendingReport() {
    apply(engine.applyPendingReport)
  }

  function handleDone() {
    applyPendingReport()
    setMainView('home')
  }

  function navigateTo(view: MainView) {
    if (phase === 'report') applyPendingReport()
    setMainView(view)
  }

  function handleFoundOrchestra(name: string) {
    apply(g => engine.renameOrchestra(g, name))
  }

  function selectSlot(index: number) {
    if (index < 0 || index > 3) return
    setSelectedSlot(index)
  }

  function handleNewSeason() {
    apply(engine.startNewSeason)
    setSelectedSlot(0)
    setMainView('plan-season')
  }

  function handleHomeNavigate(key: HomeNavKey) {
    navigateTo(key)
  }

  const slotWorks: SlotTuple<ReturnType<typeof works.find>> = [
    program.workIds[0] ? works.find(w => w.id === program.workIds[0]) : undefined,
    program.workIds[1] ? works.find(w => w.id === program.workIds[1]) : undefined,
    program.workIds[2] ? works.find(w => w.id === program.workIds[2]) : undefined,
  ]
  const filledSlotWorks = slotWorks
    .slice(0, program.workCount)
    .filter((w): w is NonNullable<typeof w> => w !== undefined)

  const currentSlotName = !seasonComplete ? season.slots[activeProgramIndex].name : null

  // Movement shown on the vitals strip is the institutional delta from the most
  // recently resolved concert. currentSlotIndex points at the next pending slot,
  // so the last resolved slot is the one immediately before it.
  const lastResolvedSlot = season.currentSlotIndex > 0 ? season.slots[season.currentSlotIndex - 1] : null
  const lastDeltas = lastResolvedSlot?.report?.institutionalDeltas

  return {
    season,
    program,
    setProgram,
    setMainView,
    phase,
    mainView,
    report,
    institution,
    seasonComplete,
    seasonStarted,
    forecast,
    draftPrograms: game.draftPrograms,
    selectedSlot,
    selectSlot,
    planComplete,
    seasonFunding,
    sway: game.sway,
    goodwillRemaining,
    dedicationsUsed: dedicationsUsed(game.sway),
    maxDedications: MAX_DEDICATIONS,
    toggleDedication,
    setAsk,
    toggleRestricted,
    isEditing,
    breachPreview,
    editingConcertFunding,
    confirmEdit,
    cancelEdit,
    beginSeason,
    slotWorks,
    filledSlotWorks,
    currentSlotName,
    lastDeltas,
    handleRunConcert,
    handleDone,
    navigateTo,
    handleNewSeason,
    handleHomeNavigate,
    handleFoundOrchestra,
  }
}
