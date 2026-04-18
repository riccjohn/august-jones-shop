# Research: Upcoming Events Page
_Feature: Add pop-up/market event listings to augustjones.shop_
_Date: 2026-04-15_

---

## Feature Summary

Add ~5 upcoming pop-up/market events to the August Jones site. Each event is a 1–3 day engagement (outdoor markets, pop-ups inside existing stores, etc.). Events are scheduled over the next few months. Traffic is primarily mobile via Instagram bio link. Must support local SEO for Madison WI, Milwaukee WI, and Chicago IL.

---

## Codebase Findings

### Existing Page Structure
- Routes: `/` (home), `/about`, `/contact` — all in `src/app/`
- Each page exports `metadata` (or `generateMetadata`) with title, description, canonical
- `sitemap.ts` lists all routes — must add `/events`
- `next.config.ts` has `trailingSlash: true` (static export)

### Navigation Integration Points
- `src/components/SiteNav.tsx` — `NAV_LINKS` array, add `{ label: "Events", href: "/events", key: "events" }`
- `src/components/Footer.tsx` — "Navigate" column, add Events link
- Nav clicks tracked via `trackNavClick(key)` from `src/lib/analytics.ts`

### Design System
- **Colors:** `--background` (dark charcoal ~#222), `--foreground` (eggshell #f6f4f0), `--primary`/`--accent` (yellow #ffb612)
- **Eggshell sections:** `bg-[#f6f4f0]` with `text-[#222]` — used for collection and shop CTA sections
- **Sharp corners:** `--radius-sm: 0rem` — streetwear/drop culture aesthetic, minimal rounding
- **Custom easing:** `--ease-brand: cubic-bezier(0.77, 0, 0.175, 1)` for all transitions

### Typography Utilities (globals.css)
- `.text-eyebrow` — Geist Mono, uppercase, 0.25em tracking (use for date/location labels)
- `.text-display` — Bebas Neue, `leading-none`, `tracking-wider` (section/card headings)
- `.text-hero` — Bebas Neue, massive, set via inline `clamp()` (page hero only)
- `.text-editorial` — Instrument Serif italic (descriptive copy)

### Existing Schema (layout.tsx)
- `LocalBusiness` schema already present with `@id: "https://www.augustjones.shop/#localbusiness"`
- New `Event` schema should reference this via `organizer: { "@type": "LocalBusiness", "@id": "..." }`

### Data Pattern
- All content is hardcoded in page files (no CMS, no JSON files)
- **Recommended:** `src/data/events.ts` — typed TypeScript array of event objects; edit file to add/update events. If volume grows significantly, a headless CMS could be introduced later.

### Reusable Components Available
- `GrainOverlay` — texture for dark hero sections
- `ProductGalleryLink` — editorial card pattern: image-first, minimal type, no card wrapper, hover scale
- `Button` (shadcn, CVA) — variants include `brand`, `brand-outline`, `outline`
- `ShopifyCtaButton` — tracked Etsy CTA with animated arrow

---

## UX & Design Recommendations

### Page Architecture: Both Dedicated Page + Homepage Teaser
**Confidence: High**

- **`/events` page** — single page listing all upcoming events; required for Event rich results in Google Search
- **Homepage teaser** — show next 1–2 upcoming events with "See all events →" link, placed **below the product gallery**; critical because Instagram bio traffic lands on home, not /events

Individual event pages (`/events/[slug]`) are overkill for this scale — use a single `/events` page with all events listed inline. Add all Event schema as a JSON-LD array in the page `<head>`.

### Layout: Stacked Event Cards (not a calendar grid)
**Confidence: High**

- Calendar grid = wrong pattern for sparse events (mostly empty, poor mobile UX)
- Pure text list = undersells a fashion brand
- **Stacked full-width cards** (one per event, chronological) — premium feel, scans in <3 seconds on mobile
- Optional: group under time headers ("This Month" / "Next Month") rather than raw dates alone

### Event Card Fields
**Core (always include):**
- Event name (market/pop-up name)
- Date — human-friendly format: "Saturday, May 10, 2026"
- Time — start + end: "10am – 4pm"
- Location — venue name + city (not raw address)
- Short description — 1–2 sentences, what's special about this one
- Link to event's website
- "Get Directions" CTA — deep-links to Apple/Google Maps
- "Add to Calendar" button (secondary)

**Optional enhancements:**
- Venue/market photo (not always available; fall back to a brand/product photo)
- Instagram story/reel link for that event
- "Free to attend" or "Limited pieces" badge

**Skip:** full address lines, ticket info, organizer credit

### Add-to-Calendar
**Confidence: High**

Use `add-to-calendar-button-react` npm package:
- Supports Google, Apple, Outlook, Yahoo + auto `.ics`
- Works in Instagram in-app browser (documented — critical for this audience)
- Free for commercial use (ELv2 license)
- Set timezone: `America/Chicago`

### Past Events Handling
**Decision:** Auto-hide events approximately 1 week after their end date.

Implementation: computed at render time — filter events where `endDate + 7 days < today`. No database or manual editing needed. If the events list is empty, show a "Check back soon" state. Events are not deleted from `events.ts`, just filtered from display.

### Mobile-First Priorities
**Confidence: High** (audience is primarily mobile via Instagram)

- Full-width cards, no columns on mobile
- Date/time displayed **first**, visually dominant — users scan for "can I make it?"
- "Get Directions" → native maps deep-link (not text address)
- Add-to-Calendar is secondary CTA, below directions
- No modals for event detail — all info inline on card
- Keep Etsy "Shop Now" CTA visible from events page (nav or persistent); events page is not the final destination

---

## SEO Recommendations

### Structured Data: `schema.org/Event`
**Confidence: High**

Required fields for Google rich results eligibility:
- `name`, `startDate` (ISO-8601 with timezone), `location` (nested `Place` with full `PostalAddress`), `organizer` (link to existing `LocalBusiness @id`)

Also include: `endDate`, `eventStatus: EventScheduled`, `eventAttendanceMode: OfflineEventAttendanceMode`, `image`, `offers` (price: 0, so Google knows it's free/public)

Embed as JSON-LD in `<head>` of `/events` page — array format for multiple events.

### Page Metadata Pattern
```
Title: "Upcoming Events & Pop-Ups | August Jones"
Description: "Find August Jones at pop-ups and markets in Madison WI, Milwaukee WI, and Chicago IL. One-of-one upcycled sports streetwear. Check the schedule and add events to your calendar."
Canonical: /events
```

For OG: include a brand/product image (1200×630). Matters for Instagram shares.

### Sitemap
Add to `sitemap.ts`:
```ts
{ url: "https://www.augustjones.shop/events", changeFrequency: "weekly", priority: 0.8 }
```

### Target Keywords
- `Madison WI pop-up shop` / `Milwaukee WI pop-up shop` / `Chicago pop-up shop`
- `upcycled sports fashion Madison WI`
- `handmade streetwear Wisconsin`
- `reworked jerseys Milwaukee` / `female-owned fashion brand Madison WI`
- `[specific market name] vendors`

---

## Recommended Implementation Plan

### Data Model (`src/data/events.ts`)
```ts
interface AugustJonesEvent {
  id: string
  name: string           // display name: "August Jones at Mad City Makers Market"
  marketName: string     // just the market name: "Mad City Makers Market"
  startDate: string      // ISO-8601: "2026-05-10T10:00:00-05:00"
  endDate: string        // ISO-8601: "2026-05-10T16:00:00-05:00"
  venueName: string
  city: string           // "Madison, WI" | "Milwaukee, WI" | "Chicago, IL"
  address: { street: string; city: string; state: string; zip: string }
  mapsUrl: string        // Google Maps link
  eventWebsiteUrl: string // link to the market/event's own website
  description: string
  image?: string         // optional venue/market photo path
  instagramUrl?: string  // link to IG story/reel for this event
}
```

Auto-filter logic (computed at render):
```ts
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
const upcomingEvents = events.filter(
  e => new Date(e.endDate).getTime() + ONE_WEEK_MS > Date.now()
)
```

### Files to Create
- `src/data/events.ts` — typed event data array + filter utility
- `src/app/events/page.tsx` — events page with metadata + Event schema JSON-LD
- `src/components/EventCard.tsx` — reusable card component
- `src/components/EventsSchema.tsx` — JSON-LD structured data (follow `ProductGallerySchema` pattern)

### Files to Update
- `src/components/SiteNav.tsx` — add Events to `NAV_LINKS`
- `src/components/Footer.tsx` — add Events link to Navigate column
- `src/app/sitemap.ts` — add `/events` entry
- `src/app/page.tsx` — add homepage teaser section below product gallery (next 1–2 events)

### Package to Add
```
pnpm add add-to-calendar-button-react
```

### Empty State
If all events have passed (filtered list is empty), `/events` should show:
- "No upcoming events right now — check back soon" message
- Link to Instagram for the latest announcements
- Link to Etsy store
