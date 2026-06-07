import { describe, it, expect } from 'vitest'
import { createInitialDonors } from '../src/data/donors'
import type { DonorConcertFundingFit } from '../src/sim/seasonFunding'
import {
  negotiateConcertAsk,
  stretchCeiling,
  askTolerance,
  ceilingClarity,
} from '../src/sim/seasonSway'
import type { Donor } from '../src/types/core'

const donors = createInitialDonors().donors
// Eleanor Voss — warm (relationship 72), low volatility (34): a patient donor.
const warm = donors.find(d => d.name.startsWith('Eleanor'))!
// The Aster Foundation — cooler relationship, high volatility (78): bristly.
const volatile = donors.find(d => d.name.includes('Aster'))!

function makeFit(donor: Donor, overrides: Partial<DonorConcertFundingFit> = {}): DonorConcertFundingFit {
  return {
    donorId: donor.id,
    concertId: 'concert-0',
    concertIndex: 0,
    attraction: 60,
    aversion: 10,
    worstAversion: 10,
    musicFit: 40,
    institutionalFit: 20,
    relationshipStretch: 5,
    appetiteScore: 50,
    appetiteMultiplier: 0.5,
    maxPledge: 40_000,
    expectedLow: 36_000,
    expectedHigh: 44_000,
    workStances: [],
    notes: [],
    ...overrides,
  }
}

describe('negotiateConcertAsk', () => {
  it('asking at or below comfortable is free and met at comfortable', () => {
    const fit = makeFit(warm)
    const out = negotiateConcertAsk({ donor: warm, fit, target: 30_000, dedicated: false })
    expect(out.accepted).toBe(fit.maxPledge)
    expect(out.goodwillCost).toBe(0)
    expect(out.response).toBe('accepted')
    expect(out.doorClosed).toBe(false)
  })

  it('a modest push on a warm donor is accepted above comfortable and costs goodwill', () => {
    const fit = makeFit(warm)
    const ceiling = stretchCeiling(warm, fit, false)
    const target = Math.round((fit.maxPledge + ceiling) / 2)
    const out = negotiateConcertAsk({ donor: warm, fit, target, dedicated: false })
    expect(out.accepted).toBeGreaterThan(fit.maxPledge)
    expect(out.accepted).toBeLessThanOrEqual(ceiling)
    expect(out.goodwillCost).toBeGreaterThan(0)
  })

  it('pushing past the ceiling causes offense, recoil, and a closed door', () => {
    const fit = makeFit(warm)
    const ceiling = stretchCeiling(warm, fit, false)
    const out = negotiateConcertAsk({ donor: warm, fit, target: ceiling + 10_000, dedicated: false })
    expect(out.response).toBe('offended')
    expect(out.accepted).toBe(fit.maxPledge)
    expect(out.doorClosed).toBe(true)
    expect(out.relationshipDelta).toBeLessThan(0)
  })

  it('a dedication widens the ceiling', () => {
    const fit = makeFit(warm)
    expect(stretchCeiling(warm, fit, true)).toBeGreaterThan(stretchCeiling(warm, fit, false))
  })

  it('a volatile donor tolerates less overreach than a warm one', () => {
    const fit = makeFit(warm)
    expect(askTolerance(warm, fit, false)).toBeGreaterThan(askTolerance(volatile, makeFit(volatile), false))
  })

  it('the same volatile donor counters or balks where the warm one accepts', () => {
    const aggressive = (donor: Donor) => {
      const fit = makeFit(donor)
      const ceiling = stretchCeiling(donor, fit, false)
      // Ask near the top of the band for both donors.
      const target = Math.round(fit.maxPledge + (ceiling - fit.maxPledge) * 0.95)
      return negotiateConcertAsk({ donor, fit, target, dedicated: false }).response
    }
    const warmResponse = aggressive(warm)
    const volatileResponse = aggressive(volatile)
    const rank = { accepted: 0, countered: 1, offended: 2 } as const
    expect(rank[volatileResponse]).toBeGreaterThanOrEqual(rank[warmResponse])
  })

  it('is deterministic for identical inputs', () => {
    const fit = makeFit(warm)
    const a = negotiateConcertAsk({ donor: warm, fit, target: 45_000, dedicated: true })
    const b = negotiateConcertAsk({ donor: warm, fit, target: 45_000, dedicated: true })
    expect(a).toEqual(b)
  })

  it('ceiling clarity rises with relationship', () => {
    expect(ceilingClarity(warm)).toBeGreaterThan(ceilingClarity({ ...warm, relationship: 10, loyalty: 10 }))
  })
})
