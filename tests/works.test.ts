import { describe, expect, it } from 'vitest'
import { works } from '../src/data/works'
import { principals } from '../src/data/principals'
import { audienceSegments } from '../src/data/audienceSegments'
import { startingInstitution } from '../src/data/institution'
import { forecastProgram } from '../src/sim/forecastProgram'
import { ConcertProgram, Work } from '../src/types/core'

const requestedIssue13Ids = [
  'beethoven-1',
  'beethoven-2',
  'beethoven-3',
  'beethoven-4',
  'beethoven-5',
  'beethoven-6',
  'beethoven-7',
  'beethoven-8',
  'beethoven-9',
  'mozart-39',
  'mozart-40',
  'mozart-41',
  'brahms-1',
  'brahms-2',
  'brahms-3',
  'brahms-4',
  'tchaikovsky-1',
  'tchaikovsky-2',
  'tchaikovsky-3',
  'tchaikovsky-4',
  'tchaikovsky-5',
  'tchaikovsky-6',
  'tchaikovsky-manfred',
  'sibelius-1',
  'sibelius-2',
  'sibelius-3',
  'sibelius-4',
  'sibelius-5',
  'sibelius-6',
  'sibelius-7',
]

const normalizedExistingIds = [
  'beethoven-5',
  'beethoven-7',
  'brahms-1',
  'tchaikovsky-6',
  'sibelius-7',
]

const rangedFields: (keyof Pick<
  Work,
  | 'audienceDraw'
  | 'artisticPrestige'
  | 'donorComfort'
  | 'novelty'
  | 'identityValue'
  | 'rehearsalLoad'
  | 'familiarity'
>)[] = [
  'audienceDraw',
  'artisticPrestige',
  'donorComfort',
  'novelty',
  'identityValue',
  'rehearsalLoad',
  'familiarity',
]

function expectInRange(value: number) {
  expect(value).toBeGreaterThanOrEqual(0)
  expect(value).toBeLessThanOrEqual(100)
}

function makeProgram(ids: [string, string]): ConcertProgram {
  return {
    workCount: 2,
    workIds: [ids[0], ids[1], null],
    intermissionAfter: 0,
    rehearsalAllocation: [10, 10, 0],
    marketingSpend: 15_000,
    ticketPrice: 70,
  }
}

describe('works data', () => {
  it('has unique work IDs', () => {
    const ids = works.map(w => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes every requested issue #13 symphonic work', () => {
    const ids = new Set(works.map(w => w.id))
    for (const id of requestedIssue13Ids) {
      expect(ids.has(id), id).toBe(true)
    }
  })

  it('normalizes existing issue #13 IDs instead of duplicating them', () => {
    for (const id of normalizedExistingIds) {
      expect(works.filter(w => w.id === id)).toHaveLength(1)
    }
  })

  it('keeps every 0-100 work field and demand value in range', () => {
    for (const work of works) {
      for (const field of rangedFields) {
        expectInRange(work[field])
      }
      for (const value of Object.values(work.demands)) {
        expectInRange(value)
      }
    }
  })

  it('can forecast every requested work without throwing', () => {
    for (let i = 0; i < requestedIssue13Ids.length; i++) {
      const current = requestedIssue13Ids[i]
      const partner = requestedIssue13Ids[(i + 1) % requestedIssue13Ids.length]
      expect(() =>
        forecastProgram({
          works,
          institution: startingInstitution,
          principals,
          audienceSegments,
          program: makeProgram([current, partner]),
        }),
      ).not.toThrow()
    }
  })
})
