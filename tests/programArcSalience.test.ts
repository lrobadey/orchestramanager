import { describe, it, expect } from 'vitest'
import { computeProgramArcSalience } from '../src/sim/programArcSalience'
import { forecastProgram, type ForecastInput } from '../src/sim/forecastProgram'
import { resolveConcert } from '../src/sim/resolveConcert'
import { audienceSegments } from '../src/data/audienceSegments'
import { principals } from '../src/data/principals'
import { startingInstitution } from '../src/data/institution'
import type { ConcertProgram, Work } from '../src/types/core'

const baseWork: Work = {
  id: 'base-work',
  title: 'Base Work',
  composer: 'Test Composer',
  durationMinutes: 30,
  era: 'romantic',
  isContemporary: false,
  audienceDraw: 60,
  artisticPrestige: 60,
  donorComfort: 60,
  novelty: 30,
  identityValue: 30,
  rehearsalLoad: 50,
  familiarity: 50,
  demands: { strings: 60, winds: 50, brass: 40, percussion: 30 },
}

type WorkOverrides = Partial<Omit<Work, 'demands'>> & {
  demands?: Partial<Work['demands']>
}

function makeWork(overrides: WorkOverrides = {}): Work {
  const { demands, ...rest } = overrides
  return {
    ...baseWork,
    ...rest,
    demands: { ...baseWork.demands, ...demands },
  }
}

function makeProgram(
  workIds: [string, string, string],
  rehearsalAllocation: [number, number, number],
): ConcertProgram {
  return {
    workCount: 3,
    workIds,
    intermissionAfter: 1,
    rehearsalAllocation,
    marketingSpend: 15_000,
    ticketPrice: 65,
    studentTicketsEnabled: false,
    studentTicketPrice: 25,
  }
}

function makeInput(works: Work[], program: ConcertProgram): ForecastInput {
  return {
    works,
    institution: startingInstitution,
    principals,
    audienceSegments,
    program,
  }
}

describe('computeProgramArcSalience', () => {
  it('weights finale damage above opener damage above middle damage', () => {
    const result = computeProgramArcSalience([0, 1, 2].map(slotIndex => ({
      slotIndex,
      workCount: 3 as const,
      work: makeWork({ id: `work-${slotIndex}` }),
      rehearsalPressure: 30,
      performanceRisk: 50,
    })))

    const opener = result.perWork.find(work => work.placementRole === 'opener')!
    const middle = result.perWork.find(work => work.placementRole === 'middle')!
    const finale = result.perWork.find(work => work.placementRole === 'finale')!

    expect(finale.placementWeight).toBeGreaterThan(opener.placementWeight)
    expect(opener.placementWeight).toBeGreaterThan(middle.placementWeight)
    expect(finale.perceivedDamage).toBeGreaterThan(opener.perceivedDamage)
    expect(opener.perceivedDamage).toBeGreaterThan(middle.perceivedDamage)
  })

  it('increases damage weight as duration increases', () => {
    const short = computeProgramArcSalience([{
      slotIndex: 0,
      workCount: 2,
      work: makeWork({ id: 'short-work', durationMinutes: 10 }),
      rehearsalPressure: 30,
      performanceRisk: 50,
    }]).perWork[0]
    const long = computeProgramArcSalience([{
      slotIndex: 0,
      workCount: 2,
      work: makeWork({ id: 'long-work', durationMinutes: 60 }),
      rehearsalPressure: 30,
      performanceRisk: 50,
    }]).perWork[0]

    expect(long.durationWeight).toBeGreaterThan(short.durationWeight)
    expect(long.perceivedDamage).toBeGreaterThan(short.perceivedDamage)
  })

  it('increases damage weight as familiarity increases', () => {
    const obscure = computeProgramArcSalience([{
      slotIndex: 0,
      workCount: 2,
      work: makeWork({ id: 'obscure-work', familiarity: 5 }),
      rehearsalPressure: 30,
      performanceRisk: 50,
    }]).perWork[0]
    const familiar = computeProgramArcSalience([{
      slotIndex: 0,
      workCount: 2,
      work: makeWork({ id: 'familiar-work', familiarity: 95 }),
      rehearsalPressure: 30,
      performanceRisk: 50,
    }]).perWork[0]

    expect(familiar.familiarityWeight).toBeGreaterThan(obscure.familiarityWeight)
    expect(familiar.perceivedDamage).toBeGreaterThan(obscure.perceivedDamage)
  })

  it('increases damage weight as prestige increases', () => {
    const modest = computeProgramArcSalience([{
      slotIndex: 0,
      workCount: 2,
      work: makeWork({ id: 'modest-work', artisticPrestige: 20 }),
      rehearsalPressure: 30,
      performanceRisk: 50,
    }]).perWork[0]
    const prestigious = computeProgramArcSalience([{
      slotIndex: 0,
      workCount: 2,
      work: makeWork({ id: 'prestigious-work', artisticPrestige: 95 }),
      rehearsalPressure: 30,
      performanceRisk: 50,
    }]).perWork[0]

    expect(prestigious.prestigeWeight).toBeGreaterThan(modest.prestigeWeight)
    expect(prestigious.perceivedDamage).toBeGreaterThan(modest.perceivedDamage)
  })

  it('maps slot 1 as the finale in a two-work program', () => {
    const result = computeProgramArcSalience([
      {
        slotIndex: 0,
        workCount: 2,
        work: makeWork({ id: 'two-work-opener' }),
        rehearsalPressure: 20,
        performanceRisk: 40,
      },
      {
        slotIndex: 1,
        workCount: 2,
        work: makeWork({ id: 'two-work-finale' }),
        rehearsalPressure: 20,
        performanceRisk: 40,
      },
    ])

    expect(result.perWork[0].placementRole).toBe('opener')
    expect(result.perWork[1].placementRole).toBe('finale')
  })

  it('ignores inactive third slots when only active two-work inputs are supplied', () => {
    const result = computeProgramArcSalience([
      {
        slotIndex: 0,
        workCount: 2,
        work: makeWork({ id: 'active-opener' }),
        rehearsalPressure: 20,
        performanceRisk: 40,
      },
      {
        slotIndex: 1,
        workCount: 2,
        work: makeWork({ id: 'active-finale' }),
        rehearsalPressure: 20,
        performanceRisk: 40,
      },
    ])

    expect(result.perWork).toHaveLength(2)
    expect(result.perWork.some(work => work.slotIndex === 2)).toBe(false)
  })

  it('clamps perceived damage and never returns negative damage', () => {
    const surplus = computeProgramArcSalience([{
      slotIndex: 0,
      workCount: 2,
      work: makeWork({ id: 'surplus-work' }),
      rehearsalPressure: -30,
      performanceRisk: 10,
    }]).perWork[0]
    const extreme = computeProgramArcSalience([{
      slotIndex: 0,
      workCount: 2,
      work: makeWork({ id: 'extreme-work', durationMinutes: 90, familiarity: 100, artisticPrestige: 100 }),
      rehearsalPressure: 400,
      performanceRisk: 100,
    }]).perWork[0]

    expect(surplus.perceivedDamage).toBe(0)
    expect(extreme.perceivedDamage).toBeGreaterThanOrEqual(0)
    expect(extreme.perceivedDamage).toBeLessThanOrEqual(100)
  })

  it('lets high-novelty works generate identity upside when performance risk is low', () => {
    const lowNovelty = computeProgramArcSalience([{
      slotIndex: 1,
      workCount: 2,
      work: makeWork({ id: 'low-novelty-work', novelty: 5 }),
      rehearsalPressure: 0,
      performanceRisk: 10,
    }]).perWork[0]
    const highNovelty = computeProgramArcSalience([{
      slotIndex: 1,
      workCount: 2,
      work: makeWork({ id: 'high-novelty-work', novelty: 95 }),
      rehearsalPressure: 0,
      performanceRisk: 10,
    }]).perWork[0]

    expect(highNovelty.noveltyVolatilityWeight).toBeGreaterThan(lowNovelty.noveltyVolatilityWeight)
    expect(highNovelty.perceivedUpside).toBeGreaterThan(lowNovelty.perceivedUpside)
  })
})

describe('program arc forecast and resolve integration', () => {
  it('changes perceived damage when the same under-rehearsed work moves slots', () => {
    const anchor = makeWork({
      id: 'anchor-work',
      title: 'Anchor Work',
      durationMinutes: 45,
      artisticPrestige: 85,
      familiarity: 85,
      rehearsalLoad: 80,
    })
    const bufferA = makeWork({ id: 'buffer-a', title: 'Buffer A', durationMinutes: 18, rehearsalLoad: 15 })
    const bufferB = makeWork({ id: 'buffer-b', title: 'Buffer B', durationMinutes: 18, rehearsalLoad: 15 })

    const middleForecast = forecastProgram(makeInput(
      [anchor, bufferA, bufferB],
      makeProgram(['buffer-a', 'anchor-work', 'buffer-b'], [9, 1, 10]),
    ))
    const finaleForecast = forecastProgram(makeInput(
      [anchor, bufferA, bufferB],
      makeProgram(['buffer-a', 'buffer-b', 'anchor-work'], [9, 10, 1]),
    ))

    expect(middleForecast.perWorkRehearsalPressure[1]).toBeCloseTo(
      finaleForecast.perWorkRehearsalPressure[2]!,
    )
    expect(finaleForecast.perWorkArcDamage[2]!).toBeGreaterThan(
      middleForecast.perWorkArcDamage[1]!,
    )
  })

  it('changes the memory anchor when equal salience risk is moved to the finale', () => {
    const workA = makeWork({ id: 'work-a', title: 'Work A', rehearsalLoad: 70, artisticPrestige: 80, familiarity: 80 })
    const workB = makeWork({ id: 'work-b', title: 'Work B', rehearsalLoad: 70, artisticPrestige: 80, familiarity: 80 })
    const center = makeWork({ id: 'center-work', title: 'Center Work', rehearsalLoad: 10, artisticPrestige: 35, familiarity: 25 })

    const first = forecastProgram(makeInput(
      [workA, workB, center],
      makeProgram(['work-a', 'center-work', 'work-b'], [4, 12, 4]),
    ))
    const second = forecastProgram(makeInput(
      [workA, workB, center],
      makeProgram(['work-b', 'center-work', 'work-a'], [4, 12, 4]),
    ))

    expect(first.memoryAnchorWorkId).toBe('work-b')
    expect(second.memoryAnchorWorkId).toBe('work-a')
  })

  it('makes an under-rehearsed finale land worse than the same under-rehearsed middle work', () => {
    const anchor = makeWork({
      id: 'anchor-work',
      title: 'Anchor Work',
      durationMinutes: 45,
      artisticPrestige: 85,
      familiarity: 85,
      rehearsalLoad: 80,
    })
    const bufferA = makeWork({ id: 'buffer-a', title: 'Buffer A', durationMinutes: 18, rehearsalLoad: 15 })
    const bufferB = makeWork({ id: 'buffer-b', title: 'Buffer B', durationMinutes: 18, rehearsalLoad: 15 })

    const middleReport = resolveConcert({
      ...makeInput([anchor, bufferA, bufferB], makeProgram(['buffer-a', 'anchor-work', 'buffer-b'], [9, 1, 10])),
      roll: 50,
    })
    const finaleReport = resolveConcert({
      ...makeInput([anchor, bufferA, bufferB], makeProgram(['buffer-a', 'buffer-b', 'anchor-work'], [9, 10, 1])),
      roll: 50,
    })

    expect(finaleReport.audienceResponse).toBeLessThan(middleReport.audienceResponse)
    expect(finaleReport.criticResponse).toBeLessThan(middleReport.criticResponse)
    expect(finaleReport.memoryAnchorWorkId).toBe('anchor-work')
  })
})
