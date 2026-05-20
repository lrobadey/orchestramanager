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
import { average } from './scoring'

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

  return {
    totalAttendance: reports.reduce((sum, r) => sum + r.attendance, 0),
    totalRevenue: reports.reduce((sum, r) => sum + r.revenue, 0),
    totalExpenses: reports.reduce((sum, r) => sum + r.expenses, 0),
    totalNet: reports.reduce((sum, r) => sum + r.net, 0),
    startingInstitution,
    finalInstitution: season.institution,
    averagePerformanceQuality: Math.round(average(reports.map(r => r.performanceQuality))),
    averageAudienceResponse: Math.round(average(reports.map(r => r.audienceResponse))),
    identityNarrative: buildIdentityNarrative(startingInstitution, season.institution),
  }
}
