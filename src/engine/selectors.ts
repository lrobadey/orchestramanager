import { works } from '../data/works'
import { cityAudienceSegments } from '../data/audienceSegments'
import { forecastProgram } from '../sim/forecastProgram'
import {
  computeOperatingSupport,
  computeSeasonFunding,
  type SeasonFundingConcertInput,
  type SeasonFundingResult,
} from '../sim/seasonFunding'
import { computeConcertBreach, type ConcertBreachResult } from '../sim/seasonBreach'
import { START_GOODWILL } from '../sim/seasonSway'
import { isProgramComplete, isSeasonPlanComplete } from '../sim/founding'
import type { ConcertForecast, ConcertProgram } from '../types/core'
import type { GameState } from './state'

// Pure derived views over GameState. The React hook wraps these in useMemo and
// the CLI calls them directly, so both interfaces always compute the same
// numbers from the same state.

// Pre-season the "active" slot is whichever the caller is editing; in-season it
// is the concert currently up for resolution.
export function getActiveProgramIndex(state: GameState, uiSelectedSlot = 0): number {
  return state.seasonStarted ? Math.min(state.season.currentSlotIndex, 3) : uiSelectedSlot
}

// The program a given slot currently reads as: the staged revision when one is
// open on the active in-season concert, otherwise the plan/committed program.
export function getActiveProgram(state: GameState, slotIndex: number): ConcertProgram {
  const activeIndex = getActiveProgramIndex(state)
  if (state.editDraft && state.seasonStarted && slotIndex === activeIndex) {
    return state.editDraft
  }
  return state.draftPrograms[slotIndex]
}

export function isPlanComplete(state: GameState): boolean {
  return isSeasonPlanComplete(state.draftPrograms)
}

// Live donor auto-fill while planning: each programmed concert's cost becomes
// an ask, and the deterministic engine fills it from aligned donor capacity.
// Only fully-programmed concerts are scored; coverage grows as the plan fills.
export function computeLiveSeasonFunding(state: GameState): SeasonFundingResult {
  const concerts: SeasonFundingConcertInput[] = state.draftPrograms.map((draft, index) => ({
    id: `concert-${index}`,
    index,
    name: state.season.slots[index]?.name ?? `Concert ${index + 1}`,
    program: isProgramComplete(draft) ? draft : null,
  }))
  return computeSeasonFunding({
    donors: state.season.donors.donors,
    concerts,
    works,
    institution: state.season.institution,
    audienceState: state.season.audience,
    sway: state.sway,
  })
}

// The funding concerts should read against: the frozen commitment once the
// season begins, the live auto-fill while still planning.
export function getEffectiveFunding(state: GameState): SeasonFundingResult {
  return state.seasonStarted && state.season.funding
    ? state.season.funding
    : computeLiveSeasonFunding(state)
}

export function getGoodwillRemaining(state: GameState): number {
  return Math.max(0, START_GOODWILL - getEffectiveFunding(state).goodwillSpent)
}

export function getOperatingSupportPerConcert(state: GameState): number {
  return computeOperatingSupport({
    donors: state.season.donors.donors,
    institution: state.season.institution,
    audienceState: state.season.audience,
    concertCount: state.season.slots.length,
  }).reduce((sum, donor) => sum + donor.perConcertAmount, 0)
}

export function getForecastForSlot(state: GameState, slotIndex: number): ConcertForecast {
  const funding = getEffectiveFunding(state)
  const fundingConcert = funding.concerts.find(concert => concert.concertIndex === slotIndex)
  return forecastProgram({
    works,
    institution: state.season.institution,
    principals: state.season.roster.principals,
    cityAudienceSegments,
    audienceState: state.season.audience,
    program: getActiveProgram(state, slotIndex),
    donorState: state.season.donors,
    donorIncome: fundingConcert?.pledged,
    operatingSupport: getOperatingSupportPerConcert(state),
  })
}

// Live breach preview while revising: who would withdraw, and how much, if the
// current draft were confirmed. Nothing is applied until confirmEdit.
export function computeBreachPreview(state: GameState): ConcertBreachResult | null {
  if (!state.editDraft || !state.season.funding) return null
  const idx = getActiveProgramIndex(state)
  const committedConcert = state.season.funding.concerts.find(c => c.concertIndex === idx)
  if (!committedConcert) return null
  return computeConcertBreach({
    donors: state.season.donors.donors,
    committedProgram: state.draftPrograms[idx],
    newProgram: state.editDraft,
    committedPledges: committedConcert.pledges,
    works,
    institution: state.season.institution,
    concertIndex: idx,
    concertName: state.season.slots[idx].name,
  })
}
