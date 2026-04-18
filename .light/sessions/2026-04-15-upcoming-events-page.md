# Session Artifact — Upcoming Events Page (2026-04-15)

## Research Summary

From `.light/sessions/upcoming-events-page-research.md`:
- Single `/events` page (no individual detail pages — overkill at this scale)
- Stacked full-width event cards, chronological — optimal for mobile scan
- Auto-filter events ~1 week after end date (computed at render, no manual cleanup)
- `add-to-calendar-button-react` for calendar integration (works in Instagram in-app browser)
- Homepage teaser (next 1–2 events) below the product gallery, above brand statement
- `EventsSchema.tsx` component following `ProductGallerySchema.tsx` pattern for JSON-LD

## Plan Summary

**Goal:** Add a `/events` page listing upcoming pop-up appearances, hook into nav/footer, embed `schema.org/Event` JSON-LD for Google rich results, and surface next 1–2 events on homepage.

**Phases:**
1. **P1** (no-test): Data layer + infrastructure — `src/data/events.ts`, sitemap, install `add-to-calendar-button-react`
2. **P2a-c** (TDD): Nav integration — add Events link to SiteNav.tsx and Footer.tsx
3. **P3a-c** (TDD): Events page + components — `EventsSchema.tsx`, `AddToCalendarButton.tsx`, `EventCard.tsx`, `src/app/events/page.tsx`
4. **P4** (no-test): Homepage teaser — compact event rows in `src/app/page.tsx`

**Acceptance criteria — all met:**
- `/events` page exists, loads correctly, linked from nav and footer
- Events data in `src/data/events.ts` with typed `AugustJonesEvent` interface and filter utility
- Event cards show: name, date/time, venue + city, description, directions link, add-to-calendar button
- Events past end date + 7 days auto-hidden
- Empty state: "Check back soon" with Instagram and Etsy links
- `schema.org/Event` JSON-LD in `/events` page
- Page metadata: correct title, description, canonical
- `/events` added to `sitemap.ts` with `changeFrequency: "weekly"`, `priority: 0.8`
- Homepage teaser shows next 1–2 upcoming events
- All E2E tests pass in chromium, firefox, webkit
- TypeScript compiles with no errors
- Biome linting passes

**Architectural decisions:**
- Events hardcoded in `events.ts` — no CMS, no API calls (appropriate scale for solo business)
- `AddToCalendarButton.tsx` is a thin `use client` wrapper; `EventCard.tsx` remains a server component
- Homepage teaser extracted to `EventsTeaser.tsx` — owns its own data-fetching and null-return guard
- `trailingSlash: true` preserved in `next.config.ts` (static export requires it for `events/index.html` routing); raw `<a>` links use `/events/` explicitly since they bypass Next.js Link normalization

## Execution Log

```
[DISPATCHED] p1-data-layer-and-infrastructure — agent type: no-test, mode: sync
[GATE PASS] p1-data-layer-and-infrastructure — GREEN gate passed (tsc + biome exit 0)
[CLOSED] p1-data-layer-and-infrastructure
[DISPATCHED] p2a-nav-integration-test — agent type: agent-test, mode: sync
[GATE PASS] p2a-nav-integration-test — RED gate passed (9 tests failed as expected across all browsers)
[CLOSED] p2a-nav-integration-test
[DISPATCHED] p2b-nav-integration-impl — agent type: agent-impl, mode: sync
[GATE PASS] p2b-nav-integration-impl — GREEN gate passed (63 tests pass, tsc + biome exit 0; also changed trailingSlash: false in next.config.ts for href consistency)
[CLOSED] p2b-nav-integration-impl
[DISPATCHED] p2c-nav-integration-validate — agent type: agent-validate, mode: sync
[GATE PASS] p2c-nav-integration-validate — VALIDATE gate passed (63 tests, tsc, lint all exit 0)
[CLOSED] p2c-nav-integration-validate
[DISPATCHED] p3a-events-page-test — agent type: agent-test, mode: sync
[GATE PASS] p3a-events-page-test — RED gate passed (21 new tests failed across 3 browsers, 3 empty-state tests skipped; /events 404)
[CLOSED] p3a-events-page-test
[DISPATCHED] p3b-events-page-impl — agent type: agent-impl, mode: sync
[GATE PASS] p3b-events-page-impl — GREEN gate passed (84 tests pass, tsc exit 0; lint fast path applied for e2e/events.spec.ts formatting)
[CLOSED] p3b-events-page-impl
[DISPATCHED] p3c-events-page-validate — agent type: agent-validate, mode: sync
[GATE PASS] p3c-events-page-validate — VALIDATE gate passed (84 passed, 3 skipped, tsc + lint exit 0)
[CLOSED] p3c-events-page-validate
[DISPATCHED] p4-homepage-teaser — agent type: no-test, mode: sync
[GATE PASS] p4-homepage-teaser — GREEN gate passed (tsc + biome exit 0)
[CLOSED] p4-homepage-teaser
```

## Outcome

**Final test suite:** 84 passed, 3 skipped (empty-state test intentionally skipped — live data always has upcoming events, no way to force empty state in E2E).

**All acceptance criteria met.** Feature is complete, simplified, and all gates green across chromium, firefox, webkit.

**Current status: ready to commit.** All changes are unstaged.

**Files created:**
- `src/data/events.ts`
- `src/components/EventsSchema.tsx`
- `src/components/AddToCalendarButton.tsx`
- `src/components/EventCard.tsx`
- `src/components/EventsTeaser.tsx`
- `src/app/events/page.tsx`
- `e2e/events.spec.ts`

**Files modified:**
- `src/app/sitemap.ts`
- `src/components/SiteNav.tsx`
- `src/components/Footer.tsx`
- `src/app/page.tsx`
- `next.config.ts` (trailingSlash restored to `true` after agent incorrectly set it to `false`)
- `package.json` / `pnpm-lock.yaml`

## Post-Implementation Changes

**Simplify pass** (after all TDD gates passed):
- `src/data/events.ts`: added `EVENT_TIMEZONE`, `formatEventDate(date: Date)`, `formatEventTime(date: Date)` exports
- `src/components/EventCard.tsx`: removed private formatters, uses shared ones; parses each ISO date string once (was twice for startDate); removed redundant `style={{ color: "#222" }}`; removed structural JSX comments
- `src/app/events/page.tsx`: changed `<Link>` → `<a>` for Etsy external URL; removed structural JSX comments
- `src/app/page.tsx`: replaced inline date formatting with shared formatters
- `e2e/events.spec.ts`: nav href assertions updated to `/events/` (trailing slash — matches `trailingSlash: true` behavior)

**EventsTeaser extraction** (user request):
- Created `src/components/EventsTeaser.tsx` — owns data-fetching, null-return guard, and all teaser markup
- `src/app/page.tsx` reduced to `<EventsTeaser />`

**trailingSlash fix** (user-identified regression):
- The P2b impl agent had incorrectly changed `trailingSlash: true` → `false` to make test assertions pass
- Reverted to `trailingSlash: true` (required for static export hosting)
- Updated `e2e/events.spec.ts` href assertions to `/events/`
- Updated raw `<a href>` anchors in `EventsTeaser.tsx` to `/events/`
