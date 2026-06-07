import { describe, expect, it } from 'vitest'
import {
  computeOperatingSupport,
  computeSeasonFunding,
  scoreDonorConcertFundingFit,
  scoreDonorWorkStance,
  splitDonorCapacity,
} from '../src/sim/seasonFunding'
import { createSwayState, swayKey } from '../src/sim/seasonSway'
import type {
  ConcertProgram,
  Donor,
  DonorInstitutionalPriorities,
  DonorMusicTaste,
  InstitutionState,
  Work,
} from '../src/types/core'

const zeroTaste: DonorMusicTaste = {
  classicalCanon: 0,
  romantic: 0,
  modernist: 0,
  contemporary: 0,
  experimental: 0,
  accessible: 0,
}

const zeroPriorities: DonorInstitutionalPriorities = {
  prestige: 0,
  stability: 0,
  access: 0,
  reach: 0,
  revenue: 0,
  innovation: 0,
}

const institution: InstitutionState = {
  name: 'Test Philharmonic',
  city: 'Test City',
  seasonLabel: 'Season 1',
  cash: 180_000,
  artisticReputation: 50,
  audienceTrust: 45,
  donorConfidence: 52,
  musicianMorale: 55,
  technicalQuality: 55,
  identity: { adventurous: 55, communityFocused: 45, scholarly: 50 },
}

function makeWork(id: string, overrides: Partial<Work>): Work {
  return {
    id,
    title: id,
    composer: 'Test Composer',
    durationMinutes: 20,
    era: 'classical',
    isContemporary: false,
    audienceDraw: 50,
    artisticPrestige: 50,
    donorComfort: 50,
    novelty: 50,
    identityValue: 50,
    rehearsalLoad: 30,
    familiarity: 50,
    demands: { strings: 20, winds: 20, brass: 20, percussion: 20 },
    ...overrides,
  }
}

const mozart = makeWork('mozart', {
  title: 'Mozart Symphony',
  durationMinutes: 30,
  era: 'classical',
  audienceDraw: 68,
  artisticPrestige: 84,
  donorComfort: 90,
  novelty: 14,
  identityValue: 25,
  familiarity: 82,
})

const beethoven = makeWork('beethoven', {
  title: 'Beethoven Symphony',
  durationMinutes: 34,
  era: 'romantic',
  audienceDraw: 80,
  artisticPrestige: 92,
  donorComfort: 86,
  novelty: 20,
  identityValue: 42,
  familiarity: 90,
})

const ravel = makeWork('ravel', {
  title: 'Ravel Suite',
  durationMinutes: 18,
  era: 'late-romantic',
  audienceDraw: 58,
  artisticPrestige: 86,
  donorComfort: 45,
  novelty: 58,
  identityValue: 60,
  familiarity: 48,
})

const shortContemporary = makeWork('short-contemporary', {
  title: 'Short Contemporary Opener',
  durationMinutes: 7,
  era: 'contemporary',
  isContemporary: true,
  audienceDraw: 28,
  artisticPrestige: 62,
  donorComfort: 18,
  novelty: 82,
  identityValue: 78,
  familiarity: 8,
})

const majorExperimental = makeWork('major-experimental', {
  title: 'Major Experimental Centerpiece',
  durationMinutes: 42,
  era: 'contemporary',
  isContemporary: true,
  audienceDraw: 4,
  artisticPrestige: 55,
  donorComfort: 0,
  novelty: 100,
  identityValue: 100,
  familiarity: 0,
})

const works = [mozart, beethoven, ravel, shortContemporary, majorExperimental]

function makeDonor(overrides: Partial<Donor> & Pick<Donor, 'id'>): Donor {
  const { id, ...rest } = overrides
  return {
    id,
    name: id,
    archetype: 'Test donor',
    description: 'Formula test donor.',
    relationship: 60,
    loyalty: 55,
    commitment: 45,
    alignmentMemory: 0,
    capacity: 100_000,
    volatility: 45,
    restrictionStyle: 'general',
    musicTaste: zeroTaste,
    institutionalPriorities: zeroPriorities,
    influenceWeights: { music: 100, institutional: 0 },
    recentReaction: 'No recent read.',
    lastDelta: 0,
    ...rest,
  }
}

const asterLike = makeDonor({
  id: 'aster-like',
  relationship: 58,
  loyalty: 44,
  commitment: 32,
  capacity: 120_000,
  volatility: 78,
  musicTaste: {
    classicalCanon: 8,
    romantic: 18,
    modernist: 70,
    contemporary: 94,
    experimental: 82,
    accessible: 38,
  },
  institutionalPriorities: { ...zeroPriorities, prestige: 86, innovation: 96, access: 52 },
  influenceWeights: { music: 55, institutional: 45 },
})

const eleanorLike = makeDonor({
  id: 'eleanor-like',
  relationship: 72,
  loyalty: 82,
  commitment: 68,
  capacity: 85_000,
  volatility: 34,
  musicTaste: {
    classicalCanon: 98,
    romantic: 82,
    modernist: 36,
    contemporary: 10,
    experimental: 3,
    accessible: 52,
  },
  institutionalPriorities: { ...zeroPriorities, prestige: 96, stability: 84, revenue: 42 },
  influenceWeights: { music: 75, institutional: 25 },
})

function programFor(ids: string[]): ConcertProgram {
  return {
    workCount: ids.length as 2 | 3,
    workIds: [ids[0] ?? null, ids[1] ?? null, ids[2] ?? null],
    intermissionAfter: ids.length > 1 ? 1 : null,
    rehearsalAllocation: [6, 6, 6],
    marketingSpend: 5_000,
    marketingStyle: 'prestige',
    ticketPrice: 65,
    studentTicketsEnabled: false,
    studentTicketPrice: 20,
  }
}

function fit(donor: Donor, ids: string[], cost = 40_000) {
  return scoreDonorConcertFundingFit({
    donor,
    concert: { index: 0, name: 'Test concert', program: programFor(ids), cost },
    works,
    institution,
  })
}

describe('season funding fit scoring', () => {
  it('separates positive attraction from active aversion at work level', () => {
    const canonRead = scoreDonorWorkStance(eleanorLike, beethoven)
    const experimentalRead = scoreDonorWorkStance(eleanorLike, majorExperimental)

    expect(canonRead.attraction).toBeGreaterThan(experimentalRead.attraction)
    expect(experimentalRead.aversion).toBeGreaterThan(canonRead.aversion)
  })

  it('does not give Aster-like new-music donors appetite for pure Mozart', () => {
    const pureMozart = fit(asterLike, ['mozart', 'beethoven'])

    expect(pureMozart.appetiteMultiplier).toBe(0)
    expect(pureMozart.maxPledge).toBe(0)
  })

  it('lets a newer work redeem adjacent Ravel for Aster-like donors', () => {
    const pureMozart = fit(asterLike, ['mozart', 'beethoven'])
    const ravelWithNewWork = fit(asterLike, ['ravel', 'short-contemporary'])

    expect(ravelWithNewWork.appetiteScore).toBeGreaterThan(pureMozart.appetiteScore)
    expect(ravelWithNewWork.maxPledge).toBeGreaterThan(0)
  })

  it('lets Eleanor-like canon donors tolerate a low-salience contemporary opener', () => {
    const canonWithSmallRisk = fit(eleanorLike, ['short-contemporary', 'beethoven'])

    expect(canonWithSmallRisk.maxPledge).toBeGreaterThan(0)
  })

  it('lets high-salience experimental aversion poison the concert', () => {
    const smallRisk = fit(eleanorLike, ['short-contemporary', 'beethoven'])
    const bigRisk = fit(eleanorLike, ['beethoven', 'major-experimental'])

    expect(bigRisk.worstAversion).toBeGreaterThan(smallRisk.worstAversion)
    expect(bigRisk.appetiteScore).toBeLessThan(smallRisk.appetiteScore)
    expect(bigRisk.maxPledge).toBe(0)
  })

  it('uses relationship warmth to stretch borderline concerts without overriding deep aversion', () => {
    const cold = { ...eleanorLike, relationship: 25, loyalty: 35, commitment: 30 }
    const warm = { ...eleanorLike, relationship: 95, loyalty: 90, commitment: 80 }

    expect(fit(warm, ['short-contemporary', 'beethoven']).maxPledge)
      .toBeGreaterThan(fit(cold, ['short-contemporary', 'beethoven']).maxPledge)
    expect(fit(warm, ['beethoven', 'major-experimental']).maxPledge).toBe(0)
  })
})

describe('season funding allocation', () => {
  it('caps absorption at concert cost and leaves unused donor capacity emergent', () => {
    const result = computeSeasonFunding({
      donors: [eleanorLike],
      concerts: [{ index: 0, name: 'Canon night', program: programFor(['beethoven', 'mozart']), cost: 30_000 }],
      works,
      institution,
    })

    expect(result.concerts[0].pledged).toBeLessThanOrEqual(30_000)
    expect(result.donors[0].pledged).toBeLessThan(eleanorLike.capacity)
  })

  it('makes music-heavy donors concentrate on their strongest concert', () => {
    const result = computeSeasonFunding({
      donors: [eleanorLike],
      concerts: [
        { index: 0, name: 'Canon night', program: programFor(['beethoven', 'mozart']), cost: 40_000 },
        { index: 1, name: 'New night', program: programFor(['ravel', 'short-contemporary']), cost: 40_000 },
      ],
      works,
      institution,
    })

    expect(result.concerts[0].pledged).toBeGreaterThan(result.concerts[1].pledged)
  })

  it('lets institution-heavy donors spread toward uncovered concerts', () => {
    const institutionHeavy = makeDonor({
      id: 'institution-heavy',
      relationship: 80,
      loyalty: 80,
      commitment: 75,
      capacity: 90_000,
      musicTaste: { ...zeroTaste, classicalCanon: 70, contemporary: 70, accessible: 70 },
      institutionalPriorities: { ...zeroPriorities, prestige: 70, stability: 80, access: 65, innovation: 70 },
      influenceWeights: { music: 20, institutional: 80 },
    })

    const result = computeSeasonFunding({
      donors: [institutionHeavy],
      concerts: [
        { index: 0, name: 'Canon night', program: programFor(['beethoven', 'mozart']), cost: 35_000 },
        { index: 1, name: 'Mixed night', program: programFor(['ravel', 'short-contemporary']), cost: 35_000 },
      ],
      works,
      institution,
    })

    expect(result.concerts[0].pledged).toBeGreaterThan(0)
    expect(result.concerts[1].pledged).toBeGreaterThan(0)
  })

  it('leaves results identical when no sway is applied', () => {
    const concerts = [{ index: 0, name: 'Canon night', program: programFor(['beethoven', 'mozart']), cost: 60_000 }]
    const plain = computeSeasonFunding({ donors: [eleanorLike], concerts, works, institution })
    const empty = computeSeasonFunding({ donors: [eleanorLike], concerts, works, institution, sway: createSwayState() })
    expect(empty.concerts[0].pledged).toBe(plain.concerts[0].pledged)
    expect(empty.goodwillSpent).toBe(0)
  })

  it('uses volatility to widen pledge ranges and change realized amounts deterministically', () => {
    const lowVolatility = { ...eleanorLike, id: 'low-vol', volatility: 10 }
    const highVolatility = { ...eleanorLike, id: 'high-vol', volatility: 90 }

    const result = computeSeasonFunding({
      donors: [lowVolatility, highVolatility],
      concerts: [{ index: 0, name: 'Canon night', program: programFor(['beethoven', 'mozart']), cost: 80_000 }],
      works,
      institution,
    })

    const low = result.donors.find(donor => donor.donorId === 'low-vol')?.pledges[0]
    const high = result.donors.find(donor => donor.donorId === 'high-vol')?.pledges[0]

    expect(low).toBeTruthy()
    expect(high).toBeTruthy()
    const lowRelativeWidth = (low!.expectedHigh - low!.expectedLow) / low!.pledgedAmount
    const highRelativeWidth = (high!.expectedHigh - high!.expectedLow) / high!.pledgedAmount
    expect(highRelativeWidth).toBeGreaterThan(lowRelativeWidth)
    expect(high!.realizedAmount).not.toBe(high!.pledgedAmount)
  })

  it('splits one donor wallet so institutional donors reserve operating budget before concert asks', () => {
    const institutionalDonor = makeDonor({
      id: 'operating-first',
      capacity: 100_000,
      relationship: 90,
      loyalty: 90,
      commitment: 90,
      musicTaste: { ...zeroTaste, classicalCanon: 100, romantic: 80, accessible: 70 },
      institutionalPriorities: { ...zeroPriorities, stability: 90, reach: 80, revenue: 75 },
      influenceWeights: { music: 25, institutional: 75 },
    })

    const split = splitDonorCapacity(institutionalDonor)
    const result = computeSeasonFunding({
      donors: [institutionalDonor],
      concerts: [{ index: 0, name: 'Canon night', program: programFor(['beethoven', 'mozart']), cost: 100_000 }],
      works,
      institution,
    })

    expect(split.operatingBudget).toBe(75_000)
    expect(split.concertCapacity).toBe(25_000)
    expect(result.donors[0].concertCapacity).toBe(25_000)
    expect(result.donors[0].pledged).toBeLessThanOrEqual(25_000)
    expect(result.donors[0].operatingBudget).toBe(75_000)
  })

  it('projects operating support from institutional health instead of concert appetite', () => {
    const donor = makeDonor({
      id: 'health-funder',
      capacity: 80_000,
      institutionalPriorities: { ...zeroPriorities, stability: 100, reach: 80, revenue: 80 },
      influenceWeights: { music: 20, institutional: 80 },
    })
    const strong = computeOperatingSupport({
      donors: [donor],
      institution: {
        ...institution,
        cash: 420_000,
        donorConfidence: 80,
        audienceTrust: 82,
        musicianMorale: 75,
      },
    })
    const weak = computeOperatingSupport({
      donors: [donor],
      institution: {
        ...institution,
        cash: 40_000,
        donorConfidence: 20,
        audienceTrust: 25,
        musicianMorale: 35,
      },
    })

    expect(strong[0].operatingBudget).toBe(64_000)
    expect(strong[0].projectedSeasonAmount).toBeGreaterThan(weak[0].projectedSeasonAmount)
    expect(strong[0].perConcertAmount).toBe(Math.round(strong[0].projectedSeasonAmount / 4))
  })
})

describe('season funding sway', () => {
  // Ample capacity and a high cost so pledges are appetite-limited (not capped
  // by capacity or cost), leaving headroom for a push to register.
  const bigDonor = makeDonor({ ...eleanorLike, id: 'eleanor-big', capacity: 300_000 })
  const concerts = [{ index: 0, name: 'Canon night', program: programFor(['beethoven', 'mozart']), cost: 300_000 }]
  const base = () => computeSeasonFunding({ donors: [bigDonor], concerts, works, institution })

  it('a dedication raises the donor’s effective ceiling on their home night and warms them', () => {
    const dedicated = computeSeasonFunding({
      donors: [bigDonor],
      concerts,
      works,
      institution,
      sway: { ...createSwayState(), dedications: [bigDonor.id, null, null, null] },
    })
    expect(dedicated.donors[0].fits[0].maxPledge).toBeGreaterThan(base().donors[0].fits[0].maxPledge)
    expect(dedicated.donors[0].relationshipDelta).toBeGreaterThan(0)
    expect(dedicated.donors[0].pledges[0].dedicated).toBe(true)
  })

  it('a push above comfortable raises the pledge and spends goodwill', () => {
    const comfortable = base().donors[0].fits[0].maxPledge
    const sway = { ...createSwayState(), asks: { [swayKey(bigDonor.id, 0)]: comfortable + 8_000 } }
    const pushed = computeSeasonFunding({ donors: [bigDonor], concerts, works, institution, sway })
    expect(pushed.goodwillSpent).toBeGreaterThan(0)
    expect(pushed.donors[0].pledges[0].pushed).toBe(true)
    expect(pushed.concerts[0].pledged).toBeGreaterThan(base().concerts[0].pledged)
    expect(pushed.donors[0].doorClosed).toBe(false)
  })

  it('an over-push past the ceiling offends the donor and closes the door', () => {
    const comfortable = base().donors[0].fits[0].maxPledge
    const sway = { ...createSwayState(), asks: { [swayKey(bigDonor.id, 0)]: comfortable * 5 } }
    const offended = computeSeasonFunding({ donors: [bigDonor], concerts, works, institution, sway })
    expect(offended.donors[0].doorClosed).toBe(true)
    expect(offended.donors[0].relationshipDelta).toBeLessThan(0)
  })
})
