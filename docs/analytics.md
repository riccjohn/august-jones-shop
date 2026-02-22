# Analytics Setup

## Overview

The site uses **Umami Cloud** for analytics — pageviews, referrers, UTM campaigns, countries, devices, and custom event tracking (Shopify clicks, Instagram clicks, email clicks) via a shareable web dashboard.

## Architecture

```
Client click → trackXxxClick() → window.umami.track(eventName, eventData)
                                         ↓
                              Umami Cloud (cloud.umami.is)
                                         ↓
                              Umami Dashboard (shareable URL)
```

## Tracked Events

| Function | Event Name | Key `source` Values |
|---|---|---|
| `trackShopifyClick(source)` | `shopify_store_click` | `hero`, `footer`, `gallery_*` |
| `trackInstagramClick(location)` | `instagram_click` | `hero`, `footer` |
| `trackEmailClick()` | `email_click` | — |

Umami automatically captures: page URL, referrer, UTM params (`utm_source`, `utm_medium`, `utm_campaign`), browser, OS, device type, and country.

## Umami Cloud Setup (one-time)

### 1. Create an account and add the site

1. Sign up at https://cloud.umami.is/signup
2. Add website → copy the **Website ID** (a UUID)

### 2. Add environment variables

In `.env.local` (local development):

```
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-uuid
```

In Cloudflare Pages (production): **Workers & Pages → august-jones-shop → Settings → Environment Variables → Add variable**:
- Variable: `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- Value: your Website ID

### 3. Redeploy

Redeploy the Cloudflare Pages project for the environment variable to take effect.

## Viewing the Dashboard

Log in at https://cloud.umami.is to see:
- Pageviews, unique visitors, bounce rate
- Top pages, referrers, UTM campaigns
- Countries, browsers, devices
- Custom events (Shopify clicks, Instagram clicks, email clicks) with their properties

Umami supports sharing a read-only dashboard link — useful for giving August access without a login.

## Local Development

The Umami script is only injected when `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set. Without it, the script is not included and `window.umami` is undefined — the tracking functions guard against this and exit silently. The same silent-drop applies in production during the brief window between page load and Umami script execution (`afterInteractive` strategy); this is an intentional trade-off to avoid blocking page render.

The Playwright tests stub `window.umami` before page load and block the real Umami script, so no account is needed to run tests:

```bash
pnpm test:e2e e2e/analytics.spec.ts
```

## Key Files

| File | Purpose |
|---|---|
| `src/lib/analytics.ts` | Client-side tracking functions |
| `src/app/layout.tsx` | Umami script tag |
| `e2e/analytics.spec.ts` | Playwright tests |
