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
  newMusicFluency: number
  classicalFluency: number
  romanticFluency: number
}

export type SectionKey = Principal['section']

export interface RosterState {
  principals: Principal[]
}

export type DonorRestrictionStyle =
  | 'unrestricted'
  | 'new-music'
  | 'education'
  | 'prestige'
  | 'general'

export interface DonorPreferences {
  canon: number
  romanticModernist: number
  contemporary: number
  communityAccess: number
  institutionalStability: number
  criticalPrestige: number
  audienceReach: number
}

export interface Donor {
  id: string
  name: string
  archetype: string
  description: string
  relationship: number
  capacity: number
  volatility: number
  restrictionStyle: DonorRestrictionStyle
  preferences: DonorPreferences
  recentReaction: string
  lastDelta: number
}

export interface DonorState {
  donors: Donor[]
}

export interface SectionStrength {
  section: SectionKey
  label: string
  strength: number
  bottleneck: string
  note: string
}

export interface RepertoireFit {
  section: SectionKey
  label: string
  demand: number
  strength: number
  stress: number
  exposurePenalty: number
  note: string
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
  name: string
  city: string
  seasonLabel: string
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
  projectedDonorUplift: number
  projectedAudienceBreakdown: AudienceBreakdown[]
  projectedExpenses: number
  projectedExpenseBreakdown: ExpenseBreakdown
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
  sectionStrengths: SectionStrength[]
  repertoireFit: RepertoireFit[]
  perWorkRehearsalDivisor: SlotTuple<number | null>
  perWorkRehearsalPressure: SlotTuple<number | null>
  perWorkRehearsalHoursNeeded: SlotTuple<number | null>
  perWorkRehearsalHoursAllocated: SlotTuple<number | null>
  perWorkPerformanceRisk: SlotTuple<number | null>
  forecastNotes: string[]
  isComplete: boolean
}

export interface SectionOutcome {
  section: SectionKey
  label: string
  quality: number
  note: string
}

export interface PrincipalRosterChange {
  principalId: string
  principalName: string
  position: string
  section: SectionKey
  formDelta: number
  moraleDelta: number
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

export interface ExpenseBreakdown {
  baseConcert: number
  rehearsal: number
  marketing: number
  production: number
  total: number
}

export interface ConcertReport {
  attendance: number
  revenue: number
  donorUplift: number
  audienceBreakdown: AudienceBreakdown[]
  expenses: number
  expenseBreakdown: ExpenseBreakdown
  net: number
  financialNotes: string[]
  performanceQuality: number
  audienceResponse: number
  criticResponse: number
  memoryAnchorWorkId: string | null
  sectionOutcomes: SectionOutcome[]
  rosterChanges: PrincipalRosterChange[]
  notableMoments: string[]
  institutionalDeltas: InstitutionalDeltas
}

export type FinanceTransactionKind =
  | 'ticket-revenue'
  | 'donor-support'
  | 'base-cost'
  | 'rehearsal-cost'
  | 'marketing-cost'
  | 'production-cost'

export type FinanceTransactionStatus = 'posted' | 'scheduled'

export interface FinanceTransaction {
  id: string
  concertIndex: number
  concertName: string
  label: string
  kind: FinanceTransactionKind
  amount: number
  status: FinanceTransactionStatus
  dueSlotIndex: number
}

export interface SeasonConcertSlot {
  index: number
  name: string
  program: ConcertProgram | null
  report: ConcertReport | null
  financeTransactions: FinanceTransaction[]
  institutionBefore: InstitutionState | null
  status: 'pending' | 'resolved'
}

export interface SeasonState {
  slots: [SeasonConcertSlot, SeasonConcertSlot, SeasonConcertSlot, SeasonConcertSlot]
  currentSlotIndex: number
  institution: InstitutionState
  roster: RosterState
  donors: DonorState
}

export interface SeasonSummary {
  totalAttendance: number
  totalRevenue: number
  totalDonorSupport: number
  totalExpenses: number
  totalNet: number
  startingInstitution: InstitutionState
  finalInstitution: InstitutionState
  averagePerformanceQuality: number
  averageAudienceResponse: number
  identityNarrative: string[]
  averageCapacityPercent: number
  bestSegment: string
  worstSegment: string
  financialRiskFlags: string[]
}
