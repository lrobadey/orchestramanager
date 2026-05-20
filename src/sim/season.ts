import {
  InstitutionState,
  ConcertProgram,
  ConcertReport,
  SeasonConcertSlot,
  SeasonState,
  SeasonSummary,
  Principal,
} from '../types/core'
import { applyConcertReport } from './applyConcertReport'
import { createInitialRoster, updateRosterAfterConcert } from './roster'
import { average, HALL_CAPACITY } from './scoring'

const SLOT_NAMES = [
  'Opening Night',
  'Winter Program',
  'Spring Identity Concert',
  'Season Finale',
]

function makeSlot(index: number): SeasonConcertSlot {
  return {
    index,
    name: SLOT_NAMES[index],
    program: null,
    report: null,
    institutionBefore: null,
    status: 'pending',
  }
}

export function createInitialSeason(
  institution: InstitutionState,
  initialPrincipals: Principal[],
): SeasonState {
  return {
    slots: [makeSlot(0), makeSlot(1), makeSlot(2), makeSlot(3)],
    currentSlotIndex: 0,
    institution,
    roster: createInitialRoster(initialPrincipals),
  }
}

export function resolveSeasonConcert(
  season: SeasonState,
  program: ConcertProgram,
  report: ConcertReport,
): SeasonState {
  const idx = season.currentSlotIndex
  if (idx >= 4) return season

  const updatedSlot: SeasonConcertSlot = {
    ...season.slots[idx],
    program,
    report,
    institutionBefore: season.institution,
    status: 'resolved',
  }

  const newSlots = [...season.slots] as SeasonState['slots']
  newSlots[idx] = updatedSlot

  const nextInstitution = applyConcertReport(season.institution, report)
  const nextRoster = updateRosterAfterConcert(season.roster, report.rosterChanges)

  return {
    slots: newSlots,
    currentSlotIndex: idx + 1,
    institution: nextInstitution,
    roster: nextRoster,
  }
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
