import type {
  ConcertProgram,
  ConcertReport,
  Donor,
  DonorInstitutionalPriorities,
  DonorMusicTaste,
  DonorState,
  Work,
} from '../types/core'
import { average, clamp, HALL_CAPACITY } from './scoring'

interface UpdateDonorsAfterConcertInput {
  donorState: DonorState
  program: ConcertProgram
  report: ConcertReport
  works: Work[]
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

      return {
        ...donor,
        relationship: Math.round(clamp(donor.relationship + relationshipDelta, 0, 100)),
        lastDelta: relationshipDelta,
        recentReaction: summarizeReaction(donor, musicFit, institutionalFit, relationshipDelta),
      }
    }),
  }
}

function resolveProgramWorks(program: ConcertProgram, works: Work[]): Work[] {
  return program.workIds
    .slice(0, program.workCount)
    .map(id => works.find(work => work.id === id))
    .filter((work): work is Work => Boolean(work))
}

export function buildConcertMusicProfile(works: Work[]): DonorMusicTaste {
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
  const studentRow = report.audienceBreakdown.find(row => row.segmentId === 'students-educators')
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
  const weighted = axes.map(axis => {
    const importance = donorTaste[axis] / 100
    const distance = Math.abs(donorTaste[axis] - concertProfile[axis])
    return (100 - distance) * importance
  })
  return clamp(average(weighted) - 35, -50, 50)
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
  const rawDelta = clamp((score / 10) * volatilityScale, -6, 6)
  let delta = Math.round(rawDelta)

  // Keep concert reactions visible: a clearly positive/negative read should move
  // the relationship by at least one point even if rounding would hide it.
  if (delta === 0 && Math.abs(score) >= 6) {
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
