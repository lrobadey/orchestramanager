import type { FlagValue } from './args'
import type { SaveFile } from './store'
import { getPhase } from '../engine/state'
import { isPlanComplete } from '../engine/selectors'

// Every command is described by a spec so `schema` can emit the whole surface
// from the same table the dispatcher runs — the self-description can't drift
// from the implementation.
export interface FlagSpec {
  name: string
  type: 'string' | 'number' | 'boolean' | 'list'
  required?: boolean
  description: string
}

export interface CommandContext {
  saveName: string
  flags: Record<string, FlagValue>
}

export interface CommandOutcome {
  result: Record<string, unknown>
  // Present when the command changed the game; written back to disk and
  // reflected in the `state` envelope appended to the output.
  save?: SaveFile
}

export interface CommandSpec {
  name: string
  description: string
  flags: FlagSpec[]
  // Whether the command advances or edits the game (vs a pure read).
  mutates: boolean
  run(ctx: CommandContext): CommandOutcome
}

// Compact orientation appended to every mutating command's output so agents
// know where the game stands without a follow-up `state` call.
export function stateEnvelope(save: SaveFile, saveName: string): Record<string, unknown> {
  return {
    phase: getPhase(save.game),
    currentSlotIndex: save.game.season.currentSlotIndex,
    cash: save.game.season.institution.cash,
    planComplete: isPlanComplete(save.game),
    seed: save.seed,
    rngCursor: save.rngCursor,
    save: saveName,
  }
}
