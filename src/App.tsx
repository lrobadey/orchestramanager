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
import VitalsStrip from './components/VitalsStrip'
import ProgramBuilder from './components/ProgramBuilder'
import ConcertForecastView from './components/ConcertForecast'
import ConcertReportView from './components/ConcertReport'
import SeasonTimeline from './components/SeasonTimeline'
import SeasonSummaryPanel from './components/SeasonSummaryPanel'
import RosterOverview from './components/RosterOverview'
import RepertoireDrawer from './components/RepertoireDrawer'
import Drawer from './components/Drawer'

type Phase = 'planning' | 'report'
type MainView = 'program' | 'roster'

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

const ROMAN_OPUS = ['I', 'II', 'III', 'IV']

export default function App() {
  const [season, setSeason] = useState<SeasonState>(() =>
    createInitialSeason(startingInstitution, principals),
  )
  const [program, setProgram] = useState<ConcertProgram>(emptyProgram)
  const [phase, setPhase] = useState<Phase>('planning')
  const [mainView, setMainView] = useState<MainView>('program')
  const [report, setReport] = useState<ConcertReport | null>(null)
  const [repertoireOpen, setRepertoireOpen] = useState(false)
  const [forecastOpen, setForecastOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

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
      }),
    [institution, livePrincipals, program],
  )

  function handleRunConcert() {
    if (!forecast.isComplete) return
    const result = resolveConcert({
      works,
      institution,
      principals: livePrincipals,
      audienceSegments,
      program,
      roll: Math.random() * 100,
    })
    setReport(result)
    setPhase('report')
    setForecastOpen(false)
    setRepertoireOpen(false)
  }

  function handleDone() {
    if (!report) return
    setSeason(prev => resolveSeasonConcert(prev, program, report))
    setProgram(emptyProgram())
    setReport(null)
    setPhase('planning')
    setMainView('program')
  }

  function handleNewSeason() {
    setSeason(createInitialSeason(startingInstitution, principals))
    setProgram(emptyProgram())
    setReport(null)
    setPhase('planning')
    setMainView('program')
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
  const opusLabel = !seasonComplete
    ? `Opus I · Movement ${ROMAN_OPUS[season.currentSlotIndex]} / IV`
    : 'Opus I · Complete'

  const usedIds = new Set(program.workIds.filter((id): id is string => id !== null))

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

  function handleRepertoireDrop(id: string, point: { x: number; y: number }) {
    setIsDragging(false)
    const target = findSlotTarget(point)
    if (target === null) return
    const next = [...program.workIds] as SlotTuple<string | null>
    const existing = next.indexOf(id)
    if (existing !== -1 && existing !== target) {
      next[existing] = next[target]
      next[target] = id
    } else {
      next[target] = id
    }
    setProgram({ ...program, workIds: next })
  }

  function handleSlotDrop(sourceIdx: number, point: { x: number; y: number }) {
    setIsDragging(false)
    const target = findSlotTarget(point)
    const next = [...program.workIds] as SlotTuple<string | null>
    if (target === null) {
      // dropped outside any slot → clear that slot
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

  const nav = (
    <>
      <button
        type="button"
        className={mainView === 'program' && !seasonComplete ? 'shell-nav-button active' : 'shell-nav-button'}
        onClick={() => setMainView('program')}
      >
        Program
      </button>
      <button
        type="button"
        className={mainView === 'roster' ? 'shell-nav-button active' : 'shell-nav-button'}
        onClick={() => setMainView('roster')}
      >
        Roster
      </button>
    </>
  )

  return (
    <AppShell
      vitals={
        <VitalsStrip
          institution={institution}
          deltas={phase === 'report' && report ? report.institutionalDeltas : undefined}
        />
      }
      position={opusLabel}
      seasonDots={<SeasonTimeline season={season} />}
      nav={nav}
    >
      {mainView === 'roster' ? (
        <RosterOverview
          roster={season.roster}
          forecast={forecast}
          currentSlotName={currentSlotName}
        />
      ) : seasonComplete ? (
        <SeasonSummaryPanel
          summary={summarizeSeason(season)!}
          onNewSeason={handleNewSeason}
        />
      ) : phase === 'planning' ? (
        <>
          <ProgramBuilder
            works={works}
            program={program}
            forecast={forecast}
            slotName={currentSlotName ?? ''}
            registerSlotRef={(i, el) => { slotRefs.current[i] = el }}
            isDragging={isDragging}
            onOpenRepertoire={() => setRepertoireOpen(true)}
            onOpenForecast={() => setForecastOpen(true)}
            onSlotDragEnd={handleSlotDrop}
            onProgramChange={setProgram}
            onRunConcert={handleRunConcert}
          />
          <RepertoireDrawer
            open={repertoireOpen}
            onClose={() => setRepertoireOpen(false)}
            works={works}
            usedIds={usedIds}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleRepertoireDrop}
          />
          <Drawer
            open={forecastOpen}
            title="Live Forecast"
            onClose={() => setForecastOpen(false)}
          >
            <ConcertForecastView
              forecast={forecast}
              slotWorks={slotWorks}
              workCount={program.workCount}
            />
          </Drawer>
        </>
      ) : report ? (
        <ConcertReportView
          report={report}
          selectedWorks={filledSlotWorks}
          onDone={handleDone}
          concertNumber={season.currentSlotIndex + 1}
          totalConcerts={4}
        />
      ) : null}
    </AppShell>
  )
}
