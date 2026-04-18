# Events Page Code Review Cleanup

**tracker:** yaks  
**source:** docs/events-code-review-issues.md  
**date:** 2026-04-18

---

## Context

Code review of `feature/events-page` identified 7 open issues after Issue #4 (dead `getEventName` abstraction) was already fixed inline. Issues are grouped by severity: 3 Important (robustness/correctness), 4 Minor (polish/clarity). No Critical issues were found; the branch is safe to merge but these items are worth closing before it lands.

---

## Goal

Close all 7 open code review issues — fixing a timezone invariant documentation gap, dead code in EventsTeaser, missing test coverage for the empty state, redundant marketing copy, incorrect geo references in SEO copy, a single-threaded E2E server, and two undocumented reserved fields.

---

## Acceptance Criteria

- [ ] `EventSession` interface documents the required date string format (explicit offset, never UTC)
- [ ] `end` variable in `EventsTeaser` is only computed inside the single-day branch
- [ ] Empty state UI (`events.length === 0`) is covered by an automated test
- [ ] Default event description has no repeated phrases
- [ ] "Milwaukee WI" is removed from page.tsx metadata description and visible subtitle
- [ ] E2E static server uses a multi-threaded Node-based server instead of `python3 -m http.server`
- [ ] `image` and `instagramUrl` fields on `AugustJonesEvent` have inline comments documenting intent
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm test:e2e` passes (all 3 browsers)

---

## Files to Modify

| File | What Changes |
|------|-------------|
| `src/data/events.ts` | Document `EventSession` date format; add comments to `image`/`instagramUrl`; fix duplicate copy in `getEventDescription` |
| `src/components/EventsTeaser.tsx` | Move `end` variable inside single-day branch |
| `src/app/events/page.tsx` | Remove "Milwaukee WI" from metadata description and visible `<p>` |
| `playwright.config.ts` | Replace `python3 -m http.server` with `pnpm dlx serve` |

## Files to Create

| File | Purpose |
|------|---------|
| `src/data/event-source.empty.ts` | E2E fixture exporting empty `upcomingEvents` array and a fixed `now` |
| `e2e/events-empty-state.spec.ts` | Playwright test for empty state UI |

---

## Implementation Phases

### Phase 1 — Code & Copy Fixes (no-test)

**Goal:** Apply all mechanical fixes that don't require test infrastructure changes.

**Tasks:**
1. Add comment to `EventSession.startDate` and `EventSession.endDate` documenting required format: explicit UTC offset (e.g., `-05:00`), never `Z`
2. Add inline comments to `AugustJonesEvent.image` and `AugustJonesEvent.instagramUrl` documenting reserved intent
3. Fix `getEventDescription` — remove the redundant trailing sentence "Every piece is handmade and one-of-a-kind." from the default string
4. Move `const end = new Date(firstSession.endDate)` in `EventsTeaser` inside the single-day JSX branch
5. Remove "Milwaukee WI" from both the `metadata.description` string and the visible `<p>` subtitle in `src/app/events/page.tsx`

**Verification:**
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm lint` passes (Biome)
- [ ] Dev server shows events page still renders correctly in browser

#### Agent Context

```
Files to modify:
  src/data/events.ts (lines 1-17 interface, line 112-116 description)
  src/components/EventsTeaser.tsx (line 30)
  src/app/events/page.tsx (line 10 metadata, line 49 subtitle)

Test command: pnpm exec tsc --noEmit && pnpm lint

RED gate: N/A (no-test phase)
GREEN gate: tsc and Biome both exit 0; no runtime errors in browser

Constraints:
  - Do NOT add biome-ignore or @ts-ignore
  - Do NOT change the visible structure of any component, only the content of strings and placement of one variable
  - The EventSession comment should be on startDate and endDate fields, referencing EVENT_TIMEZONE
  - The EventsTeaser end variable must remain a const (not an inline expression) — just move its declaration inside the JSX branch so the intent is clear
```

---

### Phase 2 — E2E Server Upgrade (no-test)

**Goal:** Replace the single-threaded `python3 -m http.server` E2E static server with a multi-threaded Node-based server so parallel Playwright workers don't bottleneck.

**Tasks:**
1. Add `serve` as a dev dependency: `pnpm add -D serve`
2. Update `playwright.config.ts` webServer command: replace `python3 -m http.server 3001 --directory out` with `serve out --listen 3001`

**Verification:**
- [ ] `pnpm test:e2e` passes in all 3 browsers (chromium, firefox, webkit)
- [ ] `pnpm exec tsc --noEmit` passes

#### Agent Context

```
Files to modify:
  playwright.config.ts (line 75, webServer.command)
  package.json (add serve to devDependencies)

Test command: pnpm test:e2e

RED gate: N/A (no-test phase)
GREEN gate: All existing Playwright tests pass with the new server; tsc exits 0

Constraints:
  - The serve flags must preserve trailing-slash behavior matching Next.js static export (use --single flag if needed to avoid 404s on extensionless paths, but verify — next export already generates index.html files so --single may not be needed)
  - Keep reuseExistingServer: !process.env.CI behavior unchanged
  - Keep E2E_TEST=true pnpm build prefix on the command unchanged
```

---

### Phase 3 — Empty State Test Coverage (TDD)

**Goal:** Add automated test coverage for the empty state UI (`events.length === 0`) that currently has a `test.skip` placeholder with no replacement.

**Context on the existing fixture pattern:**
- `src/data/event-source.ts` — production source (real events)
- `src/data/event-source.e2e.ts` — E2E fixture with deterministic test events and a frozen `now = new Date("2099-06-15")`
- Turbopack alias in `next.config.ts` swaps `event-source` → `event-source.e2e` during E2E builds

**Approach:** Create a second fixture (`event-source.empty.ts`) exporting `upcomingEvents = []` and a second Playwright project that builds with this fixture aliased in. The empty-state test runs against this second static build. This is fully consistent with the existing E2E fixture pattern.

**Tasks:**

**TEST (write failing test first):**
- Create `src/data/event-source.empty.ts` exporting `upcomingEvents: AugustJonesEvent[] = []` and `now = new Date("2099-06-15T00:00:00-05:00")`
- Create `e2e/events-empty-state.spec.ts` testing:
  - "Check back soon" heading is visible
  - "Shop on Etsy" link is visible and points to the Etsy store
  - "Follow on Instagram" link is visible and points to the Instagram profile
  - The event cards section is absent
- Add a second Playwright project config (e.g., `empty-state`) that builds with the empty fixture alias and runs only `e2e/events-empty-state.spec.ts`

**IMPL (make tests pass):**
- Wire the second Playwright project: add a build variant command using the empty fixture, configure `testMatch` to target only the empty state spec
- Verify the existing skipped test can be removed or replaced with a reference to the new spec

**Verification:**
- [ ] `pnpm test:e2e` runs and the new empty-state tests pass in all configured browsers
- [ ] The `test.skip` block at `e2e/events.spec.ts:263` is removed
- [ ] Existing non-empty events tests still pass

#### Agent Context

```
Files to create:
  src/data/event-source.empty.ts
  e2e/events-empty-state.spec.ts

Files to modify:
  playwright.config.ts (add second project for empty-state build)
  next.config.ts (add second alias entry or use env var to select fixture)
  e2e/events.spec.ts (remove test.skip block at line 263)

Test command: pnpm test:e2e

RED gate: e2e/events-empty-state.spec.ts exists and tests FAIL (empty fixture not yet wired)
GREEN gate: All tests in e2e/events-empty-state.spec.ts pass; existing events tests unaffected

Constraints:
  - Do NOT add Vitest or React Testing Library — keep the test stack Playwright-only
  - Do NOT modify existing event-source.e2e.ts
  - The empty fixture must use the same AugustJonesEvent type from src/data/events.ts
  - Follow the existing Playwright fixture alias pattern exactly (see next.config.ts and event-source.e2e.ts for reference)
  - Tests must pass in chromium, firefox, and webkit
  - Respect all webkit-specific quirks documented in project memory (sendBeacon, mailto handling)
```

---

## Constraints & Considerations

- No new test frameworks — Playwright only
- No `biome-ignore` or `@ts-ignore` suppressions
- No linter rule changes
- All three browser targets (chromium, firefox, webkit) must stay green
- Phase 1 is purely mechanical and can be done in a single commit
- Phase 2 should be verified with a full `pnpm test:e2e` run before moving on
- Phase 3 is the only phase that requires TDD discipline — write the test file before wiring the fixture

## Out of Scope

- Implementing the `image` field (OG image override per event) — just document it
- Implementing the `instagramUrl` field — just document it
- Adding Milwaukee events — just remove the reference from copy
- Adding Zod/runtime validation for date string format — comment-only fix for now
