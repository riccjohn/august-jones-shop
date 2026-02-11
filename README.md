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

The site uses **Cloudflare Web Analytics** for privacy-first tracking (no cookies, no consent banner required).

### 1. Get Your Analytics Token

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to your domain → **Analytics & Logs** → **Web Analytics**
3. If you haven't set up Web Analytics yet:
   - Click **"Add a site"**
   - Enter your site name (e.g., "August Jones")
   - Choose **"Automatic setup"** (we'll use the token manually)
4. You'll see a code snippet with a token like:
   ```html
   <script defer src='https://static.cloudflareinsights.com/beacon.min.js'
           data-cf-beacon='{"token": "abc123def456ghi789"}'></script>
   ```
5. Copy just the token value (e.g., `abc123def456ghi789`)

### 2. Configure Local Development

Create a `.env.local` file in the project root (it's already gitignored):

```bash
NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=abc123def456ghi789
```

Replace `abc123def456ghi789` with your actual token from step 1.

### 3. Configure Production (Cloudflare Pages)

1. Go to your Cloudflare Pages project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable for **Production**:
   - **Variable name:** `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN`
   - **Value:** Your token from step 1
   - Click **Save**
4. (Optional) Add the same variable for **Preview** environment to track preview deployments

### 4. Verify Setup

After deploying:

1. Visit your live site and interact with it (click links, navigate pages)
2. Wait 5-10 minutes for data to appear
3. Check **Cloudflare Dashboard** → **Analytics & Logs** → **Web Analytics**
4. Verify you see:
   - Page views and visitor counts
   - Custom events: `shopify_store_click`, `instagram_click`
   - Traffic sources and geographic data

### What Gets Tracked

**Automatic (built-in):**
- Page views and unique visitors
- Traffic sources (direct, social, search, referral)
- Geographic distribution
- Devices, browsers, operating systems
- Session duration

**Custom Events:**
- `shopify_store_click` — When users click "Shop Now" CTA
- `instagram_click` — When users click Instagram links (includes location: "hero" or "footer")
- `contact_form_submit` — When contact form is submitted (future)

All tracking is privacy-first, fully anonymous, and GDPR/CCPA compliant by default.

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
