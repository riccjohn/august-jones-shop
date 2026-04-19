# Session: Etsy → Shop Migration
**Date:** 2026-04-18
**Branch:** 38-switch-to-shopify

---

## Research Summary

Research artifact: `.light/sessions/etsy-to-shop-migration-research.md`

Key findings:
- Analytics event name `shopify_store_click` preserved to retain Umami historical data continuity; only the TypeScript function name changes
- Component `ShopifyCtaButton` → `ShopCtaButton` (file rename + import updates)
- UTM parameters are platform-agnostic — preserved as-is
- `docs/social-media-strategy.md` gets a light update: mark the "Move to Shopify" milestone as done, leave historical analysis intact

---

## Plan Summary

**Goal:** Replace all Etsy/Shopify-specific identifiers and URLs with platform-agnostic "shop" naming and the new store URL `https://store.augustjones.shop`.

**Phases:**
1. Analytics Core — rename `trackShopifyClick` → `trackShopClick` in `src/lib/analytics.ts`
2. Components + App Pages — rename `ShopifyCtaButton` → `ShopCtaButton`, update all imports, URLs, copy
3. E2E Tests — update URL assertions from `etsy.com` → `store.augustjones.shop`
4. Documentation — update CLAUDE.md, README.md, docs/analytics.md, docs/social-media-strategy.md

**Acceptance Criteria:**
- `src/lib/analytics.ts` exports `trackShopClick`, still emits `"shopify_store_click"` event
- `ShopifyCtaButton.tsx` renamed to `ShopCtaButton.tsx`
- All component files link to `https://store.augustjones.shop`
- No remaining `ETSY_SHOP_URL` constants in source
- JSON-LD structured data uses new URL in `sameAs` and product `url` fields
- "View all on Etsy ↗" copy updated to "View all in shop ↗"
- E2E tests pass (120/120)
- `pnpm exec tsc --noEmit` exits 0
- `pnpm lint` exits 0 (2 pre-existing warnings unrelated)

---

## Execution Log

```
[DISPATCHED] no-test: Update analytics.ts — agent type: agent-no-test, mode: sync
[GATE PASS] no-test: Update analytics.ts — GREEN gate passed
[CLOSED] no-test: Update analytics.ts

[DISPATCHED] no-test: Rename component and update all imports and URLs — agent type: agent-no-test, mode: sync
[GATE PASS] no-test: Rename component and update all imports and URLs — GREEN gate passed
[CLOSED] no-test: Rename component and update all imports and URLs

[DISPATCHED] no-test: Update e2e test URLs and descriptions — agent type: agent-no-test, mode: sync
[GATE PASS] no-test: Update e2e test URLs and descriptions — GREEN gate passed (120/120 tests)
[CLOSED] no-test: Update e2e test URLs and descriptions

[DISPATCHED] no-test: Update documentation files — agent type: agent-no-test, mode: sync
[GATE PASS] no-test: Update documentation files — GREEN gate passed
[CLOSED] no-test: Update documentation files
```

---

## Outcome

- **Final test suite:** 120/120 passing (chromium, firefox, webkit)
- **TypeScript:** `pnpm exec tsc --noEmit` exits 0
- **Lint:** `pnpm lint` exits 0 (2 pre-existing warnings in globals.css, unrelated)
- **All acceptance criteria:** Met

### Files Modified
- `src/lib/analytics.ts` — renamed `trackShopifyClick` → `trackShopClick`
- `src/components/ShopifyCtaButton.tsx` → `src/components/ShopCtaButton.tsx` (git mv)
- `src/components/SiteNav.tsx` — updated URL constant name and value, import
- `src/components/FooterShopLink.tsx` — updated store URL
- `src/components/EventListClient.tsx` — updated store URLs (×2)
- `src/components/ProductGalleryLink.tsx` — updated analytics import
- `src/components/ProductGallerySchema.tsx` — updated URL in structured data
- `src/app/page.tsx` — updated import, constant, URLs, copy (×2)
- `src/app/about/page.tsx` — updated import and component usage
- `src/app/layout.tsx` — updated `sameAs` URL in JSON-LD
- `e2e/landing-page.spec.ts` — updated URL assertions
- `CLAUDE.md` — updated store references
- `README.md` — updated store references
- `docs/analytics.md` — updated function name and event references
- `docs/social-media-strategy.md` — marked migration milestones as done
