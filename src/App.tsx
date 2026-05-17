import { useState } from 'react'
import { works } from './data/works'
import { principals } from './data/principals'
import { audienceSegments } from './data/audienceSegments'
import { startingInstitution } from './data/institution'
import { forecastProgram } from './sim/forecastProgram'
import { resolveConcert } from './sim/resolveConcert'
import { applyConcertReport } from './sim/applyConcertReport'
import { InstitutionState, ConcertProgram, ConcertForecast, ConcertReport } from './types/core'
import AppShell from './components/AppShell'
import InstitutionMeters from './components/InstitutionMeters'
import ProgramBuilder from './components/ProgramBuilder'
import ConcertForecastView from './components/ConcertForecast'
import ConcertReportView from './components/ConcertReport'

type Phase = 'planning' | 'forecast' | 'report'

export default function App() {
  const [institution, setInstitution] = useState<InstitutionState>(startingInstitution)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [rehearsalHours, setRehearsalHours] = useState(60)
  const [marketingSpend, setMarketingSpend] = useState(15_000)
  const [ticketPrice, setTicketPrice] = useState(70)
  const [phase, setPhase] = useState<Phase>('planning')
  const [forecast, setForecast] = useState<ConcertForecast | null>(null)
  const [report, setReport] = useState<ConcertReport | null>(null)

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
    setInstitution(prev => applyConcertReport(prev, report))
    setSelectedIds([])
    setForecast(null)
    setReport(null)
    setPhase('planning')
  }

  const selectedWorks = selectedIds
    .map(id => works.find(w => w.id === id))
    .filter((w): w is NonNullable<typeof w> => w !== undefined)

  return (
    <AppShell
      left={
        <InstitutionMeters
          institution={institution}
          deltas={phase === 'report' && report ? report.institutionalDeltas : undefined}
        />
      }
    >
      {phase === 'planning' && (
        <ProgramBuilder
          works={works}
          selectedIds={selectedIds}
          rehearsalHours={rehearsalHours}
          marketingSpend={marketingSpend}
          ticketPrice={ticketPrice}
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
          onRunConcert={handleRunConcert}
          onBack={() => setPhase('planning')}
        />
      )}
      {phase === 'report' && report && (
        <ConcertReportView
          report={report}
          selectedWorks={selectedWorks}
          onDone={handleDone}
        />
      )}
    </AppShell>
  )
}
