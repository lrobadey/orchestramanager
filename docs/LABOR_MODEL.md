# The Labor Model — Per-Service Musician Payroll

The other half of the economy. Before this system, the cost side of a concert was a flat
constant: the musicians were never paid, rehearsal cost a fixed $2,400, and a Mahler-scale
program cost the same as a chamber-scale one. Revenue was richly endogenous; cost was
exogenous. This module closes that loop: **artistic ambition now feeds back into financial
pressure**, which is the defining dynamic of a real orchestra.

Engine: [`src/sim/labor.ts`](../src/sim/labor.ts). Tests: `tests/labor.test.ts`,
`tests/seasonLoop.test.ts` (full-season integration).

## Structure

**Per-service freelance.** Every musician on stage is paid per service — each rehearsal hour
and the concert itself are paid work. There is no salaried core in this slice (an upstart
orchestra's realistic posture); a salaried-core option can layer on later.

**Forces.** Every work carries `forces` — players required per section, authored from the
score's actual instrumentation (winds = woodwinds; percussion folds in timpani, harps, and
keyboards; string counts at regional-orchestra scale). A program's stage headcount per
section is the **max across its works**.

**Rates** (constants in `labor.ts`, sized to freelance regional scale):

| Parameter | Value |
| --- | --- |
| Base scale | $150 / service |
| Service length | 2.5 hours |
| Principal premium | 1.5× (per the roster's principal chairs) |
| Extras premium | 1.25× (players beyond the core list) |
| Core list | strings 38 · winds 9 · brass 7 · percussion 2 (~56 players) |

**Payroll** = concert service (full program headcount × 1 service) + rehearsal payroll.
Rehearsal hours are priced **per work at that work's headcount**: hours allocated to the big
symphony cost real money, hours on the chamber-scale opener are cheap. So the rehearsal
allocation slider is a money-versus-risk decision even while the total pool stays fixed —
and the model is service-based so purchasable rehearsal services can bolt on later without
rework.

## Consequences for the world

- A mainstage night runs **~$100–130k all-in**, of which payroll is ~$85–100k — the dominant
  line, as in reality. The old $30k "base cost" shrank to $12k of true hall/front-of-house
  overhead.
- **Big forces cost more.** Late-romantic programs put 70+ players on stage and pull 8–15
  extras beyond the core list; Classical-era programs stay near 50 and inside it.
- **Earned income cannot cover costs** — a debut season's tickets cover a small fraction,
  so the donor/funding system pushes against a grounded number instead of a tuned one.
  Rebalanced to match: donor capacities ~2.7× ($150k–$320k), starting cash $350k (the
  founding gift ≈ three concerts of runway).
- The expense breakdown, concert reports, ledger transactions (`payroll-cost`, posted on
  concert day), and the funding model's per-concert "ask" all flow from the same payroll
  computation.

## Deliberately out of scope (this slice)

- Buying more/fewer rehearsal services (data shape is ready).
- Morale/loyalty coupling to pay or service load.
- Soloist and guest-artist fees; chorus costs (Beethoven 9's chorus is unpriced).
- Roster growth: the core list as a strategic lever.
