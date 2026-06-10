import { Work, Principal, ExpenseBreakdown, AudienceBreakdown } from '../types/core'
import { computePayroll } from './labor'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0)
}

// Logarithmic marketing boost: $5k → ~4pts, $15k → ~10pts, $30k → ~15pts, caps at ~20
export function marketingEffect(spend: number): number {
  if (spend <= 0) return 0
  return clamp(Math.log(spend / 1000 + 1) * 7, 0, 20)
}

// Linear price penalty above $60 threshold; $120 → ~15pts off
export function pricePenalty(ticketPrice: number): number {
  const threshold = 60
  if (ticketPrice <= threshold) return 0
  return clamp((ticketPrice - threshold) / 4, 0, 30)
}

// Rehearsal facility overhead: $120/hour (space, stage crew). Musician time
// during rehearsal is paid through the payroll model, not this line.
export const REHEARSAL_COST_PER_HOUR = 120

// Base concert overhead: hall rental, front-of-house staff, programs.
// Musicians are paid per service through the labor model (src/sim/labor.ts),
// which is the dominant cost line — so concert costs are grounded in forces ×
// services × rates rather than tuned to donor capacities. No single donor is
// expected to cover a concert; coverage is collective.
export const BASE_CONCERT_COST = 12_000

// Hall capacity — the physical seat count. Used both for attendance-rate
// calculations and as a hard ceiling on how many tickets can actually be sold.
export const HALL_CAPACITY = 1_200

// Donor confidence threshold below which uplift is $0
export const DONOR_UPLIFT_THRESHOLD = 30

// Returns the effective rehearsal divisor for a piece, weighted by section
// demands and driven by each section's average principal leadership, then
// boosted by how familiar the piece is to the orchestra.
// Formula: sectionDivisor = 3.5 + (avgLeadership / 100) * 3.5 → range 3.5–7.
// Sections with no principals fall back to leadership 50 (divisor 5.25).
// Familiarity adds up to +2 (familiarity 100), so the final range is 3.5–9.
export function computeRehearsalDivisor(work: Work, principals: Principal[]): number {
  const sections = ['strings', 'winds', 'brass', 'percussion'] as const
  let weightedSum = 0
  let totalWeight = 0
  for (const section of sections) {
    const weight = work.demands[section]
    const sectionPrincipals = principals.filter(p => p.section === section)
    const avgLeadership =
      sectionPrincipals.length > 0
        ? sectionPrincipals.reduce((s, p) => s + p.leadership, 0) / sectionPrincipals.length
        : 50
    const divisor = 3.5 + (clamp(avgLeadership, 0, 100) / 100) * 3.5
    weightedSum += weight * divisor
    totalWeight += weight
  }
  const baseDivisor = totalWeight > 0 ? weightedSum / totalWeight : 5.25
  const familiarityBonus = (clamp(work.familiarity, 0, 100) / 100) * 2
  return baseDivisor + familiarityBonus
}

// Translates a work's abstract rehearsalLoad (0-100 units) into hours of
// rehearsal it ideally wants to feel well-prepared.
export function rehearsalHoursNeeded(rehearsalLoad: number, divisor: number): number {
  return rehearsalLoad / divisor
}

// Convert an hours-based gap back into the existing pressure scale (-40..100)
// so downstream scoring keeps working at the same magnitudes as before.
export function pressureFromHoursGap(hoursNeeded: number, hoursAllocated: number): number {
  return clamp((hoursNeeded - hoursAllocated) * 5, -40, 100)
}

// Structured breakdown of all concert expenses. `rehearsalHoursPerWork` is
// aligned with `works` (the hours the player allocated to each piece), so
// payroll can price each work's rehearsal at that work's headcount.
// Production cost is 0 for standard canon; scales with contemporary and high-load works.
export function computeExpenseBreakdown(
  works: Work[],
  rehearsalHoursPerWork: number[],
  marketingSpend: number,
): ExpenseBreakdown {
  const totalRehearsalHours = sum(rehearsalHoursPerWork)
  const rehearsal = totalRehearsalHours * REHEARSAL_COST_PER_HOUR
  const payrollResult = computePayroll(works, rehearsalHoursPerWork)
  const payroll = Math.round(payrollResult.total)
  const contemporaryCount = works.filter(w => w.isContemporary).length
  const highLoadCount = works.filter(w => w.rehearsalLoad >= 60).length
  const production = contemporaryCount * 3_000 + Math.min(highLoadCount * 2_500, 8_000)
  const total = BASE_CONCERT_COST + payroll + rehearsal + marketingSpend + production
  return {
    baseConcert: BASE_CONCERT_COST,
    payroll,
    rehearsal,
    marketing: marketingSpend,
    production,
    total,
    musicians: payrollResult.musicians,
    extraPlayers: payrollResult.extraPlayers,
  }
}

// Enforce the physical hall: no more seats can be sold than the house holds.
// When projected demand across segments exceeds HALL_CAPACITY, every segment is
// scaled down by the same factor — a sold-out house, not a reshuffled one — so
// the audience mix is preserved. Ticket revenue is recomputed from the capped
// attendance, and share-of-house is (re)assigned from the final numbers.
export function capAudienceToHall(breakdown: AudienceBreakdown[]): AudienceBreakdown[] {
  const demand = breakdown.reduce((sum, row) => sum + row.attendance, 0)
  let capped = breakdown.map(row => ({ ...row }))

  if (demand > HALL_CAPACITY) {
    const scale = HALL_CAPACITY / demand
    capped = capped.map(row => ({ ...row, attendance: Math.round(row.attendance * scale) }))
    // Per-segment rounding can leave the house a few seats over or under the
    // ceiling; adjust the largest segments so a sold-out house lands exactly.
    let total = capped.reduce((sum, row) => sum + row.attendance, 0)
    while (total !== HALL_CAPACITY) {
      const largest = capped.reduce((max, row) => (row.attendance > max.attendance ? row : max), capped[0])
      if (total > HALL_CAPACITY) {
        largest.attendance -= 1
        total -= 1
      } else {
        largest.attendance += 1
        total += 1
      }
    }
  }

  const withRevenue = capped.map(row => ({
    ...row,
    ticketRevenue: row.attendance * row.effectiveTicketPrice,
  }))
  const total = withRevenue.reduce((sum, row) => sum + row.attendance, 0)
  return withRevenue.map(row => ({
    ...row,
    shareOfHouse: total > 0 ? row.attendance / total : 0,
  }))
}

// Cash contribution from donors per concert, based on pre-concert donorConfidence.
export function computeDonorUplift(donorConfidence: number): number {
  return Math.max(0, (donorConfidence - DONOR_UPLIFT_THRESHOLD) * 200)
}
