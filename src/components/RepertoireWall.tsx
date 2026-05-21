import { useMemo, useState } from 'react'
import { motion, PanInfo } from 'framer-motion'
import { Era, Work } from '../types/core'

interface RepertoireWallProps {
  works: Work[]
  usedIds: Set<string>
  onDragStart: () => void
  onDragEnd: (id: string, point: { x: number; y: number }) => void
  onClickWork: (id: string) => void
}

const ERA_ORDER: Era[] = ['classical', 'romantic', 'late-romantic', 'contemporary']
const ERA_LABELS: Record<Era, string> = {
  classical: 'Classical',
  romantic: 'Romantic',
  'late-romantic': 'Late Romantic',
  contemporary: 'Contemporary',
}
const ERA_SHORT: Record<Era, string> = {
  classical: 'Class',
  romantic: 'Rom',
  'late-romantic': 'L·Rom',
  contemporary: 'Cont',
}

export default function RepertoireWall({
  works,
  usedIds,
  onDragStart,
  onDragEnd,
  onClickWork,
}: RepertoireWallProps) {
  const [eraFilter, setEraFilter] = useState<Era | 'all'>('all')
  const [search, setSearch] = useState('')

  const filteredWorks = useMemo(() => {
    let list = works
    if (eraFilter !== 'all') list = list.filter(w => w.era === eraFilter)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(w => `${w.title} ${w.composer}`.toLowerCase().includes(q))
    return list
  }, [works, eraFilter, search])

  const byEra = useMemo(() => {
    const groups: Partial<Record<Era, Work[]>> = {}
    for (const w of filteredWorks) {
      ;(groups[w.era] ??= []).push(w)
    }
    return groups
  }, [filteredWorks])

  return (
    <section className="repertoire-wall">
      <div className="rep-wall-header">
        <span className="eyebrow">The Library</span>
        <span className="rep-wall-count">{filteredWorks.length} works · drag or click</span>
      </div>

      <div className="rep-wall-controls">
        <input
          type="text"
          className="rep-wall-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="search composer / title"
        />
        <div className="rep-era-chips">
          {(['all', ...ERA_ORDER] as Array<Era | 'all'>).map(era => {
            const count = era === 'all' ? works.length : works.filter(w => w.era === era).length
            const isActive = eraFilter === era
            const toneClass = era !== 'all' ? `era-tone-${era.replace('-', '')}` : ''
            return (
              <button
                key={era}
                type="button"
                className={`rep-wall-chip ${toneClass} ${isActive ? 'active' : ''}`}
                onClick={() => setEraFilter(era)}
              >
                {era === 'all' ? 'All' : ERA_SHORT[era]}
                <span className="rep-chip-count"> {count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rep-wall-list">
        {ERA_ORDER.map(era => {
          const items = byEra[era]
          if (!items?.length) return null
          return (
            <div key={era} className="rep-era-group">
              <div className={`rep-era-header era-tone-${era.replace('-', '')}`}>
                <span className="eyebrow">{ERA_LABELS[era]}</span>
                <span className="rep-wall-count">{items.length}</span>
              </div>
              {items.map(w => {
                const used = usedIds.has(w.id)
                return (
                  <motion.div
                    key={w.id}
                    className={`rep-tile era-border-${w.era.replace('-', '')} ${used ? 'used' : ''}`}
                    drag={!used}
                    dragSnapToOrigin
                    dragElastic={0.6}
                    whileDrag={{ scale: 1.04, zIndex: 100, opacity: 0.92 }}
                    onDragStart={onDragStart}
                    onDragEnd={(_: unknown, info: PanInfo) => onDragEnd(w.id, info.point)}
                    onClick={used ? undefined : () => onClickWork(w.id)}
                  >
                    <div className="rep-tile-composer">{w.composer}</div>
                    <div className="rep-tile-title">{w.title}</div>
                    <div className="rep-tile-meta">
                      <span>{w.durationMinutes}m</span>
                      <span>P{w.artisticPrestige}</span>
                      <span>D{w.audienceDraw}</span>
                      <span className={w.rehearsalLoad > 60 ? 'rep-meta-heavy' : ''}>
                        L{w.rehearsalLoad}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )
        })}
        {filteredWorks.length === 0 && (
          <p className="rep-wall-empty">No works match this filter.</p>
        )}
      </div>
    </section>
  )
}
