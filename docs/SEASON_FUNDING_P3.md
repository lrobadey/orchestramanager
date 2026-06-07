# Season Funding — P3: Funding UI & The Ask

Status: **Built (P3a–P3e)** · Branch: `claude/pr-37-milestone-4kmCB` · Parent: [`SEASON_FUNDING_MODEL.md`](./SEASON_FUNDING_MODEL.md)

> **Build note.** P3a–P3e are implemented and tested. The haggle is a single
> emergent ask per donor-concert (the player steps the target up/down; the donor
> accepts / counters / takes offense based purely on their stats) rather than a
> multi-round click loop. Reopening a closed door after offense currently just
> re-negotiates (no separate goodwill toll yet). Cross-season capacity drift is
> represented as a mild relationship nudge applied at commit, since the game is
> single-season for now; fuller multi-season donor evolution stays in P5.

P3 turns the P2 sponsorship engine (`src/sim/seasonFunding.ts`) into a played
loop: the player sees coverage build live while planning, **courts and asks**
donors with real strategic agency, commits the season, and the donor money then
**flows into the finance system** as concerts resolve.

The engine stays the deterministic baseline (the *auto-fill*). P3 layers
**player agency** (the ask) on top, wires the result into season state and cash,
and visualizes the whole picture.

---

## 1. The loop, moment to moment

1. **Found** the orchestra, draft all four programs (existing flow).
2. As you edit each program, the **auto-fill runs live**: `computeSeasonFunding`
   assigns each donor's *comfortable* pledge to the concerts they fit. The
   **gauge** and **per-concert coverage** update as a continuous feedback signal.
3. **The ask** — exert agency on top of the auto-fill via three levers
   (push / dedicate / restrict). This is where coverage gaps get closed and
   relationships get spent.
4. **Begin Season** folds in the commitment ("make the ask"). **Soft gate**: if
   any concert is underfunded, a red confirm — you may begin exposed and eat the
   loss ("fund it anyway because it's who you are").
5. As each concert **resolves**, that night's pledged donor money is **realized**
   (volatility-swung) and posted to cash, replacing the old per-concert tip.

## 2. State additions (`SeasonState`)

- **`funding`** — committed pledges per (donor, concert): pledged amount, the
  expected `low–high` band, whether the ask was *pushed* (and how far), and any
  *restriction* (the donor's bound priority axis). Persists so concerts resolve
  against the plan and **P4** breach logic can reference it.
- **Sway resources** (the "actions + goodwill" scarcity):
  - **Dedications** — a small pool (default **3**) of home-night tokens to spread
    across 5 donors / 4 concerts. A donor holds at most one; a concert can be
    dedicated to one donor.
  - **Goodwill budget** — a season pool (default **100 pts**) spent by *pushing*
    asks and by *reopening* a closed door. Represents finite cultivation
    bandwidth.
- Pledged money registers as **scheduled** finance inflows (reusing the existing
  scheduled-vs-posted model in `finance.ts` / `season.ts`) and **posts** when its
  concert resolves.

## 3. The ask — emergent negotiation (pure sim, testable)

Extends `seasonFunding.ts` with a negotiation layer. **Nothing is hardcoded** —
round count, whether a donor counters, and where they balk all emerge from stats.

For each (donor, concert):

- **comfortable** = engine `maxPledge` (the auto-fill amount).
- **ceiling** = `comfortable × stretch`, where `stretch` *emerges* from leverage:
  base ~1.1×, widened by **relationship/loyalty**, **program alignment**
  (`appetiteScore`), and a **dedication** on that night. A warm, aligned,
  dedicated donor reaches ~1.6×; a cold, misaligned one barely past 1.05×.
- **patience** is a per-donor budget from `relationship + loyalty − volatility`
  and alignment. Each push step drains it in proportion to how far past
  comfortable you reach.
- **Donor response is emergent**:
  - ask ≤ comfortable → **accepts**.
  - comfortable < ask ≤ ceiling, patience remaining → may **accept or counter**
    (a partial between comfortable and the ask). Counters come from cooperative
    donors — high loyalty/relationship; volatile donors just balk.
  - ask > ceiling, or patience exhausted → **takes offense**: pledge **recoils**
    to comfortable (or below), relationship dings, the **door closes** — but is
    **reopenable** later at a goodwill cost.
- Pushing past comfortable **widens the realized downside** (`expectedLow`
  drops): you squeezed more, but the money got nervous. The risk shows as the
  band.

### The three levers

1. **Push the ask** — per donor-concert, up to the emergent ceiling. Costs
   goodwill scaling with overreach; risks offense. (KCD-haggling-style.)
2. **Dedicate a concert** — scarce token; makes it the donor's home night → big
   stretch + patience boost. The main negotiating leverage.
3. **Restricted / named ask** — binds the gift to the donor's **own top
   priority** (auto). Appetite boost now; if a later reprogram drops that axis,
   it **breaks** → the hook for **P4** breach/withdrawal.

## 4. Finance wiring

- Realized donor money **replaces** the old 2.5%-tip
  `estimateDonorUpliftFromDonors` in concert resolution. A concert's donor income
  is the sum of its **realized** pledges.
- Pledges schedule as donor-support inflows; they post on their concert's
  resolution via the existing settlement sweep. Uncovered cost stays the
  player's exposure (paid from cash, surfaced in the ledger).

## 5. UI surfaces (on the plan-season screen)

- **Season funding gauge** (top): `SEASON COST vs PLEDGED` with the volatility
  band drawn in. Amber under 100%; red for a naked (0-coverage) concert.
- **Donor rail** — **season-totals first**: pledged-vs-capacity per donor; click
  to expand a donor's per-concert fits with **alignment bars** on their
  high-weight axes and a **fuzzy ceiling band that sharpens as relationship
  deepens**. The ask is run from here.
- **Season trail** — each concert node gets a **coverage fill** + **donor chips**
  (top ~3 by amount, "+N" overflow); underfunded nights glow red.
- **Begin Season** — soft gate with the exposed-nights confirm.

## 6. Cross-season feedback (mild)

Overdrawn / offended donors cool slightly and lose a little capacity next season;
comfortably-asked and dedicated donors warm and grow. A gentle "outgrow your
founders" loop — texture, not a punishing swing. (Fuller donor evolution is P5.)

## 7. Tunable defaults

These are starting points to balance against the real sim, not fixed:

| Knob | Default |
|---|---|
| Dedications per season | 3 |
| Goodwill budget per season | 100 pts |
| Stretch ceiling (max) | ~1.6× comfortable |
| Trail chips before overflow | 3 |
| Underfunded confirm threshold | any concert < 100% |

## 8. Build order (each slice shippable + tested)

- **P3a** — wire engine into game state; gauge + per-concert coverage band
  (read-only auto-fill).
- **P3b** — commit pledges at Begin Season (soft gate) + finance wiring (realized
  cash, replace the old tip).
- **P3c** — donor rail (alignment bars, fuzzy band).
- **P3d** — trail coverage fills + donor chips.
- **P3e** — the sway layer: dedications, restricted ask, the emergent haggle, and
  mild cross-season drift.

## 9. Open / deferred

- Numeric balancing of stretch, patience, and goodwill costs against the live sim.
- P4 consumes the stored restriction + pushed-ask state for breach/withdrawal.
- P5 owns operating (non-concert) funders and fuller donor evolution.
