import { SeasonState } from '../types/core'

interface SeasonTimelineProps {
  season: SeasonState
}

export default function SeasonTimeline({ season }: SeasonTimelineProps) {
  const complete = season.currentSlotIndex >= 4

  return (
    <div className="season-dots" aria-label="Season progress">
      {season.slots.map((slot, i) => {
        const isActive = !complete && i === season.currentSlotIndex
        const isResolved = slot.status === 'resolved'
        const cls = isResolved ? 'season-dot done' : isActive ? 'season-dot active' : 'season-dot'
        return <span key={slot.index} className={cls} title={slot.name} />
      })}
    </div>
  )
}
