import { SeasonState } from '../types/core'

interface SeasonTimelineProps {
  season: SeasonState
}

export default function SeasonTimeline({ season }: SeasonTimelineProps) {
  const complete = season.currentSlotIndex >= 4

  return (
    <div className="season-timeline">
      {season.slots.map((slot, i) => {
        const isActive = !complete && i === season.currentSlotIndex
        const isResolved = slot.status === 'resolved'
        const cls = isResolved
          ? 'slot-chip slot-resolved'
          : isActive
            ? 'slot-chip slot-active'
            : 'slot-chip slot-pending'

        return (
          <div key={slot.index} className={cls}>
            <span className="slot-marker">
              {isResolved ? '✓' : isActive ? '→' : '○'}
            </span>
            <span className="slot-name">{slot.name}</span>
          </div>
        )
      })}
    </div>
  )
}
