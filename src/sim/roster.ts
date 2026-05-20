import {
  Principal,
  PrincipalRosterChange,
  RepertoireFit,
  RosterState,
  SectionKey,
  SectionOutcome,
  SectionStrength,
  Work,
} from '../types/core'
import { average, clamp } from './scoring'

const SECTIONS: SectionKey[] = ['strings', 'winds', 'brass', 'percussion']

const SECTION_LABELS: Record<SectionKey, string> = {
  strings: 'Strings',
  winds: 'Winds',
  brass: 'Brass',
  percussion: 'Percussion',
}

export function createInitialRoster(principals: Principal[]): RosterState {
  return {
    principals: principals.map(principal => ({ ...principal })),
  }
}

function sectionLabel(section: SectionKey): string {
  return SECTION_LABELS[section]
}

function principalsForSection(principals: Principal[], section: SectionKey): Principal[] {
  return principals.filter(principal => principal.section === section)
}

function eraFluency(principal: Principal, works: Work[]): number {
  if (works.length === 0) return 50
  return average(
    works.map(work => {
      if (work.isContemporary || work.era === 'contemporary') return principal.newMusicFluency
      if (work.era === 'classical') return principal.classicalFluency
      return principal.romanticFluency
    }),
  )
}

function weakestAttribute(principals: Principal[], works: Work[]): string {
  if (principals.length === 0) return 'no named principal coverage'

  const values = {
    form: average(principals.map(p => p.form)),
    morale: average(principals.map(p => p.morale)),
    endurance: average(principals.map(p => p.endurance)),
    blend: average(principals.map(p => p.blend)),
    solo: average(principals.map(p => p.soloReliability)),
    fluency: average(principals.map(p => eraFluency(p, works))),
  }
  const [key] = Object.entries(values).sort((a, b) => a[1] - b[1])[0]
  const labels: Record<string, string> = {
    form: 'current form',
    morale: 'morale',
    endurance: 'endurance',
    blend: 'blend',
    solo: 'solo reliability',
    fluency: 'style fluency',
  }
  return labels[key]
}

export function calculateSectionStrengths(
  principals: Principal[],
  works: Work[] = [],
): SectionStrength[] {
  return SECTIONS.map(section => {
    const sectionPrincipals = principalsForSection(principals, section)
    const strength =
      sectionPrincipals.length > 0
        ? average(
            sectionPrincipals.map(principal =>
              clamp(
                principal.overall * 0.24 +
                  principal.form * 0.16 +
                  principal.morale * 0.1 +
                  principal.leadership * 0.14 +
                  principal.stressResistance * 0.12 +
                  principal.endurance * 0.1 +
                  principal.blend * 0.08 +
                  eraFluency(principal, works) * 0.06,
                0,
                100,
              ),
            ),
          )
        : 50
    const bottleneck = weakestAttribute(sectionPrincipals, works)
    const label = sectionLabel(section)
    const note =
      strength >= 70
        ? `${label} are a current strength; ${bottleneck} is still the watch point.`
        : strength >= 55
          ? `${label} are playable but exposed; ${bottleneck} is the bottleneck.`
          : `${label} are a strategic risk; ${bottleneck} is dragging the section down.`

    return {
      section,
      label,
      strength: Math.round(strength),
      bottleneck,
      note,
    }
  })
}

export function calculateRepertoireFit(
  works: Work[],
  principals: Principal[],
): RepertoireFit[] {
  const strengths = calculateSectionStrengths(principals, works)
  return SECTIONS.map(section => {
    const sectionPrincipals = principalsForSection(principals, section)
    const demand = works.length > 0 ? Math.max(...works.map(work => work.demands[section])) : 0
    const strength = strengths.find(row => row.section === section)?.strength ?? 50
    const stressResistance =
      sectionPrincipals.length > 0
        ? average(sectionPrincipals.map(principal => principal.stressResistance))
        : 50
    const soloReliability =
      sectionPrincipals.length > 0
        ? average(sectionPrincipals.map(principal => principal.soloReliability))
        : 50
    const exposurePenalty = clamp(
      demand * 0.28 - stressResistance * 0.18 - soloReliability * 0.08,
      0,
      30,
    )
    const stress = clamp(demand - strength + exposurePenalty + 6, 0, 100)
    const label = sectionLabel(section)
    const note =
      stress >= 55
        ? `${label} fit is strained: demand ${Math.round(demand)} against strength ${Math.round(strength)}.`
        : stress >= 30
          ? `${label} fit is manageable, but exposed writing can still bite.`
          : `${label} fit is favorable for this roster.`

    return {
      section,
      label,
      demand: Math.round(demand),
      strength: Math.round(strength),
      stress: Math.round(stress),
      exposurePenalty: Math.round(exposurePenalty),
      note,
    }
  })
}

export function calculateSectionStress(
  works: Work[],
  principals: Principal[],
): Record<SectionKey, number> {
  const fit = calculateRepertoireFit(works, principals)
  return fit.reduce(
    (acc, row) => {
      acc[row.section] = row.stress
      return acc
    },
    { strings: 0, winds: 0, brass: 0, percussion: 0 } as Record<SectionKey, number>,
  )
}

export function calculateRosterChangesAfterConcert(
  principals: Principal[],
  sectionOutcomes: SectionOutcome[],
  performanceQuality: number,
): PrincipalRosterChange[] {
  return principals.map(principal => {
    const outcome = sectionOutcomes.find(row => row.section === principal.section)
    const sectionQuality = outcome?.quality ?? performanceQuality
    const formDelta = Math.round(clamp((sectionQuality - 55) / 18, -3, 3))
    const moraleDelta = Math.round(
      clamp((performanceQuality - 55) / 22 + (sectionQuality - 55) / 35, -3, 3),
    )
    const direction =
      formDelta > 0 || moraleDelta > 0
        ? 'gained confidence'
        : formDelta < 0 || moraleDelta < 0
          ? 'lost confidence'
          : 'held steady'

    return {
      principalId: principal.id,
      principalName: principal.name,
      position: principal.position,
      section: principal.section,
      formDelta,
      moraleDelta,
      note: `${principal.name} ${direction} after the ${sectionLabel(principal.section).toLowerCase()} result.`,
    }
  })
}

export function updateRosterAfterConcert(
  roster: RosterState,
  changes: PrincipalRosterChange[],
): RosterState {
  return {
    principals: roster.principals.map(principal => {
      const change = changes.find(row => row.principalId === principal.id)
      if (!change) return { ...principal }
      return {
        ...principal,
        form: Math.round(clamp(principal.form + change.formDelta, 0, 100)),
        morale: Math.round(clamp(principal.morale + change.moraleDelta, 0, 100)),
      }
    }),
  }
}
