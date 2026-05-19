import {
  Work,
  Principal,
  AudienceSegment,
  InstitutionState,
  ConcertProgram,
  ConcertForecast,
  AudienceBreakdown,
  SlotTuple,
  TOTAL_REHEARSAL_HOURS,
  ProgramArcSalienceResult,
} from '../types/core'
import {
  clamp,
  average,
  computeRehearsalDivisor,
  marketingEffect,
  pricePenalty,
  rehearsalHoursNeeded,
  pressureFromHoursGap,
  REHEARSAL_COST_PER_HOUR,
  BASE_CONCERT_COST,
} from './scoring'
import { computeProgramArcSalience } from './programArcSalience'

const EMPTY_ARC_SALIENCE: ProgramArcSalienceResult = {
  perWork: [],
  aggregatePerceivedDamage: 0,
  aggregatePerceivedUpside: 0,
  memoryAnchorWorkId: null,
  notes: [],
}

export interface ForecastInput {
  works: Work[]
  institution: InstitutionState
  principals: Principal[]
  audienceSegments: AudienceSegment[]
  program: ConcertProgram
}

function resolveSlotWorks(input: ForecastInput): SlotTuple<Work | null> {
  return input.program.workIds.map((id, i) => {
    if (i >= input.program.workCount || id === null) return null
    const w = input.works.find(w => w.id === id)
    if (!w) throw new Error(`Work not found: ${id}`)
    return w
  }) as SlotTuple<Work | null>
}

function activeSlotWorks(slotWorks: SlotTuple<Work | null>, program: ConcertProgram): Work[] {
  return slotWorks
    .slice(0, program.workCount)
    .filter((w): w is Work => w !== null)
}

function computeSectionStress(
  works: Work[],
  principals: Principal[],
): ConcertForecast['sectionStress'] {
  const sections = ['strings', 'winds', 'brass', 'percussion'] as const

  const result = {} as ConcertForecast['sectionStress']
  for (const section of sections) {
    const maxDemand = works.length > 0 ? Math.max(...works.map(w => w.demands[section])) : 0
    const sectionPrincipals = principals.filter(p => p.section === section)
    const principalStrength =
      sectionPrincipals.length > 0
        ? average(sectionPrincipals.map(p => (p.overall + p.stressResistance) / 2))
        : 50
    result[section] = clamp(maxDemand - principalStrength + 5, 0, 100)
  }
  return result
}

function computeAttendance(
  segments: AudienceSegment[],
  adjustedDraw: number,
  prestige: number,
  donorComfort: number,
  novelty: number,
  program: ConcertProgram,
): AudienceBreakdown[] {
  const prestigeSignal = Math.max(prestige, donorComfort)
  const donorPrestigeLift = program.ticketPrice > 80 && prestigeSignal > 70
    ? clamp(((program.ticketPrice - 80) / 80) * ((prestigeSignal - 70) / 30) * 8, 0, 6)
    : 0

  const breakdown = segments.map(seg => {
    const effectiveTicketPrice =
      seg.id === 'students-educators' && program.studentTicketsEnabled
        ? program.studentTicketPrice
        : program.ticketPrice
    const canonScore = 100 - novelty
    const contemporaryScore = novelty
    const tasteMatch =
      (seg.canonAffinity * (canonScore / 100) +
        seg.contemporaryAffinity * (contemporaryScore / 100) +
        seg.prestigeAffinity * (prestige / 100)) /
      3
    const priceAccessibilityScore = priceAccessibilityForSegment(seg, effectiveTicketPrice)
    const prestigeLift = donorPrestigeLiftForSegment(seg.id, donorPrestigeLift)
    const interestRate =
      clamp((tasteMatch + adjustedDraw) / 2 + prestigeLift, 0, 100) / 100
    const attendance =
      seg.size * (seg.loyalty / 100) * interestRate * (priceAccessibilityScore / 100)

    return {
      segmentId: seg.id,
      segmentName: seg.name,
      attendance: Math.round(attendance),
      shareOfHouse: 0,
      effectiveTicketPrice,
      ticketRevenue: Math.round(attendance) * effectiveTicketPrice,
      priceAccessibilityScore: Math.round(priceAccessibilityScore),
    }
  })

  return withHouseShares(breakdown)
}

function priceAccessibilityForSegment(segment: AudienceSegment, ticketPrice: number): number {
  let penalty = 0

  if (segment.id === 'students-educators') {
    penalty = ticketPrice <= 25 ? 0 : Math.pow((ticketPrice - 25) / 45, 1.35) * 55
  } else if (segment.id === 'young-professionals') {
    penalty = ticketPrice <= 45 ? 0 : Math.pow((ticketPrice - 45) / 55, 1.25) * 38
  } else if (segment.id === 'cultural-explorers') {
    penalty = ticketPrice <= 60 ? 0 : Math.pow((ticketPrice - 60) / 70, 1.1) * 24
  } else if (segment.id === 'seasoned-supporters') {
    penalty = ticketPrice <= 65 ? 0 : ((ticketPrice - 65) / 90) * 18
  } else if (segment.id === 'donors-patrons') {
    penalty = ticketPrice <= 95 ? 0 : ((ticketPrice - 95) / 120) * 8
  } else {
    penalty =
      ticketPrice > 60
        ? ((ticketPrice - 60) / 120) * (segment.priceSensitivity / 100) * 30
        : 0
  }

  return clamp(100 - penalty, 20, 100)
}

function donorPrestigeLiftForSegment(segmentId: string, lift: number): number {
  if (segmentId === 'donors-patrons') return lift
  if (segmentId === 'seasoned-supporters') return lift * 0.45
  return 0
}

function withHouseShares(breakdown: AudienceBreakdown[]): AudienceBreakdown[] {
  const totalAttendance = breakdown.reduce((sum, row) => sum + row.attendance, 0)
  return breakdown.map(row => ({
    ...row,
    shareOfHouse: totalAttendance > 0 ? row.attendance / totalAttendance : 0,
  }))
}

function buildForecastNotes(
  slotWorks: SlotTuple<Work | null>,
  perWorkPressure: SlotTuple<number | null>,
  rehearsalPressure: number,
  sectionStress: ConcertForecast['sectionStress'],
  donorResponse: number,
  projectedNet: number,
  programNovelty: number,
  arcNotes: string[],
): string[] {
  const notes: string[] = []

  const filled = slotWorks.filter((w): w is Work => w !== null)

  for (let i = 0; i < slotWorks.length; i++) {
    const work = slotWorks[i]
    const pressure = perWorkPressure[i]
    if (work && pressure !== null && pressure > 25) {
      notes.push(
        `${work.title} is dangerously under-rehearsed — performance risk is high.`,
      )
    }
  }

  if (notes.length === 0 && rehearsalPressure < -10)
    notes.push('Well-prepared program — rehearsal surplus should stabilize performance quality.')

  notes.push(...arcNotes)

  if (sectionStress.brass > 55)
    notes.push('Brass section will face significant exposed passages; principal reliability is critical.')
  if (sectionStress.winds > 55)
    notes.push('Wind soloists carry heavy exposure in this program; intonation risk is notable.')
  if (sectionStress.strings > 60)
    notes.push('String demands are high — endurance and blend will be tested in the second half.')
  if (sectionStress.percussion > 60)
    notes.push('Percussion complexity is substantial; rhythmic precision will drive the outcome.')

  if (programNovelty > 65)
    notes.push('Contemporary programming may fragment the traditional subscriber base.')
  if (donorResponse < 35)
    notes.push('Donor comfort is low — this program may cool major-gift conversations.')
  if (projectedNet < 0)
    notes.push(`Program is projected to run a deficit of $${Math.abs(Math.round(projectedNet)).toLocaleString()}.`)
  else if (projectedNet > 20_000)
    notes.push(`Strong projected surplus of $${Math.round(projectedNet).toLocaleString()}.`)

  const contemporaryCount = filled.filter(w => w.isContemporary).length
  if (contemporaryCount >= 2)
    notes.push('Two or more contemporary works signal a bold institutional identity statement.')

  return notes.slice(0, 4)
}

function emptyForecast(
  message: string,
  perWorkRehearsalDivisor: SlotTuple<number | null> = [null, null, null],
  perWorkRehearsalHoursNeeded: SlotTuple<number | null> = [null, null, null],
): ConcertForecast {
  const arcSalience = EMPTY_ARC_SALIENCE
  return {
    projectedAttendance: 0,
    projectedRevenue: 0,
    projectedAudienceBreakdown: [],
    projectedExpenses: 0,
    projectedNet: 0,
    performanceRisk: 0,
    rehearsalPressure: 0,
    arcSalience,
    arcPerceivedDamage: 0,
    arcPerceivedUpside: 0,
    perWorkArcDamage: [null, null, null],
    memoryAnchorWorkId: null,
    audienceFit: 0,
    donorResponse: 0,
    identityImpact: 0,
    sectionStress: { strings: 0, winds: 0, brass: 0, percussion: 0 },
    perWorkRehearsalDivisor,
    perWorkRehearsalPressure: [null, null, null],
    perWorkRehearsalHoursNeeded,
    perWorkRehearsalHoursAllocated: [null, null, null],
    perWorkPerformanceRisk: [null, null, null],
    forecastNotes: [message],
    isComplete: false,
  }
}

export function forecastProgram(input: ForecastInput): ConcertForecast {
  const allocSum = input.program.rehearsalAllocation.reduce((s, h) => s + h, 0)
  if (allocSum !== TOTAL_REHEARSAL_HOURS) {
    throw new Error(
      `Rehearsal allocation must sum to ${TOTAL_REHEARSAL_HOURS} hours (got ${allocSum}).`,
    )
  }

  const slotWorks = resolveSlotWorks(input)
  const { institution, principals, audienceSegments, program } = input
  const displaySlotWorks = slotWorks.map((work, i) =>
    i < program.workCount ? work : null,
  ) as SlotTuple<Work | null>

  // Compute per-slot divisor and hours needed before any completeness guard so
  // partial programs (1–2 pieces) still show real rehearsal figures in the UI.
  const perWorkRehearsalDivisor = displaySlotWorks.map(work =>
    work ? computeRehearsalDivisor(work, principals) : null,
  ) as SlotTuple<number | null>
  const perWorkRehearsalHoursNeeded = displaySlotWorks.map((work, i) =>
    work ? rehearsalHoursNeeded(work.rehearsalLoad, perWorkRehearsalDivisor[i]!) : null,
  ) as SlotTuple<number | null>

  const filled = activeSlotWorks(displaySlotWorks, program)

  if (filled.length === 0) {
    return emptyForecast(
      'Drag pieces into the program to see the forecast take shape.',
      perWorkRehearsalDivisor,
      perWorkRehearsalHoursNeeded,
    )
  }
  if (filled.length < program.workCount) {
    const remaining = program.workCount - filled.length
    return emptyForecast(
      `Add ${remaining} more piece${remaining === 1 ? '' : 's'} to complete this ${program.workCount}-work program.`,
      perWorkRehearsalDivisor,
      perWorkRehearsalHoursNeeded,
    )
  }

  const works = filled

  const programDraw = average(works.map(w => w.audienceDraw))
  const programPrestige = average(works.map(w => w.artisticPrestige))
  const programNovelty = average(works.map(w => w.novelty))
  const programDonorComfort = average(works.map(w => w.donorComfort))
  const programIdentityValue = average(works.map(w => w.identityValue))

  const marketingBoost = marketingEffect(program.marketingSpend)
  const pricePen = pricePenalty(program.ticketPrice)
  const adjustedDraw = clamp(programDraw + marketingBoost - pricePen, 0, 100)

  // Per-piece rehearsal pressure: each slot's piece compared against its own allocation
  const perWorkRehearsalHoursAllocated = displaySlotWorks.map((work, i) =>
    work ? program.rehearsalAllocation[i] : null,
  ) as SlotTuple<number | null>
  const perWorkRehearsalPressure = displaySlotWorks.map((work, i) => {
    if (!work) return null
    return pressureFromHoursGap(
      perWorkRehearsalHoursNeeded[i]!,
      perWorkRehearsalHoursAllocated[i]!,
    )
  }) as SlotTuple<number | null>

  // Aggregate pressure remains available as the raw weakest-prepared-piece signal.
  const validPressures = perWorkRehearsalPressure.filter((p): p is number => p !== null)
  const rehearsalPressure = validPressures.length > 0 ? Math.max(...validPressures) : 0

  const sectionStress = computeSectionStress(works, principals)
  const avgSectionStress = average(Object.values(sectionStress))

  const performanceRisk = clamp(
    Math.max(0, rehearsalPressure) * 0.3 +
      avgSectionStress * 0.35 -
      institution.technicalQuality * 0.15,
    0,
    100,
  )

  // Per-piece performance risk: same blend but using that slot's pressure only
  const perWorkPerformanceRisk = perWorkRehearsalPressure.map(pressure => {
    if (pressure === null) return null
    return clamp(
      Math.max(0, pressure) * 0.55 +
        avgSectionStress * 0.3 -
        institution.technicalQuality * 0.15,
      0,
      100,
    )
  }) as SlotTuple<number | null>

  const arcSalience = computeProgramArcSalience(
    displaySlotWorks.flatMap((work, slotIndex) => {
      const rehearsalPressure = perWorkRehearsalPressure[slotIndex]
      const performanceRisk = perWorkPerformanceRisk[slotIndex]
      if (!work || rehearsalPressure === null || performanceRisk === null) return []
      return [{
        slotIndex,
        workCount: program.workCount,
        work,
        rehearsalPressure,
        performanceRisk,
      }]
    }),
  )
  const arcPerceivedDamage = arcSalience.aggregatePerceivedDamage
  const arcPerceivedUpside = arcSalience.aggregatePerceivedUpside
  const perWorkArcDamage = displaySlotWorks.map((work, slotIndex) => {
    if (!work) return null
    return arcSalience.perWork.find(salience => salience.slotIndex === slotIndex)?.perceivedDamage ?? null
  }) as SlotTuple<number | null>

  const projectedAudienceBreakdown = computeAttendance(
    audienceSegments,
    adjustedDraw,
    programPrestige,
    programDonorComfort,
    programNovelty,
    program,
  )
  const projectedAttendance = projectedAudienceBreakdown.reduce(
    (sum, row) => sum + row.attendance,
    0,
  )
  const projectedRevenue = projectedAudienceBreakdown.reduce(
    (sum, row) => sum + row.ticketRevenue,
    0,
  )
  const totalRehearsalHours = program.rehearsalAllocation.reduce((s, h) => s + h, 0)
  const projectedExpenses =
    BASE_CONCERT_COST + totalRehearsalHours * REHEARSAL_COST_PER_HOUR + program.marketingSpend
  const projectedNet = projectedRevenue - projectedExpenses

  const donorResponse = clamp(programDonorComfort - programNovelty * 0.3, 0, 100)

  const forecastNotes = buildForecastNotes(
    displaySlotWorks,
    perWorkRehearsalPressure,
    rehearsalPressure,
    sectionStress,
    donorResponse,
    projectedNet,
    programNovelty,
    arcSalience.notes,
  )

  return {
    projectedAttendance,
    projectedRevenue,
    projectedAudienceBreakdown,
    projectedExpenses,
    projectedNet,
    performanceRisk: clamp(performanceRisk + arcPerceivedDamage * 0.12, 0, 100),
    rehearsalPressure,
    arcSalience,
    arcPerceivedDamage,
    arcPerceivedUpside,
    perWorkArcDamage,
    memoryAnchorWorkId: arcSalience.memoryAnchorWorkId,
    audienceFit: adjustedDraw,
    donorResponse,
    identityImpact: programIdentityValue,
    sectionStress,
    perWorkRehearsalDivisor,
    perWorkRehearsalPressure,
    perWorkRehearsalHoursNeeded,
    perWorkRehearsalHoursAllocated,
    perWorkPerformanceRisk,
    forecastNotes,
    isComplete: true,
  }
}
