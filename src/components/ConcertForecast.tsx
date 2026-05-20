import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type AudienceBreakdown, type ConcertForecast, type SlotTuple, type Work } from '../types/core'

interface ConcertForecastProps {
  forecast: ConcertForecast
  slotWorks: SlotTuple<Work | undefined>
  workCount: 2 | 3
}

function fmt(n: number): string {
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

function ForecastRow({ label, value, animKey }: { label: string; value: ReactNode; animKey: string | number }) {
  return (
    <div className="forecast-item">
      <span className="forecast-key">{label}</span>
      <span className="forecast-val">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={animKey}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
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
  return (
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
  )
}

export default function ConcertForecast({ forecast, slotWorks, workCount }: ConcertForecastProps) {
  if (!forecast.isComplete) {
    return (
      <div className="forecast-panel forecast-panel-empty">
        <h2 className="forecast-panel-title">Live Forecast</h2>
        <p className="forecast-empty-text">
          {forecast.forecastNotes[0] ??
            'Drag pieces into the program to see the forecast take shape.'}
        </p>
      </div>
    )
  }

  const netClass = forecast.projectedNet >= 0 ? 'risk-low' : 'risk-high'

  return (
    <div className="forecast-panel">
      <h2 className="forecast-panel-title">Live Forecast</h2>

      <section className="forecast-section">
        <h3 className="forecast-section-title">Financials</h3>
        <div className="forecast-grid">
          <ForecastRow
            label="Attendance"
            value={forecast.projectedAttendance.toLocaleString()}
            animKey={forecast.projectedAttendance}
          />
          <ForecastRow
            label="Revenue"
            value={fmt(forecast.projectedRevenue)}
            animKey={forecast.projectedRevenue}
          />
          <ForecastRow
            label="Expenses"
            value={fmt(forecast.projectedExpenses)}
            animKey={forecast.projectedExpenses}
          />
          <ForecastRow
            label="Net"
            value={<span className={netClass}>{fmt(forecast.projectedNet)}</span>}
            animKey={forecast.projectedNet}
          />
        </div>
      </section>

      <section className="forecast-section">
        <h3 className="forecast-section-title">Audience Mix</h3>
        <AudienceMix rows={forecast.projectedAudienceBreakdown} />
      </section>

      <section className="forecast-section">
        <h3 className="forecast-section-title">Risk Profile</h3>
        <div className="forecast-grid">
          <ForecastRow
            label="Perf. Risk"
            value={
              <span className={riskClass(forecast.performanceRisk)}>
                {Math.round(forecast.performanceRisk)}
              </span>
            }
            animKey={Math.round(forecast.performanceRisk)}
          />
          <ForecastRow
            label="Rehearsal"
            value={
              <span className={riskClass(Math.max(0, forecast.rehearsalPressure))}>
                {forecast.rehearsalPressure > 0
                  ? `+${Math.round(forecast.rehearsalPressure)}`
                  : Math.round(forecast.rehearsalPressure)}
              </span>
            }
            animKey={Math.round(forecast.rehearsalPressure)}
          />
          <ForecastRow
            label="Audience Fit"
            value={
              <span className={qualityClass(forecast.audienceFit)}>
                {Math.round(forecast.audienceFit)}
              </span>
            }
            animKey={Math.round(forecast.audienceFit)}
          />
          <ForecastRow
            label="Donors"
            value={
              <span className={qualityClass(forecast.donorResponse)}>
                {Math.round(forecast.donorResponse)}
              </span>
            }
            animKey={Math.round(forecast.donorResponse)}
          />
          <ForecastRow
            label="Identity"
            value={
              <span className={qualityClass(forecast.identityImpact)}>
                {Math.round(forecast.identityImpact)}
              </span>
            }
            animKey={Math.round(forecast.identityImpact)}
          />
        </div>
      </section>

      <section className="forecast-section">
        <h3 className="forecast-section-title">Section Stress</h3>
        <div className="forecast-grid">
          {(Object.entries(forecast.sectionStress) as [string, number][]).map(([section, stress]) => (
            <ForecastRow
              key={section}
              label={section.charAt(0).toUpperCase() + section.slice(1)}
              value={<span className={riskClass(stress)}>{Math.round(stress)}</span>}
              animKey={`${section}-${Math.round(stress)}`}
            />
          ))}
        </div>
      </section>

      <section className="forecast-section">
        <h3 className="forecast-section-title">Roster Fit</h3>
        <div className="forecast-fit-list">
          {forecast.repertoireFit.map(row => (
            <div key={row.section} className="forecast-fit-row">
              <span className="forecast-fit-section">{row.label}</span>
              <span className={riskClass(row.stress)}>Stress {row.stress}</span>
              <span className="forecast-fit-note">{row.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="forecast-section">
        <h3 className="forecast-section-title">Per-Piece Risk</h3>
        <div className="forecast-perpiece-list">
          {slotWorks.slice(0, workCount).map((work, i) => {
            const risk = forecast.perWorkPerformanceRisk[i]
            const need = forecast.perWorkRehearsalHoursNeeded[i]
            const alloc = forecast.perWorkRehearsalHoursAllocated[i]
            const gap = need !== null && alloc !== null ? need - alloc : 0
            return (
              <div key={i} className="forecast-perpiece-row">
                <span className="forecast-perpiece-num">{i + 1}</span>
                <span className="forecast-perpiece-title">
                  {work?.title ?? <em className="text-muted">empty</em>}
                </span>
                {risk !== null && (
                  <span className={`forecast-perpiece-risk ${riskClass(risk)}`}>
                    {Math.round(risk)}
                  </span>
                )}
                {gap > 0 && (
                  <span className="forecast-perpiece-pressure">+{Math.round(gap)}h short</span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {forecast.forecastNotes.length > 0 && (
        <section className="forecast-section">
          <h3 className="forecast-section-title">Notes</h3>
          <ul className="notes-list">
            {forecast.forecastNotes.map((note, i) => (
              <li key={`${i}-${note}`}>{note}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
