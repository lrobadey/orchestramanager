# Milestone 3: Audience and Finance Systems

## Purpose

Milestone 3 makes the institution economically and socially legible.

The player should start thinking not only about whether a program is good, but who it reaches, what it costs, what it earns, and how different constituencies respond.

The goal is to deepen the concert loop without turning the project into a full accounting simulator.

## Core Addition

Replace simple attendance and cash deltas with richer audience and finance models.

The concert outcome should begin to answer:

- Who bought tickets?
- Who came back?
- Which segments were alienated or activated?
- What revenue did the concert generate?
- What did it actually cost?
- Did donors like the direction?
- Is the institution becoming financially stable or artistically expensive?

## Separation of What and How

### What Exists

Add or deepen domain concepts:

- `AudienceSegment`
- `AudienceResponse`
- `TicketModel`
- `ConcertFinancials`
- `RevenueBreakdown`
- `ExpenseBreakdown`
- `DonorResponse`
- `SeasonFinancialSummary`

### How It Behaves

Add simulation functions:

- `calculateAudienceDemand()`
- `calculateTicketRevenue()`
- `calculateConcertExpenses()`
- `calculateDonorResponse()`
- `calculateAudienceTrustDelta()`
- `summarizeSeasonFinancials()`

### How the Player Sees It

Add UI components:

- `AudienceBreakdownPanel`
- `FinancialBreakdownPanel`
- `TicketDemandForecast`
- `DonorResponsePanel`
- `SeasonFinanceSummary`

## Audience Segments

The audience should not be a single number.

Start with five segments:

- Seasoned Supporters
- Cultural Explorers
- Young Professionals
- Students & Educators
- Donors / Major Patrons

Each segment should have preferences and sensitivities:

- Price sensitivity
- Canon affinity
- Contemporary affinity
- Crossover affinity
- Prestige affinity
- Community affinity
- Loyalty
- Growth potential

## Ticketing Model

The first ticketing model should be simple.

Inputs:

- Base hall capacity
- Ticket price
- Marketing spend
- Work audience draw
- Segment affinity
- Institution audience trust
- Rival pressure placeholder if needed

Outputs:

- Projected attendance
- Actual attendance
- Segment breakdown
- Ticket revenue
- First-time buyer estimate
- Return audience estimate

Avoid seat maps, dynamic pricing, subscription packages, and complicated channel attribution for now.

## Financial Model

Concert financials should include a few broad categories.

Revenue:

- Ticket sales
- Donor uplift
- Sponsorship placeholder

Expenses:

- Base concert cost
- Rehearsal cost
- Marketing spend
- Repertoire production cost
- Guest artist placeholder
- Commission placeholder if relevant later

The goal is not accounting precision. The goal is strategic pressure.

## Donor Response

Donors should respond to both finances and programming.

Donor response can depend on:

- Donor comfort of works
- Prestige value
- Net financial result
- Audience turnout
- Institutional stability
- Risk level

A donor-friendly concert may not be artistically distinctive. A risky contemporary program may build identity but reduce donor confidence if poorly framed.

## Reports

Concert reports should now include:

- Segment attendance.
- Ticket revenue.
- Expense breakdown.
- Net result.
- Donor response.
- Audience trust delta.
- Financial notes.

Season summary should include:

- Total attendance.
- Average capacity.
- Total revenue.
- Total expenses.
- Net result.
- Best and worst audience segment performance.
- Financial risk flags.

## UI Scope

This milestone may introduce Finance and Audience panels, but only where they support the season loop.

Avoid building full beautiful standalone tabs unless the underlying systems are already active.

## Not in This Milestone

Do not add:

- Full subscription management.
- CRM/database simulation.
- Real donor profiles.
- Grant writing.
- Endowment modeling.
- Dynamic pricing engine.
- Detailed chart of accounts.
- Full fundraising campaign operations.

## Tests

Add tests for:

- Higher ticket prices reduce demand for price-sensitive segments.
- Higher marketing spend increases demand within a cap.
- Contemporary affinity affects segment response to new works.
- Concert expenses include rehearsal and marketing costs.
- Donor response changes with donor comfort and financial result.
- Season summary aggregates concert financials correctly.

## Completion Criteria

Milestone 3 is complete when:

- Concert reports include audience and financial breakdowns.
- Different audience segments respond differently to repertoire.
- Ticket price and marketing spend matter.
- Donor confidence is no longer a generic meter change.
- The player can see why a concert succeeded artistically but failed financially, or the reverse.
