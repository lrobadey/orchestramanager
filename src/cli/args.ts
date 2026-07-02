// Minimal argv parser: positionals first (the command words), then
// `--flag value`, `--flag=value`, or bare boolean flags. No dependency — the
// command surface is flat enough that a real parser buys nothing.

export type FlagValue = string | boolean

export interface ParsedArgs {
  positionals: string[]
  flags: Record<string, FlagValue>
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = []
  const flags: Record<string, FlagValue> = {}
  let i = 0
  while (i < argv.length) {
    const token = argv[i]
    if (token.startsWith('--')) {
      const body = token.slice(2)
      const eq = body.indexOf('=')
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1)
      } else {
        const next = argv[i + 1]
        if (next !== undefined && !next.startsWith('--')) {
          flags[body] = next
          i += 1
        } else {
          flags[body] = true
        }
      }
    } else {
      positionals.push(token)
    }
    i += 1
  }
  return { positionals, flags }
}

// Typed flag readers. Each throws a plain Error the CLI layer converts into
// its JSON error contract.
export function stringFlag(flags: Record<string, FlagValue>, name: string): string | undefined {
  const value = flags[name]
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new Error(`--${name} needs a value`)
  return value
}

export function numberFlag(flags: Record<string, FlagValue>, name: string): number | undefined {
  const value = stringFlag(flags, name)
  if (value === undefined) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`--${name} must be a number, got "${value}"`)
  return parsed
}

export function booleanFlag(flags: Record<string, FlagValue>, name: string): boolean {
  const value = flags[name]
  if (value === undefined) return false
  if (value === true) return true
  if (value === 'true' || value === 'on' || value === 'yes') return true
  if (value === 'false' || value === 'off' || value === 'no') return false
  throw new Error(`--${name} must be a boolean (true/false/on/off), got "${value}"`)
}

// Comma-separated list flag, e.g. --works a,b,c or --rehearsal 4,7,9
export function listFlag(flags: Record<string, FlagValue>, name: string): string[] | undefined {
  const value = stringFlag(flags, name)
  if (value === undefined) return undefined
  return value.split(',').map(part => part.trim()).filter(part => part.length > 0)
}
