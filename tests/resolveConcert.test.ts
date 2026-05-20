import { describe, it, expect } from 'vitest'
import { forecastProgram, ForecastInput } from '../src/sim/forecastProgram'
import { resolveConcert } from '../src/sim/resolveConcert'
import { applyConcertReport } from '../src/sim/applyConcertReport'
import { works } from '../src/data/works'
import { principals } from '../src/data/principals'
import { audienceSegments } from '../src/data/audienceSegments'
import { startingInstitution } from '../src/data/institution'
import { ConcertProgram } from '../src/types/core'

// Canon program (Beethoven 5, Beethoven 7, Tchaikovsky 6) — loads 30/35/45.
// Rehearsal hours needed depend on section leadership; with the 15 starting
// principals (~5.3 weighted divisor for balanced programs) these want ~5.7/6.6/8.5h respectively.
// With [7,7,6] allocation this is near-balanced but slightly under on Tchaikovsky 6.
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

// Contemporary-heavy program — loads 65/60/58, needing ~12-13h each with the
// starting principals. With a 20hr total and [7,7,6] allocation every piece
// will be deeply under-rehearsed.
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

// ── forecastProgram ──────────────────────────────────────────────────────────

describe('forecastProgram', () => {
  it('returns a stable forecast for a known program', () => {
    const forecast = forecastProgram(makeInput(safeProgram))
    expect(forecast.projectedAttendance).toBeGreaterThan(0)
    expect(forecast.projectedRevenue).toBeGreaterThan(0)
    expect(forecast.projectedExpenses).toBeGreaterThan(0)
    expect(forecast.forecastNotes).toBeInstanceOf(Array)
    expect(forecast.forecastNotes.length).toBeGreaterThanOrEqual(0)
    expect(forecast.forecastNotes.length).toBeLessThanOrEqual(4)
  })

  it('higher marketing spend increases projected attendance', () => {
    const low = forecastProgram(makeInput({ ...safeProgram, marketingSpend: 5_000 }))
    const high = forecastProgram(makeInput({ ...safeProgram, marketingSpend: 30_000 }))
    expect(high.projectedAttendance).toBeGreaterThan(low.projectedAttendance)
  })

  it('marketing effect is bounded (diminishing returns)', () => {
    const medium = forecastProgram(makeInput({ ...safeProgram, marketingSpend: 15_000 }))
    const extreme = forecastProgram(makeInput({ ...safeProgram, marketingSpend: 200_000 }))
    // Should not be a runaway multiplier
    expect(extreme.projectedAttendance).toBeLessThan(medium.projectedAttendance * 2)
  })

  it('starving the worst piece increases rehearsalPressure', () => {
    const starved = forecastProgram(
      makeInput({ ...adventurousProgram, rehearsalAllocation: [2, 9, 9] }),
    )
    const balanced = forecastProgram(
      makeInput({ ...adventurousProgram, rehearsalAllocation: [7, 7, 6] }),
    )
    expect(starved.rehearsalPressure).toBeGreaterThan(balanced.rehearsalPressure)
  })

  it('throws when rehearsalAllocation does not sum to the budget', () => {
    expect(() =>
      forecastProgram(makeInput({ ...safeProgram, rehearsalAllocation: [10, 10, 10] })),
    ).toThrow(/sum to 20/)
  })

  it('per-piece rehearsal pressure reflects each slot independently', () => {
    const forecast = forecastProgram(
      makeInput({ ...adventurousProgram, rehearsalAllocation: [1, 10, 9] }),
    )
    // Slot 0 (Harbor Grid, needs ~13h, got 1h) should be more pressured than slot 1 (got 10h)
    const [p0, p1] = forecast.perWorkRehearsalPressure
    expect(p0).not.toBeNull()
    expect(p1).not.toBeNull()
    expect(p0!).toBeGreaterThan(p1!)
  })

  it('returns an incomplete forecast when slots are empty', () => {
    const incompleteProgram: ConcertProgram = {
      ...safeProgram,
      workIds: ['beethoven-5', null, null],
    }
    const forecast = forecastProgram(makeInput(incompleteProgram))
    expect(forecast.isComplete).toBe(false)
    expect(forecast.projectedAttendance).toBe(0)
    expect(forecast.forecastNotes.length).toBeGreaterThan(0)
  })

  it('higher ticket price reduces projected attendance', () => {
    const cheap = forecastProgram(makeInput({ ...safeProgram, ticketPrice: 30 }))
    const expensive = forecastProgram(makeInput({ ...safeProgram, ticketPrice: 120 }))
    expect(cheap.projectedAttendance).toBeGreaterThan(expensive.projectedAttendance)
  })

  it('calculates projected attendance and revenue from segment breakdown', () => {
    const forecast = forecastProgram(makeInput(safeProgram))
    const attendanceFromSegments = forecast.projectedAudienceBreakdown.reduce(
      (sum, row) => sum + row.attendance,
      0,
    )
    const revenueFromSegments = forecast.projectedAudienceBreakdown.reduce(
      (sum, row) => sum + row.ticketRevenue,
      0,
    )

    expect(forecast.projectedAudienceBreakdown).toHaveLength(audienceSegments.length)
    expect(forecast.projectedAttendance).toBe(attendanceFromSegments)
    expect(forecast.projectedRevenue).toBe(revenueFromSegments)
  })

  it('student tickets materially restore student attendance without affecting other segments', () => {
    const standardHigh = forecastProgram(
      makeInput({
        ...safeProgram,
        ticketPrice: 70,
        studentTicketsEnabled: false,
        studentTicketPrice: 25,
      }),
    )
    const withStudents = forecastProgram(
      makeInput({
        ...safeProgram,
        ticketPrice: 70,
        studentTicketsEnabled: true,
        studentTicketPrice: 25,
      }),
    )

    const beforeStudents = standardHigh.projectedAudienceBreakdown.find(
      row => row.segmentId === 'students-educators',
    )!
    const afterStudents = withStudents.projectedAudienceBreakdown.find(
      row => row.segmentId === 'students-educators',
    )!
    expect(afterStudents.attendance).toBeGreaterThan(beforeStudents.attendance * 1.25)
    expect(afterStudents.effectiveTicketPrice).toBe(25)

    for (const row of withStudents.projectedAudienceBreakdown) {
      if (row.segmentId === 'students-educators') continue
      const before = standardHigh.projectedAudienceBreakdown.find(
        beforeRow => beforeRow.segmentId === row.segmentId,
      )!
      expect(row.attendance).toBe(before.attendance)
      expect(row.effectiveTicketPrice).toBe(70)
    }
  })

  it('student tickets lower average yield while increasing total attendance', () => {
    const standardHigh = forecastProgram(
      makeInput({
        ...safeProgram,
        ticketPrice: 70,
        studentTicketsEnabled: false,
        studentTicketPrice: 25,
      }),
    )
    const withStudents = forecastProgram(
      makeInput({
        ...safeProgram,
        ticketPrice: 70,
        studentTicketsEnabled: true,
        studentTicketPrice: 25,
      }),
    )

    const standardYield = standardHigh.projectedRevenue / standardHigh.projectedAttendance
    const studentYield = withStudents.projectedRevenue / withStudents.projectedAttendance

    expect(withStudents.projectedAttendance).toBeGreaterThan(standardHigh.projectedAttendance)
    expect(studentYield).toBeLessThan(standardYield)
  })

  it('high standard prices hit students harder than prestige-friendly patrons', () => {
    const moderate = forecastProgram(makeInput({ ...safeProgram, ticketPrice: 50 }))
    const high = forecastProgram(makeInput({ ...safeProgram, ticketPrice: 110 }))

    const moderateStudents = moderate.projectedAudienceBreakdown.find(
      row => row.segmentId === 'students-educators',
    )!
    const highStudents = high.projectedAudienceBreakdown.find(
      row => row.segmentId === 'students-educators',
    )!
    const moderateDonors = moderate.projectedAudienceBreakdown.find(
      row => row.segmentId === 'donors-patrons',
    )!
    const highDonors = high.projectedAudienceBreakdown.find(
      row => row.segmentId === 'donors-patrons',
    )!

    expect(highStudents.priceAccessibilityScore).toBeLessThan(
      moderateStudents.priceAccessibilityScore - 30,
    )
    expect(highDonors.priceAccessibilityScore).toBeGreaterThan(
      highStudents.priceAccessibilityScore + 40,
    )
    expect(highDonors.attendance).toBeGreaterThanOrEqual(moderateDonors.attendance - 2)
  })

  it('high-price prestige lift stays small and requires donor-friendly programming', () => {
    const prestigeModerate = forecastProgram(makeInput({ ...safeProgram, ticketPrice: 70 }))
    const prestigeHigh = forecastProgram(makeInput({ ...safeProgram, ticketPrice: 110 }))
    const weakModerate = forecastProgram(makeInput({ ...adventurousProgram, ticketPrice: 70 }))
    const weakHigh = forecastProgram(makeInput({ ...adventurousProgram, ticketPrice: 110 }))

    const prestigeDonorsModerate = prestigeModerate.projectedAudienceBreakdown.find(
      row => row.segmentId === 'donors-patrons',
    )!
    const prestigeDonorsHigh = prestigeHigh.projectedAudienceBreakdown.find(
      row => row.segmentId === 'donors-patrons',
    )!
    const weakDonorsModerate = weakModerate.projectedAudienceBreakdown.find(
      row => row.segmentId === 'donors-patrons',
    )!
    const weakDonorsHigh = weakHigh.projectedAudienceBreakdown.find(
      row => row.segmentId === 'donors-patrons',
    )!
    const prestigeSupportersModerate = prestigeModerate.projectedAudienceBreakdown.find(
      row => row.segmentId === 'seasoned-supporters',
    )!
    const prestigeSupportersHigh = prestigeHigh.projectedAudienceBreakdown.find(
      row => row.segmentId === 'seasoned-supporters',
    )!

    expect(prestigeDonorsHigh.attendance - prestigeDonorsModerate.attendance).toBeLessThanOrEqual(2)
    expect(prestigeSupportersHigh.attendance - prestigeSupportersModerate.attendance).toBeLessThanOrEqual(8)
    expect(weakDonorsHigh.attendance).toBeLessThanOrEqual(weakDonorsModerate.attendance)
  })

  it('contemporary-heavy program has lower donorResponse than canon program', () => {
    const canonForecast = forecastProgram(makeInput(safeProgram))
    const adventurousForecast = forecastProgram(makeInput(adventurousProgram))
    expect(canonForecast.donorResponse).toBeGreaterThan(adventurousForecast.donorResponse)
  })

  it('sectionStress values are in [0, 100]', () => {
    const forecast = forecastProgram(makeInput(adventurousProgram))
    for (const val of Object.values(forecast.sectionStress)) {
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThanOrEqual(100)
    }
  })

  it('repertoire fit changes when principal data changes', () => {
    const weakPrincipals = principals.map(principal =>
      principal.section === 'brass'
        ? {
            ...principal,
            overall: 25,
            form: 25,
            morale: 25,
            stressResistance: 25,
            soloReliability: 25,
          }
        : principal,
    )
    const strongPrincipals = principals.map(principal =>
      principal.section === 'brass'
        ? {
            ...principal,
            overall: 90,
            form: 90,
            morale: 90,
            stressResistance: 90,
            soloReliability: 90,
          }
        : principal,
    )
    const brassProgram: ConcertProgram = {
      ...safeProgram,
      workIds: ['tchaikovsky-5', 'tchaikovsky-6', 'sibelius-7'],
    }

    const weak = forecastProgram({ ...makeInput(brassProgram), principals: weakPrincipals })
    const strong = forecastProgram({ ...makeInput(brassProgram), principals: strongPrincipals })

    expect(strong.repertoireFit.find(row => row.section === 'brass')!.stress).toBeLessThan(
      weak.repertoireFit.find(row => row.section === 'brass')!.stress,
    )
    expect(strong.performanceRisk).toBeLessThan(weak.performanceRisk)
  })

  it('supports a complete two-work program', () => {
    const twoWorkProgram: ConcertProgram = {
      workCount: 2,
      workIds: ['beethoven-9', 'tchaikovsky-manfred', null],
      intermissionAfter: 0,
      rehearsalAllocation: [10, 10, 0],
      marketingSpend: 20_000,
      ticketPrice: 85,
      studentTicketsEnabled: false,
      studentTicketPrice: 25,
    }
    const forecast = forecastProgram(makeInput(twoWorkProgram))
    expect(forecast.isComplete).toBe(true)
    expect(forecast.perWorkPerformanceRisk[0]).not.toBeNull()
    expect(forecast.perWorkPerformanceRisk[1]).not.toBeNull()
    expect(forecast.perWorkPerformanceRisk[2]).toBeNull()
  })

  it('ignores inactive third slot for two-work programs', () => {
    const twoWorkProgram: ConcertProgram = {
      workCount: 2,
      workIds: ['beethoven-9', 'tchaikovsky-manfred', 'missing-work'],
      intermissionAfter: 0,
      rehearsalAllocation: [10, 10, 0],
      marketingSpend: 20_000,
      ticketPrice: 85,
      studentTicketsEnabled: false,
      studentTicketPrice: 25,
    }
    expect(() => forecastProgram(makeInput(twoWorkProgram))).not.toThrow()
  })

  it('keeps two-work programs incomplete until both active slots are filled', () => {
    const incompleteTwoWorkProgram: ConcertProgram = {
      workCount: 2,
      workIds: ['beethoven-9', null, null],
      intermissionAfter: 0,
      rehearsalAllocation: [10, 10, 0],
      marketingSpend: 20_000,
      ticketPrice: 85,
      studentTicketsEnabled: false,
      studentTicketPrice: 25,
    }
    const forecast = forecastProgram(makeInput(incompleteTwoWorkProgram))
    expect(forecast.isComplete).toBe(false)
    expect(() => resolveConcert({ ...makeInput(incompleteTwoWorkProgram), roll: 50 })).toThrow(
      /program is incomplete/,
    )
  })

  it('requires two-work rehearsal allocation to still sum to 20', () => {
    const badTwoWorkProgram: ConcertProgram = {
      workCount: 2,
      workIds: ['beethoven-9', 'tchaikovsky-manfred', null],
      intermissionAfter: 0,
      rehearsalAllocation: [8, 8, 0],
      marketingSpend: 20_000,
      ticketPrice: 85,
      studentTicketsEnabled: false,
      studentTicketPrice: 25,
    }
    expect(() => forecastProgram(makeInput(badTwoWorkProgram))).toThrow(/sum to 20/)
  })
})

// ── resolveConcert ───────────────────────────────────────────────────────────

describe('resolveConcert', () => {
  it('produces a report with all required fields', () => {
    const report = resolveConcert({ ...makeInput(safeProgram), roll: 50 })
    expect(report.attendance).toBeGreaterThan(0)
    expect(report.revenue).toBeGreaterThan(0)
    expect(report.audienceBreakdown).toHaveLength(audienceSegments.length)
    expect(report.expenses).toBeGreaterThan(0)
    expect(typeof report.net).toBe('number')
    expect(report.performanceQuality).toBeGreaterThanOrEqual(0)
    expect(report.performanceQuality).toBeLessThanOrEqual(100)
    expect(report.sectionOutcomes).toHaveLength(4)
    expect(report.notableMoments.length).toBeGreaterThan(0)
    expect(report.institutionalDeltas).toBeDefined()
  })

  it('is deterministic with the same roll', () => {
    const a = resolveConcert({ ...makeInput(safeProgram), roll: 50 })
    const b = resolveConcert({ ...makeInput(safeProgram), roll: 50 })
    expect(a.attendance).toBe(b.attendance)
    expect(a.performanceQuality).toBe(b.performanceQuality)
  })

  it('better roll produces higher performance quality', () => {
    const bad = resolveConcert({ ...makeInput(safeProgram), roll: 10 })
    const good = resolveConcert({ ...makeInput(safeProgram), roll: 90 })
    expect(good.performanceQuality).toBeGreaterThan(bad.performanceQuality)
  })

  it('turns projected segment breakdown into actual segment breakdown with revenue math preserved', () => {
    const forecast = forecastProgram(
      makeInput({ ...safeProgram, ticketPrice: 70, studentTicketsEnabled: true }),
    )
    const report = resolveConcert({
      ...makeInput({ ...safeProgram, ticketPrice: 70, studentTicketsEnabled: true }),
      roll: 80,
    })
    const reportAttendance = report.audienceBreakdown.reduce(
      (sum, row) => sum + row.attendance,
      0,
    )
    const reportRevenue = report.audienceBreakdown.reduce(
      (sum, row) => sum + row.ticketRevenue,
      0,
    )
    const studentForecast = forecast.projectedAudienceBreakdown.find(
      row => row.segmentId === 'students-educators',
    )!
    const studentReport = report.audienceBreakdown.find(
      row => row.segmentId === 'students-educators',
    )!

    expect(report.attendance).toBe(reportAttendance)
    expect(report.revenue).toBe(reportRevenue)
    expect(report.net).toBe(reportRevenue - report.expenses)
    expect(studentReport.attendance).toBeGreaterThan(studentForecast.attendance)
    expect(studentReport.ticketRevenue).toBe(
      studentReport.attendance * studentReport.effectiveTicketPrice,
    )
    expect(
      report.audienceBreakdown.reduce((sum, row) => sum + row.shareOfHouse, 0),
    ).toBeCloseTo(1)
  })

  it('under-rehearsed adventurous program has higher risk than safe prepared program', () => {
    const risky = resolveConcert({ ...makeInput(adventurousProgram), roll: 50 })
    const safe = resolveConcert({ ...makeInput(safeProgram), roll: 50 })
    expect(safe.performanceQuality).toBeGreaterThan(risky.performanceQuality)
  })

  it('always emits at least one notable moment across the roll range', () => {
    for (let roll = 0; roll <= 100; roll += 10) {
      const safe = resolveConcert({ ...makeInput(safeProgram), roll })
      const adventurous = resolveConcert({ ...makeInput(adventurousProgram), roll })
      expect(safe.notableMoments.length).toBeGreaterThan(0)
      expect(adventurous.notableMoments.length).toBeGreaterThan(0)
    }
  })
})

// ── applyConcertReport ───────────────────────────────────────────────────────

describe('applyConcertReport', () => {
  it('updates cash by net amount', () => {
    const report = resolveConcert({ ...makeInput(safeProgram), roll: 50 })
    const next = applyConcertReport(startingInstitution, report)
    expect(next.cash).toBe(startingInstitution.cash + report.net)
  })

  it('clamps all 0-100 attributes within range', () => {
    const report = resolveConcert({ ...makeInput(safeProgram), roll: 50 })
    const next = applyConcertReport(startingInstitution, report)
    for (const key of ['artisticReputation', 'audienceTrust', 'donorConfidence', 'musicianMorale', 'technicalQuality'] as const) {
      expect(next[key]).toBeGreaterThanOrEqual(0)
      expect(next[key]).toBeLessThanOrEqual(100)
    }
  })

  it('a strong performance improves artisticReputation', () => {
    const report = resolveConcert({ ...makeInput(safeProgram), roll: 95 })
    const next = applyConcertReport(startingInstitution, report)
    expect(next.artisticReputation).toBeGreaterThan(startingInstitution.artisticReputation)
  })

  it('identity shifts toward adventurous after contemporary-heavy program', () => {
    const report = resolveConcert({ ...makeInput(adventurousProgram), roll: 50 })
    const next = applyConcertReport(startingInstitution, report)
    expect(next.identity.adventurous).toBeGreaterThan(startingInstitution.identity.adventurous)
  })
})
