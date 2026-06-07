import type { ReactNode } from 'react'
import type { InstitutionState, InstitutionalDeltas, SeasonState } from '../types/core'
import AppShell from './AppShell'
import CanopyHeader from './home/CanopyHeader'
import UnderstoryVitals from './home/UnderstoryVitals'
import type { HomeNavKey } from './HomeConsole'

interface ConsoleScreenProps {
  institution: InstitutionState
  season: SeasonState
  activeNav: HomeNavKey
  onNavigate: (key: HomeNavKey) => void
  compact?: boolean
  strataClass?: string
  floorClass?: string
  vitalsVariant?: 'bar' | 'rail'
  deltas?: InstitutionalDeltas
  navless?: boolean
  children: ReactNode
}

export default function ConsoleScreen({
  institution,
  season,
  activeNav,
  onNavigate,
  compact,
  strataClass,
  floorClass,
  vitalsVariant = 'bar',
  deltas,
  navless = false,
  children,
}: ConsoleScreenProps) {
  const floor = (
    <div className={`home-stratum floor console-screen-floor ${floorClass ?? ''}`.trim()}>
      {children}
    </div>
  )

  return (
    <AppShell chromeless>
      <div className="home-console">
        <div className={`home-strata ${strataClass ?? ''}`.trim()}>
          <CanopyHeader
            institution={institution}
            season={season}
            activeNav={activeNav}
            onNavigate={onNavigate}
            compact={compact}
            navless={navless}
          />
          {vitalsVariant === 'rail' ? (
            <div className="roster-body-with-vitals">
              <UnderstoryVitals institution={institution} deltas={deltas} variant="rail" />
              {floor}
            </div>
          ) : (
            <>
              <UnderstoryVitals institution={institution} deltas={deltas} />
              {floor}
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
