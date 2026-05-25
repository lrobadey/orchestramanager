import { useMemo, useRef, useState } from 'react'
import { works } from './data/works'
import { principals } from './data/principals'
import { audienceSegments } from './data/audienceSegments'
import { startingInstitution } from './data/institution'
import { forecastProgram } from './sim/forecastProgram'
import { resolveConcert } from './sim/resolveConcert'
import { createInitialSeason, resolveSeasonConcert, summarizeSeason } from './sim/season'
import {
  ConcertProgram,
  ConcertReport,
  SeasonState,
  SlotTuple,
  TOTAL_REHEARSAL_HOURS,
} from './types/core'
import AppShell from './components/AppShell'
import ProgramBuilder from './components/ProgramBuilder'
import ConcertReportView from './components/ConcertReport'
import SeasonSummaryPanel from './components/SeasonSummaryPanel'
import RosterOverview from './components/RosterOverview'
import HomeConsole, { type HomeNavKey } from './components/HomeConsole'
import CanopyHeader from './components/home/CanopyHeader'
import UnderstoryVitals from './components/home/UnderstoryVitals'
import LibraryScreen from './components/LibraryScreen'
import LedgerScreen from './components/LedgerScreen'
import DonorRelationsScreen from './components/DonorRelationsScreen'

type Phase = 'planning' | 'report'
type MainView = 'home' | 'programme' | 'roster' | 'library' | 'ledger' | 'donors'

const evenAllocation = (): SlotTuple<number> => [7, 7, TOTAL_REHEARSAL_HOURS - 14]

const emptyProgram = (): ConcertProgram => ({
  workCount: 3,
  workIds: [null, null, null],
  intermissionAfter: 1,
  rehearsalAllocation: evenAllocation(),
  marketingSpend: 15_000,
  ticketPrice: 70,
  studentTicketsEnabled: false,
  studentTicketPrice: 25,
})

export default function App() {
  const [season, setSeason] = useState<SeasonState>(() =>
    createInitialSeason(startingInstitution, principals),
  )
  const [program, setProgram] = useState<ConcertProgram>(emptyProgram)
  const [phase, setPhase] = useState<Phase>('planning')
  const [mainView, setMainView] = useState<MainView>('home')
  const [report, setReport] = useState<ConcertReport | null>(null)

  const slotRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])

  const institution = season.institution
  const livePrincipals = season.roster.principals
  const seasonComplete = season.currentSlotIndex >= 4

  const forecast = useMemo(
    () =>
      forecastProgram({
        works,
        institution,
        principals: livePrincipals,
        audienceSegments,
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
      audienceSegments,
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
  function pointInRect(point: { x: number; y: number }, el: HTMLElement | null): boolean {
    if (!el) return false
    const r = el.getBoundingClientRect()
    return point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom
  }

  function findSlotTarget(point: { x: number; y: number }): number | null {
    for (let i = 0; i < program.workCount; i++) {
      if (pointInRect(point, slotRefs.current[i])) return i
    }
    return null
  }

  function handleSlotDrop(sourceIdx: number, point: { x: number; y: number }) {
    const target = findSlotTarget(point)
    const next = [...program.workIds] as SlotTuple<string | null>
    if (target === null) {
      next[sourceIdx] = null
      setProgram({ ...program, workIds: next })
      return
    }
    if (target === sourceIdx) return
    const a = next[sourceIdx]
    next[sourceIdx] = next[target]
    next[target] = a
    setProgram({ ...program, workIds: next })
  }

  if (seasonComplete) {
    return (
      <AppShell chromeless>
        <div className="home-console">
          <div className="home-strata release-result-strata">
            <CanopyHeader
              institution={institution}
              season={season}
              activeNav="home"
              onNavigate={handleHomeNavigate}
            />
            <UnderstoryVitals institution={institution} />
            <div className="home-stratum floor console-screen-floor release-screen-floor">
              <SeasonSummaryPanel
                summary={summarizeSeason(season)!}
                onNewSeason={handleNewSeason}
              />
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (mainView === 'home') {
    return (
      <AppShell chromeless>
        <HomeConsole
          season={season}
          program={program}
          works={works}
          onNavigate={handleHomeNavigate}
          onOpenProgramme={() => navigateTo('programme')}
        />
      </AppShell>
    )
  }

  if (mainView === 'roster' && phase === 'planning') {
    return (
      <AppShell chromeless>
        <div className="home-console">
          <div className="home-strata">
            <CanopyHeader
              institution={institution}
              season={season}
              activeNav="roster"
              onNavigate={handleHomeNavigate}
            />
            <UnderstoryVitals institution={institution} />
            <div className="home-stratum floor console-screen-floor">
              <RosterOverview
                roster={season.roster}
                forecast={forecast}
                currentSlotName={currentSlotName}
              />
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (mainView === 'programme' && phase === 'planning' && !seasonComplete) {
    return (
      <AppShell chromeless>
        <div className="home-console">
          <div className="home-strata">
            <CanopyHeader
              institution={institution}
              season={season}
              activeNav="programme"
              onNavigate={handleHomeNavigate}
            />
            <UnderstoryVitals institution={institution} />
            <div className="home-stratum floor console-screen-floor programme-console-floor">
              <ProgramBuilder
                works={works}
                program={program}
                forecast={forecast}
                slotName={currentSlotName ?? ''}
                registerSlotRef={(i, el) => { slotRefs.current[i] = el }}
                isDragging={false}
                onToggleRepertoire={() => undefined}
                onSlotDragEnd={handleSlotDrop}
                onProgramChange={setProgram}
                onRunConcert={handleRunConcert}
                rightRail={null}
              />
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (mainView === 'library' && phase === 'planning') {
    return (
      <AppShell chromeless>
        <LibraryScreen
          season={season}
          works={works}
          onNavigate={handleHomeNavigate}
        />
      </AppShell>
    )
  }

  if (mainView === 'ledger' && phase === 'planning') {
    return (
      <AppShell chromeless>
        <LedgerScreen
          institution={institution}
          season={season}
          forecast={forecast}
          onNavigate={handleHomeNavigate}
        />
      </AppShell>
    )
  }

  if (mainView === 'donors' && phase === 'planning') {
    return (
      <AppShell chromeless>
        <DonorRelationsScreen
          institution={institution}
          season={season}
          onNavigate={handleHomeNavigate}
        />
      </AppShell>
    )
  }

  return (
    <AppShell chromeless>
      <div className="home-console">
        <div className="home-strata release-result-strata">
          <CanopyHeader
            institution={institution}
            season={season}
            activeNav="home"
            onNavigate={handleHomeNavigate}
          />
          <UnderstoryVitals institution={institution} />
          <div className="home-stratum floor console-screen-floor release-screen-floor">
            {report ? (
              <ConcertReportView
                report={report}
                selectedWorks={filledSlotWorks}
                onDone={handleDone}
                concertNumber={season.currentSlotIndex + 1}
                totalConcerts={4}
              />
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
