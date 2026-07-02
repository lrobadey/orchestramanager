import type { SlotTuple, Work } from '../types/core'
import { TOTAL_REHEARSAL_HOURS } from '../types/core'
import { emptyProgram, type SeasonPrograms } from './state'

// Built-in programming strategies for batch balancing runs. These are crude,
// deliberately legible heuristics — tuning instruments, not model players.
// All sampling goes through the passed rng, so a strategy is fully
// deterministic per seed.

export interface Strategy {
  id: string
  description: string
  buildPrograms(rng: () => number, works: readonly Work[]): SeasonPrograms
}

// Split the concert's rehearsal budget across the program proportional to each
// work's rehearsal load, in whole hours that exactly exhaust the budget.
function allocateRehearsal(programWorks: Work[]): SlotTuple<number> {
  const totalLoad = programWorks.reduce((sum, work) => sum + work.rehearsalLoad, 0) || 1
  const raw = programWorks.map(work => (work.rehearsalLoad / totalLoad) * TOTAL_REHEARSAL_HOURS)
  const floors = raw.map(Math.floor)
  let remainder = TOTAL_REHEARSAL_HOURS - floors.reduce((sum, value) => sum + value, 0)
  // Hand leftover hours to the works that lost the most in flooring.
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac)
  for (const { index } of order) {
    if (remainder <= 0) break
    floors[index] += 1
    remainder -= 1
  }
  return [floors[0] ?? 0, floors[1] ?? 0, floors[2] ?? 0]
}

function toProgram(programWorks: Work[]): SeasonPrograms[number] {
  return {
    ...emptyProgram(),
    workIds: [programWorks[0].id, programWorks[1].id, programWorks[2].id],
    rehearsalAllocation: allocateRehearsal(programWorks),
  }
}

function sampleDistinct(rng: () => number, pool: readonly Work[], count: number, taken: Set<string>): Work[] {
  const picked: Work[] = []
  const available = pool.filter(work => !taken.has(work.id))
  while (picked.length < count && available.length > 0) {
    const index = Math.floor(rng() * available.length)
    const [work] = available.splice(index, 1)
    picked.push(work)
    taken.add(work.id)
  }
  return picked
}

// Rank the pool by a score with a small rng jitter so different seeds explore
// different neighborhoods of the same strategy.
function rankBy(rng: () => number, pool: readonly Work[], score: (work: Work) => number): Work[] {
  return [...pool]
    .map(work => ({ work, key: score(work) + rng() * 5 }))
    .sort((a, b) => b.key - a.key)
    .map(entry => entry.work)
}

const random: Strategy = {
  id: 'random',
  description: 'Three distinct random works per concert, rehearsal hours split by load. The null hypothesis.',
  buildPrograms(rng, works) {
    const taken = new Set<string>()
    return [0, 1, 2, 3].map(() => toProgram(sampleDistinct(rng, works, 3, taken))) as SeasonPrograms
  },
}

const safe: Strategy = {
  id: 'safe',
  description: 'Populist and donor-comfortable: box-office draw and donor comfort over ambition, avoiding heavy rehearsal loads.',
  buildPrograms(rng, works) {
    const ranked = rankBy(rng, works, work => work.audienceDraw + work.donorComfort - work.rehearsalLoad * 0.5)
    return [0, 1, 2, 3].map(slot => toProgram(ranked.slice(slot * 3, slot * 3 + 3))) as SeasonPrograms
  },
}

const adventurous: Strategy = {
  id: 'adventurous',
  description: 'One contemporary work on every program, the rest chosen for novelty and prestige. Identity over comfort.',
  buildPrograms(rng, works) {
    const taken = new Set<string>()
    const contemporary = works.filter(work => work.isContemporary)
    const rankedRest = rankBy(rng, works.filter(work => !work.isContemporary), work => work.novelty + work.artisticPrestige)
    return [0, 1, 2, 3].map(() => {
      const [newWork] = sampleDistinct(rng, contemporary, 1, taken)
      const rest: Work[] = []
      for (const work of rankedRest) {
        if (rest.length === 2) break
        if (taken.has(work.id)) continue
        taken.add(work.id)
        rest.push(work)
      }
      // Contemporary work in the middle: opener, premiere, symphony.
      return toProgram([rest[0], newWork, rest[1]])
    }) as SeasonPrograms
  },
}

export const strategies: Record<string, Strategy> = {
  random,
  safe,
  adventurous,
}
