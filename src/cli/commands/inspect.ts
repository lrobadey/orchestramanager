import { works } from '../../data/works'
import { cityAudienceSegments } from '../../data/audienceSegments'
import { getPhase } from '../../engine/state'
import {
  computeBreachPreview,
  computeLiveSeasonFunding,
  getActiveProgramIndex,
  getEffectiveFunding,
  getForecastForSlot,
  getGoodwillRemaining,
  getOperatingSupportPerConcert,
  isPlanComplete,
} from '../../engine/selectors'
import { summarizeSeason, getAllFinanceTransactions } from '../../sim/season'
import { dedicationsUsed, MAX_DEDICATIONS } from '../../sim/seasonSway'
import { isProgramComplete } from '../../sim/founding'
import { numberFlag, stringFlag } from '../args'
import { CliError } from '../output'
import { loadSave } from '../store'
import type { CommandSpec } from '../command'

// Read-only views. Full transparency by design: hidden donor parameters,
// forecast internals, and funding fits are all inspectable — agents use this
// surface to playtest, debug, and balance.

function requireSlotFlag(value: number | undefined, fallback: number): number {
  const slot = value ?? fallback
  if (!Number.isInteger(slot) || slot < 0 || slot > 3) {
    throw new CliError('bad-flag', `--slot must be 0-3, got ${slot}.`)
  }
  return slot
}

export const inspectCommands: CommandSpec[] = [
  {
    name: 'state',
    description: 'Full dump of the game: phase, seed, roll history, complete state, and derived readouts.',
    flags: [],
    mutates: false,
    run({ saveName }) {
      const save = loadSave(saveName)
      const game = save.game
      return {
        result: {
          phase: getPhase(game),
          seed: save.seed,
          rngCursor: save.rngCursor,
          rollHistory: save.rollHistory,
          derived: {
            planComplete: isPlanComplete(game),
            activeSlotIndex: getActiveProgramIndex(game),
            goodwillRemaining: getGoodwillRemaining(game),
            dedicationsUsed: dedicationsUsed(game.sway),
            maxDedications: MAX_DEDICATIONS,
            operatingSupportPerConcert: getOperatingSupportPerConcert(game),
            fundingSource: game.seasonStarted && game.season.funding ? 'committed' : 'live',
          },
          game,
        },
      }
    },
  },
  {
    name: 'works',
    description: 'The repertoire library: every work with its full stat block.',
    flags: [{ name: 'id', type: 'string', description: 'Show a single work by id.' }],
    mutates: false,
    run({ flags }) {
      const id = stringFlag(flags, 'id')
      if (id) {
        const work = works.find(w => w.id === id)
        if (!work) throw new CliError('unknown-work', `No work with id "${id}".`)
        return { result: { work } }
      }
      return { result: { count: works.length, works } }
    },
  },
  {
    name: 'roster',
    description: 'The orchestra roster: every principal with live form and morale.',
    flags: [],
    mutates: false,
    run({ saveName }) {
      const save = loadSave(saveName)
      return { result: { principals: save.game.season.roster.principals } }
    },
  },
  {
    name: 'donors',
    description: 'The donor pool with full hidden parameters (taste, priorities, volatility) plus their current funding stance.',
    flags: [],
    mutates: false,
    run({ saveName }) {
      const save = loadSave(saveName)
      const funding = getEffectiveFunding(save.game)
      return {
        result: {
          fundingSource: save.game.seasonStarted && save.game.season.funding ? 'committed' : 'live',
          donors: save.game.season.donors.donors,
          fundingByDonor: funding.donors,
          operatingSupport: funding.operatingSupport,
        },
      }
    },
  },
  {
    name: 'audience',
    description: 'City audience segments and the orchestra\'s live relationship with each.',
    flags: [],
    mutates: false,
    run({ saveName }) {
      const save = loadSave(saveName)
      return {
        result: {
          segments: cityAudienceSegments,
          relationships: save.game.season.audience.relationships,
        },
      }
    },
  },
  {
    name: 'funding',
    description: 'The season funding picture: live auto-fill while planning, the frozen commitment once the season begins.',
    flags: [],
    mutates: false,
    run({ saveName }) {
      const save = loadSave(saveName)
      const committed = save.game.seasonStarted && save.game.season.funding
      return {
        result: {
          source: committed ? 'committed' : 'live',
          goodwillRemaining: getGoodwillRemaining(save.game),
          funding: committed ? save.game.season.funding : computeLiveSeasonFunding(save.game),
        },
      }
    },
  },
  {
    name: 'program show',
    description: 'The season plan: each concert\'s program and completeness (or one slot with --slot).',
    flags: [{ name: 'slot', type: 'number', description: 'Show a single slot (0-3).' }],
    mutates: false,
    run({ saveName, flags }) {
      const save = loadSave(saveName)
      const game = save.game
      const slotFlag = numberFlag(flags, 'slot')
      const describe = (index: number) => ({
        slot: index,
        name: game.season.slots[index].name,
        scheduledDate: game.season.slots[index].scheduledDate,
        status: game.season.slots[index].status,
        complete: isProgramComplete(game.draftPrograms[index]),
        program: game.draftPrograms[index],
        ...(game.editDraft && game.seasonStarted && index === game.season.currentSlotIndex
          ? { editDraft: game.editDraft }
          : {}),
      })
      if (slotFlag !== undefined) {
        return { result: describe(requireSlotFlag(slotFlag, 0)) }
      }
      return {
        result: {
          planComplete: isPlanComplete(game),
          seasonStarted: game.seasonStarted,
          slots: [0, 1, 2, 3].map(describe),
        },
      }
    },
  },
  {
    name: 'forecast',
    description: 'Full deterministic forecast for a concert (defaults to the active slot; reflects an open revision draft).',
    flags: [{ name: 'slot', type: 'number', description: 'Slot to forecast (0-3). Defaults to the active slot.' }],
    mutates: false,
    run({ saveName, flags }) {
      const save = loadSave(saveName)
      const slot = requireSlotFlag(numberFlag(flags, 'slot'), getActiveProgramIndex(save.game))
      return {
        result: {
          slot,
          name: save.game.season.slots[slot].name,
          forecast: getForecastForSlot(save.game, slot),
        },
      }
    },
  },
  {
    name: 'report',
    description: 'The pending concert report if one is open, otherwise the last resolved concert\'s report.',
    flags: [],
    mutates: false,
    run({ saveName }) {
      const save = loadSave(saveName)
      const game = save.game
      if (game.pendingReport) {
        return {
          result: {
            status: 'pending',
            slot: game.season.currentSlotIndex,
            roll: game.pendingRoll,
            report: game.pendingReport,
          },
        }
      }
      const lastResolved = game.season.currentSlotIndex > 0
        ? game.season.slots[game.season.currentSlotIndex - 1]
        : null
      if (!lastResolved?.report) {
        throw new CliError('no-report', 'No concert has been performed yet.')
      }
      return {
        result: {
          status: 'resolved',
          slot: lastResolved.index,
          name: lastResolved.name,
          report: lastResolved.report,
        },
      }
    },
  },
  {
    name: 'edit preview',
    description: 'Preview the donor breach the open revision draft would cause if confirmed.',
    flags: [],
    mutates: false,
    run({ saveName }) {
      const save = loadSave(saveName)
      if (!save.game.editDraft) {
        throw new CliError('no-edit-open', 'No revision draft is open. Stage one with: program set --slot <active>')
      }
      const breach = computeBreachPreview(save.game)
      const slot = getActiveProgramIndex(save.game)
      return {
        result: {
          slot,
          committedProgram: save.game.draftPrograms[slot],
          draftProgram: save.game.editDraft,
          breach,
        },
      }
    },
  },
  {
    name: 'summary',
    description: 'The season summary and full transaction ledger (only after all four concerts).',
    flags: [],
    mutates: false,
    run({ saveName }) {
      const save = loadSave(saveName)
      const summary = summarizeSeason(save.game.season)
      if (!summary) {
        throw new CliError(
          'season-incomplete',
          `Only ${save.game.season.currentSlotIndex} of 4 concerts resolved; the season summary is not available yet.`,
        )
      }
      return {
        result: {
          summary,
          rollHistory: save.rollHistory,
          transactions: getAllFinanceTransactions(save.game.season),
        },
      }
    },
  },
]
