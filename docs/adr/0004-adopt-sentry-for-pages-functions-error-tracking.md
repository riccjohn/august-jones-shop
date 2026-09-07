# ADR-0004: Adopt Sentry for Pages Functions Error Tracking

**Date:** 2026-09-06
**Status:** Accepted
**Author:** John Riccardi

## Context

The only backend is two Cloudflare Pages Functions writing to the Shopify Admin API
(ADR-0002), now optionally routed through the Fly.io relay (ADR-0003). Before this, the
sole failure signal was the client-side Umami `contact_form_error` event — a bare count
with no stack trace, no context, no alerting, and suppressible by an ad blocker. Nothing at
all alerted if the relay died. Since ADR-0003 made a Shopify write depend on a third-party
service staying alive, silent form failures became more likely, not less.

## Decision

Adopt `@sentry/cloudflare`, scoped to the two Pages Functions only (`functions/_middleware.ts`
installs `Sentry.sentryPagesPlugin`; `functions/api/_lib/error-response.ts` reports every
500 path via `captureMessage` or `captureException`). Add a Sentry uptime monitor on the
relay's `/healthz`. The frontend is deliberately not instrumented. See `docs/sentry.md` for
setup and the exact catch/no-catch boundary.

## Options Considered

- **`@sentry/cloudflare` on the Pages Functions (chosen)** — stack traces, request context,
  and alerting for every Shopify rejection path, for a free-tier account and one dependency.
- **Keep the Umami event alone** — rejected: a bare count with no stack trace and no
  alerting, and it's client-side, so an ad blocker suppresses it silently.
- **Instrument the frontend too** — deferred, not rejected: Umami already covers the
  client-side gap adequately, and skipping it keeps this change to the backend only.
- **Monitor `/verify` instead of `/healthz`** — rejected: `/verify` requires the relay's
  shared secret, and putting that credential into a third system expands its blast radius,
  a cost ADR-0003 weighs explicitly. `/healthz` is unauthenticated and proves only that the
  process is alive, which is all this monitor needs to establish.
- **Cloudflare Workers logs / Logpush** — worth noting: no alerting and limited retention,
  so it doesn't answer "is something broken right now" the way an uptime monitor and error
  tracker do.

## Consequences

- **Good:** Shopify rejection paths on both forms now report with a stack trace and request
  context, instead of only incrementing a client-side counter.
- **Good:** The relay dying now alerts, via the `/healthz` uptime monitor — nothing caught
  it before. This matters because `RELAY_URL` is set in production, so a relay outage takes
  both forms down, and the relay runs as a single machine with no redundancy.
- **Bad:** That monitor lives in Sentry, not in code — like `SENTRY_DSN` and
  `nodejs_compat`, it is invisible to code review and does not travel with the repo. A new
  Sentry account or org starts with no monitor and no alert, silently.
- **Bad:** A new third-party dependency and account to operate.
- **Bad:** The `nodejs_compat` compatibility flag is a deploy-order hazard: without it,
  `_middleware.ts` fails to load and **both forms return 500**, not just the one being
  monitored, and this is a runtime failure that a green deploy doesn't catch. See
  `docs/sentry.md` for why.
- **Bad:** Both required settings (`SENTRY_DSN`, `nodejs_compat`) are dashboard-only config,
  invisible to code review and easy to forget when standing up a new environment.
- **Bad:** Two known blind spots remain — payload-validation 400s are deliberately not
  reported (would flood Sentry with bot traffic from the honeypot), and client-side failures
  never reach the function at all. Both tracked in issue #104.
- **Bad:** `captureMessage` groups Sentry issues by message text. Any Shopify message that
  embeds an email address or an ID would fragment into one issue per submission instead of
  grouping — worth watching once real events land.
- **Mitigated:** `@sentry/cloudflare`'s default `httpServerIntegration` attaches the raw
  request body to every event — including `captureMessage`/`captureException` — regardless
  of `sendDefaultPii`, which would have sent full contact-form/signup submissions (name,
  email, message) to Sentry on every routine Shopify rejection. `functions/_middleware.ts`
  sets `maxRequestBodySize: "none"` to disable this.
