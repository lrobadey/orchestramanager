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
import { forecastProgram } from '../src/sim/forecastProgram'
import { resolveConcert } from '../src/sim/resolveConcert'
import type { ConcertProgram, ConcertReport, SeasonState } from '../src/types/core'

// Full four-concert season integration: funds the plan, then runs
// forecast → resolve → apply for every slot, exactly as useSeasonGame does.
// Guards the whole loop against regressions in any one subsystem.

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

function runSeason(): { season: SeasonState; reports: ConcertReport[] } {
  let season = createInitialSeason(startingInstitution, principals)
  const concerts: SeasonFundingConcertInput[] = programs.map((program, index) => ({
    id: `concert-${index}`,
    index,
    name: `Concert ${index + 1}`,
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

  const reports: ConcertReport[] = []
  for (let i = 0; i < 4; i++) {
    const operatingSupport = computeOperatingSupport({
      donors: season.donors.donors,
      institution: season.institution,
      audienceState: season.audience,
      concertCount: 4,
    }).reduce((sum, donor) => sum + donor.perConcertAmount, 0)
    const committed = season.funding!.concerts.find(c => c.concertIndex === i)

    const forecast = forecastProgram({
      works,
      institution: season.institution,
      principals: season.roster.principals,
      cityAudienceSegments,
      audienceState: season.audience,
      program: programs[i],
      donorState: season.donors,
      donorIncome: committed?.pledged,
      operatingSupport,
    })
    expect(forecast.isComplete).toBe(true)

    const report = resolveConcert({
      works,
      institution: season.institution,
      principals: season.roster.principals,
      cityAudienceSegments,
      audienceState: season.audience,
      program: programs[i],
      donorState: season.donors,
      donorIncome: committed?.realized,
      operatingSupport,
      isOpeningNight: i === 0,
      roll: 50,
    })
    // Costs are deterministic: the forecast and the resolved report must agree.
    expect(report.expenses).toBe(forecast.projectedExpenses)

    reports.push(report)
    season = resolveSeasonConcert(season, programs[i], report, works)
  }

  return { season, reports }
}

describe('full season loop with the labor economy', () => {
  const { season, reports } = runSeason()

  it('completes all four concerts and produces a season summary', () => {
    expect(season.currentSlotIndex).toBe(4)
    expect(season.slots.every(slot => slot.status === 'resolved')).toBe(true)
    expect(summarizeSeason(season)).not.toBeNull()
  })

  it('closes the books: every transaction posted and cash exactly conserved', () => {
    const transactions = getAllFinanceTransactions(season)
    expect(transactions.every(tx => tx.status === 'posted')).toBe(true)
    const transactionTotal = transactions.reduce((sum, tx) => sum + tx.amount, 0)
    expect(season.institution.cash).toBe(startingInstitution.cash + transactionTotal)
  })

  it('musician payroll is the dominant expense of every concert', () => {
    for (const report of reports) {
      const bd = report.expenseBreakdown
      expect(bd.payroll).toBeGreaterThan(0)
      expect(bd.musicians).toBeGreaterThan(40)
      expect(bd.payroll).toBeGreaterThan(bd.baseConcert + bd.rehearsal + bd.marketing + bd.production)
      expect(transactionKinds(season, report)).toContain('payroll-cost')
    }
  })

  it('large-forces programs put extras on stage and cost more', () => {
    // Concert 3/4 carry late-romantic forces; concert 1 is Beethoven-scale.
    expect(reports[3].expenseBreakdown.extraPlayers).toBeGreaterThan(reports[0].expenseBreakdown.extraPlayers)
    expect(reports[3].expenseBreakdown.payroll).toBeGreaterThan(reports[0].expenseBreakdown.payroll)
  })

  it('each concert resolves against its committed donor pledges', () => {
    for (let i = 0; i < 4; i++) {
      const committed = season.funding!.concerts.find(c => c.concertIndex === i)!
      expect(reports[i].donorUplift).toBe(committed.realized)
    }
  })

  it('donors fund a meaningful but partial share of real concert costs', () => {
    const funding = season.funding!
    expect(funding.seasonCost).toBeGreaterThan(400_000)
    expect(funding.coveragePercent).toBeGreaterThan(0.2)
    expect(funding.coveragePercent).toBeLessThan(1)
  })

  it('a reasonably planned debut season stays solvent on neutral luck', () => {
    expect(season.institution.cash).toBeGreaterThan(0)
  })
})

function transactionKinds(season: SeasonState, report: ConcertReport): string[] {
  const slot = season.slots.find(s => s.report === report)
  return slot ? slot.financeTransactions.map(tx => tx.kind) : []
}
