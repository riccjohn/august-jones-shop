# Session: events-dynamic-date
Date: 2026-04-18
Branch: feature/events-dynamic-date

---

## Research Summary

See `.light/sessions/events-dynamic-date-research.md` for full research notes.

Key finding: `output: "export"` (fully static) means SSR/force-dynamic is not available. The correct fix is minimal client components that read `new Date()` post-hydration via `useEffect`.

---

## Plan Summary

See `.light/sessions/events-dynamic-date-plan.md` for full plan.

**Root problem:** `event-source.ts` exported `const now = new Date()` at build time. TODAY/TOMORROW badges froze at deploy time. Event list filtering also used the build-time date.

**Approach (Option A):** Three minimal client components, no architectural change:
1. `EventUrgencyBadge` — reads `new Date()` in `useEffect`, renders badge after hydration
2. `EventListClient` — receives all events, re-filters on mount with `new Date()`
3. `EventsTeaser` converted to `"use client"` — re-filters events on mount

**Acceptance criteria (all met):**
- ✅ TODAY/TOMORROW badge never in static HTML; appears post-hydration from browser clock
- ✅ Events list on `/events` re-filtered client-side on mount
- ✅ `EventsTeaser` re-filters client-side on mount
- ✅ `event-source.ts` no longer exports `now`
- ✅ `EventCard` no longer accepts `now` prop
- ✅ E2E tests for badges use `page.addInitScript` to freeze `Date`
- ✅ All existing E2E tests pass in chromium, firefox, webkit
- ✅ Zero TypeScript errors
- ✅ Biome linting passes

---

## Execution Log

[DISPATCHED] no-test p1-badge-impl — agent type: no-test, mode: sync
[GATE PASS] no-test p1-badge-impl — GREEN gate passed
[CLOSED] no-test p1-badge-impl
[DISPATCHED] no-test p2-event-list-client-impl — agent type: no-test, mode: sync
[GATE PASS] no-test p2-event-list-client-impl — GREEN gate passed
[CLOSED] no-test p2-event-list-client-impl
[DISPATCHED] no-test p3-teaser-client-impl — agent type: no-test, mode: sync
[GATE PASS] no-test p3-teaser-client-impl — GREEN gate passed
[CLOSED] no-test p3-teaser-client-impl
[DISPATCHED] no-test p4-e2e-badge-tests — agent type: no-test, mode: sync
[GATE PASS] no-test p4-e2e-badge-tests — GREEN gate passed (biome-ignore removed post-agent, replaced any[] with unknown[])
[CLOSED] no-test p4-e2e-badge-tests

---

## Outcome

- **tsc:** exit 0
- **lint:** exit 0 (2 pre-existing globals.css warnings)
- **test:e2e:** 120 tests passed — chromium 40, firefox 40, webkit 40
- **VALIDATE gate: PASS**

### Files created
- `src/components/EventUrgencyBadge.tsx`
- `src/components/EventListClient.tsx`

### Files modified
- `src/components/EventCard.tsx` — removed `now` prop, added `<EventUrgencyBadge>`
- `src/components/EventsTeaser.tsx` — converted to "use client", accepts `events` prop
- `src/app/events/page.tsx` — uses `EventListClient`, keeps `EventsSchema` with `upcomingEvents`
- `src/app/page.tsx` — passes `allEvents` to `EventsTeaser`
- `src/data/events.ts` — exported `allEvents` (was unexported `events`)
- `src/data/event-source.ts` — removed `now` export, re-exports `allEvents`
- `src/data/event-source.e2e.ts` — removed frozen `now`, exports `allEvents = fixtureEvents`
- `e2e/events.spec.ts` — badge tests now use `page.addInitScript` to freeze `Date`
