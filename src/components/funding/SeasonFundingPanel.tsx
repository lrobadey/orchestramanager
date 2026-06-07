import type { SeasonFundingResult } from '../../sim/seasonFunding'
import type { SeasonState } from '../../types/core'
import { CONCERT_ROMAN } from '../../data/numerals'
import { fmtCash } from '../../format'

interface SeasonFundingPanelProps {
  funding: SeasonFundingResult
  season: SeasonState
  completeFlags: boolean[]
  selectedSlot: number
}

const pct = (value: number) => Math.round(value * 100)
const clampPct = (value: number) => Math.max(0, Math.min(100, pct(value)))

// Per-concert coverage tone: red for a fully-naked night, amber while exposed,
// pine once the cost is covered.
function coverageTone(coverage: number, hasProgram: boolean): string {
  if (!hasProgram) return 'idle'
  if (coverage <= 0.001) return 'naked'
  if (coverage < 0.999) return 'short'
  return 'covered'
}

export default function SeasonFundingPanel({
  funding,
  season,
  completeFlags,
  selectedSlot,
}: SeasonFundingPanelProps) {
  // Aggregate volatility band: the season's pledged total can realize anywhere
  // between the sum of donor low ends and the sum of high ends.
  const allPledges = funding.concerts.flatMap(concert => concert.pledges)
  const seasonLow = allPledges.reduce((sum, pledge) => sum + pledge.expectedLow, 0)
  const seasonHigh = allPledges.reduce((sum, pledge) => sum + pledge.expectedHigh, 0)
  const programmedCount = completeFlags.filter(Boolean).length
  const seasonTone = coverageTone(funding.coveragePercent, programmedCount > 0)

  const concertByIndex = new Map(funding.concerts.map(concert => [concert.concertIndex, concert]))

  return (
    <aside className="plan-season-funding" aria-label="Season funding">
      <div className="plan-season-funding-head">
        <span className="eyebrow">Season Funding</span>
        <span className={`plan-season-funding-cov tone-${seasonTone}`}>
          {programmedCount > 0 ? `${pct(funding.coveragePercent)}% pledged` : 'Awaiting programs'}
        </span>
      </div>

      {/* Season gauge — pledged against total season cost, with the volatility
          band marking where the money could actually realize. */}
      <div className="fund-gauge" role="img" aria-label={`Pledged ${fmtCash(funding.pledged)} of ${fmtCash(funding.seasonCost)} season cost`}>
        <div className="fund-gauge-track">
          {funding.seasonCost > 0 && (
            <span
              className="fund-gauge-band"
              style={{
                left: `${clampPct(seasonLow / funding.seasonCost)}%`,
                width: `${Math.max(0, clampPct(seasonHigh / funding.seasonCost) - clampPct(seasonLow / funding.seasonCost))}%`,
              }}
            />
          )}
          <span className={`fund-gauge-fill tone-${seasonTone}`} style={{ width: `${clampPct(funding.coveragePercent)}%` }} />
        </div>
        <div className="fund-gauge-legend">
          <span><strong>{fmtCash(funding.pledged)}</strong> pledged</span>
          <span className="fund-gauge-band-note">band {fmtCash(seasonLow)}–{fmtCash(seasonHigh)}</span>
          <span><strong>{fmtCash(funding.seasonCost)}</strong> cost</span>
        </div>
      </div>

      <div className="plan-season-funding-rows">
        {season.slots.map((slot, i) => {
          const concert = concertByIndex.get(i)
          const hasProgram = completeFlags[i]
          const coverage = concert?.coveragePercent ?? 0
          const tone = coverageTone(coverage, hasProgram)
          return (
            <div
              key={slot.index}
              className={`plan-season-funding-row tone-${tone} ${i === selectedSlot ? 'selected' : ''}`}
            >
              <span className="plan-season-funding-roman">{CONCERT_ROMAN[i]}</span>
              <span className="plan-season-funding-bar">
                <span className="plan-season-funding-bar-fill" style={{ width: `${clampPct(coverage)}%` }} />
              </span>
              <span className="plan-season-funding-figure">
                {!hasProgram
                  ? '—'
                  : concert && concert.gap > 0
                    ? `${pct(coverage)}% · ${fmtCash(concert.gap)} short`
                    : `${pct(coverage)}%`}
              </span>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
