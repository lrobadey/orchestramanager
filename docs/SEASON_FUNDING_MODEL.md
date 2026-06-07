# Season Funding Model — Design Doc

Status: **Proposed** · Branch: `season-funding-redesign`

A redesign of the game's economic spine: how a new orchestra is founded, funded,
and made financially viable. Replaces the per-concert "plan one, resolve, repeat"
loop with a **founding → season-as-a-unit → donor-funded** loop.

---

## 1. The problem (verified, not assumed)

Running the real sim (`forecastProgram` + `resolveConcert`) on the default Season 1
setup, popular program, $70 ticket, $15k marketing:

| Metric | Value |
|---|---|
| Attendance | **135 / 1,200 seats** (12% of house) |
| Ticket revenue | $9,450 |
| Donor support | ~$4,500 |
| Expenses | $62,400 |
| **Net** | **−$47,900** |

Starting cash is $180k → **insolvent before the first season ends.**

Root cause is a two-timescale mismatch:

- **Costs are fixed and immediate** ($45k base hall + ~$17k rehearsal + marketing).
  Break-even needs ~880 attendees at $70.
- **Revenue is gated behind a relationship state that starts near zero.** Attendance ≈
  `size × awareness × motivation × habit/trust × price_access`; awareness/habit start
  at 4–18 for a debut orchestra, crushing attendance to ~135.

Simulating 24 concerts in sequence: the flywheel *does* work (awareness builds ~1.3/concert,
break-even around concert ~18), but the player goes bankrupt around concert 5. **The engine
is sound; it's geared for a runway the player doesn't have.**

Marketing within a single concert is correctly perceived as a loss (~$0.10 of same-night
tickets per $1 spent). Its real product is *persistent awareness* that compounds over future
concerts — a capital investment mispriced as an operating expense, with a payback period
longer than the cash runway.

**Donors are the intended fix, and the data already supports it.** Total donor capacity is
**$425k** ($85k + $120k + $70k + $55k + $95k), but `estimateDonorUpliftFromDonors` taps only
**2.5% of capacity per concert** → ~$4.5k, a tip. They were written as season funders and
spent as tippers. Real orchestras run on contributed income; earned (ticket) income covering
the night is *not* the field norm.

## 2. The vision

### 2.1 Founding flow
1. Start screen → **Enter**.
2. "Welcome to Orchestra Manager. What is your orchestra's name?" → name input.
3. **Season planning screen** — plan all four concerts *in advance* (drag works to concert
   slots, borrowing the existing season trail + program builder vocabulary).
4. **Court donors against the plan**, then commit (the "make the ask" beat) and lock pledges.

### 2.2 Cost-anchored donor sponsorship (the core mechanic)
The concert's **cost is the ask**; aligned donors fill it. Money lands on *specific concerts*,
so funding becomes spatial and gaps are visible.

Deterministic allocation:
1. **Fit per (donor, concert)** — reuse `scoreMusicFit` / `scoreInstitutionalFit`, run
   per-concert instead of per-season. Unmet restriction → fit gated to 0.
2. **Each donor spends capacity in fit-rank order**, contributing to each concert up to
   `min(remaining capacity, concert's remaining cost)`. Won't overfund (leftover rolls to
   their next-favorite concert); won't fund below a fit threshold.
3. **Coverage per concert** = Σ contributions. `received / cost`. Below 100% = exposed; the
   gap is the player's risk.

Reused parameters (no new ones):
- **`volatility` → the pledge range.** Low-volatility (Eleanor, 34) = tight reliable band;
  high (Aster, 78) = wide nervous band. Volatility = how much you can count on the money.
- **`relationship` / `loyalty` → the ±.** Warm donors stretch onto a lukewarm second concert;
  cold donors contract to only their single favorite.

### 2.3 Emergent behaviors
- **Forces season variety** — give each donor a "home" night, or their money goes idle
  (cost caps absorption). Mirrors how real seasons balance across funders.
- **The naked concert is the hardest artistic choice** — reprogram toward a wallet, cut its
  cost, or *fund it anyway and eat the loss because it's who you are.* The integrity-vs-money
  tension at the center of the game.
- **Defines the cost floor (fix #1):** a concert must be roughly coverable by one aligned
  major donor (~$35–45k all-in), or the system never funds. So the $45k base hall cost drops;
  donor capacities and concert costs are two sides of one equation.

### 2.4 Changing the plan after the ask
Programs remain mutable, but a pledge is collateral on a specific plan. Swapping a work that
drops a (restricted) donor's key alignment below their line triggers **withdrawal** — reuse
the existing quadratic breach logic in `computeCommitmentDelta`. The same alignment bars that
taught the player to court a donor become the breach-warning surface.

### 2.5 Long-term arc
Donor capital → builds audience → audience eventually funds the player's own vision →
**outgrow your founders.** Donors themselves drift/evolve over time. Eventually a strong-enough
earned base can bypass donor constraints. This is the evolutionary spine of the game.

## 3. UI

- **Season funding gauge** (top of planning screen): `SEASON COST vs PLEDGED`, red when underfunded.
- **Alignment bars** rail (per donor): show only the donor's high-weight axes; bar fill =
  per-axis *alignment* (closeness to their ideal, from the existing distance math), not raw
  level; directional ⚠ annotation names the culprit concert. Restriction shown as a *tag*
  (a cliff, not a slope). Slim music-vs-institutional influence split = which lever to pull.
- **Season trail** (reuse home trail): each concert node gets a coverage fill + the donor
  chips latched to it; underfunded nights glow red. The funding coalition read as a map.
- Deep radar study view stays in `DonorRelationsScreen` (progressive disclosure).

## 4. Implementation phases

- **P0 — Cost rebalance.** Lower base concert cost to the donor-coverable range; enforce the
  hall-capacity cap (currently unenforced — attendance can exceed 1,200). Foundational tuning.
- **P1 — Founding flow & season-as-unit loop.** Start → name → plan-all-four. Restructure the
  game loop from per-slot to whole-season planning.
- **P2 — Cost-anchored sponsorship engine.** Per-concert fit; deterministic capacity allocation;
  coverage% and volatility-derived ranges. Pure-sim, fully testable.
- **P3 — Funding UI.** Gauge, alignment-bar rail, season-trail coverage + donor chips, the
  "make the ask" commitment beat. Detailed spec: [`SEASON_FUNDING_P3.md`](./SEASON_FUNDING_P3.md).
- **P4 — Mutation consequences.** Post-pledge program changes → breach → withdrawal warnings.
  Detailed spec: [`SEASON_FUNDING_P4.md`](./SEASON_FUNDING_P4.md).
- **P5 (later) — Operating funders & donor evolution.** Non-concert-latching institutional
  backers (e.g. Saye, judged on health not program); donor drift; the outgrow-donors endgame.
  Detailed spec: [`SEASON_FUNDING_P5.md`](./SEASON_FUNDING_P5.md).

## 5. Open questions
- Operating funders vs. concert sponsors: confirmed *not everyone latches to concerts*, but
  this is deferred to P5 as the more complex case.
- Exact allocation tie-breaking when a concert is over-subscribed by equally-aligned donors
  (iterative/deferred-acceptance vs. simple greedy) — an implementation detail for P2.
