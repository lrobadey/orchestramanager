import { Work } from '../types/core'

interface ProgramBuilderProps {
  works: Work[]
  selectedIds: string[]
  rehearsalHours: number
  marketingSpend: number
  ticketPrice: number
  onToggleWork: (id: string) => void
  onRehearsalChange: (hours: number) => void
  onMarketingChange: (spend: number) => void
  onPriceChange: (price: number) => void
  onGetForecast: () => void
}

function eraTag(work: Work) {
  if (work.isContemporary) return <span className="tag tag-contemporary">Contemporary</span>
  return <span className="tag tag-canon">Canon</span>
}

function statBar(label: string, value: number) {
  return (
    <span className="work-stat" title={label}>
      {label[0]}&thinsp;
      <span className="work-stat-val" style={{ opacity: 0.4 + (value / 100) * 0.6 }}>
        {'█'.repeat(Math.round(value / 20))}{'░'.repeat(5 - Math.round(value / 20))}
      </span>
    </span>
  )
}

export default function ProgramBuilder({
  works,
  selectedIds,
  rehearsalHours,
  marketingSpend,
  ticketPrice,
  onToggleWork,
  onRehearsalChange,
  onMarketingChange,
  onPriceChange,
  onGetForecast,
}: ProgramBuilderProps) {
  const canon = works.filter(w => !w.isContemporary)
  const contemporary = works.filter(w => w.isContemporary)
  const canSelect = selectedIds.length < 3

  function renderWork(work: Work) {
    const selected = selectedIds.includes(work.id)
    const disabled = !selected && !canSelect
    return (
      <li
        key={work.id}
        className={`work-item${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
        onClick={() => !disabled && onToggleWork(work.id)}
        role="checkbox"
        aria-checked={selected}
        tabIndex={0}
        onKeyDown={e => e.key === ' ' && !disabled && onToggleWork(work.id)}
      >
        <span className="work-check">{selected ? '✓' : '○'}</span>
        <span className="work-info">
          <span className="work-title">{work.title}</span>
          <span className="work-composer">{work.composer}</span>
        </span>
        <span className="work-stats">
          {statBar('Draw', work.audienceDraw)}
          {statBar('Prestige', work.artisticPrestige)}
          {statBar('Novelty', work.novelty)}
          {statBar('Load', work.rehearsalLoad)}
        </span>
        <span className="work-duration">{work.durationMinutes}m</span>
        {eraTag(work)}
      </li>
    )
  }

  const totalDuration = selectedIds
    .map(id => works.find(w => w.id === id))
    .filter(Boolean)
    .reduce((sum, w) => sum + w!.durationMinutes, 0)

  return (
    <div>
      <div className="panel-row" style={{ alignItems: 'baseline', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Program Builder</h2>
        <span className="text-muted" style={{ fontSize: '0.82rem' }}>
          {selectedIds.length}/3 works selected
          {totalDuration > 0 && ` · ${totalDuration} min`}
        </span>
      </div>

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.6rem', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Canon Repertoire
        </h3>
        <ul className="work-list">{canon.map(renderWork)}</ul>
      </div>

      <div className="panel" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.6rem', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Contemporary Works
        </h3>
        <ul className="work-list">{contemporary.map(renderWork)}</ul>
      </div>

      <div className="panel">
        <h3 style={{ marginBottom: '1rem' }}>Production Parameters</h3>

        <div className="slider-row">
          <span className="slider-label">Rehearsal Hours</span>
          <input
            type="range"
            min={40}
            max={120}
            step={5}
            value={rehearsalHours}
            onChange={e => onRehearsalChange(Number(e.target.value))}
          />
          <span className="slider-value">{rehearsalHours} hrs</span>
        </div>

        <div className="slider-row">
          <span className="slider-label">Marketing Spend</span>
          <input
            type="range"
            min={5000}
            max={30000}
            step={1000}
            value={marketingSpend}
            onChange={e => onMarketingChange(Number(e.target.value))}
          />
          <span className="slider-value">${(marketingSpend / 1000).toFixed(0)}k</span>
        </div>

        <div className="slider-row">
          <span className="slider-label">Ticket Price</span>
          <input
            type="range"
            min={20}
            max={120}
            step={5}
            value={ticketPrice}
            onChange={e => onPriceChange(Number(e.target.value))}
          />
          <span className="slider-value">${ticketPrice}</span>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <button onClick={onGetForecast} disabled={selectedIds.length !== 3}>
            {selectedIds.length < 3
              ? `Select ${3 - selectedIds.length} more work${3 - selectedIds.length !== 1 ? 's' : ''}`
              : 'Get Forecast →'}
          </button>
        </div>
      </div>
    </div>
  )
}
