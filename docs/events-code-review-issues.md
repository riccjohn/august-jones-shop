# Events Page Code Review — Open Issues

Branch: `feature/events-page`  
Reviewed: 2026-04-18  
Status: Issue #4 (getEventName abstraction) already fixed.

---

## Important

### #1 — `getCalendarTime` timezone fragility
**`src/components/EventCard.tsx:22–24`**

```ts
function getCalendarTime(dateString: string): string {
  return dateString.split("T")[1].slice(0, 5);
}
```

All current event strings look like `"2026-05-02T12:00:00-05:00"`. The `.slice(0, 5)` grabs `12:00` — the local Chicago time — which is correct. But the `add-to-calendar-button` library expects a local time string, not UTC. If anyone enters a date in UTC format (`"2026-05-02T17:00:00Z"`) the slice would grab `17:00` instead of `12:00` — off by 5–6 hours depending on DST. Nothing in the type system or data validation prevents this; `EventSession` just says `startDate: string`.

**Fix:** Add a comment to the `EventSession` interface documenting the required format (explicit offset like `-05:00`, never `Z`). Optionally add a runtime assertion or Zod schema on the data file.

---

### #2 — `end` computed outside its branch in `EventsTeaser`
**`src/components/EventsTeaser.tsx:30`**

```ts
const end = new Date(firstSession.endDate);   // always runs
...
{isMultiDay ? (
  formatEventDateRange(event)          // end not used here
) : (
  <>... {formatEventTime(end)}</>      // only used here
)}
```

`end` is constructed unconditionally on every render but only consumed in the single-day branch. Not a bug — but reads as confusing. Moving the declaration inside the single-day branch makes intent unambiguous.

**Fix:** Move `const end = new Date(firstSession.endDate)` inside the single-day JSX branch. One-line change.

---

### #3 — Empty state has no test coverage
**`e2e/events.spec.ts:261–263`**

```ts
// Skipped: fixture data always has events so the empty state never renders in E2E.
// Cover with a unit/component test that renders EventsPage with an empty array.
test.skip("empty state shows 'check back' text…", …)
```

The empty state (`src/app/events/page.tsx:67–94`) renders "Check back soon" with Etsy and Instagram CTAs when `events.length === 0`. That UI could silently break. The skip comment identifies the fix but the test doesn't exist.

**Options:**
- (a) Add a Vitest + React Testing Library test rendering `EventsPage` with mocked `upcomingEvents = []`
- (b) Add a second Playwright project with a separate fixture exporting an empty array — consistent with the existing fixture pattern, no new test framework required

Option (b) is preferred for consistency.

---

## Minor

### #5 — Redundant copy in default event description
**`src/data/events.ts:115`**

```ts
`Come find August Jones at ${event.marketName}! Browse one-of-a-kind upcycled sports fashion — hoodies, jackets, and streetwear handmade from pro sports jerseys and fan gear. Every piece is handmade and one-of-a-kind.`
```

"Handmade" appears twice and "one-of-a-kind" appears twice. The trailing sentence adds no new information. This string goes into Google Calendar invites and is available for use in JSON-LD event descriptions.

**Fix:** Drop the last sentence, or replace with something additive (e.g., "Sizes and styles are limited — each piece is truly unique.").

---

### #6 — Milwaukee in hero copy but no Milwaukee events
**`src/app/events/page.tsx:10`** (metadata description) and **`page.tsx:49`** (visible subtitle)

```tsx
description: "Find August Jones at upcoming pop-up markets… in Madison WI, Milwaukee WI, and Chicago IL."
<p>Find August Jones at pop-up markets and craft fairs in Madison WI, Milwaukee WI, and Chicago IL.</p>
```

No event in `events.ts` is in Milwaukee. A user searching "August Jones Milwaukee" would land here and find no Milwaukee events — a trust/UX issue that also sends incorrect SEO signals.

**Fix:** Remove "Milwaukee WI" from both strings unless Milwaukee events are genuinely imminent.

---

### #7 — `python3 -m http.server` for E2E static serving
**`playwright.config.ts:75`**

```ts
command: "E2E_TEST=true pnpm build && python3 -m http.server 3001 --directory out"
```

`python3 -m http.server` is single-threaded. Playwright runs 3 browser projects in parallel (Chromium, Firefox, WebKit) all fetching from one thread. On macOS with a warm cache this is barely noticeable, but on CI it's a bottleneck and Python 3 isn't guaranteed to be available. `npx serve` / `pnpm dlx serve` is multi-threaded, handles trailing slashes identically to Next.js static export behavior, and only requires Node — which is already required for the build.

**Fix:** Replace with `pnpm dlx serve out --listen 3001` (or equivalent). Add `serve` as a dev dependency to avoid the `dlx` network hit on every CI run.

---

### #8 — `image` and `instagramUrl` declared but unused
**`src/data/events.ts:16–17`**

```ts
image?: string;
instagramUrl?: string;
```

Optional fields on `AugustJonesEvent` that nothing reads. Future developers (or future you) will wonder if implementation was accidentally omitted.

**Fix:** Add inline comments documenting intent, e.g.:
```ts
image?: string;         // reserved: per-event OG image override
instagramUrl?: string;  // reserved: link to event announcement post
```
