import { principals } from '../data/principals'
import { startingInstitution } from '../data/institution'
import { createInitialSeason } from '../sim/season'
import { createSwayState, type SwayState } from '../sim/seasonSway'
import { sanitizeOrchestraName } from '../sim/founding'
import {
  ConcertProgram,
  ConcertReport,
  SeasonState,
  SlotTuple,
  TOTAL_REHEARSAL_HOURS,
} from '../types/core'

export type SeasonPrograms = [ConcertProgram, ConcertProgram, ConcertProgram, ConcertProgram]

// The complete game: SeasonState plus everything the season loop needs that
// used to live as separate useState cells in the React hook. Plain JSON all the
// way down, so a save file is just GameState stringified.
export interface GameState {
  season: SeasonState
  // One program per concert slot: the editable plan pre-season, the committed
  // plan (revisable one concert at a time) once the season begins.
  draftPrograms: SeasonPrograms
  // The player's sway over donors during planning: dedications, pushed asks,
  // restricted asks. Frozen into committed funding when the season begins.
  sway: SwayState
  seasonStarted: boolean
  // A resolved-but-uncommitted concert: runConcert produces it, advance
  // (applyPendingReport) folds it into the season.
  pendingReport: ConcertReport | null
  // The roll that produced pendingReport — kept for transparency and replay.
  pendingRoll: number | null
  // Mid-season revision: an uncommitted draft of the active concert's program.
  // Null when not revising.
  editDraft: ConcertProgram | null
}

// Where the game stands, derived from state rather than stored so it can never
// contradict the data. Each phase gates a different set of legal actions.
export type GamePhase = 'planning' | 'in-season' | 'editing' | 'report' | 'season-complete'

export function getPhase(state: GameState): GamePhase {
  if (!state.seasonStarted) return 'planning'
  if (state.pendingReport) return 'report'
  if (state.season.currentSlotIndex >= 4) return 'season-complete'
  if (state.editDraft) return 'editing'
  return 'in-season'
}

const evenAllocation = (): SlotTuple<number> => [7, 7, TOTAL_REHEARSAL_HOURS - 14]

export const emptyProgram = (): ConcertProgram => ({
  workCount: 3,
  workIds: [null, null, null],
  intermissionAfter: 1,
  rehearsalAllocation: evenAllocation(),
  marketingSpend: 15_000,
  marketingStyle: 'digital',
  ticketPrice: 70,
  studentTicketsEnabled: false,
  studentTicketPrice: 25,
})

export const emptyDraftPrograms = (): SeasonPrograms => [
  emptyProgram(),
  emptyProgram(),
  emptyProgram(),
  emptyProgram(),
]

export function createNewGame(orchestraName: string = startingInstitution.name): GameState {
  const name = sanitizeOrchestraName(orchestraName)
  return {
    season: createInitialSeason({ ...startingInstitution, name }, principals),
    draftPrograms: emptyDraftPrograms(),
    sway: createSwayState(),
    seasonStarted: false,
    pendingReport: null,
    pendingRoll: null,
    editDraft: null,
  }
}
