// Engine actions fail loudly: where the UI silently ignores an illegal move,
// headless callers (CLI, agents, batch runs) need a typed refusal they can
// branch on. The React hook catches these and restores the previous state.
export type EngineErrorCode =
  | 'plan-incomplete'
  | 'season-not-started'
  | 'season-already-started'
  | 'season-complete'
  | 'season-incomplete'
  | 'edit-open'
  | 'no-edit-open'
  | 'pending-report-open'
  | 'no-pending-report'
  | 'invalid-slot'
  | 'unknown-work'
  | 'unknown-donor'
  | 'invalid-program'
  | 'invalid-name'
  | 'invalid-roll'
  | 'dedication-limit'

export class EngineError extends Error {
  constructor(
    public code: EngineErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'EngineError'
  }
}
