import { describe, expect, it } from 'vitest'
import { updateDonorsAfterConcert } from '../src/sim/donorReactions'
import type {
  AudienceBreakdown,
  ConcertProgram,
  ConcertReport,
  Donor,
  DonorInstitutionalPriorities,
  DonorMusicTaste,
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

function makeWork(id: string, overrides: Partial<Work>): Work {
  return {
    id,
    title: id,
    composer: 'Test Composer',
    durationMinutes: 12,
    era: 'contemporary',
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

const classicalComfortWork = makeWork('classical-comfort', {
  era: 'classical',
  isContemporary: false,
  audienceDraw: 90,
  artisticPrestige: 85,
  donorComfort: 95,
  novelty: 5,
  identityValue: 20,
  familiarity: 90,
})

const romanticPrestigeWork = makeWork('romantic-prestige', {
  era: 'romantic',
  isContemporary: false,
  audienceDraw: 82,
  artisticPrestige: 96,
  donorComfort: 82,
  novelty: 24,
  identityValue: 58,
  familiarity: 78,
})

const experimentalWork = makeWork('signal-study', {
  era: 'contemporary',
  isContemporary: true,
  audienceDraw: 0,
  artisticPrestige: 50,
  donorComfort: 0,
  novelty: 100,
  identityValue: 100,
  familiarity: 0,
})

const inaccessibleModernistWork = makeWork('severe-grid', {
  era: 'late-romantic',
  isContemporary: false,
  audienceDraw: 12,
  artisticPrestige: 85,
  donorComfort: 20,
  novelty: 82,
  identityValue: 70,
  familiarity: 12,
})

const zeroPriorities: DonorInstitutionalPriorities = {
  prestige: 0,
  stability: 0,
  access: 0,
  reach: 0,
  revenue: 0,
  innovation: 0,
}

function makeDonor(overrides: Partial<Donor> & Pick<Donor, 'id'>): Donor {
  return {
    name: overrides.id,
    archetype: 'Formula test donor',
    description: 'Used to verify donor reaction behavior.',
    relationship: 50,
    loyalty: 50,
    commitment: 35,
    alignmentMemory: 0,
    capacity: 100_000,
    volatility: 100,
    restrictionStyle: 'general',
    musicTaste: zeroTaste,
    institutionalPriorities: zeroPriorities,
    influenceWeights: { music: 100, institutional: 0 },
    recentReaction: 'No recent read.',
    lastDelta: 0,
    ...overrides,
  }
}

function makeMusicDonor(id: string, musicTaste: DonorMusicTaste): Donor {
  return makeDonor({
    id,
    musicTaste,
    influenceWeights: { music: 100, institutional: 0 },
  })
}

function makeInstitutionalDonor(
  id: string,
  institutionalPriorities: DonorInstitutionalPriorities,
  influenceWeights: Donor['influenceWeights'] = { music: 0, institutional: 100 },
): Donor {
  return makeDonor({
    id,
    institutionalPriorities,
    influenceWeights,
  })
}

function programFor(workIds: string[]): ConcertProgram {
  return {
    workCount: workIds.length as 2 | 3,
    workIds: [workIds[0] ?? '', workIds[1] ?? '', workIds[2] ?? ''],
    intermissionAfter: workIds.length > 1 ? 1 : null,
    rehearsalAllocation: [4, 4, 4],
    marketingSpend: 0,
    ticketPrice: 40,
    studentTicketsEnabled: false,
    studentTicketPrice: 20,
  }
}

function makeAudienceBreakdown(overrides: Partial<AudienceBreakdown> = {}): AudienceBreakdown {
  return {
    segmentId: 'students-educators',
    segmentName: 'Students & educators',
    attendance: 100,
    shareOfHouse: 0.2,
    effectiveTicketPrice: 20,
    ticketRevenue: 2_000,
    priceAccessibilityScore: 50,
    ...overrides,
  }
}

function makeReport(overrides: Partial<ConcertReport> = {}): ConcertReport {
  const net = overrides.net ?? 10_000
  const revenue = overrides.revenue ?? 20_000

  return {
    attendance: 500,
    revenue,
    donorUplift: 0,
    audienceBreakdown: [makeAudienceBreakdown()],
    expenses: revenue - net,
    expenseBreakdown: { baseConcert: 10_000, rehearsal: 0, marketing: 0, production: 0, total: 10_000 },
    net,
    financialNotes: [],
    performanceQuality: 70,
    audienceResponse: 70,
    criticResponse: 70,
    memoryAnchorWorkId: null,
    sectionOutcomes: [],
    rosterChanges: [],
    notableMoments: [],
    institutionalDeltas: {
      cash: 0,
      artisticReputation: 0,
      audienceTrust: 0,
      donorConfidence: 0,
      musicianMorale: 0,
      technicalQuality: 0,
      identity: {},
    },
    ...overrides,
  }
}

const report = makeReport()

const works = [classicalComfortWork, romanticPrestigeWork, experimentalWork, inaccessibleModernistWork]

function react(donor: Donor, selectedWorks: readonly Work[], concertReport: ConcertReport = report, program = programFor(selectedWorks.map(work => work.id))): Donor {
  return updateDonorsAfterConcert({
    donorState: { donors: [donor] },
    program,
    report: concertReport,
    works,
  }).donors[0]
}

describe('updateDonorsAfterConcert', () => {
  it.each([
    {
      name: 'focused experimental donor warms to experimental programming',
      taste: { ...zeroTaste, experimental: 100 },
      selectedWorks: [experimentalWork],
      expectedSign: 'positive',
    },
    {
      name: 'focused experimental donor cools to safe classical comfort programming',
      taste: { ...zeroTaste, experimental: 100 },
      selectedWorks: [classicalComfortWork],
      expectedSign: 'negative',
    },
    {
      name: 'focused canon donor warms to safe classical comfort programming',
      taste: { ...zeroTaste, classicalCanon: 100 },
      selectedWorks: [classicalComfortWork],
      expectedSign: 'positive',
    },
    {
      name: 'focused canon donor cools to experimental programming',
      taste: { ...zeroTaste, classicalCanon: 100 },
      selectedWorks: [experimentalWork],
      expectedSign: 'negative',
    },
    {
      name: 'focused romantic donor warms to romantic prestige programming',
      taste: { ...zeroTaste, romantic: 100 },
      selectedWorks: [romanticPrestigeWork],
      expectedSign: 'positive',
    },
    {
      name: 'focused accessible donor warms to accessible familiar programming',
      taste: { ...zeroTaste, accessible: 100 },
      selectedWorks: [classicalComfortWork],
      expectedSign: 'positive',
    },
    {
      name: 'focused accessible donor cools to inaccessible modernist programming',
      taste: { ...zeroTaste, accessible: 100 },
      selectedWorks: [inaccessibleModernistWork],
      expectedSign: 'negative',
    },
    {
      name: 'hybrid canon/access donor warms to a mixed comfortable programme',
      taste: { ...zeroTaste, classicalCanon: 80, accessible: 80 },
      selectedWorks: [classicalComfortWork, romanticPrestigeWork],
      expectedSign: 'positive',
    },
    {
      name: 'hybrid new-music donor warms to severe modernist and experimental programming',
      taste: { ...zeroTaste, modernist: 70, contemporary: 80, experimental: 90 },
      selectedWorks: [inaccessibleModernistWork, experimentalWork],
      expectedSign: 'positive',
    },
  ] as const)('$name', ({ taste, selectedWorks, expectedSign }) => {
    const donor = makeMusicDonor('permutation-donor', taste)
    const next = react(donor, selectedWorks)

    if (expectedSign === 'positive') {
      expect(next.lastDelta).toBeGreaterThan(0)
      expect(next.relationship).toBeGreaterThan(donor.relationship)
      expect(next.recentReaction).toContain('music landed')
    } else {
      expect(next.lastDelta).toBeLessThan(0)
      expect(next.relationship).toBeLessThan(donor.relationship)
      expect(next.recentReaction).toContain('music grated')
    }
  })

  it('ignores axes with zero stated importance instead of diluting focused taste', () => {
    const focusedDonor = makeMusicDonor('focused-experimental-donor', {
      ...zeroTaste,
      experimental: 100,
    })
    const broadlyDemandingDonor = makeMusicDonor('broadly-demanding-donor', {
      classicalCanon: 100,
      romantic: 100,
      modernist: 100,
      contemporary: 100,
      experimental: 100,
      accessible: 100,
    })

    const focusedReaction = react(focusedDonor, [experimentalWork])
    const broadReaction = react(broadlyDemandingDonor, [experimentalWork])

    expect(focusedReaction.lastDelta).toBeGreaterThan(0)
    expect(broadReaction.lastDelta).toBeLessThan(focusedReaction.lastDelta)
  })

  it('still clamps relationship movement at the 0-100 bounds', () => {
    const donor = {
      ...makeMusicDonor('already-maxed-donor', { ...zeroTaste, experimental: 100 }),
      relationship: 99,
    }

    const next = react(donor, [experimentalWork])

    expect(next.lastDelta).toBeGreaterThan(0)
    expect(next.relationship).toBe(100)
  })

  it.each([
    {
      name: 'prestige-first donor warms to strong critic and performance signals',
      priorities: { ...zeroPriorities, prestige: 100 },
      concertReport: makeReport({ criticResponse: 95, performanceQuality: 90 }),
      selectedWorks: [romanticPrestigeWork],
      expectedSign: 'positive',
    },
    {
      name: 'prestige-first donor cools to weak critic and performance signals',
      priorities: { ...zeroPriorities, prestige: 100 },
      concertReport: makeReport({ criticResponse: 20, performanceQuality: 30 }),
      selectedWorks: [romanticPrestigeWork],
      expectedSign: 'negative',
    },
    {
      name: 'stability-first donor warms to strong net and audience response',
      priorities: { ...zeroPriorities, stability: 100 },
      concertReport: makeReport({ net: 35_000, revenue: 50_000, audienceResponse: 90 }),
      selectedWorks: [classicalComfortWork],
      expectedSign: 'positive',
    },
    {
      name: 'stability-first donor cools to poor net and weak audience response',
      priorities: { ...zeroPriorities, stability: 100 },
      concertReport: makeReport({ net: -45_000, revenue: 5_000, audienceResponse: 25 }),
      selectedWorks: [classicalComfortWork],
      expectedSign: 'negative',
    },
    {
      name: 'access-first donor warms to low student price and accessible audience response',
      priorities: { ...zeroPriorities, access: 100 },
      concertReport: makeReport({
        audienceResponse: 90,
        audienceBreakdown: [makeAudienceBreakdown({ priceAccessibilityScore: 95 })],
      }),
      selectedWorks: [classicalComfortWork],
      program: { ...programFor(['classical-comfort']), studentTicketsEnabled: true, studentTicketPrice: 5 },
      expectedSign: 'positive',
    },
    {
      name: 'access-first donor cools when access programme is absent and prices are high',
      priorities: { ...zeroPriorities, access: 100 },
      concertReport: makeReport({
        audienceResponse: 20,
        audienceBreakdown: [makeAudienceBreakdown({ priceAccessibilityScore: 10 })],
      }),
      selectedWorks: [classicalComfortWork],
      program: { ...programFor(['classical-comfort']), studentTicketsEnabled: false, ticketPrice: 95 },
      expectedSign: 'negative',
    },
    {
      name: 'reach-first donor warms to a full house',
      priorities: { ...zeroPriorities, reach: 100 },
      concertReport: makeReport({ attendance: 1_200 }),
      selectedWorks: [classicalComfortWork],
      expectedSign: 'positive',
    },
    {
      name: 'reach-first donor cools to an empty hall',
      priorities: { ...zeroPriorities, reach: 100 },
      concertReport: makeReport({ attendance: 200 }),
      selectedWorks: [classicalComfortWork],
      expectedSign: 'negative',
    },
    {
      name: 'revenue-first donor warms to high revenue and strong net',
      priorities: { ...zeroPriorities, revenue: 100 },
      concertReport: makeReport({ revenue: 90_000, net: 45_000 }),
      selectedWorks: [classicalComfortWork],
      expectedSign: 'positive',
    },
    {
      name: 'innovation-first donor warms to novel identity programming',
      priorities: { ...zeroPriorities, innovation: 100 },
      concertReport: makeReport(),
      selectedWorks: [experimentalWork],
      expectedSign: 'positive',
    },
    {
      name: 'innovation-first donor cools to low-novelty comfort programming',
      priorities: { ...zeroPriorities, innovation: 100 },
      concertReport: makeReport(),
      selectedWorks: [classicalComfortWork],
      expectedSign: 'negative',
    },
  ] as const)('$name', ({ priorities, concertReport, selectedWorks, program, expectedSign }) => {
    const donor = makeInstitutionalDonor('institutional-permutation-donor', priorities)
    const next = react(donor, selectedWorks, concertReport, program)

    if (expectedSign === 'positive') {
      expect(next.lastDelta).toBeGreaterThan(0)
      expect(next.relationship).toBeGreaterThan(donor.relationship)
      expect(next.recentReaction).toContain('institutional signals reassured them')
    } else {
      expect(next.lastDelta).toBeLessThan(0)
      expect(next.relationship).toBeLessThan(donor.relationship)
      expect(next.recentReaction).toContain('institutional signals worried them')
    }
  })

  it('lets institutional priorities override a donor’s musical taste when weighted more heavily', () => {
    const donor = makeDonor({
      id: 'institution-led-donor',
      musicTaste: { ...zeroTaste, classicalCanon: 100 },
      institutionalPriorities: { ...zeroPriorities, innovation: 100 },
      influenceWeights: { music: 20, institutional: 80 },
    })

    const next = react(donor, [experimentalWork], makeReport())

    expect(next.lastDelta).toBeGreaterThan(0)
    expect(next.relationship).toBeGreaterThan(donor.relationship)
    expect(next.recentReaction).toContain('institutional signals reassured them')
  })
})
