import { useState } from 'react'
import type { SeasonState } from '../../types/core'
import type { SeasonFundingResult } from '../../sim/seasonFunding'
import { slotHeadlineFallback } from '../../data/homeStubs'
import { formatShortDate } from '../../sim/calendar'
import { CONCERT_ROMAN } from '../../data/numerals'

interface SeasonTrailProps {
  season: SeasonState
  // Planning mode: the trail becomes a concert picker. Landmarks are clickable,
  // the selected concert is highlighted, and per-slot completeness is surfaced
  // instead of the resolved/active styling used during play.
  selectable?: boolean
  selectedIndex?: number
  completeFlags?: boolean[]
  // Live donor funding, surfaced as per-concert coverage fills and donor chips
  // on the planning landmarks so the funding coalition reads as a map.
  funding?: SeasonFundingResult
  onSelect?: (index: number) => void
}

// Two-letter glyph for a donor chip, skipping a leading article.
function donorInitials(name: string): string {
  const words = name.split(/\s+/).filter(w => !/^the$/i.test(w))
  if (words.length === 0) return name.slice(0, 2).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

const TRAIL_W = 1440
const TRAIL_H = 220

// Landmark x/y positions on the trail. Stable so the curve reads the same
// every render. Idx maps to season.slots[idx].
const LANDMARK_POS: { x: number; y: number }[] = [
  { x: 240, y: 125 },
  { x: 540, y: 74 },
  { x: 880, y: 104 },
  { x: 1200, y: 55 },
]

export default function SeasonTrail({
  season,
  selectable = false,
  selectedIndex = 0,
  completeFlags,
  funding,
  onSelect,
}: SeasonTrailProps) {
  const fundingByIndex = new Map(
    (funding?.concerts ?? []).map(concert => [concert.concertIndex, concert]),
  )
  // In planning mode the map is most useful expanded so every concert is pickable.
  const [collapsed, setCollapsed] = useState(!selectable)
  const resolvedCount = season.slots.filter(s => s.status === 'resolved').length
  const activeIdx = Math.min(season.currentSlotIndex, 3)
  const seasonComplete = season.currentSlotIndex >= 4
  const isComplete = (i: number) => completeFlags?.[i] ?? false

  return (
    <div className={`home-stratum trail ${collapsed ? 'collapsed' : 'expanded'}`}>
      <div className="trail-contours" />
      <div className="trail-grid" />

      <button
        type="button"
        className="trail-collapse-toggle"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand season timeline' : 'Collapse season timeline'}
        onClick={() => setCollapsed(value => !value)}
      >
        {collapsed ? 'map' : '–'}
      </button>

      {collapsed && (
        <div className="trail-compact" aria-label="Season concert timeline">
          <div className="trail-compact-title">
            <span className="hc-eyebrow">Season</span>
            <span className="trail-compact-count">
              {resolvedCount} done · {seasonComplete ? 'closed' : `${CONCERT_ROMAN[activeIdx]} in programming`}
            </span>
          </div>
          <div className="trail-compact-rail">
            {season.slots.map((slot, i) => {
              const isActive = selectable ? i === selectedIndex : !seasonComplete && i === activeIdx
              const isResolved = slot.status === 'resolved'
              const cls = ['trail-compact-stop']
              if (isActive) cls.push(selectable ? 'selected' : 'active')
              else if (selectable) cls.push(isComplete(i) ? 'planned' : 'upcoming')
              else if (isResolved) cls.push('resolved')
              else cls.push('upcoming')

              const inner = (
                <>
                  <span className="trail-compact-roman">{CONCERT_ROMAN[i]}</span>
                  <span className="trail-compact-date">
                    {formatShortDate(slot.scheduledDate, season.calendar.startDate).toUpperCase()}
                  </span>
                  <span className="trail-compact-name">{slot.name}</span>
                </>
              )

              return selectable ? (
                <button
                  key={slot.index}
                  type="button"
                  className={cls.join(' ')}
                  aria-pressed={isActive}
                  onClick={() => onSelect?.(i)}
                >
                  {inner}
                </button>
              ) : (
                <div key={slot.index} className={cls.join(' ')}>
                  {inner}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <svg
        className="trail-svg"
        viewBox={`0 0 ${TRAIL_W} ${TRAIL_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Season trail"
      >
        <line x1="0" y1={TRAIL_H - 20} x2={TRAIL_W} y2={TRAIL_H - 20} stroke="var(--hairline)" strokeWidth="0.5" strokeDasharray="2 6" />
        <line x1="0" y1="20" x2={TRAIL_W} y2="20" stroke="var(--hairline)" strokeWidth="0.5" strokeDasharray="2 6" />

        {/* Full season path — soft dashed */}
        <path
          d={trailPath(LANDMARK_POS)}
          fill="none"
          stroke="var(--silver-dim)"
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.6"
        />

        {/* Resolved leg — solid pine through resolved landmarks */}
        {resolvedCount > 0 && (
          <path
            d={resolvedPath(LANDMARK_POS, resolvedCount)}
            fill="none"
            stroke="var(--pine)"
            strokeWidth="1.5"
            opacity="0.85"
          />
        )}

        {/* Landmark nodes on the path */}
        {LANDMARK_POS.map((lm, i) => (
          <circle key={i} cx={lm.x} cy={lm.y} r="2.5" fill="var(--silver)" />
        ))}
      </svg>

      <div className="trail-corner tl">
        <div className="hc-eyebrow" style={{ color: 'var(--silver)' }}>The Season</div>
        <div className="label-line">SEPT ▸ JUNE</div>
      </div>
      <div className="trail-corner bl">
        <div className="blurb">
          {resolvedCount} done · {seasonComplete ? '0 in flight' : '1 in flight'} · {Math.max(0, 4 - resolvedCount - (seasonComplete ? 0 : 1))} ahead
        </div>
        <div className="label-line">KARTTA / {season.slots[0]?.name?.split('·')[0] ?? 'SEASON'}</div>
      </div>
      <div className="trail-corner tr">
        <div className="hc-eyebrow" style={{ color: 'var(--silver-dim)' }}>NEXT TURN</div>
        <div className="blurb">{seasonComplete ? 'Season II glimpsed →' : 'IV closes the season'}</div>
      </div>
      <div className="trail-corner br">
        <div className="label-line">
          {seasonComplete ? 'SEASON CLOSED' : `${CONCERT_ROMAN[activeIdx]} IN PROGRAMMING`}
        </div>
      </div>

      {season.slots.map((slot, i) => {
        const pos = LANDMARK_POS[i]
        const xPct = (pos.x / TRAIL_W) * 100
        const yPct = (pos.y / TRAIL_H) * 100
        const isResolved = !selectable && slot.status === 'resolved'
        const isSelected = selectable && i === selectedIndex
        const isActive = selectable ? isSelected : !seasonComplete && i === activeIdx
        const planned = selectable && isComplete(i)
        const cls = ['trail-landmark']
        if (isActive) cls.push(selectable ? 'selected' : 'active')
        else if (planned) cls.push('planned')
        else if (isResolved) cls.push('resolved')
        else cls.push('upcoming')

        const body = (
          <>
            <div className="trail-diamond">
              <span className="roman">{CONCERT_ROMAN[i]}</span>
            </div>
            <div className="lm-date">{formatShortDate(slot.scheduledDate, season.calendar.startDate).toUpperCase()}</div>
            <div className="lm-name">{slot.name}</div>
            {selectable ? (
              <>
                <div className="lm-status">
                  {isSelected ? '● EDITING' : planned ? '✓ PROGRAMMED' : '○ NEEDS PROGRAM'}
                </div>
                {planned && fundingByIndex.has(i) && (() => {
                  const concert = fundingByIndex.get(i)!
                  const tone =
                    concert.coveragePercent <= 0.001 ? 'naked'
                      : concert.coveragePercent < 0.999 ? 'short'
                      : 'covered'
                  const top = [...concert.pledges]
                    .sort((a, b) => b.pledgedAmount - a.pledgedAmount)
                    .slice(0, 3)
                  const overflow = concert.pledges.length - top.length
                  return (
                    <div className="lm-funding">
                      <div className={`lm-coverage tone-${tone}`}>
                        <span className="lm-coverage-fill" style={{ width: `${Math.min(100, Math.round(concert.coveragePercent * 100))}%` }} />
                      </div>
                      <div className="lm-chips">
                        {top.map(pledge => (
                          <span key={pledge.donorId} className="lm-chip" title={`${pledge.donorName}: ${Math.round(pledge.pledgedAmount).toLocaleString()}`}>
                            {donorInitials(pledge.donorName)}
                          </span>
                        ))}
                        {overflow > 0 && <span className="lm-chip overflow">+{overflow}</span>}
                        {concert.pledges.length === 0 && <span className="lm-chip empty" title="No donor latched to this night">—</span>}
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : (
              <>
                {isResolved && slot.report && (
                  <div className="lm-status">
                    Q{Math.round(slot.report.performanceQuality)} · {slot.report.attendance.toLocaleString()} seats
                  </div>
                )}
                {isActive && <div className="lm-status">● PROGRAMMING</div>}
                {!isActive && !isResolved && <div className="lm-status">○ UPCOMING</div>}
                {isResolved && (
                  <div className="lm-headline">
                    “{slotHeadlineFallback(slot) ?? 'A capable evening.'}”
                  </div>
                )}
                {isActive && (
                  <div className="lm-headline">“In progress — open the program builder.”</div>
                )}
              </>
            )}
          </>
        )

        return selectable ? (
          <button
            key={slot.index}
            type="button"
            className={cls.join(' ')}
            style={{ left: `${xPct}%`, top: `${yPct}%` }}
            aria-pressed={isSelected}
            onClick={() => onSelect?.(i)}
          >
            {body}
          </button>
        ) : (
          <div
            key={slot.index}
            className={cls.join(' ')}
            style={{ left: `${xPct}%`, top: `${yPct}%` }}
          >
            {body}
          </div>
        )
      })}
    </div>
  )
}

function trailPath(p: { x: number; y: number }[]): string {
  return [
    `M 0 ${p[0].y + 30}`,
    `Q ${p[0].x - 40} ${p[0].y + 15}, ${p[0].x} ${p[0].y}`,
    `S ${p[1].x - 40} ${p[1].y}, ${p[1].x} ${p[1].y}`,
    `S ${p[2].x - 40} ${p[2].y}, ${p[2].x} ${p[2].y}`,
    `S ${p[3].x - 40} ${p[3].y}, ${p[3].x} ${p[3].y}`,
    `T ${TRAIL_W} ${p[3].y - 20}`,
  ].join(' ')
}

function resolvedPath(p: { x: number; y: number }[], resolvedCount: number): string {
  if (resolvedCount <= 0) return ''
  const parts: string[] = [`M 0 ${p[0].y + 30}`, `Q ${p[0].x - 40} ${p[0].y + 15}, ${p[0].x} ${p[0].y}`]
  for (let i = 1; i < Math.min(resolvedCount, p.length); i++) {
    parts.push(`S ${p[i].x - 40} ${p[i].y}, ${p[i].x} ${p[i].y}`)
  }
  return parts.join(' ')
}
