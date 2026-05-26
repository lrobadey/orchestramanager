import type { SeasonState } from '../../types/core'
import { TRAIL_ANNOTATIONS, slotHeadlineFallback } from '../../data/homeStubs'
import { formatShortDate } from '../../sim/calendar'
import { CONCERT_ROMAN } from '../../data/numerals'

interface SeasonTrailProps {
  season: SeasonState
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

// Annotation anchor positions in trail-space, keyed by the landmark index
// the annotation attaches to. Decoupled from TRAIL_ANNOTATIONS array order
// so the source data can be reordered without misaligning leader lines.
const ANNOTATION_POS: Record<0 | 1 | 2 | 3, { x: number; y: number }> = {
  0: { x: 120, y: 14 },
  1: { x: 440, y: 10 },
  2: { x: 780, y: 10 },
  3: { x: 1150, y: 14 },
}

export default function SeasonTrail({ season }: SeasonTrailProps) {
  const resolvedCount = season.slots.filter(s => s.status === 'resolved').length
  const activeIdx = Math.min(season.currentSlotIndex, 3)
  const seasonComplete = season.currentSlotIndex >= 4

  return (
    <div className="home-stratum trail">
      <div className="trail-contours" />
      <div className="trail-grid" />

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

        {/* Leader lines from annotations to landmarks */}
        {TRAIL_ANNOTATIONS.map((a, i) => {
          const lm = LANDMARK_POS[a.lmIndex]
          const an = ANNOTATION_POS[a.lmIndex] ?? { x: lm.x, y: 18 }
          return (
            <g key={i}>
              <path
                d={`M ${an.x} ${an.y} L ${(an.x + lm.x) / 2} ${(an.y + lm.y) / 2} L ${lm.x} ${lm.y}`}
                fill="none"
                stroke="var(--silver-dim)"
                strokeWidth="0.7"
                opacity="0.55"
              />
              <circle cx={lm.x} cy={lm.y} r="2.5" fill="var(--silver)" />
            </g>
          )
        })}
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
        const isActive = !seasonComplete && i === activeIdx
        const isResolved = slot.status === 'resolved'
        const cls = ['trail-landmark']
        if (isActive) cls.push('active')
        else if (isResolved) cls.push('resolved')
        else cls.push('upcoming')

        return (
          <div
            key={slot.index}
            className={cls.join(' ')}
            style={{ left: `${xPct}%`, top: `${yPct}%` }}
          >
            <div className="trail-diamond">
              <span className="roman">{CONCERT_ROMAN[i]}</span>
            </div>
            <div className="lm-date">{formatShortDate(slot.scheduledDate, season.calendar.startDate).toUpperCase()}</div>
            <div className="lm-name">{slot.name}</div>
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
          </div>
        )
      })}

      {TRAIL_ANNOTATIONS.map((a, i) => {
        const pos = ANNOTATION_POS[a.lmIndex] ?? { x: 0, y: 0 }
        const xPct = (pos.x / TRAIL_W) * 100
        const yPct = (pos.y / TRAIL_H) * 100
        return (
          <div
            key={i}
            className="trail-annotation"
            style={{ left: `${xPct}%`, top: `${yPct}%` }}
          >
            <div className="anno-meta">
              <span className="anno-kind">{a.kind}</span>
              <span className="anno-tick" />
            </div>
            <div className="anno-text">{a.text}</div>
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
