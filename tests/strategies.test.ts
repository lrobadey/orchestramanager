import { describe, expect, it } from 'vitest'
import { works } from '../src/data/works'
import { mulberry32 } from '../src/engine/rng'
import { strategies } from '../src/engine/strategies'
import { isSeasonPlanComplete } from '../src/sim/founding'
import { TOTAL_REHEARSAL_HOURS } from '../src/types/core'

// Every strategy must produce a legal, committable season plan for any seed —
// batch runs lean on this to never trip the engine's plan-incomplete gate.

describe('batch strategies', () => {
  for (const strategy of Object.values(strategies)) {
    describe(strategy.id, () => {
      it('builds complete, valid plans across seeds', () => {
        for (let seed = 1; seed <= 20; seed++) {
          const programs = strategy.buildPrograms(mulberry32(seed), works)
          expect(isSeasonPlanComplete(programs)).toBe(true)
          for (const program of programs) {
            const ids = program.workIds.slice(0, program.workCount)
            for (const id of ids) {
              expect(works.some(work => work.id === id)).toBe(true)
            }
            // No duplicate works on one program.
            expect(new Set(ids).size).toBe(ids.length)
            const hours = program.rehearsalAllocation.reduce((sum, value) => sum + value, 0)
            expect(hours).toBe(TOTAL_REHEARSAL_HOURS)
          }
        }
      })

      it('is deterministic per seed', () => {
        expect(strategy.buildPrograms(mulberry32(9), works)).toEqual(
          strategy.buildPrograms(mulberry32(9), works),
        )
      })
    })
  }

  it('adventurous puts a contemporary work on every program', () => {
    const programs = strategies.adventurous.buildPrograms(mulberry32(3), works)
    for (const program of programs) {
      const hasContemporary = program.workIds
        .slice(0, program.workCount)
        .some(id => works.find(work => work.id === id)?.isContemporary)
      expect(hasContemporary).toBe(true)
    }
  })
})
