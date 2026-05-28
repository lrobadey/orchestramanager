import {
  AudienceState,
  CityAudienceSegment,
  ConcertProgram,
  ConcertReport,
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

export function updateAudienceAfterConcert({
  audienceState,
  cityAudienceSegments,
  program,
  report,
  works,
  institution,
  isOpeningNight = false,
}: {
  audienceState: AudienceState
  cityAudienceSegments: CityAudienceSegment[]
  program: ConcertProgram
  report: ConcertReport
  works: Work[]
  institution?: InstitutionState
  isOpeningNight?: boolean
}): AudienceState {
  const openingMultiplier = isOpeningNight ? 1.8 : 1
  const attendanceBySegment = new Map(report.audienceBreakdown.map(row => [row.segmentId, row]))
  const marketingImpact = computeMarketingImpact({
    segments: cityAudienceSegments,
    audienceState,
    institution: institution ?? {
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
    },
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
