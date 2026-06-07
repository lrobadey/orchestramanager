import {
  InstitutionState,
  ConcertProgram,
  ConcertReport,
  FinanceTransaction,
  SeasonConcertSlot,
  SeasonState,
  SeasonSummary,
  Principal,
  Work,
} from '../types/core'
import { createInitialDonors } from '../data/donors'
import { cityAudienceSegments, createInitialAudience } from '../data/audienceSegments'
import { applyConcertReport } from './applyConcertReport'
import { updateAudienceAfterConcert, summarizeAudienceTrust } from './audienceReactions'
import { updateDonorsAfterConcert } from './donorReactions'
import { buildConcertFinanceTransactions } from './finance'
import { createInitialRoster, updateRosterAfterConcert } from './roster'
import { average, HALL_CAPACITY } from './scoring'
import { createInitialCalendar, dateToDayIndex, setCalendarDay } from './calendar'
import type { ISODateString } from '../types/calendar'

export const SEASON_CONCERT_DATES: ISODateString[] = [
  '2026-09-14',
  '2026-10-26',
  '2027-01-11',
  '2027-03-22',
]

const SLOT_NAMES = [
  'Opening Night',
  'Winter Program',
  'Spring Identity Concert',
  'Season Finale',
]

function makeSlot(index: number, startDate: ISODateString): SeasonConcertSlot {
  const scheduledDate = SEASON_CONCERT_DATES[index]
  return {
    index,
    name: SLOT_NAMES[index],
    scheduledDay: dateToDayIndex(scheduledDate, startDate),
    scheduledDate,
    program: null,
    report: null,
    financeTransactions: [],
    institutionBefore: null,
    status: 'pending',
  }
}

export function createInitialSeason(
  institution: InstitutionState,
  initialPrincipals: Principal[],
): SeasonState {
  const calendar = createInitialCalendar()
  return {
    calendar,
    slots: [
      makeSlot(0, calendar.startDate),
      makeSlot(1, calendar.startDate),
      makeSlot(2, calendar.startDate),
      makeSlot(3, calendar.startDate),
    ],
    currentSlotIndex: 0,
    institution,
    roster: createInitialRoster(initialPrincipals),
    donors: createInitialDonors(),
    audience: createInitialAudience(),
    funding: null,
  }
}

export function resolveSeasonConcert(
  season: SeasonState,
  program: ConcertProgram,
  report: ConcertReport,
  works: Work[],
): SeasonState {
  const idx = season.currentSlotIndex
  if (idx >= season.slots.length) return season

  const activeSlot = season.slots[idx]
  const calendarAtConcert = setCalendarDay(season.calendar, activeSlot.scheduledDay)
  const { slots: settledSlots, cashDelta: settlementCashDelta } = settleDueTransactions(
    season.slots,
    calendarAtConcert.currentDay,
    calendarAtConcert.currentDate,
  )
  const nextSlot = season.slots[idx + 1]
  const financeTransactions = buildConcertFinanceTransactions(
    settledSlots[idx].name,
    idx,
    report,
    {
      concertDay: activeSlot.scheduledDay,
      concertDate: activeSlot.scheduledDate,
      nextConcertDay: nextSlot?.scheduledDay,
      nextConcertDate: nextSlot?.scheduledDate,
    },
  )
  const immediateCashDelta = financeTransactions
    .filter(transaction => transaction.status === 'posted')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const updatedSlot: SeasonConcertSlot = {
    ...settledSlots[idx],
    program,
    report,
    financeTransactions,
    institutionBefore: season.institution,
    status: 'resolved',
  }

  let newSlots = [...settledSlots] as SeasonState['slots']
  newSlots[idx] = updatedSlot

  // The deferred costs and donor support a concert schedules are normally
  // settled at the start of the NEXT concert. The final concert has no
  // successor to trigger that sweep, so its hall cost, production cost, and
  // donor support would otherwise be stranded forever — leaving the cash meter
  // overstated and contradicting the season summary's net. Close the books at
  // season end by settling every still-scheduled transaction.
  let closingCashDelta = 0
  const isFinalConcert = !nextSlot
  if (isFinalConcert) {
    const closed = settleAllScheduledTransactions(newSlots)
    newSlots = closed.slots
    closingCashDelta = closed.cashDelta
  }

  const baseInstitution = applyConcertReport(
    season.institution,
    report,
    settlementCashDelta + immediateCashDelta + closingCashDelta,
  )
  const nextRoster = updateRosterAfterConcert(season.roster, report.rosterChanges)
  const nextDonors = updateDonorsAfterConcert({
    donorState: season.donors,
    program,
    report,
    works,
  })
  const selectedWorks = program.workIds
    .slice(0, program.workCount)
    .map(id => works.find(work => work.id === id))
    .filter((work): work is Work => Boolean(work))
  const nextAudience = updateAudienceAfterConcert({
    audienceState: season.audience,
    cityAudienceSegments,
    program,
    report,
    works: selectedWorks,
    institution: baseInstitution,
    isOpeningNight: idx === 0,
  })
  const nextInstitution = {
    ...baseInstitution,
    audienceTrust: summarizeAudienceTrust(nextAudience),
  }

  return {
    calendar: calendarAtConcert,
    slots: newSlots,
    currentSlotIndex: idx + 1,
    institution: nextInstitution,
    roster: nextRoster,
    donors: nextDonors,
    audience: nextAudience,
    funding: season.funding,
  }
}

function settleDueTransactions(
  slots: SeasonState['slots'],
  currentDay: number,
  currentDate: ISODateString,
): { slots: SeasonState['slots']; cashDelta: number } {
  let cashDelta = 0
  const nextSlots = slots.map(slot => ({
    ...slot,
    financeTransactions: slot.financeTransactions.map(transaction => {
      if (transaction.status !== 'scheduled' || transaction.dueDay > currentDay) {
        return transaction
      }

      cashDelta += transaction.amount
      return {
        ...transaction,
        status: 'posted' as const,
        postedDay: currentDay,
        postedDate: currentDate,
      }
    }),
  })) as SeasonState['slots']

  return { slots: nextSlots, cashDelta }
}

// Settles every still-scheduled transaction regardless of due day, posting each
// on its own due date. Used to close the season's books after the final concert,
// which has no successor to trigger the normal due-day settlement sweep.
function settleAllScheduledTransactions(
  slots: SeasonState['slots'],
): { slots: SeasonState['slots']; cashDelta: number } {
  let cashDelta = 0
  const nextSlots = slots.map(slot => ({
    ...slot,
    financeTransactions: slot.financeTransactions.map(transaction => {
      if (transaction.status !== 'scheduled') return transaction

      cashDelta += transaction.amount
      return {
        ...transaction,
        status: 'posted' as const,
        postedDay: transaction.dueDay,
        postedDate: transaction.dueDate,
      }
    }),
  })) as SeasonState['slots']

  return { slots: nextSlots, cashDelta }
}

export function getAllFinanceTransactions(season: SeasonState): FinanceTransaction[] {
  return season.slots.flatMap(slot => slot.financeTransactions)
}

function buildIdentityNarrative(
  start: InstitutionState,
  end: InstitutionState,
): string[] {
  const notes: string[] = []

  const adventurousDelta = end.identity.adventurous - start.identity.adventurous
  const scholarlyDelta = end.identity.scholarly - start.identity.scholarly
  const communityDelta = end.identity.communityFocused - start.identity.communityFocused

  if (adventurousDelta >= 6)
    notes.push('The season built a clear identity around adventurous, contemporary programming.')
  else if (adventurousDelta >= 2)
    notes.push('The programming showed a modest lean toward contemporary work.')

  if (scholarlyDelta >= 2)
    notes.push('The orchestra established a scholarly, prestige-conscious identity this season.')

  if (communityDelta >= 2)
    notes.push('Community-focused programming was a thread running through the season.')

  if (notes.length === 0)
    notes.push('The season did not establish a dominant identity — the programming was varied or cautious.')

  return notes
}

export function summarizeSeason(season: SeasonState): SeasonSummary | null {
  if (season.currentSlotIndex < 4) return null

  const reports = season.slots.map(s => s.report!)
  const startingInstitution = season.slots[0].institutionBefore!

  const totalAttendance = reports.reduce((sum, r) => sum + r.attendance, 0)
  const averageCapacityPercent = Math.round((totalAttendance / (4 * HALL_CAPACITY)) * 100)

  // Aggregate attendance per segment across all 4 concerts
  const segmentTotals = new Map<string, { name: string; total: number }>()
  for (const report of reports) {
    for (const row of report.audienceBreakdown) {
      const existing = segmentTotals.get(row.segmentId)
      if (existing) existing.total += row.attendance
      else segmentTotals.set(row.segmentId, { name: row.segmentName, total: row.attendance })
    }
  }
  const sortedSegments = [...segmentTotals.values()].sort((a, b) => b.total - a.total)
  const bestSegment = sortedSegments[0]?.name ?? ''
  const worstSegment = sortedSegments[sortedSegments.length - 1]?.name ?? ''

  // Financial risk flags
  const financialRiskFlags: string[] = []
  const deficitCount = reports.filter(r => r.net < 0).length
  if (deficitCount >= 3)
    financialRiskFlags.push(`Running deficit for ${deficitCount} of 4 concerts — financial stability at risk next season.`)
  if (season.institution.cash < 200_000)
    financialRiskFlags.push('Cash fell below $200k — risk of insolvency if next season runs a deficit.')
  if (averageCapacityPercent < 50)
    financialRiskFlags.push('Average capacity below 50% — audience development must be a priority.')

  return {
    totalAttendance,
    totalRevenue: reports.reduce((sum, r) => sum + r.revenue, 0),
    totalDonorSupport: reports.reduce((sum, r) => sum + r.donorUplift, 0),
    totalExpenses: reports.reduce((sum, r) => sum + r.expenses, 0),
    totalNet: reports.reduce((sum, r) => sum + r.net, 0),
    startingInstitution,
    finalInstitution: season.institution,
    averagePerformanceQuality: Math.round(average(reports.map(r => r.performanceQuality))),
    averageAudienceResponse: Math.round(average(reports.map(r => r.audienceResponse))),
    identityNarrative: buildIdentityNarrative(startingInstitution, season.institution),
    averageCapacityPercent,
    bestSegment,
    worstSegment,
    financialRiskFlags,
  }
}
