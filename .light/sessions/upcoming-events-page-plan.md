# Plan: Upcoming Events Page
_Feature: Add pop-up/market event listings to augustjones.shop_
_Date: 2026-04-15_
_tracker: yaks_

---

## Context

August Jones sells hand-made upcycled sports fashion at pop-up markets in Madison WI, Milwaukee WI, and Chicago IL. Currently the site has no way to tell visitors where and when they can find August Jones IRL. Adding an events page and homepage teaser serves two goals:

1. **Conversion:** Instagram bio traffic (mobile-first) lands on the homepage — a teaser showing upcoming events captures fans who can attend in person.
2. **SEO:** Google Event rich results require structured `schema.org/Event` JSON-LD — this drives local search discovery for queries like "Madison WI pop-up shop."

**Research summary:**
- Single `/events` page (no individual event detail pages — overkill at this scale)
- Stacked full-width event cards, chronological — optimal for mobile scan
- Auto-filter events ~1 week after end date (computed at render, no manual cleanup)
- `add-to-calendar-button-react` for calendar integration (works in Instagram in-app browser)
- Homepage teaser (next 1–2 events) below the product gallery section, above brand statement
- `EventsSchema.tsx` component following `ProductGallerySchema.tsx` pattern

---

## Goal

Add a `/events` page listing upcoming pop-up appearances, hook it into nav/footer, embed `schema.org/Event` JSON-LD for Google rich results, and surface the next 1–2 events on the homepage.

---

## Acceptance Criteria

- [ ] `/events` page exists, loads correctly, and is linked from nav and footer
- [ ] Events data lives in `src/data/events.ts` with typed interface and filter utility
- [ ] Event cards show: name, date/time, venue + city, description, directions link, add-to-calendar button
- [ ] Events past their end date + 7 days are auto-hidden (no manual cleanup needed)
- [ ] Empty state: "Check back soon" with links to Instagram and Etsy
- [ ] `schema.org/Event` JSON-LD in `/events` page `<head>` (only for upcoming events)
- [ ] Page metadata: correct title, description, canonical
- [ ] `/events` added to `sitemap.ts` with `changeFrequency: "weekly"`, `priority: 0.8`
- [ ] Homepage teaser shows next 1–2 upcoming events below the product gallery section
- [ ] All E2E tests pass in chromium, firefox, webkit
- [ ] TypeScript compiles with no errors (`pnpm exec tsc --noEmit`)
- [ ] Biome linting passes (`pnpm lint`)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/data/events.ts` | Typed `AugustJonesEvent` interface, event array with ~5 placeholder events, `getUpcomingEvents()` filter utility |
| `src/app/events/page.tsx` | `/events` route — metadata, Event JSON-LD, renders `EventCard` list or empty state |
| `src/components/EventCard.tsx` | Stacked full-width card: date eyebrow, event name heading, venue/city, description, directions link, add-to-calendar |
| `src/components/EventsSchema.tsx` | JSON-LD `<script>` component for `schema.org/Event` array (follows `ProductGallerySchema.tsx` pattern) |
| `e2e/events.spec.ts` | Playwright E2E tests for the events page and homepage teaser |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/SiteNav.tsx` | Add `{ label: "Events", href: "/events", key: "events" }` to `NAV_LINKS` |
| `src/components/Footer.tsx` | Add Events `<Link>` to the Navigate column |
| `src/app/sitemap.ts` | Add `/events` entry |
| `src/app/page.tsx` | Add events teaser section below the collection section (`<section aria-labelledby="collection-heading">`) |

---

## Package to Install

```
pnpm add add-to-calendar-button-react
```

---

## Implementation Phases

### Phase 1: Data Layer + Infrastructure [no-test]

**Goal:** Establish the typed events data model, install the calendar package, and update the sitemap. No UI yet — just the foundation every other phase depends on.

**Tasks:**
- Install `add-to-calendar-button-react`
- Create `src/data/events.ts`:
  - Export `AugustJonesEvent` interface (see data model below)
  - Export `events` array with ~5 placeholder events across Madison WI, Milwaukee WI, Chicago IL — dates in May–July 2026
  - Export `getUpcomingEvents()` filter function (endDate + 7 days > now)
- Update `src/app/sitemap.ts`: add `/events` entry

**Data model:**
```ts
interface AugustJonesEvent {
  id: string
  name: string           // "August Jones at Mad City Makers Market"
  marketName: string     // "Mad City Makers Market"
  startDate: string      // ISO-8601: "2026-05-10T10:00:00-05:00"
  endDate: string        // ISO-8601: "2026-05-10T16:00:00-05:00"
  venueName: string
  city: string           // "Madison, WI"
  address: { street: string; city: string; state: string; zip: string }
  mapsUrl: string        // Google Maps deep link
  eventWebsiteUrl: string
  description: string
  image?: string
  instagramUrl?: string
}
```

**Filter utility:**
```ts
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
export function getUpcomingEvents(): AugustJonesEvent[] {
  return events.filter(
    e => new Date(e.endDate).getTime() + ONE_WEEK_MS > Date.now()
  )
}
```

**Verification:**
- `pnpm exec tsc --noEmit` — no type errors
- `pnpm lint` — no lint errors

#### Agent Context

```
Files to create/modify:
  - src/data/events.ts (create)
  - src/app/sitemap.ts (modify — add /events entry)
  - package.json / pnpm-lock.yaml (add-to-calendar-button-react)

Test spec: none (data-only phase)
Test command: pnpm exec tsc --noEmit && pnpm lint

RED gate: N/A (no-test phase)
GREEN gate: tsc exits 0, biome check exits 0

Architectural constraints:
  - Events are hardcoded in events.ts — no CMS, no API calls
  - Use ISO-8601 strings with -05:00 (America/Chicago) for all dates
  - getUpcomingEvents() must be a pure function (no side effects)
  - Do NOT use 'any' types
  - Install package with: pnpm add add-to-calendar-button-react
```

---

### Phase 2: Navigation Integration [TDD]

**Goal:** Add the Events link to the desktop nav, mobile menu, and footer. Tracked via `trackNavClick("events")`.

**Test spec (behavioral):**
- Desktop nav has an "Events" link pointing to `/events`
- Mobile menu (hamburger open) has an "Events" link pointing to `/events`
- Footer "Navigate" section has an "Events" link pointing to `/events`
- Clicking the nav Events link tracks `nav_click` with destination `"events"` (using the existing `trackNavClick` pattern)

**Tasks:**
- Write failing E2E tests in `e2e/events.spec.ts` (nav integration section)
- Update `SiteNav.tsx`: add `{ label: "Events", href: "/events", key: "events" }` to `NAV_LINKS`
- Update `Footer.tsx`: add `<Link href="/events">Events</Link>` in the Navigate nav, between the Shop and About links

**Verification:**
- `pnpm test:e2e` — nav/footer tests pass in all 3 browsers
- `pnpm exec tsc --noEmit` — no type errors
- `pnpm lint` — no lint errors

#### Agent Context

```
Files to create/modify:
  - e2e/events.spec.ts (create — nav integration tests only)
  - src/components/SiteNav.tsx (modify — add Events to NAV_LINKS)
  - src/components/Footer.tsx (modify — add Events link to Navigate nav)

Test spec:
  - desktop nav has link[href="/events"] with text "Events"
  - mobile nav (after opening hamburger) has link[href="/events"] with text "Events"
  - footer navigation has link[href="/events"] with text "Events"
  - Note: /events page does not need to exist for nav link tests; use page.goto("/") as base

Test command: pnpm test:e2e

RED gate: Tests fail — nav/footer do not have an Events link
GREEN gate: All 3 browsers pass; Events link present in desktop nav, mobile menu, footer

Architectural constraints:
  - Use NAV_LINKS array in SiteNav.tsx — do NOT add a one-off link outside the array
  - Footer Events link should match the existing About/Contact link style: text-sm text-foreground/75 transition-colors duration-200 hover:text-accent
  - Nav click tracking: SiteNav already maps NAV_LINKS with trackNavClick(key) — adding to the array is sufficient
  - Do NOT modify existing E2E tests — only add new ones in e2e/events.spec.ts
  - Reference CLAUDE.md WebKit quirks if testing interactions (sendBeacon, mailto)
```

---

### Phase 3: Events Page + Components [TDD]

**Goal:** Build the full `/events` page with `EventCard`, `EventsSchema`, and the empty state. All event info inline — no modals.

**Test spec (behavioral):**
- `/events` loads with title `"Upcoming Events & Pop-Ups | August Jones"`
- Page has `<h1>` containing "Events" or "Pop-Ups" or similar
- When upcoming events exist: at least one event card is visible with date, venue name, city, and a "Get Directions" link
- "Get Directions" link has `href` matching a maps URL (starts with `https://maps.`)
- "Add to Calendar" button is present on each card
- `schema.org/Event` JSON-LD is present in a `<script type="application/ld+json">` tag with `"@type":"Event"`
- Schema includes `startDate`, `location`, `organizer` fields
- When events list is empty (all past): "Check back soon" message visible; link to Instagram visible; link to Etsy visible
- Page is accessible: has `<main>`, logical heading hierarchy

**Tasks:**
1. Write failing E2E tests in `e2e/events.spec.ts` (events page section)
2. Create `src/components/EventsSchema.tsx`
   - Accepts `events: AugustJonesEvent[]`
   - Renders `schema.org/Event` JSON-LD array — follow `ProductGallerySchema.tsx` pattern
   - Each event: `name`, `startDate`, `endDate`, `eventStatus: EventScheduled`, `eventAttendanceMode: OfflineEventAttendanceMode`, `location` (Place + PostalAddress), `organizer` (ref to LocalBusiness `@id`)
3. Create `src/components/EventCard.tsx`
   - Props: `event: AugustJonesEvent`
   - Layout: date eyebrow (`.text-eyebrow`), event name (`.text-display`), venue + city, description (`.text-editorial`), "Get Directions" link (opens mapsUrl), `add-to-calendar-button-react` component
   - Timezone: `America/Chicago`
   - Brand styles: dark bg (`bg-background`), eggshell card sections (`bg-[#f6f4f0]`), yellow accent, sharp corners
4. Create `src/app/events/page.tsx`
   - Exports `metadata` with title, description, canonical `/events`
   - Calls `getUpcomingEvents()` — renders `EventCard` list or empty state
   - Includes `<EventsSchema events={upcomingEvents} />` (only when events exist)
   - Empty state: "Check back soon" + Instagram link + Etsy link

**Verification:**
- `pnpm test:e2e` — all events page tests pass in all 3 browsers
- `pnpm exec tsc --noEmit` — no type errors
- `pnpm lint` — no lint errors

#### Agent Context

```
Files to create/modify:
  - e2e/events.spec.ts (modify — add events page tests)
  - src/components/EventsSchema.tsx (create)
  - src/components/EventCard.tsx (create)
  - src/app/events/page.tsx (create)

Test spec:
  - /events has title "Upcoming Events & Pop-Ups | August Jones"
  - Page has <h1> with events-related heading
  - At least one event card visible with date text, venue, city, "Get Directions" link
  - "Get Directions" href starts with "https://maps."
  - Page has <script type="application/ld+json"> containing "@type":"Event"
  - Schema contains startDate, location.@type === "Place"
  - Empty state test: mock Date.now() to be after all events+7d, verify "check back" text and Instagram+Etsy links visible

Test command: pnpm test:e2e

RED gate: Tests fail — /events route returns 404 or is missing required elements
GREEN gate: All 3 browsers pass; events render, schema present, empty state works

Architectural constraints:
  - Import AugustJonesEvent from src/data/events.ts — no inline type redefinition
  - EventCard must be a 'use client' component ONLY if it uses client hooks; prefer server component
  - add-to-calendar-button-react likely needs 'use client' — isolate in a thin wrapper if needed
  - EventsSchema follows ProductGallerySchema.tsx pattern: server component, dangerouslySetInnerHTML for JSON-LD
  - Organizer @id: "https://www.augustjones.shop/#localbusiness" (matches existing LocalBusiness schema in layout.tsx)
  - Mobile-first: date/time visually dominant on card; all info inline (no modals)
  - Brand colors: charcoal #222, eggshell #f6f4f0, yellow accent #ffb612
  - Sharp corners: --radius-sm: 0rem — do NOT use rounded-* classes
  - NEVER use biome-ignore or @ts-ignore suppressions
  - WebKit quirk: if testing add-to-calendar interactions, be aware of potential mailto/navigation issues per CLAUDE.md
```

---

### Phase 4: Homepage Teaser [no-test]

**Goal:** Surface the next 1–2 upcoming events on the homepage below the product gallery, above the brand statement. This is critical because Instagram bio traffic lands on `/`, not `/events`.

**Tasks:**
- Update `src/app/page.tsx`:
  - Import `getUpcomingEvents` from `src/data/events.ts`
  - After the collection section (`<section aria-labelledby="collection-heading">`), before the brand statement section, add a new events teaser section
  - Show first 1–2 events from `getUpcomingEvents()`
  - If no upcoming events, omit the section entirely (conditional render, no empty state on homepage)
  - Section includes: "Catch Us Live" or similar eyebrow, section heading, compact event previews (name, date, city), "See all events →" link to `/events`
  - Compact format: NOT the full `EventCard` — a lighter teaser (date + name + city + link)

**Verification:**
- `pnpm exec tsc --noEmit` — no type errors
- `pnpm lint` — no lint errors
- Browser: homepage renders correctly with events teaser visible; teaser absent when `getUpcomingEvents()` returns empty (test by temporarily setting all event dates in the past)

#### Agent Context

```
Files to create/modify:
  - src/app/page.tsx (modify — add events teaser section)

Test spec: none (no-test phase — visual verification only)
Test command: pnpm exec tsc --noEmit && pnpm lint

RED gate: N/A (no-test phase)
GREEN gate: tsc exits 0, biome check exits 0; browser shows teaser section

Architectural constraints:
  - Insert teaser AFTER the collection section and BEFORE the brand statement section
  - Do NOT reuse EventCard — build a compact inline teaser (lighter markup)
  - Conditional render: if getUpcomingEvents().length === 0, return null for the section (no empty state on homepage)
  - Limit display to first 2 events: getUpcomingEvents().slice(0, 2)
  - Include a "See all events →" link to /events
  - Match homepage section aesthetic: use bg-[#f6f4f0] with text-[#222] (eggshell section like the collection)
  - Sharp corners throughout; brand typography (text-eyebrow, text-display)
```

---

## Constraints & Considerations

- **No CMS:** All event data lives in `src/data/events.ts`. The user edits this file to add/remove events.
- **Static export:** `next.config.ts` has `trailingSlash: true`. Ensure `src/app/events/page.tsx` works with static export (no dynamic server-side logic; `getUpcomingEvents()` runs at build time for static + at runtime for client hydration).
  - Actually, since `Date.now()` is called at render time and this is a static export, `getUpcomingEvents()` will filter based on build time. Consider making this a client component or using `export const dynamic = "force-static"` with awareness that filtering happens at build time. **Decision:** Keep filtering at build time (acceptable for events — user rebuilds/redeploys when adding events anyway). Document this in `events.ts`.
- **WebKit:** Follow CLAUDE.md patterns for add-to-calendar interactions if E2E testing them (avoid testing the dropdown internals; just verify the button exists).
- **Analytics:** Nav click tracking is automatic via `trackNavClick(key)` in the `NAV_LINKS` map. No additional tracking needed unless add-to-calendar or directions clicks should be tracked (out of scope for now).
- **Add-to-calendar server component:** The `add-to-calendar-button-react` package likely requires `'use client'`. Wrap it in a thin `AddToCalendarWrapper` client component to keep `EventCard` as a server component if possible.

---

## Out of Scope

- Individual event detail pages (`/events/[slug]`) — single page is sufficient at this scale
- CMS integration — hardcoded data is simpler and appropriate
- Event photos — optional field in data model, not required in initial UI
- Analytics tracking for directions/calendar clicks — can add later
- Instagram story/reel linking per event — optional field reserved in interface
- Tickets or paid admission — all events are free, no ticket integration needed
