import '../styles/home.css'
import type { ConcertProgram, InstitutionalDeltas, SeasonState, Work } from '../types/core'
import CanopyHeader from './home/CanopyHeader'
import UnderstoryVitals from './home/UnderstoryVitals'
import FloorColumns from './home/FloorColumns'
import SeasonTrail from './home/SeasonTrail'

export type HomeNavKey = 'home' | 'roster' | 'programme' | 'library' | 'ledger' | 'donors' | 'audience'

interface HomeConsoleProps {
  season: SeasonState
  program: ConcertProgram
  works: Work[]
  deltas?: InstitutionalDeltas
  onNavigate: (key: HomeNavKey) => void
  onOpenProgramme: () => void
}

export default function HomeConsole({
  season,
  program,
  works,
  deltas,
  onNavigate,
  onOpenProgramme,
}: HomeConsoleProps) {
  return (
    <div className="home-console">
      <div className="home-strata">
        <CanopyHeader
          institution={season.institution}
          season={season}
          activeNav="home"
          onNavigate={onNavigate}
        />
        <UnderstoryVitals institution={season.institution} deltas={deltas} />
        <FloorColumns
          roster={season.roster}
          season={season}
          program={program}
          works={works}
          onOpenProgramme={onOpenProgramme}
        />
        <SeasonTrail season={season} />
      </div>
    </div>
  )
}
