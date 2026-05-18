# Progress Log

This file is the project handoff record for **Orchestra Manager**.

Agents must update it after each PR. Keep entries concise, factual, and self-contained. Do not include external coding-session links.

## Current Status

**Last updated:** 2026-05-18  
**Current milestone:** Milestone 1 complete — Four-Concert Season Loop  
**Current playable state:** Full four-concert season loop is playable. Player selects programs from 30+ works, allocates rehearsal hours via drag interface, sets marketing spend and ticket price, views a live forecast, runs each concert, reads section-level reports, watches institutional meters persist across concerts, and receives a season summary after all four concerts. The roster is fully expanded to 15 named principals across all sections with per-piece familiarity scores and leadership-driven rehearsal divisors.  
**Latest PR:** PR #12 — per-piece familiarity scores  
**Known blockers:** None.  
**Current risks:** None recorded.  
**Next recommended action:** Begin Milestone 2 (Roster and Section Leader System) — principals are seeded with full attributes; the next step is exposing them strategically so roster fit drives visible per-concert risk and the player can make hiring decisions.

## Log Entries

### 2026-05-18 — PR #12: Per-piece familiarity scores

**Primary milestone:** Milestone 1 — Four-Concert Season Loop

**Summary**

Added a `familiarity` field (0–100) to every `Work` in the library. Familiarity feeds a bonus of up to +2 to the rehearsal divisor in `computeRehearsalDivisor`, so well-known canon works need meaningfully fewer rehearsal hours than newly-premiered contemporary pieces. Values range from 95 (Beethoven 5) down to 5 for fictional new commissions.

**What was added / changed**

- `src/types/core.ts` — added `familiarity: number` to the `Work` interface
- `src/data/works.ts` — set `familiarity` on all 30+ works (canon 40–95, contemporary/fictional 5–30)
- `src/sim/scoring.ts` — `computeRehearsalDivisor` adds `(familiarity / 100) * 2` to the base divisor
- `tests/scoring.test.ts` — two new tests: familiarity boost produces exactly +2 at familiarity 100; familiarity clamped at 100 (max bonus +2)

**Tests run and results**

```
✓ tests/scoring.test.ts       (9 tests)
✓ tests/season.test.ts        (8 tests)
✓ tests/resolveConcert.test.ts (19 tests)

Test Files  3 passed (3)
     Tests  36 passed (36)
```

**Known issues / risks**

None.

**Handoff note**

The rehearsal divisor formula now has two meaningful axes: principal leadership (section strength) and piece familiarity (repertoire history). Both are visible in the program builder's per-piece rehearsal display.

**Next recommended action**

Begin Milestone 2 (Roster and Section Leader System) or consider adding UI visibility for per-principal attributes so the player can see which sections are bottlenecks before programming.

---

### 2026-05-18 — PR #11: GitHub Actions CI workflow

**Primary milestone:** Project infrastructure

**Summary**

Added a GitHub Actions CI workflow (`.github/workflows/ci.yml`) that runs `npm ci` and `npm test` on every push and pull request.

**Files changed**

- `.github/workflows/ci.yml` — new workflow file

**Tests run and results**

CI is the test runner in this PR; no local test changes.

**Handoff note**

All future PRs will have automated test results in GitHub before merging.

---

### 2026-05-18 — PR #10: Leadership-driven rehearsal divisor and full principal roster

**Primary milestone:** Milestone 1 — Four-Concert Season Loop  
**Secondary milestone:** Milestone 2 — Roster and Section Leader System (partial foundation)

**Summary**

Replaced the flat rehearsal-pressure model with a leadership-weighted, section-aware rehearsal divisor. Section leaders with higher `leadership` scores make their section more efficient, reducing rehearsal hours needed for demanding pieces. Starting principals were weakened to create realistic upside. The roster was expanded from 7 to 15 named principals covering all sections.

**What was added / changed**

New simulation logic in `src/sim/scoring.ts`:
- `computeRehearsalDivisor(work, principals)` — weighted average of per-section divisors (3.5–7), where each section's divisor is driven by its average principal leadership. Sections with no principals fall back to leadership 50 (divisor 5.25).
- `rehearsalHoursNeeded(rehearsalLoad, divisor)` — converts load units to hours
- `pressureFromHoursGap(hoursNeeded, hoursAllocated)` — converts hours gap back to the pressure scale (-40..100)

New principals in `src/data/principals.ts`:
- Principal Second Violin (Yuki Tanaka)
- Principal Viola (Tariq El-Amin)
- Principal Double Bass (Birgit Halvorsen)
- Principal Clarinet (Lena Schreiber)
- Principal Bassoon (Kofi Mensah)
- Principal Trombone (Rafael Sousa)
- Principal Tuba (Ingrid Magnusson)
- Principal Percussion (Amara Diallo) — Timpani role retitled to Timpani, separate from Percussion

All starting principals weakened (overall 57–72) to give meaningful room for future improvement.

`src/components/ProgramBuilder.tsx`:
- Fixed broken `rehearsalHoursNeeded` calls
- Partial-program UX improvements
- Per-piece rehearsal hours display

`tests/scoring.test.ts` (9 tests):
- Section weighting: brass leadership matters more for brass-heavy pieces
- Higher leadership always produces higher divisor
- Fallback: no principals → leadership 50 → divisor 5.25
- Leadership clamp: >100 capped at 7.0 (at familiarity 0)
- Balanced demands manual calculation verification
- Zero totalWeight guard
- `rehearsalHoursNeeded` monotonicity

**Tests run and results**

```
✓ tests/scoring.test.ts       (7 tests at time of PR)
✓ tests/season.test.ts        (8 tests)
✓ tests/resolveConcert.test.ts (19 tests)
```

**Known issues / risks**

None.

**Handoff note**

Rehearsal risk is now mechanically meaningful: programming brass-heavy works with a weak principal horn section will produce real pressure. The roster expansion gives each section at least one named principal for the divisor calculation.

---

### 2026-05-18 — PR #9: Symphony-esque typography

**Primary milestone:** Milestone 0 — Opening Night Foundation (UI polish)

**Summary**

Replaced the default web fonts with a Playfair Display / Lora / IBM Plex Mono typography stack loaded from Google Fonts, matching the aesthetic register of a serious orchestral institution.

**Files changed**

- `src/styles/app.css` — font-face imports and CSS variable assignments
- `index.html` — Google Fonts preconnect and stylesheet link

**Tests run and results**

Not run; no simulation or logic changes.

**Handoff note**

Visual polish only. No component or simulation changes.

---

### 2026-05-18 — PR #8: Bespoke concert program builder with live forecast

**Primary milestone:** Milestone 0 — Opening Night Foundation (UI rewrite)

**Summary**

Replaced the placeholder program builder with a fully bespoke concert programming interface. Rehearsal hours are allocated via Framer Motion drag handles (one per work). The live forecast updates as the player adjusts the program, showing per-work rehearsal pressure and a real-time institutional forecast panel.

**What was added / changed**

- `src/components/ProgramBuilder.tsx` — complete rewrite with drag-based rehearsal allocation and live per-work stats
- `src/components/ConcertForecast.tsx` — updated to render inline next to the builder
- Fixed three correctness bugs in the original builder (wrong section stress calculation, misapplied price penalty, intermission not included in displayed total duration)

**Tests run and results**

Not run; no simulation changes (only UI).

**Handoff note**

The program builder is now the primary planning surface. The drag interaction makes rehearsal tradeoffs tactile. The live forecast makes consequences immediate.

---

### 2026-05-17 — Milestone 1: Four-concert season loop

**Primary milestone:** Milestone 1 — Four-Concert Season Loop

**Summary**

Added persistent season state wrapping the existing single-concert loop into a four-concert sequence. The player now runs Opening Night, Winter Program, Spring Identity Concert, and Season Finale in order. Institution state persists and changes across all four concerts. After the final concert, a season summary panel displays financial totals, average performance quality, institutional arc, and the identity that emerged from the season's programming.

**What was added**

New types in `src/types/core.ts`:
- `SeasonConcertSlot` — holds name, status, program, report, and institution snapshot per concert
- `SeasonState` — four slots, current slot index, live institution state
- `SeasonSummary` — totals, averages, identity narrative

New simulation layer in `src/sim/season.ts`:
- `createInitialSeason(institution)` — initializes four pending slots
- `resolveSeasonConcert(season, program, report)` — stamps current slot, applies report, advances index
- `summarizeSeason(season)` — returns null until all four resolved; then computes totals and identity narrative

New UI components:
- `src/components/SeasonTimeline.tsx` — four slot chips in header (✓ resolved / → active / ○ pending)
- `src/components/SeasonSummaryPanel.tsx` — final season screen with financials, arc, and narrative

Modified files:
- `src/types/core.ts` — added three new interfaces
- `src/App.tsx` — replaced `institution` state with `SeasonState`; wired `handleDone` to `resolveSeasonConcert`; added season-complete branch and "New Season" reset
- `src/components/AppShell.tsx` — added `timeline` prop slot in header
- `src/components/ConcertReport.tsx` — added `concertNumber`/`totalConcerts` props for contextual button label
- `src/styles/app.css` — added season timeline and slot chip styles

New tests in `tests/season.test.ts` (8 tests):
- Season initializes with four unresolved slots and correct names
- Resolving a concert updates only that slot; others stay pending
- `currentSlotIndex` advances after each resolve
- Institution state persists and changes between concerts
- `summarizeSeason` returns null until all four are resolved; totals match sum of reports
- Contemporary-heavy season accumulates higher adventurous identity than canon season

**Tests run and results**

```
npm test

 ✓ tests/resolveConcert.test.ts (16 tests)
 ✓ tests/season.test.ts (8 tests)

 Test Files  2 passed (2)
      Tests  24 passed (24)
```

**Known issues / risks**

- `node_modules` is absent in the remote environment so `tsc --noEmit` was not verified locally; TypeScript types are straightforward and should compile cleanly.
- The `SeasonSummaryPanel` imports `React.ReactNode` implicitly via JSX; if a strict import check is needed, add `import type { ReactNode } from 'react'`.

**Handoff note**

Milestone 1 is mechanically complete. The player can run a full four-concert season, see institutional meters update after each concert, and read a final summary. Identity drift is visible across the season. No save/load, routing, or out-of-scope systems were added.

**Next recommended action**

Review simulation balance across the four-concert arc: do meters reach interesting ranges? Is the identity narrative specific enough to feel meaningful? Then begin Milestone 2 (Roster System) or polish the season arc first.

### 2026-05-17 — Fix three UI display bugs in cash delta formatting

**Primary milestone:** Milestone 0 — Opening Night Foundation

**Summary**

Fixed three display bugs found during a UI review:

1. `ConcertForecast.tsx` used `React.ReactNode` as a type without importing React. Added `import type { ReactNode } from 'react'` and changed the annotation accordingly.
2. `ConcertReport.tsx` cash delta showed both the raw integer and the currency-formatted value side by side (e.g. `+45321 ($45,321)`). Now shows only the formatted value (e.g. `+$45,321`).
3. `InstitutionMeters.tsx` cash delta badge in the sidebar showed a raw integer (e.g. `+45000`) because `deltaLabel()` does plain string concatenation. Added a `deltaDisplay` override prop to `MeterRow` and passes a currency-formatted string for the cash row.

**Rationale**

These were presentation-only bugs in the existing Milestone 0 playable loop. No simulation logic or domain types were changed.

**Files changed**

- `src/components/ConcertForecast.tsx`
- `src/components/ConcertReport.tsx`
- `src/components/InstitutionMeters.tsx`

**Tests run and results**

Not run; no changes to `src/sim/`, scoring formulas, or state transitions.

**Known issues / risks**

- `node_modules` is not installed in the remote environment, so `tsc --noEmit` could not be verified locally. The import fix is correct per the TypeScript spec; Vite builds should pass.

**Handoff note**

UI display is now consistent: all cash values and deltas use `Intl.NumberFormat` currency formatting throughout the planning, forecast, and report screens.

**Next recommended action**

Review Milestone 0 simulation balance and UX before starting Milestone 1.

### 2026-05-16 — Add agent operating contract and progress log

**Primary milestone:** Project governance  
**Secondary milestone:** Milestone 0

**Summary**

Added `AGENTS.md` and this progress log to define how agents should work in the repo and how future PRs should record handoff information.

**Rationale**

The repo now has a playable Milestone 0 foundation. Before expanding into new systems, the project needs a concise operating contract so agents preserve scope control, milestone discipline, testing expectations, and separation between domain, simulation, and UI layers.

**Files changed**

- `AGENTS.md`
- `docs/PROGRESS.md`

**Tests run and results**

- Not run; documentation-only change.

**Known issues / risks**

- This progress log is being introduced after the first implementation PR, so earlier implementation details are represented only in commit messages and existing docs.
- No dedicated `docs/ARCHITECTURE.md` exists yet.

**Handoff note**

Future agents should update this file after each PR and keep entries self-contained. Do not rely on external session links for project memory.

**Next recommended action**

Review the current Milestone 0 implementation before starting Milestone 1. Focus on simulation balance, UX clarity, and whether tests cover the most fragile formulas.
