import type { InstitutionState, SeasonState } from '../../types/core'
import { daysToCurtain, concertDate, seasonWeekLabel } from '../../data/homeStubs'
import { CONCERT_ROMAN } from '../../data/numerals'

type HomeNavKey = 'home' | 'roster' | 'programme' | 'library' | 'ledger'

interface CanopyHeaderProps {
  institution: InstitutionState
  season: SeasonState
  activeNav: HomeNavKey
  onNavigate: (key: HomeNavKey) => void
}

const NAV_KEYS: HomeNavKey[] = ['home', 'roster', 'programme', 'library', 'ledger']

const NAV_LABELS: Record<HomeNavKey, string> = {
  home: 'home',
  roster: 'roster',
  programme: 'programme',
  library: 'library',
  ledger: 'ledger',
}

const ENABLED: Record<HomeNavKey, boolean> = {
  home: true,
  roster: true,
  programme: true,
  library: true,
  ledger: true,
}

export default function CanopyHeader({
  institution,
  season,
  activeNav,
  onNavigate,
}: CanopyHeaderProps) {
  const idx = Math.min(season.currentSlotIndex, 3)
  const seasonComplete = season.currentSlotIndex >= 4
  const currentSlot = seasonComplete ? season.slots[3] : season.slots[idx]
  const roman = CONCERT_ROMAN[idx]
  const days = daysToCurtain(idx)
  const date = concertDate(idx)

  // Slot names are full phrases like "Opening Night" or "Spring Identity Concert"
  // — turn them into "I. Opening Night is taking shape."
  const headlineSlot = currentSlot.name

  const dominantIdentity = pickDominantIdentity(institution)
  const subline = seasonComplete
    ? 'The season is closed. Review the summary or open the next.'
    : dominantIdentity === 'Undeclared'
      ? `${days} days to curtain. An identity has not yet emerged — the next concert sets the tone.`
      : `${days} days to curtain. Identity drift leans ${dominantIdentity.toLowerCase()}; the next concert decides whether it sticks.`

  return (
    <div className="home-stratum canopy">
      <div className="canopy-topbar">
        <div className="canopy-brand">
          <div className="canopy-brand-line">
            <div className="canopy-mark">OM</div>
            <span className="canopy-name">{institution.name}</span>
          </div>
          <span className="hc-eyebrow">{institution.city}</span>
          <span className="hc-eyebrow" style={{ color: 'var(--bark)' }}>
            {institution.seasonLabel}
          </span>
        </div>
        <div className="canopy-nav">
          <span className="canopy-nav-week">{seasonWeekLabel(idx)}</span>
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
      <div className="canopy-headline-row">
        <div>
          <span className="hc-eyebrow" style={{ color: 'var(--bark)' }}>
            {seasonComplete ? 'The hour · the season closed' : `The hour · prologue to ${roman}`}
          </span>
          <h1 className="canopy-headline hc-display">
            <span className="roman">{roman}.</span> {headlineSlot}{' '}
            {seasonComplete ? 'is in the books' : 'is taking shape'}
            <span className="punct">.</span>
          </h1>
          <p className="canopy-headline-sub">{subline}</p>
        </div>
        <div className="canopy-countdown">
          <div className="canopy-countdown-num hc-display">
            {days}
            <span className="canopy-countdown-unit">d</span>
          </div>
          <div className="hc-eyebrow canopy-countdown-caption">
            {seasonComplete ? 'season closed' : `until curtain · ${date}`}
          </div>
        </div>
      </div>
    </div>
  )
}

function pickDominantIdentity(institution: InstitutionState): string {
  const id = institution.identity
  const entries: Array<[string, number]> = [
    ['Adventurous', id.adventurous],
    ['Community', id.communityFocused],
    ['Scholarly', id.scholarly],
  ]
  entries.sort((a, b) => b[1] - a[1])
  if (entries[0][1] === 0 && entries[1][1] === 0 && entries[2][1] === 0) return 'Undeclared'
  return entries[0][0]
}
