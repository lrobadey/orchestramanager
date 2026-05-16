# Milestone Roadmap

This folder contains the milestone roadmap for **Orchestra Manager**.

The roadmap breaks the project into small, nested milestones. The goal is not to scaffold the entire game at once. Each milestone should add one durable layer to the simulation while preserving a complete playable loop.

## Core Rule

Build vertically before horizontally.

A milestone is valid only if it makes the game more playable, more legible, or more testable. Avoid empty tabs, placeholder dashboards, and future-facing architecture that does not serve the current loop.

## Separation Principle

Every milestone should preserve separation between:

- **What exists**: domain types and seed data.
- **How it behaves**: pure simulation functions and scoring rules.
- **How the player sees it**: UI components and presentation.

The simulation should not depend on React. The UI should not own simulation formulas. Data should not hide business logic.

## Sequence

### Milestone 0: Opening Night Foundation

Build the smallest complete loop:

```text
Choose a program -> forecast consequences -> run the concert -> read report -> update institution
```

See [`MILESTONE_0.md`](MILESTONE_0.md).

### Milestone 1: Four-Concert Season Loop

Wrap the opening-night loop into a short season. The player plans and resolves four concerts, with institutional meters persisting between them.

See [`MILESTONE_1_SEASON_LOOP.md`](MILESTONE_1_SEASON_LOOP.md).

### Milestone 2: Roster and Section Leader System

Make principals matter as strategic bottlenecks and strengths. Section leaders become the game’s equivalent of F1 drivers: named, rated, volatile, and repertoire-dependent.

See [`MILESTONE_2_ROSTER_SYSTEM.md`](MILESTONE_2_ROSTER_SYSTEM.md).

### Milestone 3: Audience and Finance Systems

Replace simple meter deltas with richer audience segments and concert-level financial logic. This milestone makes attendance, ticket pricing, donors, and institutional sustainability more explicit.

See [`MILESTONE_3_AUDIENCE_FINANCE.md`](MILESTONE_3_AUDIENCE_FINANCE.md).

### Milestone 4: Inbox and Commissions

Add fictional composers, commissions, board pressure, donor messages, musician concerns, and critic signals as a structured inbox system. Start deterministic; leave LLM agents as a later adapter.

See [`MILESTONE_4_INBOX_COMMISSIONS.md`](MILESTONE_4_INBOX_COMMISSIONS.md).

### Milestone 5: Rival Ecosystem and Strategic Positioning

Add fictional rival institutions and market whitespace. The player starts positioning the orchestra against a city ecosystem instead of optimizing in isolation.

See [`MILESTONE_5_RIVAL_ECOSYSTEM.md`](MILESTONE_5_RIVAL_ECOSYSTEM.md).

### Milestone 6: Vertical Slice Release

Polish the season into a coherent playable release: save/load, scenario setup, better reports, UI pass, regression tests, and a release-ready README.

See [`MILESTONE_6_VERTICAL_SLICE_RELEASE.md`](MILESTONE_6_VERTICAL_SLICE_RELEASE.md).

## Not a Fixed Destiny

This roadmap is not a commitment to build everything immediately. It is a guardrail against architectural sprawl.

If a later milestone starts to feel too large, split it. If a system does not strengthen the season loop, defer it.

The first priority remains simple: finish a small playable institutional feedback loop before expanding the orchestra world.
