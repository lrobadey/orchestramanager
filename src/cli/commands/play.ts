import * as engine from '../../engine/actions'
import { getPhase } from '../../engine/state'
import { getForecastForSlot } from '../../engine/selectors'
import { rollAt } from '../../engine/rng'
import { numberFlag } from '../args'
import { loadSave, type SaveFile } from '../store'
import type { CommandSpec } from '../command'

// The in-season loop: run the active concert, read the report, commit it.
// run-concert is where the game's single stochastic input enters — seeded from
// the save by default, overridable with --roll for what-ifs that never consume
// the seeded stream.

export const playCommands: CommandSpec[] = [
  {
    name: 'run-concert',
    description: 'Perform the active concert. The roll (0-100, 50 = neutral) comes from the save\'s seed unless --roll overrides it; the report stays pending until `advance`.',
    flags: [
      { name: 'roll', type: 'number', description: 'Override the seeded roll (0-100). Does not consume the seeded stream.' },
    ],
    mutates: true,
    run({ saveName, flags }) {
      const save = loadSave(saveName)
      const override = numberFlag(flags, 'roll')
      const roll = override ?? rollAt(save.seed, save.rngCursor)
      const source: 'seeded' | 'override' = override !== undefined ? 'override' : 'seeded'
      const slotIndex = save.game.season.currentSlotIndex
      // The engine validates first (phase, roll, open drafts); only then is the
      // pre-concert forecast worth computing, side by side with the report —
      // what the plan promised vs what the night delivered.
      const game = engine.runConcert(save.game, roll)
      const forecast = getForecastForSlot(save.game, slotIndex)
      const next: SaveFile = {
        ...save,
        game,
        rngCursor: source === 'seeded' ? save.rngCursor + 1 : save.rngCursor,
        rollHistory: [...save.rollHistory, { slotIndex, roll, source }],
      }
      return {
        result: {
          slot: slotIndex,
          name: save.game.season.slots[slotIndex].name,
          roll,
          rollSource: source,
          forecast,
          report: game.pendingReport,
        },
        save: next,
      }
    },
  },
  {
    name: 'advance',
    description: 'Commit the pending concert report: consequences land on the institution, roster, donors, and audience, and the season advances.',
    flags: [],
    mutates: true,
    run({ saveName }) {
      const save = loadSave(saveName)
      const resolvedSlot = save.game.season.currentSlotIndex
      const report = save.game.pendingReport
      const game = engine.applyPendingReport(save.game)
      return {
        result: {
          resolvedSlot,
          name: save.game.season.slots[resolvedSlot].name,
          institutionalDeltas: report?.institutionalDeltas ?? null,
          phase: getPhase(game),
          nextSlot: game.season.currentSlotIndex < 4
            ? {
                index: game.season.currentSlotIndex,
                name: game.season.slots[game.season.currentSlotIndex].name,
                scheduledDate: game.season.slots[game.season.currentSlotIndex].scheduledDate,
              }
            : null,
        },
        save: { ...save, game },
      }
    },
  },
  {
    name: 'edit confirm',
    description: 'Confirm the open revision draft: the program changes and any donor breach lands (pledges shrink, donors cool).',
    flags: [],
    mutates: true,
    run({ saveName }) {
      const save = loadSave(saveName)
      const slot = save.game.season.currentSlotIndex
      const before = save.game.season.funding?.concerts.find(c => c.concertIndex === slot)
      const game = engine.confirmEdit(save.game)
      const after = game.season.funding?.concerts.find(c => c.concertIndex === slot)
      return {
        result: {
          slot,
          program: game.draftPrograms[slot],
          pledgedBefore: before?.pledged ?? null,
          pledgedAfter: after?.pledged ?? null,
          withdrawn: before && after ? before.pledged - after.pledged : null,
        },
        save: { ...save, game },
      }
    },
  },
  {
    name: 'edit cancel',
    description: 'Discard the open revision draft; the committed program stands.',
    flags: [],
    mutates: true,
    run({ saveName }) {
      const save = loadSave(saveName)
      const game = engine.cancelEdit(save.game)
      return {
        result: { slot: game.season.currentSlotIndex, cancelled: true },
        save: { ...save, game },
      }
    },
  },
]
