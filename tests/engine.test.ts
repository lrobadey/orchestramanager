import { describe, expect, it } from 'vitest'
import { works } from '../src/data/works'
import { principals } from '../src/data/principals'
import { cityAudienceSegments } from '../src/data/audienceSegments'
import { startingInstitution } from '../src/data/institution'
import {
  createInitialSeason,
  getAllFinanceTransactions,
  resolveSeasonConcert,
  summarizeSeason,
} from '../src/sim/season'
import {
  computeOperatingSupport,
  computeSeasonFunding,
  type SeasonFundingConcertInput,
} from '../src/sim/seasonFunding'
import { resolveConcert } from '../src/sim/resolveConcert'
import { createNewGame, getPhase, type GameState } from '../src/engine/state'
import {
  applyPendingReport,
  beginSeason,
  cancelEdit,
  confirmEdit,
  runConcert,
  setAsk,
  setProgram,
  startNewSeason,
  toggleDedication,
  toggleRestricted,
} from '../src/engine/actions'
import { computeBreachPreview, computeLiveSeasonFunding } from '../src/engine/selectors'
import { EngineError } from '../src/engine/errors'
import type { ConcertProgram } from '../src/types/core'

// The engine is the extracted, headless form of the season loop the React hook
// used to own. These tests prove the extraction is faithful (same programs and
// roll produce the same season as driving the raw sim directly) and that
// illegal moves refuse loudly instead of silently no-oping.

function makeProgram(
  workIds: [string, string, string],
  alloc: [number, number, number],
  overrides: Partial<ConcertProgram> = {},
): ConcertProgram {
  return {
    workCount: 3,
    workIds,
    intermissionAfter: 1,
    rehearsalAllocation: alloc,
    marketingSpend: 15_000,
    marketingStyle: 'digital',
    ticketPrice: 70,
    studentTicketsEnabled: false,
    studentTicketPrice: 25,
    ...overrides,
  }
}

const programs: ConcertProgram[] = [
  makeProgram(['beethoven-egmont', 'first-desk-concerto', 'beethoven-5'], [4, 7, 9]),
  makeProgram(['mozart-don-giovanni-overture', 'signal-fires', 'brahms-2'], [3, 7, 10]),
  makeProgram(['debussy-faune', 'night-ferry', 'sibelius-2'], [4, 8, 8]),
  makeProgram(['smetana-vltava', 'city-light-machines', 'tchaikovsky-5'], [4, 6, 10]),
]

function planSeason(): GameState {
  let game = createNewGame(startingInstitution.name)
  programs.forEach((program, index) => {
    game = setProgram(game, index, program)
  })
  return game
}

function playSeason(): GameState {
  let game = beginSeason(planSeason())
  for (let i = 0; i < 4; i++) {
    game = applyPendingReport(runConcert(game, 50))
  }
  return game
}

// The same season driven directly against the sim, as seasonLoop.test.ts does.
function playSeasonRaw() {
  let season = createInitialSeason(startingInstitution, principals)
  const concerts: SeasonFundingConcertInput[] = programs.map((program, index) => ({
    id: `concert-${index}`,
    index,
    name: season.slots[index].name,
    program,
  }))
  const funding = computeSeasonFunding({
    donors: season.donors.donors,
    concerts,
    works,
    institution: season.institution,
    audienceState: season.audience,
  })
  season = { ...season, funding }
  for (let i = 0; i < 4; i++) {
    const operatingSupport = computeOperatingSupport({
      donors: season.donors.donors,
      institution: season.institution,
      audienceState: season.audience,
      concertCount: 4,
    }).reduce((sum, donor) => sum + donor.perConcertAmount, 0)
    const committed = season.funding!.concerts.find(c => c.concertIndex === i)!
    const report = resolveConcert({
      works,
      institution: season.institution,
      principals: season.roster.principals,
      cityAudienceSegments,
      audienceState: season.audience,
      program: programs[i],
      donorState: season.donors,
      donorIncome: committed.realized,
      operatingSupport,
      isOpeningNight: i === 0,
      roll: 50,
    })
    season = resolveSeasonConcert(season, programs[i], report, works)
  }
  return season
}

describe('engine season loop parity', () => {
  const engineGame = playSeason()
  const rawSeason = playSeasonRaw()

  it('completes the season', () => {
    expect(engineGame.season.currentSlotIndex).toBe(4)
    expect(getPhase(engineGame)).toBe('season-complete')
    expect(summarizeSeason(engineGame.season)).not.toBeNull()
  })

  it('produces the same season as driving the sim directly', () => {
    expect(engineGame.season.institution.cash).toBe(rawSeason.institution.cash)
    const engineSummary = summarizeSeason(engineGame.season)!
    const rawSummary = summarizeSeason(rawSeason)!
    expect(engineSummary.totalRevenue).toBe(rawSummary.totalRevenue)
    expect(engineSummary.totalExpenses).toBe(rawSummary.totalExpenses)
    expect(engineSummary.totalDonorSupport).toBe(rawSummary.totalDonorSupport)
    expect(engineSummary.totalNet).toBe(rawSummary.totalNet)
    expect(engineSummary.averagePerformanceQuality).toBe(rawSummary.averagePerformanceQuality)
  })

  it('conserves cash across all posted transactions', () => {
    const transactions = getAllFinanceTransactions(engineGame.season)
    expect(transactions.every(tx => tx.status === 'posted')).toBe(true)
    const total = transactions.reduce((sum, tx) => sum + tx.amount, 0)
    expect(engineGame.season.institution.cash).toBe(startingInstitution.cash + total)
  })

  it('records the roll alongside the pending report and clears it on advance', () => {
    const pending = runConcert(beginSeason(planSeason()), 63)
    expect(pending.pendingRoll).toBe(63)
    expect(pending.pendingReport).not.toBeNull()
    const advanced = applyPendingReport(pending)
    expect(advanced.pendingRoll).toBeNull()
    expect(advanced.pendingReport).toBeNull()
  })
})

describe('engine phase transitions', () => {
  it('walks planning -> in-season -> report -> season-complete', () => {
    let game = planSeason()
    expect(getPhase(game)).toBe('planning')
    game = beginSeason(game)
    expect(getPhase(game)).toBe('in-season')
    game = runConcert(game, 50)
    expect(getPhase(game)).toBe('report')
    game = applyPendingReport(game)
    expect(getPhase(game)).toBe('in-season')
  })

  it('startNewSeason resets to planning and keeps the orchestra name', () => {
    const done = playSeason()
    const fresh = startNewSeason(done)
    expect(getPhase(fresh)).toBe('planning')
    expect(fresh.season.currentSlotIndex).toBe(0)
    expect(fresh.season.institution.name).toBe(done.season.institution.name)
  })
})

function expectEngineError(fn: () => unknown, code: string) {
  try {
    fn()
  } catch (error) {
    expect(error).toBeInstanceOf(EngineError)
    expect((error as EngineError).code).toBe(code)
    return
  }
  throw new Error(`Expected EngineError "${code}" but nothing was thrown`)
}

describe('engine refusals', () => {
  const donorId = createNewGame().season.donors.donors[0].id

  it('refuses to begin an incomplete plan', () => {
    expectEngineError(() => beginSeason(createNewGame()), 'plan-incomplete')
  })

  it('refuses to run a concert before the season begins', () => {
    expectEngineError(() => runConcert(planSeason(), 50), 'season-not-started')
  })

  it('refuses sway actions once the season has begun', () => {
    const started = beginSeason(planSeason())
    expectEngineError(() => setAsk(started, donorId, 0, 10_000), 'season-already-started')
    expectEngineError(() => toggleDedication(started, 0, donorId), 'season-already-started')
    expectEngineError(() => toggleRestricted(started, donorId, 0), 'season-already-started')
  })

  it('refuses to run a concert while a revision draft is open', () => {
    const started = beginSeason(planSeason())
    const editing = setProgram(started, 0, programs[1])
    expectEngineError(() => runConcert(editing, 50), 'edit-open')
  })

  it('refuses in-season edits to any slot but the active concert', () => {
    const started = beginSeason(planSeason())
    expectEngineError(() => setProgram(started, 2, programs[0]), 'invalid-slot')
  })

  it('refuses unknown works, donors, slots, and rolls', () => {
    const game = createNewGame()
    expectEngineError(
      () => setProgram(game, 0, makeProgram(['no-such-work', 'beethoven-5', 'brahms-2'], [6, 7, 7])),
      'unknown-work',
    )
    expectEngineError(() => setAsk(game, 'no-such-donor', 0, 1_000), 'unknown-donor')
    expectEngineError(() => setProgram(game, 7, programs[0]), 'invalid-slot')
    expectEngineError(() => runConcert(beginSeason(planSeason()), 150), 'invalid-roll')
  })

  it('refuses a double concert and an empty advance', () => {
    const pending = runConcert(beginSeason(planSeason()), 50)
    expectEngineError(() => runConcert(pending, 50), 'pending-report-open')
    expectEngineError(() => applyPendingReport(planSeason()), 'no-pending-report')
    expectEngineError(() => cancelEdit(planSeason()), 'no-edit-open')
    expectEngineError(() => confirmEdit(planSeason()), 'no-edit-open')
  })

  it('enforces the dedication limit loudly', () => {
    let game = planSeason()
    const donors = game.season.donors.donors
    game = toggleDedication(game, 0, donors[0].id)
    game = toggleDedication(game, 1, donors[1].id)
    game = toggleDedication(game, 2, donors[2].id)
    expectEngineError(() => toggleDedication(game, 3, donors[3].id), 'dedication-limit')
    // Toggling an existing dedication off is always legal.
    const cleared = toggleDedication(game, 0, donors[0].id)
    expect(cleared.sway.dedications[0]).toBeNull()
  })
})

describe('engine sway and funding', () => {
  it('a dedication raises the dedicated donor comfortable pledge', () => {
    const base = planSeason()
    const baseFunding = computeLiveSeasonFunding(base)
    // Pick a donor who is already willing to give to opening night, so the
    // dedication's comfort boost has something to multiply.
    const baseFit = baseFunding.concerts[0].fits.find(fit => fit.maxPledge > 0)!
    const dedicated = toggleDedication(base, 0, baseFit.donorId)
    const dedicatedFunding = computeLiveSeasonFunding(dedicated)
    const dedicatedFit = dedicatedFunding.concerts[0].fits.find(fit => fit.donorId === baseFit.donorId)!
    expect(dedicatedFit.maxPledge).toBeGreaterThan(baseFit.maxPledge)
  })

  it('beginSeason freezes the live funding into season state', () => {
    const planned = planSeason()
    const live = computeLiveSeasonFunding(planned)
    const started = beginSeason(planned)
    expect(started.season.funding).not.toBeNull()
    expect(started.season.funding!.pledged).toBe(live.pledged)
    expect(started.season.funding!.seasonCost).toBe(live.seasonCost)
  })
})

describe('engine mid-season revision and breach', () => {
  // Revise the opening night from donor-comfortable Beethoven to an
  // all-contemporary bill: alignment drops, pledges withdraw, donors cool.
  const aversiveProgram = makeProgram(['glacier-index', 'harbor-grid', 'night-ferry'], [6, 7, 7])

  it('previews and applies a donor breach', () => {
    const started = beginSeason(planSeason())
    const committedPledged = started.season.funding!.concerts[0].pledged
    expect(committedPledged).toBeGreaterThan(0)

    const editing = setProgram(started, 0, aversiveProgram)
    expect(editing.editDraft).toEqual(aversiveProgram)
    // The committed plan is untouched while the draft is open.
    expect(editing.draftPrograms[0]).toEqual(programs[0])

    const preview = computeBreachPreview(editing)
    expect(preview).not.toBeNull()
    expect(preview!.totalWithdrawn).toBeGreaterThan(0)

    const confirmed = confirmEdit(editing)
    expect(confirmed.editDraft).toBeNull()
    expect(confirmed.draftPrograms[0]).toEqual(aversiveProgram)
    const afterPledged = confirmed.season.funding!.concerts[0].pledged
    expect(afterPledged).toBe(committedPledged - preview!.totalWithdrawn)

    // Withdrawing donors cooled.
    for (const withdrawal of preview!.withdrawals) {
      const before = started.season.donors.donors.find(d => d.id === withdrawal.donorId)!
      const after = confirmed.season.donors.donors.find(d => d.id === withdrawal.donorId)!
      expect(after.relationship).toBeLessThanOrEqual(before.relationship)
    }
  })

  it('cancelEdit discards the draft without touching funding', () => {
    const started = beginSeason(planSeason())
    const editing = setProgram(started, 0, aversiveProgram)
    const cancelled = cancelEdit(editing)
    expect(cancelled.editDraft).toBeNull()
    expect(cancelled.draftPrograms[0]).toEqual(programs[0])
    expect(cancelled.season.funding).toEqual(started.season.funding)
  })
})

describe('engine immutability', () => {
  it('actions never mutate the state they are given', () => {
    const game = planSeason()
    const snapshot = JSON.parse(JSON.stringify(game))
    const started = beginSeason(game)
    runConcert(started, 50)
    setProgram(game, 0, programs[1])
    toggleDedication(game, 0, game.season.donors.donors[0].id)
    expect(JSON.parse(JSON.stringify(game))).toEqual(snapshot)
  })
})
