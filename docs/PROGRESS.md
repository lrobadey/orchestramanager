# Progress Log

This file is the project handoff record for **Orchestra Manager**.

Agents must update it after each PR. Keep entries concise, factual, and self-contained. Do not include external coding-session links.

## Current Status

**Last updated:** 2026-05-16  
**Current milestone:** Milestone 0 — Opening Night Foundation  
**Current playable state:** Playable single-concert loop exists: select 3 works, forecast, run concert, view report, update institution.  
**Latest PR:** PR #3 — app foundation and Milestone 0 loop  
**Known blockers:** None currently recorded.  
**Current risks:** No `AGENTS.md` or progress log existed before this PR; future agents may have already made changes without standardized handoff notes.  
**Next recommended action:** Review Milestone 0 for formula balance, UX clarity, code quality, and whether it should be polished before starting Milestone 1.

## Log Entries

### 2026-05-16 — Add agent operating contract and progress log

**Primary milestone:** Project governance  
**Secondary milestone:** Milestone 0

**Summary**

Added `AGENTS.md` and this progress log to define how agents should work in the repo and how future PRs should record handoff information.

**Rationale**

The repo now has a playable Milestone 0 foundation. Before expanding into new systems, the project needs a concise operating contract so agents preserve scope control, milestone discipline, testing expectations, and separation between domain, simulation, and UI layers.

**Files changed**

- `AGENTS.md`
- `docs/PROGRESS.md`

**Tests run and results**

- Not run; documentation-only change.

**Known issues / risks**

- This progress log is being introduced after the first implementation PR, so earlier implementation details are represented only in commit messages and existing docs.
- No dedicated `docs/ARCHITECTURE.md` exists yet.

**Handoff note**

Future agents should update this file after each PR and keep entries self-contained. Do not rely on external session links for project memory.

**Next recommended action**

Review the current Milestone 0 implementation before starting Milestone 1. Focus on simulation balance, UX clarity, and whether tests cover the most fragile formulas.
