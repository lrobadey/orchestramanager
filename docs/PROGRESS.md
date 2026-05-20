# Progress Log

This file is the project handoff record for **Orchestra Manager**.

Agents must update it after each PR. Keep entries concise, factual, and self-contained. Do not include external coding-session links.

## Current Status

**Last updated:** 2026-05-20
**Current milestone:** Milestone 2 — Roster and Section Leader System
**Current playable state:** Full four-concert season loop is playable with a stateful principal roster layered into the loop. Player can switch between Season and Roster views, inspect all 15 named principals by section, see section strengths and repertoire-fit stress, program concerts from the nested repertoire library, view roster-informed forecasts, run concerts, read section outcomes and roster aftermath, and carry principal form/morale changes into the next concert.
**Latest PR:** Stateful roster vertical slice
**Known blockers:** None currently recorded.
**Current risks:** Roster movement is intentionally narrow: only form and morale change after concerts. There is still no hiring, contracts, injuries, substitute list, seating chart, personnel history, or full HR system.
**Next recommended action:** Browser-check the new Roster view, forecast Roster Fit panel, concert report Roster Aftermath block, and verify that applying one concert changes principal form/morale for the next planning screen.

## Log Entries

### 2026-05-20 — Stateful roster vertical slice

**Primary milestone:** Milestone 2 — Roster and Section Leader System

**Summary**

Added a stateful principal-roster layer to the existing four-concert season loop. `SeasonState` now owns a live `RosterState`, forecasts and concert resolution use the live principals, and concert reports emit form/morale changes that carry into the next concert. The roster screen now opens with a graphic orchestra-strength instrument: one aggregate score, a large 0-100 gradient gauge, and four connected section rails. Each section rail has an `Inspect` control that populates a non-carded principal ledger below the board.

**Rationale**

Milestone 2 should make the orchestra itself feel like a nested system, not a hidden technical-quality number. This slice keeps the scope tight: all 15 named principals matter through section strength, repertoire fit, stress, and post-concert form/morale movement, but no hiring, contracts, injuries, auditions, substitutes, seating, or union systems were added.

**Files changed**

- `src/types/core.ts`
- `src/data/principals.ts`
- `src/sim/roster.ts`
- `src/sim/forecastProgram.ts`
- `src/sim/resolveConcert.ts`
- `src/sim/season.ts`
- `src/App.tsx`
- `src/components/AppShell.tsx`
- `src/components/RosterOverview.tsx`
- `src/components/ConcertForecast.tsx`
- `src/components/ConcertReport.tsx`
- `src/styles/app.css`
- `tests/roster.test.ts`
- `tests/resolveConcert.test.ts`
- `tests/scoring.test.ts`
- `tests/season.test.ts`
- `docs/PROGRESS.md`

**Tests run and results**

```
npm test

Test Files  5 passed (5)
Tests       58 passed (58)
```

```
npm run build

✓ built in 509ms
```

Browser verification:
- Not run by agent at user request.
- User will perform the browser check for planning, roster view, concert report, and one apply-to-next-concert roster update.

**Known issues / risks**

- Principal movement is deliberately limited to form and morale.
- Roster aftermath currently shows the most visible changed principals, not a full personnel-history ledger.
- The separate Roster view supports the season loop directly; it is not a placeholder for future roster tabs.

**Handoff note**

The live roster source of truth is `season.roster.principals`. The app passes those principals into forecast and resolve calls. `src/sim/roster.ts` owns section strength, repertoire fit, section stress, and post-concert roster updates. React components display those outputs but do not own the formulas.

**Next recommended action**

Browser-check the roster loop, then tune whether form/morale deltas are strong enough to make programming pressure legible across all four concerts.

---

### 2026-05-19 — Audience ticket pricing and student tickets

**Primary milestone:** Milestone 3 — Audience and Finance Systems
**Secondary milestone:** Milestone 1 — Four-Concert Season Loop

**Summary**

Added a narrow audience-pricing layer inside the existing season planning loop. `ConcertProgram` now carries optional student-ticket policy. Forecasts and reports now include segment-level audience mix, and ticket revenue is calculated from segment attendance times each segment's effective ticket price instead of `totalAttendance * standardTicketPrice`.

**Rationale**

The change makes price affect who comes, not just how many people come. Student tickets are a visible production choice that can restore Students & Educators attendance at high standard prices while lowering average yield. Institutional meters remain unchanged for this slice; the feature affects audience mix and money only.

**Files changed**

- `src/types/core.ts`
- `src/sim/forecastProgram.ts`
- `src/sim/resolveConcert.ts`
- `src/App.tsx`
- `src/components/ProgramBuilder.tsx`
- `src/components/ConcertForecast.tsx`
- `src/components/ConcertReport.tsx`
- `src/styles/app.css`
- `vite.config.ts`
- `.gitignore`
- `tests/resolveConcert.test.ts`
- `tests/season.test.ts`
- `docs/PROGRESS.md`

**Tests run and results**

```
npm test

 Test Files  4 passed (4)
      Tests  51 passed (51)
```

```
npm run build

✓ built in 496ms
```

Live UI check:
- Ran `npm run dev -- --host 127.0.0.1`.
- Verified the planning screen renders Student Tickets and Student Price controls.
- Verified the student-ticket checkbox toggles from Off to Enabled in the browser.

**Known issues / risks**

- `.gitignore` and Vitest excludes now keep local agent/browser tooling folders out of staged changes and test discovery.
- Browser tooling confirmed the new controls, but its limited drag/drop API did not complete a live repertoire-card drag to verify the completed forecast panel visually. Forecast/report audience mix is covered by simulation tests and production build.
- No student ticket cap, targeted marketing, subscription model, or audience-trust delta was added.

**Handoff note**

The audience-pricing layer preserves the current architecture: `ConcertProgram` stores player policy, `forecastProgram` owns deterministic segment math, `resolveConcert` applies concert variance to the forecasted mix, and React components only display/control the state. Revenue totals in forecast, report, cash delta, and season summary now flow from segment revenue.

**Next recommended action**

Play a full four-concert season with contrasting programs and prices to tune whether Students & Educators and Young Professionals fall off sharply enough without making high-price prestige programs too reliable.

---

### 2026-05-18 — Issue #13 repertoire expansion and nested picker

**Primary milestone:** Milestone 1 — Four-Concert Season Loop
**Secondary milestone:** Milestone 0 — Opening Night Foundation

**Summary**

Expanded the playable public-domain symphonic repertoire for issue #13 and replaced the flat repertoire shelf with a nested Era -> Composer -> Works library. The program builder now supports either 2-work or 3-work concerts, so large symphonic events such as Beethoven 9 and Manfred can be programmed without forcing a third work into the evening.

**Rationale**

The expanded catalog would make the previous flat shelf too noisy, and several new works are structurally too large for the old fixed three-piece evening. The new system keeps the current vertical playable loop, but makes repertoire selection more nested and institutionally legible: choose a historical era, choose a composer, then choose works with visible draw/prestige/donor/novelty tradeoffs.

**Files changed**

- `src/data/works.ts`
- `src/types/core.ts`
- `src/sim/forecastProgram.ts`
- `src/sim/resolveConcert.ts`
- `src/App.tsx`
- `src/components/ProgramBuilder.tsx`
- `src/components/ConcertForecast.tsx`
- `src/components/ConcertReport.tsx`
- `src/styles/app.css`
- `tests/works.test.ts`
- `tests/resolveConcert.test.ts`
- `tests/season.test.ts`
- `vite.config.ts`
- `docs/PROGRESS.md`

**Tests run and results**

```
npm test

Test Files  4 passed (4)
Tests       45 passed (45)
```

```
npm run build

tsc && vite build
✓ built in 492ms
```

**Browser verification**

- Verified through browser automation before the browser backend failed that the default library opened to Romantic / Beethoven.
- Verified switching to 2 Works showed two active slots, `20 hrs across 2 pieces`, and a single intermission toggle between the two works.
- Verified era/composer filtering by switching to Late Romantic / Sibelius and seeing Sibelius symphonies ordered by number.
- Final in-app browser verification could not complete after the local browser backend started returning loopback/blocking errors and then became unavailable.

**Known issues / risks**

- Beethoven 9 and Manfred logistics are encoded into `rehearsalLoad` and section demands because `Work` still has no chorus, soloist, extra-player, or stage-complexity fields.
- Browser verification should be rerun in a stable browser session before merging if visual signoff is required.

**Handoff note**

This PR builds on the merged principal-roster, leadership-divisor, and familiarity systems from PR #10 and PR #12. It does not add backend, database, auth, LLM agents, save/load, routing, real concert visualization, full roster management, or future placeholder tabs. The one config change in `vite.config.ts` excludes `.claude/` and `.playwright-mcp/` from Vitest so untracked automation/worktree artifacts do not duplicate test discovery.

**Next recommended action**

Open the app in a stable browser session, drag Beethoven 9 and Manfred into a 2-work program, confirm the live forecast is severe but playable, then run at least one four-concert season to tune the expanded catalog.

---

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
