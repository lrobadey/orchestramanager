import type { Donor } from '../types/core'
import type { DonorConcertFundingFit } from './seasonFunding'
import { clamp } from './scoring'

// The player's scarce levers for moving a donor beyond their comfortable pledge.
export const MAX_DEDICATIONS = 3
export const START_GOODWILL = 100

// One entry per concert slot: the donor (id) this night is dedicated to, or null.
export type DedicationSlots = (string | null)[]

export interface SwayState {
  // index = concert slot, value = dedicated donor id (a donor's "home night").
  dedications: DedicationSlots
  // Requested pledge above comfortable, keyed `${donorId}:${concertIndex}`.
  asks: Record<string, number>
  // Restricted ("named") asks, keyed `${donorId}:${concertIndex}`. Binds the
  // gift to the donor's top priority — a higher pledge now, a breach risk later.
  restricted: Record<string, boolean>
}

export const swayKey = (donorId: string, concertIndex: number) => `${donorId}:${concertIndex}`

export function createSwayState(): SwayState {
  return { dedications: [null, null, null, null], asks: {}, restricted: {} }
}

// Dedications in use across the season (a donor latched to a home night).
export function dedicationsUsed(state: SwayState): number {
  return state.dedications.filter(Boolean).length
}

export type AskResponse = 'accepted' | 'countered' | 'offended'

export interface AskOutcome {
  comfortable: number
  ceiling: number
  // 0..1 readout of how much negotiating room remains — the "fuzzy band" that
  // sharpens as relationship deepens (see ceilingClarity).
  tolerance: number
  accepted: number
  response: AskResponse
  goodwillCost: number
  relationshipDelta: number
  doorClosed: boolean
}

// Leverage widens the ceiling: warmth (relationship/loyalty), how well the
// program already fits the donor, and a dedication on the night all let you ask
// for more before they balk. Emergent from stats — no fixed steps. Capped at
// 1.6x comfortable so no single ask can run away.
export function stretchCeiling(donor: Donor, fit: DonorConcertFundingFit, dedicated: boolean): number {
  const warmth = (donor.relationship + donor.loyalty) / 200 // 0..1
  const alignment = clamp(fit.appetiteScore, 0, 100) / 100 // 0..1
  const dedicationBonus = dedicated ? 0.3 : 0
  const factor = Math.min(1.1 + warmth * 0.3 + alignment * 0.2 + dedicationBonus, 1.6)
  return Math.round(fit.maxPledge * factor)
}

// How much overreach the donor tolerates before offense, as a 0..1 share of the
// comfortable→ceiling band. Warm, loyal, aligned, dedicated donors are patient;
// volatile ones bristle.
export function askTolerance(donor: Donor, fit: DonorConcertFundingFit, dedicated: boolean): number {
  const warmth = (donor.relationship + donor.loyalty) / 200
  const steadiness = (100 - donor.volatility) / 100
  const alignment = clamp(fit.appetiteScore, 0, 100) / 100
  const dedicationBonus = dedicated ? 0.2 : 0
  return clamp(warmth * 0.5 + steadiness * 0.25 + alignment * 0.2 + dedicationBonus, 0.05, 1)
}

// How sharply the ceiling is known. The hidden offense threshold reads as a
// fuzzy band that narrows toward a clear line as the relationship deepens.
export function ceilingClarity(donor: Donor): number {
  return clamp((donor.relationship + donor.loyalty) / 200, 0, 1)
}

// Resolve a single ask. The donor accepts modest stretches, counters partway
// when pushed near their limit, and takes offense (recoiling to comfortable,
// closing the door) when pushed past the ceiling. All thresholds emerge from
// the donor's own stats — a warm, steady donor negotiates gracefully where a
// volatile one walks.
export function negotiateConcertAsk({
  donor,
  fit,
  target,
  dedicated,
}: {
  donor: Donor
  fit: DonorConcertFundingFit
  target: number
  dedicated: boolean
}): AskOutcome {
  const comfortable = fit.maxPledge
  const ceiling = stretchCeiling(donor, fit, dedicated)
  const tolerance = askTolerance(donor, fit, dedicated)

  const base: Omit<AskOutcome, 'accepted' | 'response' | 'goodwillCost' | 'relationshipDelta' | 'doorClosed'> = {
    comfortable,
    ceiling,
    tolerance,
  }

  // Asking at or below comfortable is free and always met at comfortable.
  if (target <= comfortable || ceiling <= comfortable) {
    return { ...base, accepted: comfortable, response: 'accepted', goodwillCost: 0, relationshipDelta: 0, doorClosed: false }
  }

  // Pushing past the ceiling is an overreach: they take offense and recoil.
  if (target > ceiling) {
    return {
      ...base,
      accepted: comfortable,
      response: 'offended',
      goodwillCost: 12,
      relationshipDelta: -4,
      doorClosed: true,
    }
  }

  // Within the band: position 0..1 of how far past comfortable we reached.
  const position = (target - comfortable) / (ceiling - comfortable)
  // Yield is full when the ask sits inside their tolerance, and tapers as it
  // exceeds it — a counter-offer that meets the player partway.
  const yieldFactor = clamp(tolerance / position, 0, 1)
  const accepted = Math.round(comfortable + (target - comfortable) * yieldFactor)
  const goodwillCost = Math.round(position * 18 + Math.max(0, -fit.appetiteScore) * 0.08)

  if (yieldFactor < 0.85) {
    return { ...base, accepted, response: 'countered', goodwillCost, relationshipDelta: -1, doorClosed: false }
  }
  return { ...base, accepted, response: 'accepted', goodwillCost, relationshipDelta: 0, doorClosed: false }
}
