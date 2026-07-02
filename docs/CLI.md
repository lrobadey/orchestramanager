# Orchestra Manager CLI

A headless interface to the game, built for coding agents. It drives the exact
same pure engine (`src/engine/`) as the browser UI, so anything observed here
is true of the game — there is one set of rules with two mouths.

```bash
npm run cli -- <command> [flags]
```

## Design contract

- **One-shot commands.** Every invocation loads a save, does one thing, writes
  the save back, and exits.
- **JSON out.** Success prints one JSON document to stdout (exit 0). Errors
  print `{ "error": { "code", "message", "phase"? } }` to stderr (exit 1).
  Error codes are stable identifiers like `plan-incomplete`, `edit-open`,
  `season-already-started`, `save-not-found` — branch on them, not on message
  text.
- **State envelope.** Every mutating command appends a `state` object
  (`phase`, `currentSlotIndex`, `cash`, `planComplete`, `seed`, `rngCursor`,
  `save`) so you always know where the game stands without a follow-up call.
- **Full transparency.** Nothing is hidden from the CLI: donor volatility and
  taste, funding fits, forecast internals, and the concert roll are all
  inspectable. The information asymmetry a human player experiences in the UI
  does not apply here.
- **Self-describing.** `schema` emits every command with its flags and
  semantics, generated from the same dispatch table that runs them.

## Saves and determinism

Saves are plain JSON under `./saves/<name>.json` (default name `default`,
choose with the global `--save <name>` flag; point elsewhere entirely with the
`ORCHESTRA_SAVES_DIR` env var). A save carries the full game state plus:

- `seed` — chosen at `new` (or clock-derived if omitted), immutable.
- `rngCursor` — how many seeded rolls have been consumed.
- `rollHistory` — every roll taken, with its source.

The concert roll (0–100, 50 = neutral) is the game's **single stochastic
input**. `run-concert` draws it from the seed's stream at the cursor;
`--roll X` overrides for a what-if **without consuming the cursor**, so
explorations never derail the seeded timeline.

**Contract:** the same `new --seed S` followed by the same command sequence
produces byte-identical outcomes. Replay any career from its seed.

## Global flags

| Flag | Meaning |
|---|---|
| `--save <name>` | Which save under `./saves/` to use (default `default`). |
| `--path <dot.path>` | Filter the output, e.g. `--path game.season.institution.cash` or `--path donors[0].id`. Plain dot/bracket paths only — pipe to `jq` for anything fancier. |

## The season loop

The game is season-based: four concerts, planned as a unit, performed in
order. Phases flow `planning → in-season → report → in-season → … →
season-complete`, with an `editing` sub-state when a mid-season revision draft
is open.

```bash
# 1. Found the orchestra (creates the save)
npm run cli -- new --name "Aurora Philharmonic" --seed 7

# 2. Study the world
npm run cli -- works                    # full repertoire library
npm run cli -- donors                   # donor pool incl. hidden params
npm run cli -- audience                 # city segments + relationships
npm run cli -- roster                   # the musicians

# 3. Program all four concerts
npm run cli -- program set --slot 0 \
  --works beethoven-egmont,first-desk-concerto,beethoven-5 \
  --rehearsal 4,7,9 --marketing 15000 --price 70
# ... slots 1-3 ...

# 4. Read the forecasts and work the donors
npm run cli -- forecast --slot 0
npm run cli -- funding
npm run cli -- dedicate --slot 1 --donor eleanor-voss
npm run cli -- ask --donor eleanor-voss --slot 0 --amount 45000
npm run cli -- restrict --donor eleanor-voss --slot 0

# 5. Commit: funding freezes, the plan locks
npm run cli -- begin-season

# 6. Play the season
npm run cli -- run-concert              # seeded roll
npm run cli -- report                   # pending report (also echoed by run-concert)
npm run cli -- advance                  # consequences land, season advances
npm run cli -- run-concert --roll 95    # what-if override (cursor untouched)
# ... four times ...

# 7. Close the books
npm run cli -- summary
npm run cli -- new-season               # fresh season, same orchestra + seed stream
```

### Mid-season revision (breach)

In-season, `program set --slot <active>` stages a **revision draft** rather
than changing the committed plan. Donors who pledged against the committed
program may withdraw when the program under them changes:

```bash
npm run cli -- program set --slot 0 --works glacier-index,harbor-grid,night-ferry
npm run cli -- edit preview     # who withdraws, how much, who cools
npm run cli -- edit confirm     # breach lands; or: edit cancel
```

## Balancing: batch mode

`batch` plays many fully deterministic seasons under a built-in programming
strategy and reports the outcome distribution. It never touches a save file.

```bash
npm run cli -- batch --strategy adventurous --runs 200 --seed 42
npm run cli -- batch --strategy safe --runs 200 --rolls neutral   # all rolls fixed at 50
```

Output: per-run rows (`finalCash`, `totalNet`, `avgQuality`,
`avgCapacityPercent`, `fundingCoveragePercent`, `insolvent`, …) plus aggregate
distributions (min/p25/median/p75/max/mean) and the insolvency rate. Diff two
batch outputs before and after a tuning change to see exactly what moved.

Strategies (`random`, `safe`, `adventurous`) live in
`src/engine/strategies.ts`. They are deliberately crude, legible heuristics —
tuning instruments, not model players.

## Command reference

Run `npm run cli -- schema` for the always-current machine-readable list, or
`npm run cli -- help` for the human version. In brief:

| Command | Purpose |
|---|---|
| `new` | Found an orchestra: fresh save with a replayable seed. |
| `state` | Full dump: phase, seed, roll history, complete game state, derived readouts. |
| `works` / `roster` / `donors` / `audience` | Inspect the world (full stat blocks, hidden params included). |
| `program show` / `program set` | Read or write a concert's program, rehearsal split, marketing, pricing. |
| `dedicate` / `ask` / `restrict` | Sway the donors during planning. |
| `funding` | The funding picture: live auto-fill while planning, frozen commitment after. |
| `forecast` | Full deterministic forecast for a slot (reflects an open revision draft). |
| `begin-season` | Commit the plan; donor funding freezes. |
| `run-concert` / `report` / `advance` | The performance loop. |
| `edit preview` / `edit confirm` / `edit cancel` | Mid-season revision and its donor breach. |
| `summary` | Season summary + full transaction ledger (after concert 4). |
| `new-season` | Reset for a fresh season, keeping the orchestra and seed stream. |
| `batch` | Many deterministic seasons under a strategy; outcome distributions. |
| `schema` / `help` | Self-description. |
