import { useMemo, useState } from 'react'
import { LIBRARY_ACQUISITION_STUBS } from '../data/consoleStubs'
import type { Era, SeasonState, Work } from '../types/core'
import CanopyHeader from './home/CanopyHeader'
import UnderstoryVitals from './home/UnderstoryVitals'
import '../styles/home.css'

type LibraryViewMode = 'catalog' | 'demand'
type LibraryEraFilter = Era | 'all'

interface LibraryScreenProps {
  season: SeasonState
  works: Work[]
  onNavigate: (key: 'home' | 'roster' | 'programme' | 'library' | 'ledger' | 'donors' | 'audience') => void
}

const ERA_OPTIONS: Array<{ value: LibraryEraFilter; label: string }> = [
  { value: 'all', label: 'All eras' },
  { value: 'baroque', label: 'Baroque' },
  { value: 'classical', label: 'Classical' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'late-romantic', label: 'Late Romantic' },
  { value: 'contemporary', label: 'Contemporary' },
]

const DEMAND_KEYS: Array<keyof Work['demands']> = ['strings', 'winds', 'brass', 'percussion']

export default function LibraryScreen({ season, works, onNavigate }: LibraryScreenProps) {
  const [era, setEra] = useState<LibraryEraFilter>('all')
  const [composer, setComposer] = useState('all')
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<LibraryViewMode>('catalog')
  const [selectedWorkId, setSelectedWorkId] = useState(() => works[0]?.id ?? '')

  const composers = useMemo(() => {
    const names = new Set(
      works
        .filter(work => era === 'all' || work.era === era)
        .map(work => work.composer),
    )
    return ['all', ...Array.from(names).sort((a, b) => a.localeCompare(b))]
  }, [era, works])

  const filteredWorks = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return works.filter(work => {
      if (era !== 'all' && work.era !== era) return false
      if (composer !== 'all' && work.composer !== composer) return false
      if (!needle) return true
      return `${work.title} ${work.composer}`.toLowerCase().includes(needle)
    })
  }, [composer, era, query, works])

  const selectedWork =
    works.find(work => work.id === selectedWorkId) ?? filteredWorks[0] ?? works[0] ?? null

  return (
    <div className="home-console">
      <div className="home-strata">
        <CanopyHeader
          institution={season.institution}
          season={season}
          activeNav="library"
          onNavigate={onNavigate}
          compact
        />
        <UnderstoryVitals institution={season.institution} />
        <div className="home-stratum floor console-screen-floor library-screen-floor">
          <section className="library-screen">
            <div className="library-head">
              <div>
                <span className="hc-eyebrow">Production library</span>
                <h2 className="library-title hc-display">Repertoire wall.</h2>
              </div>
              <div className="library-mode" aria-label="Library view mode">
                <button
                  type="button"
                  className={viewMode === 'catalog' ? 'active' : ''}
                  onClick={() => setViewMode('catalog')}
                >
                  Catalog
                </button>
                <button
                  type="button"
                  className={viewMode === 'demand' ? 'active' : ''}
                  onClick={() => setViewMode('demand')}
                >
                  Demand
                </button>
              </div>
            </div>

            <div className="library-controls" aria-label="Library filters">
              <label>
                <span className="hc-label">Era</span>
                <select value={era} onChange={event => {
                  setEra(event.target.value as LibraryEraFilter)
                  setComposer('all')
                }}>
                  {ERA_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="hc-label">Composer</span>
                <select value={composer} onChange={event => setComposer(event.target.value)}>
                  {composers.map(name => (
                    <option key={name} value={name}>
                      {name === 'all' ? 'All composers' : name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="hc-label">Search</span>
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Title or composer"
                />
              </label>
            </div>

            <div className={`library-layout ${viewMode}`}>
              <div className="library-list" aria-label="Filtered works">
                {filteredWorks.map(work => (
                  <button
                    key={work.id}
                    type="button"
                    className={`library-row ${selectedWork?.id === work.id ? 'active' : ''}`}
                    onClick={() => setSelectedWorkId(work.id)}
                  >
                    <span className="library-row-title">{work.title}</span>
                    <span className="library-row-composer">{work.composer}</span>
                    <span className="library-row-stat">{work.durationMinutes}m</span>
                    <span className="library-row-stat">P{work.artisticPrestige}</span>
                    <span className="library-row-stat">D{work.audienceDraw}</span>
                    <span className="library-row-stat">L{work.rehearsalLoad}</span>
                  </button>
                ))}
              </div>

              <aside className="library-detail" aria-label="Selected work detail">
                {selectedWork ? (
                  <>
                    <span className="hc-eyebrow">{selectedWork.era.replace('-', ' ')}</span>
                    <h3 className="library-detail-title">{selectedWork.title}</h3>
                    <p className="library-detail-copy">
                      {selectedWork.composer} · {selectedWork.durationMinutes} minutes · familiarity{' '}
                      {selectedWork.familiarity}
                    </p>
                    <DemandRadar work={selectedWork} />
                    <div className="library-stat-grid">
                      <Metric label="Prestige" value={selectedWork.artisticPrestige} />
                      <Metric label="Audience" value={selectedWork.audienceDraw} />
                      <Metric label="Donors" value={selectedWork.donorComfort} />
                      <Metric label="Novelty" value={selectedWork.novelty} />
                      <Metric label="Identity" value={selectedWork.identityValue} />
                      <Metric label="Load" value={selectedWork.rehearsalLoad} />
                    </div>
                    <div className="library-actions">
                      {LIBRARY_ACQUISITION_STUBS.map(action => (
                        <button key={action.id} type="button" disabled title={action.note}>
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="library-empty">No works match this filter.</p>
                )}
              </aside>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="library-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function DemandRadar({ work }: { work: Work }) {
  const points = DEMAND_KEYS.map((key, index) => {
    const angle = -90 + index * 90
    const radius = 18 + (work.demands[key] / 100) * 62
    const radians = (angle * Math.PI) / 180
    return `${90 + Math.cos(radians) * radius},${90 + Math.sin(radians) * radius}`
  }).join(' ')

  return (
    <div className="library-radar">
      <svg viewBox="0 0 180 180" role="img" aria-label="Selected work section demand radar">
        <polygon points="90,20 160,90 90,160 20,90" className="radar-frame" />
        <polygon points="90,45 135,90 90,135 45,90" className="radar-frame inner" />
        <line x1="90" y1="20" x2="90" y2="160" />
        <line x1="20" y1="90" x2="160" y2="90" />
        <polygon points={points} className="radar-demand" />
      </svg>
      <div className="library-radar-label top">Strings {work.demands.strings}</div>
      <div className="library-radar-label right">Winds {work.demands.winds}</div>
      <div className="library-radar-label bottom">Brass {work.demands.brass}</div>
      <div className="library-radar-label left">Perc. {work.demands.percussion}</div>
    </div>
  )
}
