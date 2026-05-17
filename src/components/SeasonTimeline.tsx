import { Fragment } from 'react'
import { SeasonState } from '../types/core'

interface SeasonTimelineProps {
  season: SeasonState
}

const MONTHS = ['SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN']

// Four concerts positioned across the season (as fraction of axis width)
// Months: Sep(0%) Oct(10%) Nov(20%) Dec(30%) Jan(40%) Feb(50%) Mar(60%) Apr(70%) May(80%) Jun(90%)
const SLOT_POSITIONS = [0.15, 0.45, 0.65, 0.85]

export default function SeasonTimeline({ season }: SeasonTimelineProps) {
  const complete = season.currentSlotIndex >= 4

  return (
    <>
      <span className="topbar-label">Season Timeline</span>
      <div className="season-timeline">
        <div className="season-timeline-months">
          {MONTHS.map(m => (
            <div key={m} className="season-timeline-month">{m}</div>
          ))}
        </div>
        <div className="season-timeline-axis">
          {season.slots.map((slot, i) => {
            const isActive = !complete && i === season.currentSlotIndex
            const isResolved = slot.status === 'resolved'
            const state = isResolved ? 'resolved' : isActive ? 'active' : 'pending'
            const left = `${SLOT_POSITIONS[i] * 100}%`
            return (
              <Fragment key={slot.index}>
                <span
                  className={`season-timeline-dot ${state}`}
                  style={{ left }}
                />
                <span
                  className={`season-timeline-label ${state}`}
                  style={{ left }}
                >
                  {slot.name}
                </span>
              </Fragment>
            )
          })}
        </div>
      </div>
      <div className="topbar-meta">
        <span className="topbar-meta-label">Season Draft</span>
        <span>Version {complete ? 'final' : `${season.currentSlotIndex + 1}.0`}</span>
      </div>
    </>
  )
}
