import { describe, expect, it } from 'vitest'
import {
  ORCHESTRA_NAME_MAX_LENGTH,
  isProgramComplete,
  isSeasonPlanComplete,
  isValidOrchestraName,
  sanitizeOrchestraName,
} from '../src/sim/founding'
import type { ConcertProgram } from '../src/types/core'

function makeProgram(overrides: Partial<ConcertProgram> = {}): ConcertProgram {
  return {
    workCount: 3,
    workIds: ['a', 'b', 'c'],
    intermissionAfter: 1,
    rehearsalAllocation: [7, 7, 6],
    marketingSpend: 15_000,
    marketingStyle: 'digital',
    ticketPrice: 70,
    studentTicketsEnabled: false,
    studentTicketPrice: 25,
    ...overrides,
  }
}

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

describe('season plan completeness', () => {
  it('treats a program as complete only when every active work slot is filled', () => {
    expect(isProgramComplete(makeProgram())).toBe(true)
    expect(isProgramComplete(makeProgram({ workIds: ['a', 'b', null] }))).toBe(false)
    expect(isProgramComplete(makeProgram({ workIds: [null, null, null] }))).toBe(false)
  })

  it('ignores the unused third slot for a two-work program', () => {
    expect(isProgramComplete(makeProgram({ workCount: 2, workIds: ['a', 'b', null] }))).toBe(true)
    expect(isProgramComplete(makeProgram({ workCount: 2, workIds: ['a', null, null] }))).toBe(false)
  })

  it('requires all four concerts programmed before the season can begin', () => {
    const ready = makeProgram()
    expect(isSeasonPlanComplete([ready, ready, ready, ready])).toBe(true)
    expect(isSeasonPlanComplete([ready, ready, ready, makeProgram({ workIds: ['a', null, null] })])).toBe(false)
    expect(isSeasonPlanComplete([ready, ready, ready])).toBe(false)
  })
})
