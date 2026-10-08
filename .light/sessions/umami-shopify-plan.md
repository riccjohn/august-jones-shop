# Plan: Add Umami Analytics to Shopify Store

**tracker: native**
**date: 2026-04-18**

---

## Context

The marketing site (augustjones.shop) already uses Umami Cloud for analytics with a `NEXT_PUBLIC_UMAMI_WEBSITE_ID` env var and `window.umami.track()` custom events. The Shopify store (store.augustjones.shop) has no analytics today.

Research findings:
- Umami can be installed on Shopify by injecting the `<script>` snippet into `theme.liquid` before `</head>`
- Page views and UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`) are captured automatically — no extra config
- `window.umami.track()` custom events work on all storefront pages
- Checkout is sandboxed by Shopify (PCI compliance) — scripts from `theme.liquid` don't execute there; out of scope for now
- The Shopify store needs its own separate Umami website ID (different from the marketing site)

---

## Goal

Install Umami analytics on store.augustjones.shop so that page views and UTM campaign data from marketing site links can be measured in the Umami Cloud dashboard.

---

## Acceptance Criteria

- [ ] store.augustjones.shop has its own website registered in Umami Cloud
- [ ] Visiting a product or collection page on the store records a page view in Umami
- [ ] Clicking through from augustjones.shop with `?utm_campaign=gallery_vests` shows that UTM data in Umami
- [ ] No errors in browser console related to Umami on storefront pages

---

## Out of Scope

- Checkout page tracking (Shopify sandbox — requires Custom Pixels + manual fetch to Umami API)
- Custom `window.umami.track()` events on Shopify product pages (can be added later)
- Any changes to the augustjones.shop marketing site repo

---

## Implementation Phases

### Phase 1 — Register Shopify store in Umami Cloud [no-test]

**Goal:** Get a new Umami website ID for store.augustjones.shop.

**Tasks:**
1. Log in to Umami Cloud (cloud.umami.is)
2. Add a new website: name = "August Jones Shop", domain = `store.augustjones.shop`
3. Copy the generated Website ID (a UUID)

**Verification:**
- [ ] New website appears in Umami Cloud dashboard
- [ ] Website ID copied and ready

#### Agent Context
- **Who does this:** Manual step — user performs in Umami Cloud UI
- **Output:** Website ID UUID to use in Phase 2

---

### Phase 2 — Add Umami script to Shopify theme.liquid [no-test]

**Goal:** Inject the Umami tracking snippet into the Shopify store theme so it loads on every storefront page.

**Tasks:**
1. In Shopify Admin → Online Store → Themes → current theme → Edit code
2. Open `Layout/theme.liquid`
3. Paste the Umami script snippet before `</head>`:
   ```html
   <script
     defer
     src="https://cloud.umami.is/script.js"
     data-website-id="PASTE-WEBSITE-ID-HERE"
     data-domains="store.augustjones.shop"
   ></script>
   ```
4. Replace `PASTE-WEBSITE-ID-HERE` with the UUID from Phase 1
5. Save the file

**Verification:**
- [ ] Script tag present in theme.liquid before `</head>`
- [ ] `data-website-id` matches the UUID from Umami Cloud
- [ ] `data-domains` set to `store.augustjones.shop` (prevents tracking in Shopify preview/dev)

#### Agent Context
- **Who does this:** Manual step — user performs in Shopify Admin
- **Files modified:** `theme.liquid` (in Shopify, not this repo)

---

### Phase 3 — Verify tracking is working [no-test]

**Goal:** Confirm page views and UTM data appear in Umami Cloud.

**Tasks:**
1. Open store.augustjones.shop in a browser (incognito recommended)
2. Visit the home page, a product page, and the vests collection page
3. Check Umami Cloud dashboard → the new website → Realtime or recent page views
4. Click through from augustjones.shop gallery using a vest link (which has `utm_campaign=gallery_vests`) and confirm UTM data appears under Sources in Umami

**Verification:**
- [ ] Page views show up in Umami within ~30 seconds
- [ ] UTM campaign data visible under Sources → utm_campaign
- [ ] No console errors on storefront pages

---

## Constraints & Considerations

- Use `data-domains` to prevent Umami from recording hits from Shopify's theme preview URLs
- The `defer` attribute ensures the script doesn't block page rendering (good for LCP)
- Do NOT reuse the marketing site's website ID — they should be separate properties in Umami so their data stays clean
- Umami Cloud's free tier supports multiple websites on one account
