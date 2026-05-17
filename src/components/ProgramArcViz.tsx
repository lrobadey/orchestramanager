interface ProgramArcVizProps {
  labels?: [string, string, string]
}

export default function ProgramArcViz({
  labels = ['Awakening', 'Conflict', 'Transcendence'],
}: ProgramArcVizProps) {
  // SVG arc with 3 dots along it
  const w = 280
  const h = 70
  const points = [
    { x: 30, y: 50 },
    { x: w / 2, y: 18 },
    { x: w - 30, y: 50 },
  ]
  return (
    <div className="program-arc">
      <div className="program-arc-label">Program Arc</div>
      <div className="program-arc-sublabel">The journey of the evening</div>
      <svg className="program-arc-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <path
          d={`M ${points[0].x} ${points[0].y} Q ${w / 2} ${-10}, ${points[2].x} ${points[2].y}`}
          fill="none"
          stroke="var(--gold-deep)"
          strokeWidth="1"
          opacity="0.6"
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth="1" />
            <text x={p.x} y={p.y + 18} textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fill="var(--ink-soft)">
              {['I', 'II', 'III'][i]}
            </text>
            <text x={p.x} y={h - 2} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="9" fill="var(--ink-muted)">
              {labels[i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
