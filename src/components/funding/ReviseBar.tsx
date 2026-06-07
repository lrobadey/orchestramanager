import type { ConcertBreachResult } from '../../sim/seasonBreach'
import type { ConcertFundingResult } from '../../sim/seasonFunding'
import { fmtCash } from '../../format'

interface ReviseBarProps {
  isEditing: boolean
  breach: ConcertBreachResult | null
  concert: ConcertFundingResult | null
  runReady: boolean
  onConfirm: () => void
  onCancel: () => void
  onRun: () => void
}

const pct = (value: number) => Math.round(value * 100)

// The in-season revise gate: while a draft is open it previews exactly who will
// withdraw and the night's new coverage, and only Confirm applies it. Otherwise
// it carries the Run Concert action for the committed program.
export default function ReviseBar({ isEditing, breach, concert, runReady, onConfirm, onCancel, onRun }: ReviseBarProps) {
  if (!isEditing) {
    return (
      <div className="revise-bar">
        <span className="revise-hint">Drag works or adjust the program to revise this concert before it plays.</span>
        <button type="button" className="revise-run" onClick={onRun} disabled={!runReady}>
          {runReady ? 'Run Concert' : 'Fill the program to continue'}
        </button>
      </div>
    )
  }

  const withdrawals = breach?.withdrawals ?? []
  const total = breach?.totalWithdrawn ?? 0
  const coverageBefore = concert ? concert.coveragePercent : null
  const coverageAfter =
    concert && concert.cost > 0 ? Math.max(0, concert.pledged - total) / concert.cost : null

  return (
    <div className="revise-bar editing">
      <div className="revise-breach">
        <div className="revise-breach-head">
          <span className="eyebrow">Revising — confirm to commit</span>
          {coverageBefore != null && coverageAfter != null && (
            <span className={`revise-coverage ${coverageAfter < coverageBefore ? 'down' : ''}`}>
              coverage {pct(coverageBefore)}% → {pct(coverageAfter)}%
            </span>
          )}
        </div>

        {withdrawals.length > 0 ? (
          <ul className="revise-withdrawals">
            {withdrawals.map(w => (
              <li key={w.donorId} className="revise-withdrawal">
                <span className="revise-wd-name">{w.donorName}</span>
                <span className="revise-wd-amount">−{fmtCash(w.withdrawn)}</span>
                {w.restricted && <span className="revise-wd-badge restricted">restricted</span>}
                {w.after === 0 && <span className="revise-wd-badge full">full pull</span>}
                {w.doorClosed && <span className="revise-wd-badge door">door closes</span>}
              </li>
            ))}
            <li className="revise-withdrawal total">
              <span className="revise-wd-name">Total withdrawn</span>
              <span className="revise-wd-amount">−{fmtCash(total)}</span>
            </li>
          </ul>
        ) : (
          <p className="revise-noimpact">No donor objects to this revision — the pledges hold.</p>
        )}
      </div>

      <div className="revise-actions">
        <button type="button" className="revise-confirm" onClick={onConfirm}>
          {total > 0 ? `Confirm — lose ${fmtCash(total)}` : 'Confirm change'}
        </button>
        <button type="button" className="revise-discard" onClick={onCancel}>
          Discard
        </button>
      </div>
    </div>
  )
}
