import { Fragment } from 'react'
import { InstitutionState, Work } from '../../types/core'

interface AudienceOutlookPanelProps {
  institution: InstitutionState
  selectedWorks: Work[]
}

const SEGMENTS = [
  { key: 'traditionalists', label: 'Traditionalists', color: '#7a2e2e' },
  { key: 'explorers', label: 'Explorers', color: '#3a4870' },
  { key: 'connectors', label: 'Cultural Connectors', color: '#b8923a' },
  { key: 'young', label: 'Young Patrons', color: '#5f7a5a' },
] as const

function deriveSegmentShares(works: Work[]): Record<string, number> {
  if (works.length === 0) {
    return { traditionalists: 42, explorers: 28, connectors: 18, young: 12 }
  }
  // Use era + novelty to skew shares
  const avgNovelty = works.reduce((sum, w) => sum + w.novelty, 0) / works.length
  const contemporaryCount = works.filter(w => w.isContemporary).length
  const tradWeight = 50 - avgNovelty * 0.3 - contemporaryCount * 6
  const explorerWeight = 20 + avgNovelty * 0.25 + contemporaryCount * 4
  const connectorWeight = 18 + contemporaryCount * 2
  const youngWeight = 12 + (avgNovelty > 50 ? 4 : 0) + contemporaryCount * 2
  const total = tradWeight + explorerWeight + connectorWeight + youngWeight
  return {
    traditionalists: Math.round((tradWeight / total) * 100),
    explorers: Math.round((explorerWeight / total) * 100),
    connectors: Math.round((connectorWeight / total) * 100),
    young: Math.round((youngWeight / total) * 100),
  }
}

function Donut({ shares }: { shares: Record<string, number> }) {
  const size = 96
  const r = 40
  const stroke = 14
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  let offset = 0
  const arcs = SEGMENTS.map(seg => {
    const pct = (shares[seg.key] ?? 0) / 100
    const len = pct * circ
    const arc = (
      <circle
        key={seg.key}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={stroke}
        strokeDasharray={`${len} ${circ - len}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    )
    offset += len
    return arc
  })
  return (
    <svg className="donut-svg" width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-panel-edge)" strokeWidth={stroke} opacity={0.5} />
      {arcs}
    </svg>
  )
}

export default function AudienceOutlookPanel({ institution, selectedWorks }: AudienceOutlookPanelProps) {
  const shares = deriveSegmentShares(selectedWorks)
  const projectedAttendance = Math.round(60 + institution.audienceTrust * 0.4)
  const renewals = Math.round(50 + institution.donorConfidence * 0.4)

  return (
    <div className="rail-panel">
      <h3>Audience Outlook</h3>
      <div className="rail-row">
        <span className="rail-row-label">Projected Attendance</span>
        <span className="rail-row-value">{projectedAttendance}%<span className="rail-arrow">↑</span></span>
      </div>
      <div className="rail-row">
        <span className="rail-row-label">Subscription Renewals</span>
        <span className="rail-row-value">{renewals}%<span className="rail-arrow">↑</span></span>
      </div>

      <div className="donut-wrap">
        <Donut shares={shares} />
        <div className="donut-legend">
          {SEGMENTS.map(seg => (
            <Fragment key={seg.key}>
              <span className="donut-legend-key">
                <span className="donut-legend-dot" style={{ background: seg.color }} />
                {seg.label}
              </span>
              <span className="donut-legend-val">{shares[seg.key]}%</span>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="rail-insight">
        <span className="rail-insight-label">Audience Insight</span>
        {selectedWorks.length === 0
          ? 'Select works to see how each audience segment will respond.'
          : shares.young < 12
            ? 'Strong appeal across core segments. Consider targeted outreach to Young Patrons.'
            : 'Balanced program; broad appeal across segments.'}
      </div>
    </div>
  )
}
