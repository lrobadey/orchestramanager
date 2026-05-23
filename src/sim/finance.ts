import type { ConcertReport, FinanceTransaction } from '../types/core'

export function buildConcertFinanceTransactions(
  concertName: string,
  concertIndex: number,
  report: ConcertReport,
): FinanceTransaction[] {
  const nextSlotIndex = concertIndex + 1

  return [
    {
      id: `${concertIndex}-ticket-revenue`,
      concertIndex,
      concertName,
      label: 'Ticket revenue',
      kind: 'ticket-revenue',
      amount: report.revenue,
      status: 'posted',
      dueSlotIndex: concertIndex,
    },
    {
      id: `${concertIndex}-donor-support`,
      concertIndex,
      concertName,
      label: 'Donor support',
      kind: 'donor-support',
      amount: report.donorUplift,
      status: 'scheduled',
      dueSlotIndex: nextSlotIndex,
    },
    {
      id: `${concertIndex}-base-cost`,
      concertIndex,
      concertName,
      label: 'Hall and fixed concert costs',
      kind: 'base-cost',
      amount: -report.expenseBreakdown.baseConcert,
      status: 'scheduled',
      dueSlotIndex: nextSlotIndex,
    },
    {
      id: `${concertIndex}-rehearsal-cost`,
      concertIndex,
      concertName,
      label: 'Rehearsal costs',
      kind: 'rehearsal-cost',
      amount: -report.expenseBreakdown.rehearsal,
      status: 'posted',
      dueSlotIndex: concertIndex,
    },
    {
      id: `${concertIndex}-marketing-cost`,
      concertIndex,
      concertName,
      label: 'Marketing spend',
      kind: 'marketing-cost',
      amount: -report.expenseBreakdown.marketing,
      status: 'posted',
      dueSlotIndex: concertIndex,
    },
    {
      id: `${concertIndex}-production-cost`,
      concertIndex,
      concertName,
      label: 'Production costs',
      kind: 'production-cost',
      amount: -report.expenseBreakdown.production,
      status: 'scheduled',
      dueSlotIndex: nextSlotIndex,
    }
  ]
}
