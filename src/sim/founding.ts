import type { ConcertProgram } from '../types/core'

export const ORCHESTRA_NAME_MIN_LENGTH = 2
export const ORCHESTRA_NAME_MAX_LENGTH = 60

export function sanitizeOrchestraName(input: string): string {
  return input.trim().slice(0, ORCHESTRA_NAME_MAX_LENGTH)
}

export function isValidOrchestraName(input: string): boolean {
  return sanitizeOrchestraName(input).length >= ORCHESTRA_NAME_MIN_LENGTH
}

// A concert program is "complete" once every active work position (the first
// `workCount` slots) holds a piece. This is the same gate forecastProgram uses
// before it produces a real forecast, lifted out so the founding flow can decide
// whether the whole season is ready to begin without running four forecasts.
export function isProgramComplete(program: ConcertProgram): boolean {
  const filled = program.workIds
    .slice(0, program.workCount)
    .filter((id): id is string => id !== null).length
  return filled === program.workCount
}

// The season-as-a-unit gate: the founding plan can only be committed once all
// four concerts are fully programmed.
export function isSeasonPlanComplete(programs: ConcertProgram[]): boolean {
  return programs.length === 4 && programs.every(isProgramComplete)
}
