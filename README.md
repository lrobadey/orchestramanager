# Orchestra Manager

**Orchestra Manager** is a hardcore granular management simulation about building an upstart orchestra in Seattle and trying to turn it into a serious artistic institution.

The player is an Artistic Director / CEO hybrid: responsible for programming, hiring, budgets, institutional identity, rehearsal allocation, audience development, donor confidence, press perception, and long-term artistic reputation.

This is not a simplified music-themed tycoon game. The target is closer to **Football Manager**, **F1 Manager**, and **Victoria 3**: dense systems, explicit tradeoffs, lots of institutional texture, and a willingness to make the player think like an administrator, programmer, strategist, and artistic leader at the same time.

## Core Fantasy

Build an orchestra with a point of view.

You are not merely choosing repertoire. You are shaping an institution under pressure. Every season forces tradeoffs between money, artistic ambition, audience trust, musician capacity, donor comfort, press narrative, and institutional identity.

A safe Beethoven program may sell tickets and reassure donors, but it may not help the orchestra become distinctive. A new commission may build artistic credibility, but it can strain rehearsal time, confuse subscribers, and create financial risk. A brilliant principal horn may make dangerous repertoire viable. An overextended section may turn an ambitious season into a public failure.

The game is about the system behind the concert.

## Design Metaphor: The Score Is the Track

In F1, every circuit stresses cars and drivers differently. One track rewards straight-line speed. Another punishes tire degradation. Another exposes driver inconsistency.

In Orchestra Manager, every score is a track.

Each work stresses the institution in different ways: strings, winds, brass, percussion, chorus logistics, soloists, rehearsal time, endurance, intonation, rhythm, audience familiarity, critic interest, donor comfort, venue fit, and marketing difficulty.

Programming is therefore not a taste menu. It is strategic risk design.

## Current Playable State

**Milestone 1 complete.** A full four-concert debut season is playable.

The player can:

1. Build a three-work program from a library of 30+ works spanning classical canon to fictional new commissions.
2. Allocate rehearsal hours per work using a drag interface with live per-work pressure feedback.
3. Set marketing spend and ticket price.
4. Read a live forecast: projected attendance, revenue, expenses, rehearsal pressure, section stress, donor response, and identity impact.
5. Run each concert as a stochastic simulation.
6. Read a detailed concert report: attendance, finances, performance quality, section-by-section outcomes, critic tone, notable moments, and institutional meter changes.
7. Watch institutional meters (cash, reputation, trust, donor confidence, morale, technical quality, identity) persist and evolve across all four concerts.
8. Read a final season summary with financial totals, performance arc, and the identity the orchestra accumulated.

The rehearsal system is now mechanically meaningful: principal leadership scores drive section-specific rehearsal efficiency, and per-piece familiarity scores reduce hours needed for well-known canon works versus new commissions.

## Repertoire Approach

The library uses:

- Real public-domain canon (Beethoven, Brahms, Sibelius, Ravel, Mahler, etc.).
- Fictional living composers and fictional new commissions (City Light Machines, Glacier Index, Harbor Grid, etc.).
- Fictional rival institutions modeled on real institutional types (planned for Milestone 5).

Each work has a `familiarity` score (0–100) reflecting how well the orchestra knows it. Familiar canon works need fewer rehearsal hours; fresh commissions demand more preparation time relative to their technical load.

The goal is to capture real orchestra-world dynamics without depending on real contemporary composers, real rival institutions, or real-world commentary as core data.

## Long-Term Agent Vision

LLM/agentic characters are central to the long-term vision, but the MVP can begin with deterministic stand-ins.

Future agentic roles could include:

- Living composers negotiating commissions.
- Guest soloists and conductors.
- Board members.
- Donors.
- Critics.
- Section leaders.
- Administrators.
- Rival artistic directors.

The deterministic simulation should own the actual state: money, dates, contracts, rehearsal time, musician attributes, performance outcomes, audience response, and reputation changes. Agents should provide negotiation, personality, emails, proposals, reviews, demands, and narrative texture without directly bypassing the simulation rules.

## Running the App

```bash
npm install
npm run dev       # start Vite dev server
npm test          # run simulation tests
npm run build     # TypeScript compile + Vite bundle
```

## Architecture

```
src/types/     domain types (Work, Principal, InstitutionState, SeasonState, …)
src/data/      seed data (30+ works, 15 principals, 5 audience segments)
src/sim/       pure simulation functions (forecast, resolve, scoring, season)
src/components/ React UI components
src/App.tsx    season state machine and game loop
tests/         Vitest simulation tests (36 tests passing)
```

The simulation layer has no React dependency. UI components do not own formulas.

## What Is Not Yet Built

- Roster management and hiring (Milestone 2)
- Richer audience/finance systems (Milestone 3)
- Inbox, commissions, board pressure (Milestone 4)
- Rival institution ecosystem (Milestone 5)
- Save/load, scenario setup, release polish (Milestone 6)
- Full career mode, real-time concert visualization, generated audio, LLM agents

## Documentation

See [`docs/GAME_SPEC.md`](docs/GAME_SPEC.md) for the current design spec and MVP shape.
