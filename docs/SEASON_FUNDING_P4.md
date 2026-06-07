# Season Funding — P4: Mutation Consequences (Breach → Withdrawal)

Status: **Specced** · Branch: `season-funding-redesign` · Parents: [`SEASON_FUNDING_MODEL.md`](./SEASON_FUNDING_MODEL.md), [`SEASON_FUNDING_P3.md`](./SEASON_FUNDING_P3.md)

P4 closes the loop between **the ask** and **a mutable plan**. A committed pledge
is collateral on the program the donor was shown. P4 lets the player change an
upcoming concert mid-season — and makes aligned donors **withdraw** when the
change drops them below their line.

---

## 1. The crux it resolves

P1/P3 lock the whole season at Begin Season (`setProgram` is inert once
`seasonStarted`). For breach to mean anything there must be a **mutation surface
after pledges are committed**. P4 reopens **upcoming, not-yet-resolved concerts**
for editing — the season becomes a living thing you can steer, at a price.
Resolved concerts are history and stay frozen.

## 2. The loop (draft → preview → confirm)

1. Mid-season, open an upcoming concert's program (the Programme screen, now
   editable for pending slots).
2. **Draft freely** — drag works in/out, change price / marketing / rehearsal.
   Nothing breaches while you explore; alignment bars show a **live ⚠ preview**
   of who *would* withdraw and how much.
3. **Confirm** — withdrawals bite *only here*. Cancel reverts to the committed
   program with no consequence. (Per the design call: it bites when a change is
   confirmed, not while dragging to see what happens.)

## 3. What can change, and when

- **Editable concerts:** any slot not yet resolved (`status === 'pending'`),
  including the next one up.
- **Editable fields:** the **full program** — works *and* the financial dials
  (ticket price, marketing, rehearsal). Alignment is re-scored holistically, so
  cheapening a prestige donor's night or pulling its marketing can breach too,
  not just repertoire.

## 4. Breach model (reuses the quadratic curve)

For each donor holding a committed pledge on the edited concert, compare their
fit under the **committed** program vs the **new** one:

- `alignmentDrop = max(0, committedAppetite − newAppetite)` (for a restricted
  ask, the drop in the *bound axis* specifically counts hardest).
- **Protection band:** a commitment/loyalty-scaled tolerance (the existing
  `protectionThreshold` shape). Minor edits inside the band are **forgiven** —
  loyal, committed donors absorb more before reacting.
- **Breach** = `alignmentDrop − protectionBand`. Withdrawal fraction is
  **quadratic** in breach (`breach²`-shaped), scaled up for restricted asks.
  Reuses the curve already in `computeCommitmentDelta`.
- **All aligned donors** are sensitive (not just restricted); restricted asks
  simply react steepest.

## 5. Withdrawal & aftermath

On confirm, for each breaching donor:
- **Money hits cash.** Their committed pledge on that night is reduced by the
  withdrawal; coverage on the gauge/trail drops immediately, and the smaller
  pledge means less donor income flows when the concert resolves. A covered
  night can go **naked**. (Already-posted money from resolved concerts is never
  clawed back.)
- **Relationship cools.** Withdrawal dings the donor's relationship/loyalty
  (feeds the long-arc drift) and a severe breach can **close their door** for
  the rest of the season — betrayal has a memory.
- **No patching the hole.** You cannot re-court another donor to cover the
  newly-exposed night. The exposure you create is yours to live with — the
  integrity-vs-money tension made permanent.

## 6. UI

- **Programme screen, in-season:** pending concerts gain an editable draft mode
  (drag + dials) with **Confirm change** / **Cancel** actions. Resolved concerts
  stay read-only.
- **Live breach preview:** the donor alignment bars (from P3c) flag ⚠ on the
  donors a draft would push past their line, with the projected pull.
- **Confirm dialog:** names each donor who will withdraw, the dollars lost, and
  the night's new coverage — the same warn-and-confirm pattern as the
  underfunded Begin-Season gate. Full information before you commit.

## 7. State changes

- `draftPrograms[idx]` for a pending `idx` becomes editable mid-season through a
  dedicated path (not the inert founding `setProgram`), with a **draft vs
  committed** distinction so Cancel can revert.
- `season.funding` (committed) is **mutated on confirm**: the edited concert's
  pledges are re-scored and reduced by withdrawals; per-donor
  `relationshipDelta`/`doorClosed` update; `season.donors` cool accordingly.
- Concert resolution already reads donor income from the committed pledges
  (P3b), so reduced pledges flow to cash with no further wiring.

## 8. Tunable defaults

| Knob | Default |
|---|---|
| Protection band base | commitment-scaled (reuse `protectionThreshold`) |
| Restricted-ask breach multiplier | ~2× |
| Door-close threshold | withdrawal fraction ≳ 0.6 |
| Relationship cooling | scales with withdrawal fraction (mild) |

## 9. Build order (each slice shippable + tested)

- **P4a** — reopen pending concerts for mid-season draft editing (draft/confirm/
  cancel); coverage re-scores on confirm, no breach yet.
- **P4b** — breach engine: `computeWithdrawal` (pure, tested) comparing committed
  vs new fit with the quadratic curve + protection band.
- **P4c** — apply withdrawals on confirm: reduce committed pledges, cool donors,
  close doors; cash/coverage reflect it.
- **P4d** — warning UI: live ⚠ on alignment bars while drafting + the confirm
  dialog naming withdrawals and new coverage.

## 10. Open / deferred

- Numeric balancing of protection band, restricted multiplier, and cooling.
- Whether a breach can also shake *other* concerts' confidence in you (currently
  scoped to the edited night only).
- Multi-season memory of betrayal stays with P5 donor evolution.
