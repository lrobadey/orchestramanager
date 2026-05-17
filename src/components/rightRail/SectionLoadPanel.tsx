import { Work } from '../../types/core'

interface SectionLoadPanelProps {
  selectedWorks: Work[]
}

interface SectionStat {
  key: 'strings' | 'winds' | 'brass' | 'percussion'
  label: string
}

const SECTIONS: SectionStat[] = [
  { key: 'strings', label: 'Strings' },
  { key: 'winds', label: 'Woodwinds' },
  { key: 'brass', label: 'Brass' },
  { key: 'percussion', label: 'Percussion' },
]

function loadBand(value: number): { cls: string; label: string } {
  if (value >= 70) return { cls: 'heavy', label: 'Heavy' }
  if (value >= 45) return { cls: 'medium', label: 'Medium' }
  return { cls: 'light', label: 'Light' }
}

export default function SectionLoadPanel({ selectedWorks }: SectionLoadPanelProps) {
  // Average demand across selected works per section
  const sectionLoads = SECTIONS.map(s => {
    if (selectedWorks.length === 0) return { ...s, value: 0 }
    const total = selectedWorks.reduce((sum, w) => sum + w.demands[s.key], 0)
    return { ...s, value: Math.round(total / selectedWorks.length) }
  })

  const totalLoad = sectionLoads.reduce((sum, s) => sum + s.value, 0)
  const overallPct = Math.round((totalLoad / (SECTIONS.length * 100)) * 100)
  const overallBand = loadBand(overallPct)

  return (
    <div className="rail-panel">
      <h3>Section Load</h3>
      {sectionLoads.map(s => {
        const band = loadBand(s.value)
        return (
          <div key={s.key} className="section-load-row">
            <span className="section-load-name">{s.label}</span>
            <div className="section-load-bar">
              <div
                className={`section-load-fill ${band.cls}`}
                style={{ width: `${Math.min(100, s.value)}%` }}
              />
            </div>
            <span className={`section-load-label ${band.cls}`}>{band.label}</span>
          </div>
        )
      })}
      <div className="section-load-total">
        <span className="ledger-key">Total Load</span>
        <span className="ledger-val">
          {overallPct}% <span className={`section-load-label ${overallBand.cls}`}>{overallBand.label}</span>
        </span>
      </div>
    </div>
  )
}
