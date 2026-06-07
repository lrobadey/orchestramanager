import { useState } from 'react'
import type { DonorConcertFundingFit, SeasonFundingResult } from '../../sim/seasonFunding'
import type { Donor } from '../../types/core'
import { CONCERT_ROMAN } from '../../data/numerals'
import { fmtCash } from '../../format'

interface DonorRailProps {
  funding: SeasonFundingResult
  donors: Donor[]
  slotNames: string[]
  selectedSlot: number
}

// musicFit lives in [-75, 75], institutionalFit in [-50, 50]. Normalize both to a
// 0–100 alignment reading where 50 is neutral, so the bars read consistently.
const normMusic = (fit: number) => Math.round(((fit + 75) / 150) * 100)
const normInstitutional = (fit: number) => Math.round(((fit + 50) / 100) * 100)

function appetiteLabel(score: number): { text: string; tone: string } {
  if (score <= 5) return { text: 'Below appetite', tone: 'tone-naked' }
  if (score < 20) return { text: 'Cool', tone: 'tone-short' }
  if (score < 45) return { text: 'Warm', tone: 'tone-covered' }
  return { text: 'Eager', tone: 'tone-covered' }
}

// The work most responsible for any aversion pressure on this concert — the
// "culprit" the alignment warning names.
function culprit(fit: DonorConcertFundingFit): string | null {
  if (fit.worstAversion < 50) return null
  const worst = [...fit.workStances].sort((a, b) => b.aversion - a.aversion)[0]
  return worst && worst.aversion >= 45 ? worst.workTitle : null
}

export default function DonorRail({ funding, donors, slotNames, selectedSlot }: DonorRailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const donorById = new Map(donors.map(donor => [donor.id, donor]))

  // Lead with the donors carrying the season — biggest committed pledges first.
  const ordered = [...funding.donors].sort((a, b) => b.pledged - a.pledged)

  return (
    <div className="donor-rail" aria-label="Donor funding rail">
      <div className="donor-rail-head">
        <span className="eyebrow">Donors</span>
        <span className="donor-rail-sub">pledged · capacity</span>
      </div>

      <ul className="donor-rail-list">
        {ordered.map(result => {
          const donor = donorById.get(result.donorId)
          if (!donor) return null
          const expanded = expandedId === result.donorId
          const capacityPct = result.capacity > 0 ? Math.round((result.pledged / result.capacity) * 100) : 0
          const musicWeight = donor.influenceWeights.music
          return (
            <li key={result.donorId} className={`donor-rail-item ${expanded ? 'expanded' : ''}`}>
              <button
                type="button"
                className="donor-rail-row"
                aria-expanded={expanded}
                onClick={() => setExpandedId(expanded ? null : result.donorId)}
              >
                <span className="donor-rail-id">
                  <span className="donor-rail-name">{result.donorName}</span>
                  <span className="donor-rail-arch">{donor.archetype}</span>
                </span>
                <span className="donor-rail-cap">
                  <span className="donor-rail-cap-bar">
                    <span className="donor-rail-cap-fill" style={{ width: `${Math.min(100, capacityPct)}%` }} />
                  </span>
                  <span className="donor-rail-cap-fig">
                    {fmtCash(result.pledged)} <span className="muted">/ {fmtCash(result.capacity)}</span>
                  </span>
                </span>
                {/* Which lever moves this donor: music vs institutional weight. */}
                <span className="donor-rail-split" title={`Music ${musicWeight} · Institutional ${100 - musicWeight}`}>
                  <span className="donor-rail-split-music" style={{ width: `${musicWeight}%` }} />
                  <span className="donor-rail-split-inst" style={{ width: `${100 - musicWeight}%` }} />
                </span>
                <span className="donor-rail-chev" aria-hidden="true">{expanded ? '–' : '+'}</span>
              </button>

              {expanded && (
                <div className="donor-rail-detail">
                  {result.fits.map(fit => {
                    const app = appetiteLabel(fit.appetiteScore)
                    const pledge = result.pledges.find(p => p.concertId === fit.concertId)
                    const warn = culprit(fit)
                    return (
                      <div
                        key={fit.concertId}
                        className={`donor-fit ${fit.concertIndex === selectedSlot ? 'selected' : ''}`}
                      >
                        <div className="donor-fit-head">
                          <span className="donor-fit-concert">
                            <em>{CONCERT_ROMAN[fit.concertIndex]}</em> {slotNames[fit.concertIndex]}
                          </span>
                          <span className={`donor-fit-appetite ${app.tone}`}>{app.text}</span>
                        </div>

                        <div className="donor-fit-bars">
                          <AlignmentBar label="Music" value={normMusic(fit.musicFit)} emphasis={musicWeight >= 50} />
                          <AlignmentBar
                            label="Institutional"
                            value={normInstitutional(fit.institutionalFit)}
                            emphasis={musicWeight < 50}
                          />
                        </div>

                        <div className="donor-fit-foot">
                          {pledge ? (
                            <span className="donor-fit-pledge">
                              {fmtCash(pledge.pledgedAmount)}
                              <span className="donor-fit-band"> ({fmtCash(pledge.expectedLow)}–{fmtCash(pledge.expectedHigh)})</span>
                            </span>
                          ) : fit.appetiteScore <= 5 ? (
                            <span className="donor-fit-pledge muted">No pledge — out of appetite</span>
                          ) : (
                            <span className="donor-fit-pledge muted">Capacity spent elsewhere</span>
                          )}
                          {warn && <span className="donor-fit-warn" title={`Aversion to ${warn}`}>⚠ {warn}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function AlignmentBar({ label, value, emphasis }: { label: string; value: number; emphasis: boolean }) {
  const tone = value >= 58 ? 'tone-covered' : value <= 42 ? 'tone-naked' : 'tone-short'
  return (
    <div className={`align-bar ${emphasis ? 'emphasis' : ''}`}>
      <span className="align-bar-label">{label}</span>
      <span className="align-bar-track">
        <span className="align-bar-mid" aria-hidden="true" />
        <span className={`align-bar-fill ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </span>
    </div>
  )
}
