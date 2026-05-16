# Milestone 6: Vertical Slice Release

## Purpose

Milestone 6 turns the accumulated systems into a coherent playable release.

This milestone is not about adding a major new system. It is about closure.

The goal is to ship a compact version of Orchestra Manager that proves the concept:

```text
A player can run a first season for an upstart Seattle orchestra and feel that programming, roster, audience, finances, and institutional identity interact.
```

## Core Addition

Polish, integration, stability, and release packaging.

Milestone 6 should make the game understandable to someone who did not watch it being built.

## Release Target

**Orchestra Manager: Season One Vertical Slice**

The player should be able to:

- Start a new Season One scenario.
- Plan and resolve four concerts.
- Read forecasts and reports.
- See roster strengths and weaknesses matter.
- Track audience and financial results.
- Receive institutional messages.
- Understand rival positioning.
- Finish the season and get a final summary.

## Separation of What and How

### What Exists

Stabilize domain concepts:

- `Scenario`
- `GameState`
- `SeasonState`
- `InstitutionState`
- `RosterState`
- `AudienceState`
- `FinanceState`
- `InboxState`
- `CityEcosystemState`

### How It Behaves

Consolidate simulation functions:

- Ensure deterministic behavior where expected.
- Ensure bounded meter changes.
- Ensure consistent report generation.
- Ensure season completion works.
- Ensure all major state transitions are tested.

### How the Player Sees It

Unify the UI into a clear flow:

- Scenario start.
- Season overview.
- Program builder.
- Forecast.
- Concert report.
- Roster/audience/finance/inbox context panels.
- Season summary.

## Polish Priorities

Polish should serve clarity, not visual excess.

Priorities:

1. Make the core loop obvious.
2. Make forecasts readable.
3. Make concert reports satisfying.
4. Make institutional changes traceable.
5. Make the final season summary feel conclusive.
6. Make failure and success legible.

The UI does not need to match the full mockup suite yet. It should feel coherent and serious.

## Save and Load

Add minimal persistence only if the season loop is stable.

Preferred first approach:

- Local browser storage.
- One active save slot.
- Reset scenario button.

Do not add user accounts, cloud saves, database storage, or multi-profile management.

## Scenario Setup

Create one fixed scenario:

- City: Seattle.
- Institution: new upstart orchestra.
- Season: four concerts.
- Roster: fixed starting principals.
- Repertoire: limited seed library.
- Rivals: fictional institutional types.
- Goal: complete the season while building a distinct identity and avoiding financial collapse.

Optional scenario tuning can come later.

## Release Documentation

Update docs to reflect the playable slice:

- README quick start.
- MVP description.
- Known limitations.
- Controls / how to play.
- Architecture summary.
- Future roadmap.

## Quality Gates

Before release:

- Typecheck passes.
- Tests pass.
- No broken main loop states.
- Every concert can be resolved.
- Season summary always appears after four concerts.
- Institutional meters remain within valid bounds.
- Repertoire and roster data are coherent.
- Reports do not contradict underlying numbers.

## Not in This Milestone

Do not add:

- New major systems.
- Full backend.
- Cloud accounts.
- Real LLM agents.
- Real institutions.
- Generated audio.
- Advanced hiring markets.
- Full campaign mode beyond Season One.

This milestone is about finishing, not expanding.

## Tests

Add integration tests for:

- Full season flow.
- Concert resolution sequence.
- Save/load if implemented.
- Season summary consistency.
- Bounds on institutional meters.
- Rival positioning summary.
- Inbox decisions where relevant.

## Completion Criteria

Milestone 6 is complete when:

- A player can complete Season One from start to finish.
- The season produces a coherent final report.
- The five major subsystems are all visible in the loop: programming, roster, audience, finance, and identity.
- The game is stable enough to show someone else.
- The repo has clear setup, run, test, and roadmap documentation.

## The Rule

Do not let the release milestone become a feature milestone.

Finish the slice. Then decide what the next game should become.
