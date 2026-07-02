// The CLI's whole output contract: one JSON document to stdout on success
// (exit 0), one JSON error document to stderr on failure (exit 1). Agents
// parse these directly, so field names here are a stable interface.

export class CliError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'CliError'
  }
}

export function printResult(result: unknown, path?: string): void {
  const selected = path ? selectPath(result, path) : result
  process.stdout.write(`${JSON.stringify(selected, null, 2)}\n`)
}

export function printError(code: string, message: string, extra: Record<string, unknown> = {}): void {
  process.stderr.write(`${JSON.stringify({ error: { code, message, ...extra } }, null, 2)}\n`)
}

// Plain dot/bracket path into the result, e.g. `season.institution.cash` or
// `donors[0].name`. Deliberately no wildcards — agents that need shaping can
// pipe to jq; this is just a cheap way to keep common reads small.
export function selectPath(value: unknown, path: string): unknown {
  const segments = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(segment => segment.length > 0)
  let current: unknown = value
  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== 'object') {
      throw new CliError('bad-path', `Path "${path}" does not exist on the result (stopped at "${segment}").`)
    }
    current = (current as Record<string, unknown>)[segment]
    if (current === undefined) {
      throw new CliError('bad-path', `Path "${path}" does not exist on the result (missing "${segment}").`)
    }
  }
  return current
}
