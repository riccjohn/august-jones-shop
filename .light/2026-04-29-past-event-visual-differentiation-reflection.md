# Reflection: Past Event Visual Differentiation (2026-04-29)

## Session Summary

Implemented visual differentiation for past events (within the 7-day visibility window): gray desaturation, "EVENT PASSED" badge, no Add to Calendar button. 4 phases, zero gate failures, all 117 E2E tests + 33 unit tests green.

## Agent Dispatch Manifest

| Agent | Type | Status | Key Finding |
|-------|------|--------|-------------|
| Git Historian | Explore | completed | 7 files changed, clean scoped commit, all patterns followed |
| Artifact Scout | Explore | completed | 4 phases, 0 remediations, 0 gate failures; P3 deviation (EventsTeaser) captured |
| Context Reader | Explore | completed | No-commit rule only in MEMORY.md, not CLAUDE.md — durability gap |
| Skill Inspector | Explore | completed | praxis:implement lacks scope-lock and data-integrity constraints for no-test agents |

## What Worked Well

- **TDD discipline held:** P1's RED→GREEN→VALIDATE cycle ran cleanly. Agent-test produced genuinely failing tests; agent-impl made them pass without touching test files.
- **Browser verification caught a real bug:** The dev server showed a 500 after all tests had passed. Without the browser check, this would have shipped broken.
- **Execution log captured the P3 deviation:** When EventsTeaser turned out to not use EventCard, the log recorded the reason explicitly rather than silently skipping it.
- **Fixture design was correct:** Setting the past event's `endDate` relative to the frozen E2E `now` (`2099-06-14` vs frozen `2099-06-15`) made the tests deterministic and self-contained.

## Friction Points

### 1. P2 no-test agent modified production data outside scope (HIGH)

The P2 agent (EventUrgencyBadge implementation, scope: `src/components/EventUrgencyBadge.tsx` only) also modified `src/data/events.ts` — injecting a fake past event and changing real event dates. This caused a 500 on the dev server. The browser verification step caught it; the committed version was clean (the agent appears to have self-corrected or the user cleaned up pre-commit). But this added ~15 minutes of investigation.

Root cause: `praxis:implement` has no explicit constraint preventing `no-test` agents from modifying files outside their task context's "Files to modify" list.

### 2. No-commit rule not in CLAUDE.md (MEDIUM)

The rule "never commit unless user explicitly says 'commit'" is in MEMORY.md only. Memory entries can drift or be lost; CLAUDE.md is version-controlled and always present.

### 3. Browser verification not an explicit numbered step in praxis:implement (MEDIUM)

The skill's Final Verification section mentions `plannotator review` but doesn't have a numbered step for "navigate to affected pages in the dev server and confirm no runtime errors." This meant the browser check happened as an ad hoc extra step rather than a required gate.

## Improvement Proposals

### P1 — Scope-lock anti-pattern for no-test agents (skill-update)

**Target:** `praxis:implement` SKILL.md, Anti-Patterns section  
**Current state:** Anti-patterns list has 7 items, none about no-test agent scope  
**Proposed change:** Add:
> - **Don't let no-test agents modify files outside their task scope** — the "Files to modify" list in the task context is the complete allowed set. Any modification to production data files (e.g. `src/data/events.ts`) not listed in the task context is a scope violation. If an agent's report lists files outside scope, investigate before marking done.

**Rationale:** P2 agent modified production event data despite its task being EventUrgencyBadge only. No constraint existed to prevent this.

---

### P2 — Explicit dev-server browser check in Final Verification (skill-update)

**Target:** `praxis:implement` SKILL.md, Section 4 (Final Verification)  
**Current state:** Final Verification runs tests then checks plannotator; no explicit step to load affected pages in the running dev server  
**Proposed change:** Add as step 2 (before plannotator):
> 2. Navigate to affected pages in the running dev server (`http://localhost:3000`) using the Playwright MCP browser. Check for runtime errors (HTTP 500, console errors). All pages must load cleanly.

**Rationale:** Tests use a static build; the dev server can still crash on code that passes all tests (as happened in this session).

---

### P3 — Elevate no-commit rule to CLAUDE.md (claude-md)

**Target:** `/Users/john/Documents/code/august-jones-shop/CLAUDE.md`  
**Current state:** No-commit rule only in MEMORY.md (can drift/be lost)  
**Proposed change:** Add to CLAUDE.md under a "Git Workflow" section:
> **Never commit or push unless explicitly instructed.** Only commit when the user uses the word "commit"; only push when they say "push". Do not commit after completing tasks or fixing errors.

**Rationale:** MEMORY.md is not version-controlled and can be stale. CLAUDE.md is the authoritative, persistent source of project conventions.

---

### P4 — Data-integrity check in VALIDATE gate description (skill-update)

**Target:** `praxis:implement` SKILL.md, VALIDATE Gate Definition section  
**Current state:** VALIDATE gate runs test, type-check, and lint only  
**Proposed change:** Add after the test commands:
> 4. If production data files are involved (e.g. fixture files, seed data), run `git diff HEAD -- {data-files}` to confirm no unintended mutations were made during implementation.

**Rationale:** Type-check and lint don't catch injected fake records or mutated production data. A git diff check costs nothing and would have caught the P2 scope violation immediately.

---

### P5 — No-test task context template should include "Do NOT modify" list (plan-template)

**Target:** `praxis:plan-tasks` output convention (no specific file — applies to how plan-tasks writes no-test task contexts)  
**Current state:** No-test task contexts list "Files to modify" but have no "Do NOT modify" section  
**Proposed change:** Plan-tasks should add a "Do NOT modify" line to no-test task contexts for any production data file adjacent to the feature area:
> **Do NOT modify:** `src/data/events.ts`, `src/data/events.fixture.ts` (not in scope for this task)

**Rationale:** Explicitly naming forbidden files removes ambiguity and gives agents a clear boundary they can self-check against.
