import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { runCli } from '../src/cli/main'

// Drives the real CLI in-process (stdout/stderr captured, saves pointed at a
// temp directory) — the same code path `npm run cli` takes, minus the process
// boundary. One subprocess smoke test guards the tsx entry point itself.

let savesDir: string

beforeAll(() => {
  savesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestra-cli-'))
  process.env.ORCHESTRA_SAVES_DIR = savesDir
})

afterAll(() => {
  delete process.env.ORCHESTRA_SAVES_DIR
  fs.rmSync(savesDir, { recursive: true, force: true })
})

interface CliRun {
  code: number
  stdout: string
  stderr: string
  json: any
  error: any
}

function cli(...args: string[]): CliRun {
  let stdout = ''
  let stderr = ''
  const outSpy = vi.spyOn(process.stdout, 'write').mockImplementation(chunk => {
    stdout += chunk
    return true
  })
  const errSpy = vi.spyOn(process.stderr, 'write').mockImplementation(chunk => {
    stderr += chunk
    return true
  })
  let code: number
  try {
    code = runCli(args)
  } finally {
    outSpy.mockRestore()
    errSpy.mockRestore()
  }
  const parse = (text: string) => {
    try {
      return JSON.parse(text)
    } catch {
      return undefined
    }
  }
  return { code, stdout, stderr, json: parse(stdout), error: parse(stderr)?.error }
}

const seasonPlan: string[][] = [
  ['program', 'set', '--slot', '0', '--works', 'beethoven-egmont,first-desk-concerto,beethoven-5', '--rehearsal', '4,7,9'],
  ['program', 'set', '--slot', '1', '--works', 'mozart-don-giovanni-overture,signal-fires,brahms-2', '--rehearsal', '3,7,10'],
  ['program', 'set', '--slot', '2', '--works', 'debussy-faune,night-ferry,sibelius-2', '--rehearsal', '4,8,8'],
  ['program', 'set', '--slot', '3', '--works', 'smetana-vltava,city-light-machines,tchaikovsky-5', '--rehearsal', '4,6,10'],
]

function playFullSeason(save: string, seed: string): CliRun {
  expect(cli('new', '--name', 'Test Philharmonic', '--seed', seed, '--save', save, '--force').code).toBe(0)
  for (const step of seasonPlan) {
    expect(cli(...step, '--save', save).code).toBe(0)
  }
  expect(cli('begin-season', '--save', save).code).toBe(0)
  for (let i = 0; i < 4; i++) {
    expect(cli('run-concert', '--save', save).code).toBe(0)
    expect(cli('advance', '--save', save).code).toBe(0)
  }
  return cli('summary', '--save', save)
}

describe('cli full season', () => {
  it('plays a complete season and lands on a summary', () => {
    const summary = playFullSeason('season', '7')
    expect(summary.code).toBe(0)
    expect(summary.json.summary.totalNet).toBeTypeOf('number')
    expect(summary.json.rollHistory).toHaveLength(4)
    expect(summary.json.rollHistory.every((entry: any) => entry.source === 'seeded')).toBe(true)
    expect(summary.json.transactions.every((tx: any) => tx.status === 'posted')).toBe(true)
  })

  it('same seed + same commands = byte-identical summary', () => {
    const first = playFullSeason('det-a', '99')
    const second = playFullSeason('det-b', '99')
    expect(first.stdout).toBe(second.stdout)
  })

  it('a different seed produces a different season', () => {
    const first = playFullSeason('seed-a', '1')
    const second = playFullSeason('seed-b', '2')
    expect(first.json.rollHistory).not.toEqual(second.json.rollHistory)
  })

  it('--roll overrides without consuming the seeded stream', () => {
    cli('new', '--seed', '5', '--save', 'roll', '--force')
    for (const step of seasonPlan) cli(...step, '--save', 'roll')
    cli('begin-season', '--save', 'roll')
    const overridden = cli('run-concert', '--save', 'roll', '--roll', '95')
    expect(overridden.json.roll).toBe(95)
    expect(overridden.json.rollSource).toBe('override')
    expect(overridden.json.state.rngCursor).toBe(0)
    cli('advance', '--save', 'roll')
    const seeded = cli('run-concert', '--save', 'roll')
    expect(seeded.json.rollSource).toBe('seeded')
    expect(seeded.json.state.rngCursor).toBe(1)
  })

  it('mutating commands carry the state envelope', () => {
    const created = cli('new', '--seed', '3', '--save', 'envelope', '--force')
    expect(created.json.state).toMatchObject({
      phase: 'planning',
      currentSlotIndex: 0,
      planComplete: false,
      save: 'envelope',
    })
  })
})

describe('cli error contract', () => {
  it('errors are JSON on stderr with exit 1 and stable codes', () => {
    const missing = cli('state', '--save', 'no-such-save')
    expect(missing.code).toBe(1)
    expect(missing.stdout).toBe('')
    expect(missing.error.code).toBe('save-not-found')

    cli('new', '--seed', '1', '--save', 'errs', '--force')
    const early = cli('run-concert', '--save', 'errs')
    expect(early.code).toBe(1)
    expect(early.error.code).toBe('season-not-started')
    expect(early.error.phase).toBe('planning')

    const badWork = cli('program', 'set', '--slot', '0', '--works', 'not-a-piece,beethoven-5', '--save', 'errs')
    expect(badWork.error.code).toBe('unknown-work')

    const unknown = cli('frobnicate')
    expect(unknown.error.code).toBe('unknown-command')

    const badPath = cli('state', '--save', 'errs', '--path', 'no.such.path')
    expect(badPath.error.code).toBe('bad-path')
  })

  it('an illegal move never corrupts the save', () => {
    cli('new', '--seed', '1', '--save', 'safe-save', '--force')
    const before = cli('state', '--save', 'safe-save').stdout
    expect(cli('begin-season', '--save', 'safe-save').error.code).toBe('plan-incomplete')
    expect(cli('state', '--save', 'safe-save').stdout).toBe(before)
  })
})

describe('cli self-description', () => {
  it('schema lists every registered command with flags', () => {
    const schema = cli('schema')
    expect(schema.code).toBe(0)
    const names = schema.json.commands.map((command: any) => command.command)
    for (const expected of [
      'new', 'state', 'works', 'roster', 'donors', 'audience', 'funding',
      'program show', 'program set', 'dedicate', 'ask', 'restrict',
      'begin-season', 'forecast', 'run-concert', 'advance', 'report',
      'edit preview', 'edit confirm', 'edit cancel', 'summary',
      'new-season', 'batch', 'schema', 'help',
    ]) {
      expect(names).toContain(expected)
    }
    for (const command of schema.json.commands) {
      expect(command.description.length).toBeGreaterThan(10)
      expect(command).toHaveProperty('mutates')
    }
  })
})

describe('cli inspection surface', () => {
  it('exposes full transparency: hidden donor params and forecast internals', () => {
    cli('new', '--seed', '4', '--save', 'inspect', '--force')
    for (const step of seasonPlan) cli(...step, '--save', 'inspect')

    const donors = cli('donors', '--save', 'inspect')
    expect(donors.json.donors[0]).toHaveProperty('volatility')
    expect(donors.json.donors[0]).toHaveProperty('musicTaste')
    expect(donors.json.fundingByDonor[0]).toHaveProperty('fits')

    const forecast = cli('forecast', '--save', 'inspect', '--slot', '0')
    expect(forecast.json.forecast).toHaveProperty('sectionStress')
    expect(forecast.json.forecast).toHaveProperty('projectedExpenses')

    const state = cli('state', '--save', 'inspect', '--path', 'derived.goodwillRemaining')
    expect(state.json).toBe(100)
  })

  it('batch reports per-run rows and aggregate distributions deterministically', () => {
    const first = cli('batch', '--strategy', 'random', '--runs', '3', '--seed', '11')
    const second = cli('batch', '--strategy', 'random', '--runs', '3', '--seed', '11')
    expect(first.code).toBe(0)
    expect(first.stdout).toBe(second.stdout)
    expect(first.json.perRun).toHaveLength(3)
    expect(first.json.aggregate.finalCash).toHaveProperty('median')
    expect(first.json.aggregate).toHaveProperty('insolvencyRate')
  })
})

describe('cli entry point', () => {
  it('runs as a subprocess via tsx', () => {
    const stdout = execFileSync('npx', ['tsx', 'src/cli/main.ts', 'schema'], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      timeout: 60_000,
    })
    expect(JSON.parse(stdout).commands.length).toBeGreaterThan(10)
  }, 60_000)

  it('flushes large documents fully through a pipe (no 64KB truncation)', () => {
    // A played season's state dump is ~190KB — bigger than the OS pipe
    // buffer. If the entry point exits before stdout drains, the JSON arrives
    // cut off. Build the save in-process (fast), dump it via subprocess.
    playFullSeason('pipe-test', '1')
    const cwd = path.resolve(__dirname, '..')
    const env = { ...process.env, ORCHESTRA_SAVES_DIR: savesDir }
    const stdout = execFileSync('npx', ['tsx', 'src/cli/main.ts', 'state', '--save', 'pipe-test'], {
      cwd, env, encoding: 'utf8', timeout: 60_000, maxBuffer: 16 * 1024 * 1024,
    })
    expect(stdout.length).toBeGreaterThan(64 * 1024)
    expect(() => JSON.parse(stdout)).not.toThrow()
  }, 120_000)
})
