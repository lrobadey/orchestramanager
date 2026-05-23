# Progress Log

This file is the project handoff record for **Orchestra Manager**.

Agents must update it after each PR. Keep entries concise, factual, and self-contained. Do not include external coding-session links.

## Current Status

**Last updated:** 2026-05-22
**Current milestone:** Milestone 6 — Vertical Slice Release (donor relations foundation)
**Current playable state:** The app now uses the new **Home Console** chrome across the full Season One loop. Home, Roster, Programme, Library, Ledger, Donors, Report, and Summary all render through chromeless full-screen strata surfaces with the shared canopy/nav and institutional vitals band. The season now persists a five-donor advancement cohort with distinct music tastes, institutional priorities, influence weights, relationship scores, capacity, volatility, and gift restrictions. Named donors now react individually after each resolved concert using the program's works and concert report outcomes. The Donor Relations tab presents a roster-like cultivation map with donor cards, relationship meters, an influence split, and side-by-side radar charts for music taste and institutional priorities. Ledger still uses sim-backed finance transactions for Recent transactions, Donor watch, and Bills queued.
**Latest PR:** Donor reaction foundation — individual post-concert relationship deltas
**Known blockers:** None currently recorded.
**Current risks:** Donor relationships now react to concerts, but named donors still do not drive pledge amounts individually. The Donor Relations screen remains diagnostic/inspectable only; cultivation actions such as dinner, salons, or gala events are not implemented yet. Donor radar glyphs are visual shorthand derived from 0–100 values, not separate mechanics. Several Home panels remain clearly-labeled stubs in `src/data/homeStubs.ts`. Roster, Programme, Library, Ledger, Donors, Report, and Summary inherit `.home-console` styles, so visual regressions are most likely in dense/narrow viewport layouts.
**Next recommended action:** Browser-check the new Donors tab and then implement post-concert donor reactions so each donor's relationship changes based on repertoire, access policy, attendance, critical response, and financial stability.

## Log Entries

### 2026-05-22 — Donor reaction foundation: individual post-concert deltas

**Primary milestone:** Milestone 6 — Vertical Slice Release (donor relations foundation)
**Secondary milestone:** Milestone 3 — Audience and Finance Systems

**Summary**

Attached the named donor cohort to concert resolution. `resolveSeasonConcert` now receives the work library, derives a concert music profile and an institutional outcome profile, then updates each donor's relationship, `lastDelta`, and `recentReaction` according to that donor's music taste, institutional priorities, influence weights, and volatility.

**Rationale**

This individualizes the existing global donor-response idea without replacing global `institution.donorConfidence` yet. Donor confidence remains an aggregate institution stat, while named donors now become an inspectable relationship layer that reacts differently to the same program and report.

**Files changed**

- `src/sim/donorReactions.ts` — new pure donor reaction/profile scoring layer.
- `src/sim/season.ts` — passes resolved concerts through donor reactions.
- `src/App.tsx` — passes `works` into `resolveSeasonConcert`.
- `tests/season.test.ts` and `tests/audienceFinance.test.ts` — update resolver calls and assert donor mutation.
- `TODO.md` and `docs/PROGRESS.md` — update handoff state.

**Tests run and results**

```
npm test

Test Files  8 passed (8)
Tests       81 passed (81)
```

```
npm run build

tsc && vite build
✓ built in 508ms
```

**Known issues / risks**

- Named donor relationship changes are deterministic but early-tuned heuristics.
- Named donors do not yet create individual pledge transactions or emails.
- Browser verification was not run in this pass.

**Handoff note**

The next donor slice should surface clearer reason packets in the UI and eventually route named donor reactions into pledge/cultivation mechanics.

---

### 2026-05-22 — Donor radar model refinement: split music and institution charts

**Primary milestone:** Milestone 6 — Vertical Slice Release (donor relations foundation)
**Secondary milestone:** Milestone 3 — Audience and Finance Systems

**Summary**

Refined donor profiles into separate `musicTaste`, `institutionalPriorities`, and `influenceWeights` models. The Donor Relations screen now removes the old taste-bar table and shows two radar charts side by side: Music taste and Institutional priorities. Radar labels include plus/minus glyph annotations derived from the underlying 0–100 values.

**Rationale**

Splitting taste from institutional priority lets donors become more multidimensional. Victor Saye can have modernist taste while still judging outcomes mostly by revenue/stability, and Eleanor Voss can be music-led while prioritizing prestige over generic stability. The influence split establishes the foundation for future post-concert donor reaction math.

**Files changed**

- `src/types/core.ts` — replaces mixed donor preferences with music taste, institutional priorities, and influence weights.
- `src/data/donors.ts` — updates all five donor profiles to the agreed axis values.
- `src/components/DonorRelationsScreen.tsx` — replaces taste bars with two radar charts and influence split copy.
- `src/styles/home.css` — adds/updates styles for dual radar layout, influence bar, and radar glyphs.
- `tests/season.test.ts` — verifies representative donor values and weight totals.
- `TODO.md` and `docs/PROGRESS.md` — update handoff state.

**Tests run and results**

```
npm test

Test Files  8 passed (8)
Tests       81 passed (81)
```

```
npm run build

tsc && vite build
✓ built in 511ms
```

**Known issues / risks**

- Donor relationships still do not react to concerts; this remains a display/data foundation.
- Radar glyphs are shorthand only and should not be treated as separate state.
- Browser verification was not run in this pass.

**Handoff note**

Future donor reaction logic should compute a music-fit score and institutional-fit score independently, then combine them using `influenceWeights`.

**Next recommended action**

Browser-check Donors tab at desktop and narrow widths, then implement post-concert donor relationship deltas using the split radar model.

---

### 2026-05-22 — Donor relations foundation: named cohort and Donors tab

**Primary milestone:** Milestone 6 — Vertical Slice Release (donor relations foundation)
**Secondary milestone:** Milestone 3 — Audience and Finance Systems

**Summary**

Added five named donors as persistent season state and introduced a new Donor Relations screen/tab. The donor cohort spans canon traditionalism, avant-garde foundation support, 19th/20th-century prestige patronage, community/access funding, and pragmatic corporate sponsorship. The screen follows the existing Home Console conventions and borrows the Roster screen's inspectable-card pattern: donor list on the left, selected donor profile on the right, relationship meter, taste bars, opinion-spectrum graphic, restriction/capacity copy, and cultivation notes.

**Rationale**

The prior donor system was still mostly institutional and abstract. This slice turns donors into a visible cast with differing values, giving future concert-reaction and cultivation mechanics concrete relationships to update. It intentionally stops before adding donor reactions or actions so the first vertical step remains inspectable and stable.

**Files changed**

- `src/types/core.ts` — adds `Donor`, `DonorPreferences`, `DonorState`, restriction styles, and `donors` on `SeasonState`.
- `src/data/donors.ts` — defines Eleanor Voss, The Aster Foundation, Martin & Celia Rehnquist, Okafor Civic Fund, and Victor Saye.
- `src/sim/season.ts` — initializes donors in new seasons and preserves them through concert resolution.
- `src/components/DonorRelationsScreen.tsx` — new donor relationship/taste chart screen.
- `src/components/HomeConsole.tsx` and `src/components/home/CanopyHeader.tsx` — add the `donors` navigation key/tab.
- `src/App.tsx` — routes the Donors tab.
- `src/components/LibraryScreen.tsx` and `src/components/LedgerScreen.tsx` — widen navigation callback types for the new tab.
- `src/styles/home.css` — adds Donor Relations screen styling.
- `tests/season.test.ts` — verifies initial donor cohort and donor persistence through resolution.
- `TODO.md` — tracks this donor-relations slice.
- `docs/PROGRESS.md` — records this slice and test results.

**Tests run and results**

```
npm test

Test Files  8 passed (8)
Tests       81 passed (81)
```

```
npm run build

tsc && vite build
✓ built in 507ms
```

**Known issues / risks**

- Donors are inspectable state only; no concert reactions, relationship deltas, individual pledges, dinners, or gala actions have been added yet.
- The new screen needs browser/layout verification, especially narrow viewport behavior and canopy nav spacing with the added tab.
- Donor watch in Ledger still comes from finance transaction timing, not named donor-specific pledges.

**Handoff note**

The next donor slice should evaluate each donor after concert resolution and update `relationship`, `lastDelta`, and `recentReaction`. Keep donor preferences as the source of disagreement; avoid collapsing the system back into one global donor-confidence score.

**Next recommended action**

Implement post-concert donor reactions using existing program/report signals, then connect individual donor pledge rows to Ledger Donor watch.

---

### 2026-05-22 — Cash timing finance slice: scheduled donor support and queued bills

**Primary milestone:** Milestone 6 — Vertical Slice Release (finance legibility)
**Secondary milestone:** Milestone 3 — Audience and Finance Systems

**Summary**

Added minimal cash timing to the existing concert finance loop. Finance transactions now have `posted` or `scheduled` status plus a `dueSlotIndex`. Ticket revenue, rehearsal costs, and marketing costs post immediately when a concert resolves. Donor support, base concert costs, and production costs are scheduled for the next concert slot and settle automatically when that slot resolves. Ledger now renders Donor watch and Bills queued from scheduled transactions instead of static stubs.

**Rationale**

The previous ledger history made finance explainable, but cash still behaved like instant settlement. This slice makes liquidity more realistic and emergent without adding a full accounting system: a concert can look profitable on paper while donor pledges and vendor bills land later.

**Files changed**

- `src/types/core.ts` — adds transaction status and due-slot fields.
- `src/sim/finance.ts` — assigns immediate vs scheduled timing to generated transaction rows.
- `src/sim/applyConcertReport.ts` — accepts an optional cash delta so non-cash institutional deltas can still apply while cash follows posted/settled transactions.
- `src/sim/season.ts` — settles due scheduled transactions at concert resolution and applies only posted/settled cash movements.
- `src/components/LedgerScreen.tsx` — renders real scheduled donor pledges and queued bills alongside posted recent transactions.
- `tests/finance.test.ts` — verifies transaction status and due-slot assignment.
- `tests/season.test.ts` — verifies cash uses posted transactions first and scheduled rows settle later.
- `TODO.md` — tracks and marks the cash-timing slice.
- `docs/PROGRESS.md` — records this slice and test results.

**Tests run and results**

```
npm test

Test Files  8 passed (8)
Tests       81 passed (81)
```

```
npm run build

tsc && vite build
✓ built in 492ms
```

**Known issues / risks**

- Scheduled final-concert donor/bill rows remain due after the season because there is no explicit end-of-season settlement phase yet.
- Settlement currently occurs when the next concert resolves, not when the player opens the next planning screen.
- Ledger rows are derived from transaction labels only; there are no named vendors, named donors, or manual payment controls.
- Browser verification was not run in this pass.

**Handoff note**

`ConcertReport.net` still describes full concert profitability. Institution cash now describes liquidity: posted immediate movements plus settled prior scheduled movements. Keep that distinction clear in future UI copy and tests.

**Next recommended action**

Browser-check Ledger across two resolved concerts. If the timing model reads well, add a small season-end settlement step before/inside Summary so final-concert scheduled rows do not remain dangling.

---

### 2026-05-22 — Finance transaction history slice: real Ledger recent transactions

**Primary milestone:** Milestone 6 — Vertical Slice Release (finance legibility)
**Secondary milestone:** Milestone 3 — Audience and Finance Systems

**Summary**

Added a small sim-backed finance transaction layer for resolved concerts. Each resolved `SeasonConcertSlot` now stores six transaction rows generated from its `ConcertReport`: ticket revenue, donor support, base concert costs, rehearsal costs, marketing spend, and production costs. Ledger's Recent transactions panel now renders those real rows instead of `LEDGER_TRANSACTION_STUBS`, while Donor watch and Bills queued remain explicitly stubbed.

**Rationale**

The Ledger screen already showed real concert P&L totals, but its transaction panel was decorative. This slice makes the finance loop more inspectable without changing forecast formulas, concert resolution, cash timing, or balance: report totals remain the source of truth, and transaction rows explain the existing net cash movement.

**Files changed**

- `src/types/core.ts` — adds `FinanceTransactionKind`, `FinanceTransaction`, and `financeTransactions` on `SeasonConcertSlot`.
- `src/sim/finance.ts` — new builder that converts a `ConcertReport` into transaction rows whose amounts sum to `report.net`.
- `src/sim/season.ts` — initializes empty slot transactions and stores generated transactions when a concert resolves.
- `src/components/LedgerScreen.tsx` — renders real recent transactions from resolved season slots and removes the STUB flag from that panel.
- `tests/finance.test.ts` — verifies generated transactions sum to report net.
- `tests/season.test.ts` — verifies initial slots have no transactions and resolved slots store transaction rows.
- `TODO.md` — project checklist added for current and upcoming work.
- `docs/PROGRESS.md` — records this finance-history slice and test results.

**Tests run and results**

```
npm test

Test Files  8 passed (8)
Tests       81 passed (81)
```

```
npm run build

tsc && vite build
✓ built in 525ms
```

**Known issues / risks**

- Transaction rows are immediate resolved-concert explanatory rows; there is still no payable due date, delayed payment, donor account, or accounting-period system.
- Ledger Donor watch and Bills queued remain static stubs.
- Recent transactions are newest-concert-first by reversing the flattened slot transaction list; within a concert this currently displays production costs before ticket revenue.
- Browser verification was not run in this pass.

**Handoff note**

`src/sim/finance.ts` is intentionally derived from `ConcertReport`; it should not become a second source of truth for cash. If finance timing/payables are added later, introduce them explicitly rather than overloading these resolved-concert transaction rows.

**Next recommended action**

Browser-check Ledger before and after resolving one concert. If the panel reads well, replace either Donor watch or Bills queued with another narrow sim-backed slice.

---

### 2026-05-22 — UI transformation step 3: production Library/Ledger and full-loop console cutover

**Primary milestone:** Milestone 6 — Vertical Slice Release (UI polish / release packaging)
**Secondary milestone:** None — this is a production UI cutover over existing simulation data.

**Summary**

Moved the remaining production loop onto the new Home Console visual system. Library and Ledger are now enabled top-nav screens. Library renders the production repertoire with era/composer/search filters, selected-work metrics, and a demand radar. Ledger renders current cash, resolved concert P&L, and the live current-concert forecast when available. Report and Season Summary now render inside the chromeless Home Console shell instead of the legacy shell.

**Rationale**

The game had already adopted the New UI language for Home, Roster, and Programme, but Library/Ledger were disabled and Report/Summary still broke out into the older shell. This pass makes the production build match the tracked New UI direction across the full playable Season One loop without adding new simulation systems.

**Files changed**

- `src/App.tsx` — expands main navigation to Library/Ledger, routes both screens, and renders Report/Summary inside the chromeless Home Console shell.
- `src/components/LibraryScreen.tsx` — new production repertoire atlas using `Work` data.
- `src/components/LedgerScreen.tsx` — new production ledger screen using `SeasonState`, current forecast, and institution cash.
- `src/components/home/CanopyHeader.tsx` — enables Library and Ledger nav entries.
- `src/data/consoleStubs.ts` — isolates placeholder acquisition, donor, payable, and transaction rows, all marked as `STUB`.
- `src/styles/home.css` — adds Home Console styling for Library and Ledger screens.
- `docs/PROGRESS.md` — records this Milestone 6 UI transformation step and test results.

**Tests run and results**

```
npm run build

tsc && vite build
✓ built in 567ms
```

```
npm test

Test Files  7 passed (7)
Tests       79 passed (79)
```

```
git diff --check

No output; passed.
```

Browser verification:

- Vite dev server started at `http://127.0.0.1:5173/`.
- The URL was opened for manual browser review.
- Automated Playwright load succeeded. The only console error observed was a missing `favicon.ico` 404.

**Known issues / risks**

- Library acquisition actions are disabled placeholders; there is no rental, ownership, purchase, study queue, or commission workflow yet.
- Ledger donor, bill, and transaction rows are placeholders in `src/data/consoleStubs.ts`; only cash, resolved concert P&L, and current forecast values are sim-backed.
- Existing Home placeholders remain in `src/data/homeStubs.ts`.
- Dense Library/Ledger layouts should be manually checked at 1440×900 and narrower widths.

**Handoff note**

Real values come from `works`, `SeasonState`, `ConcertForecast`, and `InstitutionState`. Fabricated New UI support rows are isolated in `src/data/consoleStubs.ts` and can be replaced when finance history, payables, donor accounts, repertoire licensing, or acquisition systems become real simulation layers.

**Next recommended action**

Replace the Ledger placeholder rows with a small sim-backed finance history so cash movement, concert P&L, payables, and donor support all have one real source of truth.

---

### 2026-05-22 — UI transformation step 2: shared Home chrome for Roster + Programme

**Primary milestone:** Milestone 6 — Vertical Slice Release (UI polish / release packaging)
**Secondary milestone:** None — this is a visual integration pass over existing playable screens.

**Summary**

Moved Roster and Programme onto the same chromeless Home Console surface as Home. Home, Roster, and Programme now share the integrated canopy/nav, Home-style institutional vitals band, disabled Library/Ledger entries, typography, background, and concept palette. Roster keeps the stage schematic / section monolith / principal ledger structure. Programme keeps the slot builder / library wall / live forecast rail structure.

**Rationale**

The previous port left Roster and Programme under the old global app shell, which made the top nav and vitals visibly mismatch the Home screen and the uploaded concept UI. This pass makes the main application tabs feel like one interface without adding new systems or changing simulation behavior.

**Files changed**

- `src/App.tsx` — renders Roster and Programme through `AppShell chromeless` with `CanopyHeader` and `UnderstoryVitals`; old shell nav/vitals are now limited to Report/Summary fallback surfaces.
- `src/styles/home.css` — adds `.home-console`-scoped overrides for Roster and Programme so their inner content uses the Home/concept typography, palette, background, hairlines, and non-rounded surfaces.
- `docs/PROGRESS.md` — records this Milestone 6 UI transformation step and test results.

**Tests run and results**

```
npm run build

tsc && vite build
✓ built in 581ms
```

```
npm test

Test Files  7 passed (7)
Tests       79 passed (79)
```

Browser verification:

- Not run by agent beyond leaving the app open in the in-app browser, per user request.

**Known issues / risks**

- Report and Season Summary still use the older shell and are intentionally out of scope for this pass.
- Roster and Programme dense layouts should be visually checked at desktop and narrow widths.
- Library and Ledger remain disabled nav entries.

**Handoff note**

`CanopyHeader` and `UnderstoryVitals` are now the shared top UI authority for Home, Roster, and Programme. The new CSS is scoped under `.home-console` so the older Report/Summary surfaces are not restyled accidentally.

**Next recommended action**

Browser-check the three main tabs for identical top chrome and then choose whether the next UI pass should port Report/Summary or build the Library room.

---

### 2026-05-21 — UI transformation step 1: Home Console + nav reshape

**Primary milestone:** Milestone 6 — Vertical Slice Release (UI polish / release packaging)
**Secondary milestone:** None — this is a UI architecture step that prepares the ground for re-skinning every screen in subsequent steps.

**Summary**

Introduced a new **Home Console** as the default landing screen, modeled on the reference at `/ New UI/home-c-v2.jsx`. Home renders four stacked strata — canopy (editorial header), understory (vitals + identity), floor (three columns: roster summary, next concert, inbox + finance), and a season-trail terrain band with diamond landmarks. The top nav restructures to **Home | Roster | Programme**. Library and Ledger appear inside Home's nav row as visually-complete disabled entries but do not yet have their own screens. Existing Programme / Roster / Report / Summary screens are unchanged.

**Rationale**

The new UI concept's central thesis is "Home as a console, not a dashboard. Program Builder isn't the home — it's a room you enter when you're ready." This step makes that real: the player lands on a situational read of the institution and chooses where to act. Subsequent migration steps will re-skin Programme to match the strata aesthetic, port Library and Ledger as standalone screens, and align Report / Summary visually. This step deliberately preserves the existing playable loop so the transformation can ship incrementally rather than as a single risky cutover.

**Files changed**

- `src/types/core.ts` — added `name`, `city`, `seasonLabel` to `InstitutionState`.
- `src/data/institution.ts` — seeded the three new fields (Puget Sound Philharmonic / Seattle / Season I · Debut).
- `src/sim/applyConcertReport.ts` — preserved the new institutional identity fields across the report-application transform.
- `src/components/AppShell.tsx` — added a `chromeless` prop that skips the header + vitals strip and renders an edge-to-edge main; Home uses it.
- `src/components/HomeConsole.tsx` — new top-level Home screen composing the four strata.
- `src/components/home/CanopyHeader.tsx` — editorial header, brand, nav row (with Library/Ledger marked disabled), days-to-curtain numeral.
- `src/components/home/UnderstoryVitals.tsx` — 6-vital grid + identity bars wired to live `institution` state.
- `src/components/home/FloorColumns.tsx` — three-column floor: roster sections (via `calculateSectionStrengths`) + watch principals, current concert slots + suggested works from the library + CTA to open Programme, inbox + stub finance sparkline.
- `src/components/home/SeasonTrail.tsx` — SVG terrain band with 4 diamond landmarks driven by `season.slots[i].status` and `currentSlotIndex`, leader-line annotations, and a resolved-leg overlay.
- `src/data/homeStubs.ts` — new module containing all stub data (inbox messages, finance sparkline, trail annotations, days-to-curtain, concert dates, venue name) each marked `// STUB`.
- `src/styles/home.css` — new stylesheet scoped to `.home-console`, holding home-only font variables and all strata + trail styling.
- `src/styles/app.css` — added new color tokens (`--ink-0`, `--ink-2`, `--ink-well`, `--moss`, `--hairline-soft`, `--birch-dim`, `--silver`, `--silver-dim`, `--bark-dim`, `--ember`, `--rust`, `--pine`) additively under `:root`; added a `.shell-main-bleed` modifier for chromeless mode.
- `index.html` — added Newsreader / EB Garamond / DM Sans to the Google Fonts URL alongside the existing Inter / JetBrains Mono.
- `src/App.tsx` — widened `MainView` to `'home' | 'programme' | 'roster'`, defaulted to `'home'`, renamed the `'program'` literal to `'programme'`, rebuilt the top nav with Home / Roster / Programme, rendered `<HomeConsole>` under a chromeless AppShell, and updated `handleDone` / `handleNewSeason` to return to Home after each concert and after season reset.

**Tests run and results**

```
npm test

Test Files  7 passed (7)
Tests       79 passed (79)
```

```
npm run build

tsc && vite build
✓ built in 1.6s
```

Browser verification:

- Not run by agent — the remote execution environment in this session has no browser-driver tool. The dev server starts and serves the index at `200 OK`, but no visual screenshot was captured.
- User should walk through the verification checklist below.

**Known issues / risks**

- Home contains stub panels labeled in code as `// STUB` (inbox messages, finance sparkline, trail annotations, days-to-curtain, concert dates, venue name). They look real visually; reviewers should treat them as scaffolding, not behavior.
- Home's typography is scoped to `.home-console` only. The rest of the app keeps its Inter / JetBrains Mono stack until a later step migrates global typography.
- New color tokens are additive — no existing variables were renamed or removed. Legacy and new tokens coexist for now.
- The 4-strata layout has a coarse breakpoint at 1100px but the dense floor + trail were drawn for a 1440-wide canvas; narrow viewports have not been validated.
- Library and Ledger nav entries are visually present but disabled; clicking them is a no-op.
- The institution now carries `name`, `city`, `seasonLabel` strings; existing tests construct institutions through the seeded `startingInstitution`, so no test fixtures needed updating, but any future code constructing `InstitutionState` literals must include the new fields.

**Handoff note**

The Home Console reads directly from `season`, `program`, and `works` — no derived global state was introduced. All fabricated data is isolated in `src/data/homeStubs.ts`; replacing it with sim-derived equivalents (inbox events, ledger time series, calendar/date model) is the natural next sim work. `AppShell.chromeless` is the integration seam: Home is the only current chromeless consumer, but a future Library or Ledger screen with its own header can use the same flag. The Programme drag/drop auto-open effect now gates on `mainView === 'programme'` rather than `'program'`; behavior is unchanged but the literal moved.

**Next recommended action**

Browser-check Home end-to-end: load `/`, observe the four strata, confirm the active diamond matches `currentSlotIndex`, click **Programme** to enter the existing program builder (repertoire shelf should auto-open on first entry), drag works in and run a concert through to the report and **Done**, confirm the app lands back on Home with the next slot active. Then choose step 2: re-skin Programme to the strata aesthetic, or port Library as a standalone screen.

---

### 2026-05-20 — Finnish UI / viewport merge synthesis

**Primary milestone:** Milestone 2 — Roster and Section Leader System
**Secondary milestone:** Milestone 6 — Vertical Slice Release

**Summary**

Resolved the divergence between the newer Finnish visual pass with the pop-out bottom repertoire shelf and the local fixed-viewport work. The resulting app keeps the remote shelf/planning structure and applies the local viewport contract to roster, concert report, and season-summary surfaces so they scroll inside the shell rather than pushing the browser page.

**Rationale**

The repertoire shelf is now part of the planning instrument, so the viewport fix needed to be integrated around that newer structure instead of restoring the older two-column planning surface. This keeps the newest visual hierarchy while preserving the local goal: a contained management cockpit with stable shell chrome and inner scrolling where dense screens need it.

**Files changed**

- `src/App.tsx`
- `src/components/ConcertReport.tsx`
- `src/components/SeasonSummaryPanel.tsx`
- `src/styles/app.css`
- `docs/PROGRESS.md`

**Tests run and results**

```
npm test

Test Files  6 passed (6)
Tests       71 passed (71)
```

```
npm run build

✓ built in 529ms
```

**Known issues / risks**

- Manual browser verification is still recommended for desktop and mobile viewport sizes.
- This was intentionally presentation-only: no simulation formulas, data behavior, roster state transitions, or repertoire data changed.
- The repertoire shelf still depends on drag/drop into program slots.

**Handoff note**

The rebase keeps the bottom repertoire shelf from `origin/main` and ports the local viewport work as shared `.screen` containment plus screen-specific wrappers. `AppShell` remains the height owner; roster, report, and summary scroll internally.

**Next recommended action**

Open the app and verify planning with the repertoire shelf, roster, report, and season summary across common viewport sizes.

---

### 2026-05-20 — Repertoire bottom shelf

**Primary milestone:** Milestone 2 — Roster and Section Leader System

**Summary**

Replaced the side-overlay repertoire drawer with an in-flow bottom shelf on the program planning screen. The planning screen now uses a bounded viewport frame, with the program builder and forecast above the shelf and only the shelf work list scrolling internally. The existing nested Era -> Composer -> Works browsing remains intact, and the shelf adds a lightweight text search over the currently selected catalog slice.

**Rationale**

The repertoire library is part of the planning surface, not a separate modal interruption. A bottom shelf keeps the player inside the program-building system, and the single-viewport layout keeps work cards and target slots visible together so drag/drop does not require page scrolling.

**Files changed**

- `src/App.tsx`
- `src/components/ProgramBuilder.tsx`
- `src/components/RepertoireDrawer.tsx`
- `src/styles/app.css`
- `docs/PROGRESS.md`

**Tests run and results**

```
npm test

Test Files  6 passed (6)
Tests       71 passed (71)
```

```
npm run build

✓ built in 545ms
```

Browser verification:
- Not run by agent at user request.
- Agent will open the dev server in the in-app browser for user review.

**Known issues / risks**

- This is intentionally UI-only: no repertoire data, scoring, roster, or concert-resolution behavior changed.
- The shelf preserves the existing drag/drop interaction, so adding works still depends on dragging repertoire cards into slots.
- The viewport fit is intentionally dense and should be browser-reviewed for visual comfort across common laptop sizes.
- During repertoire drags, the shelf/list temporarily allows overflow so cards are not clipped while moving toward program slots.
- The shelf controls were compressed into one toolbar row so the shelf can reserve most of its height for browsing work cards.
- `Drawer.tsx` remains in the codebase for now; it was not refactored or removed in this narrow change.

**Handoff note**

The repertoire surface now enters `ProgramBuilder` as `repertoireShelf` and renders below the cockpit grid. `RepertoireDrawer` keeps its current name to avoid churn, but it now returns a shelf section rather than wrapping content in the fixed drawer shell. `ProgramBuilder` owns the single-viewport composition; the app shell is bounded to `100dvh`, the shelf list is the only scrolling region in the repertoire surface, and `dragging-mode` lets active drag cards escape shelf clipping.

**Next recommended action**

Review the planning screen in the browser and tune the shelf height/card density if it feels too tall or too compressed during actual program building.

---

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

Test Files  6 passed (6)
Tests       71 passed (71)
```

```
npm run build

✓ built in 517ms
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

### 2026-05-19 — Program Arc Salience

**Primary milestone:** Milestone 1 — Four-Concert Season Loop
**Secondary milestone:** Concert perception / programming strategy slice

**Summary**

Added a pure Program Arc Salience layer so program order now affects perceived concert risk. The forecast keeps the existing raw rehearsal-pressure concept, but now also computes arc perceived damage, arc perceived upside, per-work arc damage, and a memory-anchor work. Concert resolution uses arc damage to shape audience response, prestige-weighted critic penalties, notable moments, and adventurous identity upside.

**Rationale**

The old model treated a concert like a bag of pieces: the worst-prepared work dominated the evening regardless of whether it opened, sat in the middle, or closed. This change makes programming order mechanically meaningful while staying narrow: underprepared finales and famous/long/prestigious works become more publicly exposed, while well-executed high-novelty works can create identity upside.

**Files changed**

- `src/types/core.ts`
- `src/sim/programArcSalience.ts`
- `src/sim/forecastProgram.ts`
- `src/sim/resolveConcert.ts`
- `src/components/ConcertForecast.tsx`
- `tests/programArcSalience.test.ts`
- `docs/PROGRESS.md`

**Tests run and results**

Not run locally. The remote execution environment available to this agent could not clone/install the repository dependencies, so validation should come from GitHub Actions on the PR.

Recommended checks before merge:

```
npm test
npm run build
```

**Known issues / risks**

- Weight coefficients are first-pass balance values, not final tuning.
- The UI adds only a compact forecast readout; it does not add a large program-arc dashboard.
- No per-audience-segment salience, LLM review generation, save/load changes, or new repertoire data were added.

**Handoff note**

The helper is pure and React-free. `forecastProgram` owns salience calculation after per-work pressure/risk is known. `resolveConcert` consumes the forecasted salience rather than recomputing it. The old `rehearsalPressure` field remains available as the raw pressure signal for compatibility and tuning.

**Next recommended action**

Run full PR CI, then manually compare the same under-rehearsed work as opener, middle, and finale. Tune `placementWeight`, damage normalization, and the audience/critic penalty coefficients if the finale effect feels too weak or too punitive.

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
- `computeRehearsalDivisor(work, principals)` — weighted average of per-section divisors (3.5–7), where each section's divisor is driven by each section's average principal leadership. Sections with no principals fall back to leadership 50 (divisor 5.25).
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
