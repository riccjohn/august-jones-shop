# ADR-0001: Use Resend Contacts/Segments for Email List Signup

**Date:** 2026-08-13
**Status:** Proposed
**Author:** John Riccardi

## Context

August Jones needs a direct email channel to potential customers — marketing campaigns, physical market/event announcements, and drop announcements — rather than relying solely on Instagram. The site is a static Next.js export deployed to Cloudflare Pages, where server-side logic runs only as Pages Functions under `functions/api/`, not Next.js API routes. An earlier attempt (PR #22) integrated Kit/ConvertKit via a Next.js Route Handler, which doesn't run under static export. The business is solo and pre-profit, so added cost and operational surface area both count against any option. Resend is already integrated (`RESEND_API_KEY`) for contact-form email delivery.

## Decision

We will capture email signups through a new `functions/api/subscribe.ts` Pages Function that adds contacts to a Resend Segment via `resend.contacts.create()`, reusing the existing Resend account and API key rather than adopting a separate email marketing platform.

## Options Considered

- **Resend Contacts/Segments** — reuse the existing Resend account/API key; no new service.
- **Kit (ConvertKit)** — PR #22's original approach; dedicated ESP with richer automation, but requires a new account and was never actually signed up for.
- **Buttondown** — nicer non-technical campaign-composition UI, but free tier caps at 100 subscribers before $9/mo.
- **Store emails only (custom DB/KV), decide on a sender later** — lowest short-term effort, but defers compliance (unsubscribe handling) and duplicates work later.

## Consequences

- Good: No new account, secret, or npm dependency — `resend` is already installed and `RESEND_API_KEY` already configured in Cloudflare Pages.
- Good: Follows the same Pages Function pattern as `functions/api/contact.ts`, avoiding the static-export/Route-Handler mismatch that stalled PR #22.
- Good: Resend's free tier (3,000 emails/mo) comfortably covers list-sending volume at current business scale.
- Bad: Resend's broadcast/campaign UI is less full-featured for non-technical sending than a dedicated newsletter tool like Buttondown or Kit.
- Bad: Contact form delivery and list-signup delivery now share one Resend account/API key as a single point of dependency.
- Bad: Migrating to a different ESP later would require exporting contacts out of Resend.
