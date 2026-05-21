// Roman numerals shared across the season UI. Kept as two arrays so callers
// can pick the right one for their domain:
// - CONCERT_ROMAN: the four concerts in a season.
// - SLOT_ROMAN: the three work slots within a single concert.
export const CONCERT_ROMAN = ['I', 'II', 'III', 'IV'] as const
export const SLOT_ROMAN = ['I', 'II', 'III'] as const
