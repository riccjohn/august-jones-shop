# Analytics Setup

## Overview

The site uses two complementary Cloudflare analytics layers:

- **Cloudflare Web Analytics** (in `layout.tsx`) — passive pageview tracking, bounce rate, Core Web Vitals. No setup needed beyond the beacon script.
- **Analytics Engine** (this doc) — server-side custom event tracking with full query access via SQL API. Captures where customers come from and what they click.

## Architecture

```
Client click → trackEvent() → navigator.sendBeacon('/api/analytics', JSON)
                                      ↓
              functions/api/analytics.ts (Cloudflare Pages Function)
              Enriches with: referer, country, city, device type
              Writes to Analytics Engine dataset
                                      ↓
              scripts/query-analytics.mjs → SQL queries via CF API
```

## Tracked Events

| Function | Event Name | Key `source` Values |
|---|---|---|
| `trackShopifyClick(source)` | `shopify_store_click` | `hero`, `footer`, `gallery_*` |
| `trackInstagramClick(location)` | `instagram_click` | `hero`, `footer` |
| `trackEmailClick()` | `email_click` | — |

All events also capture the current page path, UTM params, and a timestamp.

## Data Schema (Analytics Engine)

| Field | Content | Example |
|---|---|---|
| `index1` | Event name (shard key) | `shopify_store_click` |
| `blob1` | Event name | `shopify_store_click` |
| `blob2` | Source / location | `hero`, `gallery_jackets` |
| `blob3` | Page path | `/` |
| `blob4` | Referer URL | `https://instagram.com/…` |
| `blob5` | Country code | `US` |
| `blob6` | City | `Madison` |
| `blob7` | utm_source | `instagram` |
| `blob8` | utm_medium | `bio` |
| `blob9` | utm_campaign | `spring_drop` |
| `blob10` | Device type | `mobile` |
| `blob11` | Full user agent | `Mozilla/5.0 …` |

## Cloudflare Dashboard Setup (one-time)

> **Note:** You do not need to manually create the dataset. It is created automatically the first time an event is written after the binding is configured.

### 1. Add the binding to your Pages project

In the Cloudflare dashboard:

**Build > Compute > Workers & Pages > august-jones-shop > Settings > Bindings**

Click **Add** → **Analytics engine**, then set:
- Variable name: `ANALYTICS`
- Dataset: `august_jones_analytics`

Save, then redeploy the project for the binding to take effect.

### 2. Create an API token (only needed for terminal queries)

**My Profile (top-right avatar) > API Tokens > Create Token > Custom Token**

- Permission: `Account Analytics: Read`
- Copy the token — you'll only see it once

### 3. Add to `.env.local` (only needed for terminal queries)

Create `.env.local` in the project root (already gitignored):

```
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_token_from_step_2
AE_DATASET_NAME=august_jones_analytics
```

Your account ID is shown in the right sidebar of the Cloudflare dashboard homepage.

## Querying Data

```bash
# Show available queries
node scripts/query-analytics.mjs

# Events in last 7 days
pnpm query:analytics event-counts

# Where Shopify clicks came from (hero/footer/gallery)
pnpm query:analytics shopify-sources

# UTM / referrer breakdown
pnpm query:analytics traffic-sources

# Clicks by country
pnpm query:analytics top-countries

# Full multi-dimension breakdown
pnpm query:analytics all-events
```

Note: data appears in Analytics Engine within ~1–5 minutes of events being written.

## Local Development

The `/api/analytics` endpoint only exists when deployed to Cloudflare Pages. Locally, `sendBeacon` requests will 404 silently — this is expected and won't break anything.

The Playwright tests mock the endpoint with `page.route('/api/analytics', ...)` so they work without a live deployment:

```bash
pnpm test:e2e e2e/analytics.spec.ts
```

## Key Files

| File | Purpose |
|---|---|
| `src/lib/analytics.ts` | Client-side tracking functions |
| `functions/api/analytics.ts` | Pages Function (server-side ingestion) |
| `functions/tsconfig.json` | Separate TS config for Workers runtime |
| `scripts/query-analytics.mjs` | SQL query runner |
| `e2e/analytics.spec.ts` | Playwright tests (7 tests, no live endpoint needed) |
