import { useMemo, useState } from 'react'
import { works } from '../data/works'
import { principals } from '../data/principals'
import { cityAudienceSegments } from '../data/audienceSegments'
import { startingInstitution } from '../data/institution'
import { forecastProgram } from './forecastProgram'
import { resolveConcert } from './resolveConcert'
import { createInitialSeason, resolveSeasonConcert } from './season'
import { computeSeasonFunding, type SeasonFundingConcertInput } from './seasonFunding'
import { isProgramComplete, isSeasonPlanComplete, sanitizeOrchestraName } from './founding'
import {
  ConcertProgram,
  ConcertReport,
  SeasonState,
  SlotTuple,
  TOTAL_REHEARSAL_HOURS,
} from '../types/core'
import type { HomeNavKey } from '../components/HomeConsole'

export type Phase = 'planning' | 'report'
export type MainView =
  | 'enter'
  | 'founding'
  | 'plan-season'
  | 'home'
  | 'programme'
  | 'roster'
  | 'library'
  | 'ledger'
  | 'donors'
  | 'audience'

type SeasonPrograms = [ConcertProgram, ConcertProgram, ConcertProgram, ConcertProgram]

const evenAllocation = (): SlotTuple<number> => [7, 7, TOTAL_REHEARSAL_HOURS - 14]

const emptyProgram = (): ConcertProgram => ({
  workCount: 3,
  workIds: [null, null, null],
  intermissionAfter: 1,
  rehearsalAllocation: evenAllocation(),
  marketingSpend: 15_000,
  marketingStyle: 'digital',
  ticketPrice: 70,
  studentTicketsEnabled: false,
  studentTicketPrice: 25,
})

const emptyDraftPrograms = (): SeasonPrograms => [
  emptyProgram(),
  emptyProgram(),
  emptyProgram(),
  emptyProgram(),
]

function createSeasonForOrchestra(orchestraName: string): SeasonState {
  return createInitialSeason({ ...startingInstitution, name: orchestraName }, principals)
}

export function useSeasonGame() {
  const [orchestraName, setOrchestraName] = useState(startingInstitution.name)
  const [season, setSeason] = useState<SeasonState>(() => createSeasonForOrchestra(startingInstitution.name))
  // One editable program per concert slot. Authored up front on the season-plan
  // screen, then frozen when the season begins and consumed in order during play.
  const [draftPrograms, setDraftPrograms] = useState<SeasonPrograms>(emptyDraftPrograms)
  // Which slot the season-plan screen is editing (pre-season only).
  const [selectedSlot, setSelectedSlot] = useState(0)
  // The plan locks when the season begins; from then on programs are read-only
  // and concerts resolve against the committed plan one at a time.
  const [seasonStarted, setSeasonStarted] = useState(false)
  const [phase, setPhase] = useState<Phase>('planning')
  const [mainView, setMainView] = useState<MainView>('enter')
  const [report, setReport] = useState<ConcertReport | null>(null)

  const institution = season.institution
  const livePrincipals = season.roster.principals
  const seasonComplete = season.currentSlotIndex >= 4

  // Pre-season the player edits the selected slot; in-season the "active" program
  // is the concert currently up for resolution.
  const activeProgramIndex = seasonStarted ? Math.min(season.currentSlotIndex, 3) : selectedSlot
  const program = draftPrograms[activeProgramIndex]

  const planComplete = useMemo(() => isSeasonPlanComplete(draftPrograms), [draftPrograms])

  // Live donor auto-fill while planning: each programmed concert's cost becomes
  // an ask, and the deterministic engine fills it from aligned donor capacity.
  // Only fully-programmed concerts are scored (an empty program has no
  // repertoire for donors to react to); coverage grows as the plan fills in.
  const fundingConcerts = useMemo<SeasonFundingConcertInput[]>(
    () =>
      draftPrograms.map((draft, index) => ({
        id: `concert-${index}`,
        index,
        name: season.slots[index]?.name ?? `Concert ${index + 1}`,
        program: isProgramComplete(draft) ? draft : null,
      })),
    [draftPrograms, season.slots],
  )

  const seasonFunding = useMemo(
    () =>
      computeSeasonFunding({
        donors: season.donors.donors,
        concerts: fundingConcerts,
        works,
        institution,
      }),
    [season.donors.donors, fundingConcerts, institution],
  )

  function setProgram(next: ConcertProgram) {
    // Locked once the season is under way: no editing the committed plan.
    if (seasonStarted) return
    setDraftPrograms(prev => {
      const copy = [...prev] as SeasonPrograms
      copy[activeProgramIndex] = next
      return copy
    })
  }

  const forecast = useMemo(
    () =>
      forecastProgram({
        works,
        institution,
        principals: livePrincipals,
        cityAudienceSegments,
        audienceState: season.audience,
        program,
        donorState: season.donors,
      }),
    [institution, livePrincipals, program, season.audience, season.donors],
  )

  function handleRunConcert() {
    if (!forecast.isComplete) return
    const result = resolveConcert({
      works,
      institution,
      principals: livePrincipals,
      cityAudienceSegments,
      audienceState: season.audience,
      program,
      donorState: season.donors,
      roll: Math.random() * 100,
    })
    setReport(result)
    setPhase('report')
  }

  function applyPendingReport() {
    if (!report) return
    setSeason(prev => resolveSeasonConcert(prev, draftPrograms[prev.currentSlotIndex], report, works))
    setReport(null)
    setPhase('planning')
  }

  function handleDone() {
    applyPendingReport()
    setMainView('home')
  }

  function navigateTo(view: MainView) {
    if (phase === 'report') applyPendingReport()
    setMainView(view)
  }

  function handleFoundOrchestra(name: string) {
    const cleanName = sanitizeOrchestraName(name)
    setOrchestraName(cleanName)
    setSeason(prev => ({
      ...prev,
      institution: { ...prev.institution, name: cleanName },
    }))
  }

  function selectSlot(index: number) {
    if (index < 0 || index > 3) return
    setSelectedSlot(index)
  }

  function beginSeason() {
    if (!planComplete || seasonStarted) return
    setSeasonStarted(true)
    setPhase('planning')
    setMainView('home')
  }

  function handleNewSeason() {
    setSeason(createSeasonForOrchestra(orchestraName))
    setDraftPrograms(emptyDraftPrograms())
    setSelectedSlot(0)
    setSeasonStarted(false)
    setReport(null)
    setPhase('planning')
    setMainView('plan-season')
  }

  function handleHomeNavigate(key: HomeNavKey) {
    navigateTo(key)
  }

  const slotWorks: SlotTuple<ReturnType<typeof works.find>> = [
    program.workIds[0] ? works.find(w => w.id === program.workIds[0]) : undefined,
    program.workIds[1] ? works.find(w => w.id === program.workIds[1]) : undefined,
    program.workIds[2] ? works.find(w => w.id === program.workIds[2]) : undefined,
  ]
  const filledSlotWorks = slotWorks
    .slice(0, program.workCount)
    .filter((w): w is NonNullable<typeof w> => w !== undefined)

  const currentSlotName = !seasonComplete ? season.slots[activeProgramIndex].name : null

  // Movement shown on the vitals strip is the institutional delta from the most
  // recently resolved concert. currentSlotIndex points at the next pending slot,
  // so the last resolved slot is the one immediately before it.
  const lastResolvedSlot = season.currentSlotIndex > 0 ? season.slots[season.currentSlotIndex - 1] : null
  const lastDeltas = lastResolvedSlot?.report?.institutionalDeltas

  return {
    season,
    program,
    setProgram,
    setMainView,
    phase,
    mainView,
    report,
    institution,
    seasonComplete,
    seasonStarted,
    forecast,
    draftPrograms,
    selectedSlot,
    selectSlot,
    planComplete,
    seasonFunding,
    beginSeason,
    slotWorks,
    filledSlotWorks,
    currentSlotName,
    lastDeltas,
    handleRunConcert,
    handleDone,
    navigateTo,
    handleNewSeason,
    handleHomeNavigate,
    handleFoundOrchestra,
  }
}
