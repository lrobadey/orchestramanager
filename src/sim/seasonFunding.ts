import type {
  ConcertProgram,
  Donor,
  DonorInstitutionalPriorities,
  DonorMusicTaste,
  ExpenseBreakdown,
  InstitutionState,
  Work,
} from '../types/core'
import { buildConcertMusicProfile } from './donorReactions'
import { average, clamp, computeExpenseBreakdown, marketingEffect } from './scoring'
import { negotiateConcertAsk, swayKey, type AskResponse, type SwayState } from './seasonSway'

// Dedication and a restricted ("named") ask raise the donor's comfortable
// pledge before any push — a home night, or a gift tied to their cause, simply
// means more.
const DEDICATION_COMFORT_BOOST = 1.2
const RESTRICTED_COMFORT_BOOST = 1.15

// Per-(donor, concert) outcome of the player's sway, folded into the fit before
// allocation so the existing greedy fill and realized-swing logic handle it.
interface SwayOutcome {
  effectiveMaxPledge: number
  goodwillCost: number
  relationshipDelta: number
  doorClosed: boolean
  response: AskResponse
  pushed: boolean
  restricted: boolean
  dedicated: boolean
}

export interface SeasonFundingConcertInput {
  id?: string
  index: number
  name: string
  program: ConcertProgram | null
  cost?: number
}

export interface DonorWorkStance {
  donorId: string
  workId: string
  workTitle: string
  attraction: number
  aversion: number
  salience: number
  notes: string[]
}

export interface DonorConcertFundingFit {
  donorId: string
  concertId: string
  concertIndex: number
  attraction: number
  aversion: number
  worstAversion: number
  musicFit: number
  institutionalFit: number
  relationshipStretch: number
  appetiteScore: number
  appetiteMultiplier: number
  maxPledge: number
  expectedLow: number
  expectedHigh: number
  workStances: DonorWorkStance[]
  notes: string[]
}

export interface DonorConcertPledge {
  donorId: string
  donorName: string
  concertId: string
  concertIndex: number
  pledgedAmount: number
  expectedLow: number
  expectedHigh: number
  realizedAmount: number
  appetiteScore: number
  // Sway metadata (present when the player worked this pledge):
  pushed?: boolean
  response?: AskResponse
  restricted?: boolean
  dedicated?: boolean
}

export interface ConcertFundingResult {
  concertId: string
  concertIndex: number
  name: string
  cost: number
  pledged: number
  realized: number
  coveragePercent: number
  realizedCoveragePercent: number
  gap: number
  pledges: DonorConcertPledge[]
  fits: DonorConcertFundingFit[]
}

export interface DonorFundingResult {
  donorId: string
  donorName: string
  capacity: number
  pledged: number
  realized: number
  unusedCapacity: number
  pledges: DonorConcertPledge[]
  fits: DonorConcertFundingFit[]
  // Sway aftermath: relationship change earned this season and whether an
  // over-push has closed the donor's door.
  relationshipDelta: number
  doorClosed: boolean
}

export interface SeasonFundingResult {
  seasonCost: number
  pledged: number
  realized: number
  coveragePercent: number
  realizedCoveragePercent: number
  concerts: ConcertFundingResult[]
  donors: DonorFundingResult[]
  // Goodwill consumed by the asks the player made (0 when none).
  goodwillSpent: number
}

interface NormalizedConcert {
  id: string
  index: number
  name: string
  program: ConcertProgram
  works: Work[]
  cost: number
  expenseBreakdown: ExpenseBreakdown
}

export function scoreDonorWorkStance(
  donor: Donor,
  work: Work,
  context: { salience?: number } = {},
): DonorWorkStance {
  const musicProfile = buildConcertMusicProfile([work])
  const tasteAxes = Object.keys(donor.musicTaste) as Array<keyof DonorMusicTaste>
  const tasteMass = tasteAxes.reduce((sum, axis) => sum + donor.musicTaste[axis], 0) || 1
  const profileMass = tasteAxes.reduce((sum, axis) => sum + musicProfile[axis], 0) || 1

  const attraction = tasteAxes.reduce((sum, axis) => {
    const taste = donor.musicTaste[axis]
    const profile = musicProfile[axis]
    const importance = taste / tasteMass
    return sum + Math.min(taste, profile) * importance
  }, 0)

  const aversion = tasteAxes.reduce((sum, axis) => {
    const taste = donor.musicTaste[axis]
    const profile = musicProfile[axis]
    const exposure = profile / profileMass
    const dislike = Math.pow((100 - taste) / 100, 1.35)
    return sum + profile * exposure * dislike
  }, 0)

  const notes: string[] = []
  const strongestAttraction = strongestAxis(donor.musicTaste, musicProfile, 'attraction')
  const strongestAversion = strongestAxis(donor.musicTaste, musicProfile, 'aversion')
  if (strongestAttraction) notes.push(`Attracted by ${strongestAttraction}.`)
  if (strongestAversion) notes.push(`Concerned by ${strongestAversion}.`)

  return {
    donorId: donor.id,
    workId: work.id,
    workTitle: work.title,
    attraction: Math.round(clamp(attraction, 0, 100)),
    aversion: Math.round(clamp(aversion, 0, 100)),
    salience: context.salience ?? 1,
    notes,
  }
}

export function scoreDonorConcertFundingFit({
  donor,
  concert,
  works,
  institution,
}: {
  donor: Donor
  concert: SeasonFundingConcertInput
  works: readonly Work[]
  institution: InstitutionState
}): DonorConcertFundingFit {
  const programWorks = concert.program ? resolveProgramWorks(concert.program, works) : []
  const normalizedCost = concert.program
    ? concert.cost ?? computeConcertExpenseBreakdown(concert.program, programWorks).total
    : 0
  const saliences = computeWorkSaliences(programWorks)
  const workStances = programWorks.map((work, index) =>
    scoreDonorWorkStance(donor, work, { salience: saliences[index] ?? 0 }),
  )

  const attraction = workStances.reduce((sum, stance) => sum + stance.attraction * stance.salience, 0)
  const weightedAversion = workStances.reduce((sum, stance) => sum + stance.aversion * stance.salience, 0)
  const worstAversion = workStances.reduce(
    (worst, stance) => Math.max(worst, stance.aversion * (0.65 + stance.salience)),
    0,
  )
  const nonlinearAversionPenalty =
    Math.pow(clamp(worstAversion, 0, 100) / 100, 1.55) * 72 + weightedAversion * 0.42
  const musicFit = clamp((attraction - nonlinearAversionPenalty) * 0.82, -75, 75)
  const institutionalFit = concert.program
    ? scoreInstitutionalFit(
        donor.institutionalPriorities,
        buildFundingInstitutionalProfile({
          institution,
          program: concert.program,
          works: programWorks,
          concertCost: normalizedCost,
        }),
      )
    : -50

  const musicWeight = donor.influenceWeights.music / 100
  const institutionalWeight = donor.influenceWeights.institutional / 100
  const relationshipBase = donor.relationship * 0.5 + donor.loyalty * 0.25 + donor.commitment * 0.25
  const relationshipStretch = (relationshipBase - 50) * 0.35
  const aversionTolerance = 74 + donor.relationship * 0.08 + donor.loyalty * 0.05
  const hardAversionDrag = Math.max(0, worstAversion - aversionTolerance) * 1.15
  const appetiteScore = clamp(
    musicFit * musicWeight + institutionalFit * institutionalWeight + relationshipStretch - hardAversionDrag,
    -100,
    100,
  )
  const appetiteMultiplier = appetiteScoreToMultiplier(appetiteScore)
  const commitmentFactor = clamp(0.35 + donor.commitment / 130 + donor.relationship / 450, 0.35, 1.25)
  const maxPledge = Math.round(donor.capacity * appetiteMultiplier * commitmentFactor)
  const volatilityRange = pledgeRange(maxPledge, donor.volatility)

  const notes: string[] = []
  if (attraction >= 55) notes.push('Strong positive donor attraction.')
  if (weightedAversion >= 45 || worstAversion >= 70) notes.push('One or more works create aversion pressure.')
  if (relationshipStretch > 5) notes.push('Relationship warmth increases stretch.')
  if (relationshipStretch < -5) notes.push('Weak relationship reduces stretch.')
  if (appetiteMultiplier <= 0) notes.push('Below funding appetite threshold.')

  return {
    donorId: donor.id,
    concertId: concert.id ?? `concert-${concert.index}`,
    concertIndex: concert.index,
    attraction: Math.round(attraction),
    aversion: Math.round(weightedAversion),
    worstAversion: Math.round(worstAversion),
    musicFit: Math.round(musicFit),
    institutionalFit: Math.round(institutionalFit),
    relationshipStretch: Math.round(relationshipStretch),
    appetiteScore: Math.round(appetiteScore),
    appetiteMultiplier: roundTo(appetiteMultiplier, 3),
    maxPledge,
    expectedLow: volatilityRange.low,
    expectedHigh: volatilityRange.high,
    workStances,
    notes,
  }
}

// Fold the player's sway (dedication / restricted / pushed ask) into a fit:
// dedication and a named ask raise the comfortable pledge, then any push is
// negotiated against the donor's emergent ceiling. The result is an effective
// cap the existing allocation can spend against.
function applySway(donor: Donor, fit: DonorConcertFundingFit, sway: SwayState): SwayOutcome {
  const dedicated = sway.dedications[fit.concertIndex] === donor.id
  const key = swayKey(donor.id, fit.concertIndex)
  const restricted = Boolean(sway.restricted[key])
  const requested = sway.asks[key] ?? 0

  let comfortBoost = 1
  if (dedicated) comfortBoost *= DEDICATION_COMFORT_BOOST
  if (restricted && fit.appetiteScore > 0) comfortBoost *= RESTRICTED_COMFORT_BOOST
  const boostedComfortable = Math.round(fit.maxPledge * comfortBoost)
  const target = Math.max(requested, boostedComfortable)

  const outcome = negotiateConcertAsk({ donor, fit: { ...fit, maxPledge: boostedComfortable }, target, dedicated })

  return {
    effectiveMaxPledge: outcome.accepted,
    goodwillCost: outcome.goodwillCost,
    // Mild cross-season drift: a dedication warms the donor; an over-push cools
    // them (the negotiate relationshipDelta).
    relationshipDelta: outcome.relationshipDelta + (dedicated ? 1 : 0),
    doorClosed: outcome.doorClosed,
    response: outcome.response,
    pushed: requested > boostedComfortable,
    restricted,
    dedicated,
  }
}

export function computeSeasonFunding({
  donors,
  concerts,
  works,
  institution,
  sway,
}: {
  donors: readonly Donor[]
  concerts: readonly SeasonFundingConcertInput[]
  works: readonly Work[]
  institution: InstitutionState
  sway?: SwayState
}): SeasonFundingResult {
  const normalizedConcerts = concerts
    .filter((concert): concert is SeasonFundingConcertInput & { program: ConcertProgram } => Boolean(concert.program))
    .map(concert => normalizeConcert(concert, works))

  const fitByDonor = new Map<string, DonorConcertFundingFit[]>()
  const swayByKey = new Map<string, SwayOutcome>()
  for (const donor of donors) {
    const fits = normalizedConcerts.map(concert => {
      const base = scoreDonorConcertFundingFit({ donor, concert, works, institution })
      if (!sway) return base
      const outcome = applySway(donor, base, sway)
      swayByKey.set(swayKey(donor.id, base.concertIndex), outcome)
      if (!outcome.dedicated && !outcome.restricted && outcome.effectiveMaxPledge === base.maxPledge) {
        return base
      }
      const band = pledgeRange(outcome.effectiveMaxPledge, donor.volatility)
      return { ...base, maxPledge: outcome.effectiveMaxPledge, expectedLow: band.low, expectedHigh: band.high }
    })
    fitByDonor.set(donor.id, fits)
  }

  const pledgedByConcert = new Map<string, DonorConcertPledge[]>()
  const remainingGap = new Map(normalizedConcerts.map(concert => [concert.id, concert.cost]))
  const donorPledges = new Map<string, DonorConcertPledge[]>()

  for (const donor of donors) {
    const fits = fitByDonor.get(donor.id) ?? []
    let remainingCapacity = donor.capacity
    const donorConcertPledges: DonorConcertPledge[] = []

    if (donor.influenceWeights.institutional > donor.influenceWeights.music) {
      const remainingFitCapacity = new Map(fits.map(fit => [fit.concertId, fit.maxPledge]))
      while (remainingCapacity > 0) {
        const eligible = fits
          .filter(fit => (remainingFitCapacity.get(fit.concertId) ?? 0) > 0)
          .filter(fit => (remainingGap.get(fit.concertId) ?? 0) > 0)
          .filter(fit => fit.appetiteMultiplier > 0)
          .sort((a, b) => {
            const coverageA = coverageFor(a.concertId, normalizedConcerts, remainingGap)
            const coverageB = coverageFor(b.concertId, normalizedConcerts, remainingGap)
            if (coverageA !== coverageB) return coverageA - coverageB
            return b.appetiteScore - a.appetiteScore || a.concertIndex - b.concertIndex
          })
        if (eligible.length === 0) break

        const fit = eligible[0]
        const gap = remainingGap.get(fit.concertId) ?? 0
        const fitCapacity = remainingFitCapacity.get(fit.concertId) ?? 0
        const spreadChunk = Math.max(2_500, donor.capacity * 0.22)
        const amount = Math.round(Math.min(gap, fitCapacity, remainingCapacity, spreadChunk))
        if (amount <= 0) break
        recordPledge({ donor, fit, amount, donorConcertPledges, pledgedByConcert })
        remainingGap.set(fit.concertId, gap - amount)
        remainingFitCapacity.set(fit.concertId, fitCapacity - amount)
        remainingCapacity -= amount
      }
    } else {
      const orderedFits = [...fits]
        .filter(fit => fit.appetiteMultiplier > 0)
        .sort((a, b) => b.appetiteScore - a.appetiteScore || a.concertIndex - b.concertIndex)

      for (const fit of orderedFits) {
        if (remainingCapacity <= 0) break
        const gap = remainingGap.get(fit.concertId) ?? 0
        if (gap <= 0) continue
        const amount = Math.round(Math.min(gap, fit.maxPledge, remainingCapacity))
        if (amount <= 0) continue
        recordPledge({ donor, fit, amount, donorConcertPledges, pledgedByConcert })
        remainingGap.set(fit.concertId, gap - amount)
        remainingCapacity -= amount
      }
    }

    donorPledges.set(donor.id, donorConcertPledges)
  }

  // Stamp sway metadata onto the pledges the player worked (pledge objects are
  // shared between the per-concert and per-donor views, so annotate once).
  if (sway) {
    for (const pledges of donorPledges.values()) {
      for (const pledge of pledges) {
        const outcome = swayByKey.get(swayKey(pledge.donorId, pledge.concertIndex))
        if (!outcome) continue
        pledge.pushed = outcome.pushed
        pledge.response = outcome.response
        pledge.restricted = outcome.restricted
        pledge.dedicated = outcome.dedicated
      }
    }
  }

  const concertResults = normalizedConcerts.map(concert => {
    const pledges = pledgedByConcert.get(concert.id) ?? []
    const pledged = pledges.reduce((sum, pledge) => sum + pledge.pledgedAmount, 0)
    const realized = pledges.reduce((sum, pledge) => sum + pledge.realizedAmount, 0)
    return {
      concertId: concert.id,
      concertIndex: concert.index,
      name: concert.name,
      cost: concert.cost,
      pledged,
      realized,
      coveragePercent: concert.cost > 0 ? pledged / concert.cost : 0,
      realizedCoveragePercent: concert.cost > 0 ? realized / concert.cost : 0,
      gap: Math.max(0, concert.cost - pledged),
      pledges,
      fits: donors.map(donor => fitByDonor.get(donor.id)?.find(fit => fit.concertId === concert.id)).filter((fit): fit is DonorConcertFundingFit => Boolean(fit)),
    }
  })

  const donorResults = donors.map(donor => {
    const pledges = donorPledges.get(donor.id) ?? []
    const pledged = pledges.reduce((sum, pledge) => sum + pledge.pledgedAmount, 0)
    const realized = pledges.reduce((sum, pledge) => sum + pledge.realizedAmount, 0)
    // Sum the sway aftermath across this donor's concerts.
    const donorSway = normalizedConcerts
      .map(concert => swayByKey.get(swayKey(donor.id, concert.index)))
      .filter((outcome): outcome is SwayOutcome => Boolean(outcome))
    const relationshipDelta = donorSway.reduce((sum, outcome) => sum + outcome.relationshipDelta, 0)
    const doorClosed = donorSway.some(outcome => outcome.doorClosed)
    return {
      donorId: donor.id,
      donorName: donor.name,
      capacity: donor.capacity,
      pledged,
      realized,
      unusedCapacity: Math.max(0, donor.capacity - pledged),
      pledges,
      fits: fitByDonor.get(donor.id) ?? [],
      relationshipDelta,
      doorClosed,
    }
  })

  const seasonCost = concertResults.reduce((sum, concert) => sum + concert.cost, 0)
  const pledged = concertResults.reduce((sum, concert) => sum + concert.pledged, 0)
  const realized = concertResults.reduce((sum, concert) => sum + concert.realized, 0)
  const goodwillSpent = [...swayByKey.values()].reduce((sum, outcome) => sum + outcome.goodwillCost, 0)

  return {
    seasonCost,
    pledged,
    realized,
    coveragePercent: seasonCost > 0 ? pledged / seasonCost : 0,
    realizedCoveragePercent: seasonCost > 0 ? realized / seasonCost : 0,
    concerts: concertResults,
    donors: donorResults,
    goodwillSpent,
  }
}

function normalizeConcert(
  concert: SeasonFundingConcertInput & { program: ConcertProgram },
  works: readonly Work[],
): NormalizedConcert {
  const concertWorks = resolveProgramWorks(concert.program, works)
  const expenseBreakdown = computeConcertExpenseBreakdown(concert.program, concertWorks)
  return {
    id: concert.id ?? `concert-${concert.index}`,
    index: concert.index,
    name: concert.name,
    program: concert.program,
    works: concertWorks,
    cost: Math.round(concert.cost ?? expenseBreakdown.total),
    expenseBreakdown,
  }
}

function computeConcertExpenseBreakdown(program: ConcertProgram, works: readonly Work[]): ExpenseBreakdown {
  const rehearsalHours = program.rehearsalAllocation
    .slice(0, program.workCount)
    .reduce((sum, hours) => sum + hours, 0)
  return computeExpenseBreakdown([...works], rehearsalHours, program.marketingSpend)
}

function resolveProgramWorks(program: ConcertProgram, works: readonly Work[]): Work[] {
  return program.workIds
    .slice(0, program.workCount)
    .map(id => works.find(work => work.id === id))
    .filter((work): work is Work => Boolean(work))
}

function computeWorkSaliences(works: readonly Work[]): number[] {
  if (works.length === 0) return []
  const totalDuration = works.reduce((sum, work) => sum + work.durationMinutes, 0) || works.length
  const raw = works.map((work, index) => {
    const durationShare = work.durationMinutes / totalDuration
    const placement = index === works.length - 1 ? 1.18 : index === 0 ? 0.9 : 1
    const identitySignal = (work.novelty + work.identityValue + work.artisticPrestige) / 300
    return durationShare * placement * (0.82 + identitySignal * 0.36)
  })
  const total = raw.reduce((sum, value) => sum + value, 0) || 1
  return raw.map(value => value / total)
}

function buildFundingInstitutionalProfile({
  institution,
  program,
  works,
  concertCost,
}: {
  institution: InstitutionState
  program: ConcertProgram
  works: readonly Work[]
  concertCost: number
}): DonorInstitutionalPriorities {
  const prestige = works.length > 0 ? average(works.map(work => work.artisticPrestige)) : 0
  const novelty = works.length > 0 ? average(works.map(work => work.novelty)) : 0
  const identity = works.length > 0 ? average(works.map(work => work.identityValue)) : 0
  const audienceDraw = works.length > 0 ? average(works.map(work => work.audienceDraw)) : 0
  const donorComfort = works.length > 0 ? average(works.map(work => work.donorComfort)) : 0
  const marketingReach = marketingEffect(program.marketingSpend)
  const studentAccess = program.studentTicketsEnabled
    ? clamp(100 - program.studentTicketPrice * 2.4, 20, 100)
    : 20
  const ticketAccessibility = clamp(100 - Math.max(0, program.ticketPrice - 35) * 1.2, 15, 100)
  const cashCushion = concertCost > 0 ? institution.cash / concertCost : 0

  return {
    prestige: Math.round(clamp(prestige * 0.68 + institution.artisticReputation * 0.32, 0, 100)),
    stability: Math.round(clamp(42 + institution.donorConfidence * 0.22 + cashCushion * 5, 0, 100)),
    access: Math.round(clamp(studentAccess * 0.7 + ticketAccessibility * 0.18 + marketingReach * 0.7, 0, 100)),
    reach: Math.round(clamp(audienceDraw * 0.46 + marketingReach * 2.8, 0, 100)),
    revenue: Math.round(clamp(audienceDraw * 0.3 + donorComfort * 0.25 + ticketAccessibility * 0.22 + marketingReach, 0, 100)),
    innovation: Math.round(clamp(novelty * 0.55 + identity * 0.3 + institution.identity.adventurous * 0.15, 0, 100)),
  }
}

function scoreInstitutionalFit(
  priorities: DonorInstitutionalPriorities,
  concertProfile: DonorInstitutionalPriorities,
): number {
  const axes = Object.keys(priorities) as Array<keyof DonorInstitutionalPriorities>
  const totalWeight = axes.reduce((sum, axis) => sum + priorities[axis], 0) || 1
  const weighted = axes.reduce(
    (sum, axis) => sum + concertProfile[axis] * (priorities[axis] / totalWeight),
    0,
  )
  return clamp(weighted - 50, -50, 50)
}

function appetiteScoreToMultiplier(score: number): number {
  if (score <= 5) return 0
  return clamp(Math.pow((score - 5) / 55, 1.18), 0, 1)
}

function pledgeRange(pledge: number, volatility: number): { low: number; high: number } {
  const width = 0.07 + clamp(volatility, 0, 100) / 100 * 0.34
  return {
    low: Math.round(pledge * (1 - width)),
    high: Math.round(pledge * (1 + width)),
  }
}

function recordPledge({
  donor,
  fit,
  amount,
  donorConcertPledges,
  pledgedByConcert,
}: {
  donor: Donor
  fit: DonorConcertFundingFit
  amount: number
  donorConcertPledges: DonorConcertPledge[]
  pledgedByConcert: Map<string, DonorConcertPledge[]>
}): void {
  const existing = donorConcertPledges.find(pledge => pledge.concertId === fit.concertId)
  if (existing) {
    Object.assign(existing, makePledge(donor, fit, existing.pledgedAmount + amount))
    return
  }

  const pledge = makePledge(donor, fit, amount)
  donorConcertPledges.push(pledge)
  pledgedByConcert.set(fit.concertId, [...(pledgedByConcert.get(fit.concertId) ?? []), pledge])
}

function makePledge(donor: Donor, fit: DonorConcertFundingFit, amount: number): DonorConcertPledge {
  const range = pledgeRange(amount, donor.volatility)
  const swing = deterministicSwing(`${donor.id}:${fit.concertId}`)
  const reliabilityBias = (donor.relationship + donor.loyalty + donor.commitment) / 300 - 0.5
  const realizedFactor = 1 + swing * ((range.high - range.low) / 2 / Math.max(amount, 1)) + reliabilityBias * 0.08
  const realizedAmount = Math.round(clamp(amount * realizedFactor, range.low, range.high))

  return {
    donorId: donor.id,
    donorName: donor.name,
    concertId: fit.concertId,
    concertIndex: fit.concertIndex,
    pledgedAmount: amount,
    expectedLow: range.low,
    expectedHigh: range.high,
    realizedAmount,
    appetiteScore: fit.appetiteScore,
  }
}

function coverageFor(
  concertId: string,
  concerts: readonly NormalizedConcert[],
  remainingGap: ReadonlyMap<string, number>,
): number {
  const concert = concerts.find(item => item.id === concertId)
  if (!concert || concert.cost <= 0) return 1
  return 1 - (remainingGap.get(concertId) ?? 0) / concert.cost
}

function deterministicSwing(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) / 0xffffffff) * 2 - 1
}

function strongestAxis(
  taste: DonorMusicTaste,
  profile: DonorMusicTaste,
  mode: 'attraction' | 'aversion',
): string | null {
  const axes = Object.keys(taste) as Array<keyof DonorMusicTaste>
  let best: keyof DonorMusicTaste | null = null
  let bestScore = 0
  for (const axis of axes) {
    const score = mode === 'attraction'
      ? Math.min(taste[axis], profile[axis]) * (taste[axis] / 100)
      : profile[axis] * Math.pow((100 - taste[axis]) / 100, 1.35)
    if (score > bestScore) {
      bestScore = score
      best = axis
    }
  }
  if (!best || bestScore < 35) return null
  return labelAxis(best)
}

function labelAxis(axis: keyof DonorMusicTaste): string {
  switch (axis) {
    case 'classicalCanon':
      return 'classical canon'
    case 'romantic':
      return 'Romantic repertoire'
    case 'modernist':
      return 'modernist language'
    case 'contemporary':
      return 'contemporary music'
    case 'experimental':
      return 'experimental risk'
    case 'accessible':
      return 'accessibility'
    default:
      return axis
  }
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
