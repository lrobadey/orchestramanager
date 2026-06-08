import type { ConcertProgram, Donor, InstitutionState, Work } from '../types/core'
import {
  scoreDonorConcertFundingFit,
  type ConcertFundingResult,
  type DonorConcertPledge,
  type DonorFundingResult,
  type SeasonFundingResult,
} from './seasonFunding'
import { clamp } from './scoring'

// Breach tuning. alignmentDrop is measured in appetite-score points; the
// protection band forgives minor edits, and the pull grows with the square of
// the breach beyond it. Restricted ("named") gifts react twice as steeply.
const BREACH_SCALE = 40
const RESTRICTED_MULTIPLIER = 2
const DOOR_CLOSE_FRACTION = 0.6
const RELATIONSHIP_COOL_MAX = 8
const LOYALTY_COOL_MAX = 4

// A loyal, committed donor tolerates more change before pulling back.
function protectionBand(donor: Donor): number {
  return 2 + donor.commitment / 20 + donor.loyalty / 40
}

export interface DonorWithdrawal {
  donorId: string
  donorName: string
  before: number
  withdrawn: number
  after: number
  fraction: number
  restricted: boolean
  relationshipDelta: number
  loyaltyDelta: number
  doorClosed: boolean
}

export interface ConcertBreachResult {
  concertIndex: number
  withdrawals: DonorWithdrawal[]
  totalWithdrawn: number
}

// Compare how each committed donor reads the concert under its *committed*
// program vs a proposed new one. A drop in program alignment past the donor's
// protection band withdraws part of their pledge — quadratically, steeper for a
// restricted gift. Sway boosts (dedication/restriction) are intentionally not
// in this comparison: breach is about the program changing, not the courting.
export function computeConcertBreach({
  donors,
  committedProgram,
  newProgram,
  committedPledges,
  works,
  institution,
  concertIndex,
  concertName,
}: {
  donors: readonly Donor[]
  committedProgram: ConcertProgram
  newProgram: ConcertProgram
  committedPledges: readonly DonorConcertPledge[]
  works: readonly Work[]
  institution: InstitutionState
  concertIndex: number
  concertName: string
}): ConcertBreachResult {
  const donorById = new Map(donors.map(donor => [donor.id, donor]))
  const withdrawals: DonorWithdrawal[] = []

  for (const pledge of committedPledges) {
    if (pledge.pledgedAmount <= 0) continue
    const donor = donorById.get(pledge.donorId)
    if (!donor) continue

    const oldFit = scoreDonorConcertFundingFit({
      donor,
      concert: { index: concertIndex, name: concertName, program: committedProgram },
      works,
      institution,
    })
    const newFit = scoreDonorConcertFundingFit({
      donor,
      concert: { index: concertIndex, name: concertName, program: newProgram },
      works,
      institution,
    })

    const alignmentDrop = Math.max(0, oldFit.appetiteScore - newFit.appetiteScore)
    const breach = Math.max(0, alignmentDrop - protectionBand(donor))
    if (breach <= 0) continue

    const restrictedMult = pledge.restricted ? RESTRICTED_MULTIPLIER : 1
    const fraction = clamp((breach / BREACH_SCALE) ** 2 * restrictedMult, 0, 1)
    const withdrawn = Math.round(pledge.pledgedAmount * fraction)
    if (withdrawn <= 0) continue

    withdrawals.push({
      donorId: donor.id,
      donorName: pledge.donorName,
      before: pledge.pledgedAmount,
      withdrawn,
      after: pledge.pledgedAmount - withdrawn,
      fraction,
      restricted: Boolean(pledge.restricted),
      relationshipDelta: -Math.round(fraction * RELATIONSHIP_COOL_MAX),
      loyaltyDelta: -Math.round(fraction * LOYALTY_COOL_MAX),
      doorClosed: fraction >= DOOR_CLOSE_FRACTION,
    })
  }

  return {
    concertIndex,
    withdrawals,
    totalWithdrawn: withdrawals.reduce((sum, w) => sum + w.withdrawn, 0),
  }
}

// Fold a confirmed breach into committed funding: shrink the edited concert's
// surviving pledges (and their realized/band figures pro-rata), drop any that
// fully withdrew, refresh the concert's display fits to the new program, and
// recompute the affected donor + season aggregates.
export function applyBreachToFunding({
  funding,
  concertIndex,
  breach,
  newFits,
}: {
  funding: SeasonFundingResult
  concertIndex: number
  breach: ConcertBreachResult
  newFits: ConcertFundingResult['fits']
}): SeasonFundingResult {
  const wdByDonor = new Map(breach.withdrawals.map(w => [w.donorId, w]))

  const concerts = funding.concerts.map(concert => {
    if (concert.concertIndex !== concertIndex) return concert
    const pledges = concert.pledges
      .map(pledge => {
        const w = wdByDonor.get(pledge.donorId)
        if (!w) return pledge
        const ratio = pledge.pledgedAmount > 0 ? w.after / pledge.pledgedAmount : 0
        return {
          ...pledge,
          pledgedAmount: w.after,
          realizedAmount: Math.round(pledge.realizedAmount * ratio),
          expectedLow: Math.round(pledge.expectedLow * ratio),
          expectedHigh: Math.round(pledge.expectedHigh * ratio),
        }
      })
      .filter(pledge => pledge.pledgedAmount > 0)
    const pledged = pledges.reduce((sum, p) => sum + p.pledgedAmount, 0)
    const realized = pledges.reduce((sum, p) => sum + p.realizedAmount, 0)
    return {
      ...concert,
      pledges,
      pledged,
      realized,
      coveragePercent: concert.cost > 0 ? pledged / concert.cost : 0,
      realizedCoveragePercent: concert.cost > 0 ? realized / concert.cost : 0,
      gap: Math.max(0, concert.cost - pledged),
      fits: newFits,
    }
  })

  const donors: DonorFundingResult[] = funding.donors.map(donor => {
    const pledges = concerts.flatMap(concert =>
      concert.pledges.filter(pledge => pledge.donorId === donor.donorId),
    )
    const pledged = pledges.reduce((sum, p) => sum + p.pledgedAmount, 0)
    const realized = pledges.reduce((sum, p) => sum + p.realizedAmount, 0)
    const w = wdByDonor.get(donor.donorId)
    return {
      ...donor,
      pledged,
      realized,
      unusedCapacity: Math.max(0, donor.concertCapacity - pledged),
      pledges,
      relationshipDelta: donor.relationshipDelta + (w?.relationshipDelta ?? 0),
      doorClosed: donor.doorClosed || Boolean(w?.doorClosed),
    }
  })

  const seasonCost = concerts.reduce((sum, c) => sum + c.cost, 0)
  const pledged = concerts.reduce((sum, c) => sum + c.pledged, 0)
  const realized = concerts.reduce((sum, c) => sum + c.realized, 0)

  return {
    ...funding,
    concerts,
    donors,
    seasonCost,
    pledged,
    realized,
    coveragePercent: seasonCost > 0 ? pledged / seasonCost : 0,
    realizedCoveragePercent: seasonCost > 0 ? realized / seasonCost : 0,
  }
}
