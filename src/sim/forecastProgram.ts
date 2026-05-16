import {
  Work,
  Principal,
  AudienceSegment,
  InstitutionState,
  ConcertProgram,
  ConcertForecast,
} from '../types/core'
import {
  clamp,
  average,
  sum,
  marketingEffect,
  pricePenalty,
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

function selectedWorks(input: ForecastInput): Work[] {
  return input.program.workIds.map(id => {
    const w = input.works.find(w => w.id === id)
    if (!w) throw new Error(`Work not found: ${id}`)
    return w
  })
}

function computeSectionStress(
  works: Work[],
  principals: Principal[],
): ConcertForecast['sectionStress'] {
  const sections = ['strings', 'winds', 'brass', 'percussion'] as const

  const result = {} as ConcertForecast['sectionStress']
  for (const section of sections) {
    const maxDemand = Math.max(...works.map(w => w.demands[section]))
    const sectionPrincipals = principals.filter(p => p.section === section)
    const principalStrength =
      sectionPrincipals.length > 0
        ? average(sectionPrincipals.map(p => (p.overall + p.stressResistance) / 2))
        : 50
    // Positive stress = section is taxed beyond its strength
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
    // Extra price hit for price-sensitive segments above $60
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
  works: Work[],
  rehearsalPressure: number,
  sectionStress: ConcertForecast['sectionStress'],
  donorResponse: number,
  projectedNet: number,
  programNovelty: number,
): string[] {
  const notes: string[] = []

  if (rehearsalPressure > 25)
    notes.push(
      `Program carries ${Math.round(rehearsalPressure)} points of rehearsal pressure — performance risk is elevated.`,
    )
  else if (rehearsalPressure < -10)
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

  const contemporaryCount = works.filter(w => w.isContemporary).length
  if (contemporaryCount >= 2)
    notes.push('Two or more contemporary works signal a bold institutional identity statement.')

  return notes.slice(0, 4)
}

export function forecastProgram(input: ForecastInput): ConcertForecast {
  const works = selectedWorks(input)
  const { institution, principals, audienceSegments, program } = input

  // Program-level aggregate scores
  const programDraw = average(works.map(w => w.audienceDraw))
  const programPrestige = average(works.map(w => w.artisticPrestige))
  const programNovelty = average(works.map(w => w.novelty))
  const programDonorComfort = average(works.map(w => w.donorComfort))
  const programIdentityValue = average(works.map(w => w.identityValue))

  const marketingBoost = marketingEffect(program.marketingSpend)
  const pricePen = pricePenalty(program.ticketPrice)
  const adjustedDraw = clamp(programDraw + marketingBoost - pricePen, 0, 100)

  // Rehearsal pressure: positive = under-rehearsed, negative = over-prepared
  const totalLoad = sum(works.map(w => w.rehearsalLoad))
  const rehearsalPressure = clamp(totalLoad - program.rehearsalHours, -40, 100)

  const sectionStress = computeSectionStress(works, principals)
  const avgSectionStress = average(Object.values(sectionStress))

  // Performance risk combines preparation gap, section stress, institutional quality
  const performanceRisk = clamp(
    Math.max(0, rehearsalPressure) * 0.4 +
      avgSectionStress * 0.35 -
      institution.technicalQuality * 0.15,
    0,
    100,
  )

  const projectedAttendance = computeAttendance(
    audienceSegments,
    adjustedDraw,
    programPrestige,
    programNovelty,
    program.ticketPrice,
  )
  const projectedRevenue = projectedAttendance * program.ticketPrice
  const projectedExpenses =
    BASE_CONCERT_COST + program.rehearsalHours * REHEARSAL_COST_PER_HOUR + program.marketingSpend
  const projectedNet = projectedRevenue - projectedExpenses

  // Donor response: comfort minus a penalty for high novelty
  const donorResponse = clamp(programDonorComfort - programNovelty * 0.3, 0, 100)

  const forecastNotes = buildForecastNotes(
    works,
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
    forecastNotes,
  }
}
