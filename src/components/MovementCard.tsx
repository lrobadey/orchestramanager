import { Work } from '../types/core'
import { gradientForWork, flavorForWork } from './movementGradients'

interface MovementCardProps {
  movement: number
  movementName: string
  work: Work
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
}

function eraLabel(era: Work['era']): string {
  switch (era) {
    case 'classical': return 'Classical'
    case 'romantic': return 'Romantic Favorite'
    case 'late-romantic': return 'Late Romantic'
    case 'contemporary': return 'Contemporary'
  }
}

function appealClass(draw: number): { cls: string; label: string } {
  if (draw >= 75) return { cls: 'high', label: 'High' }
  if (draw >= 45) return { cls: 'medium', label: 'Medium' }
  return { cls: 'low', label: 'Low' }
}

const MOVEMENT_ROMAN = ['I', 'II', 'III', 'IV']

export default function MovementCard({
  movement,
  movementName,
  work,
  onClick,
  selected,
  disabled,
}: MovementCardProps) {
  const gradient = gradientForWork(work.era, work.audienceDraw)
  const appeal = appealClass(work.audienceDraw)
  const flavor = flavorForWork(work.era, work.audienceDraw)

  const className =
    'movement-card' +
    (onClick ? ' selectable' : '') +
    (selected ? ' selected' : '') +
    (disabled ? ' disabled' : '')

  return (
    <div
      className={className}
      onClick={disabled ? undefined : onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={onClick && !disabled ? e => { if (e.key === ' ' || e.key === 'Enter') onClick() } : undefined}
    >
      <div className="movement-card-header" style={{ background: gradient }}>
        <span>{MOVEMENT_ROMAN[movement - 1] ?? movement}. {movementName}</span>
        <span>···</span>
      </div>
      <div className="movement-card-image" style={{ background: gradient }} />
      <div className="movement-card-body">
        <span className="movement-card-composer">{work.composer}</span>
        <span className="movement-card-title">{work.title}</span>
        <span className="movement-card-flavor">{flavor}</span>
      </div>
      <div className="movement-card-footer">
        <span className="movement-tag">{eraLabel(work.era)}</span>
        <span className="movement-appeal">
          Audience Appeal
          <span className={`movement-appeal-value ${appeal.cls}`}>{appeal.label}</span>
        </span>
      </div>
    </div>
  )
}
