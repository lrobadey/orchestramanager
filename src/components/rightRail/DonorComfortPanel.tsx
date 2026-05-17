import { InstitutionState, Work } from '../../types/core'

interface DonorComfortPanelProps {
  institution: InstitutionState
  selectedWorks: Work[]
}

function bandLabel(score: number): string {
  if (score >= 75) return 'Healthy'
  if (score >= 55) return 'Comfort Zone'
  if (score >= 35) return 'Watchful'
  return 'Cautious'
}

export default function DonorComfortPanel({ institution, selectedWorks }: DonorComfortPanelProps) {
  const score = institution.donorConfidence
  // Adventurous programs tilt outlook
  const avgComfort = selectedWorks.length > 0
    ? selectedWorks.reduce((sum, w) => sum + w.donorComfort, 0) / selectedWorks.length
    : 70
  const outlook = avgComfort >= 70 ? 'Positive' : avgComfort >= 50 ? 'Steady' : 'Cautious'
  const giftEstimate = Math.round((institution.donorConfidence / 100) * 1.8 * 10) / 10

  return (
    <div className="rail-panel">
      <h3>Donor Comfort</h3>

      <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <div className="comfort-track-labels">
            <span>Cautious</span>
            <span>Comfort</span>
            <span>Bold</span>
          </div>
          <div className="comfort-track-wrap">
            <div className="comfort-track">
              <div className="comfort-track-thumb" style={{ left: `${Math.min(100, Math.max(0, score))}%` }} />
            </div>
          </div>
        </div>
        <div>
          <div className="comfort-score">{score}</div>
          <div className="comfort-score-band">{bandLabel(score)}</div>
        </div>
      </div>

      <div className="rail-row" style={{ marginTop: '0.5rem' }}>
        <span className="rail-row-label">Top Donors' Outlook</span>
        <span className="rail-row-value">
          {outlook}
          <span className={`rail-arrow${outlook === 'Cautious' ? ' down' : ''}`}>
            {outlook === 'Cautious' ? '↓' : '↑'}
          </span>
        </span>
      </div>
      <div className="rail-row">
        <span className="rail-row-label">New Major Gift Potential</span>
        <span className="rail-row-value">${giftEstimate}M</span>
      </div>
    </div>
  )
}
