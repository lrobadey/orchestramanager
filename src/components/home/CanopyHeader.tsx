import type { ReactNode } from 'react'
import type { InstitutionState, SeasonState } from '../../types/core'
import { formatShortDate, getSeasonWeekLabel } from '../../sim/calendar'
import logo from '../../assets/logo.png'

type HomeNavKey = 'home' | 'roster' | 'programme' | 'library' | 'ledger' | 'donors' | 'audience'

interface CanopyHeaderProps {
  institution: InstitutionState
  season: SeasonState
  activeNav: HomeNavKey
  onNavigate: (key: HomeNavKey) => void
  children?: ReactNode
  compact?: boolean
}

const NAV_KEYS: HomeNavKey[] = ['home', 'roster', 'programme', 'library', 'ledger', 'donors', 'audience']

const NAV_LABELS: Record<HomeNavKey, string> = {
  home: 'home',
  roster: 'roster',
  programme: 'programme',
  library: 'library',
  ledger: 'ledger',
  donors: 'donors',
  audience: 'audience',
}

const ENABLED: Record<HomeNavKey, boolean> = {
  home: true,
  roster: true,
  programme: true,
  library: true,
  ledger: true,
  donors: true,
  audience: true,
}

export default function CanopyHeader({
  institution,
  season,
  activeNav,
  onNavigate,
  children,
  compact = false,
}: CanopyHeaderProps) {
  const idx = Math.min(season.currentSlotIndex, 3)
  const seasonComplete = season.currentSlotIndex >= 4
  const currentSlot = seasonComplete ? season.slots[3] : season.slots[idx]
  const days = Math.max(0, currentSlot.scheduledDay - season.calendar.currentDay)
  const date = formatShortDate(currentSlot.scheduledDate, season.calendar.startDate)

  // Slot names are full phrases like "Opening Night" or "Spring Identity Concert"
  // — turn them into "Opening Night is taking shape."
  const headlineSlot = currentSlot.name

  return (
    <div className="home-stratum canopy">
      <div className="canopy-topbar">
        <div className="canopy-brand">
          <div className="canopy-brand-line">
            <img src={logo} alt="Orchestra Manager" className="canopy-mark" />
            <span className="canopy-name">{institution.name}</span>
          </div>
          <span className="hc-eyebrow">{institution.city}</span>
          <span className="hc-eyebrow" style={{ color: 'var(--bark)' }}>
            {institution.seasonLabel}
          </span>
        </div>
        <div className="canopy-nav">
          <span className="canopy-nav-week">{getSeasonWeekLabel(season.calendar.currentDay, season.calendar.startDate)}</span>
          {NAV_KEYS.map(k => {
            const isActive = activeNav === k
            const enabled = ENABLED[k]
            const classes = ['canopy-nav-link']
            if (isActive) classes.push('active')
            if (!enabled) classes.push('disabled')
            return (
              <button
                key={k}
                type="button"
                className={classes.join(' ')}
                onClick={() => enabled && onNavigate(k)}
                disabled={!enabled}
                title={enabled ? undefined : 'Coming in a later systems pass'}
              >
                {NAV_LABELS[k]}
              </button>
            )
          })}
        </div>
      </div>
      {!compact && (children ?? (
        <div className="canopy-headline-row">
          <div>
            <span className="hc-eyebrow" style={{ color: 'var(--bark)' }}>
              {seasonComplete ? 'The hour · the season closed' : 'The hour · prologue'}
            </span>
            <h1 className="canopy-headline hc-display">
              {headlineSlot}{' '}
              {seasonComplete ? 'is in the books' : 'is taking shape'}
              <span className="punct">.</span>
            </h1>
          </div>
          <div className="canopy-countdown">
            <div className="canopy-countdown-num hc-display">
              <span className="canopy-countdown-days">{days}</span>
              <span className="canopy-countdown-unit">d</span>
            </div>
            <div className="hc-eyebrow canopy-countdown-caption">
              {seasonComplete ? 'season closed' : `until curtain · ${date}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
