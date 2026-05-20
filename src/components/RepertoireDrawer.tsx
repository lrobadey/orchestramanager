import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, PanInfo } from 'framer-motion'
import { Era, Work } from '../types/core'

interface RepertoireDrawerProps {
  open: boolean
  onClose: () => void
  works: Work[]
  usedIds: Set<string>
  onDragStart: () => void
  onDragEnd: (id: string, point: { x: number; y: number }) => void
}

const ERA_ORDER: Era[] = ['classical', 'romantic', 'late-romantic', 'contemporary']
const ERA_LABELS: Record<Era, string> = {
  classical: 'Classical',
  romantic: 'Romantic',
  'late-romantic': 'Late Romantic',
  contemporary: 'Contemporary',
}

const DEFAULT_HEIGHT = 380
const MIN_HEIGHT = 220

function sortWorksForComposer(a: Work, b: Work): number {
  const aMatch = a.title.match(/Symphony No\. (\d+)/)
  const bMatch = b.title.match(/Symphony No\. (\d+)/)
  if (aMatch && bMatch) return Number(aMatch[1]) - Number(bMatch[1])
  if (aMatch) return -1
  if (bMatch) return 1
  return a.title.localeCompare(b.title)
}

export default function RepertoireDrawer({
  open,
  onClose,
  works,
  usedIds,
  onDragStart,
  onDragEnd,
}: RepertoireDrawerProps) {
  const [selectedEra, setSelectedEra] = useState<Era>('romantic')
  const [selectedComposer, setSelectedComposer] = useState<string>('Beethoven')
  const [search, setSearch] = useState('')
  const [sheetHeight, setSheetHeight] = useState(DEFAULT_HEIGHT)

  const startY = useRef(0)
  const startH = useRef(0)

  function onMove(e: MouseEvent) {
    const delta = startY.current - e.clientY
    const next = Math.max(MIN_HEIGHT, Math.min(window.innerHeight * 0.75, startH.current + delta))
    setSheetHeight(next)
  }

  function stopResize() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', stopResize)
  }

  function startResize(e: React.MouseEvent) {
    e.preventDefault()
    startY.current = e.clientY
    startH.current = sheetHeight
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', stopResize)
  }

  useEffect(() => () => stopResize(), [])

  const eras = ERA_ORDER.filter(era => works.some(w => w.era === era))
  const worksInEra = works.filter(w => w.era === selectedEra)
  const composers = Array.from(new Set(worksInEra.map(w => w.composer))).sort((a, b) =>
    a.localeCompare(b),
  )
  if (!composers.includes(selectedComposer) && composers.length > 0) {
    setSelectedComposer(composers[0])
  }
  const searchTerm = search.trim().toLowerCase()
  const visibleWorks = worksInEra
    .filter(w => w.composer === selectedComposer)
    .filter(w => {
      if (!searchTerm) return true
      const searchable = `${w.title} ${w.composer} ${ERA_LABELS[w.era]}`.toLowerCase()
      return searchable.includes(searchTerm)
    })
    .sort(sortWorksForComposer)

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="rep-backdrop" onClick={onClose} />
          <motion.section
            className="repertoire-shelf"
            style={{ height: sheetHeight }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            aria-label="Repertoire shelf"
          >
            <div className="rep-resize-handle" onMouseDown={startResize} />

            <div className="rep-filters-block">
              <div className="repertoire-shelf-title">
                <span className="eyebrow">Library</span>
                <h2>Repertoire</h2>
              </div>
              <label className="rep-search">
                <span className="rep-filter-label">Search</span>
                <input
                  type="search"
                  value={search}
                  placeholder="Title, composer, or era"
                  onChange={e => setSearch(e.target.value)}
                />
              </label>
              <div className="rep-filter-group">
                <span className="rep-filter-label">Era</span>
                <div className="rep-filters-row">
                  {eras.map(era => (
                    <button
                      key={era}
                      type="button"
                      className={`rep-chip ${selectedEra === era ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedEra(era)
                        const newComposers = Array.from(new Set(works.filter(w => w.era === era).map(w => w.composer))).sort()
                        setSelectedComposer(newComposers[0] ?? '')
                      }}
                    >
                      {ERA_LABELS[era]}
                      <span className="rep-chip-count">{works.filter(w => w.era === era).length}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rep-filter-group">
                <span className="rep-filter-label">Composer</span>
                <div className="rep-filters-row">
                  {composers.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`rep-chip ${selectedComposer === c ? 'active' : ''}`}
                      onClick={() => setSelectedComposer(c)}
                    >
                      {c}
                      <span className="rep-chip-count">
                        {worksInEra.filter(w => w.composer === c).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="drawer-close" onClick={onClose}>
                Close
              </button>
            </div>

            <div className="rep-list">
              {visibleWorks.map(w => {
                const used = usedIds.has(w.id)
                return (
                  <motion.div
                    key={w.id}
                    className={`rep-item ${used ? 'used' : ''}`}
                    drag={!used}
                    dragSnapToOrigin
                    dragElastic={0.6}
                    whileDrag={{ scale: 1.04, zIndex: 100, opacity: 0.92 }}
                    onDragStart={onDragStart}
                    onDragEnd={(_, info: PanInfo) => onDragEnd(w.id, info.point)}
                  >
                    <span className="rep-item-composer">{w.composer}</span>
                    <span className="rep-item-title">{w.title}</span>
                    <div className="rep-item-meta">
                      <span>{w.durationMinutes}m</span>
                      <span>Load {w.rehearsalLoad}</span>
                      <span>Draw {w.audienceDraw}</span>
                      <span>Prestige {w.artisticPrestige}</span>
                      <span>Donor {w.donorComfort}</span>
                      <span>Novelty {w.novelty}</span>
                      <span className={`rep-item-tag ${w.isContemporary ? '' : 'canon'}`}>
                        {w.isContemporary ? 'New' : 'Canon'}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
              {visibleWorks.length === 0 && (
                <p className="text-muted" style={{ padding: '1.5rem 0' }}>
                  No works under this filter.
                </p>
              )}
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  )
}
