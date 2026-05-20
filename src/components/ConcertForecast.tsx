import { motion, AnimatePresence } from 'framer-motion'
import { type AudienceBreakdown, type ConcertForecast, type SlotTuple, type Work } from '../types/core'

interface ConcertForecastProps {
  forecast: ConcertForecast
  slotWorks: SlotTuple<Work | undefined>
  workCount: 2 | 3
}

function fmt$(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function riskClass(value: number): string {
  if (value <= 25) return 'risk-low'
  if (value <= 55) return 'risk-med'
  return 'risk-high'
}

function qualityClass(value: number): string {
  if (value >= 70) return 'risk-low'
  if (value >= 40) return 'risk-med'
  return 'risk-high'
}

function riskToneBar(value: number): string {
  if (value <= 25) return ''
  if (value <= 55) return 'warn'
  return 'crit'
}

function ForecastLine({ label, value, animKey }: { label: string; value: React.ReactNode; animKey: string | number }) {
  return (
    <div className="forecast-line">
      <span className="forecast-line-key">{label}</span>
      <span className="forecast-line-val">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={animKey}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'inline-block' }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  )
}

function AudienceMix({ rows }: { rows: AudienceBreakdown[] }) {
  const totalAttendance = rows.reduce((s, r) => s + r.attendance, 0)
  return (
    <>
      {totalAttendance > 0 && (
        <div className="audience-stack" aria-hidden="true">
          {rows.map(row => (
            <div
              key={row.segmentId}
              className="audience-stack-cell"
              style={{ width: `${(row.attendance / totalAttendance) * 100}%` }}
            />
          ))}
        </div>
      )}
      <div className="audience-mix-list">
        {rows.map(row => (
          <div key={row.segmentId} className="audience-mix-row">
            <span className="audience-segment-name">{row.segmentName}</span>
            <span className="audience-segment-count">{row.attendance.toLocaleString()}</span>
            <span className="audience-segment-share">
              {Math.round(row.shareOfHouse * 100)}%
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

export default function ConcertForecastView({ forecast, slotWorks, workCount }: ConcertForecastProps) {
  if (!forecast.isComplete) {
    return (
      <div className="forecast-empty">
        <span className="eyebrow">Live Forecast</span>
        <p>
          {forecast.forecastNotes[0] ??
            'Drag works into the program to see the forecast take shape.'}
        </p>
      </div>
    )
  }

  const netClass = forecast.projectedNet >= 0 ? 'positive' : 'negative'
  const memoryAnchor = slotWorks
    .slice(0, workCount)
    .find(work => work?.id === forecast.memoryAnchorWorkId)

  return (
    <>
      {/* Hero */}
      <div className="forecast-hero">
        <div className="forecast-hero-cell">
          <span className="eyebrow">Attendance</span>
          <span className="forecast-hero-num">{forecast.projectedAttendance.toLocaleString()}</span>
        </div>
        <div className="forecast-hero-cell">
          <span className="eyebrow">Net</span>
          <span className={`forecast-hero-num ${netClass}`}>{fmt$(forecast.projectedNet)}</span>
        </div>
      </div>

      <div className="forecast-block">
        <div className="forecast-block-head"><span className="eyebrow">Financials</span></div>
        <div className="forecast-rows">
          <ForecastLine label="Revenue" value={fmt$(forecast.projectedRevenue)} animKey={forecast.projectedRevenue} />
          <ForecastLine label="Expenses" value={fmt$(forecast.projectedExpenses)} animKey={forecast.projectedExpenses} />
        </div>
      </div>

      <div className="forecast-block">
        <div className="forecast-block-head"><span className="eyebrow">Audience Mix</span></div>
        <AudienceMix rows={forecast.projectedAudienceBreakdown} />
      </div>

      <div className="forecast-block">
        <div className="forecast-block-head"><span className="eyebrow">Risk Profile</span></div>
        <div className="forecast-rows">
          <ForecastLine
            label="Performance"
            value={<span className={riskClass(forecast.performanceRisk)}>{Math.round(forecast.performanceRisk)}</span>}
            animKey={Math.round(forecast.performanceRisk)}
          />
          <ForecastLine
            label="Rehearsal pressure"
            value={
              <span className={riskClass(Math.max(0, forecast.rehearsalPressure))}>
                {forecast.rehearsalPressure > 0
                  ? `+${Math.round(forecast.rehearsalPressure)}`
                  : Math.round(forecast.rehearsalPressure)}
              </span>
            }
            animKey={Math.round(forecast.rehearsalPressure)}
          />
          <ForecastLine
            label="Audience fit"
            value={<span className={qualityClass(forecast.audienceFit)}>{Math.round(forecast.audienceFit)}</span>}
            animKey={Math.round(forecast.audienceFit)}
          />
          <ForecastLine
            label="Donor response"
            value={<span className={qualityClass(forecast.donorResponse)}>{Math.round(forecast.donorResponse)}</span>}
            animKey={Math.round(forecast.donorResponse)}
          />
          <ForecastLine
            label="Identity impact"
            value={<span className={qualityClass(forecast.identityImpact)}>{Math.round(forecast.identityImpact)}</span>}
            animKey={Math.round(forecast.identityImpact)}
          />
        </div>
      </div>

      <div className="forecast-block">
        <div className="forecast-block-head"><span className="eyebrow">Program Arc</span></div>
        <div className="forecast-rows">
          <ForecastLine
            label="Arc risk"
            value={<span className={riskClass(forecast.arcPerceivedDamage)}>{Math.round(forecast.arcPerceivedDamage)}</span>}
            animKey={Math.round(forecast.arcPerceivedDamage)}
          />
          <ForecastLine
            label="Arc upside"
            value={<span className={qualityClass(forecast.arcPerceivedUpside)}>{Math.round(forecast.arcPerceivedUpside)}</span>}
            animKey={Math.round(forecast.arcPerceivedUpside)}
          />
        </div>
        {memoryAnchor && <p className="arc-note">Memory anchor: {memoryAnchor.title}</p>}
      </div>

      <div className="forecast-block">
        <div className="forecast-block-head"><span className="eyebrow">Section Stress</span></div>
        <div className="stress-bars">
          {(Object.entries(forecast.sectionStress) as [string, number][]).map(([section, stress]) => {
            const pct = Math.max(0, Math.min(100, stress))
            return (
              <div key={section} className="stress-cell">
                <span className="stress-cell-label">{section.slice(0, 4).toUpperCase()}</span>
                <span className="stress-cell-value">{Math.round(stress)}</span>
                <div className="stress-cell-bar">
                  <i className={riskToneBar(stress)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="forecast-block">
        <div className="forecast-block-head"><span className="eyebrow">Roster Fit</span></div>
        <div className="fit-list">
          {forecast.repertoireFit.map(row => (
            <div key={row.section} className="fit-row">
              <span className="fit-row-label">{row.label}</span>
              <span className={`fit-row-stress ${riskClass(row.stress)}`}>{row.stress}</span>
              <span className="fit-row-note">{row.note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="forecast-block">
        <div className="forecast-block-head"><span className="eyebrow">Per-Piece Risk</span></div>
        <div className="perpiece-list">
          {slotWorks.slice(0, workCount).map((work, i) => {
            const risk = forecast.perWorkPerformanceRisk[i]
            const arcDamage = forecast.perWorkArcDamage[i]
            const need = forecast.perWorkRehearsalHoursNeeded[i]
            const alloc = forecast.perWorkRehearsalHoursAllocated[i]
            const gap = need !== null && alloc !== null ? need - alloc : 0
            return (
              <div key={i} className="perpiece-row">
                <span className="perpiece-num">{['I', 'II', 'III'][i]}</span>
                <span className="perpiece-title">
                  {work?.title ?? <em className="text-faint">empty</em>}
                </span>
                {risk !== null && (
                  <span className={`perpiece-risk ${riskClass(risk)}`}>{Math.round(risk)}</span>
                )}
                <span className="perpiece-pressure">
                  {arcDamage !== null && arcDamage > 15 && `arc ${Math.round(arcDamage)} `}
                  {gap > 0 && `+${Math.round(gap)}h short`}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {forecast.forecastNotes.length > 0 && (
        <div className="forecast-block">
          <div className="forecast-block-head"><span className="eyebrow">Notes</span></div>
          <ul className="notes-list">
            {forecast.forecastNotes.map((note, i) => (
              <li key={`${i}-${note}`}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
