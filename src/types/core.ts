export type Era = 'classical' | 'romantic' | 'late-romantic' | 'contemporary'

export interface Work {
  id: string
  title: string
  composer: string
  durationMinutes: number
  era: Era
  isContemporary: boolean
  // 0-100 audience scores
  audienceDraw: number
  artisticPrestige: number
  donorComfort: number
  novelty: number
  identityValue: number
  // abstract load (0–100); divide by a leadership-based divisor to get rehearsal hours needed
  rehearsalLoad: number
  // 0–100: how well-known the piece is; boosts the rehearsal divisor
  familiarity: number
  // section demands 0-100 (how hard this work is for each section)
  demands: {
    strings: number
    winds: number
    brass: number
    percussion: number
  }
}

export interface Principal {
  id: string
  name: string
  position: string
  section: 'strings' | 'winds' | 'brass' | 'percussion'
  overall: number
  morale: number
  form: number
  intonation: number
  rhythm: number
  endurance: number
  tone: number
  blend: number
  soloReliability: number
  leadership: number
  stressResistance: number
}

export interface AudienceSegment {
  id: string
  name: string
  size: number
  loyalty: number
  priceSensitivity: number
  canonAffinity: number
  contemporaryAffinity: number
  crossoverAffinity: number
  prestigeAffinity: number
  communityAffinity: number
}

export interface IdentityProfile {
  adventurous: number
  communityFocused: number
  scholarly: number
}

export interface InstitutionState {
  cash: number
  artisticReputation: number
  audienceTrust: number
  donorConfidence: number
  musicianMorale: number
  technicalQuality: number
  identity: IdentityProfile
}

export type SlotTuple<T> = [T, T, T]

export interface ConcertProgram {
  workCount: 2 | 3
  workIds: SlotTuple<string | null>
  intermissionAfter: 0 | 1 | null
  rehearsalAllocation: SlotTuple<number>
  marketingSpend: number
  ticketPrice: number
  studentTicketsEnabled: boolean
  studentTicketPrice: number
}

export const TOTAL_REHEARSAL_HOURS = 20

export type ProgramArcPlacementRole = 'opener' | 'middle' | 'finale'

export interface ProgramArcWorkSalience {
  workId: string
  slotIndex: number
  placementRole: ProgramArcPlacementRole
  durationWeight: number
  placementWeight: number
  familiarityWeight: number
  prestigeWeight: number
  noveltyVolatilityWeight: number
  perceivedDamage: number
  perceivedUpside: number
}

export interface ProgramArcSalienceResult {
  perWork: ProgramArcWorkSalience[]
  aggregatePerceivedDamage: number
  aggregatePerceivedUpside: number
  memoryAnchorWorkId: string | null
  notes: string[]
}

export interface ConcertForecast {
  projectedAttendance: number
  projectedRevenue: number
  projectedAudienceBreakdown: AudienceBreakdown[]
  projectedExpenses: number
  projectedNet: number
  performanceRisk: number
  rehearsalPressure: number
  arcSalience: ProgramArcSalienceResult
  arcPerceivedDamage: number
  arcPerceivedUpside: number
  perWorkArcDamage: SlotTuple<number | null>
  memoryAnchorWorkId: string | null
  audienceFit: number
  donorResponse: number
  identityImpact: number
  sectionStress: {
    strings: number
    winds: number
    brass: number
    percussion: number
  }
  perWorkRehearsalDivisor: SlotTuple<number | null>
  perWorkRehearsalPressure: SlotTuple<number | null>
  perWorkRehearsalHoursNeeded: SlotTuple<number | null>
  perWorkRehearsalHoursAllocated: SlotTuple<number | null>
  perWorkPerformanceRisk: SlotTuple<number | null>
  forecastNotes: string[]
  isComplete: boolean
}

export interface SectionOutcome {
  section: string
  quality: number
  note: string
}

export interface InstitutionalDeltas {
  cash: number
  artisticReputation: number
  audienceTrust: number
  donorConfidence: number
  musicianMorale: number
  technicalQuality: number
  identity: Partial<IdentityProfile>
}

export interface AudienceBreakdown {
  segmentId: string
  segmentName: string
  attendance: number
  shareOfHouse: number
  effectiveTicketPrice: number
  ticketRevenue: number
  priceAccessibilityScore: number
}

export interface ConcertReport {
  attendance: number
  revenue: number
  audienceBreakdown: AudienceBreakdown[]
  expenses: number
  net: number
  performanceQuality: number
  audienceResponse: number
  criticResponse: number
  memoryAnchorWorkId: string | null
  sectionOutcomes: SectionOutcome[]
  notableMoments: string[]
  institutionalDeltas: InstitutionalDeltas
}

export interface SeasonConcertSlot {
  index: number
  name: string
  program: ConcertProgram | null
  report: ConcertReport | null
  institutionBefore: InstitutionState | null
  status: 'pending' | 'resolved'
}

export interface SeasonState {
  slots: [SeasonConcertSlot, SeasonConcertSlot, SeasonConcertSlot, SeasonConcertSlot]
  currentSlotIndex: number
  institution: InstitutionState
}

export interface SeasonSummary {
  totalAttendance: number
  totalRevenue: number
  totalExpenses: number
  totalNet: number
  startingInstitution: InstitutionState
  finalInstitution: InstitutionState
  averagePerformanceQuality: number
  averageAudienceResponse: number
  identityNarrative: string[]
}
