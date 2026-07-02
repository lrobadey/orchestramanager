import { describe, it, expect } from 'vitest'
import { forecastProgram, ForecastInput } from '../src/sim/forecastProgram'
import { resolveConcert } from '../src/sim/resolveConcert'
import { createInitialSeason, resolveSeasonConcert, summarizeSeason } from '../src/sim/season'
import { works } from '../src/data/works'
import { principals } from '../src/data/principals'
import { audienceSegments, cityAudienceSegments, createInitialAudience } from '../src/data/audienceSegments'
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

  it('projects city-segment awareness as current awareness plus campaign lift', () => {
    const audienceState = createInitialAudience()
    const forecast = forecastProgram({
      works,
      institution: startingInstitution,
      principals,
      cityAudienceSegments,
      audienceState,
      program: { ...safeProgram, marketingSpend: 20_000, marketingStyle: 'grassroots' },
    })
    const segmentId = 'community-neighborhood-public'
    const relationship = audienceState.relationships.find(row => row.segmentId === segmentId)!
    const impact = forecast.marketingImpact.bySegment.find(row => row.segmentId === segmentId)!
    const projected = forecast.projectedAudienceBreakdown.find(row => row.segmentId === segmentId)!

    expect(projected.awarenessScore).toBe(Math.round(Math.min(100, relationship.awareness + impact.awarenessLift)))
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

  it('institutional trust and identity change audience demand for the same program', () => {
    const mistrusted = forecastProgram({
      ...makeInput(adventurousProgram),
      institution: {
        ...startingInstitution,
        audienceTrust: 20,
        artisticReputation: 35,
        identity: { adventurous: 0, scholarly: 45, communityFocused: 0 },
      },
    })
    const credibleAdventurous = forecastProgram({
      ...makeInput(adventurousProgram),
      institution: {
        ...startingInstitution,
        audienceTrust: 85,
        artisticReputation: 70,
        identity: { adventurous: 80, scholarly: 0, communityFocused: 0 },
      },
    })
    const lowExplorers = mistrusted.projectedAudienceBreakdown.find(r => r.segmentId === 'cultural-explorers')!
    const highExplorers = credibleAdventurous.projectedAudienceBreakdown.find(r => r.segmentId === 'cultural-explorers')!

    expect(credibleAdventurous.projectedAttendance).toBeGreaterThan(mistrusted.projectedAttendance)
    expect(highExplorers.attendance).toBeGreaterThan(lowExplorers.attendance)
  })

  it('projected donor uplift is exactly the committed funding attached to the concert', () => {
    const funded = forecastProgram({ ...makeInput(adventurousProgram), donorIncome: 42_000 })
    expect(funded.projectedDonorUplift).toBe(42_000)
  })

  it('expense breakdown total matches projectedExpenses and includes all five components', () => {
    const forecast = forecastProgram(makeInput(safeProgram))
    const bd = forecast.projectedExpenseBreakdown
    expect(bd.baseConcert).toBeGreaterThan(0)
    expect(bd.payroll).toBeGreaterThan(0)
    expect(bd.rehearsal).toBeGreaterThan(0)
    expect(bd.marketing).toBeGreaterThan(0)
    expect(bd.production).toBeGreaterThanOrEqual(0)
    expect(bd.total).toBe(bd.baseConcert + bd.payroll + bd.rehearsal + bd.marketing + bd.production)
    expect(bd.total).toBe(forecast.projectedExpenses)
    // Payroll is the dominant cost line, as in a real orchestra.
    expect(bd.payroll).toBeGreaterThan(bd.baseConcert + bd.rehearsal + bd.marketing + bd.production)
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

  it('the forecast never invents donor money — no committed funding means zero uplift', () => {
    const forecast = forecastProgram({ ...makeInput(safeProgram), institution: { ...startingInstitution, donorConfidence: 60 } })
    expect(forecast.projectedDonorUplift).toBe(0)
  })
})
