# August Jones

Marketing website for **August Jones** — a solo, female-owned brand selling hand-made, one-of-a-kind, upcycled sports fashion created from upcycled NFL jerseys.

This is a [Next.js](https://nextjs.org) marketing site (not a storefront) that drives traffic to the external Etsy shop.

## Tech Stack

- **Next.js 16** with App Router, React 19, TypeScript
- **Tailwind CSS v4** via PostCSS
- **shadcn/ui** component library (New York style)
- **Cloudflare Web Analytics** for tracking
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

The site uses two analytics layers:

- **Cloudflare Web Analytics** — passive pageview tracking (no cookies, no consent banner). Configured via `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` environment variable in Cloudflare Pages Settings → Variables and Secrets.
- **Analytics Engine** — queryable custom event tracking (Shop Now clicks, Instagram clicks, email clicks). Requires a one-time binding setup in Cloudflare Pages Settings → Bindings.

See **[docs/analytics.md](./docs/analytics.md)** for full setup instructions, the data schema, and how to run SQL queries against your event data.

## Deployment

This site is configured for deployment on **Cloudflare Pages** as a static export.

1. Push changes to GitHub
2. Cloudflare Pages automatically builds and deploys
3. Don't forget to set the `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` environment variable (see Analytics Setup above)

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── ui/          # shadcn/ui components
└── lib/             # Utilities (analytics, etc.)
```

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and conventions.
