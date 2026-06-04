import { describe, expect, it } from 'vitest'
import {
  ORCHESTRA_NAME_MAX_LENGTH,
  isValidOrchestraName,
  sanitizeOrchestraName,
} from '../src/sim/founding'

describe('founding orchestra name rules', () => {
  it('trims accidental leading and trailing spaces', () => {
    expect(sanitizeOrchestraName('  New Albion Symphony  ')).toBe('New Albion Symphony')
  })

  it('requires at least two non-space characters', () => {
    expect(isValidOrchestraName('')).toBe(false)
    expect(isValidOrchestraName('   ')).toBe(false)
    expect(isValidOrchestraName(' A ')).toBe(false)
    expect(isValidOrchestraName(' AO ')).toBe(true)
  })

  it('caps the saved name at sixty characters', () => {
    const longName = 'A'.repeat(ORCHESTRA_NAME_MAX_LENGTH + 10)
    expect(sanitizeOrchestraName(longName)).toHaveLength(ORCHESTRA_NAME_MAX_LENGTH)
  })
})
