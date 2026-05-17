import { useState } from 'react'
import { works } from './data/works'
import { principals } from './data/principals'
import { audienceSegments } from './data/audienceSegments'
import { startingInstitution } from './data/institution'
import { forecastProgram } from './sim/forecastProgram'
import { resolveConcert } from './sim/resolveConcert'
import { createInitialSeason, resolveSeasonConcert, summarizeSeason } from './sim/season'
import { ConcertProgram, ConcertForecast, ConcertReport, SeasonState } from './types/core'
import AppShell from './components/AppShell'
import InstitutionMeters from './components/InstitutionMeters'
import ProgramBuilder from './components/ProgramBuilder'
import ConcertForecastView from './components/ConcertForecast'
import ConcertReportView from './components/ConcertReport'
import SeasonTimeline from './components/SeasonTimeline'
import SeasonSummaryPanel from './components/SeasonSummaryPanel'
import AudienceOutlookPanel from './components/rightRail/AudienceOutlookPanel'
import DonorComfortPanel from './components/rightRail/DonorComfortPanel'
import SectionLoadPanel from './components/rightRail/SectionLoadPanel'
import FinancialProjectionPanel from './components/rightRail/FinancialProjectionPanel'

type Phase = 'planning' | 'forecast' | 'report'

export default function App() {
  const [season, setSeason] = useState<SeasonState>(() =>
    createInitialSeason(startingInstitution),
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [rehearsalHours, setRehearsalHours] = useState(60)
  const [marketingSpend, setMarketingSpend] = useState(15_000)
  const [ticketPrice, setTicketPrice] = useState(70)
  const [phase, setPhase] = useState<Phase>('planning')
  const [forecast, setForecast] = useState<ConcertForecast | null>(null)
  const [report, setReport] = useState<ConcertReport | null>(null)

  const institution = season.institution
  const seasonComplete = season.currentSlotIndex >= 4

  function toggleWork(id: string) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  function handleGetForecast() {
    if (selectedIds.length !== 3) return
    const program: ConcertProgram = {
      workIds: selectedIds as [string, string, string],
      rehearsalHours,
      marketingSpend,
      ticketPrice,
    }
    const result = forecastProgram({ works, institution, principals, audienceSegments, program })
    setForecast(result)
    setReport(null)
    setPhase('forecast')
  }

  function handleRunConcert() {
    if (selectedIds.length !== 3) return
    const program: ConcertProgram = {
      workIds: selectedIds as [string, string, string],
      rehearsalHours,
      marketingSpend,
      ticketPrice,
    }
    const result = resolveConcert({
      works,
      institution,
      principals,
      audienceSegments,
      program,
      roll: Math.random() * 100,
    })
    setReport(result)
    setPhase('report')
  }

  function handleDone() {
    if (!report) return
    const program: ConcertProgram = {
      workIds: selectedIds as [string, string, string],
      rehearsalHours,
      marketingSpend,
      ticketPrice,
    }
    setSeason(prev => resolveSeasonConcert(prev, program, report))
    setSelectedIds([])
    setForecast(null)
    setReport(null)
    setPhase('planning')
  }

  function handleNewSeason() {
    setSeason(createInitialSeason(startingInstitution))
    setSelectedIds([])
    setForecast(null)
    setReport(null)
    setPhase('planning')
  }

  const selectedWorks = selectedIds
    .map(id => works.find(w => w.id === id))
    .filter((w): w is NonNullable<typeof w> => w !== undefined)

  const slotIndex = Math.min(season.currentSlotIndex, 3)
  const currentSlotName = !seasonComplete
    ? season.slots[season.currentSlotIndex].name
    : 'Season Complete'

  // Right rail is shown for planning + forecast (where the player is still shaping the program).
  const showRightRail = !seasonComplete && (phase === 'planning' || phase === 'forecast')
  const rightRail = showRightRail ? (
    <>
      <AudienceOutlookPanel institution={institution} selectedWorks={selectedWorks} />
      <DonorComfortPanel institution={institution} selectedWorks={selectedWorks} />
      <SectionLoadPanel selectedWorks={selectedWorks} />
      <FinancialProjectionPanel institution={institution} season={season} />
    </>
  ) : undefined

  return (
    <AppShell
      left={
        <InstitutionMeters
          institution={institution}
          deltas={phase === 'report' && report ? report.institutionalDeltas : undefined}
        />
      }
      timeline={<SeasonTimeline season={season} />}
      rightRail={rightRail}
    >
      {seasonComplete ? (
        <SeasonSummaryPanel
          summary={summarizeSeason(season)!}
          onNewSeason={handleNewSeason}
        />
      ) : (
        <>
          {phase === 'planning' && (
            <ProgramBuilder
              works={works}
              selectedIds={selectedIds}
              rehearsalHours={rehearsalHours}
              marketingSpend={marketingSpend}
              ticketPrice={ticketPrice}
              slotIndex={slotIndex}
              slotName={currentSlotName}
              onToggleWork={toggleWork}
              onRehearsalChange={setRehearsalHours}
              onMarketingChange={setMarketingSpend}
              onPriceChange={setTicketPrice}
              onGetForecast={handleGetForecast}
            />
          )}
          {phase === 'forecast' && forecast && (
            <ConcertForecastView
              forecast={forecast}
              selectedWorks={selectedWorks}
              slotIndex={slotIndex}
              slotName={currentSlotName}
              onRunConcert={handleRunConcert}
              onBack={() => setPhase('planning')}
            />
          )}
          {phase === 'report' && report && (
            <ConcertReportView
              report={report}
              selectedWorks={selectedWorks}
              slotIndex={slotIndex}
              slotName={currentSlotName}
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
