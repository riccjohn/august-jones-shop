# Research: Fresh `new Date()` for TODAY/TOMORROW Badges

## Key Constraint: `output: "export"` Blocks SSR

**`next.config.ts` line 6 has `output: "export"`** — this builds a fully static site into `out/`. There is no Node.js server at runtime. `force-dynamic` requires a server and is incompatible with static exports — it either silently no-ops or causes a build error.

This is the central constraint that shapes every option below.

---

## Current Data Flow

```
event-source.ts:3  →  export const now = new Date()        ← evaluated at build time
event-source.ts:4  →  export const upcomingEvents = getUpcomingEvents(undefined, now)

events/page.tsx:5  →  import { upcomingEvents as events, now }
events/page.tsx:62 →  <EventCard event={event} now={now} />

EventCard.tsx:28   →  getEventUrgencyLabel(event, now)     ← TODAY/TOMORROW badge
```

Also affected: `EventsTeaser.tsx:1` imports `upcomingEvents` (filtered list) — homepage teaser will also go stale between deploys.

The page has no `export const dynamic`, no `export const revalidate`, no `generateMetadata` (static `metadata` object only).

---

## Options

### Option A: Client Component for Badge Only (recommended)
Move just the urgency badge (`getEventUrgencyLabel`) into a small `"use client"` component that calls `new Date()` in a `useEffect`. The rest of `EventCard` stays as a Server Component.

- ✅ Compatible with `output: "export"`
- ✅ No change to deployment infrastructure
- ✅ Badge is accurate to the user's browser clock on page load
- ✅ Rest of page (event names, dates, structured data) stays statically rendered = fast SEO
- ⚠️ Badge not in initial HTML — minor flash on hydration, but badges are not SEO-critical content
- ⚠️ Uses browser clock, not server clock (users in wrong timezone could see wrong badge — mitigated since events are Chicago-timezone and the label function already normalizes to `EVENT_TIMEZONE`)

**Implementation sketch:**
```tsx
// src/components/EventUrgencyBadge.tsx
"use client"
import { useEffect, useState } from "react"
import { getEventUrgencyLabel } from "@/data/events"
import type { AugustJonesEvent } from "@/data/events"

export function EventUrgencyBadge({ event }: { event: AugustJonesEvent }) {
  const [label, setLabel] = useState<string | null>(null)
  useEffect(() => { setLabel(getEventUrgencyLabel(event, new Date())) }, [event])
  if (!label) return null
  return <span>{label}</span>
}
```

`EventCard` drops the `now` prop entirely and renders `<EventUrgencyBadge event={event} />` instead.

### Option B: Remove `output: "export"` and Use SSR
Switch to a Node.js server deployment (Vercel, Fly.io, etc.), remove `output: "export"`, and add `export const dynamic = "force-dynamic"` to the events page.

- ✅ Server-authoritative time, badge in initial HTML
- ✅ `generateMetadata` also runs fresh per request
- ❌ Breaking deployment change — requires migrating from static hosting (GitHub Pages, S3, etc.)
- ❌ Adds latency (TTFB increases) vs. CDN-served static files
- ❌ Larger scope than fixing a badge

### Option C: Periodic Rebuild (CI cron)
Keep static export, add a GitHub Actions cron that rebuilds and redeploys daily.

- ✅ No code changes, no infrastructure migration
- ⚠️ Badge still wrong between deploys — could show TODAY until midnight the next day
- ❌ Doesn't fully solve the problem; introduces deploy complexity

---

## Recommendation

**Option A** is the right fit. The TODAY/TOMORROW badge is a UX nicety, not SEO-critical content — it doesn't need to be in static HTML. A small client component reading `new Date()` post-hydration solves it cleanly within the existing static export architecture.

The `now` prop on `EventCard` can be removed entirely. The `upcomingEvents` filter should also be freshened on the client — a stale filter could show events that have already passed.

---

## Open Questions

1. Is the site currently deployed as static (GitHub Pages, S3, Netlify static, etc.)? Confirms whether Option B is worth considering at all.
2. ~~Should the `upcomingEvents` filter (which also uses `now`) be freshened on the client too?~~ **Resolved: yes, freshen on client.**

---

## Files to Change (Option A)

Both the events page and the homepage teaser need client-side freshening, since both consume `upcomingEvents` from `event-source.ts`.

- `src/components/EventCard.tsx` — remove `now` prop, add `<EventUrgencyBadge>`
- `src/components/EventUrgencyBadge.tsx` — new `"use client"` component
- `src/app/events/page.tsx` — remove `now` import/prop; make event list client-freshened
- `src/components/EventsTeaser.tsx` — freshen filtered event list on client
- `src/data/event-source.ts` — remove `export const now`; consider whether static `upcomingEvents` is still needed as a server-render fallback or can be removed
- `e2e/events.spec.ts` — update TODAY/TOMORROW badge tests (likely need `page.addInitScript` to mock `Date` since badge is now client-rendered)
