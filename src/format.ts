// Shared currency formatter for the Home Console vitals and pressure panels.
// Returns a compact "$…M" / "$…K" / "$…" string. Callers handle sign
// separately (e.g. fmtDelta, last-net) by passing Math.abs(n) when needed.
export function fmtCash(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1000).toFixed(1)}K`
  return `$${n}`
}
