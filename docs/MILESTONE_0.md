# Milestone 0: Opening Night Foundation

## Purpose

Milestone 0 exists to build the smallest stable foundation for **Orchestra Manager** without scaffolding the whole game.

The goal is not to build every tab, every system, or the final UI. The goal is to prove one complete institutional loop:

```text
Choose a concert program -> forecast consequences -> run the concert -> receive a report -> update the institution
```

Everything in this milestone should serve that loop.

## Design Principle

**Separate what from how.**

The domain layer defines what exists in the game world. The simulation layer defines how those things interact. The UI layer only displays state and collects player choices.

The UI should not contain the simulation. The simulation should not know about React. Data should not contain formulas. Formulas should not contain presentation.

## Milestone Name

**Opening Night Foundation**

The first playable slice is a single opening-night concert for a new upstart Seattle orchestra.

The player can:

- Choose three works.
- Allocate rehearsal hours.
- Set marketing spend.
- View a forecast.
- Run the concert.
- Read a result report.
- See institutional meters change.

## Non-Goals

Milestone 0 should not include:

- Full season simulation.
- Save/load.
- Backend server.
- Database.
- Authentication.
- LLM agents.
- Rival institution simulation.
- Contract negotiation.
- Commission negotiation.
- Full roster management.
- Real-time concert visualization.
- Generated music or audio.
- Empty placeholder tabs for future systems.
- A polished final dashboard.

The milestone should be mechanically alive before it is beautiful.

## Nested System Model

Milestone 0 should use a small nested model that can later expand.

```text
Game
└── Institution
    ├── Roster
    │   └── Principals
    ├── Audience Model
    │   └── Audience Segments
    ├── Repertoire Library
    │   └── Works
    └── Current Concert
        ├── Program
        ├── Player Choices
        ├── Forecast
        └── Report
```

Only the bottom loop needs to be playable in Milestone 0.

## Layers

### 1. Domain Layer: What Exists

The domain layer contains types and seed data.

It answers:

- What is a work?
- What is a principal player?
- What is an audience segment?
- What is an institution?
- What is a concert program?
- What is a forecast?
- What is a concert report?

This layer should be mostly plain TypeScript types and hardcoded data.

Suggested files:

```text
src/types/core.ts
src/data/works.ts
src/data/principals.ts
src/data/audienceSegments.ts
src/data/institution.ts
```

### 2. Simulation Layer: How Things Interact

The simulation layer contains pure functions.

It answers:

- How does a program create rehearsal pressure?
- How does roster strength reduce or amplify risk?
- How does audience fit affect attendance?
- How does marketing spend affect demand?
- How does performance quality affect reputation?
- How does the concert report update the institution?

This layer should be deterministic and testable.

Suggested files:

```text
src/sim/forecastProgram.ts
src/sim/resolveConcert.ts
src/sim/applyConcertReport.ts
src/sim/scoring.ts
```

The target shape is:

```ts
forecastProgram(input): ConcertForecast
resolveConcert(input): ConcertReport
applyConcertReport(institution, report): InstitutionState
```

### 3. UI Layer: How the Player Interacts

The UI layer lets the player make choices and read consequences.

It answers:

- What works can I choose?
- What program have I built?
- What does the forecast say?
- What happened after the concert?
- How did the institution change?

The UI should stay thin. It should call simulation functions rather than implementing formulas inline.

Suggested files:

```text
src/App.tsx
src/components/AppShell.tsx
src/components/InstitutionMeters.tsx
src/components/ProgramBuilder.tsx
src/components/ConcertForecast.tsx
src/components/ConcertReport.tsx
src/styles/app.css
```

## Core Types

Milestone 0 should keep types small but expressive.

### Work

A work is a piece that can be programmed.

Important fields:

- id
- title
- composer
- durationMinutes
- era or style
- audienceDraw
- artisticPrestige
- donorComfort
- novelty
- identityValue
- rehearsalLoad
- demands by section or skill

### Principal

A principal is a named section leader who modifies repertoire risk.

Important fields:

- id
- name
- position
- section
- overall
- morale
- form
- intonation
- rhythm
- endurance
- tone
- blend
- soloReliability
- leadership
- stressResistance

### AudienceSegment

An audience segment is a group with taste and price sensitivity.

Important fields:

- id
- name
- size
- loyalty
- priceSensitivity
- canonAffinity
- contemporaryAffinity
- crossoverAffinity
- prestigeAffinity
- communityAffinity

### InstitutionState

The institution is the persistent player object.

Important fields:

- cash
- artisticReputation
- audienceTrust
- donorConfidence
- musicianMorale
- technicalQuality
- identity profile

### ConcertProgram

A concert program is the player's immediate decision.

Important fields:

- selected work ids
- rehearsal hours
- marketing spend
- ticket price

### ConcertForecast

A forecast is a pre-concert estimate.

Important fields:

- projectedAttendance
- projectedRevenue
- projectedExpenses
- projectedNet
- performanceRisk
- rehearsalPressure
- audienceFit
- donorResponse
- identityImpact
- sectionStress
- forecastNotes

### ConcertReport

A report is the resolved outcome.

Important fields:

- attendance
- revenue
- expenses
- net
- performanceQuality
- audienceResponse
- criticResponse
- sectionOutcomes
- notableMoments
- institutionalDeltas

## The First Simulation Loop

The first loop should be simple and legible.

### Input

- Three selected works.
- Starting institution state.
- Starting principal roster.
- Audience segments.
- Rehearsal hours.
- Marketing spend.
- Ticket price.

### Forecast

The forecast should estimate:

- Audience demand.
- Ticket revenue.
- Performance difficulty.
- Section stress.
- Rehearsal sufficiency.
- Donor comfort.
- Artistic upside.
- Identity impact.

### Resolution

The concert resolver should produce:

- Final attendance.
- Revenue and expenses.
- Performance quality.
- Section-level successes or failures.
- Audience reaction.
- Critic tone.
- Institutional meter changes.
- A few plain-English report notes.

### Persistence

For Milestone 0, persistence can be in React state only.

No database. No backend. No localStorage unless it is trivial and does not distract from the loop.

## Minimal Seed Data

### Works

Start with 10-12 works.

Public-domain canon examples:

- Beethoven: Symphony No. 5
- Beethoven: Symphony No. 7
- Tchaikovsky: Symphony No. 6
- Sibelius: Symphony No. 7
- Brahms: Symphony No. 1
- Ravel: Daphnis et Chloe Suite No. 2

Fictional contemporary examples:

- City Light Machines
- Glacier Index
- Signal Fires
- First Desk Concerto
- Harbor Grid
- Night Ferry

### Principals

Start with 6-7 principals.

- Concertmaster
- Principal Flute
- Principal Oboe
- Principal Horn
- Principal Trumpet
- Principal Timpani
- Principal Cello

These are enough to make repertoire fit matter without building a full roster.

### Audience Segments

Start with 5 segments.

- Seasoned Supporters
- Cultural Explorers
- Young Professionals
- Students & Educators
- Donors / Major Patrons

These are enough to make programming and marketing tradeoffs visible.

## Formula Philosophy

Formulas should be simple enough to understand and tune.

Avoid hidden complexity. Prefer readable scoring functions with clear weights.

Example concepts:

```text
programAudienceDraw = average(work.audienceDraw) + marketingEffect - pricePenalty
programPrestige = average(work.artisticPrestige)
programNovelty = average(work.novelty)
rehearsalPressure = total(work.rehearsalLoad) - rehearsalHours
sectionStress = workDemands - principalStrengths
performanceQuality = technicalQuality + rosterFit - rehearsalPressure - sectionStress
```

These formulas can be crude at first. They only need to create believable directional consequences.

## Testing Strategy

Milestone 0 should have tests for the simulation, not the UI.

Suggested tests:

- Forecast returns stable output for a known program.
- Higher marketing spend increases projected attendance, within a cap.
- Higher rehearsal load increases performance risk.
- Strong principal players reduce section stress.
- Running a concert produces a report with attendance, finances, quality, notes, and deltas.
- Applying a concert report updates institutional meters.

Suggested test file:

```text
tests/resolveConcert.test.ts
```

## First Implementation Order

### PR 1: Project Scaffold

Create the Vite + React + TypeScript project.

Include:

- npm scripts
- basic app shell
- basic CSS
- placeholder screen
- test setup

### PR 2: Domain Types and Seed Data

Add:

- core types
- hardcoded works
- hardcoded principals
- hardcoded audience segments
- starting institution state

No major UI yet.

### PR 3: Forecast Function

Add `forecastProgram`.

It should take a selected program and return a readable forecast.

### PR 4: Concert Resolver

Add `resolveConcert` and `applyConcertReport`.

The player should be able to run one concert and see the institution change.

### PR 5: Playable UI Loop

Add the first playable screen:

- program builder
- forecast panel
- run concert button
- concert report
- institution meters

This should be the first version that feels like a game.

## Completion Criteria

Milestone 0 is complete when:

- The app runs locally.
- The player can choose a three-work program.
- The player can allocate rehearsal hours and marketing spend.
- A forecast appears before running the concert.
- The player can run the concert.
- A concert report appears afterward.
- Institutional meters update.
- The simulation is implemented through pure functions outside the UI.
- Basic simulation tests pass.

## The Rule

Do not add a system unless it strengthens the Opening Night loop.

If a feature does not help the player choose, forecast, run, report, or update the institution, it belongs after Milestone 0.
