import { describe, expect, it } from 'vitest'
import {
  BASE_SCALE_PER_SERVICE,
  CORE_LIST,
  EXTRA_PAY_MULTIPLIER,
  PRINCIPAL_CHAIRS,
  PRINCIPAL_PAY_MULTIPLIER,
  SERVICE_HOURS,
  computePayroll,
  sectionServiceCost,
} from '../src/sim/labor'
import type { Work } from '../src/types/core'

function makeWork(id: string, forces: Work['forces'], overrides: Partial<Work> = {}): Work {
  return {
    id,
    title: id,
    composer: 'Test Composer',
    durationMinutes: 20,
    era: 'romantic',
    isContemporary: false,
    audienceDraw: 50,
    artisticPrestige: 50,
    donorComfort: 50,
    novelty: 30,
    identityValue: 30,
    rehearsalLoad: 40,
    familiarity: 50,
    demands: { strings: 50, winds: 50, brass: 50, percussion: 30 },
    forces,
    ...overrides,
  }
}

const chamberForces = { strings: 30, winds: 6, brass: 4, percussion: 1 }
const largeForces = { strings: 48, winds: 10, brass: 10, percussion: 4 }

describe('sectionServiceCost', () => {
  it('pays principals a premium and everyone else scale inside the core list', () => {
    // 10 winds requested, core list is 9: 4 principals, 5 core players, 1 extra.
    const cost = sectionServiceCost('winds', 10)
    const expected =
      (PRINCIPAL_CHAIRS.winds * PRINCIPAL_PAY_MULTIPLIER +
        (CORE_LIST.winds - PRINCIPAL_CHAIRS.winds) +
        1 * EXTRA_PAY_MULTIPLIER) *
      BASE_SCALE_PER_SERVICE
    expect(cost).toBe(expected)
  })

  it('charges no extras premium when forces fit the core list', () => {
    const within = sectionServiceCost('strings', CORE_LIST.strings)
    const expected =
      (PRINCIPAL_CHAIRS.strings * PRINCIPAL_PAY_MULTIPLIER +
        (CORE_LIST.strings - PRINCIPAL_CHAIRS.strings)) *
      BASE_SCALE_PER_SERVICE
    expect(within).toBe(expected)
  })

  it('costs nothing for an empty section', () => {
    expect(sectionServiceCost('percussion', 0)).toBe(0)
  })
})

describe('computePayroll', () => {
  it('staffs the concert at the largest requirement across the program', () => {
    const works = [
      makeWork('small', chamberForces),
      makeWork('large', largeForces),
    ]
    const payroll = computePayroll(works, [10, 10])
    expect(payroll.concertForces).toEqual(largeForces)
    expect(payroll.musicians).toBe(48 + 10 + 10 + 4)
    expect(payroll.extraPlayers).toBe(48 - CORE_LIST.strings + (10 - CORE_LIST.winds) + (10 - CORE_LIST.brass) + (4 - CORE_LIST.percussion))
  })

  it('prices each rehearsal hour at that work\'s headcount, not the program\'s', () => {
    const small = makeWork('small', chamberForces)
    const large = makeWork('large', largeForces)

    // Same total hours, shifted toward the big piece: payroll must rise.
    const hoursOnSmall = computePayroll([small, large], [14, 6])
    const hoursOnLarge = computePayroll([small, large], [6, 14])
    expect(hoursOnLarge.rehearsalPayroll).toBeGreaterThan(hoursOnSmall.rehearsalPayroll)

    // Concert payroll is identical — the same orchestra walks on stage.
    expect(hoursOnLarge.concertPayroll).toBe(hoursOnSmall.concertPayroll)
  })

  it('rehearsal payroll equals headcount cost prorated by service hours', () => {
    const work = makeWork('only', chamberForces)
    const hours = 10
    const payroll = computePayroll([work], [hours])
    const perServiceCost =
      sectionServiceCost('strings', 30) +
      sectionServiceCost('winds', 6) +
      sectionServiceCost('brass', 4) +
      sectionServiceCost('percussion', 1)
    expect(payroll.rehearsalPayroll).toBe(Math.round((perServiceCost / SERVICE_HOURS) * hours))
    expect(payroll.concertPayroll).toBe(Math.round(perServiceCost))
  })

  it('a large-forces program costs meaningfully more than a chamber-scale one', () => {
    const chamber = computePayroll([makeWork('chamber', chamberForces)], [20])
    const large = computePayroll([makeWork('large', largeForces)], [20])
    expect(large.total).toBeGreaterThan(chamber.total * 1.4)
  })
})
