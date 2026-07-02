import { works } from '../data/works'
import { cityAudienceSegments } from '../data/audienceSegments'
import { resolveConcert } from '../sim/resolveConcert'
import { resolveSeasonConcert } from '../sim/season'
import { scoreDonorConcertFundingFit } from '../sim/seasonFunding'
import { computeConcertBreach, applyBreachToFunding } from '../sim/seasonBreach'
import { swayKey, MAX_DEDICATIONS } from '../sim/seasonSway'
import { clamp } from '../sim/scoring'
import { isValidOrchestraName, sanitizeOrchestraName } from '../sim/founding'
import type { ConcertProgram } from '../types/core'
import { EngineError } from './errors'
import { createNewGame, type GameState, type SeasonPrograms } from './state'
import {
  computeLiveSeasonFunding,
  getActiveProgramIndex,
  getForecastForSlot,
  getOperatingSupportPerConcert,
  isPlanComplete,
} from './selectors'

// Pure player actions: GameState in, new GameState out. Logic is moved from
// useSeasonGame with one deliberate change — illegal moves throw EngineError
// instead of silently no-oping. The React hook catches and ignores; headless
// callers get a refusal they can read.

function requirePlanning(state: GameState, what: string): void {
  if (state.seasonStarted) {
    throw new EngineError('season-already-started', `${what} is only available while planning, before the season begins.`)
  }
}

function requireSlot(slotIndex: number): void {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 3) {
    throw new EngineError('invalid-slot', `Slot must be 0-3, got ${slotIndex}.`)
  }
}

function requireDonor(state: GameState, donorId: string): void {
  if (!state.season.donors.donors.some(donor => donor.id === donorId)) {
    throw new EngineError('unknown-donor', `No donor with id "${donorId}".`)
  }
}

function validateProgram(program: ConcertProgram): void {
  for (const id of program.workIds.slice(0, program.workCount)) {
    if (id !== null && !works.some(work => work.id === id)) {
      throw new EngineError('unknown-work', `No work with id "${id}".`)
    }
  }
}

// Pre-season this edits the plan in place. In-season, edits to the active
// concert stage into a revision draft — the change (and any donor breach) only
// lands on confirmEdit.
export function setProgram(state: GameState, slotIndex: number, program: ConcertProgram): GameState {
  requireSlot(slotIndex)
  validateProgram(program)
  if (state.seasonStarted) {
    if (state.season.currentSlotIndex >= 4) {
      throw new EngineError('season-complete', 'The season is over; no concert is open for revision.')
    }
    if (state.pendingReport) {
      throw new EngineError('pending-report-open', 'A concert report is pending; advance before revising.')
    }
    if (slotIndex !== state.season.currentSlotIndex) {
      throw new EngineError(
        'invalid-slot',
        `Only the active concert (slot ${state.season.currentSlotIndex}) can be revised in-season.`,
      )
    }
    return { ...state, editDraft: program }
  }
  const draftPrograms = [...state.draftPrograms] as SeasonPrograms
  draftPrograms[slotIndex] = program
  return { ...state, draftPrograms }
}

// Dedicate a concert to a donor (their "home night"). A donor holds at most
// one; the season holds at most MAX_DEDICATIONS. Toggling an existing pairing
// clears it.
export function toggleDedication(state: GameState, concertIndex: number, donorId: string): GameState {
  requirePlanning(state, 'Dedication')
  requireSlot(concertIndex)
  requireDonor(state, donorId)
  const dedications = [...state.sway.dedications]
  if (dedications[concertIndex] === donorId) {
    dedications[concertIndex] = null
    return { ...state, sway: { ...state.sway, dedications } }
  }
  const heldElsewhere = dedications.indexOf(donorId)
  if (heldElsewhere >= 0) dedications[heldElsewhere] = null
  const usedAfter = dedications.filter((d, i) => i !== concertIndex && d).length + 1
  if (usedAfter > MAX_DEDICATIONS) {
    throw new EngineError('dedication-limit', `At most ${MAX_DEDICATIONS} dedications per season.`)
  }
  dedications[concertIndex] = donorId
  return { ...state, sway: { ...state.sway, dedications } }
}

// Set the absolute pledge target the player is asking a donor for on a concert.
export function setAsk(state: GameState, donorId: string, concertIndex: number, target: number): GameState {
  requirePlanning(state, 'Setting an ask')
  requireSlot(concertIndex)
  requireDonor(state, donorId)
  return {
    ...state,
    sway: {
      ...state.sway,
      asks: { ...state.sway.asks, [swayKey(donorId, concertIndex)]: Math.max(0, Math.round(target)) },
    },
  }
}

export function toggleRestricted(state: GameState, donorId: string, concertIndex: number): GameState {
  requirePlanning(state, 'Restricting an ask')
  requireSlot(concertIndex)
  requireDonor(state, donorId)
  const key = swayKey(donorId, concertIndex)
  const restricted = { ...state.sway.restricted }
  if (restricted[key]) delete restricted[key]
  else restricted[key] = true
  return { ...state, sway: { ...state.sway, restricted } }
}

// "Make the ask": freeze the live auto-fill into season state. From here the
// committed pledges (and their realized amounts) are what concerts resolve
// against. The ask also leaves a mark on the donors — a dedication warms them,
// an over-push cools them (mild drift).
export function beginSeason(state: GameState): GameState {
  requirePlanning(state, 'Beginning the season')
  if (!isPlanComplete(state)) {
    throw new EngineError('plan-incomplete', 'All four concerts must be fully programmed before the season begins.')
  }
  const funding = computeLiveSeasonFunding(state)
  const donors = state.season.donors.donors.map(donor => {
    const delta = funding.donors.find(result => result.donorId === donor.id)?.relationshipDelta ?? 0
    return delta ? { ...donor, relationship: clamp(donor.relationship + delta, 0, 100) } : donor
  })
  return {
    ...state,
    season: { ...state.season, funding, donors: { donors } },
    seasonStarted: true,
  }
}

// Confirm a revision: swap in the new program, then apply any donor breach —
// pledges shrink, donors cool, doors can close, and the reduced money flows to
// cash when the concert resolves.
export function confirmEdit(state: GameState): GameState {
  if (!state.editDraft) {
    throw new EngineError('no-edit-open', 'No revision draft is open.')
  }
  const editDraft = state.editDraft
  const idx = getActiveProgramIndex(state)
  const funding = state.season.funding
  let season = state.season
  if (funding) {
    const committedConcert = funding.concerts.find(c => c.concertIndex === idx)
    const breach = computeConcertBreach({
      donors: state.season.donors.donors,
      committedProgram: state.draftPrograms[idx],
      newProgram: editDraft,
      committedPledges: committedConcert?.pledges ?? [],
      works,
      institution: state.season.institution,
      concertIndex: idx,
      concertName: state.season.slots[idx].name,
    })
    const concertCapacityByDonorId = new Map(
      funding.donors.map(donor => [donor.donorId, donor.concertCapacity]),
    )
    const newFits = state.season.donors.donors.map(donor =>
      scoreDonorConcertFundingFit({
        donor,
        concert: { index: idx, name: state.season.slots[idx].name, program: editDraft },
        works,
        institution: state.season.institution,
        capacity: concertCapacityByDonorId.get(donor.id),
      }),
    )
    const newFunding = applyBreachToFunding({ funding, concertIndex: idx, breach, newFits })
    const coolByDonor = new Map(breach.withdrawals.map(w => [w.donorId, w]))
    const cooledDonors = state.season.donors.donors.map(donor => {
      const w = coolByDonor.get(donor.id)
      if (!w) return donor
      return {
        ...donor,
        relationship: clamp(donor.relationship + w.relationshipDelta, 0, 100),
        loyalty: clamp(donor.loyalty + w.loyaltyDelta, 0, 100),
      }
    })
    season = { ...season, funding: newFunding, donors: { donors: cooledDonors } }
  }
  const draftPrograms = [...state.draftPrograms] as SeasonPrograms
  draftPrograms[idx] = editDraft
  return { ...state, season, draftPrograms, editDraft: null }
}

export function cancelEdit(state: GameState): GameState {
  if (!state.editDraft) {
    throw new EngineError('no-edit-open', 'No revision draft is open.')
  }
  return { ...state, editDraft: null }
}

// Resolve the active concert against the committed program. The roll (0-100,
// 50 = neutral) is the game's single stochastic input; the caller supplies it —
// seeded, fixed, or Math.random — so the engine itself stays deterministic.
export function runConcert(state: GameState, roll: number): GameState {
  if (!state.seasonStarted) {
    throw new EngineError('season-not-started', 'The season has not begun; commit the plan first.')
  }
  if (state.season.currentSlotIndex >= 4) {
    throw new EngineError('season-complete', 'All four concerts have been performed.')
  }
  if (state.pendingReport) {
    throw new EngineError('pending-report-open', 'A concert report is already pending; advance first.')
  }
  if (state.editDraft) {
    throw new EngineError('edit-open', 'A revision draft is open; confirm or cancel it before the concert.')
  }
  if (!Number.isFinite(roll) || roll < 0 || roll > 100) {
    throw new EngineError('invalid-roll', `Roll must be 0-100, got ${roll}.`)
  }
  const slotIndex = state.season.currentSlotIndex
  const forecast = getForecastForSlot(state, slotIndex)
  if (!forecast.isComplete) {
    throw new EngineError('plan-incomplete', `Concert ${slotIndex} is not fully programmed.`)
  }
  // The night's donor income is the committed pledges that latched to this
  // concert, realized with their volatility.
  const committedConcert = state.season.funding?.concerts.find(
    concert => concert.concertIndex === slotIndex,
  )
  const report = resolveConcert({
    works,
    institution: state.season.institution,
    principals: state.season.roster.principals,
    cityAudienceSegments,
    audienceState: state.season.audience,
    program: state.draftPrograms[slotIndex],
    donorState: state.season.donors,
    donorIncome: committedConcert?.realized,
    operatingSupport: getOperatingSupportPerConcert(state),
    isOpeningNight: slotIndex === 0,
    roll,
  })
  return { ...state, pendingReport: report, pendingRoll: roll }
}

// Commit the pending report: the concert's consequences land on the season and
// the active slot advances.
export function applyPendingReport(state: GameState): GameState {
  if (!state.pendingReport) {
    throw new EngineError('no-pending-report', 'No concert report is pending.')
  }
  const season = resolveSeasonConcert(
    state.season,
    state.draftPrograms[state.season.currentSlotIndex],
    state.pendingReport,
    works,
  )
  // The active concert advances; drop any stale revision draft.
  return { ...state, season, pendingReport: null, pendingRoll: null, editDraft: null }
}

export function startNewSeason(state: GameState): GameState {
  return createNewGame(state.season.institution.name)
}

export function renameOrchestra(state: GameState, name: string): GameState {
  if (!isValidOrchestraName(name)) {
    throw new EngineError('invalid-name', 'Orchestra name must be at least 2 characters.')
  }
  const cleanName = sanitizeOrchestraName(name)
  return {
    ...state,
    season: {
      ...state.season,
      institution: { ...state.season.institution, name: cleanName },
    },
  }
}
