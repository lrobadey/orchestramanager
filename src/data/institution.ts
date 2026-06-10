import { InstitutionState } from '../types/core'

export const startingInstitution: InstitutionState = {
  name: 'Puget Sound Philharmonic',
  city: 'Seattle',
  seasonLabel: 'Season I · Debut',
  // Founding gift cushion. Sized against real concert costs: with per-service
  // musician payroll a mainstage night runs ~$100-120k all-in, so this is
  // roughly three concerts of runway before contributed income.
  cash: 350000,
  artisticReputation: 30,
  audienceTrust: 7,
  donorConfidence: 35,
  musicianMorale: 65,
  technicalQuality: 55,
  identity: {
    adventurous: 0,
    communityFocused: 0,
    scholarly: 0,
  },
}
