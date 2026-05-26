import type {
  ConcertProgram,
  ConcertReport,
  Donor,
  DonorInstitutionalPriorities,
  DonorMusicTaste,
  DonorState,
  ExpenseBreakdown,
  InstitutionState,
  Work,
} from '../types/core'
import { average, clamp, HALL_CAPACITY } from './scoring'

interface UpdateDonorsAfterConcertInput {
  donorState: DonorState
  program: ConcertProgram
  report: ConcertReport
  works: Work[]
}

interface EstimateDonorUpliftInput {
  donorState: DonorState
  institution: InstitutionState
  program: ConcertProgram
  works: Work[]
  projectedAttendance: number
  projectedRevenue: number
  projectedExpenseBreakdown: ExpenseBreakdown
}

export function estimateDonorUpliftFromDonors({
  donorState,
  institution,
  program,
  works,
  projectedAttendance,
  projectedRevenue,
  projectedExpenseBreakdown,
}: EstimateDonorUpliftInput): number {
  const musicProfile = buildConcertMusicProfile(works)
  const institutionalProfile = buildForecastInstitutionalProfile({
    institution,
    program,
    works,
    projectedAttendance,
    projectedRevenue,
    projectedExpenseBreakdown,
  })
  const climate = clamp(0.78 + institution.donorConfidence / 220, 0.65, 1.25)

  const total = donorState.donors.reduce((sum, donor) => {
    const musicFit = scoreMusicFit(donor.musicTaste, musicProfile)
    const institutionalFit = scoreInstitutionalFit(
      donor.institutionalPriorities,
      institutionalProfile,
    )
    const fitScore =
      musicFit * (donor.influenceWeights.music / 100) +
      institutionalFit * (donor.influenceWeights.institutional / 100)
    const relationshipFactor = donorRelationshipGivingFactor(donor)
    const adjustedFitScore = fitScore < 0 ? fitScore * (1 - donor.loyalty / 200) : fitScore
    const fitFactor = clamp(1 + adjustedFitScore / 95, 0.25, 1.6)
    const restrictionFactor = donorRestrictionFactor(donor, program, works)

    return sum + donor.capacity * 0.025 * relationshipFactor * fitFactor * restrictionFactor * climate
  }, 0)

  return Math.round(Math.max(0, total))
}

export function updateDonorsAfterConcert({
  donorState,
  program,
  report,
  works,
}: UpdateDonorsAfterConcertInput): DonorState {
  const concertWorks = resolveProgramWorks(program, works)
  const musicProfile = buildConcertMusicProfile(concertWorks)
  const institutionalProfile = buildConcertInstitutionalProfile(program, report, concertWorks)

  return {
    donors: donorState.donors.map(donor => {
      const musicFit = scoreMusicFit(donor.musicTaste, musicProfile)
      const institutionalFit = scoreInstitutionalFit(
        donor.institutionalPriorities,
        institutionalProfile,
      )
      const finalScore =
        musicFit * (donor.influenceWeights.music / 100) +
        institutionalFit * (donor.influenceWeights.institutional / 100)
      const relationshipDelta = scoreToRelationshipDelta(finalScore, donor.volatility)
      const alignmentScore = finalScore * 2
      const alignmentMemory = clamp(donor.alignmentMemory * 0.75 + alignmentScore * 0.25, -100, 100)
      const loyaltyDelta = computeLoyaltyDelta(donor.loyalty, alignmentMemory)
      const commitmentDelta = computeCommitmentDelta({
        relationship: donor.relationship,
        loyalty: donor.loyalty,
        commitment: donor.commitment,
        finalScore,
        relationshipDelta,
      })

      return {
        ...donor,
        relationship: Math.round(clamp(donor.relationship + relationshipDelta, 0, 100)),
        loyalty: Math.round(clamp(donor.loyalty + loyaltyDelta, 0, 100)),
        commitment: Math.round(clamp(donor.commitment + commitmentDelta, 0, 100)),
        alignmentMemory: Math.round(alignmentMemory),
        lastDelta: relationshipDelta,
        recentReaction: summarizeReaction(donor, musicFit, institutionalFit, relationshipDelta),
      }
    }),
  }
}

function donorRelationshipGivingFactor(donor: Donor): number {
  const relationship = Math.max(donor.relationship / 100, 0.05)
  const loyalty = Math.max(donor.loyalty / 100, 0.2)
  const commitment = Math.max(donor.commitment / 100, 0.2)
  const effectiveRelationship = clamp(
    100 *
      Math.pow(relationship, 0.85) *
      Math.pow(loyalty, 0.15) *
      Math.pow(commitment, 0.1),
    0,
    100,
  )
  return clamp((effectiveRelationship - 25) / 75, 0, 1)
}

function computeLoyaltyDelta(loyalty: number, alignmentMemory: number): number {
  const rate = 1.5
  if (alignmentMemory >= 0) {
    return (alignmentMemory / 100) * (1 - loyalty / 100) * rate
  }
  return (alignmentMemory / 100) * (loyalty / 100) * rate
}

function computeCommitmentDelta({
  relationship,
  loyalty,
  commitment,
  finalScore,
  relationshipDelta,
}: {
  relationship: number
  loyalty: number
  commitment: number
  finalScore: number
  relationshipDelta: number
}): number {
  if (finalScore >= 0) {
    const alignment = clamp(finalScore / 50, 0, 1)
    return alignment * (relationship / 100) * (1 - commitment / 100) * 2
  }

  const misalignment = clamp(-finalScore / 50, 0, 1)
  const baseLoss = misalignment * (1 - loyalty / 140) * 1.5
  const disappointment = Math.max(0, -relationshipDelta)
  const protectionThreshold = 2 + commitment / 20
  const breach = Math.max(0, disappointment - protectionThreshold)
  const breachLoss = breach * breach * (commitment / 100) * 0.35
  return -(baseLoss + breachLoss)
}

function donorRestrictionFactor(donor: Donor, program: ConcertProgram, works: Work[]): number {
  const novelty = works.length > 0 ? average(works.map(work => work.novelty)) : 0
  const prestige = works.length > 0 ? average(works.map(work => work.artisticPrestige)) : 0
  const contemporaryCount = works.filter(work => work.isContemporary).length

  switch (donor.restrictionStyle) {
    case 'new-music':
      return contemporaryCount > 0 || novelty > 60 ? 1.3 : 0.55
    case 'education':
      return program.studentTicketsEnabled ? 1.25 : 0.75
    case 'prestige':
      return prestige > 70 ? 1.2 : 0.8
    case 'general':
      return 1
    case 'unrestricted':
    default:
      return 1.05
  }
}

function buildForecastInstitutionalProfile({
  institution,
  program,
  works,
  projectedAttendance,
  projectedRevenue,
  projectedExpenseBreakdown,
}: Omit<EstimateDonorUpliftInput, 'donorState'>): DonorInstitutionalPriorities {
  const attendanceRate = projectedAttendance / HALL_CAPACITY
  const novelty = works.length > 0 ? average(works.map(work => work.novelty)) : 0
  const identity = works.length > 0 ? average(works.map(work => work.identityValue)) : 0
  const prestige = works.length > 0 ? average(works.map(work => work.artisticPrestige)) : 0
  const preDonorNet = projectedRevenue - projectedExpenseBreakdown.total
  const studentAccess = program.studentTicketsEnabled
    ? clamp(100 - program.studentTicketPrice * 2.4, 20, 100)
    : 20

  return {
    prestige: Math.round(clamp(prestige * 0.6 + institution.artisticReputation * 0.4, 0, 100)),
    stability: Math.round(clamp(50 + preDonorNet / 1_200 + institution.donorConfidence * 0.25, 0, 100)),
    access: Math.round(clamp(studentAccess * 0.65 + institution.audienceTrust * 0.2 + attendanceRate * 15, 0, 100)),
    reach: Math.round(clamp(attendanceRate * 100, 0, 100)),
    revenue: Math.round(clamp(45 + preDonorNet / 1_000 + projectedRevenue / 2_200, 0, 100)),
    innovation: Math.round(clamp(novelty * 0.55 + identity * 0.3 + institution.identity.adventurous * 0.15, 0, 100)),
  }
}

function resolveProgramWorks(program: ConcertProgram, works: Work[]): Work[] {
  return program.workIds
    .slice(0, program.workCount)
    .map(id => works.find(work => work.id === id))
    .filter((work): work is Work => Boolean(work))
}

export function buildConcertMusicProfile(works: readonly Work[]): DonorMusicTaste {
  if (works.length === 0) return zeroMusicProfile()

  return {
    classicalCanon: Math.round(average(works.map(work => {
      const eraLift = work.era === 'classical' ? 34 : work.era === 'romantic' ? 18 : 0
      return clamp(work.donorComfort * 0.35 + work.familiarity * 0.35 + work.artisticPrestige * 0.2 + eraLift, 0, 100)
    }))),
    romantic: Math.round(average(works.map(work => {
      const eraLift = work.era === 'romantic' ? 48 : work.era === 'late-romantic' ? 42 : 0
      return clamp(eraLift + work.artisticPrestige * 0.25 + work.donorComfort * 0.15, 0, 100)
    }))),
    modernist: Math.round(average(works.map(work => {
      const eraLift = work.era === 'late-romantic' ? 32 : work.isContemporary ? 20 : 0
      return clamp(eraLift + work.novelty * 0.45 + work.artisticPrestige * 0.2, 0, 100)
    }))),
    contemporary: Math.round(average(works.map(work => clamp((work.isContemporary ? 55 : 0) + work.novelty * 0.4 + work.identityValue * 0.2, 0, 100)))),
    experimental: Math.round(average(works.map(work => clamp(work.novelty * 0.65 + work.identityValue * 0.3 - work.audienceDraw * 0.12, 0, 100)))),
    accessible: Math.round(average(works.map(work => clamp(work.audienceDraw * 0.45 + work.familiarity * 0.35 + work.donorComfort * 0.2 - work.novelty * 0.12, 0, 100)))),
  }
}

export function buildConcertInstitutionalProfile(
  program: ConcertProgram,
  report: ConcertReport,
  works: Work[],
): DonorInstitutionalPriorities {
  const attendanceRate = report.attendance / HALL_CAPACITY
  const studentRow = report.audienceBreakdown.find(row =>
    row.segmentId === 'students-emerging-artists' || row.segmentId === 'students-educators',
  )
  const studentAccess = program.studentTicketsEnabled
    ? clamp(100 - program.studentTicketPrice * 2.4, 20, 100)
    : 20
  const access = clamp(
    studentAccess * 0.55 +
      (studentRow?.priceAccessibilityScore ?? 50) * 0.25 +
      report.audienceResponse * 0.2,
    0,
    100,
  )
  const novelty = works.length > 0 ? average(works.map(work => work.novelty)) : 0
  const identity = works.length > 0 ? average(works.map(work => work.identityValue)) : 0

  return {
    prestige: Math.round(clamp(report.criticResponse * 0.55 + report.performanceQuality * 0.3 + Math.max(0, report.institutionalDeltas.artisticReputation) * 3, 0, 100)),
    stability: Math.round(clamp(50 + report.net / 1_200 + report.audienceResponse * 0.2 + Math.max(0, report.institutionalDeltas.audienceTrust) * 2, 0, 100)),
    access: Math.round(access),
    reach: Math.round(clamp(attendanceRate * 100, 0, 100)),
    revenue: Math.round(clamp(50 + report.net / 900 + report.revenue / 2_000, 0, 100)),
    innovation: Math.round(clamp(novelty * 0.6 + identity * 0.4, 0, 100)),
  }
}

function scoreMusicFit(donorTaste: DonorMusicTaste, concertProfile: DonorMusicTaste): number {
  const axes = Object.keys(donorTaste) as Array<keyof DonorMusicTaste>
  const totalImportance = axes.reduce((sum, axis) => sum + donorTaste[axis], 0) || 1
  const weighted = axes.reduce((sum, axis) => {
    const importance = donorTaste[axis] / totalImportance
    const distance = Math.abs(donorTaste[axis] - concertProfile[axis])
    return sum + (100 - distance) * importance
  }, 0)
  return clamp(weighted - 35, -50, 50)
}

function scoreInstitutionalFit(
  priorities: DonorInstitutionalPriorities,
  concertProfile: DonorInstitutionalPriorities,
): number {
  const axes = Object.keys(priorities) as Array<keyof DonorInstitutionalPriorities>
  const totalWeight = axes.reduce((sum, axis) => sum + priorities[axis], 0) || 1
  const weighted = axes.reduce(
    (sum, axis) => sum + concertProfile[axis] * (priorities[axis] / totalWeight),
    0,
  )
  return clamp(weighted - 50, -50, 50)
}

function scoreToRelationshipDelta(score: number, volatility: number): number {
  const volatilityScale = 0.75 + volatility / 200
  const rawDelta = clamp((score / 5) * volatilityScale, -6, 6)
  let delta = Math.round(rawDelta)

  // Keep concert reactions visible: a clearly positive/negative read should move
  // the relationship by at least one point even if rounding would hide it.
  if (delta === 0 && Math.abs(score) >= 3) {
    delta = score > 0 ? 1 : -1
  }

  return Object.is(delta, -0) ? 0 : delta
}

function summarizeReaction(
  donor: Donor,
  musicFit: number,
  institutionalFit: number,
  delta: number,
): string {
  const musicRead = musicFit >= 12 ? 'music landed' : musicFit <= -12 ? 'music grated' : 'music read as mixed'
  const institutionRead = institutionalFit >= 12
    ? 'institutional signals reassured them'
    : institutionalFit <= -12
      ? 'institutional signals worried them'
      : 'institutional signals were ambiguous'
  const direction = delta > 0 ? 'Relationship warmed.' : delta < 0 ? 'Relationship cooled.' : 'Relationship held steady.'

  if (donor.influenceWeights.music > donor.influenceWeights.institutional) {
    return `${direction} The ${musicRead}; ${institutionRead}.`
  }
  return `${direction} The ${institutionRead}; ${musicRead}.`
}

function zeroMusicProfile(): DonorMusicTaste {
  return {
    classicalCanon: 0,
    romantic: 0,
    modernist: 0,
    contemporary: 0,
    experimental: 0,
    accessible: 0,
  }
}
