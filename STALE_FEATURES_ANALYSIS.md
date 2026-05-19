# Stale Features Analysis

**Date of Analysis:** May 19, 2026  
**Methodology:** Git commit history analysis across all TypeScript/TSX source files

---

## Summary

Analysis identified **6 completely stale features** (zero commits since creation) and **3 low-activity features** (1-2 commits only). These represent foundational work that was created but never iterated on despite being part of the active codebase.

---

## 🔴 Completely Stale Features (Zero Modifications)

### 1. **src/components/SeasonTimeline.tsx**
- **Created:** May 17, 2026 (Milestone 1: four-concert season loop)
- **Last Modified:** May 17, 2026 (same day)
- **Commits:** 1
- **LOC:** 32
- **Status:** Never touched after initial creation
- **Purpose:** Visual timeline component showing 4-concert season slots with status indicators (pending/active/resolved)
- **Analysis:** Simple display component with no subsequent improvements, bug fixes, or feature additions

### 2. **src/data/audienceSegments.ts**
- **Created:** May 16, 2026 (PR 2: Add domain types and seed data)
- **Last Modified:** May 16, 2026 (same day)
- **Commits:** 1
- **LOC:** 64
- **Status:** Never touched after initial creation
- **Purpose:** Seed data defining 5 audience segments (Seasoned Supporters, Cultural Explorers, Young Professionals, Students/Educators, Donors/Patrons) with loyalty, price sensitivity, and genre affinity scores
- **Analysis:** Static data file never updated despite active feature development around audience mechanics. Suggests either feature is complete or not prioritized for iteration

### 3. **src/data/institution.ts**
- **Created:** May 16, 2026 (PR 2: Add domain types and seed data)
- **Last Modified:** May 16, 2026 (same day)
- **Commits:** 1
- **LOC:** 15
- **Status:** Never touched after initial creation
- **Purpose:** Initial institutional state with cash, reputation metrics (artistic, audience trust, donor confidence, musician morale, technical quality), and identity dimensions
- **Analysis:** Critical seed data with only initial $180k cash and balanced baseline metrics. No calibration or rebalancing has occurred despite other systems being refined

### 4. **src/main.tsx**
- **Created:** May 16, 2026 (PR 1: Add Vite + React + TypeScript project scaffold)
- **Last Modified:** May 16, 2026 (same day)
- **Commits:** 1
- **LOC:** 10
- **Status:** Never touched after initial creation
- **Purpose:** Entry point that mounts React app to root DOM element
- **Analysis:** Minimal boilerplate file; expected to be largely static

### 5. **src/sim/applyConcertReport.ts**
- **Created:** May 16, 2026 (PR 4: Add concert resolver, report applier, and simulation tests)
- **Last Modified:** May 16, 2026 (same day)
- **Commits:** 1
- **LOC:** 22
- **Status:** Never touched after initial creation
- **Purpose:** Applies institutional delta mutations from concert reports to institution state (cash, reputation, trust, morale, quality, identity)
- **Analysis:** Core simulation function with no refinements despite active iteration on related systems (concert resolution, scoring, forecasting). Suggests the impact model may not be working correctly or is deprioritized

### 6. **src/sim/season.ts**
- **Created:** May 17, 2026 (Milestone 1: four-concert season loop)
- **Last Modified:** May 17, 2026 (same day)
- **Commits:** 1
- **LOC:** 110
- **Status:** Never touched after initial creation
- **Purpose:** Season state management with 4 concert slots (Opening Night, Winter Program, Spring Identity Concert, Season Finale), resolution logic, and summary computation
- **Analysis:** 110 LOC foundational module managing season lifecycle. No bug fixes or refinements despite being core to the UI loop

---

## 🟡 Low-Activity Features (1-2 Commits Only)

### 1. **src/components/AppShell.tsx**
- **Created:** May 16, 2026 (PR 5: Add playable UI loop)
- **Last Modified:** May 17, 2026 (Milestone 1: four-concert season loop)
- **Commits:** 2
- **LOC:** 25
- **Last Modification:** Minor structural addition during season loop milestone
- **Purpose:** Top-level app layout shell

### 2. **src/components/InstitutionMeters.tsx**
- **Created:** May 16, 2026 (PR 5: Add playable UI loop)
- **Last Modified:** May 17, 2026 (Fix three UI display bugs)
- **Commits:** 2
- **LOC:** 91
- **Last Modification:** One bug fix pass, then abandoned
- **Purpose:** Displays institutional metrics (cash, reputation, trust, morale, quality, identity axes) as visual meters

### 3. **src/components/SeasonSummaryPanel.tsx**
- **Created:** May 17, 2026 (Milestone 1: four-concert season loop)
- **Last Modified:** May 16, 2026 (Import ReactNode in SeasonSummaryPanel to fix tsc build) [Note: timestamp anomaly in git history]
- **Commits:** 2
- **LOC:** 139
- **Last Modification:** Single import fix, no subsequent iteration
- **Purpose:** Summary view of completed season concerts and results

---

## Key Observations

### Pattern 1: Seed Data Not Calibrated
**Files:** `src/data/institution.ts`, `src/data/audienceSegments.ts`

The game balance seed values were never revisited despite:
- Active development on scoring mechanics (`src/sim/scoring.ts` - 2 commits)
- Active development on forecasting (`src/sim/forecastProgram.ts` - 12+ commits)
- Addition of new features (familiarity scores, arc salience)

**Risk:** Initial values may be mis-calibrated and untuned for actual gameplay.

### Pattern 2: Core Simulation Functions Not Refined
**Files:** `src/sim/applyConcertReport.ts`, `src/sim/season.ts`

While higher-level systems were heavily iterated:
- Concert forecasting got 12+ commits
- Scoring got 2 commits with calibration work
- Program arc salience was added and fixed (5+ commits)

These foundational functions remain untouched, suggesting:
- They may not be fully integrated into active development
- Their impact model may not be driving observable behavior
- They could contain bugs that haven't surfaced in testing

### Pattern 3: UI Components Stabilized Early
**Files:** `src/components/SeasonTimeline.tsx`, `src/components/InstitutionMeters.tsx`, `src/components/SeasonSummaryPanel.tsx`

Season management UI was created but barely iterated:
- SeasonTimeline: 1 commit (display-only)
- InstitutionMeters: 2 commits (1 bug fix)
- SeasonSummaryPanel: 2 commits (1 import fix)

While other UI components got heavy investment:
- ProgramBuilder: 8+ commits (core feature)
- ConcertForecast: 5+ commits (active iteration)
- ConcertReport: 4+ commits (refinement)

**Possible reasons:**
- Season UI is considered "done" and not a priority
- Focus has shifted to program building and forecasting
- Season mechanics may need overhaul if playing the game reveals issues

---

## Recommendations

### High Priority
1. **Audit `src/sim/applyConcertReport.ts`** - Verify institutional delta application is working and data flows correctly through the system. Add console logging to confirm this function is being called and producing expected deltas.
2. **Calibrate seed data** - Run game sessions and verify starting values in `institution.ts` and `audienceSegments.ts` produce reasonable outcomes. Consider A/B testing different starting conditions.
3. **Test season loop** - Ensure `src/sim/season.ts` correctly advances slots, resolves concerts, and applies impacts across all 4 concerts without data loss.

### Medium Priority
4. **Review season UI** - Determine if SeasonTimeline/SeasonSummaryPanel are adequate or if more polish is needed based on user feedback.
5. **Add integration tests** - Create tests covering full season flow (create season → plan program → resolve concert → apply report → advance season) to catch issues in data flow between stale modules.

### Low Priority
6. **Monitor for future staleness** - As development continues, periodically check commit frequency on core simulation modules to ensure they're being tested and iterated.

---

## Technical Debt Summary

| Category | Count | Files |
|----------|-------|-------|
| Never modified | 6 | SeasonTimeline, audienceSegments, institution, main.tsx, applyConcertReport, season |
| 1-2 commits | 3 | AppShell, InstitutionMeters, SeasonSummaryPanel |
| **Total stale/low-activity** | **9/20** | **45% of source files** |

**45% of the active TypeScript/TSX codebase has received minimal iteration since initial creation.** This concentration in foundational systems suggests potential gaps in integration testing and gameplay validation.
