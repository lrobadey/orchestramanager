import { describe, it, expect } from 'vitest'
import {
  computeRehearsalDivisor,
  rehearsalHoursNeeded,
  capAudienceToHall,
  HALL_CAPACITY,
} from '../src/sim/scoring'
import { Work, Principal, AudienceBreakdown } from '../src/types/core'

function makeRow(segmentId: string, attendance: number, price: number): AudienceBreakdown {
  return {
    segmentId,
    segmentName: segmentId,
    attendance,
    shareOfHouse: 0,
    effectiveTicketPrice: price,
    ticketRevenue: attendance * price,
    priceAccessibilityScore: 100,
  }
}

function makePrincipal(section: Principal['section'], leadership: number): Principal {
  return {
    id: `test-${section}-${leadership}`,
    name: 'Test',
    position: 'Test',
    section,
    overall: 60,
    morale: 60,
    form: 60,
    intonation: 60,
    rhythm: 60,
    endurance: 60,
    tone: 60,
    blend: 60,
    soloReliability: 60,
    leadership,
    stressResistance: 60,
    newMusicFluency: 60,
    classicalFluency: 60,
    romanticFluency: 60,
  }
}

function makeWork(demands: Work['demands'], familiarity = 0): Work {
  return {
    id: 'test-work',
    title: 'Test Work',
    composer: 'Test',
    durationMinutes: 30,
    era: 'classical',
    isContemporary: false,
    audienceDraw: 50,
    artisticPrestige: 50,
    donorComfort: 50,
    novelty: 50,
    identityValue: 50,
    rehearsalLoad: 40,
    familiarity,
    demands,
  }
}

describe('computeRehearsalDivisor', () => {
  it('section weighting: high brass leadership helps brass-heavy pieces more than strings-heavy ones', () => {
    const brassHeavy = makeWork({ strings: 20, winds: 20, brass: 80, percussion: 20 })
    const stringsHeavy = makeWork({ strings: 80, winds: 20, brass: 20, percussion: 20 })

    const lowBrass = [makePrincipal('brass', 20)]
    const highBrass = [makePrincipal('brass', 90)]

    const brassHeavyLow = computeRehearsalDivisor(brassHeavy, lowBrass)
    const brassHeavyHigh = computeRehearsalDivisor(brassHeavy, highBrass)
    const stringsHeavyLow = computeRehearsalDivisor(stringsHeavy, lowBrass)
    const stringsHeavyHigh = computeRehearsalDivisor(stringsHeavy, highBrass)

    // Brass leadership improvement has a bigger effect on the brass-heavy piece
    const brassGain = brassHeavyHigh - brassHeavyLow
    const stringsGain = stringsHeavyHigh - stringsHeavyLow
    expect(brassGain).toBeGreaterThan(stringsGain)
  })

  it('higher section leadership always produces a higher divisor (fewer hours needed)', () => {
    const work = makeWork({ strings: 25, winds: 25, brass: 25, percussion: 25 })
    const low = [makePrincipal('strings', 10), makePrincipal('winds', 10),
                 makePrincipal('brass', 10), makePrincipal('percussion', 10)]
    const high = [makePrincipal('strings', 90), makePrincipal('winds', 90),
                  makePrincipal('brass', 90), makePrincipal('percussion', 90)]

    expect(computeRehearsalDivisor(work, high)).toBeGreaterThan(computeRehearsalDivisor(work, low))
  })

  it('fallback: sections with no principals use leadership 50, producing divisor 5.25', () => {
    // A work that only has weight in strings, with no principals at all
    const work = makeWork({ strings: 100, winds: 0, brass: 0, percussion: 0 })
    const divisor = computeRehearsalDivisor(work, [])
    expect(divisor).toBeCloseTo(5.25, 5)
  })

  it('leadership clamp: leadership > 100 is clamped to 100, divisor capped at 7 (at familiarity 0)', () => {
    const work = makeWork({ strings: 100, winds: 0, brass: 0, percussion: 0 })
    const clamped = computeRehearsalDivisor(work, [makePrincipal('strings', 100)])
    const over = computeRehearsalDivisor(work, [makePrincipal('strings', 150)])
    expect(over).toBeCloseTo(clamped, 5)
    expect(over).toBeCloseTo(7.0, 5)
  })

  it('familiarity boost: higher familiarity increases the divisor and reduces hours needed', () => {
    const demands = { strings: 50, winds: 50, brass: 0, percussion: 0 }
    const unfamiliar = makeWork(demands, 0)
    const wellKnown = makeWork(demands, 100)
    const principals = [makePrincipal('strings', 80), makePrincipal('winds', 80)]

    const unfamiliarDivisor = computeRehearsalDivisor(unfamiliar, principals)
    const wellKnownDivisor = computeRehearsalDivisor(wellKnown, principals)

    // Familiarity 100 contributes exactly +2 to the divisor
    expect(wellKnownDivisor - unfamiliarDivisor).toBeCloseTo(2, 5)
    expect(
      rehearsalHoursNeeded(wellKnown.rehearsalLoad, wellKnownDivisor),
    ).toBeLessThan(rehearsalHoursNeeded(unfamiliar.rehearsalLoad, unfamiliarDivisor))
  })

  it('familiarity clamp: familiarity > 100 is clamped to 100 (max bonus +2)', () => {
    const demands = { strings: 100, winds: 0, brass: 0, percussion: 0 }
    const overFamiliar = makeWork(demands, 150)
    const principals = [makePrincipal('strings', 100)]
    expect(computeRehearsalDivisor(overFamiliar, principals)).toBeCloseTo(9.0, 5)
  })

  it('balanced demands: weighted average matches manual calculation', () => {
    // strings leadership 100 → divisor 7, winds leadership 0 → divisor 3.5
    // equal weights → average 5.25
    const work = makeWork({ strings: 50, winds: 50, brass: 0, percussion: 0 })
    const principals = [makePrincipal('strings', 100), makePrincipal('winds', 0)]
    const divisor = computeRehearsalDivisor(work, principals)
    expect(divisor).toBeCloseTo(5.25, 5)
  })

  it('zero totalWeight guard: all-zero demands return fallback 5.25', () => {
    const work = makeWork({ strings: 0, winds: 0, brass: 0, percussion: 0 })
    expect(computeRehearsalDivisor(work, [])).toBe(5.25)
  })

  it('rehearsalHoursNeeded decreases as divisor increases', () => {
    expect(rehearsalHoursNeeded(40, 5)).toBeCloseTo(8, 5)
    expect(rehearsalHoursNeeded(40, 7)).toBeCloseTo(5.714, 2)
    expect(rehearsalHoursNeeded(40, 7)).toBeLessThan(rehearsalHoursNeeded(40, 5))
  })
})

describe('capAudienceToHall', () => {
  it('leaves under-capacity demand untouched but assigns share-of-house', () => {
    const rows = [makeRow('a', 300, 70), makeRow('b', 200, 50)]
    const capped = capAudienceToHall(rows)
    expect(capped.map(r => r.attendance)).toEqual([300, 200])
    expect(capped[0].ticketRevenue).toBe(300 * 70)
    expect(capped[0].shareOfHouse).toBeCloseTo(300 / 500, 5)
    expect(capped[1].shareOfHouse).toBeCloseTo(200 / 500, 5)
  })

  it('never seats more than the hall holds when demand overflows', () => {
    const rows = [makeRow('a', 5000, 70), makeRow('b', 4000, 50), makeRow('c', 3000, 30)]
    const capped = capAudienceToHall(rows)
    const total = capped.reduce((s, r) => s + r.attendance, 0)
    expect(total).toBeLessThanOrEqual(HALL_CAPACITY)
    // a sold-out house gets within a rounding seat of the ceiling
    expect(total).toBeGreaterThanOrEqual(HALL_CAPACITY - capped.length)
  })

  it('scales every segment by the same factor, preserving the audience mix', () => {
    const rows = [makeRow('a', 6000, 70), makeRow('b', 3000, 50), makeRow('c', 3000, 30)]
    const capped = capAudienceToHall(rows)
    // original mix is 50% / 25% / 25%; capping should keep those ratios
    expect(capped[0].shareOfHouse).toBeCloseTo(0.5, 2)
    expect(capped[1].shareOfHouse).toBeCloseTo(0.25, 2)
    expect(capped[2].shareOfHouse).toBeCloseTo(0.25, 2)
  })

  it('recomputes ticket revenue from the capped attendance', () => {
    const rows = [makeRow('a', 6000, 70), makeRow('b', 6000, 30)]
    const capped = capAudienceToHall(rows)
    for (const row of capped) {
      expect(row.ticketRevenue).toBe(row.attendance * row.effectiveTicketPrice)
    }
  })
})
