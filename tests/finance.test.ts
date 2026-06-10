import { describe, expect, it } from 'vitest'
import { buildConcertFinanceTransactions } from '../src/sim/finance'
import { resolveConcert } from '../src/sim/resolveConcert'
import { works } from '../src/data/works'
import { principals } from '../src/data/principals'
import { audienceSegments } from '../src/data/audienceSegments'
import { startingInstitution } from '../src/data/institution'
import type { ConcertProgram } from '../src/types/core'

const safeProgram: ConcertProgram = {
  workCount: 3,
  workIds: ['beethoven-5', 'beethoven-7', 'tchaikovsky-6'],
  intermissionAfter: 1,
  rehearsalAllocation: [7, 7, 6],
  marketingSpend: 15_000,
  ticketPrice: 65,
  studentTicketsEnabled: false,
  studentTicketPrice: 25,
}

describe('finance transactions', () => {
  it('builds concert transactions that sum to report net', () => {
    const report = resolveConcert({
      works,
      institution: startingInstitution,
      principals,
      audienceSegments,
      program: safeProgram,
      roll: 50,
    })

    const transactions = buildConcertFinanceTransactions('Opening Night', 0, report)
    const total = transactions.reduce((sum, tx) => sum + tx.amount, 0)

    expect(transactions).toHaveLength(7)
    expect(total).toBe(report.net)
    expect(transactions.find(tx => tx.kind === 'ticket-revenue')!.status).toBe('posted')
    const payroll = transactions.find(tx => tx.kind === 'payroll-cost')!
    expect(payroll.status).toBe('posted')
    expect(payroll.amount).toBe(-report.expenseBreakdown.payroll)
    expect(transactions.find(tx => tx.kind === 'marketing-cost')!.status).toBe('posted')
    expect(transactions.find(tx => tx.kind === 'donor-support')!.status).toBe('scheduled')
    const baseCost = transactions.find(tx => tx.kind === 'base-cost')!
    expect(baseCost.dueSlotIndex).toBe(1)
    expect(baseCost.createdDate).toBe('2026-05-01')
    expect(baseCost.dueDate).toBe('2026-05-31')
    expect(baseCost.postedDate).toBeNull()
  })

  it('keeps operating support as a distinct scheduled income transaction', () => {
    const report = resolveConcert({
      works,
      institution: startingInstitution,
      principals,
      audienceSegments,
      program: safeProgram,
      donorIncome: 20_000,
      operatingSupport: 12_000,
      roll: 50,
    })

    const transactions = buildConcertFinanceTransactions('Opening Night', 0, report)
    const total = transactions.reduce((sum, tx) => sum + tx.amount, 0)
    const operating = transactions.find(tx => tx.kind === 'operating-support')!

    expect(transactions).toHaveLength(8)
    expect(total).toBe(report.net)
    expect(operating.label).toBe('Operating support')
    expect(operating.amount).toBe(12_000)
    expect(operating.status).toBe('scheduled')
  })
})
