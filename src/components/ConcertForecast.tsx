import type { ReactNode } from 'react'
import { type ConcertForecast, type Work } from '../types/core'
import MovementCard from './MovementCard'
import ProgramArcViz from './ProgramArcViz'
import { flavorForSlot } from './concertFlavor'

interface ConcertForecastProps {
  forecast: ConcertForecast
  selectedWorks: Work[]
  slotIndex: number
  slotName: string
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

function fitBand(audienceFit: number): { value: number; label: string } {
  const v = Math.round(audienceFit)
  if (v >= 70) return { value: v, label: 'Strong' }
  if (v >= 55) return { value: v, label: 'Solid' }
  if (v >= 40) return { value: v, label: 'Uneven' }
  return { value: v, label: 'Weak' }
}

function LedgerRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="ledger-row">
      <span className="ledger-key">{label}</span>
      <span className="ledger-val">{value}</span>
    </div>
  )
}

export default function ConcertForecast({
  forecast,
  selectedWorks,
  slotIndex,
  slotName,
  onRunConcert,
  onBack,
}: ConcertForecastProps) {
  const netClass = forecast.projectedNet >= 0 ? 'risk-low' : 'risk-high'
  const flavor = flavorForSlot(slotIndex)
  const fit = fitBand(forecast.audienceFit)

  return (
    <div>
      <div className="book-page elevated">
        <div className="concert-header">
          <div>
            <div className="concert-slot-name">Forecast · {slotName}</div>
            <div className="concert-title">{flavor.title}</div>
            <div className="concert-meta">{flavor.date}<br />{flavor.venue}</div>
            <p className="concert-flavor">{flavor.blurb}</p>
          </div>
          <div className="quality-crest">
            <div className="quality-crest-label">Overall Fit</div>
            <div className="quality-crest-wreath">
              <div className="quality-crest-value">{fit.value}</div>
            </div>
            <div className="quality-crest-band">{fit.label}</div>
          </div>
        </div>

        <ProgramArcViz labels={flavor.movementNames} />

        <div className="movement-grid">
          {selectedWorks.map((work, i) => (
            <MovementCard
              key={work.id}
              movement={i + 1}
              movementName={flavor.movementNames[i]}
              work={work}
            />
          ))}
        </div>
      </div>

      <div className="book-page">
        <h2 className="section-title">Financial Forecast</h2>
        <div className="ledger-grid">
          <LedgerRow label="Projected Attendance" value={forecast.projectedAttendance.toLocaleString()} />
          <LedgerRow label="Projected Revenue" value={fmt(forecast.projectedRevenue)} />
          <LedgerRow label="Projected Expenses" value={fmt(forecast.projectedExpenses)} />
          <LedgerRow
            label="Projected Net"
            value={<span className={netClass}>{fmt(forecast.projectedNet)}</span>}
          />
        </div>
      </div>

      <div className="book-page">
        <h2 className="section-title">Risk Profile</h2>
        <div className="ledger-grid">
          <LedgerRow
            label="Performance Risk"
            value={<span className={riskClass(forecast.performanceRisk)}>{Math.round(forecast.performanceRisk)}</span>}
          />
          <LedgerRow
            label="Rehearsal Pressure"
            value={
              <span className={riskClass(Math.max(0, forecast.rehearsalPressure))}>
                {forecast.rehearsalPressure > 0 ? `+${Math.round(forecast.rehearsalPressure)}` : Math.round(forecast.rehearsalPressure)}
              </span>
            }
          />
          <LedgerRow
            label="Audience Fit"
            value={<span className={qualityClass(forecast.audienceFit)}>{Math.round(forecast.audienceFit)}</span>}
          />
          <LedgerRow
            label="Donor Response"
            value={<span className={qualityClass(forecast.donorResponse)}>{Math.round(forecast.donorResponse)}</span>}
          />
          <LedgerRow
            label="Identity Impact"
            value={<span className={qualityClass(forecast.identityImpact)}>{Math.round(forecast.identityImpact)}</span>}
          />
        </div>
      </div>

      {forecast.forecastNotes.length > 0 && (
        <div className="book-page">
          <h2 className="section-title">Risk & Considerations</h2>
          <ul className="notes-list">
            {forecast.forecastNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="row-between" style={{ marginTop: '1.5rem' }}>
        <button className="btn-ghost" onClick={onBack}>← Back to Planning</button>
        <button onClick={onRunConcert}>Perform the Concert →</button>
      </div>

      <div className="book-footer-flourish">
        Great orchestras aren't built by accident. They are composed.
      </div>
    </div>
  )
}
