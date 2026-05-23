import { describe, it, expect } from 'vitest'
import { forecastProgram, ForecastInput } from '../src/sim/forecastProgram'
import { resolveConcert } from '../src/sim/resolveConcert'
import { createInitialSeason, resolveSeasonConcert, summarizeSeason } from '../src/sim/season'
import { computeDonorUplift, DONOR_UPLIFT_THRESHOLD } from '../src/sim/scoring'
import { works } from '../src/data/works'
import { principals } from '../src/data/principals'
import { audienceSegments } from '../src/data/audienceSegments'
import { startingInstitution } from '../src/data/institution'
import { ConcertProgram } from '../src/types/core'

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
  marketingSpend: 5_000,
  ticketPrice: 55,
  studentTicketsEnabled: false,
  studentTicketPrice: 25,
}

function makeInput(program: ConcertProgram): ForecastInput {
  return { works, institution: startingInstitution, principals, audienceSegments, program }
}

describe('audience & finance systems', () => {
  it('higher ticket price reduces demand for price-sensitive students segment', () => {
    const cheap = forecastProgram(makeInput({ ...safeProgram, ticketPrice: 20 }))
    const expensive = forecastProgram(makeInput({ ...safeProgram, ticketPrice: 80 }))
    const cheapStudents = cheap.projectedAudienceBreakdown.find(r => r.segmentId === 'students-educators')!
    const expStudents = expensive.projectedAudienceBreakdown.find(r => r.segmentId === 'students-educators')!
    expect(cheapStudents.attendance).toBeGreaterThan(expStudents.attendance * 1.5)
  })

  it('marketing effect saturates — extreme spend is not double minimal spend', () => {
    // $3k is well below the cap; $200k hits it — so extreme > minimal but not 2x
    const minimal = forecastProgram(makeInput({ ...safeProgram, marketingSpend: 3_000 }))
    const extreme = forecastProgram(makeInput({ ...safeProgram, marketingSpend: 200_000 }))
    expect(extreme.projectedAttendance).toBeGreaterThan(minimal.projectedAttendance)
    expect(extreme.projectedAttendance).toBeLessThan(minimal.projectedAttendance * 2)
  })

  it('contemporary program gives Cultural Explorers higher share than Seasoned Supporters', () => {
    const adventForecast = forecastProgram(makeInput(adventurousProgram))
    const canonForecast = forecastProgram(makeInput(safeProgram))
    const explorerShareAdv = adventForecast.projectedAudienceBreakdown.find(r => r.segmentId === 'cultural-explorers')!.shareOfHouse
    const explorerShareCanon = canonForecast.projectedAudienceBreakdown.find(r => r.segmentId === 'cultural-explorers')!.shareOfHouse
    const seasonedShareCanon = canonForecast.projectedAudienceBreakdown.find(r => r.segmentId === 'seasoned-supporters')!.shareOfHouse
    const seasonedShareAdv = adventForecast.projectedAudienceBreakdown.find(r => r.segmentId === 'seasoned-supporters')!.shareOfHouse
    expect(explorerShareAdv).toBeGreaterThan(explorerShareCanon)
    expect(seasonedShareCanon).toBeGreaterThan(seasonedShareAdv)
  })

  it('expense breakdown total matches projectedExpenses and includes all four components', () => {
    const forecast = forecastProgram(makeInput(safeProgram))
    const bd = forecast.projectedExpenseBreakdown
    expect(bd.baseConcert).toBeGreaterThan(0)
    expect(bd.rehearsal).toBeGreaterThan(0)
    expect(bd.marketing).toBeGreaterThan(0)
    expect(bd.production).toBeGreaterThanOrEqual(0)
    expect(bd.total).toBe(bd.baseConcert + bd.rehearsal + bd.marketing + bd.production)
    expect(bd.total).toBe(forecast.projectedExpenses)
  })

  it('contemporary program has higher production cost than canon program', () => {
    const canonForecast = forecastProgram(makeInput(safeProgram))
    const adventForecast = forecastProgram(makeInput(adventurousProgram))
    expect(adventForecast.projectedExpenseBreakdown.production).toBeGreaterThan(
      canonForecast.projectedExpenseBreakdown.production,
    )
  })

  it('safe canon program produces higher donor delta than adventurous program', () => {
    const safeReport = resolveConcert({ ...makeInput(safeProgram), roll: 50 })
    const adventurousReport = resolveConcert({ ...makeInput(adventurousProgram), roll: 50 })
    expect(safeReport.institutionalDeltas.donorConfidence).toBeGreaterThan(
      adventurousReport.institutionalDeltas.donorConfidence,
    )
  })

  it('season summary populates capacity, segment, and risk fields after 4 concerts', () => {
    let season = createInitialSeason(startingInstitution, principals)
    for (let i = 0; i < 4; i++) {
      const report = resolveConcert({
        works,
        institution: season.institution,
        principals: season.roster.principals,
        audienceSegments,
        program: safeProgram,
        roll: 50,
      })
      season = resolveSeasonConcert(season, safeProgram, report, works)
    }
    const summary = summarizeSeason(season)!
    expect(summary.averageCapacityPercent).toBeGreaterThan(0)
    expect(summary.averageCapacityPercent).toBeLessThanOrEqual(100)
    expect(summary.bestSegment).toBeTruthy()
    expect(summary.worstSegment).toBeTruthy()
    expect(summary.financialRiskFlags).toBeInstanceOf(Array)
    expect(summary.totalExpenses).toBe(
      season.slots.reduce((s, slot) => s + slot.report!.expenses, 0),
    )
  })

  it('donor uplift is positive above threshold and zero at or below it', () => {
    expect(computeDonorUplift(DONOR_UPLIFT_THRESHOLD)).toBe(0)
    expect(computeDonorUplift(DONOR_UPLIFT_THRESHOLD - 5)).toBe(0)
    expect(computeDonorUplift(50)).toBeGreaterThan(0)
    expect(computeDonorUplift(50)).toBe((50 - DONOR_UPLIFT_THRESHOLD) * 200)

    const forecast = forecastProgram({ ...makeInput(safeProgram), institution: { ...startingInstitution, donorConfidence: 60 } })
    expect(forecast.projectedDonorUplift).toBeGreaterThan(0)

    const zeroForecast = forecastProgram({ ...makeInput(safeProgram), institution: { ...startingInstitution, donorConfidence: 20 } })
    expect(zeroForecast.projectedDonorUplift).toBe(0)
  })
})
