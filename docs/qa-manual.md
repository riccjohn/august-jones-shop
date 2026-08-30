# Manual QA Checklist

Agent-runnable QA protocol for the August Jones marketing site. Execute this using Playwright MCP browser tools before shipping any significant change.

**When to run:** Before opening a PR that touches UI, navigation, analytics, or the contact form.

**Screenshots:** Save all screenshots to `.playwright-mcp/screenshots/YYYY-MM-DD/` using today's date. Use descriptive filenames (`home-hero-light.png`, `mobile-menu-open.png`, etc.).

**Color scheme note:** The site supports both light and dark via `prefers-color-scheme` CSS. As of writing, the design uses a dark charcoal background in both modes (there is no manual toggle). Test both anyway — if a future update adds a toggle or a distinct light mode, both tests will catch regressions. Emulate color scheme with `page.emulateMedia({ colorScheme: 'dark' | 'light' })` or equivalent MCP call before navigating.

**Reporting:** After each section, report pass ✓ / fail ✗ / skip (with reason). At the end, produce a single summary table.

---

## 0. Pre-flight

Before any browser checks:

- [ ] Confirm the dev server is running at `http://localhost:3000` (run `pnpm dev` if not)
- [ ] Verify no TypeScript errors: `pnpm exec tsc --noEmit`
- [ ] Verify linter passes: `pnpm lint`

---

## 1. Console Errors — All Pages

For each URL below, navigate to it and check the browser console for errors or warnings. Any `[Error]` or unhandled promise rejection is a **fail**.

| URL | Expected |
|-----|----------|
| `http://localhost:3000/` | No errors |
| `http://localhost:3000/about` | No errors |
| `http://localhost:3000/contact` | No errors |

Take one screenshot per page showing the page loaded (no need to screenshot the console unless there's an error).

---

## 2. Home Page — Light Mode

Navigate to `http://localhost:3000/`. Emulate `colorScheme: 'light'` before navigating.

**2.1 Hero section**
- [ ] H1 contains "Upcycled Fashion For Every Fan" (line breaks collapse in the accessible name)
- [ ] Eyebrow text reads "Madison, WI — Handmade since 2025"
- [ ] Hero product image (jackets.webp) is visible and not broken
- [ ] "One of One" badge is visible on desktop viewport (≥1024px)
- [ ] "Shop Now" CTA button is present → `href` contains `etsy.com/shop/TheAugustJonesShop` and `utm_campaign=shop_cta`
- [ ] Screenshot: `home-hero-light.png`

**2.2 Collection section**
- [ ] Section heading reads "The Collection"
- [ ] All 6 product categories are present: Jackets, Hoodies, Vests, Sweatpants, T-Shirts, Accessories
- [ ] Each gallery link goes to Etsy with a `utm_campaign=gallery_*` param
- [ ] "View all on Etsy ↗" is visible (desktop; hidden on mobile — see Section 7)
- [ ] Screenshot: `home-collection-light.png`

**2.3 Brand statement**
- [ ] Stats strip shows: "200+", "1", "0" with labels "Pieces Reimagined", "Designer", "Duplicates"
- [ ] No layout overflow or broken columns

**2.4 Instagram CTA section**
- [ ] Heading reads "@augustjonesshop"
- [ ] "Follow on Instagram" button is present → `href="https://instagram.com/augustjonesshop"`, `target="_blank"`, `rel="noopener noreferrer"`
- [ ] Screenshot: `home-instagram-cta-light.png`

---

## 3. Home Page — Dark Mode

Reload at `http://localhost:3000/` with `colorScheme: 'dark'`.

- [ ] Hero section renders without layout or text contrast issues
- [ ] Collection section renders correctly (eggshell bg `#f6f4f0` — verify it's still distinct from dark sections)
- [ ] Brand statement section renders correctly
- [ ] Instagram CTA section renders correctly
- [ ] Screenshot: `home-hero-dark.png`

---

## 4. About Page — Light Mode

Navigate to `http://localhost:3000/about`. Emulate `colorScheme: 'light'`.

**4.1 Hero**
- [ ] H1 visible and contains "Made by Hand. Every Single One."
- [ ] Eyebrow reads "The brand"

**4.2 Story section**
- [ ] Story image (Polly.webp) loads and is not broken
- [ ] Story text is present (look for "August Jones was founded to rethink fan gear.")
- [ ] Screenshot: `about-story-light.png`

**4.3 How It's Made**
- [ ] Three steps present: "01 Source", "02 Reimagine", "03 Finish"
- [ ] Each step has descriptive body text

**4.4 Commissions section**
- [ ] Yellow accent section is visible (bg-accent)
- [ ] Heading reads "Looking for a custom piece?"
- [ ] "Get in Touch" button links to `/contact`
- [ ] Screenshot: `about-commissions-light.png`

**4.5 Shop CTA section**
- [ ] Heading reads "Shop the Collection"
- [ ] "Shop Now" CTA is present with correct Etsy href

---

## 5. About Page — Dark Mode

Reload at `http://localhost:3000/about` with `colorScheme: 'dark'`.

- [ ] Story section renders without contrast or layout issues
- [ ] Yellow commissions section still distinct against surrounding sections
- [ ] Screenshot: `about-dark.png`

---

## 6. Contact Page — Light Mode

Navigate to `http://localhost:3000/contact`. Emulate `colorScheme: 'light'`.

**6.1 Page content**
- [ ] H1 reads "Get in Touch"
- [ ] Commission callout box is present ("Custom Commissions Are Open")
- [ ] Form heading reads "Send a Message"

**6.2 Form fields**
- [ ] Name input is visible and enabled (label: "Name")
- [ ] Email input is visible and enabled (label: "Email")
- [ ] Message textarea is visible and enabled (label: "Tell me about your jersey")
- [ ] Submit button reads "Request a Custom" and is enabled
- [ ] Screenshot: `contact-form-light.png`

**6.3 Form submission — success state**

Submit the form with valid data (the `/api/contact` endpoint requires a running Cloudflare Pages worker; if unavailable, mock the route to return `{ status: 200 }` and verify the success UI):

- [ ] After successful submission, form is replaced by "Request Received" confirmation
- [ ] Confirmation includes copy about responding within 2–3 days
- [ ] Screenshot: `contact-success-light.png`

**6.4 Form submission — error state**

Mock `/api/contact` to return `500` and submit:

- [ ] Error message appears: "Something went wrong. Try emailing customs@augustjones.shop directly."
- [ ] The email link in the error is correct (`mailto:customs@augustjones.shop`)
- [ ] Form is not replaced (fields remain)
- [ ] Screenshot: `contact-error-light.png`

**6.5 Direct email link**
- [ ] Email link `contact@augustjones.shop` is visible below the form
- [ ] `href` is `mailto:contact@augustjones.shop`

---

## 7. Navigation

Test at desktop viewport (1280px wide) and mobile (390px wide).

**7.1 Desktop nav**
- [ ] Logo visible on the left → clicking it navigates to `/`
- [ ] "About" link visible → navigates to `/about`
- [ ] "Contact" link visible → navigates to `/contact`
- [ ] "Shop" CTA button → `href` contains `etsy.com/shop/TheAugustJonesShop` and `utm_campaign=nav`, `target="_blank"`
- [ ] Hover state on "About" and "Contact": yellow underline slides in from left
- [ ] Screenshot: `nav-desktop.png`

**7.2 Mobile nav (390px viewport)**
- [ ] Logo is centered between hamburger (left) and Shop button (right)
- [ ] Desktop nav links (About, Contact) are NOT visible
- [ ] Hamburger button is visible with aria-label "Open menu"
- [ ] Click hamburger → mobile menu opens with links: Home, About, Contact
- [ ] aria-expanded on hamburger button is `true` when open
- [ ] Click any mobile nav link → menu closes and page navigates correctly
- [ ] Click hamburger again → menu closes (X icon changes back to hamburger)
- [ ] Screenshot: `nav-mobile-closed.png`, `nav-mobile-open.png`

**7.3 Sticky nav behavior**
- [ ] On load, nav background is transparent (over the dark hero)
- [ ] After scrolling down >32px, nav gains solid bg with backdrop blur
- [ ] Screenshot (scrolled): `nav-scrolled.png`

---

## 8. Footer — All Pages

Check the footer on `/` (same markup appears on all pages).

- [ ] August Jones logo is visible and links to `/`
- [ ] Brand tagline: "Hand-made, one-of-a-kind upcycled sports fashion. Made in Madison, WI."
- [ ] Navigate column: Shop Now, About, Contact — all correct links
- [ ] Connect column: Instagram link (`https://instagram.com/augustjonesshop`, `target="_blank"`), email link (`mailto:hello@augustjones.shop`)
- [ ] Copyright line: "© 2026 August Jones. All rights reserved."
- [ ] "Made with love in Madison, WI" tagline
- [ ] Screenshot: `footer.png`

---

## 9. External Link Destinations

These checks verify the actual URL destinations, not just the `href` attribute. For each link, confirm the URL is correct without navigating away (inspect the `href`; no need to follow the link in the browser and lose the session).

| Location | Expected href |
|----------|--------------|
| Nav "Shop" CTA | `https://www.etsy.com/shop/TheAugustJonesShop?utm_source=augustjones&utm_medium=website&utm_campaign=nav` |
| Hero "Shop Now" | `https://www.etsy.com/shop/TheAugustJonesShop?utm_source=augustjones&utm_medium=website&utm_campaign=shop_cta` |
| Footer Shop Now | `https://www.etsy.com/shop/TheAugustJonesShop` |
| Collection "View all on Etsy" (desktop) | `…utm_campaign=collection_header` |
| "Follow on Instagram" | `https://instagram.com/augustjonesshop` |
| Footer Instagram | `https://instagram.com/augustjonesshop` |
| Footer email | `mailto:hello@augustjones.shop` |
| Contact page email | `mailto:contact@augustjones.shop` |
| Contact error email | `mailto:customs@augustjones.shop` |

---

## 10. Mobile Layout — 390px Viewport

Set viewport to 390×844 (iPhone 14 size). Check each page.

**Home**
- [ ] Hero image (desktop-only) is hidden — only text content shows
- [ ] CTA button is full-width or stacked correctly
- [ ] Collection grid is single-column
- [ ] "View all on Etsy ↗" header link is hidden; mobile footer link is visible
- [ ] Instagram section stacks vertically (not side-by-side)
- [ ] Screenshot: `mobile-home.png`

**About**
- [ ] Story section: image and text stack vertically
- [ ] How It's Made: 3 steps stack vertically with bottom borders (not side borders)
- [ ] Screenshot: `mobile-about.png`

**Contact**
- [ ] Form name/email fields stack vertically (not 2-col grid)
- [ ] Submit button is full-width
- [ ] Screenshot: `mobile-contact.png`

---

## 11. SEO & Structured Data

Navigate to `http://localhost:3000/` and inspect `<script type="application/ld+json">` tags.

- [ ] At least 2 JSON-LD script tags present
- [ ] One contains `"@type":"LocalBusiness"` with `"addressLocality":"Madison"`, `"addressRegion":"WI"`, and `"hello@augustjones.shop"`
- [ ] One contains `"@type":"ItemList"` with `"@type":"Product"` entries
- [ ] Page `<title>` is "August Jones | Upcycled Fashion for Every Fan"
- [ ] `/about` page title contains "About | August Jones"
- [ ] `/contact` page title contains "Contact | August Jones"
- [ ] Canonical `<link rel="canonical">` is present on each page

---

## 12. Self-Update Check

**Run this at the end of every QA session.** The purpose is to keep this checklist in sync with the actual codebase.

1. Read `src/app/` — list all subdirectories. Each subdirectory with a `page.tsx` is a page route. Compare against the pages covered in this document (`/`, `/about`, `/contact`). If a new page exists, add a section for it above.

2. Read `src/components/` — look for new interactive components (forms, buttons with `onClick`, tracked links). Compare against components tested in Sections 2–9. If a new component is not covered, add a test step for it in the relevant page section.

3. Check `src/lib/analytics.ts` for new `track*` functions. Each tracking function should have a corresponding step in the relevant page section verifying the element is present.

4. If any updates are made to this document, note them at the bottom of the QA run summary: "Checklist updated: added [X] for [reason]."

---

## QA Run Summary Template

Copy and fill in after completing a run:

```
## QA Run — YYYY-MM-DD

**Runner:** [agent or human]
**Branch:** [branch name]
**Base URL:** http://localhost:3000

| Section | Result | Notes |
|---------|--------|-------|
| 0. Pre-flight | ✓/✗ | |
| 1. Console errors | ✓/✗ | |
| 2. Home (light) | ✓/✗ | |
| 3. Home (dark) | ✓/✗ | |
| 4. About (light) | ✓/✗ | |
| 5. About (dark) | ✓/✗ | |
| 6. Contact (light) | ✓/✗ | |
| 7. Navigation | ✓/✗ | |
| 8. Footer | ✓/✗ | |
| 9. External links | ✓/✗ | |
| 10. Mobile layout | ✓/✗ | |
| 11. SEO / structured data | ✓/✗ | |
| 12. Self-update check | ✓ (no changes) / Updated | |

**Screenshots saved to:** `.playwright-mcp/screenshots/YYYY-MM-DD/`

**Issues found:**
- [list any failures with description and screenshot reference]

**Checklist updates made:**
- [list any additions/removals made during self-update check, or "none"]
```
