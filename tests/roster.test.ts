import { describe, it, expect } from 'vitest'
import {
  calculateRepertoireFit,
  calculateRosterChangesAfterConcert,
  calculateSectionStress,
  updateRosterAfterConcert,
} from '../src/sim/roster'
import { Principal, SectionOutcome, Work } from '../src/types/core'

function makePrincipal(overrides: Partial<Principal> = {}): Principal {
  return {
    id: overrides.id ?? 'principal-strings',
    name: overrides.name ?? 'Test Principal',
    position: overrides.position ?? 'Concertmaster',
    section: overrides.section ?? 'strings',
    overall: overrides.overall ?? 60,
    morale: overrides.morale ?? 60,
    form: overrides.form ?? 60,
    intonation: overrides.intonation ?? 60,
    rhythm: overrides.rhythm ?? 60,
    endurance: overrides.endurance ?? 60,
    tone: overrides.tone ?? 60,
    blend: overrides.blend ?? 60,
    soloReliability: overrides.soloReliability ?? 60,
    leadership: overrides.leadership ?? 60,
    stressResistance: overrides.stressResistance ?? 60,
    newMusicFluency: overrides.newMusicFluency ?? 60,
    classicalFluency: overrides.classicalFluency ?? 60,
    romanticFluency: overrides.romanticFluency ?? 60,
  }
}

function makeWork(demands: Work['demands']): Work {
  return {
    id: 'test-work',
    title: 'Test Work',
    composer: 'Test',
    durationMinutes: 30,
    era: 'romantic',
    isContemporary: false,
    audienceDraw: 50,
    artisticPrestige: 50,
    donorComfort: 50,
    novelty: 50,
    identityValue: 50,
    rehearsalLoad: 40,
    familiarity: 50,
    demands,
    forces: { strings: 30, winds: 8, brass: 6, percussion: 2 },
  }
}

describe('roster calculations', () => {
  it('strong principals reduce section stress', () => {
    const work = makeWork({ strings: 90, winds: 0, brass: 0, percussion: 0 })
    const weak = [makePrincipal({ overall: 35, form: 35, morale: 35, stressResistance: 35 })]
    const strong = [makePrincipal({ overall: 85, form: 85, morale: 85, stressResistance: 85 })]

    expect(calculateSectionStress([work], strong).strings).toBeLessThan(
      calculateSectionStress([work], weak).strings,
    )
  })

  it('high stress resistance reduces solo-exposure penalties', () => {
    const work = makeWork({ strings: 95, winds: 0, brass: 0, percussion: 0 })
    const brittle = [makePrincipal({ stressResistance: 25, soloReliability: 50 })]
    const steady = [makePrincipal({ stressResistance: 90, soloReliability: 50 })]

    const brittleFit = calculateRepertoireFit([work], brittle).find(row => row.section === 'strings')!
    const steadyFit = calculateRepertoireFit([work], steady).find(row => row.section === 'strings')!

    expect(steadyFit.exposurePenalty).toBeLessThan(brittleFit.exposurePenalty)
    expect(steadyFit.stress).toBeLessThan(brittleFit.stress)
  })

  it('high morale and form improve fit slightly', () => {
    const work = makeWork({ strings: 80, winds: 0, brass: 0, percussion: 0 })
    const tired = [makePrincipal({ form: 30, morale: 30 })]
    const confident = [makePrincipal({ form: 85, morale: 85 })]

    const tiredFit = calculateRepertoireFit([work], tired).find(row => row.section === 'strings')!
    const confidentFit = calculateRepertoireFit([work], confident).find(row => row.section === 'strings')!

    expect(confidentFit.strength).toBeGreaterThan(tiredFit.strength)
    expect(confidentFit.stress).toBeLessThan(tiredFit.stress)
  })

  it('concert outcomes update player form and morale within bounds', () => {
    const principal = makePrincipal({ form: 99, morale: 1 })
    const outcomes: SectionOutcome[] = [
      { section: 'strings', label: 'Strings', quality: 95, note: 'Clean.' },
    ]
    const changes = calculateRosterChangesAfterConcert([principal], outcomes, 90)
    const updated = updateRosterAfterConcert({ principals: [principal] }, changes)

    expect(updated.principals[0].form).toBeLessThanOrEqual(100)
    expect(updated.principals[0].morale).toBeGreaterThanOrEqual(0)
    expect(updated.principals[0].form).toBeGreaterThan(principal.form)
    expect(updated.principals[0].morale).toBeGreaterThan(principal.morale)
  })

  it('poor concert outcomes reduce player form and morale without going below zero', () => {
    const principal = makePrincipal({ form: 1, morale: 1 })
    const outcomes: SectionOutcome[] = [
      { section: 'strings', label: 'Strings', quality: 5, note: 'Collapsed.' },
    ]
    const changes = calculateRosterChangesAfterConcert([principal], outcomes, 10)
    const updated = updateRosterAfterConcert({ principals: [principal] }, changes)

    expect(changes[0].formDelta).toBeLessThan(0)
    expect(changes[0].moraleDelta).toBeLessThan(0)
    expect(updated.principals[0].form).toBe(0)
    expect(updated.principals[0].morale).toBe(0)
  })
})
