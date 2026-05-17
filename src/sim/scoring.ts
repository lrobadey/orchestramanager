import { Work, Principal } from '../types/core'

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

// Rehearsal cost: $120/hour (hall + staff overhead)
export const REHEARSAL_COST_PER_HOUR = 120

// Base concert costs: hall rental, staff, programs, production
export const BASE_CONCERT_COST = 45_000

// Returns the effective rehearsal divisor for a piece, weighted by section
// demands and driven by each section's average principal leadership.
// Formula: sectionDivisor = 3.5 + (avgLeadership / 100) * 3.5 → range 3.5–7.
// Sections with no principals fall back to leadership 50 (divisor 5.25).
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
    const divisor = 3.5 + (avgLeadership / 100) * 3.5
    weightedSum += weight * divisor
    totalWeight += weight
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 5.25
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
