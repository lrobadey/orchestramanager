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
// Rehearsal hours needed depend on section leadership; with the starting
// principals (~5.4 weighted divisor) these want ~5.5/6.4/8.3h respectively.
// With [7,7,6] allocation this is near-balanced but slightly under on Tchaikovsky 6.
const safeProgram: ConcertProgram = {
  workIds: ['beethoven-5', 'beethoven-7', 'tchaikovsky-6'],
  intermissionAfter: 1,
  rehearsalAllocation: [7, 7, 6],
  marketingSpend: 15_000,
  ticketPrice: 65,
}

// Contemporary-heavy program — loads 65/60/58, needing ~12-13h each with the
// starting principals. With a 20hr total and [7,7,6] allocation every piece
// will be deeply under-rehearsed.
const adventurousProgram: ConcertProgram = {
  workIds: ['harbor-grid', 'glacier-index', 'night-ferry'],
  intermissionAfter: 1,
  rehearsalAllocation: [7, 7, 6],
  marketingSpend: 5_000,
  ticketPrice: 55,
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
})

// ── resolveConcert ───────────────────────────────────────────────────────────

describe('resolveConcert', () => {
  it('produces a report with all required fields', () => {
    const report = resolveConcert({ ...makeInput(safeProgram), roll: 50 })
    expect(report.attendance).toBeGreaterThan(0)
    expect(report.revenue).toBeGreaterThan(0)
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
