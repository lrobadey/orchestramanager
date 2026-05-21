import { describe, expect, it } from 'vitest'
import { audienceSegments } from '../src/data/audienceSegments'
import { startingInstitution } from '../src/data/institution'
import { principals } from '../src/data/principals'
import { works } from '../src/data/works'
import { forecastProgram } from '../src/sim/forecastProgram'
import { createInitialSeason } from '../src/sim/season'
import { TOTAL_REHEARSAL_HOURS, type ConcertProgram } from '../src/types/core'
import { buildConcertPresentation } from '../src/view-models/concertPresentation'

function programWithWorks(workIds: [string, string, string]): ConcertProgram {
  return {
    workCount: 3,
    workIds,
    intermissionAfter: 1,
    rehearsalAllocation: [7, 7, TOTAL_REHEARSAL_HOURS - 14],
    marketingSpend: 15_000,
    ticketPrice: 70,
    studentTicketsEnabled: true,
    studentTicketPrice: 25,
  }
}

describe('buildConcertPresentation', () => {
  it('maps live season, program, forecast, and roster data into presentation fields', () => {
    const season = createInitialSeason(startingInstitution, principals)
    const program = programWithWorks([works[0].id, works[1].id, works[2].id])
    const forecast = forecastProgram({
      works,
      institution: season.institution,
      principals: season.roster.principals,
      audienceSegments,
      program,
    })

    const presentation = buildConcertPresentation({ season, program, forecast, works })

    expect(presentation.season.currentSlotName).toBe(season.slots[0].name)
    expect(presentation.program.slots).toHaveLength(3)
    expect(presentation.program.slots[0].work?.id).toBe(works[0].id)
    expect(presentation.program.marketingSpend).toBe('$15,000')
    expect(presentation.program.ticketPrice).toBe('$70')
    expect(presentation.forecast.isComplete).toBe(true)
    expect(presentation.forecast.headline.map(metric => metric.label)).toEqual([
      'Attendance',
      'Net',
      'Risk',
    ])
    expect(presentation.forecast.audienceSegments.length).toBeGreaterThan(0)
    expect(presentation.roster.sections.map(section => section.section)).toEqual([
      'strings',
      'winds',
      'brass',
      'percussion',
    ])
    expect(presentation.report).toBeNull()
  })
})
