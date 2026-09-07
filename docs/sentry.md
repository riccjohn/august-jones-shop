# Sentry Setup

## Overview

**Sentry** covers two unrelated things here, both under one account:

1. **Error tracking** for the two Cloudflare Pages Functions — `functions/api/contact.ts`
   and `functions/api/subscribe.ts` — whenever a Shopify write fails. Backend only; the
   Next.js frontend is deliberately not instrumented.
2. **Uptime monitoring** for the Fly.io relay's `/healthz` endpoint.

**These two setups share nothing except the Sentry account.** The uptime monitor needs no
DSN, no compatibility flag, no code, and no Cloudflare settings — it's a URL Sentry pings
on a timer. Do either one first, or split them between two people; neither depends on the
other.

## What's already in the code

Done, as of PR #92 — nothing to write, this is here so the setup steps below make sense.

`functions/_middleware.ts` installs `Sentry.sentryPagesPlugin`, reading the DSN from
`context.env.SENTRY_DSN`, and wraps every request under `functions/`.
`functions/api/_lib/error-response.ts` provides the two helpers every 500 path in both
handlers goes through: `errorResponse(error)` reports a Shopify `userErrors` string via
`Sentry.captureMessage(error, "error")`, and `caughtErrorResponse(err)` reports a thrown
exception via `Sentry.captureException(err)`. Both return a 500 JSON response either way.

| File | Purpose |
|---|---|
| `functions/_middleware.ts` | Installs the Sentry plugin, reads `SENTRY_DSN` |
| `functions/api/_lib/error-response.ts` | `errorResponse` / `caughtErrorResponse` helpers |

## Setup 1: Error tracking for the Pages Functions

1. **Create the Sentry project.** Name it `august-jones-functions` — Setup 2's uptime
   monitor is configured under that project name, so using anything else here means
   updating it there too. Platform: **Cloudflare Workers** — not Next.js, even though the
   site is Next.js, because what's being instrumented is the Pages Functions backend,
   which runs on the Workers runtime. The only thing you need off the post-creation
   screen is the **DSN** (also findable later at Settings → Projects → `<project>` →
   Client Keys (DSN)). Do not add a payment method — see Cost.

2. **Set `SENTRY_DSN`** in Cloudflare. Workers & Pages → august-jones-shop → Settings →
   **Variables and secrets**. Server-only, no `NEXT_PUBLIC_` prefix. See `.env.example`.

   The Settings page is scoped to whichever environment the **"Choose Environment"**
   dropdown (top left) is set to. Set the variable under Production, then switch that
   dropdown to Preview and set it again — this is what "configured separately" means in
   practice, and setting one while assuming both is the easy mistake.

3. **Set the `nodejs_compat` compatibility flag.** Workers & Pages → august-jones-shop →
   Settings → **Runtime** (this is also where the compatibility date lives). Set it under
   Production, then flip the "Choose Environment" dropdown to Preview and set it again.

   Cloudflare used to call this section "Functions" — Sentry's docs and older guides still
   say that. It is "Runtime" as of September 2026.

   **Why:** the Workers runtime isn't Node.js — it ships web-standard APIs and none of
   Node's builtins by default. `@sentry/cloudflare` does a top-level
   `require('node:async_hooks')` (`build/cjs/async.js`) to get `AsyncLocalStorage`, which
   is how it knows which request is in flight so it can attach context to an error. That's
   the only Node builtin the SDK needs at runtime — `node:fs` and `node:path` also appear
   in the package, but only under `build/cjs/vite/`, which is build tooling that never
   executes in the Worker. Sentry's own setup guide documents this same requirement but
   tells you to put it in `wrangler.json`/`wrangler.toml`; this repo has neither, so it
   goes in the dashboard instead. While on that screen, note the compatibility date:
   Sentry's example pairs the flag with `2024-09-23`; an older date gives `nodejs_compat`
   v1, which still provides `AsyncLocalStorage`, so it should work either way.

   **Why it matters more than it looks:** `_middleware.ts` sits at the root of
   `functions/`, so it wraps every function beneath it. Without the flag, the module fails
   to load and the middleware throws before any handler runs — **both forms return 500**,
   not just the one you were trying to monitor. This is a *runtime* failure: the deploy
   goes green either way, and you only find out by exercising a form. Contrast a missing
   `SENTRY_DSN`, which fails safe — the SDK just initializes disabled and the functions run
   normally. The two settings have very different risk profiles. (`nodejs_als` is a
   narrower flag providing only `AsyncLocalStorage` and would technically suffice, but
   `nodejs_compat` is what Sentry documents and is the recommended choice.)

4. **Redeploy.** Cloudflare bakes environment variables and compatibility flags into a
   deployment at build time — neither setting does anything until the next deploy. To
   redeploy without a code change: Workers & Pages → august-jones-shop → Deployments →
   latest → `⋯` → **Retry deployment**. Do not push an empty commit for this — `main` is
   protected. (Cloudflare reorganizes its dashboard periodically, so these menu paths may
   drift; the settings themselves are what matter.)

5. **Verify.** On **Preview only**, temporarily set `RELAY_URL` to a bogus hostname.
   `shopify.ts` then fails its fetch, throws, and hits `caughtErrorResponse` →
   `captureException`. Submit the contact form on that preview deploy, confirm the event
   lands in Sentry, then remove the override. This exercises the real shipping error path
   rather than a planted `throw`. A green deploy proves nothing here — a missing
   `nodejs_compat` flag is a runtime failure, not a build one.

## Setup 2: Uptime monitor for the relay

Needs nothing from Setup 1 beyond a Sentry account — no DSN, no compatibility flag, no
Cloudflare changes.

1. **Create the monitor** at sentry.io/monitors/new/, with:

   | Field | As configured |
   |---|---|
   | Project / Environment | `august-jones-functions` / `production` |
   | URL | `https://august-jones-relay.fly.dev/healthz` |
   | Method | `GET` |
   | Headers | none — the point of using `/healthz` |
   | Interval | `Every 1 minute` (options: 1, 5, 10, 20, 30 min, 1 hour) |
   | Timeout | `5s` (`/healthz` answers in ~95ms) |
   | Assertions | Status Code `> 199` and `< 300` |
   | Failure threshold | `3` consecutive → alerts after ~3 min of downtime |
   | Recovery threshold | `3` consecutive → resolves after ~3 min of uptime |
   | Allow Sampling | off — keeps uptime checks off the span quota |

   The 1-minute interval costs nothing extra on the free plan; it's one monitor at any
   interval. Recovery at 3 rather than 1 stops a single blip from flapping the issue
   closed.

   Put the mitigation steps in the monitor's **Describe** field, not only here — that text
   renders on the issue itself, which is what you actually read when paged. See "When the
   alert fires" below for the content.

2. **Add an Alert.** Creating the monitor does not notify anyone by itself — Sentry raises
   an issue on downtime, but a separate Alert matching uptime/downtime issues, with an
   email or Slack action, is what actually reaches a human. This is the easiest step to
   miss, and skipping it produces a monitor that silently records outages nobody hears
   about.

**Do not point the monitor at `/verify`.** It exercises Shopify end to end but requires the
relay's shared secret, and putting that credential into a third system expands its blast
radius — a cost ADR-0003 weighs explicitly. `/healthz` is unauthenticated and never
contacts Shopify, so it's an alive-or-not signal only. Deeper failures — the relay up but
failing — surface as thrown exceptions in the Pages Function via `captureException` (Setup
1), which is better signal anyway.

### When the alert fires

`RELAY_URL` is set in Cloudflare production, so the relay is load-bearing: if it is down,
both forms are down with it. It also runs as a **single machine** (scaled to 1 via
`fly scale count`, per ADR-0003 — machine count isn't expressible in `fly.toml` itself),
so there is no redundancy to absorb a host problem or a bad deploy.

The immediate mitigation is the ADR-0003 rollback: delete `RELAY_URL` in Cloudflare
(Settings → Variables and secrets, under both Production and Preview) and redeploy. Shopify calls
go direct again with no code change, and the forms work while the relay is fixed. Full
procedure: `relay/README.md` → Rolling back.

That is a stopgap, not a fix — running direct restores the exposure to Shopify's WAF
bot-challenge that the relay exists to avoid (ADR-0003), so put the relay back once it is
healthy.

Expect two signals for the same outage: this uptime alert, and Sentry exceptions from
Setup 1 as the Pages Functions' fetches to the relay fail and hit `captureException`.

`relay/fly.toml` sets `auto_stop_machines = "off"` and `auto_start_machines = false`, so
the relay never sleeps — a failed check is a real failure, not a cold start, so the alert
can be trusted without second-guessing. Fly already health-checks `/healthz` every 15s
(same file), but that only restarts or flags the machine and never notifies anyone; the
Sentry monitor is what closes that loop.

## What Sentry does and does not catch

| Caught (both forms, all Shopify rejection paths) | Not caught |
|---|---|
| `userErrors` on `customerCreate`/`customerUpdate` | Payload validation failures (400) |
| `userErrors` on `draftOrderCreate` | Client-side failures (network drop, ad blocker, Cloudflare outage) |
| Shopify returned no customer object (contact form) | `subscribe.ts`'s null-customer path (can return 200 on a failed signup) |
| GraphQL top-level `errors` | |
| Response with no `data` | |
| Access-token exchange failure | |
| WAF/bot-challenge HTML after all retries | |
| Per-attempt timeout | |
| Relay misconfigured or unreachable | |

The 400 gap is deliberate: the honeypot rejection returns `false` from `isContactPayload`,
so reporting every 400 would flood Sentry with bot traffic. The cost is that a
frontend/backend contract drift (a renamed field, say) breaks the form 100% of the time
while Sentry stays silent — tracked in issue #104.

Client-side failures never reach the function at all, so Sentry has nothing to report. The
Umami `contact_form_error` event (`src/lib/analytics.ts:37`) remains the signal there —
Sentry does not replace Umami, it covers the gap Umami can't see (server-side detail, with
alerting).

## Cost

This runs on Sentry's free **Developer** plan, and the setup is sized to stay there:
5,000 errors/month, **1 uptime monitor** (the `/healthz` check uses it), 1 cron monitor,
1 user seat, 30-day retention. The plan carries no payment method, so exceeding a quota
drops events for the rest of the month rather than generating a bill.

Two things would change that:

- **Adding `tracesSampleRate`** to the `sentryPagesPlugin` config in
  `functions/_middleware.ts`. Performance tracing is the quota that actually gets
  expensive; it is off by default and currently unset, so no spans are consumed.
- **A second person needing access** — the free plan is a single seat. That is the
  constraint that would push this to a paid tier, not error volume.
