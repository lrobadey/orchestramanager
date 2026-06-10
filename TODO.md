# TODO

Working checklist for **Orchestra Manager**. Keep this aligned with `docs/PROGRESS.md`; completed PR-level work should still be recorded there.

## Now

- [x] Add per-service musician payroll (labor model): work forces, core list + extras, principal premium. See `docs/LABOR_MODEL.md`.
- [x] Rebalance world economics around real labor costs (donor capacities, starting cash, base concert cost).
- [x] Add full four-concert season integration test (`tests/seasonLoop.test.ts`).
- [ ] Review authored `forces` data in `src/data/works.ts` against the scores (Luca).

- [x] Add prominent last-delta movement graphic to Donor Relations.
- [x] Individualize donor relationship changes after each resolved concert.
- [x] Split donor data into music taste, institutional priorities, and influence weights.
- [x] Replace donor taste bars with two radar charts and radar glyph annotations.
- [x] Update tests/docs and push PR branch.
- [x] Add five named donor objects and persist them in season state.
- [x] Add Donor Relations screen with relationship and taste charts.
- [x] Add Donors tab to the shared canopy navigation.
- [x] Add minimal cash-timing model: posted vs scheduled finance transactions.
- [x] Use scheduled positive donor rows for Ledger Donor watch and scheduled negative rows for Bills queued.
- [x] Update tests for immediate cash impact, future settlement, and transaction status transitions.
- [ ] Browser-check the full current navigation path: Home → Roster → Programme → Library → Ledger.
- [ ] Run one concert through Report → Home and verify the next concert slot becomes active.
- [ ] Complete all four concerts and verify Season Summary appears and remains visually consistent with the Home Console chrome.
- [ ] Check dense/narrow viewport layouts, especially Library, Ledger, Report, and Summary.
- [ ] Fix any visual regressions found during the manual browser pass.

## Next

- [x] Replace Ledger recent-transaction placeholder rows with resolved-concert transaction history.
- [x] Replace Ledger donor/payable placeholder rows with small sim-backed finance data.
- [x] Define one source of truth for cash movement, concert P&L, payables, donor support, and transaction history.
- [x] Add or update tests for new finance-history state transitions.
- [ ] Update `docs/PROGRESS.md` after the finance-history slice with files changed, rationale, tests, risks, and handoff notes.

## Later

- [ ] Replace remaining Home stub data in `src/data/homeStubs.ts` with real simulation or scenario state where appropriate.
- [ ] Decide whether minimal localStorage save/load belongs in the current Milestone 6 release slice.
- [ ] Add integration coverage for the full four-concert season flow if not already sufficient.
- [ ] Review README for current Season One Vertical Slice accuracy before release.
- [ ] Audit docs for stale references to disabled Library/Ledger or old shell UI.

## Deferred / Out of Scope For Current Slice

- [ ] Backend server.
- [ ] Database or cloud saves.
- [ ] Authentication/accounts.
- [ ] Real LLM agents.
- [ ] Full roster hiring market.
- [ ] Full rival institution simulation.
- [ ] Generated audio or real-time concert visualization.

## Done

- [x] Create project-level `TODO.md`.
- [x] Add sim-backed transaction rows for Ledger Recent transactions.
- [x] Add cash timing with scheduled donor support and queued bills.
- [x] Add initial named donor cohort and Donor Relations screen.
- [x] Split donor profiles into music/institution radar models.
- [x] Attach named donors to concert resolution with deterministic individual reactions.
- [x] Show last-concert donor movement prominently in donor cards and selected profile.
