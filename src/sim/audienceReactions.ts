import {
  AudienceState,
  CityAudienceSegment,
  ConcertProgram,
  ConcertReport,
  MarketingStyle,
  Work,
} from '../types/core'
import { average, clamp } from './scoring'

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

function marketingAwarenessGain(segment: CityAudienceSegment, program: ConcertProgram, openingMultiplier: number): number {
  const style: MarketingStyle = program.marketingStyle ?? 'digital'
  const base = Math.log(program.marketingSpend / 1000 + 1) * 1.8
  const weights: Record<string, number> = {
    'classical-core': style === 'prestige' || style === 'critical' ? 1.25 : style === 'education' ? 0.55 : 0.75,
    'new-music-public': style === 'critical' ? 1.35 : style === 'digital' ? 1.1 : 0.75,
    'cultural-omnivores': style === 'digital' ? 1.3 : style === 'critical' ? 1.05 : 0.85,
    'students-emerging-artists': style === 'education' || style === 'grassroots' ? 1.4 : style === 'digital' ? 1.15 : 0.65,
    'civic-tech-professionals': style === 'prestige' ? 1.35 : style === 'digital' ? 1.0 : 0.7,
    'community-neighborhood-public': style === 'grassroots' ? 1.45 : style === 'education' ? 1.2 : 0.55,
  }
  return base * (weights[segment.id] ?? 1) * (0.65 + segment.socialSpread / 180) * openingMultiplier
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
  isOpeningNight = false,
}: {
  audienceState: AudienceState
  cityAudienceSegments: CityAudienceSegment[]
  program: ConcertProgram
  report: ConcertReport
  works: Work[]
  isOpeningNight?: boolean
}): AudienceState {
  const openingMultiplier = isOpeningNight ? 1.8 : 1
  const attendanceBySegment = new Map(report.audienceBreakdown.map(row => [row.segmentId, row]))

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
      const awareness = clamp(
        current.awareness + marketingAwarenessGain(segment, program, openingMultiplier) + segmentReach * 0.12,
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
