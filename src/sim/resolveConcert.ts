import {
  ConcertReport,
  SectionOutcome,
  InstitutionalDeltas,
} from '../types/core'
import { ForecastInput, forecastProgram } from './forecastProgram'
import { clamp, average } from './scoring'

// roll: 0-100, where 50 = neutral, <50 = worse than expected, >50 = better
// Pass roll = 50 in tests for deterministic output.
export interface ResolveInput extends ForecastInput {
  roll?: number
}

function sectionLabel(section: string): string {
  const map: Record<string, string> = {
    strings: 'Strings',
    winds: 'Winds',
    brass: 'Brass',
    percussion: 'Percussion',
  }
  return map[section] ?? section
}

function resolveSectionOutcomes(
  sectionStress: Record<string, number>,
  performanceQuality: number,
): SectionOutcome[] {
  const sections = ['strings', 'winds', 'brass', 'percussion'] as const
  return sections.map(section => {
    const stress = sectionStress[section]
    // Quality modulates how well the section handles its stress
    const effectiveStress = clamp(stress - (performanceQuality - 50) * 0.2, 0, 100)

    let quality: number
    let note: string

    if (effectiveStress < 20) {
      quality = clamp(85 + (20 - effectiveStress) * 0.5, 70, 100)
      note = `${sectionLabel(section)} performed cleanly with room to spare.`
    } else if (effectiveStress < 40) {
      quality = clamp(72 - (effectiveStress - 20) * 0.5, 55, 75)
      note = `${sectionLabel(section)} handled the material solidly with minor lapses.`
    } else if (effectiveStress < 60) {
      quality = clamp(58 - (effectiveStress - 40) * 0.6, 35, 60)
      note = `${sectionLabel(section)} showed strain — intonation and blend suffered in exposed passages.`
    } else if (effectiveStress < 80) {
      quality = clamp(40 - (effectiveStress - 60) * 0.5, 15, 40)
      note = `${sectionLabel(section)} struggled visibly; the section could not absorb the full demand.`
    } else {
      quality = clamp(22 - (effectiveStress - 80) * 0.3, 5, 22)
      note = `${sectionLabel(section)} collapsed under pressure — a public failure the audience noticed.`
    }

    return { section: sectionLabel(section), quality: Math.round(quality), note }
  })
}

function buildNotableMoments(
  sectionOutcomes: SectionOutcome[],
  performanceQuality: number,
  programNovelty: number,
  rehearsalPressure: number,
  perWorkRehearsalPressure: (number | null)[],
  workTitles: string[],
): string[] {
  const moments: string[] = []

  const weakest = [...sectionOutcomes].sort((a, b) => a.quality - b.quality)[0]
  const strongest = [...sectionOutcomes].sort((a, b) => b.quality - a.quality)[0]

  if (weakest.quality < 35)
    moments.push(`${weakest.section} faltered in the exposed passages of ${workTitles[workTitles.length - 1]}.`)
  if (strongest.quality > 82)
    moments.push(`${strongest.section} delivered the strongest playing of the evening.`)

  if (rehearsalPressure > 30) {
    let worstIdx = 0
    let worstPressure = -Infinity
    for (let i = 0; i < perWorkRehearsalPressure.length; i++) {
      const p = perWorkRehearsalPressure[i]
      if (p !== null && p > worstPressure) {
        worstPressure = p
        worstIdx = i
      }
    }
    moments.push(`${workTitles[worstIdx]} showed signs of under-preparation — ensemble coordination was uneven.`)
  }

  if (programNovelty > 65 && performanceQuality > 60)
    moments.push('Critics took note of the adventurous programming; early reviews signal genuine interest.')
  else if (programNovelty > 65 && performanceQuality <= 60)
    moments.push('The contemporary work drew curiosity but the execution undermined the effect.')

  if (performanceQuality > 75)
    moments.push('A strong overall performance — the orchestra made a credible case for itself.')
  else if (performanceQuality < 40)
    moments.push('The evening as a whole left the audience and critics with doubts about institutional readiness.')

  if (moments.length === 0)
    moments.push('The concert proceeded without notable incident — a competent, unremarkable evening.')

  return moments.slice(0, 4)
}

export function resolveConcert(input: ResolveInput): ConcertReport {
  const roll = input.roll ?? 50
  // Variance factor: -1 to +1 centered on 0 at roll=50
  const variance = (roll - 50) / 50

  const forecast = forecastProgram(input)
  if (!forecast.isComplete) {
    throw new Error('Cannot resolve concert: program is incomplete (empty slots).')
  }
  const works = input.program.workIds.slice(0, input.program.workCount).map(id => {
    if (id === null) throw new Error('Cannot resolve concert: empty slot.')
    const w = input.works.find(w => w.id === id)
    if (!w) throw new Error(`Work not found: ${id}`)
    return w
  })

  // Performance quality: institution quality + variance swing
  const baseQuality =
    clamp(
      input.institution.technicalQuality +
        input.institution.musicianMorale * 0.15 -
        Math.max(0, forecast.rehearsalPressure) * 0.4 -
        average(Object.values(forecast.sectionStress)) * 0.25,
      0,
      100,
    )
  const performanceQuality = Math.round(clamp(baseQuality + variance * 12, 0, 100))

  // Attendance: forecast with variance
  const attendance = Math.round(
    clamp(forecast.projectedAttendance * (1 + variance * 0.15), 0, 2000),
  )
  const revenue = attendance * input.program.ticketPrice
  const expenses = forecast.projectedExpenses
  const net = revenue - expenses

  // Audience response: draw adjusted by actual performance
  const audienceResponse = Math.round(
    clamp(forecast.audienceFit * 0.6 + performanceQuality * 0.4, 0, 100),
  )

  // Critic response: prestige-seekers; quality and novelty both matter
  const programPrestige = average(works.map(w => w.artisticPrestige))
  const programNovelty = average(works.map(w => w.novelty))
  const criticResponse = Math.round(
    clamp(
      performanceQuality * 0.5 + programPrestige * 0.3 + programNovelty * 0.2,
      0,
      100,
    ),
  )

  const sectionOutcomes = resolveSectionOutcomes(forecast.sectionStress, performanceQuality)
  const notableMoments = buildNotableMoments(
    sectionOutcomes,
    performanceQuality,
    programNovelty,
    forecast.rehearsalPressure,
    forecast.perWorkRehearsalPressure,
    works.map(w => w.title),
  )

  // Institutional deltas
  const reputationDelta = Math.round(
    clamp((performanceQuality - 50) * 0.3 + (criticResponse - 50) * 0.2, -15, 15),
  )
  const trustDelta = Math.round(clamp((audienceResponse - 50) * 0.25, -10, 10))
  const donorDelta = Math.round(clamp((forecast.donorResponse - 50) * 0.2 + (net > 0 ? 3 : -3), -12, 12))
  const moraleDelta = Math.round(clamp((performanceQuality - 50) * 0.2, -8, 8))
  const qualityDelta = performanceQuality > 70 ? 2 : performanceQuality < 40 ? -1 : 0

  const identityDelta =
    programNovelty > 50
      ? { adventurous: Math.round(programNovelty / 25) }
      : programPrestige > 75
        ? { scholarly: 1 }
        : {}

  const institutionalDeltas: InstitutionalDeltas = {
    cash: Math.round(net),
    artisticReputation: reputationDelta,
    audienceTrust: trustDelta,
    donorConfidence: donorDelta,
    musicianMorale: moraleDelta,
    technicalQuality: qualityDelta,
    identity: identityDelta,
  }

  return {
    attendance,
    revenue,
    expenses,
    net,
    performanceQuality,
    audienceResponse,
    criticResponse,
    sectionOutcomes,
    notableMoments,
    institutionalDeltas,
  }
}
