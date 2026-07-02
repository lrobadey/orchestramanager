// Seeded randomness for headless play. The engine never draws for itself —
// callers derive rolls here and pass them in, so a save file only needs a seed
// and a cursor to replay a whole career byte-for-byte.

// Standard mulberry32: a tiny, well-distributed 32-bit PRNG.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// The concert roll at a given position in the seed's stream: skip `cursor`
// draws, take the next, scale to the 0-100 band resolveConcert expects.
// O(cursor), which is trivial at a handful of draws per season.
export function rollAt(seed: number, cursor: number): number {
  const rng = mulberry32(seed)
  for (let i = 0; i < cursor; i += 1) rng()
  return rng() * 100
}
