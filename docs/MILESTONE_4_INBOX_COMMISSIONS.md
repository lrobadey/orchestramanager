# Milestone 4: Inbox and Commissions

## Purpose

Milestone 4 adds institutional pressure through messages, proposals, and decisions.

The player should begin to feel that the orchestra is not just a spreadsheet. It is an organization full of people with priorities: composers, donors, board members, musicians, critics, and administrators.

The goal is to add structured narrative pressure without handing control of the simulation to LLM agents.

## Core Addition

A deterministic inbox and commission system.

The inbox should surface actionable institutional pressure:

- Board concerns.
- Donor reactions.
- Composer proposals.
- Critic signals.
- Musician morale issues.
- Administrative reminders.
- Audience feedback.

Commissions should become programmable game objects with risk, cost, deadline, difficulty, and identity value.

## Separation of What and How

### What Exists

Add domain concepts:

- `InboxMessage`
- `MessageThread`
- `InstitutionalDecision`
- `ComposerProfile`
- `CommissionProposal`
- `CommissionedWork`
- `RelationshipState`

### How It Behaves

Add simulation functions:

- `generateInboxForSeasonState()`
- `resolveInboxDecision()`
- `createCommissionProposal()`
- `acceptCommissionProposal()`
- `resolveCommissionDelivery()`
- `convertCommissionToWork()`

### How the Player Sees It

Add UI components:

- `InboxPanel`
- `MessageDetail`
- `DecisionPrompt`
- `ComposerCard`
- `CommissionProposalView`
- `CommissionStatusPanel`

## Inbox Philosophy

Inbox items should not be flavor-only.

Every major message should do at least one of the following:

- Explain a system state.
- Offer a decision.
- Warn about a risk.
- Create a future opportunity.
- Reflect consequences of prior choices.

The player should learn the institution through messages.

## Commissioning System

A commission should be a structured object.

Fields may include:

- Composer
- Fee
- Duration
- Instrumentation
- Deadline
- Difficulty
- Accessibility
- Prestige upside
- Identity value
- Rehearsal demand
- Delivery reliability
- Technical requirements
- Relationship impact

The first commission system can be deterministic and small.

Example flow:

```text
Composer sends proposal -> player accepts/rejects -> commission enters pipeline -> delivery resolves -> new work enters repertoire library
```

## Composer Profiles

Fictional composers should have mechanical and narrative profiles.

Fields may include:

- Name
- Style
- Reliability
- Prestige
- Accessibility
- Fee expectations
- Relationship status
- Preferred instrumentation
- Risk profile

Do not use real living composers in this milestone.

## LLM Agent Boundary

This milestone should be designed so LLM agents can be added later, but it should not require them.

The deterministic system owns:

- Proposal values.
- Costs.
- Deadlines.
- Work stats.
- Delivery outcomes.
- Relationship deltas.

A future LLM adapter may generate message prose, negotiation tone, and program notes, but it should produce data that the simulation validates.

## Message Types

Start with a small set:

- Board message
- Donor message
- Composer proposal
- Musician concern
- Critic preview
- Audience feedback
- Administrative alert

Each type should have clear rules for when it appears.

## UI Scope

Add an inbox panel that can be used inside the existing season loop.

Do not build a full email client.

Required UI:

- Message list.
- Message detail.
- Accept/reject/acknowledge decisions where relevant.
- Commission proposal view.
- Commission pipeline summary.

## Not in This Milestone

Do not add:

- Freeform chat.
- Real email integration.
- LLM negotiation.
- Generated scores.
- Large composer database.
- Complex contract language.
- Full board governance simulation.
- Full donor relationship CRM.

## Tests

Add tests for:

- Inbox generation responds to season state.
- Donor messages appear after relevant donor-confidence changes.
- Composer proposals create valid commission objects.
- Accepted commissions reduce cash or reserve budget.
- Delivered commissions become repertoire works.
- Rejected proposals do not mutate the repertoire.

## Completion Criteria

Milestone 4 is complete when:

- The season loop can produce institutionally relevant messages.
- The player can accept a commission proposal.
- A commissioned fictional work can enter the repertoire pool.
- Messages explain and pressure the simulation rather than floating above it.
- The system is ready for future LLM-generated prose without depending on it.
