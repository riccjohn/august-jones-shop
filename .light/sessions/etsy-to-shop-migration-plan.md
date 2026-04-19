# Plan: Etsy → Shop Migration

**tracker: yaks**
**Status:** Draft
**Research artifact:** `.light/sessions/etsy-to-shop-migration-research.md`

---

## Context

The August Jones shop has migrated from Etsy to a standalone Shopify store at `https://store.augustjones.shop`. The codebase still contains Etsy URLs, Shopify-named identifiers (from an old Etsy era), and the analytics function is named `trackShopifyClick` while tracking Etsy clicks. All of this needs to be reconciled to reflect the new reality: a platform-agnostic "shop" and the new store URL.

Key decisions from research:
- Analytics event name `shopify_store_click` **preserved** to retain Umami historical data continuity; only the TypeScript function name changes
- Component `ShopifyCtaButton` → `ShopCtaButton` (file rename + import updates)
- UTM parameters are platform-agnostic — preserve as-is
- `docs/social-media-strategy.md` gets a light update: mark the "Move to Shopify" milestone as done, leave historical analysis intact

---

## Goal

Replace all Etsy/Shopify-specific identifiers and URLs throughout the codebase with platform-agnostic "shop" naming and update the store URL to `https://store.augustjones.shop`, so the codebase accurately reflects the current platform.

---

## Acceptance Criteria

- [ ] `src/lib/analytics.ts` exports `trackShopClick` (not `trackShopifyClick`), still emits `"shopify_store_click"` event (preserved for historical data)
- [ ] `ShopifyCtaButton.tsx` renamed to `ShopCtaButton.tsx`, export renamed
- [ ] All component files link to `https://store.augustjones.shop`
- [ ] No remaining `ETSY_SHOP_URL` constants in source
- [ ] JSON-LD structured data uses new URL in `sameAs` and product `url` fields
- [ ] "View all on Etsy ↗" copy updated to "View all in shop ↗" on home page
- [ ] E2E tests pass against new URLs and event names
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0

---

## Files to Create

_(none — only modifications)_

---

## Files to Modify

### Phase 1 — Analytics core
- `src/lib/analytics.ts` — rename function + event name

### Phase 2 — Components
- `src/components/ShopifyCtaButton.tsx` → `src/components/ShopCtaButton.tsx` (rename file)
- `src/components/SiteNav.tsx`
- `src/components/FooterShopLink.tsx`
- `src/components/EventListClient.tsx`
- `src/components/ProductGalleryLink.tsx`
- `src/components/ProductGallerySchema.tsx`
- `src/app/page.tsx`
- `src/app/about/page.tsx`
- `src/app/layout.tsx`

### Phase 3 — E2E tests
- `e2e/landing-page.spec.ts`
- `e2e/analytics.spec.ts`

### Phase 4 — Documentation
- `CLAUDE.md`
- `README.md`
- `docs/analytics.md`
- `docs/social-media-strategy.md`

---

## Implementation Phases

### Phase 1 — Analytics Core `[no-test]`

**Goal:** Update the single source of truth for analytics before anything else imports it.

**Tasks:**
- In `src/lib/analytics.ts`: rename `trackShopifyClick` → `trackShopClick`; **keep** event string `"shopify_store_click"` unchanged

**Verification:**
- `pnpm exec tsc --noEmit` exits 0
- `pnpm lint` exits 0
- `grep -r "trackShopifyClick" src/lib/` returns empty

#### Agent Context

```
Files to modify:
  - src/lib/analytics.ts

Changes:
  - Rename exported function: trackShopifyClick → trackShopClick
  - Keep event name string "shopify_store_click" unchanged

Test command: pnpm exec tsc --noEmit && pnpm lint

GREEN gate: tsc and lint both exit 0; no remaining "trackShopifyClick" in src/lib/

Constraints:
  - Do NOT disable or ignore any linter rules
  - Do NOT add biome-ignore comments
  - Do NOT commit changes
```

---

### Phase 2 — Components + App Pages `[no-test]`

**Goal:** Rename the CTA button component, update all import sites, update all store URLs, and fix user-visible copy.

**Tasks:**
- Rename `src/components/ShopifyCtaButton.tsx` → `src/components/ShopCtaButton.tsx`; rename exported component `ShopifyCtaButton` → `ShopCtaButton`; update component's href to `https://store.augustjones.shop`
- `src/components/SiteNav.tsx`: rename constant `ETSY_SHOP_URL` → `SHOP_URL`; update URL; rename import `trackShopifyClick` → `trackShopClick`
- `src/components/FooterShopLink.tsx`: update href URL; rename import/call `trackShopifyClick` → `trackShopClick`
- `src/components/EventListClient.tsx`: update both href URLs; rename import/calls `trackShopifyClick` → `trackShopClick`
- `src/components/ProductGalleryLink.tsx`: rename import/call `trackShopifyClick` → `trackShopClick`
- `src/components/ProductGallerySchema.tsx`: update URL in JSON-LD structured data
- `src/app/page.tsx`: rename constant `ETSY_SHOP_URL` → `SHOP_URL`; update URL; rename import `ShopifyCtaButton` → `ShopCtaButton`; update copy "View all on Etsy ↗" → "View all in shop ↗" (×2)
- `src/app/about/page.tsx`: rename import `ShopifyCtaButton` → `ShopCtaButton`
- `src/app/layout.tsx`: update URL in JSON-LD `sameAs` field

**Verification:**
- `pnpm exec tsc --noEmit` exits 0
- `pnpm lint` exits 0
- `grep -r "ShopifyCtaButton\|ETSY_SHOP_URL\|etsy\.com\|trackShopifyClick" src/` returns empty
- Browser: home page CTA links to `https://store.augustjones.shop`

#### Agent Context

```
Files to modify:
  - src/components/ShopifyCtaButton.tsx → src/components/ShopCtaButton.tsx (git mv)
  - src/components/SiteNav.tsx
  - src/components/FooterShopLink.tsx
  - src/components/EventListClient.tsx
  - src/components/ProductGalleryLink.tsx
  - src/components/ProductGallerySchema.tsx
  - src/app/page.tsx
  - src/app/about/page.tsx
  - src/app/layout.tsx

URL to use for store: https://store.augustjones.shop
New component name: ShopCtaButton (file: src/components/ShopCtaButton.tsx)
New analytics function import: trackShopClick (from @/lib/analytics)
New constant name: SHOP_URL (replaces ETSY_SHOP_URL)
New copy: "View all in shop ↗" (replaces "View all on Etsy ↗")

Test command: pnpm exec tsc --noEmit && pnpm lint

GREEN gate: tsc and lint both exit 0; grep for ShopifyCtaButton, ETSY_SHOP_URL, etsy.com, trackShopifyClick returns empty in src/

Constraints:
  - UTM parameters (utm_source, utm_medium, utm_campaign) must be preserved
  - Use git mv for the file rename (not cp + delete)
  - Do NOT disable or ignore any linter rules
  - Do NOT commit changes
```

---

### Phase 3 — E2E Tests `[no-test]`

**Goal:** Update test assertions to match new URLs and event names so the test suite passes cleanly.

**Tasks:**
- `e2e/landing-page.spec.ts`: update hero CTA URL regex and footer link URL to `store.augustjones.shop`
- `e2e/analytics.spec.ts`: update test names / descriptions referencing "Shopify/Etsy" where appropriate; `"shopify_store_click"` event name assertions **stay unchanged**

**Verification:**
- `pnpm test:e2e` passes in all browsers (chromium, firefox, webkit)

#### Agent Context

```
Files to modify:
  - e2e/landing-page.spec.ts
  - e2e/analytics.spec.ts

Changes:
  - landing-page.spec.ts: update URL assertions from etsy.com → store.augustjones.shop
  - analytics.spec.ts: keep "shopify_store_click" event name assertions unchanged; update only test description strings that reference Shopify/Etsy if they're misleading

Test command: pnpm test:e2e

GREEN gate: all tests pass in chromium, firefox, and webkit

Constraints:
  - Do NOT modify test logic or add/remove test cases
  - Only update URL strings and event name strings
  - Do NOT commit changes
  - WebKit quirk: navigator.sendBeacon bodies are NOT captured by Playwright network interception in webkit — if the existing analytics tests already handle this via page.addInitScript spy, preserve that pattern
```

---

### Phase 4 — Documentation `[no-test]`

**Goal:** Update docs to reflect current platform reality.

**Tasks:**
- `CLAUDE.md`: update "Etsy store" → "shop"; update store URL; update "Shopify clicks" → "shop clicks"
- `README.md`: update "Etsy shop" → "shop"
- `docs/analytics.md`: update tracking function name/event in reference table; "Shopify clicks" → "shop clicks"
- `docs/social-media-strategy.md`: mark "Strategic Milestone: Move to Shopify" checklist items as done where appropriate; leave historical analysis paragraphs intact (they provide decision context)

**Verification:**
- `grep -ri "etsy\|shopify" CLAUDE.md README.md docs/analytics.md` returns only appropriate historical/contextual references

#### Agent Context

```
Files to modify:
  - CLAUDE.md
  - README.md
  - docs/analytics.md
  - docs/social-media-strategy.md

Changes:
  - CLAUDE.md, README.md, docs/analytics.md: mechanical find-and-replace of Etsy/Shopify names per research
  - docs/social-media-strategy.md: light update only — mark completed milestones as done; preserve historical analysis paragraphs

Test command: grep -ri "etsy\|shopify" CLAUDE.md README.md docs/analytics.md

GREEN gate: grep returns only clearly historical/contextual references (no actionable Etsy URLs or Shopify function names)

Constraints:
  - docs/social-media-strategy.md: DO NOT delete historical context — only update action item state
  - Do NOT commit changes
```

---

## Constraints & Considerations

- **No linter suppression:** Do not add `biome-ignore` or any suppression comments. Fix issues properly.
- **No commits:** Do not commit at any phase. User will commit explicitly.
- **UTM preservation:** Keep all UTM parameters (`utm_source=augustjones&utm_medium=website&utm_campaign=*`) unchanged.
- **Analytics event name preserved:** `shopify_store_click` stays as the emitted event to maintain Umami historical data continuity. Only the TS function name changes.
- **JSON-LD accuracy:** The `sameAs` and product `url` fields in structured data must reflect the new URL for SEO.
- **TypeScript strict mode:** Project uses strict TS. All imports must resolve after the file rename.

---

## Out of Scope

- Umami dashboard configuration or event renaming in the Umami UI
- Changing UTM parameter values
- Any new features or design changes
