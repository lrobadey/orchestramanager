import {
  Work,
  Principal,
  AudienceSegment,
  InstitutionState,
  ConcertProgram,
  ConcertForecast,
  SlotTuple,
  TOTAL_REHEARSAL_HOURS,
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

export interface ForecastInput {
  works: Work[]
  institution: InstitutionState
  principals: Principal[]
  audienceSegments: AudienceSegment[]
  program: ConcertProgram
}

function resolveSlotWorks(input: ForecastInput): SlotTuple<Work | null> {
  return input.program.workIds.map(id => {
    if (id === null) return null
    const w = input.works.find(w => w.id === id)
    if (!w) throw new Error(`Work not found: ${id}`)
    return w
  }) as SlotTuple<Work | null>
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
  novelty: number,
  ticketPrice: number,
): number {
  let total = 0
  for (const seg of segments) {
    const canonScore = 100 - novelty
    const contemporaryScore = novelty
    const tasteMatch =
      (seg.canonAffinity * (canonScore / 100) +
        seg.contemporaryAffinity * (contemporaryScore / 100) +
        seg.prestigeAffinity * (prestige / 100)) /
      3
    const segPricePenalty =
      ticketPrice > 60
        ? ((ticketPrice - 60) / 120) * (seg.priceSensitivity / 100) * 30
        : 0
    const interestRate = clamp((tasteMatch + adjustedDraw) / 2 - segPricePenalty, 0, 100) / 100
    total += seg.size * (seg.loyalty / 100) * interestRate
  }
  return Math.round(total)
}

function buildForecastNotes(
  slotWorks: SlotTuple<Work | null>,
  perWorkPressure: SlotTuple<number | null>,
  rehearsalPressure: number,
  sectionStress: ConcertForecast['sectionStress'],
  donorResponse: number,
  projectedNet: number,
  programNovelty: number,
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

function emptyForecast(message: string): ConcertForecast {
  return {
    projectedAttendance: 0,
    projectedRevenue: 0,
    projectedExpenses: 0,
    projectedNet: 0,
    performanceRisk: 0,
    rehearsalPressure: 0,
    audienceFit: 0,
    donorResponse: 0,
    identityImpact: 0,
    sectionStress: { strings: 0, winds: 0, brass: 0, percussion: 0 },
    perWorkRehearsalDivisor: [null, null, null],
    perWorkRehearsalPressure: [null, null, null],
    perWorkRehearsalHoursNeeded: [null, null, null],
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
  const filled = slotWorks.filter((w): w is Work => w !== null)

  if (filled.length === 0) {
    return emptyForecast('Drag pieces into the program to see the forecast take shape.')
  }
  if (filled.length < 3) {
    const remaining = 3 - filled.length
    return emptyForecast(
      `Add ${remaining} more piece${remaining === 1 ? '' : 's'} to see the full forecast.`,
    )
  }

  const works = filled
  const { institution, principals, audienceSegments, program } = input

  const programDraw = average(works.map(w => w.audienceDraw))
  const programPrestige = average(works.map(w => w.artisticPrestige))
  const programNovelty = average(works.map(w => w.novelty))
  const programDonorComfort = average(works.map(w => w.donorComfort))
  const programIdentityValue = average(works.map(w => w.identityValue))

  const marketingBoost = marketingEffect(program.marketingSpend)
  const pricePen = pricePenalty(program.ticketPrice)
  const adjustedDraw = clamp(programDraw + marketingBoost - pricePen, 0, 100)

  // Per-piece rehearsal pressure: each slot's piece compared against its own allocation
  const perWorkRehearsalDivisor = slotWorks.map(work =>
    work ? computeRehearsalDivisor(work, principals) : null,
  ) as SlotTuple<number | null>
  const perWorkRehearsalHoursNeeded = slotWorks.map((work, i) =>
    work ? rehearsalHoursNeeded(work.rehearsalLoad, perWorkRehearsalDivisor[i]!) : null,
  ) as SlotTuple<number | null>
  const perWorkRehearsalHoursAllocated = slotWorks.map((work, i) =>
    work ? program.rehearsalAllocation[i] : null,
  ) as SlotTuple<number | null>
  const perWorkRehearsalPressure = slotWorks.map((work, i) => {
    if (!work) return null
    return pressureFromHoursGap(
      perWorkRehearsalHoursNeeded[i]!,
      perWorkRehearsalHoursAllocated[i]!,
    )
  }) as SlotTuple<number | null>

  // Aggregate pressure: the weakest-prepared piece dominates the evening
  const validPressures = perWorkRehearsalPressure.filter((p): p is number => p !== null)
  const rehearsalPressure = validPressures.length > 0 ? Math.max(...validPressures) : 0

  const sectionStress = computeSectionStress(works, principals)
  const avgSectionStress = average(Object.values(sectionStress))

  const performanceRisk = clamp(
    Math.max(0, rehearsalPressure) * 0.4 +
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

  const projectedAttendance = computeAttendance(
    audienceSegments,
    adjustedDraw,
    programPrestige,
    programNovelty,
    program.ticketPrice,
  )
  const projectedRevenue = projectedAttendance * program.ticketPrice
  const totalRehearsalHours = program.rehearsalAllocation.reduce((s, h) => s + h, 0)
  const projectedExpenses =
    BASE_CONCERT_COST + totalRehearsalHours * REHEARSAL_COST_PER_HOUR + program.marketingSpend
  const projectedNet = projectedRevenue - projectedExpenses

  const donorResponse = clamp(programDonorComfort - programNovelty * 0.3, 0, 100)

  const forecastNotes = buildForecastNotes(
    slotWorks,
    perWorkRehearsalPressure,
    rehearsalPressure,
    sectionStress,
    donorResponse,
    projectedNet,
    programNovelty,
  )

  return {
    projectedAttendance,
    projectedRevenue,
    projectedExpenses,
    projectedNet,
    performanceRisk,
    rehearsalPressure,
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
