# Milestone 1: Four-Concert Season Loop

## Purpose

Milestone 1 takes the single-concert loop from Milestone 0 and wraps it into the smallest meaningful season.

The goal is to make repeated decisions matter.

```text
Plan Concert 1 -> resolve -> update institution -> plan Concert 2 -> resolve -> ... -> season summary
```

The player should begin to feel that the orchestra is developing an identity over time.

## Core Addition

A persistent four-concert season state.

Each concert should have:

- Date or order in season.
- Program.
- Rehearsal allocation.
- Marketing spend.
- Forecast.
- Report after resolution.
- Institutional effects.

## Separation of What and How

### What Exists

Add domain concepts:

- `SeasonState`
- `SeasonConcertSlot`
- `SeasonSummary`
- `InstitutionHistoryEntry`

### How It Behaves

Add simulation functions:

- `createInitialSeason()`
- `resolveSeasonConcert()`
- `advanceSeason()`
- `summarizeSeason()`

### How the Player Sees It

Add UI components:

- `SeasonTimeline`
- `ConcertSlotCard`
- `SeasonSummaryPanel`
- `InstitutionHistoryChart`

## MVP Season Structure

The first season should contain four concert slots:

1. Opening Night
2. Winter Program
3. Spring Identity Concert
4. Season Finale

Do not add a real calendar system yet. Simple ordered slots are enough.

## Persistent Institution State

After each concert, institutional meters should update and persist.

Core meters:

- Cash
- Artistic reputation
- Audience trust
- Donor confidence
- Musician morale
- Technical quality
- Identity profile

A concert should leave marks on the institution. A safe successful program should not produce the same long-term identity as a risky new-music success.

## Identity Drift

Milestone 1 should make identity drift visible.

Example identity axes:

- Traditional
- Contemporary
- Crossover
- Community
- Prestige
- Experimental

Each work and concert should push these axes slightly.

The player should be able to read the emerging institutional pattern after each concert.

## UI Scope

The UI can still be simple.

Required screens or panels:

- A season timeline with four concert slots.
- A current concert builder.
- A report view after each resolved concert.
- Institution meters that persist across the season.
- A final season summary.

Avoid building full tabs. Milestone 1 is still one playable surface.

## Not in This Milestone

Do not add:

- Contracts.
- Commission negotiation.
- Full finances tab.
- Full audience tab.
- Rival institutions.
- LLM agents.
- Full calendar scheduling.
- Venue booking.
- Touring.
- Save/load unless trivial.

## Tests

Add tests for:

- Season initializes with four unresolved concert slots.
- Resolving a concert updates only that slot.
- Institution state persists between concerts.
- Final season summary is unavailable until all concerts resolve.
- Identity drift accumulates across concerts.

## Completion Criteria

Milestone 1 is complete when:

- The player can run a four-concert season.
- Each concert has its own program, forecast, and report.
- Institutional meters persist and change across the season.
- A final summary explains the season’s financial, artistic, audience, and morale results.
- The game begins to feel like institutional management, not just one isolated concert.
