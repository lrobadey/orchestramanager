import { useState } from 'react'
import { motion, PanInfo } from 'framer-motion'
import { Era, Work } from '../types/core'
import Drawer from './Drawer'

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

  const eras = ERA_ORDER.filter(era => works.some(w => w.era === era))
  const worksInEra = works.filter(w => w.era === selectedEra)
  const composers = Array.from(new Set(worksInEra.map(w => w.composer))).sort((a, b) =>
    a.localeCompare(b),
  )
  if (!composers.includes(selectedComposer) && composers.length > 0) {
    setSelectedComposer(composers[0])
  }
  const visibleWorks = worksInEra
    .filter(w => w.composer === selectedComposer)
    .sort(sortWorksForComposer)

  return (
    <Drawer open={open} title="Repertoire" onClose={onClose}>
      <div className="rep-filters-block">
        <div className="rep-filter-label">Era</div>
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
        <div className="rep-filter-label">Composer</div>
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
    </Drawer>
  )
}
