# ADR-0003: Move Shopify Admin API Calls to a Fly.io Backend for a Static Egress IP

**Date:** 2026-09-03
**Status:** Proposed
**Author:** John Riccardi

## Context

`functions/api/contact.ts` and `functions/api/subscribe.ts` (Cloudflare Pages Functions) call the Shopify Admin API via `functions/api/_lib/shopify.ts` (ADR-0002). Since issue #89, Shopify's WAF intermittently returns a 403 HTML bot-challenge page instead of JSON for these calls. Confirmed via direct testing and Shopify support (`701bc3b`): this is IP-reputation-based bot scoring, and Cloudflare Pages Functions' shared, multi-tenant egress IPs are the risk factor — not a request-format or auth bug. A retry-with-backoff mitigation is deployed (`701bc3b`, widened in `fefc9c9` to 5 attempts / ~4.5s worst case) but remains probabilistic: the contact form has already been rerouted to Shopify's own custom-orders page as a workaround (#93), and email signup has been hidden behind a feature flag since launch (`EMAIL_SIGNUP_ENABLED = false`, `src/lib/config.ts`) because `/api/subscribe` has no equivalent fallback. Research (`.light/sessions/shopify-stable-egress-ip-research.md`) found no fix available on either vendor's side: Shopify has no Admin API IP-allowlisting mechanism, and its only bot-mitigation program (Web Bot Auth, May 2026) is explicitly scoped to the Storefront API. Cloudflare's own static-egress-IP product (Dedicated CDN Egress IPs) is a Cloudflare One/Enterprise add-on with no published pricing — not viable at this business's scale. August Jones is a solo, pre-profit business; ADR-0001 and ADR-0002 both explicitly weigh "new operational dependency" as a real cost, and today the project has zero infrastructure to operate beyond Cloudflare's managed git-push pipeline.

## Decision

We will move the Shopify-calling logic to a small, always-on backend service on Fly.io with a dedicated static egress IP (`fly ips allocate-egress`), and have Cloudflare Pages proxy `/api/contact` and `/api/subscribe` to it. `functions/api/_lib/shopify.ts` is already fully portable (plain `fetch`, no Cloudflare-specific bindings) and moves unchanged; only the thin HTTP handler wrapper and deploy tooling are new. The existing retry/backoff logic in `shopify.ts` stays in place as defense-in-depth — a dedicated IP still needs to build reputation with Shopify's WAF over an unpublished timeline, so early requests could still occasionally be challenged.

## Options Considered

- **Fly.io, always-on, static egress IP (chosen)** — ~$5.62/mo ($2.02 compute + $3.60 egress IP); dedicated (not shared) IP; git-connected deploy (`flyctl deploy` + GitHub Actions) closest to the project's existing git-push habit; no OS patching.
- **Hetzner CX23 / DigitalOcean Basic Droplet VPS** — marginally cheaper (~$4–6/mo) with a static IP included by default, but shifts OS patching, uptime monitoring, and service management onto the solo maintainer — real recurring toil a managed platform absorbs.
- **Railway Pro** — $20/mo (incl. $20 usage credit); simpler all-in-one setup, but the included static IP is *shared* across other Railway tenants, not dedicated, and costs ~3.5x more than Fly.io for a weaker guarantee.
- **Stay on Cloudflare, buy a dedicated egress IP** — Cloudflare's Dedicated CDN Egress IPs require a Cloudflare One/Enterprise plan (no published pricing, effectively $5k+/mo); ruled out as unaffordable.
- **Do nothing further / rely on retry-backoff indefinitely** — status quo; already proven insufficient (contact form rerouted, email signup can't launch). Rejected as not solving the actual problem.
- **Render + third-party static-IP proxy (QuotaGuard)** — ~$26/mo across two vendors; Render's native static-IP feature hasn't shipped. Rejected as more expensive and more complex than Fly.io.
- **AWS Lambda + NAT Gateway + Elastic IP** — $70–150+/mo in practice; disproportionate cost and complexity (VPC/subnet/routing setup) for two low-traffic JSON endpoints. Rejected.

## Consequences

- Good: Contact form and newsletter signup submissions to Shopify become reliable rather than probabilistic, once the dedicated IP builds WAF reputation.
- Good: Email signup can finally launch (`EMAIL_SIGNUP_ENABLED` flip) — the flag and every gated UI surface are already wired and tested, so re-enabling is a one-line change once the new backend is verified.
- Good: `shopify.ts` and its retry logic move unchanged; migration surface is two thin HTTP handlers plus 3 existing env vars (`SHOPIFY_STORE_DOMAIN`, `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`).
- Bad: New operational dependency — a second hosted account, its own billing (~$5.62/mo), a new deploy pipeline (GitHub Actions + `flyctl`), and a new secret (Fly API token) to manage. This is a genuinely new category of ops for a project that currently has none beyond Cloudflare's managed pipeline.
- Bad: No published timeline for how long Shopify's WAF takes to build trust in a new dedicated IP — requires an observation period after cutover before concluding the fix worked, during which occasional bot-challenges (caught by existing retries) may still occur.
- Open: routing mechanism (Cloudflare Pages proxy/rewrite vs. a direct cross-origin fetch from the frontend to the Fly.io host) is not decided by this ADR and needs to be resolved during implementation planning.

## Advice

- [John Riccardi, 2026-09-03]: Asked whether Fly.io was really the only option ≤$6/mo during research review — confirmed Hetzner/DigitalOcean VPS options are comparably priced but were excluded for shifting patching/monitoring burden onto the maintainer, not for cost. Fly.io was kept as the recommendation on that basis.
