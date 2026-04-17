# August Jones

Marketing website for **August Jones** — a solo, female-owned brand selling hand-made, one-of-a-kind, upcycled sports fashion created from upcycled NFL jerseys.

This is a [Next.js](https://nextjs.org) marketing site (not a storefront) that drives traffic to the external Etsy shop.

## Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript
- **Tailwind CSS v4** via PostCSS
- **shadcn/ui** component library (New York style)
- **Umami Cloud** for analytics
- **pnpm** as package manager

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Commands

- `pnpm dev` — Start dev server
- `pnpm build` — Production build (static export)
- `pnpm lint` — Run Biome linter
- `pnpm format` — Auto-format code with Biome
- `pnpm test:e2e` — Run Playwright e2e tests
- `pnpm test:e2e:ui` — Run Playwright tests in UI mode

## Managing Events

Upcoming events are stored in **`src/data/events.ts`** as a plain TypeScript array — no CMS or database required. To add, edit, or remove events, edit that file directly and deploy.

### Adding an event

Add a new entry to the `events` array:

```ts
{
  id: "event-slug-YYYY-MM-DD",          // unique, used as URL anchor (#event-slug-YYYY-MM-DD)
  marketName: "Market Name",            // used in the card title: "August Jones at <marketName>"
  sessions: [
    {
      startDate: "2026-09-06T10:00:00-05:00",  // ISO 8601, see datetime format note below
      endDate:   "2026-09-06T16:00:00-05:00",
    },
    // add more sessions for multi-day events
  ],
  venueName: "Venue Name",
  address: { street: "123 Main St", city: "Madison", state: "WI", zip: "53703" },
  mapsUrl: "https://maps.google.com/?q=...",
  eventWebsiteUrl: "https://example.com",  // optional — links the card title
  description: "Custom description...",   // optional — falls back to a generic blurb
  entryFeeDiscountCode: "CODE10",          // optional — displays a discount badge on the card
}
```

### Datetime format

Dates use ISO 8601 with an explicit `America/Chicago` offset:

```
YYYY-MM-DDTHH:MM:SS-05:00   ← CDT (summer, March–November)
YYYY-MM-DDTHH:MM:SS-06:00   ← CST (winter, November–March)
```

To generate these strings easily, use **[timestamp.online](https://timestamp.online)** — pick the date, time, and `America/Chicago` timezone, then copy the ISO 8601 output.

### How events are filtered

`getUpcomingEvents()` automatically hides events whose last session ended more than **one week ago** — no manual cleanup needed. Past events drop off on their own.

### TODAY / TOMORROW badge

Cards automatically show a **TODAY** or **TOMORROW** badge (yellow, top-right corner) when a session date matches the current calendar date or the next day in the `America/Chicago` timezone.

## Favicon/Icon Setup

The site uses custom favicons located in `public/`:
- `icon.svg` — SVG favicon (preferred by modern browsers)
- `icon.png` — 32x32 PNG fallback
- `apple-icon.png` — 180x180 Apple touch icon
- `favicon.ico` — Legacy ICO format (generated from icon.png)

**When to regenerate favicon.ico:**
If you update `public/icon.png` with a new design, regenerate the `.ico` file:

```bash
node scripts/generate-favicon.mjs
```

Then restart the dev server and hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux) to see changes.

> **Note:** Icons are referenced via metadata in `src/app/layout.tsx` rather than using Next.js file-based icon generation to avoid a Turbopack bug in Next.js 16.1.6.

## Analytics Setup

The site uses **Umami Cloud** for analytics — pageviews, referrers, countries, and custom event tracking (Shop Now clicks, Instagram clicks, email clicks). Configured via `NEXT_PUBLIC_UMAMI_WEBSITE_ID` in Cloudflare Pages Settings → Environment Variables.

See **[docs/analytics.md](./docs/analytics.md)** for full setup instructions and how to share the dashboard with August.

## Deployment

This site is configured for deployment on **Cloudflare Pages** as a static export.

1. Push changes to GitHub
2. Cloudflare Pages automatically builds and deploys
3. Set `NEXT_PUBLIC_UMAMI_WEBSITE_ID` in Cloudflare Pages Settings → Environment Variables (see Analytics Setup above)

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── ui/          # shadcn/ui components
└── lib/             # Utilities (analytics, etc.)
```

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and conventions.
