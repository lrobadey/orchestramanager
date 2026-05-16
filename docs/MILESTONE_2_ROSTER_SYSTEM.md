# Milestone 2: Roster and Section Leader System

## Purpose

Milestone 2 makes the orchestra itself matter.

The player should no longer feel that repertoire is resolved against an abstract technical-quality number. Instead, the roster should create strengths, weaknesses, and strategic bottlenecks.

The central idea:

```text
Section leaders are treated like F1 drivers.
```

They are named, rated, psychologically and technically differentiated, and their profiles determine which repertoire is safe, risky, or strategically attractive.

## Core Addition

A playable principal-player system.

The goal is not a full 80-person orchestra. The goal is to make a small set of principals meaningfully affect forecasts and concert outcomes.

## Separation of What and How

### What Exists

Add or deepen domain concepts:

- `Principal`
- `Section`
- `RosterState`
- `SectionProfile`
- `PlayerForm`
- `PlayerMorale`
- `RepertoireFit`

### How It Behaves

Add simulation functions:

- `calculateSectionStrengths()`
- `calculateRepertoireFit()`
- `calculateSectionStress()`
- `updatePlayerFormAfterConcert()`
- `updatePlayerMoraleAfterConcert()`

### How the Player Sees It

Add UI components:

- `RosterOverview`
- `PrincipalCard`
- `SectionDepthChart`
- `RepertoireFitPanel`
- `SectionStressPreview`

## Principal Attributes

Principals should have a small but expressive set of attributes:

- Overall
- Morale
- Form
- Intonation
- Rhythm
- Endurance
- Tone
- Blend
- Solo reliability
- Leadership
- Stress resistance
- New-music fluency
- Classical fluency
- Romantic fluency

Do not add dozens of traits yet. Attributes should be readable and directly connected to repertoire outcomes.

## Initial Principals

Start with named principals only:

- Concertmaster
- Principal Flute
- Principal Oboe
- Principal Horn
- Principal Trumpet
- Principal Timpani
- Principal Cello

Later systems can add assistant principals, full section pools, substitutes, auditions, and contracts.

## Repertoire Fit

Each work should stress different attributes and sections.

Examples:

- Sibelius 7 stresses blend, long-range control, brass exposure, and endurance.
- Beethoven 5 stresses rhythm, strings, winds, and classical fluency.
- Ravel stresses color, winds, blend, and rehearsal precision.
- A fictional contemporary work may stress rhythm, new-music fluency, endurance, and rehearsal efficiency.

The forecast should explain these pressures clearly.

## Concert Reports

Concert reports should include section-level outcomes:

- Strings carried the program.
- Brass struggled with exposed writing.
- Winds handled coloristic passages well.
- Principal horn risk was reduced by high stress resistance.
- Low rehearsal time increased ensemble precision issues.

These notes should be generated from the same scoring system that affects the numerical report.

## UI Scope

This milestone should add roster visibility, not a full HR simulation.

Required UI:

- A roster overview panel.
- Principal cards.
- Section strength summary.
- Repertoire fit preview inside the program forecast.
- Section outcome block in concert reports.

Do not build a full roster tab unless it directly supports the season loop.

## Not in This Milestone

Do not add:

- Contract negotiations.
- Salary cap-style optimization.
- Hiring markets.
- Injuries as a major system.
- Full personnel history.
- Full orchestra seating.
- Auditions.
- Substitute lists.
- Union rules.

## Tests

Add tests for:

- Strong principals reduce section stress.
- Weak principals increase repertoire risk.
- High stress resistance reduces solo-exposure penalties.
- High morale/form improves outcome slightly.
- Concert outcomes update player form and morale within bounds.
- Repertoire fit changes when principal data changes.

## Completion Criteria

Milestone 2 is complete when:

- Named principals visibly affect forecasts.
- Concert reports include section-specific outcomes.
- The player can understand why a piece is risky for this orchestra.
- The roster creates strategic programming decisions.
- The system still works without a full 80-person roster.
