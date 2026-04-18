# Plan: Dynamic Date Fix for Events Page

**Tracker:** yaks
**Topic:** events-dynamic-date

---

## Context

The events page was built with `output: "export"` (fully static site). `src/data/event-source.ts` evaluates `export const now = new Date()` at build time — this freezes the date for the lifetime of the deployed build.

Two problems stem from this:
1. **TODAY/TOMORROW urgency badges** on `EventCard` go stale — a build at midnight Monday shows "TODAY" all week until the next deploy.
2. **The upcoming events filter** (`upcomingEvents`) also bakes in the build-time `now` — events that pass after a deploy remain visible for up to 7 days even after they end (the grace period), but could also show beyond that if deploys are infrequent.

SSR (`force-dynamic`) is not an option — `output: "export"` requires a fully static build; adding `force-dynamic` causes a build error. The right fix is a minimal client component that reads `new Date()` post-hydration.

**Chosen approach (Option A from research):** Client-side badge rendering + client-side event list freshening.

---

## Goal

Move the urgency badge and event list filtering to client components so they reflect the visitor's browser clock at page load, without changing the static export architecture.

---

## Acceptance Criteria

- [ ] TODAY/TOMORROW badge is never rendered in static HTML; it appears post-hydration using `new Date()` from the visitor's browser
- [ ] The events list on `/events` is re-filtered client-side on mount — events that have passed will disappear without a redeploy
- [ ] `EventsTeaser` on the homepage re-filters its event list client-side on mount
- [ ] `event-source.ts` no longer exports `now`
- [ ] `EventCard` no longer accepts a `now` prop
- [ ] E2E tests for TODAY/TOMORROW badges use `page.addInitScript` to freeze `Date` (since badge is now client-rendered)
- [ ] All existing E2E tests pass in chromium, firefox, and webkit
- [ ] TypeScript strict mode: zero type errors (`pnpm exec tsc --noEmit`)
- [ ] Biome linting passes (`pnpm lint`)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/EventUrgencyBadge.tsx` | `"use client"` — reads `new Date()` in `useEffect`, renders TODAY/TOMORROW badge |
| `src/components/EventListClient.tsx` | `"use client"` — receives all events, re-filters on mount, renders `EventCard` list |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/data/event-source.ts` | Remove `export const now`; keep or update `upcomingEvents` (used by `EventsSchema` server component for schema JSON-LD) |
| `src/data/event-source.e2e.ts` | Remove `now` export; export `allEvents = fixtureEvents` for client-side filtering |
| `src/components/EventCard.tsx` | Remove `now` prop + `urgencyLabel` computation; render `<EventUrgencyBadge event={event} />` |
| `src/app/events/page.tsx` | Import `allEvents` (all events, unfiltered) instead of `upcomingEvents`; render `<EventListClient events={allEvents} />`; keep `<EventsSchema>` using `upcomingEvents` build-time for schema |
| `src/components/EventsTeaser.tsx` | Add `"use client"`, filter events on mount with `new Date()` |
| `e2e/events.spec.ts` | Update TODAY/TOMORROW badge tests to use `page.addInitScript` to freeze `Date` in the browser |

---

## Implementation Phases

### Phase 1: `EventUrgencyBadge` Client Component + `EventCard` Update

**Goal:** Decouple the urgency badge from server-side `now`. `EventCard` no longer needs `now` prop.

**Test spec:** After the change:
- `EventCard` renders without a `now` prop (TypeScript validates this)
- `EventUrgencyBadge` renders nothing on initial paint (SSR / first render before effect)
- After hydration, `EventUrgencyBadge` renders a `<span>` with `TODAY` or `TOMORROW` when the event matches

**Tasks:**
1. Create `src/components/EventUrgencyBadge.tsx`
   - `"use client"`
   - `useState<string | null>(null)` + `useEffect(() => setLabel(getEventUrgencyLabel(event, new Date())), [])`
   - Return `null` until label is set; render `<span className="...">` with same Tailwind classes as current badge
2. Update `src/components/EventCard.tsx`
   - Remove `EventCardProps.now` and `urgencyLabel` computation
   - Replace `{urgencyLabel && <span>...}` with `<EventUrgencyBadge event={event} />`

**Verification:**
- [ ] `pnpm exec tsc --noEmit` — no type errors
- [ ] `pnpm lint` — no lint errors

#### Agent Context

```
Files to create:
  src/components/EventUrgencyBadge.tsx

Files to modify:
  src/components/EventCard.tsx

Test spec:
  No new tests in this phase. Verification is type-checking only.
  TypeScript must be clean: EventCard no longer has a `now` prop in its interface.
  EventUrgencyBadge: useState<string|null>(null), useEffect reads new Date(), returns null before hydration.

Test command:
  pnpm exec tsc --noEmit && pnpm lint

RED gate: N/A (no-test phase)
GREEN gate: tsc and lint both exit 0

Architectural constraints:
  - EventUrgencyBadge must be "use client" — it calls new Date() inside useEffect
  - EventCard must remain a Server Component (no "use client") — it handles static markup for SEO
  - Copy the exact Tailwind classes from EventCard's current urgency badge span:
    absolute right-0 top-0 bg-[#ffb612] px-3 py-1.5 font-bebas-neue text-base tracking-widest text-[#222]
  - The badge renders `null` on SSR (initial useState is null, no effect runs server-side)
  - Do not add "use client" to EventCard
```

---

### Phase 2: `EventListClient` + Events Page Update

**Goal:** The `/events` page renders the full events array at build time; a client component re-filters by `new Date()` on mount and renders `EventCard` items.

**Test spec:** No new TDD tests — this is a structural/wiring change. Verification is TypeScript + a browser check that the events list renders correctly.

**Tasks:**
1. Export `allEvents` from `src/data/events.ts` (the raw events array)
2. Update `src/data/event-source.ts`:
   - Remove `export const now`
   - Keep `export const upcomingEvents = getUpcomingEvents(allEvents, new Date())` — still used by `EventsSchema` for schema JSON-LD at build time
3. Update `src/data/event-source.e2e.ts`:
   - Remove `export const now`
   - Export `allEvents = fixtureEvents`
   - Keep `export const upcomingEvents = getUpcomingEvents(fixtureEvents, new Date("2099-06-15T12:00:00-05:00"))`
4. Create `src/components/EventListClient.tsx`:
   - `"use client"`
   - Props: `{ events: AugustJonesEvent[] }` (all events, pre-filtered or not)
   - `useState(events)` initial state
   - `useEffect(() => setVisible(getUpcomingEvents(events, new Date())), [events])`
   - Renders the event list (map over `visible`, `<EventCard>`, dividers) — extracted from `events/page.tsx`
   - Renders the "Check back soon" empty state if `visible.length === 0`
5. Update `src/app/events/page.tsx`:
   - Import `allEvents` from `event-source`; import `upcomingEvents` for schema only
   - Replace the inline `events.map(...)` block with `<EventListClient events={allEvents} />`
   - `EventsSchema` continues to receive `upcomingEvents` (build-time filtered, good enough for structured data)

**Verification:**
- [ ] `pnpm exec tsc --noEmit` — no type errors
- [ ] `pnpm lint` — no lint errors
- [ ] Browser: navigate to `/events`, confirm event cards render and discount badges/venues visible

#### Agent Context

```
Files to create:
  src/components/EventListClient.tsx

Files to modify:
  src/data/events.ts  — add `export const allEvents = events` (the raw array)
  src/data/event-source.ts  — remove `now` export; update imports
  src/data/event-source.e2e.ts  — remove frozen `now`, export `allEvents = fixtureEvents`
  src/app/events/page.tsx  — use EventListClient, keep EventsSchema with upcomingEvents

Test spec:
  No TDD tests in this phase. Type checking + manual browser verification.

Test command:
  pnpm exec tsc --noEmit && pnpm lint

RED gate: N/A (no-test phase)
GREEN gate: tsc and lint both exit 0; browser shows event cards on /events

Architectural constraints:
  - EventListClient is "use client" — it calls new Date() inside useEffect
  - events/page.tsx stays as a Server Component — keeps `export const metadata` (incompatible with "use client")
  - EventsSchema stays server-rendered (build-time schema is acceptable for structured data)
  - The EventListClient empty state ("Check back soon") must render the same JSX currently in events/page.tsx
  - Move the divider logic (<div className="h-px bg-[#ffb612]" />) into EventListClient
  - Initial useState(events) — on SSR build, renders all events; on hydration, re-filters
  - Do not import `now` anywhere in Server Components after this phase
```

---

### Phase 3: `EventsTeaser` Client-Side Freshening

**Goal:** The homepage teaser re-filters events on the client so it doesn't show stale/past events between deploys.

**Tasks:**
1. Update `src/components/EventsTeaser.tsx`:
   - Add `"use client"` directive
   - Accept `events: AugustJonesEvent[]` as a prop (passed from the homepage server component)
   - `useState(events.slice(0, 2))` initial
   - `useEffect(() => setVisible(getUpcomingEvents(events, new Date()).slice(0, 2)), [events])`
   - If `visible.length === 0`, return `null` (same as current behavior when `events.length === 0`)
2. Update `src/app/page.tsx`:
   - Import `allEvents` from `event-source` (instead of pre-filtered `upcomingEvents`)
   - Pass `allEvents` to `<EventsTeaser events={allEvents} />`

**Verification:**
- [ ] `pnpm exec tsc --noEmit` — no type errors
- [ ] `pnpm lint` — no lint errors
- [ ] Browser: homepage shows events teaser section with at least one event row

#### Agent Context

```
Files to modify:
  src/components/EventsTeaser.tsx  — add "use client", accept events prop, filter on mount
  src/app/page.tsx  — pass allEvents to EventsTeaser

Test spec:
  No TDD tests. TypeScript + browser verification.

Test command:
  pnpm exec tsc --noEmit && pnpm lint

RED gate: N/A (no-test phase)
GREEN gate: tsc and lint exit 0; homepage teaser visible in browser

Architectural constraints:
  - EventsTeaser becomes a Client Component ("use client")
  - Homepage page.tsx stays a Server Component — it passes events as a prop to EventsTeaser
  - Import allEvents from event-source (not upcomingEvents), so client can do fresh filtering
  - Initial useState(events.slice(0, 2)) ensures SSR HTML still shows events
```

---

### Phase 4: Update E2E Tests for Client-Rendered Badges

**Goal:** The TODAY/TOMORROW badge tests must freeze `Date` via `page.addInitScript` since the badge is now client-rendered (not from server `now`).

**Test spec behavioral description:**
- "When `Date` is frozen to `2099-06-15T12:00:00-05:00` and the page loads, the fixture event with `id=fixture-single-day-event-2099-06-15` shows a TODAY badge."
- "When `Date` is frozen to `2099-06-15T12:00:00-05:00` and the page loads, the fixture event with `id=fixture-discount-event-2099-06-16` shows a TOMORROW badge."
- Both badges appear after hydration — tests must `waitFor` visibility, not just `toBeVisible()`.

**Tasks:**
1. In `e2e/events.spec.ts`, update the two badge tests:
   - Add `await page.addInitScript(...)` **before** `await page.goto("/events")` to freeze `Date` to `2099-06-15T12:00:00-05:00`
   - The `addInitScript` script overrides `Date` globally to always return the fixed time for `new Date()` / `Date.now()`
   - `await expect(badge).toBeVisible()` — already waits, but ensure the element exists post-hydration
2. (Optional) Extract the date-freeze helper into a shared test utility if used in more than one place

**Note on webkit:** Per project memory, `navigator.sendBeacon` bodies are NOT captured in webkit. The badge tests don't involve analytics, so standard Playwright assertions work fine for all three browsers.

**Verification:**
- [ ] `pnpm test:e2e` — all tests pass in chromium, firefox, webkit
- [ ] TODAY badge test passes: fixture event on 2099-06-15 shows TODAY
- [ ] TOMORROW badge test passes: fixture event on 2099-06-16 shows TOMORROW

#### Agent Context

```
Files to modify:
  e2e/events.spec.ts  — update today/tomorrow badge tests to freeze Date via addInitScript

Test spec:
  Two badge tests need page.addInitScript before page.goto to freeze Date.
  The script should replace the global Date constructor so new Date() always returns 2099-06-15T12:00:00-05:00.
  Pattern (addInitScript):
    const FROZEN = new Date("2099-06-15T12:00:00-05:00").getTime()
    const OrigDate = Date
    Date = class extends OrigDate {
      constructor(...args) { if (args.length === 0) super(FROZEN); else super(...args) }
      static now() { return FROZEN }
    }
  Badges are client-rendered (useEffect), so they appear after hydration.
  Playwright's expect().toBeVisible() already retries/waits — this should work as-is.

Test command:
  pnpm test:e2e

RED gate: badge tests currently pass because now comes from server; after phases 1-3, they will fail because badge is no longer in HTML
GREEN gate: all tests pass in chromium, firefox, webkit after addInitScript fix

Architectural constraints:
  - Only modify e2e/events.spec.ts — no changes to implementation files in this phase
  - Do NOT mock the module-level event-source.e2e.ts; freeze Date at the browser level instead
  - The addInitScript must be called before page.goto (it runs before page scripts)
  - Do not use page.route or other interception — only addInitScript for Date mocking
  - Webkit note: addInitScript approach works in webkit (unlike sendBeacon interception)
```

---

## Constraints & Considerations

- **`output: "export"`** — This is a static export. No server-side code runs at request time. All client behavior must be in `"use client"` components using `useEffect`.
- **`trailingSlash: true`** — Must not be changed (per CLAUDE.md).
- **React Compiler** is enabled (`reactCompiler: true`) — no manual `useMemo`/`useCallback` needed; React Compiler handles optimization.
- **SEO impact:** TODAY/TOMORROW badges are not in SEO-critical content. They are a UX nicety. Not being in initial HTML is acceptable.
- **EventsSchema stays server-side** — structured data for Google rich results is baked into build-time HTML. This is acceptable; Event schema doesn't need real-time accuracy.
- **No flash for initial badge render** — because `useState(null)` returns `null` before hydration, the badge slot is empty (not flickering between states). Clean.

## Out of Scope

- Switching to SSR / removing `output: "export"` — too large a change, out of scope
- GitHub Actions cron rebuild — Option C from research, deferred
- Individual event pages (`/events/[slug]`) — previously deferred
- Any new event data — not part of this fix
