import { describe, expect, it } from 'vitest'
import {
  advanceCalendar,
  createInitialCalendar,
  dateToDayIndex,
  dayIndexToDate,
  formatLongDate,
  getArtisticSeasonInfo,
  getFiscalYearInfo,
  getSeasonWeekLabel,
  getWeekday,
} from '../src/sim/calendar'

describe('calendar system', () => {
  it('starts the campaign on May 1, 2026', () => {
    const calendar = createInitialCalendar()
    expect(calendar.startDate).toBe('2026-05-01')
    expect(calendar.currentDate).toBe('2026-05-01')
    expect(calendar.currentDay).toBe(0)
    expect(getWeekday(calendar.currentDate)).toBe('Friday')
  })

  it('round-trips dates and absolute day indices across calendar years', () => {
    expect(dateToDayIndex('2026-09-14')).toBe(136)
    expect(dayIndexToDate(136)).toBe('2026-09-14')
    expect(dayIndexToDate(dateToDayIndex('2027-03-22'))).toBe('2027-03-22')
  })

  it('advances only forward by whole days', () => {
    const calendar = advanceCalendar(createInitialCalendar(), 31)
    expect(calendar.currentDate).toBe('2026-06-01')
    expect(calendar.currentDay).toBe(31)
  })

  it('derives fiscal years from a July 1 boundary', () => {
    expect(getFiscalYearInfo('2026-06-30').fiscalYear).toBe(2026)
    const fy2027 = getFiscalYearInfo('2026-07-01')
    expect(fy2027.fiscalYear).toBe(2027)
    expect(fy2027.startsOn).toBe('2026-07-01')
    expect(fy2027.endsOn).toBe('2027-06-30')
    expect(fy2027.fiscalDay).toBe(0)
  })

  it('derives artistic seasons from a September 1 boundary', () => {
    expect(getArtisticSeasonInfo('2026-08-31').label).toBe('2025–26')
    const season = getArtisticSeasonInfo('2026-09-01')
    expect(season.label).toBe('2026–27')
    expect(season.startsOn).toBe('2026-09-01')
    expect(season.endsOn).toBe('2027-06-30')
    expect(season.seasonDay).toBe(0)
    expect(getSeasonWeekLabel('2026-09-01')).toBe('Week 1')
  })

  it('formats dates for UI without storing UI labels as state', () => {
    expect(formatLongDate('2026-09-14')).toBe('Monday, September 14, 2026')
  })
})
