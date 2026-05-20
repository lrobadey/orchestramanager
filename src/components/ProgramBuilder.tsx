import { useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion'
import {
  ConcertForecast,
  ConcertProgram,
  SlotTuple,
  TOTAL_REHEARSAL_HOURS,
  Work,
} from '../types/core'

interface ProgramBuilderProps {
  works: Work[]
  program: ConcertProgram
  forecast: ConcertForecast
  slotName: string
  registerSlotRef: (index: number, el: HTMLDivElement | null) => void
  isDragging: boolean
  onOpenRepertoire: () => void
  onOpenForecast: () => void
  onSlotDragEnd: (sourceIdx: number, point: { x: number; y: number }) => void
  onProgramChange: (next: ConcertProgram) => void
  onRunConcert: () => void
}

function fmt$(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

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

const ROMAN = ['I', 'II', 'III']

// ── Slot row ─────────────────────────────────────────────────

interface SlotRowProps {
  index: number
  work: Work | null
  perWorkRisk: number | null
  hoursNeeded: number | null
  hours: number
  onOpenRepertoire: () => void
  onSlotDragEnd: (point: { x: number; y: number }) => void
  registerRef: (el: HTMLDivElement | null) => void
}

function SlotRow({
  index,
  work,
  perWorkRisk,
  hoursNeeded,
  hours,
  onOpenRepertoire,
  onSlotDragEnd,
  registerRef,
}: SlotRowProps) {
  let barClass = ''
  if (perWorkRisk !== null) {
    if (perWorkRisk > 55) barClass = 'crit'
    else if (perWorkRisk > 25) barClass = 'warn'
  }

  const needRatio =
    hoursNeeded && hoursNeeded > 0 ? Math.min(120, (hours / hoursNeeded) * 100) : 0

  return (
    <div ref={registerRef} className="program-slot-row">
      <div className={`slot-roman ${work ? 'active' : ''}`}>{ROMAN[index]}.</div>
      <div className="slot-content">
        <AnimatePresence mode="wait">
          {work ? (
            <motion.div
              key={work.id}
              className="slot-piece"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              drag
              dragSnapToOrigin
              dragElastic={0.6}
              whileDrag={{ opacity: 0.7, zIndex: 60 }}
              onDragEnd={(_, info: PanInfo) => onSlotDragEnd(info.point)}
            >
              <div className="slot-title">{work.title}</div>
              <div className="slot-meta">
                <span className="slot-meta-composer">{work.composer}</span>
                <span>{work.durationMinutes} min</span>
                <span>{work.era.replace('-', ' ')}</span>
                {perWorkRisk !== null && (
                  <span className={`slot-risk-inline ${riskTone(perWorkRisk)}`}>
                    Risk {Math.round(perWorkRisk)}
                  </span>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="empty"
              type="button"
              className="slot-empty-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onOpenRepertoire}
            >
              <span className="plus">+</span>Add work
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <div className="slot-rehearsal">
        <div className="slot-rehearsal-line">
          <span>{hours}h</span>
          {hoursNeeded !== null && (
            <span className="slot-rehearsal-need">
              / {Math.round(hoursNeeded * 10) / 10}h
            </span>
          )}
        </div>
        <div className="slot-bar-wrap">
          <div className="slot-bar">
            <i className={barClass} style={{ width: `${Math.min(100, needRatio)}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Rehearsal allocator ─────────────────────────────────────

interface RehearsalAllocatorProps {
  allocation: SlotTuple<number>
  workCount: 2 | 3
  perWorkPressure: SlotTuple<number | null>
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
      className="alloc-marker"
      style={{ x, left: 0 }}
      drag="x"
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ left: minHours * pxPerHour, right: maxHours * pxPerHour }}
      whileDrag={{ scale: 1.2 }}
      onDragStart={() => { isDragging.current = true }}
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

function RehearsalAllocator({ allocation, workCount, perWorkPressure, onChange }: RehearsalAllocatorProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [barWidth, setBarWidth] = useState(0)

  useLayoutEffect(() => {
    if (!barRef.current) return
    const measure = () => {
      if (barRef.current) setBarWidth(barRef.current.getBoundingClientRect().width)
    }
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(barRef.current)
    return () => obs.disconnect()
  }, [])

  const m1 = allocation[0]
  const m2 = m1 + allocation[1]
  const active = Array.from({ length: workCount }, (_, i) => i)

  return (
    <div className="rehearsal-allocator">
      <div className="rehearsal-allocator-head">
        <span className="eyebrow">Rehearsal</span>
        <span className="rehearsal-allocator-total">
          {TOTAL_REHEARSAL_HOURS} h across {workCount} pieces
        </span>
      </div>
      <div ref={barRef} className="rehearsal-allocator-bar">
        {active.map(i => {
          const start = i === 0 ? 0 : i === 1 ? m1 : m2
          const end =
            workCount === 2
              ? i === 0 ? m1 : TOTAL_REHEARSAL_HOURS
              : i === 0 ? m1 : i === 1 ? m2 : TOTAL_REHEARSAL_HOURS
          const left = (start / TOTAL_REHEARSAL_HOURS) * 100
          const width = ((end - start) / TOTAL_REHEARSAL_HOURS) * 100
          const pressure = perWorkPressure[i]
          let toneClass = ''
          if (pressure !== null) {
            if (pressure > 55) toneClass = ' crit'
            else if (pressure > 25) toneClass = ' warn'
          }
          return (
            <motion.div
              key={i}
              className={`rehearsal-allocator-fill${toneClass}`}
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
            onChange={newM1 => onChange([newM1, TOTAL_REHEARSAL_HOURS - newM1, 0])}
          />
        ) : (
          <>
            <Marker
              hours={m1}
              minHours={1}
              maxHours={m2 - 1}
              barWidth={barWidth}
              onChange={newM1 => onChange([newM1, m2 - newM1, TOTAL_REHEARSAL_HOURS - m2])}
            />
            <Marker
              hours={m2}
              minHours={m1 + 1}
              maxHours={TOTAL_REHEARSAL_HOURS - 1}
              barWidth={barWidth}
              onChange={newM2 => onChange([m1, newM2 - m1, TOTAL_REHEARSAL_HOURS - newM2])}
            />
          </>
        )}
      </div>
      <div className={`rehearsal-allocator-labels labels-${workCount}`}>
        {active.map(i => (
          <div key={i} className="rehearsal-allocator-label">
            <span className="rehearsal-allocator-roman">{ROMAN[i]}</span>
            <span className="rehearsal-allocator-hours">{allocation[i]}h</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main builder ─────────────────────────────────────────────

export default function ProgramBuilder({
  works,
  program,
  forecast,
  slotName,
  registerSlotRef,
  isDragging,
  onOpenRepertoire,
  onOpenForecast,
  onSlotDragEnd,
  onProgramChange,
  onRunConcert,
}: ProgramBuilderProps) {
  const slotWorks = program.workIds.map(id => findWork(works, id)) as SlotTuple<Work | null>

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

  const totalMin =
    slotWorks
      .slice(0, program.workCount)
      .reduce((sum, w) => sum + (w?.durationMinutes ?? 0), 0) +
    (program.intermissionAfter !== null &&
    program.intermissionAfter < program.workCount - 1 &&
    slotWorks[program.intermissionAfter] !== null
      ? 15
      : 0)

  const netForPill =
    forecast.isComplete
      ? `${forecast.projectedNet >= 0 ? '+' : ''}${fmt$(forecast.projectedNet)}`
      : '—'

  const activeSlotIndexes = Array.from({ length: program.workCount }, (_, i) => i)

  return (
    <div className={`program-page ${isDragging ? 'dragging-mode' : ''}`}>
      <div className="program-head">
        <div className="program-head-left">
          <span className="eyebrow">{slotName}</span>
          <h1 className="headline">Program</h1>
        </div>
        <div className="program-head-actions">
          <div className="program-size-toggle" role="group" aria-label="Program size">
            <button
              type="button"
              className={program.workCount === 2 ? 'active' : ''}
              onClick={() => setProgramWorkCount(2)}
            >
              2 Works
            </button>
            <button
              type="button"
              className={program.workCount === 3 ? 'active' : ''}
              onClick={() => setProgramWorkCount(3)}
            >
              3 Works
            </button>
          </div>
          <button type="button" className="cta-ghost" onClick={onOpenRepertoire}>
            + Repertoire
          </button>
          <button type="button" className="forecast-pill" onClick={onOpenForecast}>
            <span className="forecast-pill-label">Net</span>
            <span className={`forecast-pill-value ${forecast.isComplete ? (forecast.projectedNet >= 0 ? 'positive' : 'negative') : ''}`}>
              {netForPill}
            </span>
          </button>
        </div>
      </div>

      <div className="program-slots">
        {activeSlotIndexes.map((index, order) => (
          <div key={index}>
            {order > 0 && order < program.workCount && (
              <div className="intermission-line">
                <span className="intermission-line-rule" />
                <button
                  type="button"
                  className={program.intermissionAfter === (order - 1) ? 'active' : ''}
                  onClick={() => toggleIntermission((order - 1) as 0 | 1)}
                  aria-pressed={program.intermissionAfter === order - 1}
                >
                  {program.intermissionAfter === order - 1 ? '— Intermission —' : 'Insert intermission'}
                </button>
                <span className="intermission-line-rule" />
              </div>
            )}
            <SlotRow
              index={index}
              work={slotWorks[index]}
              perWorkRisk={forecast.perWorkPerformanceRisk[index]}
              hoursNeeded={forecast.perWorkRehearsalHoursNeeded[index]}
              hours={program.rehearsalAllocation[index]}
              onOpenRepertoire={onOpenRepertoire}
              onSlotDragEnd={point => onSlotDragEnd(index, point)}
              registerRef={el => registerSlotRef(index, el)}
            />
          </div>
        ))}
      </div>

      <div className="program-totals">
        <div className="program-total-num">{totalMin}</div>
        <div>
          <div className="program-total-label">Minutes total</div>
          <div className="program-total-note">
            {program.intermissionAfter !== null && totalMin > 0
              ? `${totalMin - 15} music + 15 intermission`
              : 'no intermission'}
          </div>
        </div>
      </div>

      <RehearsalAllocator
        allocation={program.rehearsalAllocation}
        workCount={program.workCount}
        perWorkPressure={forecast.perWorkRehearsalPressure}
        onChange={alloc => onProgramChange({ ...program, rehearsalAllocation: alloc })}
      />

      <div className="program-production">
        <div className="production-cell">
          <div className="production-row">
            <span className="production-label">Tickets</span>
            <span className="production-value">${program.ticketPrice}</span>
          </div>
          <input
            className="production-range"
            type="range"
            min={20}
            max={120}
            step={5}
            value={program.ticketPrice}
            onChange={e => onProgramChange({ ...program, ticketPrice: Number(e.target.value) })}
          />
        </div>
        <div className="production-cell">
          <div className="production-row">
            <span className="production-label">Marketing</span>
            <span className="production-value">${(program.marketingSpend / 1000).toFixed(0)}K</span>
          </div>
          <input
            className="production-range"
            type="range"
            min={5000}
            max={30000}
            step={1000}
            value={program.marketingSpend}
            onChange={e => onProgramChange({ ...program, marketingSpend: Number(e.target.value) })}
          />
        </div>
        <div className="production-cell">
          <label className="production-toggle">
            <input
              type="checkbox"
              checked={program.studentTicketsEnabled}
              onChange={e =>
                onProgramChange({ ...program, studentTicketsEnabled: e.target.checked })
              }
            />
            <span>Student Tickets {program.studentTicketsEnabled ? '· On' : '· Off'}</span>
          </label>
          <div className="production-row" style={{ marginTop: '0.4rem' }}>
            <span className="production-label">Student price</span>
            <span className="production-value">${program.studentTicketPrice}</span>
          </div>
          <input
            className="production-range"
            type="range"
            min={10}
            max={50}
            step={5}
            value={program.studentTicketPrice}
            disabled={!program.studentTicketsEnabled}
            onChange={e =>
              onProgramChange({ ...program, studentTicketPrice: Number(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="program-launch">
        <button
          type="button"
          className="cta-aurora"
          onClick={onRunConcert}
          disabled={!forecast.isComplete}
        >
          {forecast.isComplete ? 'Run Concert' : `Fill ${program.workCount} works to continue`}
        </button>
        {!forecast.isComplete && (
          <span className="program-launch-note">
            Open <span style={{ color: 'var(--aurora)' }}>+ Repertoire</span> to add pieces
          </span>
        )}
      </div>
    </div>
  )
}
