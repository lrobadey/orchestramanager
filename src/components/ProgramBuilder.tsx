import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  ConcertForecast,
  ConcertProgram,
  SlotTuple,
  TOTAL_REHEARSAL_HOURS,
  Work,
} from '../types/core'
import { rehearsalHoursNeeded } from '../sim/scoring'

interface ProgramBuilderProps {
  works: Work[]
  program: ConcertProgram
  forecast: ConcertForecast
  onProgramChange: (next: ConcertProgram) => void
  onRunConcert: () => void
}

const SLOT_COUNT = 3
const DURATION_BAR_MAX_MIN = 150

function riskTone(risk: number | null): string {
  if (risk === null) return ''
  if (risk <= 25) return 'tone-low'
  if (risk <= 55) return 'tone-med'
  return 'tone-high'
}

function findWork(works: Work[], id: string | null): Work | null {
  if (!id) return null
  return works.find(w => w.id === id) ?? null
}

// ── Slot card (drop target + draggable when filled) ─────────────────────────

interface SlotCardProps {
  index: number
  work: Work | null
  perWorkRisk: number | null
  hours: number
  onDragEnd: (point: { x: number; y: number }) => void
  registerRef: (el: HTMLDivElement | null) => void
}

function SlotCard({
  index,
  work,
  perWorkRisk,
  hours,
  onDragEnd,
  registerRef,
}: SlotCardProps) {
  return (
    <div ref={registerRef} className={`slot-card${work ? ' slot-card-filled' : ''}`}>
      <AnimatePresence mode="wait">
        {work ? (
          <motion.div
            key={work.id}
            className="slot-piece"
            initial={{ opacity: 0, scale: 0.94, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.18 }}
            drag
            dragSnapToOrigin
            dragElastic={0.7}
            whileDrag={{ scale: 1.04, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
            onDragEnd={(_, info: PanInfo) => onDragEnd(info.point)}
          >
            <div className="slot-piece-header">
              <span className="slot-number">{index + 1}</span>
              <span className="slot-piece-title">{work.title}</span>
              {perWorkRisk !== null && (
                <span className={`slot-risk-badge ${riskTone(perWorkRisk)}`}>
                  risk {Math.round(perWorkRisk)}
                </span>
              )}
            </div>
            <div className="slot-piece-meta">
              <span className="slot-piece-composer">{work.composer}</span>
              <span className="slot-piece-spacer" />
              <span className="slot-piece-duration">{work.durationMinutes} min</span>
              <span className="slot-piece-rehearsal">
                {hours}h / {rehearsalHoursNeeded(work.rehearsalLoad)}h rehearsal
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="slot-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <span className="slot-number">{index + 1}</span>
            <span className="slot-empty-label">drop a piece here</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Intermission toggle row ─────────────────────────────────────────────────

interface IntermissionToggleProps {
  position: 0 | 1
  active: boolean
  onToggle: () => void
}

function IntermissionToggle({ position, active, onToggle }: IntermissionToggleProps) {
  return (
    <button
      type="button"
      className={`intermission-toggle${active ? ' intermission-active' : ''}`}
      onClick={onToggle}
      aria-pressed={active}
    >
      <span className="intermission-check">{active ? '✓' : ''}</span>
      <span className="intermission-label">
        Intermission after Piece {position + 1}
      </span>
    </button>
  )
}

// ── Animated duration bar ───────────────────────────────────────────────────

interface DurationBarProps {
  slotWorks: SlotTuple<Work | null>
  intermissionAfter: 0 | 1 | null
}

const INTERMISSION_MIN = 15

function DurationBar({ slotWorks, intermissionAfter }: DurationBarProps) {
  const musicMin = slotWorks.reduce((sum, w) => sum + (w?.durationMinutes ?? 0), 0)
  const ticks = [30, 60, 90, 120]
  const intermissionMin = intermissionAfter !== null && slotWorks[intermissionAfter] !== null
    ? INTERMISSION_MIN
    : 0
  const totalMin = musicMin + intermissionMin
  const denom = Math.max(DURATION_BAR_MAX_MIN, totalMin + 10)

  let cursor = 0
  const segments: { width: number; left: number; key: string; color: string }[] = []
  const palette = ['var(--accent)', 'var(--accent-soft)', 'var(--accent)']
  slotWorks.forEach((w, i) => {
    if (!w) return
    const widthPct = (w.durationMinutes / denom) * 100
    const leftPct = (cursor / denom) * 100
    segments.push({ width: widthPct, left: leftPct, key: `slot-${i}`, color: palette[i] })
    cursor += w.durationMinutes
    if (intermissionAfter === i) cursor += INTERMISSION_MIN
  })

  return (
    <div className="duration-bar-wrapper">
      <div className="duration-bar">
        {segments.map(seg => (
          <motion.div
            key={seg.key}
            className="duration-segment"
            style={{ background: seg.color }}
            initial={false}
            animate={{ left: `${seg.left}%`, width: `${seg.width}%` }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          />
        ))}
        {ticks.map(t => (
          <div
            key={t}
            className="duration-tick"
            style={{ left: `${(t / denom) * 100}%` }}
          >
            <span className="duration-tick-label">{t}</span>
          </div>
        ))}
      </div>
      <div className="duration-total">
        <motion.span
          key={totalMin}
          className="duration-total-num"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {totalMin}
        </motion.span>
        <span className="duration-total-unit">
          {intermissionMin > 0
            ? `${musicMin} music + ${intermissionMin} intermission`
            : 'min of music'}
        </span>
      </div>
    </div>
  )
}

// ── Rehearsal allocator (20 hrs split by 2 draggable markers) ───────────────

interface RehearsalAllocatorProps {
  allocation: SlotTuple<number>
  slotWorks: SlotTuple<Work | null>
  perWorkPressure: SlotTuple<number | null>
  onChange: (next: SlotTuple<number>) => void
}

function RehearsalAllocator({
  allocation,
  slotWorks,
  perWorkPressure,
  onChange,
}: RehearsalAllocatorProps) {
  const [dragging, setDragging] = useState<0 | 1 | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const m1 = allocation[0]
  const m2 = m1 + allocation[1]

  useEffect(() => {
    if (dragging === null) return

    function handleMove(e: PointerEvent) {
      if (!barRef.current) return
      const rect = barRef.current.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      const hours = Math.round(Math.max(0, Math.min(1, ratio)) * TOTAL_REHEARSAL_HOURS)
      if (dragging === 0) {
        const newM1 = Math.max(1, Math.min(m2 - 1, hours))
        onChange([newM1, m2 - newM1, TOTAL_REHEARSAL_HOURS - m2])
      } else {
        const newM2 = Math.max(m1 + 1, Math.min(TOTAL_REHEARSAL_HOURS - 1, hours))
        onChange([m1, newM2 - m1, TOTAL_REHEARSAL_HOURS - newM2])
      }
    }
    function handleUp() {
      setDragging(null)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [dragging, m1, m2, onChange])

  return (
    <div className="rehearsal-allocator">
      <div className="rehearsal-header">
        <span className="rehearsal-title">Rehearsal Time</span>
        <span className="rehearsal-budget">{TOTAL_REHEARSAL_HOURS} hrs across {SLOT_COUNT} pieces</span>
      </div>
      <div ref={barRef} className="rehearsal-bar">
        {[0, 1, 2].map(i => {
          const start = i === 0 ? 0 : i === 1 ? m1 : m2
          const end = i === 0 ? m1 : i === 1 ? m2 : TOTAL_REHEARSAL_HOURS
          const left = (start / TOTAL_REHEARSAL_HOURS) * 100
          const width = ((end - start) / TOTAL_REHEARSAL_HOURS) * 100
          const pressure = perWorkPressure[i]
          const toneClass = pressure === null ? '' : ` rehearsal-fill-${riskTone(pressure)}`
          return (
            <motion.div
              key={i}
              className={`rehearsal-fill${toneClass}`}
              initial={false}
              animate={{ left: `${left}%`, width: `${width}%` }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            />
          )
        })}
        <motion.div
          className="rehearsal-marker"
          initial={false}
          animate={{ left: `${(m1 / TOTAL_REHEARSAL_HOURS) * 100}%` }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onPointerDown={e => {
            e.preventDefault()
            setDragging(0)
          }}
        />
        <motion.div
          className="rehearsal-marker"
          initial={false}
          animate={{ left: `${(m2 / TOTAL_REHEARSAL_HOURS) * 100}%` }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onPointerDown={e => {
            e.preventDefault()
            setDragging(1)
          }}
        />
      </div>
      <div className="rehearsal-labels">
        {[0, 1, 2].map(i => {
          const work = slotWorks[i]
          const needed = work ? rehearsalHoursNeeded(work.rehearsalLoad) : null
          return (
            <div key={i} className="rehearsal-label">
              <span className="rehearsal-label-hours">{allocation[i]}h</span>
              {work && needed !== null && (
                <span className="rehearsal-label-need">
                  needs ~{needed}h
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Repertoire shelf ────────────────────────────────────────────────────────

interface RepertoireShelfProps {
  works: Work[]
  usedIds: Set<string>
  onCardDragEnd: (id: string, point: { x: number; y: number }) => void
  registerRef: (el: HTMLDivElement | null) => void
}

function RepertoireShelf({
  works,
  usedIds,
  onCardDragEnd,
  registerRef,
}: RepertoireShelfProps) {
  return (
    <div ref={registerRef} className="repertoire-shelf">
      <h3 className="repertoire-title">Repertoire</h3>
      <div className="repertoire-cards">
        {works.map(w => {
          const used = usedIds.has(w.id)
          return (
            <motion.div
              key={w.id}
              className={`repertoire-card${used ? ' repertoire-card-used' : ''}`}
              drag={!used}
              dragSnapToOrigin
              dragElastic={0.7}
              whileDrag={{ scale: 1.06, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
              onDragEnd={(_, info: PanInfo) => onCardDragEnd(w.id, info.point)}
            >
              <div className="repertoire-card-header">
                <span className="repertoire-card-title">{w.title}</span>
                {w.isContemporary ? (
                  <span className="tag tag-contemporary">New</span>
                ) : (
                  <span className="tag tag-canon">Canon</span>
                )}
              </div>
              <div className="repertoire-card-composer">{w.composer}</div>
              <div className="repertoire-card-footer">
                <span>{w.durationMinutes}m</span>
                <span>load {w.rehearsalLoad}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main builder ────────────────────────────────────────────────────────────

export default function ProgramBuilder({
  works,
  program,
  forecast,
  onProgramChange,
  onRunConcert,
}: ProgramBuilderProps) {
  const slotRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const repertoireRef = useRef<HTMLDivElement | null>(null)

  const slotWorks = program.workIds.map(id => findWork(works, id)) as SlotTuple<Work | null>
  const usedIds = new Set(program.workIds.filter((id): id is string => id !== null))

  function pointInRect(point: { x: number; y: number }, el: HTMLElement | null): boolean {
    if (!el) return false
    const r = el.getBoundingClientRect()
    return point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom
  }

  function findDropTarget(point: { x: number; y: number }): number | 'repertoire' | null {
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (pointInRect(point, slotRefs.current[i])) return i
    }
    if (pointInRect(point, repertoireRef.current)) return 'repertoire'
    return null
  }

  function handleRepertoireDrop(id: string, point: { x: number; y: number }) {
    const target = findDropTarget(point)
    if (target === null || target === 'repertoire') return
    const slotIdx = target
    // If piece is already in some slot, swap it with the target slot's piece
    const existingIdx = program.workIds.indexOf(id)
    const nextWorkIds = [...program.workIds] as SlotTuple<string | null>
    if (existingIdx !== -1 && existingIdx !== slotIdx) {
      // swap
      nextWorkIds[existingIdx] = nextWorkIds[slotIdx]
      nextWorkIds[slotIdx] = id
    } else {
      // place (displacing any existing occupant back to repertoire)
      nextWorkIds[slotIdx] = id
    }
    onProgramChange({ ...program, workIds: nextWorkIds })
  }

  function handleSlotDrop(sourceIdx: number, point: { x: number; y: number }) {
    const target = findDropTarget(point)
    const nextWorkIds = [...program.workIds] as SlotTuple<string | null>
    if (target === null) return
    if (target === 'repertoire') {
      nextWorkIds[sourceIdx] = null
    } else if (target !== sourceIdx) {
      // swap pieces between the two slots
      const a = nextWorkIds[sourceIdx]
      nextWorkIds[sourceIdx] = nextWorkIds[target]
      nextWorkIds[target] = a
    } else {
      return
    }
    onProgramChange({ ...program, workIds: nextWorkIds })
  }

  function toggleIntermission(pos: 0 | 1) {
    const next = program.intermissionAfter === pos ? null : pos
    onProgramChange({ ...program, intermissionAfter: next })
  }

  function setAllocation(allocation: SlotTuple<number>) {
    onProgramChange({ ...program, rehearsalAllocation: allocation })
  }

  return (
    <div className="program-builder">
      <div className="program-builder-grid">
        <div className="program-stage">
          <h2 className="program-stage-title">Tonight's Program</h2>

          <SlotCard
            index={0}
            work={slotWorks[0]}
            perWorkRisk={forecast.perWorkPerformanceRisk[0]}
            hours={program.rehearsalAllocation[0]}
            registerRef={el => (slotRefs.current[0] = el)}
            onDragEnd={point => handleSlotDrop(0, point)}
          />

          <IntermissionToggle
            position={0}
            active={program.intermissionAfter === 0}
            onToggle={() => toggleIntermission(0)}
          />

          <SlotCard
            index={1}
            work={slotWorks[1]}
            perWorkRisk={forecast.perWorkPerformanceRisk[1]}
            hours={program.rehearsalAllocation[1]}
            registerRef={el => (slotRefs.current[1] = el)}
            onDragEnd={point => handleSlotDrop(1, point)}
          />

          <IntermissionToggle
            position={1}
            active={program.intermissionAfter === 1}
            onToggle={() => toggleIntermission(1)}
          />

          <SlotCard
            index={2}
            work={slotWorks[2]}
            perWorkRisk={forecast.perWorkPerformanceRisk[2]}
            hours={program.rehearsalAllocation[2]}
            registerRef={el => (slotRefs.current[2] = el)}
            onDragEnd={point => handleSlotDrop(2, point)}
          />

          <DurationBar
            slotWorks={slotWorks}
            intermissionAfter={program.intermissionAfter}
          />

          <RehearsalAllocator
            allocation={program.rehearsalAllocation}
            slotWorks={slotWorks}
            perWorkPressure={forecast.perWorkRehearsalPressure}
            onChange={setAllocation}
          />

          <div className="production-sliders">
            <div className="slider-row">
              <span className="slider-label">Marketing Spend</span>
              <input
                type="range"
                min={5000}
                max={30000}
                step={1000}
                value={program.marketingSpend}
                onChange={e =>
                  onProgramChange({ ...program, marketingSpend: Number(e.target.value) })
                }
              />
              <span className="slider-value">${(program.marketingSpend / 1000).toFixed(0)}k</span>
            </div>
            <div className="slider-row">
              <span className="slider-label">Ticket Price</span>
              <input
                type="range"
                min={20}
                max={120}
                step={5}
                value={program.ticketPrice}
                onChange={e =>
                  onProgramChange({ ...program, ticketPrice: Number(e.target.value) })
                }
              />
              <span className="slider-value">${program.ticketPrice}</span>
            </div>
          </div>

          <button
            className="run-concert-btn"
            onClick={onRunConcert}
            disabled={!forecast.isComplete}
          >
            {forecast.isComplete
              ? 'Run Concert →'
              : `Fill all ${SLOT_COUNT} slots to continue`}
          </button>
        </div>

        <RepertoireShelf
          works={works}
          usedIds={usedIds}
          registerRef={el => (repertoireRef.current = el)}
          onCardDragEnd={handleRepertoireDrop}
        />
      </div>
    </div>
  )
}
