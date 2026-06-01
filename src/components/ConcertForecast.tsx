import { motion, AnimatePresence } from 'framer-motion'
import { type ReactNode } from 'react'
import { type AudienceBreakdown, type ConcertForecast, type SlotTuple, type Work } from '../types/core'

interface ConcertForecastProps {
  forecast: ConcertForecast
  slotWorks: SlotTuple<Work | undefined>
  workCount: 2 | 3
}

const SECTION_SHORT_LABEL: Record<string, string> = {
  strings: 'STR',
  winds: 'WIND',
  brass: 'BRASS',
  percussion: 'PERC',
}

const SECTION_FULL_LABEL: Record<string, string> = {
  strings: 'Strings',
  winds: 'Winds',
  brass: 'Brass',
  percussion: 'Percussion',
}

function fmt$(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
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

function statusTone(value: number): string {
  if (value <= 25) return 'safe'
  if (value <= 55) return 'warn'
  return 'crit'
}

function rehearsalPressureLabel(value: number): string {
  const rounded = Math.round(value)
  if (rounded > 0) return `+${rounded} gap`
  if (rounded < 0) return `${rounded} cushion`
  return '0 adequate'
}

function ForecastLine({
  label,
  value,
  animKey,
  hint,
}: {
  label: string
  value: ReactNode
  animKey: string | number
  hint?: string
}) {
  return (
    <div className="forecast-line">
      <span className="forecast-line-key">
        {label}
        {hint && <small>{hint}</small>}
      </span>
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

function MarketingImpactSummary({ forecast }: { forecast: ConcertForecast }) {
  const topSegments = [...forecast.marketingImpact.bySegment]
    .sort((a, b) => b.awarenessLift - a.awarenessLift)
    .slice(0, 3)
    .map(impact => forecast.projectedAudienceBreakdown.find(row => row.segmentId === impact.segmentId)?.segmentName ?? impact.segmentId)

  const conversionLift = Math.round((forecast.marketingImpact.averageConsiderationMultiplier - 1) * 100)
  const donorSignal = forecast.marketingImpact.donorSignal

  return (
    <div className="forecast-rows">
      <ForecastLine
        label="Campaign reach"
        hint="estimated contacts"
        value={forecast.marketingImpact.totalReach.toLocaleString()}
        animKey={`reach-${forecast.marketingImpact.totalReach}`}
      />
      <ForecastLine
        label="Awareness lift"
        hint="durable segment memory"
        value={`+${forecast.marketingImpact.averageAwarenessLift.toFixed(1)} avg`}
        animKey={`aware-${forecast.marketingImpact.averageAwarenessLift.toFixed(2)}`}
      />
      <ForecastLine
        label="Conversion pressure"
        hint="short-term consideration"
        value={conversionLift > 0 ? `+${conversionLift}%` : 'flat'}
        animKey={`conv-${conversionLift}`}
      />
      <ForecastLine
        label="Donor visibility"
        hint="major-gift conversations"
        value={donorSignal > 0 ? `+${donorSignal.toFixed(1)}` : 'none'}
        animKey={`donor-signal-${donorSignal.toFixed(2)}`}
      />
      <ForecastLine
        label="Strongest lift"
        value={<span className="text-muted">{topSegments.length ? topSegments.join(', ') : '—'}</span>}
        animKey={topSegments.join('|')}
      />
    </div>
  )
}

function AudienceMix({ rows }: { rows: AudienceBreakdown[] }) {
  const total = rows.reduce((sum, row) => sum + row.attendance, 0)

  return (
    <div className="forecast-audience">
      {total > 0 && (
        <div className="audience-stack" aria-hidden="true">
          {rows.map(row => (
            <div
              key={row.segmentId}
              className="audience-stack-cell"
              style={{ width: `${(row.attendance / total) * 100}%` }}
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
            {row.awarenessScore !== undefined && (
              <span
                className="text-muted text-mono"
                title={`Awareness ${row.awarenessScore} · Trust ${row.trustScore} · Habit ${row.habitScore}`}
              >
                A {row.awarenessScore} · T {row.trustScore} · H {row.habitScore}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ConcertForecastView({ forecast, slotWorks, workCount }: ConcertForecastProps) {
  const isLive = forecast.isComplete
  const memoryAnchor = isLive
    ? slotWorks.slice(0, workCount).find(work => work?.id === forecast.memoryAnchorWorkId)
    : null
  const netTone = isLive ? (forecast.projectedNet >= 0 ? 'positive' : 'negative') : 'dim'

  return (
    <section className="forecast-rail" aria-label="Live forecast">
      <div className="forecast-rail-head">
        <span className="eyebrow">Live Forecast</span>
        <span className={`forecast-rail-status ${isLive ? 'live' : ''}`}>
          {isLive ? '● Live' : '○ Awaiting'}
        </span>
      </div>

      <div className="forecast-hero">
        <div className="forecast-hero-cell">
          <span className="forecast-hero-label">Attendance</span>
          <span className={`forecast-hero-value ${isLive ? '' : 'dim'}`}>
            {isLive ? forecast.projectedAttendance.toLocaleString() : '—'}
          </span>
        </div>
        <div className="forecast-hero-cell">
          <span className="forecast-hero-label">Net</span>
          <span className={`forecast-hero-value ${netTone}`}>
            {isLive ? fmt$(forecast.projectedNet) : '—'}
          </span>
        </div>
      </div>

      {!isLive && (
        <div className="forecast-empty">
          <p>{forecast.forecastNotes[0] ?? 'Awaiting a complete programme.'}</p>
        </div>
      )}

      {isLive && (
        <div className="forecast-blocks">
          <section className="forecast-block">
            <div className="forecast-block-head">
              <span className="eyebrow">Financials</span>
            </div>
            <div className="forecast-rows">
              <ForecastLine
                label="Ticket revenue"
                value={fmt$(forecast.projectedRevenue)}
                animKey={forecast.projectedRevenue}
              />
              {forecast.projectedDonorUplift > 0 && (
                <ForecastLine
                  label="Donor support"
                  value={<span className="aurora">{fmt$(forecast.projectedDonorUplift)}</span>}
                  animKey={`donor-${forecast.projectedDonorUplift}`}
                />
              )}
              <ForecastLine
                label="Expenses"
                value={fmt$(forecast.projectedExpenses)}
                animKey={forecast.projectedExpenses}
              />
              <ForecastLine
                label="Base"
                value={<span className="text-muted">{fmt$(forecast.projectedExpenseBreakdown.baseConcert)}</span>}
                animKey={`base-${forecast.projectedExpenseBreakdown.baseConcert}`}
              />
              <ForecastLine
                label="Rehearsal"
                value={<span className="text-muted">{fmt$(forecast.projectedExpenseBreakdown.rehearsal)}</span>}
                animKey={`reh-${forecast.projectedExpenseBreakdown.rehearsal}`}
              />
              <ForecastLine
                label="Marketing"
                value={<span className="text-muted">{fmt$(forecast.projectedExpenseBreakdown.marketing)}</span>}
                animKey={`mkt-${forecast.projectedExpenseBreakdown.marketing}`}
              />
              {forecast.projectedExpenseBreakdown.production > 0 && (
                <ForecastLine
                  label="Production"
                  value={<span className="text-muted">{fmt$(forecast.projectedExpenseBreakdown.production)}</span>}
                  animKey={`prod-${forecast.projectedExpenseBreakdown.production}`}
                />
              )}
            </div>
          </section>

          <section className="forecast-block">
            <div className="forecast-block-head">
              <span className="eyebrow">Marketing Impact</span>
            </div>
            <MarketingImpactSummary forecast={forecast} />
          </section>

          <section className="forecast-block">
            <div className="forecast-block-head">
              <span className="eyebrow">Audience Mix</span>
            </div>
            <AudienceMix rows={forecast.projectedAudienceBreakdown} />
          </section>

          <section className="forecast-block forecast-risk-block">
            <div className="forecast-block-head">
              <span className="eyebrow">Risk Profile</span>
            </div>
            <p className="forecast-risk-note">
              Risk profile estimates what can go wrong before the concert. Lower risk is safer;
              rehearsal pressure is a gap reading where negative means cushion.
            </p>
            <div className="forecast-rows">
              <ForecastLine
                label="Performance risk"
                hint="0 safe · 100 danger"
                value={<span className={riskClass(forecast.performanceRisk)}>{Math.round(forecast.performanceRisk)}</span>}
                animKey={Math.round(forecast.performanceRisk)}
              />
              <ForecastLine
                label="Rehearsal pressure"
                hint="+ gap · − cushion"
                value={
                  <span className={riskClass(Math.max(0, forecast.rehearsalPressure))}>
                    {rehearsalPressureLabel(forecast.rehearsalPressure)}
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
                label="Donors"
                value={<span className={qualityClass(forecast.donorResponse)}>{Math.round(forecast.donorResponse)}</span>}
                animKey={Math.round(forecast.donorResponse)}
              />
              <ForecastLine
                label="Identity"
                value={<span className={qualityClass(forecast.identityImpact)}>{Math.round(forecast.identityImpact)}</span>}
                animKey={Math.round(forecast.identityImpact)}
              />
            </div>
          </section>

          <section className="forecast-block">
            <div className="forecast-block-head">
              <span className="eyebrow">Program Arc</span>
            </div>
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
            {memoryAnchor && <p className="arc-note">Anchor: {memoryAnchor.title}</p>}
          </section>

          <section className="forecast-block">
            <div className="forecast-block-head">
              <span className="eyebrow">Section Stress</span>
            </div>
            <div className="stress-bars">
              {(Object.entries(forecast.sectionStress) as [string, number][]).map(([section, stress]) => {
                const pct = Math.max(0, Math.min(100, stress))
                return (
                  <div key={section} className="stress-cell" title={`${SECTION_FULL_LABEL[section] ?? section} stress`}>
                    <span className="stress-cell-label">{SECTION_SHORT_LABEL[section] ?? section.slice(0, 4).toUpperCase()}</span>
                    <span className="stress-cell-value">{Math.round(stress)}</span>
                    <div className="stress-cell-bar">
                      <i className={statusTone(stress)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="forecast-block">
            <div className="forecast-block-head">
              <span className="eyebrow">Roster Fit</span>
            </div>
            <div className="fit-list">
              {forecast.repertoireFit.map(row => (
                <div key={row.section} className="fit-row">
                  <span className="fit-row-label">{row.label}</span>
                  <span className={`fit-row-stress ${riskClass(row.stress)}`}>{row.stress}</span>
                  <span className="fit-row-note">{row.note}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="forecast-block">
            <div className="forecast-block-head">
              <span className="eyebrow">Per-Piece Risk</span>
            </div>
            <div className="perpiece-list">
              {slotWorks.slice(0, workCount).map((work, index) => {
                const risk = forecast.perWorkPerformanceRisk[index]
                const arcDamage = forecast.perWorkArcDamage[index]
                const need = forecast.perWorkRehearsalHoursNeeded[index]
                const alloc = forecast.perWorkRehearsalHoursAllocated[index]
                const gap = need !== null && alloc !== null ? need - alloc : 0

                return (
                  <div key={index} className="perpiece-row">
                    <span className="perpiece-num">{['I', 'II', 'III'][index]}</span>
                    <span className="perpiece-title">
                      {work?.title ?? <em className="text-faint">empty</em>}
                    </span>
                    {risk !== null && (
                      <span className={`perpiece-risk ${riskClass(risk)}`}>{Math.round(risk)}</span>
                    )}
                    <span className="perpiece-pressure">
                      {arcDamage !== null && arcDamage > 15 && `arc ${Math.round(arcDamage)} `}
                      {gap > 0 && `+${Math.round(gap)}h`}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {forecast.forecastNotes.length > 0 && (
            <section className="forecast-block">
              <div className="forecast-block-head">
                <span className="eyebrow">Notes</span>
              </div>
              <ul className="notes-list">
                {forecast.forecastNotes.map((note, index) => (
                  <li key={`${index}-${note}`}>{note}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </section>
  )
}
