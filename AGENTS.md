# AGENTS.md

This repo builds **Orchestra Manager**, a hardcore orchestral administration simulation. Agents should build the next playable state transition, not the imagined final app.

## Required Read Order

Before changing code, read:

1. `README.md`
2. `docs/GAME_SPEC.md`
3. `docs/milestones/README.md`
4. The current milestone document
5. `docs/PROGRESS.md`

## Core Rule

Build vertically before horizontally.

Prefer a small playable loop over broad scaffolding. Do not add placeholder tabs, fake dashboards, or future systems unless the active milestone calls for them.

## Milestone Rule

Every PR must name:

- Primary milestone
- Optional secondary milestone, if relevant

If a change does not support the current milestone, do not make it. If a useful idea is out of scope, record it as deferred in `docs/PROGRESS.md`.

## Architecture Guidance

Preserve the current separation unless there is a strong reason to change it:

- `src/types/` defines domain nouns.
- `src/data/` contains seed data.
- `src/sim/` contains simulation logic.
- `src/components/` renders state and collects player choices.
- `src/App.tsx` wires the current playable loop together.

React components should not contain core simulation formulas. Simulation logic should not depend on React.

## Scope Prohibitions

Do not add these unless explicitly scoped by the active milestone:

- Backend server
- Database
- Authentication
- LLM agents
- Real-time concert visualization
- Generated audio
- Full roster management
- Contract negotiation
- Rival institution simulation
- Full finance dashboard
- Full audience dashboard
- Save/load
- Routing for all future tabs

## Testing Rule

Any change to `src/sim/`, scoring formulas, domain behavior, or state transitions must add or update tests.

List exact test commands and results in `docs/PROGRESS.md`.

## Documentation Rule

Design docs may change during coding only when implementation intentionally changes scope, architecture, or milestone interpretation. Explain those changes in `docs/PROGRESS.md`.

## Progress Rule

After each PR, update `docs/PROGRESS.md` with:

- Date
- Primary/secondary milestone
- Summary
- Rationale
- Files changed
- Tests run and results
- Known issues / risks
- Handoff note
- Next recommended action

Do not include external coding-session links. The progress entry must be self-contained.

## PR Checklist

Before opening or merging a PR, verify:

- Primary milestone is named.
- `docs/PROGRESS.md` is updated.
- Tests were run or explicitly marked not run.
- No out-of-scope systems were added.
- Simulation/UI separation is respected.
- Docs were updated if scope or architecture changed.
- PR contains one coherent change.

## Style

Be conservative. Prefer the smallest implementation that advances the playable loop.
