import { works } from '../../data/works'
import * as engine from '../../engine/actions'
import { createNewGame } from '../../engine/state'
import { mulberry32, rollAt } from '../../engine/rng'
import { strategies } from '../../engine/strategies'
import { summarizeSeason } from '../../sim/season'
import { numberFlag, stringFlag } from '../args'
import { CliError } from '../output'
import type { CommandSpec } from '../command'

// Balancing mode: play many deterministic seasons under a strategy and report
// the outcome distribution. No save file is touched — each run drives the
// engine loop directly, exactly like the season-loop integration test. Diff
// the aggregate JSON before and after a balance tweak to see what moved.

interface RunRow {
  seed: number
  finalCash: number
  totalNet: number
  avgQuality: number
  avgAudienceResponse: number
  totalAttendance: number
  avgCapacityPercent: number
  fundingCoveragePercent: number
  insolvent: boolean
}

interface Distribution {
  min: number
  p25: number
  median: number
  p75: number
  max: number
  mean: number
}

function distribution(values: number[]): Distribution {
  const sorted = [...values].sort((a, b) => a - b)
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
  return {
    min: sorted[0],
    p25: at(0.25),
    median: at(0.5),
    p75: at(0.75),
    max: sorted[sorted.length - 1],
    mean: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
  }
}

function playRun(runSeed: number, strategyId: string, rolls: 'seeded' | 'neutral'): RunRow {
  const strategy = strategies[strategyId]
  // Programs and rolls draw from decorrelated streams of the same run seed, so
  // a work-selection draw can never reappear as a concert roll.
  const programRng = mulberry32(runSeed)
  const rollSeed = (runSeed ^ 0x9e3779b9) >>> 0

  let game = createNewGame()
  const programs = strategy.buildPrograms(programRng, works)
  programs.forEach((program, index) => {
    game = engine.setProgram(game, index, program)
  })
  game = engine.beginSeason(game)
  const coverage = game.season.funding?.coveragePercent ?? 0
  for (let i = 0; i < 4; i++) {
    const roll = rolls === 'neutral' ? 50 : rollAt(rollSeed, i)
    game = engine.applyPendingReport(engine.runConcert(game, roll))
  }

  const summary = summarizeSeason(game.season)!
  return {
    seed: runSeed,
    finalCash: game.season.institution.cash,
    totalNet: summary.totalNet,
    avgQuality: summary.averagePerformanceQuality,
    avgAudienceResponse: summary.averageAudienceResponse,
    totalAttendance: summary.totalAttendance,
    avgCapacityPercent: summary.averageCapacityPercent,
    fundingCoveragePercent: Math.round(coverage * 100),
    insolvent: game.season.institution.cash < 0,
  }
}

export const batchCommands: CommandSpec[] = [
  {
    name: 'batch',
    description: 'Play many deterministic seasons under a built-in strategy and report the outcome distribution. Touches no save file.',
    flags: [
      { name: 'runs', type: 'number', description: 'Number of seasons to play (default 50, max 2000).' },
      { name: 'strategy', type: 'string', required: true, description: `One of: ${Object.keys(strategies).join(', ')}.` },
      { name: 'seed', type: 'number', description: 'Master seed; per-run seeds derive from it (default 1).' },
      { name: 'rolls', type: 'string', description: '"seeded" (default) draws each concert roll from the run seed; "neutral" fixes every roll at 50.' },
    ],
    mutates: false,
    run({ flags }) {
      const strategyId = stringFlag(flags, 'strategy') ?? ''
      if (!strategies[strategyId]) {
        throw new CliError('unknown-strategy', `--strategy must be one of: ${Object.keys(strategies).join(', ')}.`)
      }
      const runs = numberFlag(flags, 'runs') ?? 50
      if (!Number.isInteger(runs) || runs < 1 || runs > 2000) {
        throw new CliError('bad-flag', `--runs must be an integer 1-2000, got ${runs}.`)
      }
      const rollsFlag = stringFlag(flags, 'rolls') ?? 'seeded'
      if (rollsFlag !== 'seeded' && rollsFlag !== 'neutral') {
        throw new CliError('bad-flag', `--rolls must be "seeded" or "neutral", got "${rollsFlag}".`)
      }
      const masterSeed = numberFlag(flags, 'seed') ?? 1
      const masterRng = mulberry32(masterSeed >>> 0)
      const perRun: RunRow[] = []
      for (let i = 0; i < runs; i++) {
        perRun.push(playRun(Math.floor(masterRng() * 0xffffffff), strategyId, rollsFlag))
      }
      return {
        result: {
          strategy: strategyId,
          strategyDescription: strategies[strategyId].description,
          runs,
          seed: masterSeed,
          rolls: rollsFlag,
          aggregate: {
            finalCash: distribution(perRun.map(row => row.finalCash)),
            totalNet: distribution(perRun.map(row => row.totalNet)),
            avgQuality: distribution(perRun.map(row => row.avgQuality)),
            avgAudienceResponse: distribution(perRun.map(row => row.avgAudienceResponse)),
            avgCapacityPercent: distribution(perRun.map(row => row.avgCapacityPercent)),
            insolvencyRate: Math.round((perRun.filter(row => row.insolvent).length / runs) * 1000) / 1000,
            fundingCoveragePercent: distribution(perRun.map(row => row.fundingCoveragePercent)),
          },
          perRun,
        },
      }
    },
  },
]
