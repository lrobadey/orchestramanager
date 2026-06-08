import {
  AudienceState,
  CityAudienceSegment,
  ConcertProgram,
  ConcertReport,
  DonorState,
  InstitutionState,
  Work,
} from '../types/core'
import { average, clamp } from './scoring'
import { computeMarketingImpact } from './marketing'

function noveltyAffinity(segment: CityAudienceSegment): number {
  return segment.noveltyAffinity
}

function segmentProgramFit(segment: CityAudienceSegment, works: Work[], program: ConcertProgram): number {
  const prestige = average(works.map(work => work.artisticPrestige))
  const novelty = average(works.map(work => work.novelty))
  const draw = average(works.map(work => work.audienceDraw))
  const canonScore = 100 - novelty
  const communitySignal = clamp(
    (program.studentTicketsEnabled ? 35 : 0) +
      (program.ticketPrice <= 55 ? 25 : 0) +
      (100 - program.ticketPrice) * 0.15,
    0,
    100,
  )

  return clamp(
    segment.canonAffinity * (canonScore / 100) * 0.28 +
      noveltyAffinity(segment) * (novelty / 100) * 0.28 +
      segment.prestigeAffinity * (prestige / 100) * 0.22 +
      segment.communityAffinity * (communitySignal / 100) * 0.14 +
      draw * 0.08,
    0,
    100,
  )
}

function reactionText(segment: CityAudienceSegment, delta: number, fit: number): string {
  if (delta >= 4) return `${segment.name} are beginning to see the orchestra as meant for them.`
  if (delta >= 1) return `${segment.name} noticed the signal, but the relationship is still forming.`
  if (delta <= -3) return `${segment.name} felt less invited by this concert.`
  if (fit >= 65) return `${segment.name} were interested, but need repetition before it becomes habit.`
  return `${segment.name} remain mostly uncommitted.`
}

export function summarizeAudienceTrust(audience: AudienceState): number {
  if (audience.relationships.length === 0) return 0
  return Math.round(average(audience.relationships.map(row => row.trust)))
}

export function computeOpeningNightMultiplier({
  institution,
  audienceState,
  donorState,
  cityAudienceSegments,
  program,
  works,
}: {
  institution: InstitutionState
  audienceState: AudienceState
  donorState?: DonorState
  cityAudienceSegments: CityAudienceSegment[]
  program: ConcertProgram
  works: Work[]
}): number {
  // Signal 1: Institutional Readiness
  // Reputation drives press and cultural standing; morale drives musician word-of-mouth
  const I =
    0.60 * (institution.artisticReputation / 100) +
    0.40 * (institution.musicianMorale / 100)

  // Signal 2: Audience Anticipation
  // Habit leads (subscribers attend and recruit), trust follows,
  // alignment memory only contributes when positive
  const totalSize = cityAudienceSegments.reduce((sum, seg) => sum + seg.size, 0)
  const A =
    totalSize === 0
      ? 0
      : cityAudienceSegments.reduce((sum, seg) => {
          const rel = audienceState.relationships.find(r => r.segmentId === seg.id)
          if (!rel) return sum
          const segScore =
            (rel.habit * 0.50 + rel.trust * 0.35 + Math.max(rel.alignmentMemory, 0) * 0.15) / 100
          return sum + segScore * (seg.size / totalSize)
        }, 0)

  // Signal 3: Donor Catalyst
  // Activated high-relationship donors bring social networks; weighted by capacity share,
  // then scaled by the aggregate institutional donor health
  let D = 0
  if (donorState && donorState.donors.length > 0) {
    const totalCapacity = donorState.donors.reduce((sum, d) => sum + d.capacity, 0)
    if (totalCapacity > 0) {
      const rawDonorSignal = donorState.donors.reduce((sum, donor) => {
        // relationship dominates (0.80 exponent), loyalty secondary (0.15), commitment tertiary (0.05)
        const activation =
          Math.pow(Math.max(donor.relationship, 1) / 100, 0.80) *
          Math.pow(Math.max(donor.loyalty, 1) / 100, 0.15) *
          Math.pow(Math.max(donor.commitment, 1) / 100, 0.05)
        return sum + activation * (donor.capacity / totalCapacity)
      }, 0)
      D = rawDonorSignal * clamp(0.70 + (institution.donorConfidence / 100) * 0.30, 0.70, 1.0)
    }
  }

  // Signal 4: Program Salience
  // Extreme novelty generates buzz only when it fits the institution's identity narrative:
  // adventurous institutions earn press from contemporary work, scholarly from canonical.
  // Middle-of-the-road programs generate no novelty signal regardless.
  const programPrestige = average(works.map(w => w.artisticPrestige))
  const programDraw = average(works.map(w => w.audienceDraw))
  const programNovelty = average(works.map(w => w.novelty))
  const noveltyBuzz =
    programNovelty > 50
      ? ((programNovelty - 50) / 50) * (institution.identity.adventurous / 100)
      : ((50 - programNovelty) / 50) * (institution.identity.scholarly / 100)
  const P =
    0.50 * (programPrestige / 100) +
    0.35 * (programDraw / 100) +
    0.15 * noveltyBuzz

  // Signal 5: Marketing Awareness
  // Reuses the existing logarithmic spend curve, normalized to 0–1.
  // Marketing raises the floor but cannot replicate organic buzz.
  const spendReach =
    program.marketingSpend <= 0 ? 0 : clamp(Math.log1p(program.marketingSpend / 3500), 0, 3.2)
  const M = spendReach / 3.2

  // Core buzz is multiplicative: reputation AND audience anticipation must coexist
  const coreBuzz = I * A
  // Donors add social network lift independently of the core signal
  const donorLift = D * 0.40
  // Program amplifies or slightly dampens the combined signal (0.75–1.25 range)
  const programAmp = 0.75 + P * 0.50
  // Marketing provides a floor contribution even without organic buzz
  const marketingContrib = M * 0.25
  // Small inherent floor: any opening night carries baseline first-concert curiosity
  const INHERENT_FLOOR = 0.05

  const rawBuzz = clamp(
    (coreBuzz + donorLift) * programAmp + marketingContrib + INHERENT_FLOOR,
    0,
    1,
  )

  // Exponential mapping: 0 → 1.0, ~0.5 → 1.73, 1.0 → 3.0
  return Math.exp(rawBuzz * Math.log(3.0))
}

export function updateAudienceAfterConcert({
  audienceState,
  cityAudienceSegments,
  program,
  report,
  works,
  institution,
  donorState,
  isOpeningNight = false,
}: {
  audienceState: AudienceState
  cityAudienceSegments: CityAudienceSegment[]
  program: ConcertProgram
  report: ConcertReport
  works: Work[]
  institution?: InstitutionState
  donorState?: DonorState
  isOpeningNight?: boolean
}): AudienceState {
  const resolvedInstitution: InstitutionState = institution ?? {
    name: '',
    city: '',
    seasonLabel: '',
    cash: 0,
    artisticReputation: 50,
    audienceTrust: 50,
    donorConfidence: 50,
    musicianMorale: 50,
    technicalQuality: 50,
    identity: { adventurous: 33, communityFocused: 33, scholarly: 33 },
  }
  const openingMultiplier = isOpeningNight
    ? computeOpeningNightMultiplier({
        institution: resolvedInstitution,
        audienceState,
        donorState,
        cityAudienceSegments,
        program,
        works,
      })
    : 1
  const attendanceBySegment = new Map(report.audienceBreakdown.map(row => [row.segmentId, row]))
  const marketingImpact = computeMarketingImpact({
    segments: cityAudienceSegments,
    audienceState,
    institution: resolvedInstitution,
    program,
    programPrestige: average(works.map(work => work.artisticPrestige)),
    programNovelty: average(works.map(work => work.novelty)),
    programIdentityValue: average(works.map(work => work.identityValue)),
  })

  return {
    relationships: cityAudienceSegments.map(segment => {
      const current = audienceState.relationships.find(row => row.segmentId === segment.id) ?? {
        segmentId: segment.id,
        awareness: 0,
        trust: 5,
        habit: 0,
        alignmentMemory: 0,
        recentReaction: '',
        lastDelta: 0,
      }
      const fit = segmentProgramFit(segment, works, program)
      const row = attendanceBySegment.get(segment.id)
      const segmentReach = row ? clamp((row.attendance / Math.max(1, segment.size)) * 100, 0, 100) : 0
      const experience = clamp(fit * 0.5 + report.audienceResponse * 0.35 + report.performanceQuality * 0.15, 0, 100)
      const score = experience - 50
      const delta = clamp(score / 12 + segmentReach / 18, -8, 8) * openingMultiplier
      const memory = clamp(current.alignmentMemory * 0.72 + score * 0.28 * openingMultiplier, -100, 100)
      const segmentMarketing = marketingImpact.bySegment.find(impact => impact.segmentId === segment.id)
      const awareness = clamp(
        current.awareness + (segmentMarketing?.awarenessLift ?? 0) * openingMultiplier + segmentReach * 0.12,
        0,
        100,
      )
      const trust = clamp(current.trust + delta * 0.65, 0, 100)
      const habit = clamp(
        current.habit + Math.max(-2.5, delta * 0.32) + (row && row.attendance > 0 ? segmentReach * 0.04 : 0),
        0,
        100,
      )

      return {
        segmentId: segment.id,
        awareness: Math.round(awareness),
        trust: Math.round(trust),
        habit: Math.round(habit),
        alignmentMemory: Math.round(memory),
        recentReaction: reactionText(segment, delta, fit),
        lastDelta: Math.round(delta),
      }
    }),
  }
}
