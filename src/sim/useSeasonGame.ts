import { useMemo, useState } from 'react'
import { works } from '../data/works'
import { principals } from '../data/principals'
import { cityAudienceSegments } from '../data/audienceSegments'
import { startingInstitution } from '../data/institution'
import { forecastProgram } from './forecastProgram'
import { resolveConcert } from './resolveConcert'
import { createInitialSeason, resolveSeasonConcert } from './season'
import {
  ConcertProgram,
  ConcertReport,
  SeasonState,
  SlotTuple,
  TOTAL_REHEARSAL_HOURS,
} from '../types/core'
import type { HomeNavKey } from '../components/HomeConsole'

export type Phase = 'planning' | 'report'
export type MainView = 'enter' | 'home' | 'programme' | 'roster' | 'library' | 'ledger' | 'donors' | 'audience'

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

export function useSeasonGame() {
  const [season, setSeason] = useState<SeasonState>(() =>
    createInitialSeason(startingInstitution, principals),
  )
  const [program, setProgram] = useState<ConcertProgram>(emptyProgram)
  const [phase, setPhase] = useState<Phase>('planning')
  const [mainView, setMainView] = useState<MainView>('enter')
  const [report, setReport] = useState<ConcertReport | null>(null)

  const institution = season.institution
  const livePrincipals = season.roster.principals
  const seasonComplete = season.currentSlotIndex >= 4

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
    [institution, livePrincipals, program, season.donors],
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
    setSeason(prev => resolveSeasonConcert(prev, program, report, works))
    setProgram(emptyProgram())
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

  function handleNewSeason() {
    setSeason(createInitialSeason(startingInstitution, principals))
    setProgram(emptyProgram())
    setReport(null)
    setPhase('planning')
    setMainView('home')
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

  const currentSlotName = !seasonComplete ? season.slots[season.currentSlotIndex].name : null

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
    forecast,
    slotWorks,
    filledSlotWorks,
    currentSlotName,
    lastDeltas,
    handleRunConcert,
    handleDone,
    navigateTo,
    handleNewSeason,
    handleHomeNavigate,
  }
}
