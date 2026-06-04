import { useRef } from 'react'
import { works } from './data/works'
import { SlotTuple } from './types/core'
import ProgramBuilder from './components/ProgramBuilder'
import ConcertReportView from './components/ConcertReport'
import SeasonSummaryPanel from './components/SeasonSummaryPanel'
import RosterOverview from './components/RosterOverview'
import HomeConsole from './components/HomeConsole'
import LibraryScreen from './components/LibraryScreen'
import LedgerScreen from './components/LedgerScreen'
import DonorRelationsScreen from './components/DonorRelationsScreen'
import AudienceRelationsScreen from './components/AudienceRelationsScreen'
import EnterScreen from './components/EnterScreen'
import FoundingNameScreen from './components/FoundingNameScreen'
import AppShell from './components/AppShell'
import ConsoleScreen from './components/ConsoleScreen'
import { useSeasonGame } from './sim/useSeasonGame'
import { summarizeSeason } from './sim/season'

export default function App() {
  const game = useSeasonGame()
  const {
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
    filledSlotWorks,
    currentSlotName,
    handleRunConcert,
    handleDone,
    navigateTo,
    handleNewSeason,
    handleHomeNavigate,
    handleFoundOrchestra,
  } = game

  const slotRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])

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

  if (mainView === 'enter') {
    return <EnterScreen onEnter={() => setMainView('founding')} />
  }

  if (mainView === 'founding') {
    return (
      <FoundingNameScreen
        onFound={handleFoundOrchestra}
        onPlanFirstSeason={() => setMainView('home')}
      />
    )
  }

  if (seasonComplete) {
    return (
      <ConsoleScreen
        institution={institution}
        season={season}
        activeNav="home"
        onNavigate={handleHomeNavigate}
        strataClass="release-result-strata"
        floorClass="release-screen-floor"
      >
        <SeasonSummaryPanel summary={summarizeSeason(season)!} onNewSeason={handleNewSeason} />
      </ConsoleScreen>
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
      <ConsoleScreen
        institution={institution}
        season={season}
        activeNav="roster"
        onNavigate={handleHomeNavigate}
        compact
        strataClass="roster-strata"
        floorClass="roster-console-floor"
        vitalsVariant="rail"
      >
        <RosterOverview
          roster={season.roster}
          forecast={forecast}
          currentSlotName={currentSlotName}
          showCanopy={false}
        />
      </ConsoleScreen>
    )
  }

  if (mainView === 'programme' && phase === 'planning' && !seasonComplete) {
    return (
      <ConsoleScreen
        institution={institution}
        season={season}
        activeNav="programme"
        onNavigate={handleHomeNavigate}
        compact
        floorClass="programme-console-floor"
      >
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
      </ConsoleScreen>
    )
  }

  if (mainView === 'library' && phase === 'planning') {
    return (
      <AppShell chromeless>
        <LibraryScreen season={season} works={works} onNavigate={handleHomeNavigate} />
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

  if (mainView === 'audience' && phase === 'planning') {
    return (
      <AppShell chromeless>
        <AudienceRelationsScreen
          institution={institution}
          season={season}
          onNavigate={handleHomeNavigate}
        />
      </AppShell>
    )
  }

  return (
    <ConsoleScreen
      institution={institution}
      season={season}
      activeNav="home"
      onNavigate={handleHomeNavigate}
      strataClass="release-result-strata"
      floorClass="release-screen-floor"
    >
      {report ? (
        <ConcertReportView
          report={report}
          selectedWorks={filledSlotWorks}
          onDone={handleDone}
          concertNumber={season.currentSlotIndex + 1}
          totalConcerts={4}
        />
      ) : null}
    </ConsoleScreen>
  )
}
