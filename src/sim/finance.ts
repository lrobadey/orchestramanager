import type { ConcertReport, FinanceTransaction } from '../types/core'
import type { ISODateString } from '../types/calendar'
import { dayIndexToDate } from './calendar'

interface FinanceTimingContext {
  concertDay: number
  concertDate: ISODateString
  nextConcertDay?: number
  nextConcertDate?: ISODateString
}

export function buildConcertFinanceTransactions(
  concertName: string,
  concertIndex: number,
  report: ConcertReport,
  timing: FinanceTimingContext = fallbackTiming(concertIndex),
): FinanceTransaction[] {
  const nextSlotIndex = concertIndex + 1
  const nextDueDay = timing.nextConcertDay ?? timing.concertDay + 30
  const nextDueDate = timing.nextConcertDate ?? dayIndexToDate(nextDueDay)

  const posted = (kind: FinanceTransaction['kind'], label: string, amount: number): FinanceTransaction => ({
    id: `${concertIndex}-${kind}`,
    concertIndex,
    concertName,
    label,
    kind,
    amount,
    status: 'posted',
    dueSlotIndex: concertIndex,
    createdDay: timing.concertDay,
    createdDate: timing.concertDate,
    dueDay: timing.concertDay,
    dueDate: timing.concertDate,
    postedDay: timing.concertDay,
    postedDate: timing.concertDate,
  })

  const scheduled = (kind: FinanceTransaction['kind'], label: string, amount: number): FinanceTransaction => ({
    id: `${concertIndex}-${kind}`,
    concertIndex,
    concertName,
    label,
    kind,
    amount,
    status: 'scheduled',
    dueSlotIndex: nextSlotIndex,
    createdDay: timing.concertDay,
    createdDate: timing.concertDate,
    dueDay: nextDueDay,
    dueDate: nextDueDate,
    postedDay: null,
    postedDate: null,
  })

  return [
    posted('ticket-revenue', 'Ticket revenue', report.revenue),
    scheduled('donor-support', 'Donor support', report.donorUplift),
    ...(report.operatingSupport && report.operatingSupport > 0
      ? [scheduled('operating-support', 'Operating support', report.operatingSupport)]
      : []),
    scheduled('base-cost', 'Hall and fixed concert costs', -report.expenseBreakdown.baseConcert),
    posted('payroll-cost', 'Musician payroll', -report.expenseBreakdown.payroll),
    posted('rehearsal-cost', 'Rehearsal facility costs', -report.expenseBreakdown.rehearsal),
    posted('marketing-cost', 'Marketing spend', -report.expenseBreakdown.marketing),
    scheduled('production-cost', 'Production costs', -report.expenseBreakdown.production),
  ]
}

function fallbackTiming(concertIndex: number): FinanceTimingContext {
  const concertDay = concertIndex
  const concertDate = dayIndexToDate(concertDay)
  const nextConcertDay = concertDay + 30
  return {
    concertDay,
    concertDate,
    nextConcertDay,
    nextConcertDate: dayIndexToDate(nextConcertDay),
  }
}
