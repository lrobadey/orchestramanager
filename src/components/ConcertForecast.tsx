import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type ConcertForecast, type SlotTuple, type Work } from '../types/core'

interface ConcertForecastProps {
  forecast: ConcertForecast
  slotWorks: SlotTuple<Work | undefined>
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

export default function ConcertForecast({ forecast, slotWorks }: ConcertForecastProps) {
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
        <h3 className="forecast-section-title">Per-Piece Risk</h3>
        <div className="forecast-perpiece-list">
          {slotWorks.map((work, i) => {
            const risk = forecast.perWorkPerformanceRisk[i]
            const pressure = forecast.perWorkRehearsalPressure[i]
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
                {pressure !== null && pressure > 0 && (
                  <span className="forecast-perpiece-pressure">+{Math.round(pressure)}h gap</span>
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
