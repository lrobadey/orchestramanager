import type {
  ConcertForecast,
  ConcertProgram,
  ConcertReport,
  Principal,
  SeasonState,
  SectionKey,
  Work,
} from '../types/core'

export type UiTone = 'positive' | 'neutral' | 'warning' | 'danger'

export interface UiMetric {
  label: string
  value: string
  tone: UiTone
}

export interface UiProgramSlot {
  slotIndex: number
  label: string
  placement: 'opener' | 'middle' | 'finale'
  work: {
    id: string
    title: string
    composer: string
    durationMinutes: number
    era: Work['era']
    isContemporary: boolean
  } | null
  rehearsalHours: {
    allocated: number
    needed: number | null
    pressure: number | null
  }
  arcDamage: number | null
  isMemoryAnchor: boolean
}

export interface UiAudienceSegment {
  id: string
  name: string
  attendance: string
  sharePercent: number
  effectiveTicketPrice: string
  revenue: string
}

export interface UiRosterPrincipal {
  id: string
  name: string
  position: string
  overall: number
  form: number
  morale: number
}

export interface UiRosterSection {
  section: SectionKey
  label: string
  strength: number | null
  demand: number | null
  stress: number | null
  bottleneck: string | null
  note: string | null
  principals: UiRosterPrincipal[]
}

export interface UiConcertReportSummary {
  attendance: string
  net: string
  performanceQuality: number
  audienceResponse: number
  criticResponse: number
  sectionNotes: string[]
  rosterChanges: Array<{
    principalId: string
    principalName: string
    formDelta: number
    moraleDelta: number
    note: string
  }>
}

export interface UiConcertPresentation {
  season: {
    currentSlotIndex: number
    currentSlotName: string | null
    concertNumber: number | null
    totalConcerts: number
    isComplete: boolean
  }
  program: {
    workCount: ConcertProgram['workCount']
    intermissionAfter: ConcertProgram['intermissionAfter']
    marketingSpend: string
    ticketPrice: string
    studentTicketsEnabled: boolean
    studentTicketPrice: string
    slots: UiProgramSlot[]
  }
  forecast: {
    isComplete: boolean
    headline: UiMetric[]
    audienceSegments: UiAudienceSegment[]
    notes: string[]
  }
  roster: {
    sections: UiRosterSection[]
  }
  report: UiConcertReportSummary | null
}

export interface BuildConcertPresentationInput {
  season: SeasonState
  program: ConcertProgram
  forecast: ConcertForecast
  works: Work[]
  report?: ConcertReport | null
}

const SECTION_ORDER: SectionKey[] = ['strings', 'winds', 'brass', 'percussion']

const SECTION_LABELS: Record<SectionKey, string> = {
  strings: 'Strings',
  winds: 'Winds',
  brass: 'Brass',
  percussion: 'Percussion',
}

const SLOT_LABELS = ['I', 'II', 'III'] as const

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

function riskTone(value: number): UiTone {
  if (value >= 65) return 'danger'
  if (value >= 35) return 'warning'
  return 'positive'
}

function qualityTone(value: number): UiTone {
  if (value >= 65) return 'positive'
  if (value >= 35) return 'neutral'
  return 'warning'
}

function placementForSlot(slotIndex: number, workCount: ConcertProgram['workCount']): UiProgramSlot['placement'] {
  if (slotIndex === 0) return 'opener'
  if (slotIndex === workCount - 1) return 'finale'
  return 'middle'
}

function workForId(works: Work[], id: string | null): Work | null {
  return id ? works.find(work => work.id === id) ?? null : null
}

function toUiPrincipal(principal: Principal): UiRosterPrincipal {
  return {
    id: principal.id,
    name: principal.name,
    position: principal.position,
    overall: principal.overall,
    form: principal.form,
    morale: principal.morale,
  }
}

function buildSlots(
  program: ConcertProgram,
  forecast: ConcertForecast,
  works: Work[],
): UiProgramSlot[] {
  return program.workIds.slice(0, program.workCount).map((workId, slotIndex) => {
    const work = workForId(works, workId)
    return {
      slotIndex,
      label: SLOT_LABELS[slotIndex],
      placement: placementForSlot(slotIndex, program.workCount),
      work: work
        ? {
            id: work.id,
            title: work.title,
            composer: work.composer,
            durationMinutes: work.durationMinutes,
            era: work.era,
            isContemporary: work.isContemporary,
          }
        : null,
      rehearsalHours: {
        allocated: program.rehearsalAllocation[slotIndex],
        needed: forecast.perWorkRehearsalHoursNeeded[slotIndex],
        pressure: forecast.perWorkRehearsalPressure[slotIndex],
      },
      arcDamage: forecast.perWorkArcDamage[slotIndex],
      isMemoryAnchor: work?.id === forecast.memoryAnchorWorkId,
    }
  })
}

function buildHeadline(forecast: ConcertForecast): UiMetric[] {
  if (!forecast.isComplete) {
    return [
      { label: 'Attendance', value: 'Pending', tone: 'neutral' },
      { label: 'Net', value: 'Pending', tone: 'neutral' },
      { label: 'Risk', value: 'Pending', tone: 'neutral' },
    ]
  }

  return [
    {
      label: 'Attendance',
      value: formatNumber(forecast.projectedAttendance),
      tone: qualityTone(forecast.audienceFit),
    },
    {
      label: 'Net',
      value: formatCurrency(forecast.projectedNet),
      tone: forecast.projectedNet >= 0 ? 'positive' : 'danger',
    },
    {
      label: 'Risk',
      value: String(Math.round(forecast.performanceRisk)),
      tone: riskTone(forecast.performanceRisk),
    },
  ]
}

function buildAudienceSegments(forecast: ConcertForecast): UiAudienceSegment[] {
  return forecast.projectedAudienceBreakdown.map(row => ({
    id: row.segmentId,
    name: row.segmentName,
    attendance: formatNumber(row.attendance),
    sharePercent: Math.round(row.shareOfHouse * 100),
    effectiveTicketPrice: formatCurrency(row.effectiveTicketPrice),
    revenue: formatCurrency(row.ticketRevenue),
  }))
}

function buildRosterSections(season: SeasonState, forecast: ConcertForecast): UiRosterSection[] {
  return SECTION_ORDER.map(section => {
    const strength = forecast.sectionStrengths.find(row => row.section === section)
    const fit = forecast.repertoireFit.find(row => row.section === section)
    return {
      section,
      label: strength?.label ?? SECTION_LABELS[section],
      strength: strength?.strength ?? null,
      demand: fit?.demand ?? null,
      stress: fit?.stress ?? null,
      bottleneck: strength?.bottleneck ?? null,
      note: fit?.note ?? strength?.note ?? null,
      principals: season.roster.principals
        .filter(principal => principal.section === section)
        .map(toUiPrincipal),
    }
  })
}

function buildReportSummary(report: ConcertReport | null | undefined): UiConcertReportSummary | null {
  if (!report) return null

  return {
    attendance: formatNumber(report.attendance),
    net: formatCurrency(report.net),
    performanceQuality: Math.round(report.performanceQuality),
    audienceResponse: Math.round(report.audienceResponse),
    criticResponse: Math.round(report.criticResponse),
    sectionNotes: report.sectionOutcomes.map(outcome => outcome.note),
    rosterChanges: report.rosterChanges.map(change => ({
      principalId: change.principalId,
      principalName: change.principalName,
      formDelta: change.formDelta,
      moraleDelta: change.moraleDelta,
      note: change.note,
    })),
  }
}

export function buildConcertPresentation({
  season,
  program,
  forecast,
  works,
  report = null,
}: BuildConcertPresentationInput): UiConcertPresentation {
  const currentSlot = season.slots[season.currentSlotIndex] ?? null
  const isComplete = season.currentSlotIndex >= season.slots.length

  return {
    season: {
      currentSlotIndex: season.currentSlotIndex,
      currentSlotName: currentSlot?.name ?? null,
      concertNumber: isComplete ? null : season.currentSlotIndex + 1,
      totalConcerts: season.slots.length,
      isComplete,
    },
    program: {
      workCount: program.workCount,
      intermissionAfter: program.intermissionAfter,
      marketingSpend: formatCurrency(program.marketingSpend),
      ticketPrice: formatCurrency(program.ticketPrice),
      studentTicketsEnabled: program.studentTicketsEnabled,
      studentTicketPrice: formatCurrency(program.studentTicketPrice),
      slots: buildSlots(program, forecast, works),
    },
    forecast: {
      isComplete: forecast.isComplete,
      headline: buildHeadline(forecast),
      audienceSegments: buildAudienceSegments(forecast),
      notes: forecast.forecastNotes,
    },
    roster: {
      sections: buildRosterSections(season, forecast),
    },
    report: buildReportSummary(report),
  }
}
