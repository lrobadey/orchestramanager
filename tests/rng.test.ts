import { describe, expect, it } from 'vitest'
import { mulberry32, rollAt } from '../src/engine/rng'

describe('seeded rng', () => {
  it('mulberry32 is deterministic per seed and well-bounded', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 100; i++) {
      const value = a()
      expect(value).toBe(b())
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('different seeds diverge', () => {
    const a = Array.from({ length: 8 }, mulberry32(1))
    const b = Array.from({ length: 8 }, mulberry32(2))
    expect(a).not.toEqual(b)
  })

  it('rollAt matches walking the stream draw by draw', () => {
    const rng = mulberry32(7)
    for (let cursor = 0; cursor < 8; cursor++) {
      expect(rollAt(7, cursor)).toBe(rng() * 100)
    }
  })

  it('rolls stay in the 0-100 band resolveConcert expects', () => {
    for (let seed = 0; seed < 20; seed++) {
      const roll = rollAt(seed, 0)
      expect(roll).toBeGreaterThanOrEqual(0)
      expect(roll).toBeLessThan(100)
    }
  })
})
