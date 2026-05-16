# Milestone 5: Rival Ecosystem and Strategic Positioning

## Purpose

Milestone 5 places the player institution inside a city ecosystem.

The orchestra should stop feeling like it operates in a vacuum. The player should understand that identity is partly relational: what the orchestra becomes depends on what other institutions already own, neglect, or over-serve.

The goal is not to simulate every rival in detail. The goal is to create strategic context.

## Core Addition

A fictional rival ecosystem for Seattle.

The player can read market pressure, competitor strengths, audience overlap, and strategic whitespace.

## Separation of What and How

### What Exists

Add domain concepts:

- `RivalInstitution`
- `MarketSegment`
- `StrategicWhitespace`
- `AudienceOverlap`
- `CompetitivePressure`
- `CityEcosystemState`

### How It Behaves

Add simulation functions:

- `calculateAudienceOverlap()`
- `calculateCompetitivePressure()`
- `identifyStrategicWhitespace()`
- `updateRivalSignalsAfterSeason()`
- `summarizeCityEcosystem()`

### How the Player Sees It

Add UI components:

- `RivalInstitutionPanel`
- `MarketMap`
- `WhitespaceAnalysis`
- `CompetitivePressurePanel`
- `PositioningSummary`

## Rival Types

Use fictional rivals modeled on institutional types:

- Major symphony orchestra
- New-music ensemble
- University orchestra
- Chamber presenter
- Film/game concert producer
- Community orchestra

Each rival should have a simple profile:

- Name
- Institutional type
- Audience strength
- Artistic reputation
- Programming identity
- Pricing level
- Audience overlap with player
- Market dominance by category

## Strategic Whitespace

The system should identify opportunities such as:

- Major symphony dominates standard canon.
- New-music ensemble owns avant-garde credibility but has limited audience scale.
- Film/game producer captures young crossover audiences but lacks prestige.
- Chamber presenter attracts adventurous listeners but does not offer large orchestral spectacle.
- University orchestra offers low-cost concerts but inconsistent professional quality.

The player can decide whether to compete directly or occupy a neglected space.

## Effects on the Season Loop

Rivals should affect forecasts lightly.

Examples:

- A saturated canon market slightly reduces marginal audience draw for standard programs.
- A neglected crossover audience improves opportunity for hybrid programming.
- Strong new-music competition makes experimental programming harder to differentiate unless quality is high.
- A major rival’s gala or season finale may reduce donor availability in the same period.

Keep these effects readable and small.

## UI Scope

The player should be able to inspect the city ecosystem without needing to micromanage it.

Required UI:

- Rival overview.
- Audience overlap chart.
- Strategic whitespace summary.
- Competitive pressure forecast in programming view.
- Season-end positioning report.

Do not build a full rival turn simulation yet.

## Not in This Milestone

Do not add:

- Fully simulated rival seasons.
- Real institutions.
- Rival budgets in detail.
- Direct head-to-head event scheduling.
- Touring or regional expansion.
- Press wars.
- Full city map simulation.

## Tests

Add tests for:

- Rival profiles load into ecosystem state.
- Audience overlap is calculated from segment profiles.
- Strategic whitespace changes with rival identities.
- Competitive pressure affects forecasts within a small bounded range.
- Season summary includes positioning changes.

## Completion Criteria

Milestone 5 is complete when:

- The player can understand the surrounding musical ecosystem.
- Programming forecasts reflect market pressure.
- The season summary explains how the orchestra’s identity is positioned against rivals.
- Rivals add strategic context without becoming a second full game.
