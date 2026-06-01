// Small Home Console helpers that are not yet backed by a dedicated sim layer.
//
// The fabricated "feeds" that used to live here (inbox events, finance
// sparkline, trail annotations, hardcoded concert dates / days-to-curtain)
// have been removed: the Home Console now reads scheduling from the real
// calendar and shows explicit "coming soon" panels where a system does not
// exist yet, rather than rendering placeholder data as if it were real.

import type { SeasonConcertSlot } from '../types/core'

// Static institutional venue label. Replace when the institution owns a real
// principal venue in the data model.
export const VENUE_NAME = 'Benaroya Hall · Main Stage'

// Derives a short headline per resolved slot from the real critic response
// until the report sim provides one directly on resolved slots.
export function slotHeadlineFallback(slot: SeasonConcertSlot): string | null {
  if (!slot.report) return null
  const c = slot.report.criticResponse
  if (c >= 75) return 'Critics were warm.'
  if (c >= 55) return 'A capable verdict.'
  if (c >= 35) return 'A mixed reception.'
  return 'A punishing review.'
}
