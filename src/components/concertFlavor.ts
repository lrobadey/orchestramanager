interface ConcertFlavor {
  title: string
  date: string
  venue: string
  blurb: string
  movementNames: [string, string, string]
}

const SLOT_FLAVORS: ConcertFlavor[] = [
  {
    title: 'RESONANCE',
    date: 'October 11, 2030 · Sat 7:30pm',
    venue: 'Harmonia Hall',
    blurb: 'A bold statement to open the season—uniting romantic grandeur, contemporary voice, and orchestral virtuosity.',
    movementNames: ['Awakening', 'Conflict', 'Transcendence'],
  },
  {
    title: 'VIGIL',
    date: 'January 17, 2031 · Sat 7:30pm',
    venue: 'Harmonia Hall',
    blurb: 'A winter meditation. The hall darkens, the orchestra speaks in confidences, and the audience holds its breath.',
    movementNames: ['Stillness', 'Threshold', 'Return'],
  },
  {
    title: 'EMERGENCE',
    date: 'March 14, 2031 · Sat 7:30pm',
    venue: 'Harmonia Hall',
    blurb: 'A program shaped by who we have become. The institution\'s voice, distilled into a single evening.',
    movementNames: ['Origin', 'Becoming', 'Voice'],
  },
  {
    title: 'ASCENT',
    date: 'May 30, 2031 · Sat 7:30pm',
    venue: 'Harmonia Hall',
    blurb: 'The season\'s final argument. Everything the year has been pointing toward—delivered without apology.',
    movementNames: ['Memory', 'Climb', 'Apotheosis'],
  },
]

export function flavorForSlot(index: number): ConcertFlavor {
  return SLOT_FLAVORS[Math.min(index, SLOT_FLAVORS.length - 1)]
}
