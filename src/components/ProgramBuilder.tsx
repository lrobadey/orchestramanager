import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion'
import {
  ConcertForecast,
  ConcertProgram,
  Era,
  SlotTuple,
  TOTAL_REHEARSAL_HOURS,
  Work,
} from '../types/core'
interface ProgramBuilderProps {
  works: Work[]
  program: ConcertProgram
  forecast: ConcertForecast
  rightPanel?: ReactNode
  onProgramChange: (next: ConcertProgram) => void
  onRunConcert: () => void
}

const DURATION_BAR_MAX_MIN = 150
const ERA_ORDER: Era[] = ['classical', 'romantic', 'late-romantic', 'contemporary']
const ERA_LABELS: Record<Era, string> = {
  classical: 'Classical',
  romantic: 'Romantic',
  'late-romantic': 'Late Romantic',
  contemporary: 'Contemporary',
}
const DEFAULT_ERA: Era = 'romantic'
const DEFAULT_COMPOSER = 'Beethoven'

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

function sortWorksForComposer(a: Work, b: Work): number {
  const aMatch = a.title.match(/Symphony No\. (\d+)/)
  const bMatch = b.title.match(/Symphony No\. (\d+)/)
  if (aMatch && bMatch) return Number(aMatch[1]) - Number(bMatch[1])
  if (aMatch) return -1
  if (bMatch) return 1
  return a.title.localeCompare(b.title)
}

// ── Slot card (drop target + draggable when filled) ─────────────────────────

interface SlotCardProps {
  index: number
  work: Work | null
  perWorkRisk: number | null
  hoursNeeded: number | null
  hours: number
  onDragEnd: (point: { x: number; y: number }) => void
  registerRef: (el: HTMLDivElement | null) => void
}

function SlotCard({
  index,
  work,
  perWorkRisk,
  hoursNeeded,
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
                {hours}h / {hoursNeeded !== null ? `${Math.round(hoursNeeded * 10) / 10}` : '?'}h rehearsal
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
  workCount: 2 | 3
}

const INTERMISSION_MIN = 15

function DurationBar({ slotWorks, intermissionAfter, workCount }: DurationBarProps) {
  const activeWorks = slotWorks.slice(0, workCount)
  const musicMin = activeWorks.reduce((sum, w) => sum + (w?.durationMinutes ?? 0), 0)
  const ticks = [30, 60, 90, 120]
  const intermissionMin = intermissionAfter !== null &&
    intermissionAfter < workCount - 1 &&
    slotWorks[intermissionAfter] !== null
    ? INTERMISSION_MIN
    : 0
  const totalMin = musicMin + intermissionMin
  const denom = Math.max(DURATION_BAR_MAX_MIN, totalMin + 10)

  let cursor = 0
  const segments: { width: number; left: number; key: string; color: string }[] = []
  const palette = ['var(--accent)', 'var(--accent-soft)', 'var(--accent)']
  activeWorks.forEach((w, i) => {
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
  perWorkHoursNeeded: SlotTuple<number | null>
  workCount: 2 | 3
  onChange: (next: SlotTuple<number>) => void
}

interface MarkerProps {
  hours: number
  minHours: number
  maxHours: number
  barWidth: number
  onChange: (hours: number) => void
}

function Marker({ hours, minHours, maxHours, barWidth, onChange }: MarkerProps) {
  const x = useMotionValue(0)
  const isDragging = useRef(false)
  const pxPerHour = barWidth > 0 ? barWidth / TOTAL_REHEARSAL_HOURS : 0

  useLayoutEffect(() => {
    if (isDragging.current || pxPerHour === 0) return
    x.set(hours * pxPerHour)
  }, [hours, pxPerHour, x])

  return (
    <motion.div
      className="rehearsal-marker"
      style={{ x, left: 0 }}
      drag="x"
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ left: minHours * pxPerHour, right: maxHours * pxPerHour }}
      whileDrag={{ scale: 1.15 }}
      onDragStart={() => {
        isDragging.current = true
      }}
      onDrag={() => {
        if (pxPerHour === 0) return
        const snapped = Math.max(minHours, Math.min(maxHours, Math.round(x.get() / pxPerHour)))
        if (snapped !== hours) onChange(snapped)
      }}
      onDragEnd={() => {
        isDragging.current = false
        if (pxPerHour === 0) return
        const snapped = Math.max(minHours, Math.min(maxHours, Math.round(x.get() / pxPerHour)))
        x.set(snapped * pxPerHour)
      }}
    />
  )
}

function RehearsalAllocator({
  allocation,
  slotWorks,
  perWorkPressure,
  perWorkHoursNeeded,
  workCount,
  onChange,
}: RehearsalAllocatorProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [barWidth, setBarWidth] = useState(0)

  const m1 = allocation[0]
  const m2 = m1 + allocation[1]
  const activeSlots = Array.from({ length: workCount }, (_, i) => i)

  useLayoutEffect(() => {
    if (!barRef.current) return
    const measure = () => {
      if (barRef.current) setBarWidth(barRef.current.getBoundingClientRect().width)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(barRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="rehearsal-allocator">
      <div className="rehearsal-header">
        <span className="rehearsal-title">Rehearsal Time</span>
        <span className="rehearsal-budget">{TOTAL_REHEARSAL_HOURS} hrs across {workCount} pieces</span>
      </div>
      <div ref={barRef} className="rehearsal-bar">
        {activeSlots.map(i => {
          const start = i === 0 ? 0 : i === 1 ? m1 : m2
          const end = workCount === 2
            ? i === 0 ? m1 : TOTAL_REHEARSAL_HOURS
            : i === 0 ? m1 : i === 1 ? m2 : TOTAL_REHEARSAL_HOURS
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
        {workCount === 2 ? (
          <Marker
            hours={m1}
            minHours={1}
            maxHours={TOTAL_REHEARSAL_HOURS - 1}
            barWidth={barWidth}
            onChange={newM1 =>
              onChange([newM1, TOTAL_REHEARSAL_HOURS - newM1, 0])
            }
          />
        ) : (
          <>
            <Marker
              hours={m1}
              minHours={1}
              maxHours={m2 - 1}
              barWidth={barWidth}
              onChange={newM1 =>
                onChange([newM1, m2 - newM1, TOTAL_REHEARSAL_HOURS - m2])
              }
            />
            <Marker
              hours={m2}
              minHours={m1 + 1}
              maxHours={TOTAL_REHEARSAL_HOURS - 1}
              barWidth={barWidth}
              onChange={newM2 =>
                onChange([m1, newM2 - m1, TOTAL_REHEARSAL_HOURS - newM2])
              }
            />
          </>
        )}
      </div>
      <div className={`rehearsal-labels rehearsal-labels-${workCount}`}>
        {activeSlots.map(i => {
          const work = slotWorks[i]
          const needed = perWorkHoursNeeded[i]
          return (
            <div key={i} className="rehearsal-label">
              <span className="rehearsal-label-hours">{allocation[i]}h</span>
              {work && needed !== null && (
                <span className="rehearsal-label-need">
                  needs ~{Math.round(needed * 10) / 10}h
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
  selectedEra: Era
  selectedComposer: string
  onEraChange: (era: Era) => void
  onComposerChange: (composer: string) => void
  onCardDragStart: () => void
  onCardDragEnd: (id: string, point: { x: number; y: number }) => void
  registerRef: (el: HTMLDivElement | null) => void
}

function RepertoireShelf({
  works,
  usedIds,
  selectedEra,
  selectedComposer,
  onEraChange,
  onComposerChange,
  onCardDragStart,
  onCardDragEnd,
  registerRef,
}: RepertoireShelfProps) {
  const eras = ERA_ORDER.filter(era => works.some(w => w.era === era))
  const worksInEra = works.filter(w => w.era === selectedEra)
  const composers = Array.from(new Set(worksInEra.map(w => w.composer))).sort((a, b) =>
    a.localeCompare(b),
  )
  const visibleWorks = worksInEra
    .filter(w => w.composer === selectedComposer)
    .sort(sortWorksForComposer)

  return (
    <div ref={registerRef} className="repertoire-shelf">
      <div className="repertoire-library-header">
        <h3 className="repertoire-title">Repertoire</h3>
        <span className="repertoire-context">
          {ERA_LABELS[selectedEra]} / {selectedComposer}
        </span>
      </div>

      <div className="repertoire-ladder">
        <div className="repertoire-ladder-column" aria-label="Era">
          {eras.map(era => (
            <button
              key={era}
              type="button"
              className={`ladder-button${selectedEra === era ? ' ladder-button-active' : ''}`}
              onClick={() => onEraChange(era)}
            >
              <span>{ERA_LABELS[era]}</span>
              <span className="ladder-count">{works.filter(w => w.era === era).length}</span>
            </button>
          ))}
        </div>

        <div className="repertoire-ladder-column" aria-label="Composer">
          {composers.map(composer => (
            <button
              key={composer}
              type="button"
              className={`ladder-button${selectedComposer === composer ? ' ladder-button-active' : ''}`}
              onClick={() => onComposerChange(composer)}
            >
              <span>{composer}</span>
              <span className="ladder-count">
                {worksInEra.filter(w => w.composer === composer).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="repertoire-cards">
        {visibleWorks.map(w => {
          const used = usedIds.has(w.id)
          return (
            <motion.div
              key={w.id}
              className={`repertoire-card${used ? ' repertoire-card-used' : ''}`}
              drag={!used}
              dragSnapToOrigin
              dragElastic={0.7}
              whileDrag={{ scale: 1.06, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
              onDragStart={onCardDragStart}
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
              <div className="repertoire-card-stats">
                <span>Draw {w.audienceDraw}</span>
                <span>Prestige {w.artisticPrestige}</span>
                <span>Donor {w.donorComfort}</span>
                <span>Novelty {w.novelty}</span>
              </div>
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
  rightPanel,
  onProgramChange,
  onRunConcert,
}: ProgramBuilderProps) {
  const slotRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const repertoireRef = useRef<HTMLDivElement | null>(null)
  const [isDraggingRepertoireCard, setIsDraggingRepertoireCard] = useState(false)
  const [selectedEra, setSelectedEra] = useState<Era>(DEFAULT_ERA)
  const [selectedComposer, setSelectedComposer] = useState(DEFAULT_COMPOSER)

  const slotWorks = program.workIds.map(id => findWork(works, id)) as SlotTuple<Work | null>
  const usedIds = new Set(program.workIds.filter((id): id is string => id !== null))
  const activeSlotIndexes = useMemo(
    () => Array.from({ length: program.workCount }, (_, i) => i),
    [program.workCount],
  )

  function composersForEra(era: Era): string[] {
    return Array.from(new Set(works.filter(w => w.era === era).map(w => w.composer))).sort((a, b) =>
      a.localeCompare(b),
    )
  }

  function chooseEra(era: Era) {
    const composers = composersForEra(era)
    setSelectedEra(era)
    setSelectedComposer(
      era === DEFAULT_ERA && composers.includes(DEFAULT_COMPOSER)
        ? DEFAULT_COMPOSER
        : composers[0] ?? '',
    )
  }

  function pointInRect(point: { x: number; y: number }, el: HTMLElement | null): boolean {
    if (!el) return false
    const r = el.getBoundingClientRect()
    return point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom
  }

  function findDropTarget(point: { x: number; y: number }): number | 'repertoire' | null {
    for (let i = 0; i < program.workCount; i++) {
      if (pointInRect(point, slotRefs.current[i])) return i
    }
    if (pointInRect(point, repertoireRef.current)) return 'repertoire'
    return null
  }

  function handleRepertoireDrop(id: string, point: { x: number; y: number }) {
    setIsDraggingRepertoireCard(false)
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

  function setProgramWorkCount(workCount: 2 | 3) {
    if (program.workCount === workCount) return
    if (workCount === 2) {
      onProgramChange({
        ...program,
        workCount,
        workIds: [program.workIds[0], program.workIds[1], null],
        intermissionAfter: 0,
        rehearsalAllocation: [10, 10, 0],
      })
      return
    }
    onProgramChange({
      ...program,
      workCount,
      intermissionAfter: 1,
      rehearsalAllocation: [7, 7, 6],
    })
  }

  function setAllocation(allocation: SlotTuple<number>) {
    onProgramChange({ ...program, rehearsalAllocation: allocation })
  }

  return (
    <div className={`program-builder${isDraggingRepertoireCard ? ' program-builder-dragging' : ''}`}>
      <div className="program-builder-grid">
        <div className="program-stage">
          <h2 className="program-stage-title">Tonight's Program</h2>
          <div className="program-size-control" aria-label="Program size">
            <button
              type="button"
              className={program.workCount === 2 ? 'program-size-active' : ''}
              onClick={() => setProgramWorkCount(2)}
            >
              2 Works
            </button>
            <button
              type="button"
              className={program.workCount === 3 ? 'program-size-active' : ''}
              onClick={() => setProgramWorkCount(3)}
            >
              3 Works
            </button>
          </div>

          {activeSlotIndexes.map((index, order) => (
            <div key={index} className="program-slot-group">
              {order > 0 && (
                <IntermissionToggle
                  position={(order - 1) as 0 | 1}
                  active={program.intermissionAfter === order - 1}
                  onToggle={() => toggleIntermission((order - 1) as 0 | 1)}
                />
              )}
              <SlotCard
                index={index}
                work={slotWorks[index]}
                perWorkRisk={forecast.perWorkPerformanceRisk[index]}
                hoursNeeded={forecast.perWorkRehearsalHoursNeeded[index]}
                hours={program.rehearsalAllocation[index]}
                registerRef={el => (slotRefs.current[index] = el)}
                onDragEnd={point => handleSlotDrop(index, point)}
              />
            </div>
          ))}

          <DurationBar
            slotWorks={slotWorks}
            intermissionAfter={program.intermissionAfter}
            workCount={program.workCount}
          />

          <RehearsalAllocator
            allocation={program.rehearsalAllocation}
            slotWorks={slotWorks}
            perWorkPressure={forecast.perWorkRehearsalPressure}
            perWorkHoursNeeded={forecast.perWorkRehearsalHoursNeeded}
            workCount={program.workCount}
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
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={program.studentTicketsEnabled}
                onChange={e =>
                  onProgramChange({
                    ...program,
                    studentTicketsEnabled: e.target.checked,
                  })
                }
              />
              <span className="slider-label">Student Tickets</span>
              <span className="checkbox-value">
                {program.studentTicketsEnabled ? 'Enabled' : 'Off'}
              </span>
            </label>
            <div className="slider-row">
              <span className="slider-label">Student Price</span>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={program.studentTicketPrice}
                disabled={!program.studentTicketsEnabled}
                onChange={e =>
                  onProgramChange({
                    ...program,
                    studentTicketPrice: Number(e.target.value),
                  })
                }
              />
              <span className="slider-value">${program.studentTicketPrice}</span>
            </div>
          </div>

          <button
            className="run-concert-btn"
            onClick={onRunConcert}
            disabled={!forecast.isComplete}
          >
            {forecast.isComplete
              ? 'Run Concert →'
              : `Fill ${program.workCount} works to continue`}
          </button>
        </div>

        <div className="program-side-rail">
          <RepertoireShelf
            works={works}
            usedIds={usedIds}
            selectedEra={selectedEra}
            selectedComposer={selectedComposer}
            onEraChange={chooseEra}
            onComposerChange={setSelectedComposer}
            registerRef={el => (repertoireRef.current = el)}
            onCardDragStart={() => setIsDraggingRepertoireCard(true)}
            onCardDragEnd={handleRepertoireDrop}
          />
          {rightPanel}
        </div>
      </div>
    </div>
  )
}
