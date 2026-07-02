import { works } from '../../data/works'
import * as engine from '../../engine/actions'
import { createNewGame, getPhase } from '../../engine/state'
import { computeLiveSeasonFunding, getGoodwillRemaining } from '../../engine/selectors'
import { swayKey } from '../../sim/seasonSway'
import {
  ConcertProgram,
  MarketingStyle,
  SlotTuple,
  TOTAL_REHEARSAL_HOURS,
} from '../../types/core'
import { booleanFlag, listFlag, numberFlag, stringFlag, type FlagValue } from '../args'
import { CliError } from '../output'
import { createSave, loadSave, saveExists } from '../store'
import type { CommandSpec } from '../command'

const MARKETING_STYLES: MarketingStyle[] = ['prestige', 'grassroots', 'digital', 'critical', 'education']

function requireSlot(flags: Record<string, FlagValue>): number {
  const slot = numberFlag(flags, 'slot')
  if (slot === undefined || !Number.isInteger(slot) || slot < 0 || slot > 3) {
    throw new CliError('bad-flag', `--slot must be 0-3, got ${slot ?? '(missing)'}.`)
  }
  return slot
}

function requireDonorFlag(flags: Record<string, FlagValue>): string {
  const donor = stringFlag(flags, 'donor')
  if (!donor) throw new CliError('bad-flag', '--donor <donor-id> is required.')
  return donor
}

// Build the next program from flags, starting from the slot's current program
// so unspecified flags keep their values. Cross-field validity (unknown works,
// slot legality) is the engine's job; this only turns flags into a shape.
function buildProgram(current: ConcertProgram, flags: Record<string, FlagValue>): ConcertProgram {
  const next: ConcertProgram = {
    ...current,
    workIds: [...current.workIds] as SlotTuple<string | null>,
    rehearsalAllocation: [...current.rehearsalAllocation] as SlotTuple<number>,
  }

  const workList = listFlag(flags, 'works')
  if (workList) {
    if (workList.length < 2 || workList.length > 3) {
      throw new CliError('bad-flag', `--works needs 2 or 3 comma-separated work ids, got ${workList.length}.`)
    }
    next.workCount = workList.length as 2 | 3
    next.workIds = [workList[0] ?? null, workList[1] ?? null, workList[2] ?? null]
  }

  const workCount = numberFlag(flags, 'work-count')
  if (workCount !== undefined) {
    if (workCount !== 2 && workCount !== 3) {
      throw new CliError('bad-flag', `--work-count must be 2 or 3, got ${workCount}.`)
    }
    next.workCount = workCount
  }

  const rehearsal = listFlag(flags, 'rehearsal')
  if (rehearsal) {
    if (rehearsal.length < 2 || rehearsal.length > 3) {
      throw new CliError('bad-flag', `--rehearsal needs 2 or 3 comma-separated hour values, got ${rehearsal.length}.`)
    }
    const hours = rehearsal.map(part => {
      const value = Number(part)
      if (!Number.isFinite(value) || value < 0) {
        throw new CliError('bad-flag', `--rehearsal values must be non-negative numbers, got "${part}".`)
      }
      return value
    })
    const total = hours.reduce((sum, value) => sum + value, 0)
    if (total > TOTAL_REHEARSAL_HOURS) {
      throw new CliError('bad-flag', `Rehearsal hours sum to ${total}; the season allows ${TOTAL_REHEARSAL_HOURS} per concert.`)
    }
    next.rehearsalAllocation = [hours[0] ?? 0, hours[1] ?? 0, hours[2] ?? 0]
  }

  const marketing = numberFlag(flags, 'marketing')
  if (marketing !== undefined) {
    if (marketing < 0) throw new CliError('bad-flag', '--marketing must be >= 0.')
    next.marketingSpend = marketing
  }

  const style = stringFlag(flags, 'style')
  if (style !== undefined) {
    if (!MARKETING_STYLES.includes(style as MarketingStyle)) {
      throw new CliError('bad-flag', `--style must be one of ${MARKETING_STYLES.join(', ')}, got "${style}".`)
    }
    next.marketingStyle = style as MarketingStyle
  }

  const price = numberFlag(flags, 'price')
  if (price !== undefined) {
    if (price < 0) throw new CliError('bad-flag', '--price must be >= 0.')
    next.ticketPrice = price
  }

  if (flags['student-tickets'] !== undefined) {
    next.studentTicketsEnabled = booleanFlag(flags, 'student-tickets')
  }

  const studentPrice = numberFlag(flags, 'student-price')
  if (studentPrice !== undefined) {
    if (studentPrice < 0) throw new CliError('bad-flag', '--student-price must be >= 0.')
    next.studentTicketPrice = studentPrice
    next.studentTicketsEnabled = true
  }

  const intermission = stringFlag(flags, 'intermission')
  if (intermission !== undefined) {
    if (intermission === 'none') next.intermissionAfter = null
    else if (intermission === '0' || intermission === '1') next.intermissionAfter = Number(intermission) as 0 | 1
    else throw new CliError('bad-flag', `--intermission must be 0, 1, or none, got "${intermission}".`)
  }

  return next
}

export const planCommands: CommandSpec[] = [
  {
    name: 'new',
    description: 'Found an orchestra: create a fresh save with a seed that makes the whole career replayable.',
    flags: [
      { name: 'name', type: 'string', description: 'Orchestra name. Defaults to the built-in institution name.' },
      { name: 'seed', type: 'number', description: 'RNG seed for concert rolls. Defaults to a clock-derived seed; pass one for reproducible runs.' },
      { name: 'force', type: 'boolean', description: 'Overwrite an existing save of the same name.' },
    ],
    mutates: true,
    run({ saveName, flags }) {
      if (saveExists(saveName) && !booleanFlag(flags, 'force')) {
        throw new CliError('save-exists', `Save "${saveName}" already exists. Pass --force to overwrite or --save <other-name>.`)
      }
      const name = stringFlag(flags, 'name')
      const seed = numberFlag(flags, 'seed') ?? (Date.now() & 0xffffffff)
      const game = createNewGame(name)
      const save = createSave(saveName, seed, game)
      return {
        result: {
          created: saveName,
          orchestra: game.season.institution.name,
          seed: save.seed,
          concerts: game.season.slots.map(slot => ({ index: slot.index, name: slot.name, scheduledDate: slot.scheduledDate })),
        },
        save,
      }
    },
  },
  {
    name: 'program set',
    description: 'Program a concert: works, rehearsal split, marketing, and pricing. Pre-season this edits the plan; in-season it stages a revision draft for the active concert.',
    flags: [
      { name: 'slot', type: 'number', required: true, description: 'Concert slot (0-3).' },
      { name: 'works', type: 'list', description: 'Comma-separated work ids in program order (2 or 3).' },
      { name: 'rehearsal', type: 'list', description: `Comma-separated rehearsal hours per work (season allows ${TOTAL_REHEARSAL_HOURS} per concert).` },
      { name: 'marketing', type: 'number', description: 'Marketing spend in dollars.' },
      { name: 'style', type: 'string', description: `Marketing style: ${MARKETING_STYLES.join(', ')}.` },
      { name: 'price', type: 'number', description: 'Ticket price in dollars.' },
      { name: 'student-tickets', type: 'boolean', description: 'Enable or disable student tickets.' },
      { name: 'student-price', type: 'number', description: 'Student ticket price (implies --student-tickets on).' },
      { name: 'work-count', type: 'number', description: 'Number of works on the program (2 or 3).' },
      { name: 'intermission', type: 'string', description: 'Intermission after work 0, 1, or "none".' },
    ],
    mutates: true,
    run({ saveName, flags }) {
      const save = loadSave(saveName)
      const slot = requireSlot(flags)
      const base = save.game.seasonStarted && save.game.editDraft && slot === save.game.season.currentSlotIndex
        ? save.game.editDraft
        : save.game.draftPrograms[slot]
      const program = buildProgram(base, flags)
      const game = engine.setProgram(save.game, slot, program)
      const staged = game.editDraft != null
      return {
        result: {
          slot,
          staged: staged ? 'edit-draft' : 'plan',
          program,
          works: program.workIds
            .slice(0, program.workCount)
            .map(id => works.find(work => work.id === id))
            .filter(Boolean)
            .map(work => ({ id: work!.id, title: work!.title, composer: work!.composer })),
        },
        save: { ...save, game },
      }
    },
  },
  {
    name: 'dedicate',
    description: 'Toggle a concert as a donor\'s dedicated "home night" (warms them; at most 3 per season, one per donor).',
    flags: [
      { name: 'slot', type: 'number', required: true, description: 'Concert slot (0-3).' },
      { name: 'donor', type: 'string', required: true, description: 'Donor id.' },
    ],
    mutates: true,
    run({ saveName, flags }) {
      const save = loadSave(saveName)
      const game = engine.toggleDedication(save.game, requireSlot(flags), requireDonorFlag(flags))
      return {
        result: { dedications: game.sway.dedications },
        save: { ...save, game },
      }
    },
  },
  {
    name: 'ask',
    description: 'Set the pledge target you are asking a donor for on a concert. The donor negotiates against their emergent ceiling; overreach costs goodwill and can close their door.',
    flags: [
      { name: 'donor', type: 'string', required: true, description: 'Donor id.' },
      { name: 'slot', type: 'number', required: true, description: 'Concert slot (0-3).' },
      { name: 'amount', type: 'number', required: true, description: 'Absolute pledge target in dollars.' },
    ],
    mutates: true,
    run({ saveName, flags }) {
      const save = loadSave(saveName)
      const slot = requireSlot(flags)
      const donorId = requireDonorFlag(flags)
      const amount = numberFlag(flags, 'amount')
      if (amount === undefined) throw new CliError('bad-flag', '--amount <dollars> is required.')
      const game = engine.setAsk(save.game, donorId, slot, amount)
      // Echo back how the ask landed in the live funding pass.
      const funding = computeLiveSeasonFunding(game)
      const donorResult = funding.donors.find(donor => donor.donorId === donorId)
      const pledge = donorResult?.pledges.find(p => p.concertIndex === slot) ?? null
      return {
        result: {
          donor: donorId,
          slot,
          asked: Math.max(0, Math.round(amount)),
          pledge,
          donorRelationshipDelta: donorResult?.relationshipDelta ?? 0,
          doorClosed: donorResult?.doorClosed ?? false,
          goodwillRemaining: getGoodwillRemaining(game),
        },
        save: { ...save, game },
      }
    },
  },
  {
    name: 'restrict',
    description: 'Toggle a restricted ("named") ask: binds the gift to the donor\'s cause for a higher pledge now, a steeper breach later.',
    flags: [
      { name: 'donor', type: 'string', required: true, description: 'Donor id.' },
      { name: 'slot', type: 'number', required: true, description: 'Concert slot (0-3).' },
    ],
    mutates: true,
    run({ saveName, flags }) {
      const save = loadSave(saveName)
      const slot = requireSlot(flags)
      const donorId = requireDonorFlag(flags)
      const game = engine.toggleRestricted(save.game, donorId, slot)
      return {
        result: {
          donor: donorId,
          slot,
          restricted: Boolean(game.sway.restricted[swayKey(donorId, slot)]),
        },
        save: { ...save, game },
      }
    },
  },
  {
    name: 'begin-season',
    description: 'Commit the plan and make the ask: donor funding freezes, the plan locks, and concerts resolve in order from here.',
    flags: [],
    mutates: true,
    run({ saveName }) {
      const save = loadSave(saveName)
      const game = engine.beginSeason(save.game)
      const funding = game.season.funding!
      return {
        result: {
          phase: getPhase(game),
          seasonCost: funding.seasonCost,
          pledged: funding.pledged,
          coveragePercent: funding.coveragePercent,
          goodwillSpent: funding.goodwillSpent,
          donorRelationshipDeltas: funding.donors
            .filter(donor => donor.relationshipDelta !== 0 || donor.doorClosed)
            .map(donor => ({
              donorId: donor.donorId,
              relationshipDelta: donor.relationshipDelta,
              doorClosed: donor.doorClosed,
            })),
          concerts: funding.concerts.map(concert => ({
            index: concert.concertIndex,
            name: concert.name,
            cost: concert.cost,
            pledged: concert.pledged,
            coveragePercent: concert.coveragePercent,
          })),
        },
        save: { ...save, game },
      }
    },
  },
  {
    name: 'new-season',
    description: 'Start a fresh season with the same orchestra name. Keeps the save\'s seed and roll cursor so the career stays replayable (--seed re-seeds and resets the cursor).',
    flags: [{ name: 'seed', type: 'number', description: 'Replace the seed and reset the roll cursor.' }],
    mutates: true,
    run({ saveName, flags }) {
      const save = loadSave(saveName)
      const game = engine.startNewSeason(save.game)
      const seed = numberFlag(flags, 'seed')
      const next = seed !== undefined
        ? { ...save, game, seed: seed >>> 0, rngCursor: 0, rollHistory: [] }
        : { ...save, game, rollHistory: [] }
      return {
        result: {
          phase: getPhase(game),
          orchestra: game.season.institution.name,
          seed: next.seed,
          rngCursor: next.rngCursor,
        },
        save: next,
      }
    },
  },
]
