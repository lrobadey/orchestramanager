import { describe, it, expect } from 'vitest'
import { createInitialSeason, resolveSeasonConcert, summarizeSeason } from '../src/sim/season'
import { resolveConcert } from '../src/sim/resolveConcert'
import { works } from '../src/data/works'
import { principals } from '../src/data/principals'
import { audienceSegments } from '../src/data/audienceSegments'
import { startingInstitution } from '../src/data/institution'
import { ConcertProgram, SeasonState } from '../src/types/core'

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

function makeReport(program: ConcertProgram, institution = startingInstitution) {
  return resolveConcert({ works, institution, principals, audienceSegments, program, roll: 50 })
}

function resolveAll(programs: ConcertProgram[]): SeasonState {
  let season = createInitialSeason(startingInstitution)
  for (const program of programs) {
    const report = makeReport(program, season.institution)
    season = resolveSeasonConcert(season, program, report)
  }
  return season
}

describe('createInitialSeason', () => {
  it('initializes with four unresolved slots', () => {
    const season = createInitialSeason(startingInstitution)
    expect(season.slots).toHaveLength(4)
    for (const slot of season.slots) {
      expect(slot.status).toBe('pending')
      expect(slot.program).toBeNull()
      expect(slot.report).toBeNull()
    }
    expect(season.currentSlotIndex).toBe(0)
  })

  it('slots have the correct names in order', () => {
    const season = createInitialSeason(startingInstitution)
    expect(season.slots[0].name).toBe('Opening Night')
    expect(season.slots[1].name).toBe('Winter Program')
    expect(season.slots[2].name).toBe('Spring Identity Concert')
    expect(season.slots[3].name).toBe('Season Finale')
  })
})

describe('resolveSeasonConcert', () => {
  it('resolving a concert updates only that slot', () => {
    const season = createInitialSeason(startingInstitution)
    const report = makeReport(safeProgram)
    const next = resolveSeasonConcert(season, safeProgram, report)

    expect(next.slots[0].status).toBe('resolved')
    expect(next.slots[0].report).toBe(report)
    expect(next.slots[0].program).toBe(safeProgram)

    expect(next.slots[1].status).toBe('pending')
    expect(next.slots[2].status).toBe('pending')
    expect(next.slots[3].status).toBe('pending')
  })

  it('advances currentSlotIndex after each resolve', () => {
    let season = createInitialSeason(startingInstitution)
    expect(season.currentSlotIndex).toBe(0)

    season = resolveSeasonConcert(season, safeProgram, makeReport(safeProgram))
    expect(season.currentSlotIndex).toBe(1)

    season = resolveSeasonConcert(season, safeProgram, makeReport(safeProgram, season.institution))
    expect(season.currentSlotIndex).toBe(2)
  })

  it('institution state persists and changes between concerts', () => {
    const season0 = createInitialSeason(startingInstitution)
    const report0 = makeReport(safeProgram, season0.institution)
    const season1 = resolveSeasonConcert(season0, safeProgram, report0)

    // institution in season1 should differ from startingInstitution
    expect(season1.institution.cash).toBe(startingInstitution.cash + report0.net)
    expect(season1.institution).not.toEqual(startingInstitution)

    // slot[1] will receive the updated institution as institutionBefore when resolved
    const report1 = makeReport(safeProgram, season1.institution)
    const season2 = resolveSeasonConcert(season1, safeProgram, report1)
    expect(season2.slots[1].institutionBefore).toEqual(season1.institution)
  })
})

describe('summarizeSeason', () => {
  it('returns null until all four concerts are resolved', () => {
    let season = createInitialSeason(startingInstitution)
    expect(summarizeSeason(season)).toBeNull()

    season = resolveSeasonConcert(season, safeProgram, makeReport(safeProgram))
    expect(summarizeSeason(season)).toBeNull()

    season = resolveSeasonConcert(season, safeProgram, makeReport(safeProgram, season.institution))
    expect(summarizeSeason(season)).toBeNull()

    season = resolveSeasonConcert(season, safeProgram, makeReport(safeProgram, season.institution))
    expect(summarizeSeason(season)).toBeNull()

    season = resolveSeasonConcert(season, safeProgram, makeReport(safeProgram, season.institution))
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
