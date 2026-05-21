// STUB DATA for the Home Console.
//
// Everything in this file is a placeholder that should be replaced when the
// simulation provides a real layer for it. The Home Console renders these
// values literally so reviewers can spot which panels are not yet real.
//
// Follow-up sim work, grep for "STUB" to find these:
// - Inbox events (donor/critic/musician/venue) require an inbox/event sim.
// - Calendar / concert dates require a date model.
// - Finance time series requires per-week ledger tracking.
// - Trail annotations require event surfacing tied to slots.

import type { SeasonConcertSlot } from '../types/core'

// STUB — replace when an event/inbox sim exists.
export interface InboxMessage {
  kind: 'donor' | 'critic' | 'musician' | 'venue'
  text: string
  time: string
}

export const INBOX_MESSAGES: InboxMessage[] = [
  { kind: 'donor', text: 'Lindgren Foundation requests Sibelius programming.', time: '2d' },
  { kind: 'critic', text: 'The Seattle Times review of Concert I: cautious.', time: '3d' },
  { kind: 'musician', text: 'Principal Horn requests two weeks off after II.', time: '5d' },
  { kind: 'venue', text: 'Benaroya Hall stage available Oct 24–26.', time: '6d' },
]

// STUB — replace when per-week cash history exists.
// Values are weekly net deltas in $K; positive renders upward in the sparkline.
export const FINANCE_SPARKLINE: number[] = [10, 16, 9, 21, 14, 7, 18, 22, 11, 8, 14, 17, 24, 19]

// STUB — replace when the sim emits events tied to slots.
export interface TrailAnnotation {
  lmIndex: 0 | 1 | 2 | 3
  kind: 'critic' | 'donor' | 'musician' | 'arc'
  text: string
}

export const TRAIL_ANNOTATIONS: TrailAnnotation[] = [
  { lmIndex: 0, kind: 'critic', text: 'The Seattle Times: "cautious."' },
  { lmIndex: 1, kind: 'donor', text: 'Lindgren Foundation expects Sibelius.' },
  { lmIndex: 2, kind: 'musician', text: 'Principal Horn requests time off after II.' },
  { lmIndex: 3, kind: 'arc', text: 'Identity arc · adventurous trajectory.' },
]

// STUB — replace when a real calendar/scheduling model exists.
// Derives a notional "days to curtain" from slot index so the number is
// stable across renders and roughly matches the four-concert season cadence.
const DAYS_TO_CURTAIN_BY_SLOT = [28, 41, 63, 49]
export function daysToCurtain(slotIndex: number): number {
  if (slotIndex < 0 || slotIndex >= DAYS_TO_CURTAIN_BY_SLOT.length) return 0
  return DAYS_TO_CURTAIN_BY_SLOT[slotIndex]
}

// STUB — replace when scheduling exists. Mirrors the four-concert season.
const CONCERT_DATES = ['September 14', 'October 26', 'January 11', 'March 22']
export function concertDate(slotIndex: number): string {
  if (slotIndex < 0 || slotIndex >= CONCERT_DATES.length) return ''
  return CONCERT_DATES[slotIndex]
}

// STUB — replace when the institution has a real principal venue.
export const VENUE_NAME = 'Benaroya Hall · Main Stage'

// STUB — replace when a season-week clock exists.
export function seasonWeekLabel(slotIndex: number): string {
  const weeks = [2, 6, 14, 22]
  const wk = weeks[Math.max(0, Math.min(weeks.length - 1, slotIndex))]
  return `Wk ${wk} of 28`
}

// Cheap helper used by SeasonTrail to derive a short headline per slot until
// the report sim provides one directly on resolved slots.
export function slotHeadlineFallback(slot: SeasonConcertSlot): string | null {
  if (!slot.report) return null
  const c = slot.report.criticResponse
  if (c >= 75) return 'Critics were warm.'
  if (c >= 55) return 'A capable verdict.'
  if (c >= 35) return 'A mixed reception.'
  return 'A punishing review.'
}
