import type { ReactNode } from 'react'
import { type ConcertForecast, type Work } from '../types/core'

interface ConcertForecastProps {
  forecast: ConcertForecast
  selectedWorks: Work[]
  onRunConcert: () => void
  onBack: () => void
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

function ForecastRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="forecast-item">
      <span className="forecast-key">{label}</span>
      <span className="forecast-val">{value}</span>
    </div>
  )
}

export default function ConcertForecast({
  forecast,
  selectedWorks,
  onRunConcert,
  onBack,
}: ConcertForecastProps) {
  const netClass = forecast.projectedNet >= 0 ? 'risk-low' : 'risk-high'

  return (
    <div>
      <div className="panel-row" style={{ alignItems: 'baseline', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Concert Forecast</h2>
        <button
          onClick={onBack}
          style={{ background: 'none', border: '1px solid var(--border)', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
        >
          ← Back
        </button>
      </div>

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.6rem' }}>Program</h3>
        <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {selectedWorks.map(w => (
            <li key={w.id} style={{ fontSize: '0.88rem' }}>
              <strong>{w.title}</strong>
              <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                {w.composer} · {w.durationMinutes} min
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Financials</h3>
        <div className="forecast-grid">
          <ForecastRow label="Projected Attendance" value={forecast.projectedAttendance.toLocaleString()} />
          <ForecastRow label="Projected Revenue" value={fmt(forecast.projectedRevenue)} />
          <ForecastRow label="Projected Expenses" value={fmt(forecast.projectedExpenses)} />
          <ForecastRow
            label="Projected Net"
            value={<span className={netClass}>{fmt(forecast.projectedNet)}</span>}
          />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Risk Profile</h3>
        <div className="forecast-grid">
          <ForecastRow
            label="Performance Risk"
            value={<span className={riskClass(forecast.performanceRisk)}>{Math.round(forecast.performanceRisk)}</span>}
          />
          <ForecastRow
            label="Rehearsal Pressure"
            value={
              <span className={riskClass(Math.max(0, forecast.rehearsalPressure))}>
                {forecast.rehearsalPressure > 0 ? `+${Math.round(forecast.rehearsalPressure)}` : Math.round(forecast.rehearsalPressure)}
              </span>
            }
          />
          <ForecastRow
            label="Audience Fit"
            value={<span className={qualityClass(forecast.audienceFit)}>{Math.round(forecast.audienceFit)}</span>}
          />
          <ForecastRow
            label="Donor Response"
            value={<span className={qualityClass(forecast.donorResponse)}>{Math.round(forecast.donorResponse)}</span>}
          />
          <ForecastRow
            label="Identity Impact"
            value={<span className={qualityClass(forecast.identityImpact)}>{Math.round(forecast.identityImpact)}</span>}
          />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Section Stress</h3>
        <div className="forecast-grid">
          {(Object.entries(forecast.sectionStress) as [string, number][]).map(([section, stress]) => (
            <ForecastRow
              key={section}
              label={section.charAt(0).toUpperCase() + section.slice(1)}
              value={<span className={riskClass(stress)}>{Math.round(stress)}</span>}
            />
          ))}
        </div>
      </div>

      {forecast.forecastNotes.length > 0 && (
        <div className="panel" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ marginBottom: '0.6rem' }}>Forecast Notes</h3>
          <ul className="notes-list">
            {forecast.forecastNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={onRunConcert} style={{ fontSize: '1rem', padding: '0.65rem 2rem' }}>
        Run Concert →
      </button>
    </div>
  )
}
