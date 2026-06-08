import { useState } from 'react'
import type { DonorConcertFundingFit, DonorConcertPledge, SeasonFundingResult } from '../../sim/seasonFunding'
import type { SwayState } from '../../sim/seasonSway'
import { swayKey } from '../../sim/seasonSway'
import type { Donor } from '../../types/core'
import { CONCERT_ROMAN } from '../../data/numerals'
import { fmtCash } from '../../format'

const PUSH_STEP = 5_000

interface DonorRailProps {
  funding: SeasonFundingResult
  donors: Donor[]
  slotNames: string[]
  selectedSlot: number
  sway: SwayState
  goodwillRemaining: number
  dedicationsUsed: number
  maxDedications: number
  onToggleDedicate: (concertIndex: number, donorId: string) => void
  onAdjustAsk: (donorId: string, concertIndex: number, target: number) => void
  onToggleRestrict: (donorId: string, concertIndex: number) => void
}

function responseTag(pledge: DonorConcertPledge | undefined): { text: string; tone: string } | null {
  if (!pledge?.pushed) return null
  if (pledge.response === 'offended') return { text: '⚠ Offended — recoiled', tone: 'tone-naked' }
  if (pledge.response === 'countered') return { text: 'Countered', tone: 'tone-short' }
  return { text: 'Pushed', tone: 'tone-covered' }
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

export default function DonorRail({
  funding,
  donors,
  slotNames,
  selectedSlot,
  sway,
  goodwillRemaining,
  dedicationsUsed,
  maxDedications,
  onToggleDedicate,
  onAdjustAsk,
  onToggleRestrict,
}: DonorRailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const donorById = new Map(donors.map(donor => [donor.id, donor]))

  // Lead with the donors carrying the season — biggest committed pledges first.
  const ordered = [...funding.donors].sort((a, b) => b.pledged - a.pledged)

  return (
    <div className="donor-rail" aria-label="Donor funding rail">
      <div className="donor-rail-head">
        <span className="eyebrow">Donors · The Ask</span>
        <span className="donor-rail-resources">
          <span className="donor-rail-res" title="Dedications used this season">
            ★ {dedicationsUsed}/{maxDedications}
          </span>
          <span className={`donor-rail-res ${goodwillRemaining < 25 ? 'tone-short' : ''}`} title="Goodwill remaining">
            goodwill {goodwillRemaining}
          </span>
        </span>
      </div>

      <ul className="donor-rail-list">
        {ordered.map(result => {
          const donor = donorById.get(result.donorId)
          if (!donor) return null
          const expanded = expandedId === result.donorId
          const capacityPct = result.concertCapacity > 0 ? Math.round((result.pledged / result.concertCapacity) * 100) : 0
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
                    {fmtCash(result.pledged)} <span className="muted">/ {fmtCash(result.concertCapacity)}</span>
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
                  {result.operatingBudget > 0 && (
                    <div className="donor-operating-note">
                      <span>{fmtCash(result.operatingProjected)} operating</span>
                      <em>{Math.round(result.operatingHealthFactor * 100)}% health fit · {fmtCash(result.operatingBudget)} reserved</em>
                    </div>
                  )}
                  {result.fits.map(fit => {
                    const app = appetiteLabel(fit.appetiteScore)
                    const pledge = result.pledges.find(p => p.concertId === fit.concertId)
                    const warn = culprit(fit)
                    const idx = fit.concertIndex
                    const key = swayKey(result.donorId, idx)
                    const dedicated = sway.dedications[idx] === result.donorId
                    const restricted = Boolean(sway.restricted[key])
                    const canFund = fit.appetiteScore > 5
                    const dedicateLocked = !dedicated && !canFund
                    const dedicateCapped = !dedicated && dedicationsUsed >= maxDedications && sway.dedications[idx] !== result.donorId
                    const currentTarget = sway.asks[key] ?? pledge?.pledgedAmount ?? fit.maxPledge
                    const rTag = responseTag(pledge)
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
                          {rTag && <span className={`donor-fit-response ${rTag.tone}`}>{rTag.text}</span>}
                          {warn && <span className="donor-fit-warn" title={`Aversion to ${warn}`}>⚠ {warn}</span>}
                        </div>

                        {/* The ask: dedicate the night, name the gift, or push for more. */}
                        <div className="donor-fit-ask">
                          <button
                            type="button"
                            className={`ask-btn ${dedicated ? 'on' : ''}`}
                            disabled={dedicateLocked || dedicateCapped}
                            title={
                              dedicateCapped ? 'No dedications left'
                                : dedicateLocked ? 'This donor has no appetite for this night'
                                : 'Dedicate this concert as the donor’s home night'
                            }
                            onClick={() => onToggleDedicate(idx, result.donorId)}
                          >
                            ★ {dedicated ? 'Home night' : 'Dedicate'}
                          </button>
                          <button
                            type="button"
                            className={`ask-btn ${restricted ? 'on' : ''}`}
                            disabled={!canFund}
                            title="Tie the gift to the donor’s top priority — more now, breach risk later"
                            onClick={() => onToggleRestrict(result.donorId, idx)}
                          >
                            ⛓ {restricted ? 'Restricted' : 'Restrict'}
                          </button>
                          <span className="ask-push">
                            <button
                              type="button"
                              className="ask-step"
                              disabled={!canFund || currentTarget <= 0}
                              title="Ease off the ask"
                              onClick={() => onAdjustAsk(result.donorId, idx, currentTarget - PUSH_STEP)}
                            >
                              −
                            </button>
                            <span className="ask-target">{fmtCash(currentTarget)}</span>
                            <button
                              type="button"
                              className="ask-step"
                              disabled={!canFund || goodwillRemaining <= 0}
                              title="Push for a larger pledge (costs goodwill, risks offense)"
                              onClick={() => onAdjustAsk(result.donorId, idx, currentTarget + PUSH_STEP)}
                            >
                              +
                            </button>
                          </span>
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
