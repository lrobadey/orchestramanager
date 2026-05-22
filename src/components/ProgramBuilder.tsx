import { type DragEvent, type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, PanInfo, useMotionValue } from 'framer-motion'
import ConcertForecastView from './ConcertForecast'
import {
  ConcertForecast,
  ConcertProgram,
  Era,
  SlotTuple,
  TOTAL_REHEARSAL_HOURS,
  Work,
} from '../types/core'
import '../styles/programme.css'

interface ProgramBuilderProps {
  works: Work[]
  program: ConcertProgram
  forecast: ConcertForecast
  slotName: string
  rightRail: ReactNode
  registerSlotRef: (index: number, el: HTMLDivElement | null) => void
  isDragging: boolean
  onToggleRepertoire: () => void
  onSlotDragEnd: (sourceIdx: number, point: { x: number; y: number }) => void
  onProgramChange: (next: ConcertProgram) => void
  onRunConcert: () => void
}

const ROMAN = ['I', 'II', 'III']
const ERA_ORDER: Era[] = ['classical', 'romantic', 'late-romantic', 'contemporary']
const ERA_LABEL: Record<Era, string> = {
  classical: 'Classical',
  romantic: 'Romantic',
  'late-romantic': 'Late Romantic',
  contemporary: 'Contemporary',
}
const ERA_TONE: Record<Era, string> = {
  classical: 'silver',
  romantic: 'bark',
  'late-romantic': 'ember',
  contemporary: 'pine',
}
const SECTION_LABEL = { strings: 'S', winds: 'W', brass: 'B', percussion: 'P' } as const
const SECTIONS: Array<'strings' | 'winds' | 'brass' | 'percussion'> = [
  'strings',
  'winds',
  'brass',
  'percussion',
]

function findWork(works: Work[], id: string | null): Work | null {
  if (!id) return null
  return works.find(work => work.id === id) ?? null
}

function demandTone(value: number): string {
  if (value >= 70) return 'high'
  if (value >= 40) return 'mid'
  return ''
}

function riskTone(risk: number | null): string {
  if (risk === null) return ''
  if (risk <= 25) return 'tone-low'
  if (risk <= 55) return 'tone-med'
  return 'tone-high'
}

function SlotRow({
  index,
  work,
  perWorkRisk,
  hoursNeeded,
  hours,
  registerRef,
  onDropWork,
  onClear,
  onDragEnd,
}: {
  index: number
  work: Work | null
  perWorkRisk: number | null
  hoursNeeded: number | null
  hours: number
  registerRef: (el: HTMLDivElement | null) => void
  onDropWork: (index: number, workId: string) => void
  onClear: (index: number) => void
  onDragEnd: (point: { x: number; y: number }) => void
}) {
  const [isDropActive, setIsDropActive] = useState(false)
  const dragTone =
    perWorkRisk === null ? '' : perWorkRisk > 55 ? 'crit' : perWorkRisk > 25 ? 'warn' : 'safe'
  const progress = hoursNeeded && hoursNeeded > 0 ? Math.min(100, (hours / hoursNeeded) * 100) : 0

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDropActive(true)
  }

  function handleDragLeave() {
    setIsDropActive(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDropActive(false)
    const workId = event.dataTransfer.getData('text/work-id') || event.dataTransfer.getData('text/plain')
    if (!workId) return
    onDropWork(index, workId)
  }

  return (
    <div
      ref={registerRef}
      className={`programme-slot ${isDropActive ? 'is-drop-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`programme-slot-roman ${work ? 'is-filled' : ''}`}>{ROMAN[index]}</div>

      <div className="programme-slot-body">
        <AnimatePresence mode="wait">
          {work ? (
            <motion.div
              key={work.id}
              className={`programme-slot-card ${dragTone}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              drag
              dragSnapToOrigin
              dragElastic={0.6}
              whileDrag={{ opacity: 0.7, zIndex: 50 }}
              onDragEnd={(_, info: PanInfo) => onDragEnd(info.point)}
            >
              <div className="programme-slot-title" title={work.title}>
                {work.title}
              </div>
              <div className="programme-slot-meta">
                <span className="programme-slot-composer">{work.composer}</span>
                <span>{work.durationMinutes}m</span>
                <span>{work.era.replace('-', ' ')}</span>
              </div>
            </motion.div>
          ) : (
            <div className="programme-slot-empty">
              <div className="programme-slot-empty-mark">—</div>
              <div className="programme-slot-empty-note">Open</div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="programme-slot-side">
        <div className="programme-slot-demand" aria-label="Section demand">
          {work
            ? SECTIONS.map(section => {
                const demand = work.demands[section]
                return (
                  <div key={section} className="programme-slot-demand-cell" title={`${section}: ${demand}`}>
                    <div className="programme-slot-demand-bar">
                      <i
                        className={demandTone(demand)}
                        style={{ ['--demand' as string]: `${Math.max(0, Math.min(100, demand))}%` }}
                      />
                    </div>
                    <span className="programme-slot-demand-label">{SECTION_LABEL[section]}</span>
                  </div>
                )
              })
            : SECTIONS.map(section => (
                <div key={section} className="programme-slot-demand-cell">
                  <div className="programme-slot-demand-bar" />
                  <span className="programme-slot-demand-label">{SECTION_LABEL[section]}</span>
                </div>
              ))}
        </div>

        <div className="programme-slot-metrics">
          <div className="programme-slot-hours">
            <span>{hours}h</span>
            <span className="programme-slot-hours-need">
              {hoursNeeded !== null ? `/ ${Math.round(hoursNeeded * 10) / 10}h` : '/ —'}
            </span>
          </div>
          <div className="programme-slot-bar">
            <i className={dragTone} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="programme-slot-risk">
          {work && perWorkRisk !== null ? (
            <span className={`programme-slot-risk-value ${riskTone(perWorkRisk)}`}>
              {Math.round(perWorkRisk)}
            </span>
          ) : (
            <span className="programme-slot-risk-value is-muted">—</span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="programme-slot-clear"
        onClick={() => onClear(index)}
        aria-label={`Clear slot ${ROMAN[index]}`}
        disabled={!work}
      >
        ×
      </button>
    </div>
  )
}

function Marker({
  hours,
  minHours,
  maxHours,
  barWidth,
  onChange,
}: {
  hours: number
  minHours: number
  maxHours: number
  barWidth: number
  onChange: (hours: number) => void
}) {
  const x = useMotionValue(0)
  const isDragging = useRef(false)
  const pxPerHour = barWidth > 0 ? barWidth / TOTAL_REHEARSAL_HOURS : 0

  useLayoutEffect(() => {
    if (isDragging.current || pxPerHour === 0) return
    x.set(hours * pxPerHour)
  }, [hours, pxPerHour, x])

  return (
    <motion.div
      className="programme-marker"
      style={{ x, left: 0 }}
      drag="x"
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ left: minHours * pxPerHour, right: maxHours * pxPerHour }}
      whileDrag={{ scale: 1.18 }}
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
  workCount,
  perWorkPressure,
  onChange,
}: {
  allocation: SlotTuple<number>
  workCount: 2 | 3
  perWorkPressure: SlotTuple<number | null>
  onChange: (next: SlotTuple<number>) => void
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const [barWidth, setBarWidth] = useState(0)

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

  const m1 = allocation[0]
  const m2 = m1 + allocation[1]
  const active = Array.from({ length: workCount }, (_, i) => i)

  return (
    <section className="programme-rehearsal">
      <div className="programme-section-head">
        <span className="eyebrow">Rehearsal</span>
        <span className="programme-section-meta">
          {TOTAL_REHEARSAL_HOURS} h / {workCount} pieces
        </span>
      </div>

      <div ref={barRef} className="programme-rehearsal-bar">
        {active.map(i => {
          const start = i === 0 ? 0 : i === 1 ? m1 : m2
          const end =
            workCount === 2
              ? i === 0
                ? m1
                : TOTAL_REHEARSAL_HOURS
              : i === 0
                ? m1
                : i === 1
                  ? m2
                  : TOTAL_REHEARSAL_HOURS
          const left = (start / TOTAL_REHEARSAL_HOURS) * 100
          const width = ((end - start) / TOTAL_REHEARSAL_HOURS) * 100
          const pressure = perWorkPressure[i]
          const pressureTone =
            pressure === null ? '' : pressure > 55 ? 'crit' : pressure > 25 ? 'warn' : 'safe'

          return (
            <motion.div
              key={i}
              className={`programme-rehearsal-fill ${pressureTone}`}
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

      <div className={`programme-rehearsal-labels labels-${workCount}`}>
        {active.map(i => (
          <div key={i} className="programme-rehearsal-label">
            <span className="programme-rehearsal-roman">{ROMAN[i]}</span>
            <span className="programme-rehearsal-hours">{allocation[i]}h</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function LibraryTile({
  work,
  used,
  onClick,
}: {
  work: Work
  used: boolean
  onClick: () => void
}) {
  function handleDragStart(event: DragEvent<HTMLButtonElement>) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/work-id', work.id)
    event.dataTransfer.setData('text/from-slot', '')
    event.dataTransfer.setData('text/plain', work.id)
  }

  return (
    <button
      type="button"
      className={`programme-library-item ${used ? 'is-used' : ''}`}
      draggable={!used}
      onDragStart={handleDragStart}
      onClick={used ? undefined : onClick}
      title={used ? 'In programme' : ''}
    >
      <div className="programme-library-item-top">
        <span className="programme-library-composer">{work.composer}</span>
        <span className={`programme-library-era era-${work.era}`}>{ERA_LABEL[work.era]}</span>
      </div>
      <div className="programme-library-title">{work.title}</div>
      <div className="programme-library-meta">
        <span>{work.durationMinutes}m</span>
        <span>P{work.artisticPrestige}</span>
        <span>D{work.audienceDraw}</span>
        <span>L{work.rehearsalLoad}</span>
      </div>
    </button>
  )
}

export default function ProgramBuilder({
  works,
  program,
  forecast,
  slotName,
  rightRail: _rightRail,
  registerSlotRef,
  isDragging,
  onToggleRepertoire: _onToggleRepertoire,
  onSlotDragEnd,
  onProgramChange,
  onRunConcert,
}: ProgramBuilderProps) {
  const [search, setSearch] = useState('')
  const [eraFilter, setEraFilter] = useState<Era | 'all'>('all')

  const slotWorks = useMemo(
    () => program.workIds.map(id => findWork(works, id)) as SlotTuple<Work | null>,
    [program.workIds, works],
  )
  const forecastSlotWorks = useMemo(
    () => slotWorks.map(work => work ?? undefined) as SlotTuple<Work | undefined>,
    [slotWorks],
  )

  const usedIds = useMemo(
    () => new Set(program.workIds.filter((id): id is string => id !== null)),
    [program.workIds],
  )

  const filteredWorks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return works.filter(work => {
      if (eraFilter !== 'all' && work.era !== eraFilter) return false
      if (!query) return true
      return `${work.title} ${work.composer} ${work.era}`.toLowerCase().includes(query)
    })
  }, [eraFilter, search, works])

  const groupedWorks = useMemo(() => {
    return ERA_ORDER.reduce<Record<Era, Work[]>>((acc, era) => {
      acc[era] = filteredWorks.filter(work => work.era === era)
      return acc
    }, {
      classical: [],
      romantic: [],
      'late-romantic': [],
      contemporary: [],
    })
  }, [filteredWorks])

  const totalMinutes = useMemo(() => {
    const musicMinutes = slotWorks.slice(0, program.workCount).reduce((sum, work) => sum + (work?.durationMinutes ?? 0), 0)
    const hasIntermission =
      program.intermissionAfter !== null &&
      program.intermissionAfter < program.workCount - 1 &&
      slotWorks[program.intermissionAfter] !== null
    return musicMinutes + (hasIntermission ? 15 : 0)
  }, [program.intermissionAfter, program.workCount, slotWorks])

  function setWorkCount(workCount: 2 | 3) {
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

  function toggleIntermission(pos: 0 | 1) {
    const next = program.intermissionAfter === pos ? null : pos
    onProgramChange({ ...program, intermissionAfter: next })
  }

  function placeInFirstEmpty(workId: string) {
    const existing = program.workIds.indexOf(workId)
    if (existing !== -1) return
    const emptyIndex = program.workIds.findIndex((value, index) => index < program.workCount && value === null)
    if (emptyIndex === -1) return
    const next = [...program.workIds] as SlotTuple<string | null>
    next[emptyIndex] = workId
    onProgramChange({ ...program, workIds: next })
  }

  function placeInSlot(index: number, workId: string) {
    const next = [...program.workIds] as SlotTuple<string | null>
    const existing = next.indexOf(workId)
    if (existing === index) return
    if (existing !== -1) {
      next[existing] = next[index]
    }
    next[index] = workId
    onProgramChange({ ...program, workIds: next })
  }

  function clearSlot(index: number) {
    const next = [...program.workIds] as SlotTuple<string | null>
    next[index] = null
    onProgramChange({ ...program, workIds: next })
  }

  function handleRun() {
    if (!forecast.isComplete) return
    onRunConcert()
  }

  const activeSlots = Array.from({ length: program.workCount }, (_, index) => index)

  return (
    <div className={`programme-shell ${isDragging ? 'dragging-mode' : ''}`}>
      <header className="programme-canopy">
        <div className="programme-canopy-brand">
          <div className="programme-mark">OM</div>
          <div className="programme-canopy-copy">
            <span className="eyebrow programme-canopy-kicker">Programme</span>
            <h1 className="programme-canopy-title">The programme room</h1>
          </div>
        </div>

        <div className="programme-canopy-meta">
          <div className="programme-canopy-slot">
            <span className="programme-canopy-slot-label">Slot</span>
            <span className="programme-canopy-slot-value">{slotName || '—'}</span>
          </div>

          <div className="programme-size-toggle" role="group" aria-label="Program size">
            <button
              type="button"
              className={program.workCount === 2 ? 'active' : ''}
              onClick={() => setWorkCount(2)}
            >
              2 Works
            </button>
            <button
              type="button"
              className={program.workCount === 3 ? 'active' : ''}
              onClick={() => setWorkCount(3)}
            >
              3 Works
            </button>
          </div>
        </div>
      </header>

      <div className="programme-floor">
        <section className="programme-column programme-column-left">
          <div className="programme-section-head">
            <span className="eyebrow">Programme</span>
            <span className="programme-section-meta">
              {program.workIds.slice(0, program.workCount).filter(Boolean).length}/{program.workCount} filled
            </span>
          </div>

          <div className="programme-slot-stack">
            {activeSlots.map(index => (
              <div key={index} className="programme-slot-stack-item">
                {index > 0 && index < program.workCount && (
                  <div className="programme-intermission-row">
                    <span className="programme-intermission-rule" />
                    <button
                      type="button"
                      className={program.intermissionAfter === index - 1 ? 'active' : ''}
                      onClick={() => toggleIntermission((index - 1) as 0 | 1)}
                      aria-pressed={program.intermissionAfter === index - 1}
                    >
                      {program.intermissionAfter === index - 1 ? 'Intermission' : '+ Intermission'}
                    </button>
                    <span className="programme-intermission-rule" />
                  </div>
                )}

                <SlotRow
                  index={index}
                  work={slotWorks[index]}
                  perWorkRisk={forecast.perWorkPerformanceRisk[index]}
                  hoursNeeded={forecast.perWorkRehearsalHoursNeeded[index]}
                  hours={program.rehearsalAllocation[index]}
                  registerRef={el => registerSlotRef(index, el)}
                  onDropWork={placeInSlot}
                  onClear={clearSlot}
                  onDragEnd={point => onSlotDragEnd(index, point)}
                />
              </div>
            ))}
          </div>

          <div className="programme-total-strip">
            <div className="programme-total-num">{totalMinutes}</div>
            <div className="programme-total-copy">
              <div className="programme-total-label">Minutes total</div>
              <div className="programme-total-note">
                {program.intermissionAfter !== null && totalMinutes > 0
                  ? `${totalMinutes - 15} music + 15 intermission`
                  : 'no intermission'}
              </div>
            </div>
          </div>

          <RehearsalAllocator
            allocation={program.rehearsalAllocation}
            workCount={program.workCount}
            perWorkPressure={forecast.perWorkRehearsalPressure}
            onChange={next => onProgramChange({ ...program, rehearsalAllocation: next })}
          />

          <section className="programme-production">
            <div className="programme-section-head">
              <span className="eyebrow">Production</span>
            </div>

            <div className="programme-production-grid">
              <div className="programme-production-cell">
                <div className="programme-production-row">
                  <span className="programme-production-label">Tickets</span>
                  <span className="programme-production-value">${program.ticketPrice}</span>
                </div>
                <input
                  className="programme-range"
                  type="range"
                  min={20}
                  max={120}
                  step={5}
                  value={program.ticketPrice}
                  onChange={e => onProgramChange({ ...program, ticketPrice: Number(e.target.value) })}
                />
              </div>

              <div className="programme-production-cell">
                <div className="programme-production-row">
                  <span className="programme-production-label">Marketing</span>
                  <span className="programme-production-value">
                    ${(program.marketingSpend / 1000).toFixed(0)}K
                  </span>
                </div>
                <input
                  className="programme-range"
                  type="range"
                  min={5000}
                  max={30000}
                  step={1000}
                  value={program.marketingSpend}
                  onChange={e => onProgramChange({ ...program, marketingSpend: Number(e.target.value) })}
                />
              </div>

              <div className="programme-production-cell">
                <label className="programme-production-toggle">
                  <input
                    type="checkbox"
                    checked={program.studentTicketsEnabled}
                    onChange={e =>
                      onProgramChange({ ...program, studentTicketsEnabled: e.target.checked })
                    }
                  />
                  <span>Students {program.studentTicketsEnabled ? '· On' : '· Off'}</span>
                </label>
                <div className="programme-production-row">
                  <span className="programme-production-label">Student $</span>
                  <span className="programme-production-value">${program.studentTicketPrice}</span>
                </div>
                <input
                  className="programme-range"
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
          </section>

          <div className="programme-launch">
            <button
              type="button"
              className="programme-cta"
              onClick={handleRun}
              disabled={!forecast.isComplete}
            >
              {forecast.isComplete ? 'Run Concert' : `Fill ${program.workCount} works to continue`}
            </button>
          </div>
        </section>

        <section className="programme-column programme-column-center">
          <div className="programme-section-head">
            <span className="eyebrow">Library</span>
            <span className="programme-section-meta">{filteredWorks.length} works</span>
          </div>

          <div className="programme-library-toolbar">
            <input
              className="programme-search"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search composer / title"
            />

            <div className="programme-era-filters" role="tablist" aria-label="Era filters">
              {(['all', ...ERA_ORDER] as const).map(era => {
                const active = eraFilter === era
                const count = era === 'all' ? works.length : works.filter(work => work.era === era).length
                const label =
                  era === 'all'
                    ? 'All'
                    : era === 'late-romantic'
                      ? 'Late Rom'
                      : ERA_LABEL[era]
                const tone = era === 'all' ? 'silver' : ERA_TONE[era]

                return (
                  <button
                    key={era}
                    type="button"
                    className={`programme-era-chip ${active ? 'active' : ''}`}
                    onClick={() => setEraFilter(era)}
                    aria-pressed={active}
                  >
                    <span>{label}</span>
                    <span className={`programme-era-count tone-${tone}`}>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="programme-library-wall">
            {ERA_ORDER.map(era => {
              const items = groupedWorks[era]
              if (items.length === 0) return null

              return (
                <section key={era} className="programme-library-group">
                  <div className="programme-library-group-head">
                    <span className={`programme-library-group-title tone-${ERA_TONE[era]}`}>
                      {ERA_LABEL[era]}
                    </span>
                    <span className="programme-library-group-count">{items.length}</span>
                  </div>

                  <div className="programme-library-list">
                    {items.map(work => (
                      <LibraryTile
                        key={work.id}
                        work={work}
                        used={usedIds.has(work.id)}
                        onClick={() => placeInFirstEmpty(work.id)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}

            {filteredWorks.length === 0 && (
              <div className="programme-library-empty">No works match the current filter.</div>
            )}
          </div>
        </section>

        <aside className="programme-column programme-column-right">
          <ConcertForecastView
            forecast={forecast}
            slotWorks={forecastSlotWorks}
            workCount={program.workCount}
          />
        </aside>
      </div>
    </div>
  )
}
