import type {
  ArtisticSeasonInfo,
  CalendarDateParts,
  FiscalYearInfo,
  GameCalendar,
  ISODateString,
  WeekdayName,
} from '../types/calendar'

export const GAME_START_DATE: ISODateString = '2026-05-01'
export const FISCAL_YEAR_START_MONTH = 7
export const FISCAL_YEAR_START_DAY = 1
export const ARTISTIC_SEASON_START_MONTH = 9
export const ARTISTIC_SEASON_START_DAY = 1
export const ARTISTIC_SEASON_END_MONTH = 6
export const ARTISTIC_SEASON_END_DAY = 30

const MS_PER_DAY = 24 * 60 * 60 * 1000
const WEEKDAYS: WeekdayName[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function createInitialCalendar(startDate: ISODateString = GAME_START_DATE): GameCalendar {
  return {
    startDate,
    currentDate: startDate,
    currentDay: 0,
  }
}

export function advanceCalendar(calendar: GameCalendar, days: number): GameCalendar {
  if (!Number.isInteger(days)) throw new Error(`Calendar can only advance by whole days: ${days}`)
  if (days < 0) throw new Error(`Calendar cannot advance by a negative number of days: ${days}`)

  return setCalendarDay(calendar, calendar.currentDay + days)
}

export function setCalendarDay(calendar: GameCalendar, dayIndex: number): GameCalendar {
  if (!Number.isInteger(dayIndex)) throw new Error(`Calendar day index must be an integer: ${dayIndex}`)
  if (dayIndex < calendar.currentDay) {
    throw new Error(`Calendar cannot move backwards from day ${calendar.currentDay} to day ${dayIndex}`)
  }

  return {
    ...calendar,
    currentDay: dayIndex,
    currentDate: dayIndexToDate(dayIndex, calendar.startDate),
  }
}

export function dateToDayIndex(date: ISODateString, startDate: ISODateString = GAME_START_DATE): number {
  return Math.round((toUtcDate(date).getTime() - toUtcDate(startDate).getTime()) / MS_PER_DAY)
}

export function dayIndexToDate(dayIndex: number, startDate: ISODateString = GAME_START_DATE): ISODateString {
  if (!Number.isInteger(dayIndex)) throw new Error(`Day index must be an integer: ${dayIndex}`)
  const start = toUtcDate(startDate)
  const result = new Date(start.getTime() + dayIndex * MS_PER_DAY)
  return toISODate(result)
}

export function daysBetween(from: ISODateString, to: ISODateString): number {
  return dateToDayIndex(to, from)
}

export function compareDates(a: ISODateString, b: ISODateString): number {
  return dateToDayIndex(a, b)
}

export function getWeekday(dateOrDay: ISODateString | number, startDate: ISODateString = GAME_START_DATE): WeekdayName {
  const date = typeof dateOrDay === 'number' ? dayIndexToDate(dateOrDay, startDate) : dateOrDay
  return WEEKDAYS[toUtcDate(date).getUTCDay()]
}

export function getMonthLabel(dateOrDay: ISODateString | number, startDate: ISODateString = GAME_START_DATE): string {
  const date = typeof dateOrDay === 'number' ? dayIndexToDate(dateOrDay, startDate) : dateOrDay
  return MONTH_LABELS[parseDateParts(date).month - 1]
}

export function formatShortDate(dateOrDay: ISODateString | number, startDate: ISODateString = GAME_START_DATE): string {
  const date = typeof dateOrDay === 'number' ? dayIndexToDate(dateOrDay, startDate) : dateOrDay
  const { month, day } = parseDateParts(date)
  return `${MONTH_LABELS[month - 1]} ${day}`
}

export function formatLongDate(dateOrDay: ISODateString | number, startDate: ISODateString = GAME_START_DATE): string {
  const date = typeof dateOrDay === 'number' ? dayIndexToDate(dateOrDay, startDate) : dateOrDay
  const { year, month, day } = parseDateParts(date)
  return `${getWeekday(date)}, ${MONTH_LABELS[month - 1]} ${day}, ${year}`
}

export function getFiscalYearInfo(dateOrDay: ISODateString | number, startDate: ISODateString = GAME_START_DATE): FiscalYearInfo {
  const date = typeof dateOrDay === 'number' ? dayIndexToDate(dateOrDay, startDate) : dateOrDay
  const { year, month } = parseDateParts(date)
  const fiscalYear = month >= FISCAL_YEAR_START_MONTH ? year + 1 : year
  const startYear = fiscalYear - 1
  const startsOn = makeISODate(startYear, FISCAL_YEAR_START_MONTH, FISCAL_YEAR_START_DAY)
  const endsOn = makeISODate(fiscalYear, ARTISTIC_SEASON_END_MONTH, ARTISTIC_SEASON_END_DAY)
  const fiscalDay = daysBetween(startsOn, date)
  const fiscalMonth = ((month - FISCAL_YEAR_START_MONTH + 12) % 12) + 1

  return { fiscalYear, startsOn, endsOn, fiscalDay, fiscalMonth }
}

export function getArtisticSeasonInfo(dateOrDay: ISODateString | number, startDate: ISODateString = GAME_START_DATE): ArtisticSeasonInfo {
  const date = typeof dateOrDay === 'number' ? dayIndexToDate(dateOrDay, startDate) : dateOrDay
  const { year, month } = parseDateParts(date)
  const startYear = month >= ARTISTIC_SEASON_START_MONTH ? year : year - 1
  const endYear = startYear + 1
  const startsOn = makeISODate(startYear, ARTISTIC_SEASON_START_MONTH, ARTISTIC_SEASON_START_DAY)
  const endsOn = makeISODate(endYear, ARTISTIC_SEASON_END_MONTH, ARTISTIC_SEASON_END_DAY)
  const shortEnd = String(endYear).slice(-2)

  return {
    label: `${startYear}–${shortEnd}`,
    startYear,
    endYear,
    startsOn,
    endsOn,
    seasonDay: daysBetween(startsOn, date),
  }
}

export function getSeasonWeekLabel(dateOrDay: ISODateString | number, startDate: ISODateString = GAME_START_DATE): string {
  const season = getArtisticSeasonInfo(dateOrDay, startDate)
  if (season.seasonDay < 0) {
    return `Pre-season · ${Math.abs(Math.floor(season.seasonDay / 7)) + 1} wk out`
  }
  return `Week ${Math.floor(season.seasonDay / 7) + 1}`
}

export function parseDateParts(date: ISODateString): CalendarDateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) throw new Error(`Invalid ISO date: ${date}`)

  const [, yearText, monthText, dayText] = match
  const parts = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  }

  // Round-trip through UTC Date to catch invalid dates such as 2026-02-31.
  if (toISODate(toUtcDate(date)) !== date) throw new Error(`Invalid ISO date: ${date}`)
  return parts
}

export function makeISODate(year: number, month: number, day: number): ISODateString {
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` as ISODateString
  parseDateParts(date)
  return date
}

function toUtcDate(date: ISODateString): Date {
  const { year, month, day } = parseDatePartsUnchecked(date)
  return new Date(Date.UTC(year, month - 1, day))
}

function parseDatePartsUnchecked(date: ISODateString): CalendarDateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) throw new Error(`Invalid ISO date: ${date}`)
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

function toISODate(date: Date): ISODateString {
  return date.toISOString().slice(0, 10) as ISODateString
}
