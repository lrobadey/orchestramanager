export const ORCHESTRA_NAME_MIN_LENGTH = 2
export const ORCHESTRA_NAME_MAX_LENGTH = 60

export function sanitizeOrchestraName(input: string): string {
  return input.trim().slice(0, ORCHESTRA_NAME_MAX_LENGTH)
}

export function isValidOrchestraName(input: string): boolean {
  return sanitizeOrchestraName(input).length >= ORCHESTRA_NAME_MIN_LENGTH
}
