import type { Work } from '../types/core'
import { average, clamp } from './scoring'

export type ProgramArcPlacementRole = 'opener' | 'middle' | 'finale'

export interface ProgramArcWorkInput {
  slotIndex: number
  workCount: 2 | 3
  work: Work
  rehearsalPressure: number
  performanceRisk: number
}

export interface ProgramArcWorkSalience {
  workId: string
  slotIndex: number
  placementRole: ProgramArcPlacementRole
  durationWeight: number
  placementWeight: number
  familiarityWeight: number
  prestigeWeight: number
  noveltyVolatilityWeight: number
  perceivedDamage: number
  perceivedUpside: number
}

export interface ProgramArcSalienceResult {
  perWork: ProgramArcWorkSalience[]
  aggregatePerceivedDamage: number
  aggregatePerceivedUpside: number
  memoryAnchorWorkId: string | null
  notes: string[]
}

function placementRole(slotIndex: number, workCount: 2 | 3): ProgramArcPlacementRole {
  if (slotIndex === 0) return 'opener'
  if (slotIndex === workCount - 1) return 'finale'
  return 'middle'
}

function placementWeight(role: ProgramArcPlacementRole): number {
  if (role === 'opener') return 1.15
  if (role === 'finale') return 1.35
  return 0.9
}

function durationWeight(work: Work): number {
  return 0.75 + clamp(work.durationMinutes / 60, 0, 1) * 0.75
}

function familiarityWeight(work: Work): number {
  return 0.85 + (clamp(work.familiarity, 0, 100) / 100) * 0.5
}

function prestigeWeight(work: Work): number {
  return 0.9 + (clamp(work.artisticPrestige, 0, 100) / 100) * 0.35
}

function noveltyVolatilityWeight(work: Work): number {
  return 0.9 + (clamp(work.novelty, 0, 100) / 100) * 0.4
}

function computePerceivedDamage(
  rehearsalPressure: number,
  duration: number,
  placement: number,
  familiarity: number,
  prestige: number,
): number {
  const rawDamage = Math.max(0, rehearsalPressure) * duration * placement * familiarity * prestige
  return clamp(rawDamage / 3, 0, 100)
}

function computePerceivedUpside(
  performanceRisk: number,
  noveltyVolatility: number,
  prestige: number,
  placement: number,
): number {
  const rawUpside = Math.max(0, 100 - performanceRisk) * noveltyVolatility * prestige * placement
  return clamp(rawUpside / 2, 0, 100)
}

function aggregate(values: number[]): number {
  if (values.length === 0) return 0
  const max = Math.max(...values)
  return clamp(max * 0.7 + average(values) * 0.3, 0, 100)
}

function buildNotes(
  input: ProgramArcWorkInput[],
  perWork: ProgramArcWorkSalience[],
  memoryAnchorWorkId: string | null,
): string[] {
  const notes: string[] = []
  if (perWork.length === 0 || memoryAnchorWorkId === null) return notes

  const anchor = perWork.find(work => work.workId === memoryAnchorWorkId)
  const anchorInput = input.find(work => work.work.id === memoryAnchorWorkId && work.slotIndex === anchor?.slotIndex)
  if (anchor && anchorInput) {
    const roleLabel = anchor.placementRole === 'finale'
      ? 'Finale'
      : anchor.placementRole === 'opener'
        ? 'Opener'
        : 'Middle work'
    if (anchor.perceivedDamage >= 35) {
      notes.push(`${roleLabel} risk: ${anchorInput.work.title} carries the most perceptual damage if underprepared.`)
    } else {
      notes.push(`Memory anchor: ${anchorInput.work.title} is likely to shape how the evening is remembered.`)
    }
  }

  const upside = [...perWork].sort((a, b) => b.perceivedUpside - a.perceivedUpside)[0]
  const upsideInput = input.find(work => work.work.id === upside.workId && work.slotIndex === upside.slotIndex)
  if (upside && upsideInput && upside.perceivedUpside >= 45 && upside.perceivedDamage < 30) {
    notes.push(`${upsideInput.work.title} can convert novelty into identity upside if the performance lands.`)
  }

  return notes.slice(0, 3)
}

export function computeProgramArcSalience(input: ProgramArcWorkInput[]): ProgramArcSalienceResult {
  const perWork = input.map(({ slotIndex, workCount, work, rehearsalPressure, performanceRisk }) => {
    const role = placementRole(slotIndex, workCount)
    const duration = durationWeight(work)
    const placement = placementWeight(role)
    const familiarity = familiarityWeight(work)
    const prestige = prestigeWeight(work)
    const noveltyVolatility = noveltyVolatilityWeight(work)

    return {
      workId: work.id,
      slotIndex,
      placementRole: role,
      durationWeight: duration,
      placementWeight: placement,
      familiarityWeight: familiarity,
      prestigeWeight: prestige,
      noveltyVolatilityWeight: noveltyVolatility,
      perceivedDamage: computePerceivedDamage(
        rehearsalPressure,
        duration,
        placement,
        familiarity,
        prestige,
      ),
      perceivedUpside: computePerceivedUpside(
        performanceRisk,
        noveltyVolatility,
        prestige,
        placement,
      ),
    }
  })

  const memoryAnchor = [...perWork].sort(
    (a, b) =>
      b.perceivedDamage * 0.75 + b.perceivedUpside * 0.25 -
      (a.perceivedDamage * 0.75 + a.perceivedUpside * 0.25),
  )[0]
  const memoryAnchorWorkId = memoryAnchor?.workId ?? null

  return {
    perWork,
    aggregatePerceivedDamage: aggregate(perWork.map(work => work.perceivedDamage)),
    aggregatePerceivedUpside: aggregate(perWork.map(work => work.perceivedUpside)),
    memoryAnchorWorkId,
    notes: buildNotes(input, perWork, memoryAnchorWorkId),
  }
}
