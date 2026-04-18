# Research: Etsy → Shop Migration

**Feature:** Replace all Etsy/Shopify-specific references with platform-agnostic "shop" naming and update store URL to `https://store.augustjones.shop`

---

## Affected Files

### Source Code

| File | What needs changing |
|------|---------------------|
| `src/lib/analytics.ts` | Rename `trackShopifyClick` → `trackShopClick`; rename event `"shopify_store_click"` → `"shop_click"` |
| `src/components/ShopifyCtaButton.tsx` | Rename file → `ShopCtaButton.tsx`; rename export `ShopifyCtaButton` → `ShopCtaButton`; update URL; update comment |
| `src/components/SiteNav.tsx` | Rename `ETSY_SHOP_URL` → `SHOP_URL`; update URL; rename import `trackShopifyClick` → `trackShopClick` |
| `src/components/FooterShopLink.tsx` | Update href URL; rename import/call `trackShopifyClick` → `trackShopClick` |
| `src/components/EventListClient.tsx` | Update both href URLs; rename import/calls `trackShopifyClick` → `trackShopClick` |
| `src/components/ProductGalleryLink.tsx` | Rename import/call `trackShopifyClick` → `trackShopClick` |
| `src/components/ProductGallerySchema.tsx` | Update URL in JSON-LD structured data |
| `src/app/page.tsx` | Rename `ETSY_SHOP_URL` → `SHOP_URL`; update URL; rename import `ShopifyCtaButton` → `ShopCtaButton`; update copy "View all on Etsy ↗" → "View all in shop ↗" (×2) |
| `src/app/about/page.tsx` | Rename import `ShopifyCtaButton` → `ShopCtaButton` |
| `src/app/layout.tsx` | Update URL in JSON-LD `sameAs` field |

### E2E Tests

| File | What needs changing |
|------|---------------------|
| `e2e/landing-page.spec.ts` | Update expected hero CTA URL regex; update expected footer link URL |
| `e2e/analytics.spec.ts` | Update test names; update `"shopify_store_click"` assertions → `"shop_click"` (×3) |

### Documentation

| File | What needs changing |
|------|---------------------|
| `CLAUDE.md` | "Etsy store" → "shop"; update URL; "Shopify clicks" → "shop clicks" |
| `README.md` | "Etsy shop" → "shop" |
| `docs/analytics.md` | Update tracking function name/event in reference table; "Shopify clicks" → "shop clicks" |
| `docs/social-media-strategy.md` | Many Etsy/Shopify references — these are strategic notes, leave platform-specific context intact where it's historical/contextual; update actionable items to reflect Shopify migration complete |

---

## Key Decisions

### Analytics event name: `shopify_store_click` → `shop_click`

**⚠️ Breaking change for historical analytics.** Umami Cloud will show a new event name starting now; historical data under `shopify_store_click` remains but won't merge with the new name. This is unavoidable and acceptable — the old name was wrong anyway (it tracked Etsy clicks while named for Shopify).

### Component rename: `ShopifyCtaButton` → `ShopCtaButton`

File rename required (`ShopifyCtaButton.tsx` → `ShopCtaButton.tsx`). Two pages import it (`page.tsx`, `about/page.tsx`). Straightforward.

### UTM parameters

Current UTM params (`utm_source=augustjones&utm_medium=website&utm_campaign=*`) are platform-agnostic and should be **preserved as-is**. Only the base URL changes.

### `docs/social-media-strategy.md`

This doc contains strategic analysis written when the shop was on Etsy (e.g. "Move to Shopify" section, Etsy pixel instructions). Since the Shopify migration is now complete, the "Strategic Milestone: Move to Shopify" section and Etsy-specific action items are outdated. Recommended: update the action items checklist to reflect done state; leave historical analysis paragraphs as-is (they provide useful context for why decisions were made).

### JSON-LD structured data (`layout.tsx`, `ProductGallerySchema.tsx`)

The `sameAs` and product `url` fields in JSON-LD need to reflect the new store URL for SEO accuracy. This is important — search engines use these to validate the business's identity.

---

## Change Count Summary

- **9** hardcoded Etsy URLs to replace
- **10+** `trackShopifyClick` call sites to rename
- **3** `ShopifyCtaButton` import/usage sites to rename
- **2** user-visible "View all on Etsy ↗" strings to update
- **3** e2e test assertions on event name to update
- **4+** documentation files to update

---

## Suggested Approach

1. Update `analytics.ts` first (single source of truth for the event/function name)
2. Update all component files that import from `analytics.ts`
3. Rename `ShopifyCtaButton.tsx` → `ShopCtaButton.tsx` and update all imports
4. Update URLs in all components
5. Update e2e tests to match new URLs and event names
6. Update docs

All changes are mechanical find-and-replace except the `docs/social-media-strategy.md` doc, which needs a judgment call on what to preserve.
