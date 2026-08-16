# ADR-0002: Use Shopify Admin API for Contact Form and Email List Signup

**Date:** 2026-08-16
**Status:** Accepted
**Author:** John Riccardi

## Context

August Jones runs all product sales through a separate Shopify store (https://store.augustjones.shop). Until now, this marketing site's contact form (`functions/api/contact.ts`) and newsletter signup (`functions/api/subscribe.ts`) wrote to Resend — see ADR-0001. That split customer data across two systems: sales/customer records in Shopify, commission inquiries and newsletter leads in Resend. As a solo operator, checking two dashboards to track a lead through inquiry → quote → sale adds friction Resend's original adoption didn't anticipate. The business wants everything — inquiries, subscribers, and sales — tracked in one place: Shopify, which it already uses and knows.

## Decision

`functions/api/contact.ts` and `functions/api/subscribe.ts` now write directly to the Shopify Admin GraphQL API (2026-07) instead of Resend, via a shared client in `functions/api/_lib/shopify.ts`:

- **Contact form** (commission inquiries): find-or-create a Shopify Customer (tagged `contact-form`, form details in the note), then create a linked Draft Order with a custom line item (titled by piece type, $0.00 placeholder price) so each inquiry lands as a workable item under Orders → Drafts — Shopify's standard mechanism for made-to-order/quote workflows.
- **Newsletter signup**: find-or-create a Shopify Customer, set `emailMarketingConsent` to `SUBSCRIBED`, tag `newsletter`.

Auth is a Shopify custom app (Settings → Apps → Develop apps) with `write_customers`/`read_customers`/`write_draft_orders` scopes. As of Shopify's January 2026 Dev Dashboard app model, custom apps no longer expose a static Admin API token — instead the app gets a Client ID + Secret and exchanges them for a short-lived (24h) access token via the client-credentials grant. `createShopifyClient()` in `functions/api/_lib/shopify.ts` fetches a fresh token at the start of each request rather than caching one, since Cloudflare Pages Functions are stateless per-invocation anyway. Credentials are stored as `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET`.

This supersedes ADR-0001. The `resend` npm dependency and `RESEND_API_KEY`/`RESEND_SEGMENT_ID` env vars are removed entirely — no code path sends email on submission anymore.

## Options Considered

- **Shopify Admin API (chosen)** — consolidates all customer/lead data into the one system already used for sales; no new account or vendor relationship; draft orders map naturally onto the custom-commission quoting workflow.
- **Keep Resend** — status quo; simpler API (REST-ish SDK vs. GraphQL) and a nicer broadcast-composer UI, but perpetuates the two-dashboard split this change exists to fix.
- **Third-party form/CRM tool syncing to both Resend and Shopify** — avoids picking one system, but adds a new subscription and integration surface for a solo, pre-profit business. Rejected as unnecessary complexity.

## Consequences

- Good: Single source of truth — every inquiry and subscriber is a Shopify Customer, viewable and searchable alongside actual sales.
- Good: Commission inquiries become an actionable Draft Order queue (price it, send the invoice) instead of a one-off email that had to be manually re-entered into Shopify to convert to a sale.
- Good: Drops the `resend` npm dependency and its API key entirely.
- Resolved: the automatic "welcome email" new subscribers used to get via a Resend Automation is replaced by Shopify's native "Customer subscribed to email marketing" trigger and Welcome Series automations — `subscribe.ts` sets `consentUpdatedAt` on the marketing consent input specifically so this fires for API-driven signups. See `docs/marketing/welcome-email-guide.md`.
- Resolved: sending a one-off announcement to the list, previously done through Resend's Broadcasts UI, now goes through Shopify Email campaigns (Apps → Messaging), reusing the same branded HTML template via its "Code your own" option. See `docs/marketing/email-template-guide.md`.
- Resolved: draft orders created from the contact form were easy to miss with no notification. A Shopify Flow workflow (trigger: Draft order created, filtered to the `contact-form` tag) sends an internal email the moment one lands. See `docs/marketing/contact-form-alert-guide.md`.
- Bad: New operational dependency — the Shopify custom app's Client ID/Secret need to be created, stored in Cloudflare Pages, and rotated if they ever leak, same class of risk the old `RESEND_API_KEY` carried.
