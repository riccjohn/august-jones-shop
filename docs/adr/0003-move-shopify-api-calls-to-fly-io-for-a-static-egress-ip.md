# ADR-0003: Route Shopify Admin API Calls Through a Fly.io Egress Relay

**Date:** 2026-09-03
**Status:** Accepted (see Validation for what the Phase 0 probe did and did not establish)
**Author:** John Riccardi

## Context

`functions/api/contact.ts` and `functions/api/subscribe.ts` (Cloudflare Pages Functions) call the Shopify Admin API via `functions/api/_lib/shopify.ts` (ADR-0002). Since issue #89, Shopify's WAF intermittently returns a 403 HTML bot-challenge page instead of JSON for these calls. Confirmed via direct testing and Shopify support (`701bc3b`): this is IP-reputation-based bot scoring, and Cloudflare Pages Functions' shared, multi-tenant egress IPs are the risk factor — not a request-format or auth bug.

A retry-with-backoff mitigation is deployed (`701bc3b`, widened in `fefc9c9` to 5 attempts / ~4.5s worst case) but remains probabilistic, and failures past the retry window have been observed often enough to be treated as a live defect rather than a tail risk. Neither form has a working fallback. Issue #93 is often described as having "rerouted the contact form," but commit `ee2aff0` changed only outbound *links* — nav, footer, About, Sizing CTAs. The page itself was never touched: `src/app/contact/page.tsx:81` still renders `<ContactForm />` whenever `CUSTOMS_OPEN` (default `true`), and `/contact` remains in the sitemap at priority 0.7, so it stays indexed and reachable by direct URL, search result, or old link. It is a live, SEO-visible form POSTing to the flaky `/api/contact` today. Email signup is equally exposed: `EmailSignupForm` renders unconditionally on the home, join, and footer surfaces and submits live against the unreliable `/api/subscribe` path.

Each submission compounds the exposure. Every request mints a fresh OAuth access token before doing any work, so a signup is three separate Shopify round trips (token, customer lookup, customer mutation) and a contact submission is four (token, lookup, customer mutation, draft order). Each one is independently challengeable.

Research (`.light/sessions/shopify-stable-egress-ip-research.md`) found no fix on either vendor's side. Shopify has no Admin API IP-allowlisting mechanism, and its only bot-mitigation program (Web Bot Auth, May 2026) is explicitly scoped to the Storefront API. Shopify Forms is storefront-only (theme app embed, `X-Frame-Options: DENY`) and cannot be embedded here. Cloudflare's Dedicated CDN Egress IPs require a Cloudflare One/Enterprise plan with no published pricing, and are scoped to origin-facing CDN/WAF/Spectrum traffic — they do not cover outbound `fetch()` from Workers or Pages Functions, so that option would not have fixed the problem at any price.

We are trying to keep costs as low as possible. ADR-0001 and ADR-0002 both explicitly weigh "new operational dependency" as a real cost, and today the project has zero infrastructure to operate beyond Cloudflare's managed git-push pipeline.

## Scope

Both forms. An ESP was evaluated for the newsletter signup and rejected: Klaviyo was the only
candidate whose Shopify sync functioned at all, and it still keeps consent and list management
in its own dashboard while degrading the `newsletter` tag to a metafield — reintroducing the
two-dashboard split ADR-0002 exists to prevent. Evidence:
`.light/sessions/email-signup-esp-research.md`.

## Validation (2026-09-04)

**Bottom line, read first:** the probe below is inconclusive — it measured a read query that
was never reported broken, not the `customerCreate` mutation both forms actually fail on. The
decision stands on the original production evidence (issue #89, failures past the retry
window, Shopify support's IP-reputation diagnosis), not on this experiment. What follows is
the record of why the probe couldn't settle the question, kept in full because a shorter
version would hide exactly the reasoning that matters here.

The premise above — that Cloudflare's shared egress is challenged and a dedicated Fly egress
IP would not be — was tested before building anything. **It did not reproduce.**

| Vantage | Token exchange | GraphQL read |
|---|---|---|
| Laptop (control, residential IP) | 0.0% (0/100) | 0.0% (0/100) |
| Fly, dedicated egress `209.71.89.82` (ord) | 0.0% (0/100) | 0.0% (0/100) |
| Cloudflare Pages preview `2a06:98c0:3600::103` | 0.0% (0/100) | 0.0% (0/96) |

**Zero bot challenges in 396 calls across three vantages.** Against the thresholds registered
before the data was collected — PROCEED required Fly ≤2% *and* ≥5 points below Cloudflare —
the observed gap is 0 points. The result is INCONCLUSIVE (it also trips STOP): there is no
measured Cloudflare challenge rate for the relay to improve on.

Caveats, stated rather than buried:

- **Read-only calls only.** The probe issued `{ shop { name } }`, never `customerCreate` or
  `draftOrderCreate`, because it ran against the production store. Issue #89's failures were on
  mutations. The pre-registered assumption that Shopify's WAF scores reads and mutations alike
  is now the **prime suspect** — this may have measured something that was never broken.
- **Preview, not production, egress.** Cloudflare preview deployments were assumed to share
  production's egress pool and reputation. Unverified.
- **Power.** n=100 per vantage separates near-zero from ~10%; it cannot resolve 1% from 3%.
  A true rate under ~1% would be invisible here — and arguably would not justify $6.03/mo.
- **Spacing.** The protocol called for vantages hours apart; laptop and Fly ran ~6 minutes
  apart. Accepted only because both were clean: contamination could inflate a challenge rate,
  not suppress one.
- **Cloudflare GraphQL n=96, not 100.** The Workers 50-subrequest limit killed the last
  GraphQL call of each 25-iteration invocation (25×2 calls + 1 IP echo = 51). Classified as
  errors, not challenges, so the rate is unaffected.

Raw results: `.light/sessions/2026-09-04-shopify-waf-probe-results.md`. The probe harnesses,
the Fly app, and the preview deployment were all torn down after the run.

**This probe does not refute the premise, because it did not test the failing operation.**
Both forms fail on `customerCreate` mutations. The probe issued only `{ shop { name } }` reads,
because it ran against the production store and mutations were correctly forbidden. A 0%
challenge rate on an operation that was never reported broken is not evidence that the broken
operation works — it is a null result on the wrong endpoint, and the read/mutation equivalence
it depends on was flagged as an unverified assumption before the data was collected.

The decision therefore stands on the production evidence that motivated it: issue #89, the
observed failures past the retry window, and Shopify support's IP-reputation diagnosis. The
probe's value is the two facts it did establish — the Fly egress path works end to end, and a
dedicated Fly egress IP is not challenged for read traffic.

Worth re-running later against a Shopify **dev store**, where `customerCreate` can be probed
without touching production. That would measure the operation that actually fails.

## Decision

We will stand up a small, always-on **egress relay** on Fly.io holding a dedicated static egress IP (`fly ips allocate-egress`), and route Shopify Admin API traffic through it.

The relay owns the Shopify credentials. It exposes two authenticated routes behind the same shared-secret check — `POST /graphql`, which attaches its own access token and forwards the query to the configured store's Admin API, returning the upstream status and body verbatim, and `GET /verify`, a read-only no-op probe added later (see `relay/README.md`) so a cutover can be checked end to end without writing a real customer record. It mints and caches that access token itself, refreshing on expiry or on an upstream 401. It accepts no caller-supplied target host, and no route reaches any origin other than the one store domain in its own configuration.

All handlers and `_lib` modules stay on Cloudflare Pages exactly where they are. The only application change is `createShopifyClient` in `functions/api/_lib/shopify.ts`, which sends GraphQL to the relay when `RELAY_URL` is set and calls Shopify directly when it is not. Callers authenticate with a shared secret compared in constant time; the relay fails closed if that secret is unset.

The existing retry/backoff logic in `shopify.ts` is untouched and stays in place as defense-in-depth — a dedicated IP still needs to build reputation with Shopify's WAF over an unpublished timeline, so early requests could still occasionally be challenged.

## Options Considered

### Where the Shopify calls run

- **Fly.io, always-on, dedicated static egress IP (chosen)** — $6.03/mo ($2.43 always-on `shared-cpu-1x`/256MB in `ord` + $3.60 app-scoped egress IP), verified against Fly's docs 2026-09-05. **Corrected 2026-09-05:** this was first recorded as $5.62/mo ($2.02 compute). $2.02 is the `ams` price — Fly's pricing page renders a separate table per region and the compute rate carries a regional markup. `ord`, the region actually chosen here, is $2.43/mo. Note also that Fly's "month" is 30 days, so a 31-day month runs ~3% higher. App-scoped rather than cross-tenant; `flyctl deploy` is the closest match to the project's existing git-push habit; no OS patching. Note the relevant product is `fly ips allocate-egress`, not the $2/mo dedicated IPv4, which is inbound-only and irrelevant here.
- **Hetzner CX23 / DigitalOcean Basic Droplet VPS** — marginally cheaper (~$4–6/mo) with a static IP included by default, but shifts OS patching, uptime monitoring, and service management onto the solo maintainer. Rejected: ~$1/mo is not worth recurring toil.
- **Railway Pro** — $20/mo including $20 usage credit; simpler all-in-one setup, but the included static outbound IP is *shared*. Verified 2026-09-03: Railway staff state it "does not guarantee a dedicated IP - it may be shared with other customers." Rejected as ~3.5x the cost for a weaker guarantee — a smaller version of the problem being fixed.
- **Render** — native dedicated-IP product is $100/mo and requires a Pro/Scale/Enterprise plan (verified 2026-09-03). Rejected as far more expensive.
- **AWS Lambda + NAT Gateway + Elastic IP** — $70–150+/mo in practice, plus VPC/subnet/routing setup. Disproportionate for two low-traffic JSON endpoints. Rejected.
- **Stay on Cloudflare, buy a dedicated egress IP** — Enterprise-gated, and does not cover Workers/Pages `fetch()` egress regardless. Rejected as unavailable, not merely unaffordable.
- **Do nothing further; rely on retry-backoff indefinitely** — status quo, already proven insufficient. Rejected.

### How traffic reaches Fly

- **Thin egress relay behind the existing Pages Functions (chosen)** — handlers and validation stay on Cloudflare; only the outbound Shopify call is forwarded. Requires zero frontend changes, has no CORS surface at all, keeps Cloudflare's WAF in front of the public entrypoint, and leaves Fly reachable only as a secret-gated server-to-server target.
- **Port the handlers to Fly, leave passthrough shims on Cloudflare** — rejected. The Cloudflare hop is retained either way, so the port buys no architectural benefit while moving four files, rewriting two handlers, and forcing changes to `tsconfig.json`, `vitest.config.mts`, and CI. Rollback also gets worse: a `git revert` rather than unsetting an env var.
- **`_redirects` rewrite to the Fly origin** — ruled out on evidence: Cloudflare Pages cannot proxy to an external origin with a 200 status.
- **Direct cross-origin fetch from the browser, or a CNAME'd `api.augustjones.shop`** — both require CORS handling including a wildcard allowlist for unpredictable `<hash>.august-jones-shop.pages.dev` preview origins. The subdomain option additionally carries documented Fly-behind-Cloudflare TLS friction (`_fly-ownership` TXT plus Full (Strict) SSL, with recurring 525 handshake failures reported), while grey-clouding the record to avoid that forfeits Cloudflare's WAF in front of the API host. Rejected on those grounds; note the frontend tests that assert relative paths are a consequence of this choice, not a reason for it.

### Where the Shopify credentials live

- **On the relay, which mints and caches its own token (chosen)** — the client secret is never placed in a request body, so it cannot leak through a logged request or an error message that echoes a payload. It also collapses the per-submission token round trip into a 24h cache, removing the OAuth endpoint from the hot path entirely and cutting challengeable requests per submission from three to two (signup) and four to three (contact).
- **On Cloudflare, with the relay as a generic URL forwarder** — rejected. Forwarding `fetchShopifyJson` wholesale means the OAuth exchange, `client_id` and `client_secret` included, transits the relay on every single submission. It also makes the relay a general-purpose proxy whose safety depends on a target-host allowlist, rather than a service with one fixed destination.

### Recovery when the relay is unreachable (issue #97, revisited 2026-09-07)

- **Do nothing beyond the existing retry/backoff; rely on manual rollback (chosen)** — `fetchShopifyJson`'s 5-attempt retry only covers a response that comes back but fails to parse as JSON (`NonJsonShopifyResponseError`); a `fetch()` that throws outright — relay unreachable, machine stopped, network blip — isn't caught anywhere and propagates out of `createShopifyClient`, which `contact.ts`/`subscribe.ts` turn into a 500. Rollback (unsetting `RELAY_URL` in Cloudflare Pages, per `relay/README.md`) stays manual. Kept as-is.
- **Automatically retry direct against Shopify when the relay is unreachable (rejected)** — would degrade a relay outage to "flaky but functional" (today's pre-ADR-0003 baseline) instead of a hard failure. Rejected on four grounds:
  - **Double-submission risk can't be fully closed.** Both handlers do multi-step mutations (`customerCreate`/`customerUpdate`, then for contact a `draftOrderCreate`). A `fetch()` throw can mean the request never reached the relay (safe to retry) or that the relay completed the write and only the reply back failed (unsafe — a same-request direct retry would duplicate the write). Cloudflare Workers' `fetch()` doesn't reliably distinguish these. The only way to make a mutation retry safe is a re-check before retrying (e.g. re-running the customer lookup before retrying `customerCreate`), and `draftOrderCreate` has no equivalent existence check at all — so a fully safe fallback isn't achievable for the operation where the exposure is worst.
  - **Detection already exists and is fast.** A Sentry uptime check polls `august-jones-relay.fly.dev/healthz` from Sentry's external infrastructure every minute (configured in the Sentry GUI, not in this repo) and has already fired alerts. This is the specific external check the "Operating the relay" section below calls out as missing from Fly's own health check (which runs over the private network and can read healthy while unreachable from the internet) — so the "silently broken for hours" scenario that motivated this proposal is already covered by a ~1-minute-detection channel outside the code, at the cost of a manual rollback rather than an automatic one.
  - **Doubles the failure surface.** Every request would hit two independent transports instead of one.
  - **Muddies the post-cutover WAF-observation window** this ADR's Validation section depends on — if direct calls silently absorb relay failures, a successful response no longer tells you which path served the request.

  Sentry's own error monitoring for the Cloudflare Pages Functions (`august-jones-functions`) does not cover this gap on its own: both handlers already catch the relay-unreachable error and return a normal `jsonResponse({ error }, 500)`, a handled outcome rather than an uncaught exception, so it is not reported the way a genuinely uncaught throw is. (One example surfaced during this review, `SyntaxError: ... "not json" is not valid JSON`, is an uncaught exception from `context.request.json()` running before either handler's try/catch — a separate, pre-existing gap, unrelated to this decision.) The uptime check, not the error monitor, is what closes this one.

## Consequences

- **Good:** Contact form and newsletter signup submissions become reliable rather than probabilistic, once the dedicated IP builds WAF reputation.
- **Good:** Rollback is an environment variable, not a revert. Unsetting `RELAY_URL` in Cloudflare Pages restores today's flaky-but-functional direct calls without a code change or redeploy of the relay. See `relay/README.md`'s "Rolling back" section for the exact steps.
- **Good:** The migration surface is one function (`createShopifyClient`), one new service, and two new env vars (`RELAY_URL`, `RELAY_SHARED_SECRET`) alongside the 3 existing Shopify ones. No handler moves, no frontend file changes, and the retry/backoff logic is untouched.
- **Good:** Token caching on the relay removes one Shopify round trip per submission, which reduces WAF exposure independently of the IP change.
- **Bad:** New operational dependency — a second hosted account, its own billing ($6.03/mo), and a new deploy step. This is a genuinely new category of ops for a project that has none beyond Cloudflare's managed pipeline. **Revised 2026-09-05:** a GitHub Actions deploy pipeline now exists (`.github/workflows/deploy-relay.yml`), reversing the earlier deferral. That deferral assumed `FLY_API_TOKEN` would be an org-wide credential, weighing the added attack surface against how rarely the relay changes. It is instead an **app-scoped** token (`fly tokens create deploy -a august-jones-relay`), which can deploy `august-jones-relay` and nothing else in the org — a much narrower blast radius than the deferral assumed, and one that no longer needs "changes often enough" to justify. The workflow re-runs the relay's typecheck and unit tests before every deploy and passes `--ha=false`, so it cannot silently create the second always-on machine this ADR's one-machine decision rules out. Manual `fly deploy ./relay --ha=false` remains the fallback.
- **Bad:** A second deploy surface sits permanently in the request path. Timeout and retry changes touch two systems, and a Cloudflare Pages Functions outage breaks the forms even when Fly and Shopify are both healthy.
- **Bad:** The Shopify client secret is now stored at rest with two vendors rather than one — Cloudflare retains it to preserve the direct-call rollback path. Rotate the credential **only once the cutover is verified.** Cloudflare's copy stays live until the relay carries traffic, so rotating earlier invalidates a secret that is still in the request path — turning an intermittent failure into a total outage. Rotation is hygiene, not a requirement; skipping it breaks nothing. See `relay/README.md`'s "Rotating credentials" section (the Shopify client secret entry) for the exact order.
- **Bad, accepted deliberately:** the relay forwards **any** GraphQL document once
  authenticated — there is no operation allowlist. Anyone holding `RELAY_SHARED_SECRET`
  therefore has the custom app's full scopes (`read_customers`, `write_customers`,
  `write_draft_orders`) from anywhere on the internet, where today that requires compromising
  the Cloudflare environment itself. Accepted because the realistic leak paths for that secret
  — the Cloudflare environment store or the Fly secret store — each expose the Shopify client
  secret directly anyway, making the relay secret redundant in those scenarios; the marginal
  exposure is an accidental log or commit, which the never-log-bodies-or-headers rule covers.
  The alternative considered was a hash allowlist (the relay stores SHA-256 of the four
  permitted query documents and rejects anything else). Rejected: it couples query text to
  relay deploys, so editing a query in `contact.ts` or `subscribe.ts` without redeploying the
  relay breaks production, and **no test would catch it** — there is no integration test
  against the relay. For a solo maintainer that footgun is a likelier harm than the threat it
  prevents. Revisit if the relay ever gains a second caller or the app's scopes widen.

- **Bad:** No published timeline for how long Shopify's WAF takes to build trust in a new dedicated IP. The only datapoint is a "3–4 days" anecdote from a different incident on GCP IPs. This requires an observation period after cutover before concluding the fix worked, during which occasional bot-challenges absorbed by the retained retries do not indicate failure. See `relay/README.md`'s "Enabling the relay (cutover)" section for what to watch during it.
- **Neutral:** Zero SEO impact. The static export, its routes, metadata, and sitemap are untouched.

## Operating the relay

Facts discovered while standing this up that shaped the operational decisions below —
recorded because none of them are visible in `fly.toml` or recoverable from the code.
**For current runbook instructions — building the relay, deploying, verifying, rotating
credentials — see `relay/README.md`, which CLAUDE.md designates the single source of truth
for how to operate the relay.** What stays here is the WHY: the discoveries and mistakes
that produced those instructions, not the instructions themselves.

- **`fly deploy` against a process group with zero machines creates an extra "HA spare"
  machine** by default — a standby Fly starts so a deploy can roll through one machine at a
  time with zero downtime. That's documented behavior, not a billing trick, but it doubles
  compute cost for HA this stateless relay doesn't need: `shopify.ts` already carries a
  5-attempt retry, and unsetting `RELAY_URL` is a working rollback. `--ha=false`
  prevents it; see README's Deploying section for the command and exactly when this bites
  (first deploy, or a redeploy after scaling to zero).
- **Machine count is not expressible in `fly.toml`.** It lives in Fly's state, set by
  `fly scale count` / `fly machine clone` / `fly machine destroy`. This app runs **one**
  machine on purpose: two always-on machines would be $4.86/mo compute instead of $2.43, for
  HA this relay doesn't need for the reasons above.
- **Ignore flyctl's own hint here.** On creating the spare it suggests setting
  `min_machines_running = 0`. That would not have prevented the spare (it is already the
  `fly launch` default), and for this app it would enable scale-to-zero — the cold-start
  behavior deliberately disabled above. `min_machines_running` has no effect at all unless
  `auto_stop_machines` is `"stop"` or `"suspend"`. The flag that prevents the spare is
  `--ha=false`.
- **Egress IPs are app-and-region scoped, not per-machine.** One allocation covers up to 64
  machines, and the IPv6 comes with the IPv4 for the single $3.60/mo charge. Both machines
  shared `209.71.89.37` while two were running (a byproduct of the HA-spare mistake above) —
  verified from inside each. So that mistake was a cost question, never a correctness one;
  there was no risk of half the traffic leaving from a shared NAT.
- **The app needed an inbound public IP as well as the egress one, and this was not obvious
  going in — they are opposite directions and allocating one does not give you the other.**
  `fly apps create` + `fly deploy` (unlike `fly launch`) allocated no public IP, so
  `august-jones-relay.fly.dev` resolved to nothing and the relay was unreachable from the
  internet while being perfectly healthy internally. **Fly's own health check showed 1/1 the
  whole time**, because it runs over the private network — so "healthy" and "reachable" are
  genuinely independent here, and only an external curl distinguishes them. Cutting over in
  that state would have failed every Cloudflare call and taken both forms down completely,
  which is strictly worse than the intermittent failure this ADR exists to fix. See README's
  "Building the relay from scratch" section for the fix and its Verifying section for the
  external-curl check that actually catches this — Fly's own health check cannot. This is the
  inbound product the Options section above warns not to confuse with `allocate-egress`; it
  turns out both are needed, for opposite directions. A Sentry uptime check now polls
  `/healthz` from outside Fly's network on the same 1-minute cadence in production — see
  "Recovery when the relay is unreachable" above.
- **The egress IP survives machine destruction and redeploys.** It is released only by an
  explicit `fly ips release-egress`. The IP allocated here is `209.71.89.37` (plus
  `2a09:8280:e626:1:0:184:54e7:0`) — note this is a *new* address, not the `209.71.89.82` from
  the Phase 0 probe, which was torn down. Its WAF reputation therefore starts from zero.
- **There is no free tier.** Fly discontinued the Hobby/Launch/Scale plans on 2024-10-07; the
  "3 free shared-cpu-1x 256MB VMs" allowance is honored only for organizations that were
  already on those plans. Whether this org qualifies is visible only in the Fly dashboard and
  has not been checked — if it does, the compute line is $0.
- **Deploys run in CI** via `.github/workflows/deploy-relay.yml` (reversing this ADR's earlier
  deferral of a deploy pipeline — see the Consequences section above for why). See README's
  Deploying section for what the workflow runs and the manual fallback.
