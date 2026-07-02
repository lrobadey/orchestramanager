import fs from 'node:fs'
import path from 'node:path'
import type { GameState } from '../engine/state'
import { CliError } from './output'

// A save is the complete game plus the determinism contract: the seed chosen
// at `new` and a cursor into its roll stream. Same seed + same command
// sequence = byte-identical career. `--roll` overrides are recorded but do not
// consume the cursor, so a what-if never derails the seeded timeline.
export interface RollRecord {
  slotIndex: number
  roll: number
  source: 'seeded' | 'override'
}

export interface SaveFile {
  formatVersion: 1
  createdAt: string
  updatedAt: string
  seed: number
  rngCursor: number
  rollHistory: RollRecord[]
  game: GameState
}

// Overridable so tests (and agents that want isolation) can point saves at a
// scratch directory instead of the repo's ./saves.
function savesDir(): string {
  return process.env.ORCHESTRA_SAVES_DIR ?? path.resolve(process.cwd(), 'saves')
}

function savePath(name: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(name)) {
    throw new CliError('bad-save-name', `Save name must match [A-Za-z0-9_-]+, got "${name}".`)
  }
  return path.join(savesDir(), `${name}.json`)
}

export function saveExists(name: string): boolean {
  return fs.existsSync(savePath(name))
}

export function createSave(name: string, seed: number, game: GameState): SaveFile {
  const now = new Date().toISOString()
  const save: SaveFile = {
    formatVersion: 1,
    createdAt: now,
    updatedAt: now,
    seed: seed >>> 0,
    rngCursor: 0,
    rollHistory: [],
    game,
  }
  writeSave(name, save)
  return save
}

export function loadSave(name: string): SaveFile {
  const file = savePath(name)
  if (!fs.existsSync(file)) {
    throw new CliError('save-not-found', `No save "${name}" (expected ${path.relative(process.cwd(), file)}). Create one with: new --name "..."`)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    throw new CliError('save-corrupt', `Save "${name}" is not valid JSON: ${(error as Error).message}`)
  }
  const save = parsed as SaveFile
  if (save.formatVersion !== 1 || !save.game || typeof save.seed !== 'number') {
    throw new CliError('save-corrupt', `Save "${name}" is missing required fields (formatVersion, seed, game).`)
  }
  return save
}

export function writeSave(name: string, save: SaveFile): void {
  fs.mkdirSync(savesDir(), { recursive: true })
  const next: SaveFile = { ...save, updatedAt: new Date().toISOString() }
  fs.writeFileSync(savePath(name), `${JSON.stringify(next, null, 2)}\n`)
}
