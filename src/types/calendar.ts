export type ISODateString = `${number}-${number}-${number}`

export type WeekdayName =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'

export interface GameCalendar {
  /** First simulated day. Orchestra Manager campaigns currently begin May 1, 2026. */
  startDate: ISODateString
  /** Current simulated date in calendar time. */
  currentDate: ISODateString
  /** Zero-based absolute day count since startDate. The sim compares days with this. */
  currentDay: number
}

export interface FiscalYearInfo {
  /** Named by ending calendar year: July 1 2026–June 30 2027 is FY2027. */
  fiscalYear: number
  startsOn: ISODateString
  endsOn: ISODateString
  /** Zero-based day within the fiscal year. */
  fiscalDay: number
  /** One-based fiscal month, where July is 1 and June is 12. */
  fiscalMonth: number
}

export interface ArtisticSeasonInfo {
  /** Public-facing label, e.g. "2026–27". */
  label: string
  startYear: number
  endYear: number
  startsOn: ISODateString
  endsOn: ISODateString
  /** Zero-based day within the artistic season. Negative during pre-season runway. */
  seasonDay: number
}

export interface CalendarDateParts {
  year: number
  month: number
  day: number
}
