# Orchestra Manager Game Spec

## One-Sentence Pitch

**Orchestra Manager** is a hardcore orchestral administration simulation where the player builds a new upstart orchestra in Seattle by planning seasons, shaping artistic identity, managing musicians, balancing finances, and navigating the institutional consequences of every program.

## Positioning

The target is a dense management game in the lineage of Football Manager, F1 Manager, and Victoria 3.

The game should be detailed from the beginning. It should not hide the fact that orchestral administration is full of spreadsheets, personnel constraints, budget tradeoffs, audience segmentation, donor psychology, rehearsal logistics, and artistic risk. The fantasy is not simplification. The fantasy is competence inside a complex institution.

## Player Role

The player is an **Artistic Director / CEO hybrid**.

They control:

- Season planning.
- Repertoire selection.
- Concert programming.
- Guest artist and composer relationships.
- Roster development.
- Hiring priorities.
- Rehearsal allocation.
- Budget tradeoffs.
- Marketing emphasis.
- Institutional positioning.
- Long-term identity.

This is not meant to model one real-world job title exactly. It is a game role that combines the levers needed to make the institutional simulation playable.

## Starting Scenario

The MVP starts in **Seattle**.

The player leads a new upstart orchestra trying to establish itself inside an already crowded musical ecosystem. The orchestra does not begin as a major institution. It must define why it exists.

The player is not competing with real named institutions in the MVP. Instead, the game uses fictional rivals based on real institutional types:

- Major symphony orchestra.
- New-music ensemble.
- University orchestra.
- Chamber presenter.
- Film/game concert producer.
- Regional community orchestra.

These rivals create market pressure, audience competition, artistic comparison, and strategic whitespace without requiring direct simulation of real organizations.

## Core Design Metaphor: The Score Is the Track

In F1 Manager, the calendar matters because every track stresses different car and driver attributes. A car that thrives on one circuit may struggle on another.

Orchestra Manager should treat repertoire the same way.

Each score has a demand profile. It stresses different parts of the institution:

- String difficulty.
- Wind difficulty.
- Brass exposure.
- Percussion complexity.
- Chorus logistics.
- Soloist requirements.
- Endurance demands.
- Intonation risk.
- Rhythmic precision.
- Rehearsal load.
- Part-preparation burden.
- Venue suitability.
- Audience familiarity.
- Critic interest.
- Donor comfort.
- Marketing difficulty.
- Identity value.

A program is therefore a strategic construction. The player is effectively designing the institutional equivalent of a race calendar: what risks to take, when to take them, and whether the organization is built to survive them.

## Core Loop

The MVP loop is a four-concert debut season.

1. Review institutional state.
2. Plan the season arc.
3. Build each concert program.
4. Choose venues, guest artists, rehearsal allocation, marketing emphasis, and budget priorities.
5. Run the concert simulation.
6. Read outcome reports.
7. Absorb changes to finances, audience trust, musician morale, press reputation, donor confidence, and institutional identity.
8. Adjust the next concert or future season strategy.

The key design principle: every artistic choice should have institutional consequences.

## MVP Scope

The first playable MVP should include:

- One city: Seattle.
- One player institution: a new upstart orchestra.
- One season: four mainstage concerts.
- A limited repertoire pool.
- Real public-domain canon where useful.
- Fictional living composers and fictional commissions.
- A starting musician roster with section leaders.
- Musician attributes.
- Concert program builder.
- Rehearsal allocation.
- Basic budget and ticketing.
- Audience segments.
- Concert outcome reports.
- Institutional identity drift.
- Fictional rival ecosystem summaries.

The MVP should be narrow, but the systems inside that narrow frame should already feel granular.

## Non-Goals for MVP

The MVP should not include:

- Full multi-decade career mode.
- Real-time concert visualization.
- Generated music or audio playback.
- Full labor/union negotiation systems.
- Hundreds of works.
- Hundreds of musicians.
- Full rival institution simulation.
- Real named living composers.
- Real named rival orchestras.
- Full education/outreach pipeline.
- Detailed venue operations.
- Grant application writing.
- Required LLM agent infrastructure.

The first version should prove that planning and resolving a season is compelling.

## Institutional Resources

The game should track multiple institutional resources that do not always move together.

Core resources:

- Cash.
- Artistic reputation.
- Audience trust.
- Donor confidence.
- Musician morale.
- Technical quality.
- Administrative capacity.
- Press narrative.
- Community relevance.
- Risk appetite.
- Institutional identity.

The game is interesting because these values conflict.

A financially successful program may be artistically conservative. A critically important commission may sell poorly. A musician-favorite program may strain the budget. A donor-friendly gala may weaken the institution’s emerging identity.

## Audience Segments

The audience should not be one generic number.

Potential audience segments:

- Core subscribers.
- Traditional canon audience.
- Donors and gala audience.
- New-music audience.
- Younger culture-seekers.
- Students.
- Crossover / game / film music audience.
- Local community audience.
- Industry insiders.
- Critics.

Each segment should respond differently to repertoire, pricing, venue, marketing, artist reputation, and institutional identity.

## Roster and Musician Simulation

The orchestra should have a roster with named section leaders and simplified section pools.

Musicians should have attributes such as:

- Intonation.
- Rhythm.
- Sight-reading.
- Endurance.
- Tone.
- Blend.
- Solo reliability.
- Leadership.
- Rehearsal efficiency.
- Morale effect.
- New-music fluency.
- Classical-style fluency.
- Romantic-style fluency.
- Contemporary technique comfort.
- Stress resistance.

Section leaders should matter. A principal player can make a repertoire choice viable or risky.

Example: a strong principal horn with high solo reliability and stress resistance makes exposed horn repertoire less dangerous. A brilliant but inconsistent principal may create memorable highs and public failures.

## Repertoire Model

Every work should have a profile.

Possible fields:

- Title.
- Composer.
- Duration.
- Era / style.
- Instrumentation.
- Required forces.
- Public-domain status.
- Audience familiarity.
- Artistic prestige.
- Novelty.
- Rehearsal demand.
- Section-specific demands.
- Solo exposure.
- Endurance profile.
- Marketing difficulty.
- Donor comfort.
- Critic interest.
- Identity value.

Example public-domain repertoire categories:

- Safe canon.
- Prestige canon.
- Technically dangerous canon.
- Underplayed canon.
- Short overtures.
- Major symphonies.
- Concertos.
- Chorus-heavy works.

Fictional contemporary categories:

- Accessible opener.
- High-risk commission.
- Electronics/hybrid work.
- Local composer feature.
- Experimental prestige work.
- Audience-friendly crossover piece.

## Programming Strategy

Concert programs should be strategic portfolios.

A program might combine:

- A safe anchor work.
- A risky commission.
- A guest soloist vehicle.
- A thematic opener.
- A community-facing work.
- A critic-bait prestige choice.

The player should see forecasts before committing: projected attendance, rehearsal risk, donor response, audience segment interest, musician excitement, and press interest.

Forecasts should be imperfect. The player should learn the system over time.

## Concert Resolution

A concert outcome should include:

- Attendance.
- Ticket revenue.
- Expense report.
- Net result.
- Audience segment response.
- Performance quality.
- Section-level execution.
- Notable mistakes or successes.
- Musician morale change.
- Donor response.
- Critic response.
- Reputation changes.
- Identity drift.

The simulation should be able to produce specific institutional stories:

- Brass cracked under pressure.
- Strings carried the concert.
- The commission was under-rehearsed but praised by critics.
- The Beethoven sold well but did little to distinguish the orchestra.
- The audience loved the soloist but ignored the opener.
- The board is happy with revenue but nervous about risk.

## Commissioning System

The long-term game should support commissioning new works.

In the MVP, this can begin with fictional composer profiles and deterministic commission objects. Later, LLM agents can negotiate and generate emails, proposals, program notes, and revisions.

A commission should include:

- Composer.
- Fee.
- Duration.
- Deadline.
- Instrumentation.
- Difficulty.
- Accessibility.
- Prestige upside.
- Delivery reliability.
- Rehearsal demand.
- Technical requirements.
- Relationship impact.

The player should be able to use commissions to shape institutional identity, but commissions should carry real risk.

## Rival Ecosystem

Rival institutions should create context.

The MVP does not need full rival simulations. It can use simplified institutional profiles and seasonal market signals.

Examples:

- The major symphony dominates standard canon and celebrity soloists.
- A new-music ensemble owns avant-garde credibility.
- A film/game concert producer captures crossover audiences.
- A university orchestra creates low-cost local competition.
- A chamber presenter attracts adventurous audiences.

The player should be able to identify strategic whitespace: areas where the new orchestra can become distinctive instead of directly competing with a stronger incumbent.

## LLM / Agentic Character Vision

LLM agents are a core future feature, but they should not own the simulation state.

Agentic characters may include:

- Composers.
- Soloists.
- Conductors.
- Donors.
- Board members.
- Critics.
- Musicians.
- Administrators.
- Rival leaders.

Agents should communicate through emails, memos, proposals, reviews, negotiations, and complaints. They should express personality, taste, preference, and pressure.

The deterministic simulation should remain authoritative over:

- Budget.
- Contracts.
- Dates.
- Work profiles.
- Rehearsal time.
- Roster attributes.
- Concert outcomes.
- Reputation movement.
- Audience response.
- Morale changes.

Agent output should be interpreted into validated game objects rather than directly mutating the world.

## Design Tone

The tone should be serious, systems-focused, and dry.

The game can contain the absurdity of arts administration, but the documentation should present the project as a real simulation design, not a joke. The humor should emerge from the specificity of the systems: donor politics, rehearsal disasters, impossible programming tradeoffs, late commissions, board pressure, ticketing surprises, and review narratives.

## Success Criteria for the First Slice

The first slice succeeds if a player can complete a four-concert season and feel that:

- Their programming choices mattered.
- The orchestra had real strengths and weaknesses.
- The audience was segmented and reactive.
- Financial and artistic goals conflicted.
- The institution developed an identity through repeated choices.
- Concert reports explained outcomes in specific, believable terms.
- The player wants to try a different season strategy.

The first slice does not need breadth. It needs a complete institutional feedback loop.
