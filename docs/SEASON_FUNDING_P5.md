# Season Funding — P5: Operating Funders & the Long Arc

Status: **Specced** · Branch: `season-funding-redesign` · Parents: [`SEASON_FUNDING_MODEL.md`](./SEASON_FUNDING_MODEL.md), [`SEASON_FUNDING_P3.md`](./SEASON_FUNDING_P3.md), [`SEASON_FUNDING_P4.md`](./SEASON_FUNDING_P4.md)

P5 adds the other half of contributed income: money that funds the **institution**,
not a concert. It's the freedom engine — as the orchestra gets healthy, operating
support and the audience flywheel fund you *regardless of program*, which is how
you eventually outgrow the program-constrained founders of P3.

P5 splits in two: **P5a — operating funders** (single-season, built first) and
**P5b — the multi-season arc** (carryover + donor evolution, deferred).

---

## P5a — Operating funders (build first)

### The model: one wallet, an emergent spectrum
Every donor has **one capacity** (their wallet). It divides — emergently, from
stats, no hard classes — between:

- **Concert pledges** — the program-constrained, actively-courted money of P3/P4.
- **Operating support** — unrestricted money that funds a *healthy institution*,
  not a night.

The split is the donor's **institutional-vs-music weight**: an `operating
propensity ≈ institutional / (music + institutional)`. Saye (30/70) reserves
~70% of his wallet as operating budget and pledges little to specific nights;
Eleanor (75/25) reserves ~25% and pours the rest into concerts she loves. Same
engine, opposite ends of the spectrum.

`operatingBudget(donor) = capacity × operatingPropensity`
`concertCapacity(donor) = capacity − operatingBudget`  ← what the P3 auto-fill/ask spends

### Earned by health, not asked
Operating money is **not courted** — there's no ask/haggle for it. It emerges
from **institutional health × the donor's institutional alignment**:

- Build an **institution health profile** (the existing `DonorInstitutionalPriorities`
  axes) from institution + audience state: `prestige ← artisticReputation`,
  `stability ← cash health + donorConfidence`, `reach ← audience size/awareness`,
  `revenue ← earned-income signals`, `access`, `innovation ← identity`.
- `operatingFit = scoreInstitutionalFit(donor.institutionalPriorities, healthProfile)`
  (reuses P2's function), normalized to a `healthFactor ∈ 0..1`.
- You *earn* operating money by running a strong institution (full rooms, good
  press, sound books) — the reward for institutional excellence, distinct from
  the concert ask.

### Continuous — re-judged per concert
Operating support is a **stream, not a pledge**. At each concert it's re-evaluated
on *current* health and paid:

`operatingPayment(donor, concert) = (operatingBudget / 4) × healthFactor(now)`

So a strong opening raises reputation/audience → bigger operating checks for the
rest of the season; a flop shrinks them mid-stream. Total over the season stays
within `operatingBudget`, so the one-wallet split holds.

### It also fills coverage
Operating money **backfills uncovered concert cost**. At resolution, a concert's
income is `concert pledges (realized) + operating payment`; operating money fills
the night's remaining gap first, surplus becomes general cash. Consequence:

- At **founding**, a night's coverage gauge still shows **program money only**
  (concert pledges vs cost) — so it can read exposed.
- A **healthy** institution's operating stream then rescues that exposure at
  resolution. You can deliberately found an under-pledged season and *bet on your
  own health* to cover it — and a flop makes that bet bite.

This is the central P5a tension: **program integrity vs. earned health.** The
naked concert isn't only a cash risk now; it's a bet that you'll stay healthy
enough to fund it without a sponsor's strings.

### Finance & UI
- Operating payments flow through the existing scheduled/posted finance model as
  a new `operating-support` transaction kind, posting per concert.
- **Founding funding panel:** add a secondary readout — *projected operating
  support* for the season at current health — beside the program-money gauge, so
  the player sees the cushion they're betting on (clearly marked "earned, not
  pledged; varies with health").
- **Concert report / ledger:** show operating income alongside concert donor
  income so the two streams read distinctly.

### P5a build order (each shippable + tested)
- **P5a-1** — operating engine (pure-sim, tested): emergent wallet split, the
  institution health profile, `healthFactor`, per-concert operating payment.
  Reserve operating budget so `computeSeasonFunding` spends only concert capacity.
- **P5a-2** — wire operating income into resolution (fills the night's gap, then
  cash) via the finance settlement; surface in the concert report.
- **P5a-3** — UI: projected-operating readout on the founding panel; operating
  line in report/ledger.

### P5a tunables
| Knob | Default |
|---|---|
| operating propensity | `institutional / (music + institutional)` |
| healthFactor floor | below-neutral fit gives little/no operating money |
| reactivity | payment scales linearly with current healthFactor |

---

## P5b — The multi-season arc (deferred)

The evolution half needs a **season-to-season spine that doesn't exist yet** —
`handleNewSeason` currently resets cash, reputation, audience, and donors to
defaults. P5b builds carryover, then layers donor evolution.

Scoped behaviors (chosen): **relationship & capacity carry.**
- A donor's **relationship/loyalty** persists across seasons — warmth from
  dedications and **betrayal memory** from breaches (P3e/P4) compound over time.
- A donor's **capacity** grows when well-treated and shrinks when overdrawn or
  betrayed — this season's coverage borrows from next season's runway.

Deferred further (not in P5b's first cut): taste/priority drift, and an explicit
"outgrow your founders" rule (it already emerges — a strong audience + operating
base makes concert pledges optional and restrictions ignorable).

---

## Open / deferred
- Numeric balancing of propensity, healthFactor curve, and operating reactivity
  against the live sim.
- Whether operating funders also react to breaches/identity (currently health-only).
- P5b carryover spine and donor evolution as their own slice.
