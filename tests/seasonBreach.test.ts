import { describe, it, expect } from 'vitest'
import { computeSeasonFunding } from '../src/sim/seasonFunding'
import { computeConcertBreach, applyBreachToFunding } from '../src/sim/seasonBreach'
import { createInitialDonors } from '../src/data/donors'
import { startingInstitution } from '../src/data/institution'
import { works } from '../src/data/works'
import type { ConcertProgram } from '../src/types/core'

const donors = createInitialDonors().donors
const institution = startingInstitution

function program(ids: string[]): ConcertProgram {
  return {
    workCount: ids.length as 2 | 3,
    workIds: [ids[0] ?? null, ids[1] ?? null, ids[2] ?? null],
    intermissionAfter: ids.length > 1 ? 1 : null,
    rehearsalAllocation: [7, 7, 6],
    marketingSpend: 15_000,
    marketingStyle: 'prestige',
    ticketPrice: 70,
    studentTicketsEnabled: false,
    studentTicketPrice: 25,
  }
}

// A canon program donors with traditional taste back, and an experimental swap
// that should drop their alignment hard.
const canon = program(['beethoven-5', 'beethoven-7', 'tchaikovsky-6'])
const wrecked = program(['harbor-grid', 'glacier-index', 'night-ferry'])

const committedConcert = (prog: ConcertProgram) =>
  computeSeasonFunding({
    donors,
    concerts: [{ index: 0, name: 'Opening Night', program: prog }],
    works,
    institution,
  }).concerts[0]

describe('computeConcertBreach', () => {
  it('no change means no withdrawal', () => {
    const concert = committedConcert(canon)
    const breach = computeConcertBreach({
      donors,
      committedProgram: canon,
      newProgram: canon,
      committedPledges: concert.pledges,
      works,
      institution,
      concertIndex: 0,
      concertName: 'Opening Night',
    })
    expect(breach.totalWithdrawn).toBe(0)
    expect(breach.withdrawals).toHaveLength(0)
  })

  it('swapping a canon night for experimental work withdraws pledges', () => {
    const concert = committedConcert(canon)
    expect(concert.pledges.length).toBeGreaterThan(0)
    const breach = computeConcertBreach({
      donors,
      committedProgram: canon,
      newProgram: wrecked,
      committedPledges: concert.pledges,
      works,
      institution,
      concertIndex: 0,
      concertName: 'Opening Night',
    })
    expect(breach.totalWithdrawn).toBeGreaterThan(0)
    expect(breach.withdrawals.length).toBeGreaterThan(0)
    for (const w of breach.withdrawals) {
      expect(w.after).toBe(w.before - w.withdrawn)
      expect(w.relationshipDelta).toBeLessThanOrEqual(0)
      expect(w.fraction).toBeGreaterThan(0)
    }
  })

  it('a restricted gift withdraws more steeply than an unrestricted one', () => {
    const concert = committedConcert(canon)
    const target = concert.pledges[0]
    const plain = computeConcertBreach({
      donors,
      committedProgram: canon,
      newProgram: wrecked,
      committedPledges: [{ ...target, restricted: false }],
      works,
      institution,
      concertIndex: 0,
      concertName: 'Opening Night',
    })
    const restricted = computeConcertBreach({
      donors,
      committedProgram: canon,
      newProgram: wrecked,
      committedPledges: [{ ...target, restricted: true }],
      works,
      institution,
      concertIndex: 0,
      concertName: 'Opening Night',
    })
    expect(restricted.withdrawals[0].fraction).toBeGreaterThanOrEqual(plain.withdrawals[0].fraction)
  })
})

describe('applyBreachToFunding', () => {
  it('shrinks the edited concert coverage and the donor totals', () => {
    const funding = computeSeasonFunding({
      donors,
      concerts: [{ index: 0, name: 'Opening Night', program: canon }],
      works,
      institution,
    })
    const before = funding.concerts[0]
    const breach = computeConcertBreach({
      donors,
      committedProgram: canon,
      newProgram: wrecked,
      committedPledges: before.pledges,
      works,
      institution,
      concertIndex: 0,
      concertName: 'Opening Night',
    })
    const next = applyBreachToFunding({ funding, concertIndex: 0, breach, newFits: [] })

    expect(next.concerts[0].pledged).toBeLessThan(before.pledged)
    expect(next.pledged).toBeLessThan(funding.pledged)
    for (const donor of next.donors) {
      expect(donor.unusedCapacity).toBe(Math.max(0, donor.concertCapacity - donor.pledged))
    }
    // A donor who fully withdrew should leave no surviving pledge on the night.
    const survivingDonorIds = new Set(next.concerts[0].pledges.map(p => p.donorId))
    for (const w of breach.withdrawals) {
      if (w.after === 0) expect(survivingDonorIds.has(w.donorId)).toBe(false)
    }
  })
})
