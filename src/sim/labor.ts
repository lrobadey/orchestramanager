import type { SectionForces, SectionKey, Work } from '../types/core'

// --- The per-service freelance labor model -----------------------------------
//
// The orchestra engages musicians per service: every rehearsal hour and the
// concert itself are paid work for every player on stage. A work's authored
// forces (from its instrumentation) determine how many players each section
// needs; the program's stage headcount per section is the largest requirement
// across its works.
//
// Two structural rates sit on top of base scale:
// - Principals carry a premium (leadership chairs cost more, as on any
//   freelance list).
// - Players beyond the orchestra's core list are extras, engaged at a premium
//   (the cost spike of programming beyond your standing roster).
//
// Rehearsal payroll is priced per work: hours allocated to a piece are paid at
// THAT piece's headcount, so rehearsing the big symphony costs real money while
// hours on a chamber-scale opener are cheap. Preparation is money, not just
// risk distribution.
//
// The model is service-based so a purchasable-rehearsals lever can bolt on
// later: a service is SERVICE_HOURS long and priced at BASE_SCALE_PER_SERVICE.

export const SERVICE_HOURS = 2.5
export const BASE_SCALE_PER_SERVICE = 150
export const PRINCIPAL_PAY_MULTIPLIER = 1.5
export const EXTRA_PAY_MULTIPLIER = 1.25

// The orchestra's standing core list per section (~56 players). Works whose
// forces exceed the list bring in extras at EXTRA_PAY_MULTIPLIER.
export const CORE_LIST: SectionForces = {
  strings: 38,
  winds: 9,
  brass: 7,
  percussion: 2,
}

// Principal chairs per section on the current roster. The roster does not
// change size in this slice, so the counts are a rate-structure constant
// (mirrors src/data/principals.ts).
export const PRINCIPAL_CHAIRS: SectionForces = {
  strings: 5,
  winds: 4,
  brass: 4,
  percussion: 2,
}

const SECTIONS: SectionKey[] = ['strings', 'winds', 'brass', 'percussion']

export interface SectionPayroll {
  section: SectionKey
  // Largest requirement across the program's works — who is on stage at the concert.
  concertHeadcount: number
  extraPlayers: number
  concertCost: number
  rehearsalCost: number
}

export interface PayrollResult {
  // Per-section stage headcount at the concert (max across works).
  concertForces: SectionForces
  musicians: number
  extraPlayers: number
  concertPayroll: number
  rehearsalPayroll: number
  total: number
  perSection: SectionPayroll[]
}

// Cost of one service for n players in a section: principals at premium, core
// players at scale, extras beyond the core list at the extras premium.
export function sectionServiceCost(section: SectionKey, headcount: number): number {
  if (headcount <= 0) return 0
  const principals = Math.min(PRINCIPAL_CHAIRS[section], headcount)
  const extras = Math.max(0, headcount - CORE_LIST[section])
  const corePlayers = Math.max(0, headcount - principals - extras)
  return (
    (principals * PRINCIPAL_PAY_MULTIPLIER + corePlayers + extras * EXTRA_PAY_MULTIPLIER) *
    BASE_SCALE_PER_SERVICE
  )
}

function maxForces(works: readonly Work[]): SectionForces {
  return {
    strings: Math.max(0, ...works.map(work => work.forces.strings)),
    winds: Math.max(0, ...works.map(work => work.forces.winds)),
    brass: Math.max(0, ...works.map(work => work.forces.brass)),
    percussion: Math.max(0, ...works.map(work => work.forces.percussion)),
  }
}

// Full program payroll. `rehearsalHoursPerWork` is aligned with `works`: the
// hours the player allocated to each piece.
export function computePayroll(
  works: readonly Work[],
  rehearsalHoursPerWork: readonly number[],
): PayrollResult {
  const concertForces = maxForces(works)
  const hourlyFactor = 1 / SERVICE_HOURS

  const perSection: SectionPayroll[] = SECTIONS.map(section => {
    const concertHeadcount = concertForces[section]
    const concertCost = sectionServiceCost(section, concertHeadcount)
    const rehearsalCost = works.reduce((sum, work, index) => {
      const hours = rehearsalHoursPerWork[index] ?? 0
      return sum + sectionServiceCost(section, work.forces[section]) * hourlyFactor * hours
    }, 0)
    return {
      section,
      concertHeadcount,
      extraPlayers: Math.max(0, concertHeadcount - CORE_LIST[section]),
      concertCost: Math.round(concertCost),
      rehearsalCost: Math.round(rehearsalCost),
    }
  })

  const concertPayroll = perSection.reduce((sum, row) => sum + row.concertCost, 0)
  const rehearsalPayroll = perSection.reduce((sum, row) => sum + row.rehearsalCost, 0)
  const musicians = SECTIONS.reduce((sum, section) => sum + concertForces[section], 0)
  const extraPlayers = perSection.reduce((sum, row) => sum + row.extraPlayers, 0)

  return {
    concertForces,
    musicians,
    extraPlayers,
    concertPayroll,
    rehearsalPayroll,
    total: concertPayroll + rehearsalPayroll,
    perSection,
  }
}
