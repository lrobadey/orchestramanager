import { pathToFileURL } from 'node:url'
import { parseArgs, stringFlag } from './args'
import { CliError, printError, printResult } from './output'
import { loadSave, writeSave } from './store'
import { stateEnvelope, type CommandSpec } from './command'
import { getPhase } from '../engine/state'
import { EngineError } from '../engine/errors'
import { inspectCommands } from './commands/inspect'
import { planCommands } from './commands/plan'
import { playCommands } from './commands/play'
import { batchCommands } from './commands/batch'

// Orchestra Manager CLI — a headless mouth on the same pure engine the UI
// drives. Built for coding agents: one-shot commands, JSON out, JSON errors on
// stderr with exit 1, file-based saves, and a seeded roll stream so any career
// can be replayed from its seed.

const GLOBAL_FLAGS = [
  { name: 'save', type: 'string' as const, description: 'Save name under ./saves/ (default: "default").' },
  { name: 'path', type: 'string' as const, description: 'Dot/bracket path filter on the output, e.g. --path game.season.institution.cash' },
]

const commands: CommandSpec[] = [
  ...planCommands,
  ...playCommands,
  ...inspectCommands,
  ...batchCommands,
]

const schemaCommand: CommandSpec = {
  name: 'schema',
  description: 'Machine-readable description of every command, generated from the dispatch table itself.',
  flags: [],
  mutates: false,
  run() {
    return {
      result: {
        usage: 'npm run cli -- <command> [flags]',
        globalFlags: GLOBAL_FLAGS,
        commands: [...commands, schemaCommand, helpCommand].map(spec => ({
          command: spec.name,
          description: spec.description,
          mutates: spec.mutates,
          flags: spec.flags,
        })),
      },
    }
  },
}

const helpCommand: CommandSpec = {
  name: 'help',
  description: 'Human-readable command reference.',
  flags: [],
  mutates: false,
  run() {
    const lines: string[] = [
      'Orchestra Manager CLI — usage: npm run cli -- <command> [flags]',
      '',
      'Global flags:',
      ...GLOBAL_FLAGS.map(flag => `  --${flag.name.padEnd(12)} ${flag.description}`),
      '',
      'Commands:',
    ]
    for (const spec of [...commands, schemaCommand, helpCommand]) {
      lines.push(`  ${spec.name.padEnd(16)} ${spec.description}`)
      for (const flag of spec.flags) {
        lines.push(`      --${flag.name}${flag.required ? ' (required)' : ''}  ${flag.description}`)
      }
    }
    lines.push('')
    lines.push('A typical season: new → program set ×4 → funding/forecast/ask → begin-season → (run-concert → advance) ×4 → summary')
    process.stdout.write(`${lines.join('\n')}\n`)
    return { result: { ok: true } }
  },
}

function findCommand(positionals: string[]): { spec: CommandSpec; consumed: number } | null {
  const twoWord = positionals.slice(0, 2).join(' ')
  const registry = [...commands, schemaCommand, helpCommand]
  const two = registry.find(spec => spec.name === twoWord)
  if (two) return { spec: two, consumed: 2 }
  const one = registry.find(spec => spec.name === positionals[0])
  if (one) return { spec: one, consumed: 1 }
  return null
}

export function runCli(argv: string[]): number {
  const { positionals, flags } = parseArgs(argv)
  let saveName = 'default'
  try {
    saveName = stringFlag(flags, 'save') ?? 'default'
    const pathFilter = stringFlag(flags, 'path')

    if (positionals.length === 0) {
      helpCommand.run({ saveName, flags })
      return 0
    }
    const match = findCommand(positionals)
    if (!match) {
      throw new CliError('unknown-command', `Unknown command "${positionals.join(' ')}". Run \`schema\` or \`help\` for the command list.`)
    }

    const outcome = match.spec.run({ saveName, flags })
    if (outcome.save) {
      writeSave(saveName, outcome.save)
    }
    if (match.spec.name === 'help') return 0
    const payload = outcome.save && match.spec.mutates
      ? { ...outcome.result, state: stateEnvelope(outcome.save, saveName) }
      : outcome.result
    printResult(payload, pathFilter)
    return 0
  } catch (error) {
    if (error instanceof EngineError) {
      let phase: string | undefined
      try {
        phase = getPhase(loadSave(saveName).game)
      } catch {
        phase = undefined
      }
      printError(error.code, error.message, phase ? { phase } : {})
      return 1
    }
    if (error instanceof CliError) {
      printError(error.code, error.message)
      return 1
    }
    printError('internal-error', error instanceof Error ? error.message : String(error))
    return 1
  }
}

// Only take over the process when run as the entry point; tests import runCli.
// Set exitCode rather than calling process.exit(): exit() tears the process
// down before large stdout writes finish flushing into a pipe, truncating any
// JSON document bigger than the pipe buffer (~64KB) — e.g. a full state dump.
const invokedDirectly = process.argv[1] !== undefined
  && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
  process.exitCode = runCli(process.argv.slice(2))
}
