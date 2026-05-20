import { useMemo, useState } from 'react'
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
import InstitutionMeters from './components/InstitutionMeters'
import ProgramBuilder from './components/ProgramBuilder'
import ConcertForecastView from './components/ConcertForecast'
import ConcertReportView from './components/ConcertReport'
import SeasonTimeline from './components/SeasonTimeline'
import SeasonSummaryPanel from './components/SeasonSummaryPanel'
import RosterOverview from './components/RosterOverview'

type Phase = 'planning' | 'report'
type MainView = 'season' | 'roster'

const evenAllocation = (): SlotTuple<number> => {
  return [7, 7, TOTAL_REHEARSAL_HOURS - 14]
}

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
  const [mainView, setMainView] = useState<MainView>('season')
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
  }

  function handleDone() {
    if (!report) return
    setSeason(prev => resolveSeasonConcert(prev, program, report))
    setProgram(emptyProgram())
    setReport(null)
    setPhase('planning')
    setMainView('season')
  }

  function handleNewSeason() {
    setSeason(createInitialSeason(startingInstitution, principals))
    setProgram(emptyProgram())
    setReport(null)
    setPhase('planning')
    setMainView('season')
  }

  const slotWorks: SlotTuple<ReturnType<typeof works.find>> = [
    program.workIds[0] ? works.find(w => w.id === program.workIds[0]) : undefined,
    program.workIds[1] ? works.find(w => w.id === program.workIds[1]) : undefined,
    program.workIds[2] ? works.find(w => w.id === program.workIds[2]) : undefined,
  ]
  const filledSlotWorks = slotWorks
    .slice(0, program.workCount)
    .filter((w): w is NonNullable<typeof w> => w !== undefined)

  const currentSlotName = !seasonComplete
    ? season.slots[season.currentSlotIndex].name
    : null

  return (
    <AppShell
      left={
        <InstitutionMeters
          institution={institution}
          deltas={phase === 'report' && report ? report.institutionalDeltas : undefined}
        />
      }
      timeline={<SeasonTimeline season={season} />}
      nav={
        <div className="view-toggle" aria-label="Main views">
          <button
            className={mainView === 'season' ? 'view-toggle-button active' : 'view-toggle-button'}
            onClick={() => setMainView('season')}
          >
            Season
          </button>
          <button
            className={mainView === 'roster' ? 'view-toggle-button active' : 'view-toggle-button'}
            onClick={() => setMainView('roster')}
          >
            Roster
          </button>
        </div>
      }
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
      ) : (
        <>
          {currentSlotName && phase === 'planning' && (
            <p className="concert-slot-label">{currentSlotName}</p>
          )}
          {phase === 'planning' && (
            <div className="builder-layout">
              <ProgramBuilder
                works={works}
                program={program}
                forecast={forecast}
                rightPanel={
                  <ConcertForecastView
                    forecast={forecast}
                    slotWorks={slotWorks}
                    workCount={program.workCount}
                  />
                }
                onProgramChange={setProgram}
                onRunConcert={handleRunConcert}
              />
            </div>
          )}
          {phase === 'report' && report && (
            <ConcertReportView
              report={report}
              selectedWorks={filledSlotWorks}
              onDone={handleDone}
              concertNumber={season.currentSlotIndex + 1}
              totalConcerts={4}
            />
          )}
        </>
      )}
    </AppShell>
  )
}
