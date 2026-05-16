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
