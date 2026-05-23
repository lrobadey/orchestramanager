import { InstitutionState, ConcertReport } from '../types/core'
import { clamp } from './scoring'

export function applyConcertReport(
  state: InstitutionState,
  report: ConcertReport,
  cashDelta = report.institutionalDeltas.cash,
): InstitutionState {
  const d = report.institutionalDeltas
  return {
    name: state.name,
    city: state.city,
    seasonLabel: state.seasonLabel,
    cash: state.cash + cashDelta,
    artisticReputation: clamp(state.artisticReputation + d.artisticReputation, 0, 100),
    audienceTrust: clamp(state.audienceTrust + d.audienceTrust, 0, 100),
    donorConfidence: clamp(state.donorConfidence + d.donorConfidence, 0, 100),
    musicianMorale: clamp(state.musicianMorale + d.musicianMorale, 0, 100),
    technicalQuality: clamp(state.technicalQuality + d.technicalQuality, 0, 100),
    identity: {
      adventurous: clamp(state.identity.adventurous + (d.identity.adventurous ?? 0), 0, 100),
      communityFocused: clamp(state.identity.communityFocused + (d.identity.communityFocused ?? 0), 0, 100),
      scholarly: clamp(state.identity.scholarly + (d.identity.scholarly ?? 0), 0, 100),
    },
  }
}
