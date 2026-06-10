import { describe, it, expect } from 'vitest'
import { createInitialSeason, resolveSeasonConcert, summarizeSeason } from '../src/sim/season'
import { resolveConcert } from '../src/sim/resolveConcert'
import { works } from '../src/data/works'
import { principals } from '../src/data/principals'
import { audienceSegments, cityAudienceSegments } from '../src/data/audienceSegments'
import { startingInstitution } from '../src/data/institution'
import { ConcertProgram, Principal, SeasonState } from '../src/types/core'

const safeProgram: ConcertProgram = {
  workCount: 3,
  workIds: ['beethoven-5', 'beethoven-7', 'tchaikovsky-6'],
  intermissionAfter: 1,
  rehearsalAllocation: [7, 7, 6],
  marketingSpend: 15_000,
  ticketPrice: 65,
  studentTicketsEnabled: false,
  studentTicketPrice: 25,
}

const adventurousProgram: ConcertProgram = {
  workCount: 3,
  workIds: ['harbor-grid', 'glacier-index', 'night-ferry'],
  intermissionAfter: 1,
  rehearsalAllocation: [7, 7, 6],
  marketingSpend: 10_000,
  ticketPrice: 55,
  studentTicketsEnabled: false,
  studentTicketPrice: 25,
}

function makeReport(
  program: ConcertProgram,
  institution = startingInstitution,
  livePrincipals: Principal[] = principals,
) {
  return resolveConcert({
    works,
    institution,
    principals: livePrincipals,
    audienceSegments,
    program,
    roll: 50,
  })
}

function resolveAll(programs: ConcertProgram[]): SeasonState {
  let season = createInitialSeason(startingInstitution, principals)
  for (const program of programs) {
    const report = makeReport(program, season.institution, season.roster.principals)
    season = resolveSeasonConcert(season, program, report, works)
  }
  return season
}

describe('createInitialSeason', () => {
  it('initializes with four unresolved slots', () => {
    const season = createInitialSeason(startingInstitution, principals)
    expect(season.calendar.currentDate).toBe('2026-05-01')
    expect(season.calendar.currentDay).toBe(0)
    expect(season.slots).toHaveLength(4)
    for (const slot of season.slots) {
      expect(slot.status).toBe('pending')
      expect(slot.program).toBeNull()
      expect(slot.report).toBeNull()
      expect(slot.financeTransactions).toEqual([])
    }
    expect(season.currentSlotIndex).toBe(0)
    expect(season.roster.principals).toHaveLength(principals.length)
    expect(season.donors.donors).toHaveLength(5)
    expect(season.donors.donors.map(donor => donor.id)).toEqual([
      'eleanor-voss',
      'aster-foundation',
      'rehnquist-circle',
      'okafor-civic-fund',
      'victor-saye',
    ])
    expect(season.donors.donors[0].musicTaste.classicalCanon).toBe(98)
    expect(season.donors.donors[0].institutionalPriorities.prestige).toBe(96)
    expect(season.donors.donors[0].influenceWeights).toEqual({ music: 75, institutional: 25 })
    for (const donor of season.donors.donors) {
      expect(donor.influenceWeights.music + donor.influenceWeights.institutional).toBe(100)
    }
  })

  it('slots have the correct names in order', () => {
    const season = createInitialSeason(startingInstitution, principals)
    expect(season.slots[0].name).toBe('Opening Night')
    expect(season.slots[0].scheduledDate).toBe('2026-09-14')
    expect(season.slots[1].name).toBe('Winter Program')
    expect(season.slots[1].scheduledDate).toBe('2026-10-26')
    expect(season.slots[2].name).toBe('Spring Identity Concert')
    expect(season.slots[2].scheduledDate).toBe('2027-01-11')
    expect(season.slots[3].name).toBe('Season Finale')
    expect(season.slots[3].scheduledDate).toBe('2027-03-22')
  })
})

describe('resolveSeasonConcert', () => {
  it('resolving a concert updates only that slot', () => {
    const season = createInitialSeason(startingInstitution, principals)
    const report = makeReport(safeProgram)
    const next = resolveSeasonConcert(season, safeProgram, report, works)

    expect(next.slots[0].status).toBe('resolved')
    expect(next.slots[0].report).toBe(report)
    expect(next.slots[0].program).toBe(safeProgram)

    expect(next.slots[1].status).toBe('pending')
    expect(next.slots[2].status).toBe('pending')
    expect(next.slots[3].status).toBe('pending')
    expect(next.calendar.currentDate).toBe('2026-09-14')
    expect(next.donors.donors.find(donor => donor.id === 'aster-foundation')!.lastDelta).toBeLessThan(0)
    expect(next.donors).not.toEqual(season.donors)
  })

  it('advances currentSlotIndex after each resolve', () => {
    let season = createInitialSeason(startingInstitution, principals)
    expect(season.currentSlotIndex).toBe(0)

    season = resolveSeasonConcert(season, safeProgram, makeReport(safeProgram), works)
    expect(season.currentSlotIndex).toBe(1)

    season = resolveSeasonConcert(season, safeProgram, makeReport(safeProgram, season.institution), works)
    expect(season.currentSlotIndex).toBe(2)
  })

  it('institution state persists and changes between concerts', () => {
    const season0 = createInitialSeason(startingInstitution, principals)
    const report0 = makeReport(safeProgram, season0.institution)
    const season1 = resolveSeasonConcert(season0, safeProgram, report0, works)

    // cash now reflects posted transactions only; scheduled donor support and bills settle later
    const postedNow = season1.slots[0].financeTransactions
      .filter(tx => tx.status === 'posted')
      .reduce((sum, tx) => sum + tx.amount, 0)
    expect(season1.institution.cash).toBe(startingInstitution.cash + postedNow)
    expect(season1.institution).not.toEqual(startingInstitution)

    // slot[1] will receive the updated institution as institutionBefore when resolved
    const scheduledFromFirstConcert = season1.slots[0].financeTransactions
      .filter(tx => tx.status === 'scheduled' && tx.dueDate === '2026-10-26')
      .reduce((sum, tx) => sum + tx.amount, 0)
    const report1 = makeReport(safeProgram, season1.institution, season1.roster.principals)
    const season2 = resolveSeasonConcert(season1, safeProgram, report1, works)
    expect(season2.calendar.currentDate).toBe('2026-10-26')
    expect(season2.slots[1].institutionBefore).toEqual(season1.institution)
    expect(season2.slots[0].financeTransactions.every(tx => tx.status === 'posted')).toBe(true)
    // Cash conservation: concert 2's cash equals concert 1's cash plus the
    // settled deferred items plus concert 2's own immediately-posted flows.
    const postedNowSecond = season2.slots[1].financeTransactions
      .filter(tx => tx.status === 'posted')
      .reduce((sum, tx) => sum + tx.amount, 0)
    expect(season2.institution.cash).toBe(
      season1.institution.cash + scheduledFromFirstConcert + postedNowSecond,
    )
  })

  it('stores finance transactions on resolved slots', () => {
    const season = createInitialSeason(startingInstitution, principals)
    const report = makeReport(safeProgram)
    const next = resolveSeasonConcert(season, safeProgram, report, works)
    const transactionTotal = next.slots[0].financeTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0,
    )
    const postedTotal = next.slots[0].financeTransactions
      .filter(tx => tx.status === 'posted')
      .reduce((sum, tx) => sum + tx.amount, 0)

    expect(next.slots[0].financeTransactions).toHaveLength(7)
    expect(transactionTotal).toBe(report.net)
    expect(postedTotal).not.toBe(report.net)
    expect(next.slots[0].financeTransactions.some(tx => tx.status === 'scheduled')).toBe(true)
    expect(next.slots[1].financeTransactions).toEqual([])
  })

  it('roster form and morale persist into the next concert', () => {
    const season0 = createInitialSeason(startingInstitution, principals)
    const before = season0.roster.principals.find(p => p.id === 'concertmaster')!
    const report0 = makeReport(safeProgram, season0.institution, season0.roster.principals)
    const season1 = resolveSeasonConcert(season0, safeProgram, report0, works)
    const after = season1.roster.principals.find(p => p.id === 'concertmaster')!

    expect(after.form).toBe(
      before.form +
        report0.rosterChanges.find(change => change.principalId === 'concertmaster')!.formDelta,
    )
    expect(after.morale).toBe(
      before.morale +
        report0.rosterChanges.find(change => change.principalId === 'concertmaster')!.moraleDelta,
    )

    const report1 = makeReport(safeProgram, season1.institution, season1.roster.principals)
    expect(report1.rosterChanges).toHaveLength(principals.length)
  })
})

describe('audience-trust feedback', () => {
  // The vitals strip and concert report show report.institutionalDeltas.audienceTrust
  // as the movement of the institution's trust meter. resolveSeasonConcert sets that
  // meter from the audience-relationship model, so the displayed delta MUST equal the
  // meter's actual change — otherwise the player reads a number that never lands.
  it('the reported audience-trust delta equals the meter movement it claims', () => {
    let season = createInitialSeason(startingInstitution, principals)
    for (let i = 0; i < 4; i++) {
      const before = season.institution.audienceTrust
      const report = resolveConcert({
        works,
        institution: season.institution,
        principals: season.roster.principals,
        cityAudienceSegments,
        audienceState: season.audience,
        program: safeProgram,
        isOpeningNight: season.currentSlotIndex === 0,
        roll: 50,
      })
      season = resolveSeasonConcert(season, safeProgram, report, works)
      expect(season.institution.audienceTrust).toBe(before + report.institutionalDeltas.audienceTrust)
    }
  })
})

describe('summarizeSeason', () => {
  it('returns null until all four concerts are resolved', () => {
    let season = createInitialSeason(startingInstitution, principals)
    expect(summarizeSeason(season)).toBeNull()

    season = resolveSeasonConcert(season, safeProgram, makeReport(safeProgram), works)
    expect(summarizeSeason(season)).toBeNull()

    season = resolveSeasonConcert(season, safeProgram, makeReport(safeProgram, season.institution), works)
    expect(summarizeSeason(season)).toBeNull()

    season = resolveSeasonConcert(season, safeProgram, makeReport(safeProgram, season.institution), works)
    expect(summarizeSeason(season)).toBeNull()

    season = resolveSeasonConcert(season, safeProgram, makeReport(safeProgram, season.institution), works)
    const summary = summarizeSeason(season)
    expect(summary).not.toBeNull()
    expect(summary!.totalAttendance).toBeGreaterThan(0)
    expect(summary!.totalRevenue).toBeGreaterThan(0)
  })

  it('summary totals match sum of individual reports', () => {
    const season = resolveAll([safeProgram, safeProgram, safeProgram, safeProgram])
    const summary = summarizeSeason(season)!
    const expectedAttendance = season.slots.reduce((s, slot) => s + slot.report!.attendance, 0)
    expect(summary.totalAttendance).toBe(expectedAttendance)
  })
})

describe('identity drift', () => {
  it('accumulates adventurous identity after contemporary-heavy season', () => {
    const contemporarySeason = resolveAll([
      adventurousProgram,
      adventurousProgram,
      adventurousProgram,
      adventurousProgram,
    ])
    const canonSeason = resolveAll([
      safeProgram,
      safeProgram,
      safeProgram,
      safeProgram,
    ])

    expect(contemporarySeason.institution.identity.adventurous).toBeGreaterThan(
      canonSeason.institution.identity.adventurous,
    )
  })
})
