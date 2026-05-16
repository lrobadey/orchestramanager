# Orchestra Manager

**Orchestra Manager** is a hardcore granular management simulation about building an upstart orchestra in Seattle and trying to turn it into a serious artistic institution.

The player is an Artistic Director / CEO hybrid: responsible for programming, hiring, budgets, institutional identity, rehearsal allocation, audience development, donor confidence, press perception, and long-term artistic reputation.

This is not a simplified music-themed tycoon game. The target is closer to **Football Manager**, **F1 Manager**, and **Victoria 3**: dense systems, explicit tradeoffs, lots of institutional texture, and a willingness to make the player think like an administrator, programmer, strategist, and artistic leader at the same time.

## Core Fantasy

Build an orchestra with a point of view.

You are not merely choosing repertoire. You are shaping an institution under pressure. Every season forces tradeoffs between money, artistic ambition, audience trust, musician capacity, donor comfort, press narrative, and institutional identity.

A safe Beethoven program may sell tickets and reassure donors, but it may not help the orchestra become distinctive. A new commission may build artistic credibility, but it can strain rehearsal time, confuse subscribers, and create financial risk. A brilliant principal horn may make dangerous repertoire viable. An overextended section may turn an ambitious season into a public failure.

The game is about the system behind the concert.

## Design Metaphor: The Score Is the Track

In F1, every circuit stresses cars and drivers differently. One track rewards straight-line speed. Another punishes tire degradation. Another exposes driver inconsistency.

In Orchestra Manager, every score is a track.

Each work stresses the institution in different ways: strings, winds, brass, percussion, chorus logistics, soloists, rehearsal time, endurance, intonation, rhythm, audience familiarity, critic interest, donor comfort, venue fit, and marketing difficulty.

Programming is therefore not a taste menu. It is strategic risk design.

## Initial MVP

The first playable slice is **one debut season** for a new upstart orchestra in Seattle.

The MVP should focus on a four-concert season:

1. Plan the season.
2. Choose programs from a limited repertoire pool.
3. Hire or rely on a starting roster of musicians and section leaders.
4. Allocate rehearsal time, marketing effort, and budget.
5. Run each concert as a simulated outcome.
6. Read detailed reports on attendance, finances, performance quality, morale, reviews, and identity drift.
7. Survive the season while defining what kind of orchestra this is becoming.

The MVP should be narrow, but not shallow. It should already contain the core feedback loop between programming choices and the orchestra’s ability to execute those choices.

## Repertoire Approach

The MVP should use:

- Real public-domain canon where appropriate.
- Fictional living composers and fictional new commissions.
- Fictional rival institutions modeled on real institutional types.

The goal is to capture real orchestra-world dynamics without depending on real contemporary composers, real rival institutions, or real-world commentary as core data.

## Long-Term Agent Vision

LLM/agentic characters are central to the long-term vision, but the MVP can begin with deterministic stand-ins.

Future agentic roles could include:

- Living composers negotiating commissions.
- Guest soloists and conductors.
- Board members.
- Donors.
- Critics.
- Section leaders.
- Administrators.
- Rival artistic directors.

The deterministic simulation should own the actual state: money, dates, contracts, rehearsal time, musician attributes, performance outcomes, audience response, and reputation changes. Agents should provide negotiation, personality, emails, proposals, reviews, demands, and narrative texture without directly bypassing the simulation rules.

## Not in the MVP

The first version should not include:

- Full career mode.
- Real-time concert visualization.
- Generated audio.
- A full union contract model.
- A global orchestra market.
- Hundreds of composers or works.
- Fully simulated rival seasons.
- Deep venue operations.
- Complete education/outreach systems.
- A detailed grant-writing simulator.
- LLM agents as required infrastructure.

Those may become future systems. The MVP should prove the season-planning and concert-resolution loop first.

## Documentation

See [`docs/GAME_SPEC.md`](docs/GAME_SPEC.md) for the current design spec and MVP shape.
