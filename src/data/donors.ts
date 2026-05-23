import type { Donor, DonorState } from '../types/core'

export const donors: Donor[] = [
  {
    id: 'eleanor-voss',
    name: 'Eleanor Voss',
    archetype: 'Canon patron',
    description:
      'An old-money benefactor who sees the orchestra as a steward of Beethoven, Brahms, and institutional continuity.',
    relationship: 72,
    capacity: 85_000,
    volatility: 34,
    restrictionStyle: 'prestige',
    preferences: {
      canon: 96,
      romanticModernist: 72,
      contemporary: 12,
      communityAccess: 28,
      institutionalStability: 88,
      criticalPrestige: 70,
      audienceReach: 62,
    },
    recentReaction: 'Waiting to see whether the season protects the core audience.',
    lastDelta: 0,
  },
  {
    id: 'aster-foundation',
    name: 'The Aster Foundation',
    archetype: 'Avant-garde foundation',
    description:
      'A future-facing arts foundation that funds institutions willing to make contemporary music feel inevitable.',
    relationship: 58,
    capacity: 120_000,
    volatility: 78,
    restrictionStyle: 'new-music',
    preferences: {
      canon: 8,
      romanticModernist: 38,
      contemporary: 98,
      communityAccess: 54,
      institutionalStability: 34,
      criticalPrestige: 82,
      audienceReach: 42,
    },
    recentReaction: 'Curious, but unconvinced the orchestra is ready to lead from the frontier.',
    lastDelta: 0,
  },
  {
    id: 'rehnquist-circle',
    name: 'Martin & Celia Rehnquist',
    archetype: '19th/20th c. prestige patrons',
    description:
      'Sophisticated patrons drawn to Romantic sweep, early modern color, and performances with real emotional scale.',
    relationship: 66,
    capacity: 70_000,
    volatility: 48,
    restrictionStyle: 'prestige',
    preferences: {
      canon: 58,
      romanticModernist: 94,
      contemporary: 46,
      communityAccess: 30,
      institutionalStability: 62,
      criticalPrestige: 90,
      audienceReach: 54,
    },
    recentReaction: 'Looking for ambition with craft: neither museum safety nor abstraction for its own sake.',
    lastDelta: 0,
  },
  {
    id: 'okafor-civic-fund',
    name: 'Okafor Civic Fund',
    archetype: 'Community access funder',
    description:
      'A civic foundation that believes the orchestra belongs to the city, especially students and first-time listeners.',
    relationship: 61,
    capacity: 55_000,
    volatility: 44,
    restrictionStyle: 'education',
    preferences: {
      canon: 36,
      romanticModernist: 42,
      contemporary: 56,
      communityAccess: 98,
      institutionalStability: 58,
      criticalPrestige: 38,
      audienceReach: 88,
    },
    recentReaction: 'Watching ticket policy and audience reach more closely than repertoire fashion.',
    lastDelta: 0,
  },
  {
    id: 'victor-saye',
    name: 'Victor Saye',
    archetype: 'Corporate sponsor',
    description:
      'A board-adjacent sponsor who wants momentum, full rooms, clean optics, and proof that the institution is winning.',
    relationship: 64,
    capacity: 95_000,
    volatility: 52,
    restrictionStyle: 'general',
    preferences: {
      canon: 48,
      romanticModernist: 58,
      contemporary: 32,
      communityAccess: 50,
      institutionalStability: 96,
      criticalPrestige: 54,
      audienceReach: 96,
    },
    recentReaction: 'Less concerned with doctrine than whether the room, press, and balance sheet look healthy.',
    lastDelta: 0,
  },
]

export function createInitialDonors(): DonorState {
  return {
    donors: donors.map(donor => ({ ...donor, preferences: { ...donor.preferences } })),
  }
}
