import { Work } from '../types/core'
import MovementCard from './MovementCard'
import ProgramArcViz from './ProgramArcViz'
import { flavorForSlot } from './concertFlavor'
import { gradientForWork } from './movementGradients'

interface ProgramBuilderProps {
  works: Work[]
  selectedIds: string[]
  rehearsalHours: number
  marketingSpend: number
  ticketPrice: number
  slotIndex: number
  slotName: string
  onToggleWork: (id: string) => void
  onRehearsalChange: (hours: number) => void
  onMarketingChange: (spend: number) => void
  onPriceChange: (price: number) => void
  onGetForecast: () => void
}

export default function ProgramBuilder({
  works,
  selectedIds,
  rehearsalHours,
  marketingSpend,
  ticketPrice,
  slotIndex,
  slotName,
  onToggleWork,
  onRehearsalChange,
  onMarketingChange,
  onPriceChange,
  onGetForecast,
}: ProgramBuilderProps) {
  const canSelect = selectedIds.length < 3
  const flavor = flavorForSlot(slotIndex)
  const selectedWorks = selectedIds
    .map(id => works.find(w => w.id === id))
    .filter((w): w is Work => w !== undefined)
  const totalDuration = selectedWorks.reduce((sum, w) => sum + w.durationMinutes, 0)

  return (
    <div>
      <div className="book-page elevated">
        <div className="concert-header">
          <div>
            <div className="concert-slot-name">{slotName}</div>
            <div className="concert-title">{flavor.title}</div>
            <div className="concert-meta">{flavor.date}<br />{flavor.venue}</div>
            <p className="concert-flavor">{flavor.blurb}</p>
          </div>
          <div className="quality-crest">
            <div className="quality-crest-label">Concert {slotIndex + 1} of 4</div>
            <div className="quality-crest-wreath">
              <div className="quality-crest-value">{selectedIds.length}/3</div>
            </div>
            <div className="quality-crest-band">{totalDuration > 0 ? `${totalDuration} minutes` : 'Choose your works'}</div>
          </div>
        </div>

        {selectedWorks.length > 0 && <ProgramArcViz labels={flavor.movementNames} />}

        {selectedWorks.length > 0 && (
          <div className="movement-grid">
            {[0, 1, 2].map(i => {
              const work = selectedWorks[i]
              if (!work) {
                return (
                  <div key={i} className="movement-card" style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', opacity: 0.45 }}>
                    <span className="label-small-caps">Choose work {i + 1}</span>
                  </div>
                )
              }
              return (
                <MovementCard
                  key={work.id}
                  movement={i + 1}
                  movementName={flavor.movementNames[i]}
                  work={work}
                  onClick={() => onToggleWork(work.id)}
                  selected
                />
              )
            })}
          </div>
        )}
      </div>

      <div className="book-page">
        <h2 className="section-title">Repertoire</h2>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem', fontStyle: 'italic' }}>
          Select three works to shape the evening.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {works.map(work => {
            const selected = selectedIds.includes(work.id)
            const disabled = !selected && !canSelect
            return (
              <div
                key={work.id}
                className={`movement-card-mini${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                onClick={() => !disabled && onToggleWork(work.id)}
                role="checkbox"
                aria-checked={selected}
                tabIndex={0}
                onKeyDown={e => e.key === ' ' && !disabled && onToggleWork(work.id)}
              >
                <div
                  className="movement-mini-stripe"
                  style={{ background: gradientForWork(work.era, work.audienceDraw) }}
                />
                <div className="movement-mini-info">
                  <span className="movement-mini-title">{work.title}</span>
                  <span className="movement-mini-composer">{work.composer}</span>
                </div>
                <div className="movement-mini-meta">
                  <span>{work.durationMinutes}m</span>
                  <span>Draw {work.audienceDraw}</span>
                  <span>Load {work.rehearsalLoad}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="book-page">
        <h2 className="section-title">Production Parameters</h2>
        <div className="params-grid">
          <div className="param-row">
            <div className="param-label">
              <span>Rehearsal Hours</span>
              <span className="param-value">{rehearsalHours} hrs</span>
            </div>
            <input
              type="range"
              min={40}
              max={120}
              step={5}
              value={rehearsalHours}
              onChange={e => onRehearsalChange(Number(e.target.value))}
            />
          </div>

          <div className="param-row">
            <div className="param-label">
              <span>Marketing Spend</span>
              <span className="param-value">${(marketingSpend / 1000).toFixed(0)}k</span>
            </div>
            <input
              type="range"
              min={5000}
              max={30000}
              step={1000}
              value={marketingSpend}
              onChange={e => onMarketingChange(Number(e.target.value))}
            />
          </div>

          <div className="param-row">
            <div className="param-label">
              <span>Ticket Price</span>
              <span className="param-value">${ticketPrice}</span>
            </div>
            <input
              type="range"
              min={20}
              max={120}
              step={5}
              value={ticketPrice}
              onChange={e => onPriceChange(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="book-divider-gold" />

        <div className="row-between">
          <span className="text-muted text-italic" style={{ fontSize: '0.85rem' }}>
            {selectedIds.length === 3
              ? 'The program is set. Review the forecast before committing.'
              : `Choose ${3 - selectedIds.length} more work${3 - selectedIds.length !== 1 ? 's' : ''} to continue.`}
          </span>
          <button onClick={onGetForecast} disabled={selectedIds.length !== 3}>
            Review Forecast →
          </button>
        </div>
      </div>

      <div className="book-footer-flourish">
        Great orchestras aren't built by accident. They are composed.
      </div>
    </div>
  )
}
