import {
  AudienceRelationship,
  AudienceSegment,
  AudienceState,
  CityAudienceSegment,
  ConcertProgram,
  InstitutionState,
  MarketingImpact,
  MarketingStyle,
} from '../types/core'
import { clamp } from './scoring'

interface ChannelProfile {
  segmentWeights: Record<string, number>
  awarenessRetention: number
  considerationPower: number
  donorSignal: number
}

const CHANNELS: Record<MarketingStyle, ChannelProfile> = {
  digital: {
    segmentWeights: {
      'classical-core': 0.8,
      'new-music-public': 1.1,
      'cultural-omnivores': 1.35,
      'students-emerging-artists': 1.2,
      'civic-tech-professionals': 1.0,
      'community-neighborhood-public': 0.75,
    },
    awarenessRetention: 0.55,
    considerationPower: 0.45,
    donorSignal: 0.1,
  },
  grassroots: {
    segmentWeights: {
      'classical-core': 0.55,
      'new-music-public': 0.8,
      'cultural-omnivores': 0.85,
      'students-emerging-artists': 1.35,
      'civic-tech-professionals': 0.6,
      'community-neighborhood-public': 1.5,
    },
    awarenessRetention: 0.75,
    considerationPower: 0.35,
    donorSignal: 0.15,
  },
  prestige: {
    segmentWeights: {
      'classical-core': 1.25,
      'new-music-public': 0.8,
      'cultural-omnivores': 0.95,
      'students-emerging-artists': 0.55,
      'civic-tech-professionals': 1.45,
      'community-neighborhood-public': 0.5,
    },
    awarenessRetention: 0.5,
    considerationPower: 0.55,
    donorSignal: 0.75,
  },
  critical: {
    segmentWeights: {
      'classical-core': 1.2,
      'new-music-public': 1.5,
      'cultural-omnivores': 1.0,
      'students-emerging-artists': 0.8,
      'civic-tech-professionals': 0.85,
      'community-neighborhood-public': 0.45,
    },
    awarenessRetention: 0.65,
    considerationPower: 0.5,
    donorSignal: 0.35,
  },
  education: {
    segmentWeights: {
      'classical-core': 0.5,
      'new-music-public': 0.75,
      'cultural-omnivores': 0.75,
      'students-emerging-artists': 1.55,
      'civic-tech-professionals': 0.55,
      'community-neighborhood-public': 1.25,
    },
    awarenessRetention: 0.85,
    considerationPower: 0.25,
    donorSignal: 0.25,
  },
}

function relationshipForSegment(
  segment: CityAudienceSegment | AudienceSegment,
  audienceState: AudienceState | undefined,
): AudienceRelationship {
  const existing = audienceState?.relationships.find(row => row.segmentId === segment.id)
  if (existing) return existing

  const legacyLoyalty = 'loyalty' in segment ? segment.loyalty : 0
  return {
    segmentId: segment.id,
    awareness: 'loyalty' in segment ? 100 : 5,
    trust: 'loyalty' in segment ? legacyLoyalty : 5,
    habit: legacyLoyalty,
    alignmentMemory: 0,
    recentReaction: '',
    lastDelta: 0,
  }
}

function spendReachFactor(spend: number): number {
  if (spend <= 0) return 0
  return clamp(Math.log1p(spend / 3500), 0, 3.2)
}

function campaignProgramFit(
  style: MarketingStyle,
  segment: CityAudienceSegment | AudienceSegment,
  program: ConcertProgram,
  programPrestige: number,
  programNovelty: number,
  programIdentityValue: number,
): number {
  const accessible = clamp((program.studentTicketsEnabled ? 0.18 : 0) + (75 - program.ticketPrice) / 140, -0.2, 0.35)
  const prestigeFit = (programPrestige - 55) / 180
  const noveltyFit = (programNovelty - 50) / 170
  const identityFit = (programIdentityValue - 50) / 200
  const communityFit = (segment.communityAffinity - 50) / 220 + accessible

  const fit =
    style === 'prestige' ? 1 + prestigeFit + identityFit :
    style === 'critical' ? 1 + noveltyFit + prestigeFit * 0.5 :
    style === 'grassroots' ? 1 + communityFit :
    style === 'education' ? 1 + communityFit + (program.studentTicketsEnabled ? 0.12 : -0.08) :
    1 + noveltyFit * 0.35

  return clamp(fit, 0.72, 1.28)
}

export function computeMarketingImpact({
  segments,
  audienceState,
  institution,
  program,
  programPrestige,
  programNovelty,
  programIdentityValue,
}: {
  segments: Array<CityAudienceSegment | AudienceSegment>
  audienceState?: AudienceState
  institution: InstitutionState
  program: ConcertProgram
  programPrestige: number
  programNovelty: number
  programIdentityValue: number
}): MarketingImpact {
  const style = program.marketingStyle ?? 'digital'
  const channel = CHANNELS[style]
  const spendReach = spendReachFactor(program.marketingSpend)
  const reputationCredibility = clamp(0.75 + institution.artisticReputation / 200, 0.75, 1.25)

  const bySegment = segments.map(segment => {
    const rel = relationshipForSegment(segment, audienceState)
    const unknownShare = clamp(1 - rel.awareness / 100, 0.05, 1)
    const messageFit = campaignProgramFit(style, segment, program, programPrestige, programNovelty, programIdentityValue)
    const channelSegmentFit = channel.segmentWeights[segment.id] ?? 0.85
    const socialSpread = clamp(0.75 + segment.socialSpread / 220, 0.75, 1.25)
    const reachPercent = clamp(
      spendReach * channelSegmentFit * messageFit * reputationCredibility * socialSpread * 4.8,
      0,
      45,
    )
    const awarenessLift = reachPercent * unknownShare * channel.awarenessRetention * 0.42
    const awarenessMultiplier = rel.awareness > 0
      ? clamp((rel.awareness + awarenessLift) / rel.awareness, 1, 2.4)
      : 1 + awarenessLift / 10
    const donorPriceSignal = segment.id === 'donors-patrons' && program.ticketPrice > 80
      ? clamp((program.ticketPrice - 80) / 100, 0, 0.08)
      : 0
    const considerationMultiplier = clamp(
      1 + (reachPercent / 100) * channel.considerationPower * messageFit * 0.45 + donorPriceSignal,
      1,
      1.22,
    )

    return {
      segmentId: segment.id,
      reachPercent,
      awarenessLift,
      awarenessMultiplier,
      considerationMultiplier,
      donorSignal: reachPercent * channel.donorSignal * messageFit,
    }
  })

  const totalReach = bySegment.reduce((sum, row) => {
    const segment = segments.find(seg => seg.id === row.segmentId)
    return sum + (segment ? segment.size * (row.reachPercent / 100) : 0)
  }, 0)

  return {
    totalReach: Math.round(totalReach),
    averageAwarenessLift: bySegment.length
      ? bySegment.reduce((sum, row) => sum + row.awarenessLift, 0) / bySegment.length
      : 0,
    averageConsiderationMultiplier: bySegment.length
      ? bySegment.reduce((sum, row) => sum + row.considerationMultiplier, 0) / bySegment.length
      : 1,
    donorSignal: bySegment.reduce((sum, row) => sum + row.donorSignal, 0) / Math.max(1, bySegment.length),
    bySegment,
  }
}
