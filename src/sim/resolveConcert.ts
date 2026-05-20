import {
  ConcertReport,
  SectionOutcome,
  InstitutionalDeltas,
  AudienceBreakdown,
  ExpenseBreakdown,
  Work,
} from '../types/core'
import { ForecastInput, forecastProgram } from './forecastProgram'
import { calculateRosterChangesAfterConcert } from './roster'
import { clamp, average, HALL_CAPACITY, computeDonorUplift } from './scoring'

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

    return { section, label: sectionLabel(section), quality: Math.round(quality), note }
  })
}

function buildNotableMoments(
  sectionOutcomes: SectionOutcome[],
  performanceQuality: number,
  programNovelty: number,
  rehearsalPressure: number,
  perWorkRehearsalPressure: (number | null)[],
  perWorkArcDamage: (number | null)[],
  works: Work[],
  memoryAnchorWork: Work | null,
): string[] {
  const moments: string[] = []

  const weakest = [...sectionOutcomes].sort((a, b) => a.quality - b.quality)[0]
  const strongest = [...sectionOutcomes].sort((a, b) => b.quality - a.quality)[0]
  const anchorTitle = memoryAnchorWork?.title ?? works[works.length - 1]?.title ?? 'the final work'

  if (weakest.quality < 35)
    moments.push(`${weakest.label} faltered in the exposed passages of ${anchorTitle}.`)
  if (strongest.quality > 82)
    moments.push(`${strongest.label} delivered the strongest playing of the evening.`)

  if (rehearsalPressure > 30) {
    let worstIdx = 0
    let worstScore = -Infinity
    for (let i = 0; i < perWorkRehearsalPressure.length; i++) {
      const pressure = perWorkRehearsalPressure[i]
      const arcDamage = perWorkArcDamage[i]
      if (pressure !== null && arcDamage !== null) {
        const score = pressure * 0.5 + arcDamage * 0.5
        if (score > worstScore) {
          worstScore = score
          worstIdx = i
        }
      }
    }
    moments.push(`${works[worstIdx].title} became the perceptual weak point of the program — ensemble coordination was uneven.`)
  }

  if (memoryAnchorWork && memoryAnchorWork.id !== works[works.length - 1]?.id) {
    const anchorIdx = works.findIndex(w => w.id === memoryAnchorWork.id)
    const anchorDamage = anchorIdx >= 0 ? (perWorkArcDamage[anchorIdx] ?? 0) : 0
    if (anchorDamage > 20) {
      moments.push(`${memoryAnchorWork.title} became the evening's memory anchor despite not closing the program.`)
    }
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

function resolveAudienceBreakdown(
  projectedBreakdown: AudienceBreakdown[],
  variance: number,
): AudienceBreakdown[] {
  const resolved = projectedBreakdown.map(row => {
    const attendance = Math.round(clamp(row.attendance * (1 + variance * 0.15), 0, 2000))
    return {
      ...row,
      attendance,
      shareOfHouse: 0,
      ticketRevenue: attendance * row.effectiveTicketPrice,
    }
  })

  const totalAttendance = resolved.reduce((sum, row) => sum + row.attendance, 0)
  return resolved.map(row => ({
    ...row,
    shareOfHouse: totalAttendance > 0 ? row.attendance / totalAttendance : 0,
  }))
}

function prestigeWeightedArcDamage(works: Work[], perWorkArcDamage: (number | null)[]): number {
  const weighted = works.map((work, index) => {
    const damage = perWorkArcDamage[index] ?? 0
    return damage * (0.75 + (work.artisticPrestige / 100) * 0.5)
  })
  return average(weighted)
}

function fmt$(n: number): string {
  return `$${Math.round(Math.abs(n)).toLocaleString()}`
}

function buildFinancialNotes(
  revenue: number,
  donorUplift: number,
  expenses: number,
  net: number,
  attendance: number,
  audienceBreakdown: AudienceBreakdown[],
  expenseBreakdown: ExpenseBreakdown,
): string[] {
  const notes: string[] = []
  const totalIncome = revenue + donorUplift
  const coveragePercent = expenses > 0 ? Math.round((totalIncome / expenses) * 100) : 100

  if (net < 0) {
    const { rehearsal, marketing, production } = expenseBreakdown
    const drivers: [string, number][] = [
      ['high rehearsal overhead', rehearsal],
      ['marketing spend', marketing],
      ['production costs', production],
    ]
    const [driverName] = drivers.sort((a, b) => b[1] - a[1])[0]
    notes.push(
      `Income of ${fmt$(totalIncome)} covered ${coveragePercent}% of costs — the shortfall came primarily from ${driverName}.`,
    )
  } else if (net > 5_000) {
    const attendanceRate = attendance / HALL_CAPACITY
    const driver =
      attendanceRate > 0.75 ? 'strong attendance' :
      expenseBreakdown.marketing < 10_000 ? 'efficient production' :
      'premium pricing'
    notes.push(`The concert returned a surplus of ${fmt$(net)} — ${driver} drove the result.`)
  }

  const seasonedRow = audienceBreakdown.find(r => r.segmentId === 'seasoned-supporters')
  if (seasonedRow && seasonedRow.shareOfHouse > 0.45) {
    const pct = Math.round(seasonedRow.shareOfHouse * 100)
    notes.push(`Seasoned Supporters made up ${pct}% of the house — their loyalty carried the evening financially.`)
  }

  return notes.slice(0, 2)
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
  const memoryAnchorWork = forecast.memoryAnchorWorkId
    ? works.find(work => work.id === forecast.memoryAnchorWorkId) ?? null
    : null

  // Performance quality: institution quality + variance swing, now using arc salience
  // as the public-perception layer over raw rehearsal pressure.
  const baseQuality =
    clamp(
      input.institution.technicalQuality +
        input.institution.musicianMorale * 0.15 -
        Math.max(0, forecast.rehearsalPressure) * 0.32 -
        forecast.arcPerceivedDamage * 0.18 -
        average(Object.values(forecast.sectionStress)) * 0.25,
      0,
      100,
    )
  const performanceQuality = Math.round(clamp(baseQuality + variance * 12, 0, 100))

  const audienceBreakdown = resolveAudienceBreakdown(
    forecast.projectedAudienceBreakdown,
    variance,
  )
  const attendance = audienceBreakdown.reduce((sum, row) => sum + row.attendance, 0)
  const revenue = audienceBreakdown.reduce((sum, row) => sum + row.ticketRevenue, 0)
  const donorUplift = computeDonorUplift(input.institution.donorConfidence)
  const expenses = forecast.projectedExpenses
  const expenseBreakdown = forecast.projectedExpenseBreakdown
  const net = revenue + donorUplift - expenses

  // Audience response: draw and quality still matter, but arc damage captures
  // where the failure occurred in the evening.
  const audienceResponse = Math.round(
    clamp(
      forecast.audienceFit * 0.55 + performanceQuality * 0.35 - forecast.arcPerceivedDamage * 0.1,
      0,
      100,
    ),
  )

  // Critic response: prestige-seekers; quality, novelty, and prestige-weighted
  // failures all matter.
  const programPrestige = average(works.map(w => w.artisticPrestige))
  const programNovelty = average(works.map(w => w.novelty))
  const criticArcPenalty = prestigeWeightedArcDamage(works, forecast.perWorkArcDamage) * 0.1
  const criticResponse = Math.round(
    clamp(
      performanceQuality * 0.45 + programPrestige * 0.3 + programNovelty * 0.2 - criticArcPenalty,
      0,
      100,
    ),
  )

  const sectionOutcomes = resolveSectionOutcomes(forecast.sectionStress, performanceQuality)
  const rosterChanges = calculateRosterChangesAfterConcert(
    input.principals,
    sectionOutcomes,
    performanceQuality,
  )
  const notableMoments = buildNotableMoments(
    sectionOutcomes,
    performanceQuality,
    programNovelty,
    forecast.rehearsalPressure,
    forecast.perWorkRehearsalPressure,
    forecast.perWorkArcDamage,
    works,
    memoryAnchorWork,
  )

  // Institutional deltas
  const reputationDelta = Math.round(
    clamp((performanceQuality - 50) * 0.3 + (criticResponse - 50) * 0.2, -15, 15),
  )
  const seasonedRow = audienceBreakdown.find(r => r.segmentId === 'seasoned-supporters')
  const seasonedShare = seasonedRow?.shareOfHouse ?? 0.2
  const trustDelta = Math.round(clamp((audienceResponse - 50) * 0.2 + (seasonedShare - 0.25) * 10, -10, 10))
  const attendanceRate = attendance / HALL_CAPACITY
  const donorDelta = Math.round(clamp(
    (forecast.donorResponse - 50) * 0.25
    + (programPrestige - 50) * 0.1
    + (attendanceRate - 0.5) * 8
    + (net > 0 ? Math.min(net / 5_000, 4) : Math.max(net / 5_000, -6))
    - programNovelty * 0.05,
    -15, 15,
  ))
  const moraleDelta = Math.round(clamp((performanceQuality - 50) * 0.2, -8, 8))
  const qualityDelta = performanceQuality > 70 ? 2 : performanceQuality < 40 ? -1 : 0

  const adventurousUpside =
    programNovelty > 50
      ? Math.round(clamp(programNovelty / 30 + Math.max(0, forecast.arcPerceivedUpside - forecast.arcPerceivedDamage) / 40, 1, 5))
      : 0
  const identityDelta =
    adventurousUpside > 0
      ? { adventurous: adventurousUpside }
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

  const financialNotes = buildFinancialNotes(
    revenue, donorUplift, expenses, net, attendance, audienceBreakdown, expenseBreakdown,
  )

  return {
    attendance,
    revenue,
    donorUplift,
    audienceBreakdown,
    expenses,
    expenseBreakdown,
    net,
    financialNotes,
    performanceQuality,
    audienceResponse,
    criticResponse,
    memoryAnchorWorkId: forecast.memoryAnchorWorkId,
    sectionOutcomes,
    rosterChanges,
    notableMoments,
    institutionalDeltas,
  }
}
