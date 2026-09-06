# Shopify egress relay

A zero-dependency Node service on Fly.io that gives Shopify Admin API calls a
**static outbound IP**. Cloudflare Pages Functions call this relay; the relay calls
Shopify. See [ADR-0003](../docs/adr/0003-move-shopify-api-calls-to-fly-io-for-a-static-egress-ip.md)
for why.

- **App:** `august-jones-relay` (Fly, region `ord`, one always-on machine)
- **URL:** `https://august-jones-relay.fly.dev`
- **Egress IP:** `209.71.89.37` (+ `2a09:8280:e626:1:0:184:54e7:0`) — the address Shopify sees
- **Routes:**
  - `GET /healthz` — open, always 200 `text/plain "ok"`. Serves Fly's health check, not callers — see the Verifying section for why this can be green while the relay is unreachable or unconfigured.
  - `POST /graphql` — requires `X-Relay-Secret`; forwards `{query, variables}` to Shopify.
  - `GET /verify` — requires `X-Relay-Secret`; runs a read-only `{ shop { name } }` query through the same path as `/graphql`, with no side effects. Use it to check the full Cloudflare → relay → Shopify path before cutting a form over.
  - Everything else — 404.
- **Errors are JSON:** every error this relay originates (401, 400, 404, 413, 502) responds
  `application/json` as `{"errors":[{"message":"..."}]}`, matching Shopify's own GraphQL error
  shape. This matters because the client (`functions/api/_lib/shopify.ts`) only retries a
  response it can't parse as JSON — a `text/plain` error used to cost 5 attempts and ~4.5s
  before surfacing. The one deliberate exception: a non-JSON response Shopify itself returned
  (its HTML bot-challenge page) is forwarded verbatim, status and body unchanged, specifically
  *to keep it* triggering that retry.

- **One structured log line per request** (`fly logs -a august-jones-relay`), as JSON:
  `{"method","path","status","upstreamStatus","ms"}`. `status` is what the relay returned,
  `upstreamStatus` what Shopify returned — so a missing `upstreamStatus` means the relay
  rejected the call before it ever reached Shopify. Metadata only: no bodies, no headers,
  no tokens, no secrets, and a test enforces that. `/healthz` is not logged (Fly probes it
  every 15s).

It forwards `{query, variables}` to one fixed store, attaching a Shopify access token it
mints and caches itself. The store domain comes from the relay's own env and is never read
from the request — this is not a general-purpose proxy.

## Environment variables

**On the relay (Fly secrets — `fly secrets list -a august-jones-relay`):**

| Name | Purpose |
|---|---|
| `SHOPIFY_STORE_DOMAIN` | the one store this relay may talk to |
| `SHOPIFY_CLIENT_ID` | Shopify custom app credentials, used to mint access tokens |
| `SHOPIFY_CLIENT_SECRET` | ditto |
| `SHOPIFY_RELAY_SECRET` | shared secret callers must present as `X-Relay-Secret` |

All four are required — the process checks for them at startup and exits with a log line
naming exactly which are missing rather than starting up half-configured and 401ing every
request while reporting a healthy `/healthz`.

**On Cloudflare Pages (Production *and* Preview):**

| Name | Value |
|---|---|
| `SHOPIFY_RELAY_URL` | `https://august-jones-relay.fly.dev` — **no trailing slash** |
| `SHOPIFY_RELAY_SECRET` | must match the relay's copy **byte for byte** |

The three `SHOPIFY_*` credentials stay on Cloudflare too. They are the rollback path.

**These two go together.** Setting `SHOPIFY_RELAY_URL` without `SHOPIFY_RELAY_SECRET` is not a
fallback to direct calls — `createShopifyClient` throws instead. Leaving both unset is the only
way to get direct-call behavior; a half-set pair is treated as a misconfiguration to fail loudly
on, not something to silently degrade past.

> Cloudflare Pages bakes environment variables into a deployment at build time. Changing a
> variable does nothing until you redeploy.

## First-time setup

Only needed once — creating the app from scratch, e.g. after a disaster, or standing up a
second relay. Everything after this section (Deploying, Rotating, Verifying) assumes the app
already exists; run these first if `fly deploy` fails with "app not found". Do them in order:

```sh
# 1. Create the app (no machines, no IPs yet)
fly apps create august-jones-relay

# 2. Set the four required secrets (see Environment variables above) in one go
fly secrets set -a august-jones-relay \
  SHOPIFY_STORE_DOMAIN=... \
  SHOPIFY_CLIENT_ID=... \
  SHOPIFY_CLIENT_SECRET=... \
  SHOPIFY_RELAY_SECRET="$(openssl rand -hex 32)"

# 3. Allocate the outbound (egress) IP — this is the whole point of the relay
fly ips allocate-egress -a august-jones-relay

# 4. Allocate INBOUND IPs too — a separate product from egress, and without
#    them august-jones-relay.fly.dev resolves to nothing. --shared is
#    deliberate: it's free, and a dedicated IPv4 ($2/mo) buys nothing for a
#    plain HTTPS service.
fly ips allocate-v4 -a august-jones-relay --shared
fly ips allocate-v6 -a august-jones-relay

# 5. First deploy. --ha=false is required here, not optional (see Deploying below).
fly deploy ./relay --ha=false

# 6. Pin the machine count Fly's state (not fly.toml) tracks — one always-on
#    machine is the whole cost/HA tradeoff this app makes.
fly scale count 1 -a august-jones-relay

# 7. Create a deploy token scoped to only this app, for CI
fly tokens create deploy -a august-jones-relay | gh secret set FLY_API_TOKEN
```

Then confirm with the Verifying section below before pointing any traffic at it.

## Deploying

CI does it: `.github/workflows/deploy-relay.yml` runs on pushes to `main` touching
`relay/**`, and on manual dispatch. It typechecks, runs the relay's tests, then runs
`fly deploy ./relay --ha=false --remote-only` — `--remote-only` builds the container image on
Fly's own builder instead of requiring a local Docker daemon in the CI runner. It then curls
the public `/healthz` and fails the run if the relay is not reachable from outside Fly, which
is the one thing Fly's own health check cannot tell you (see Verifying).

By hand:

```sh
fly deploy ./relay --ha=false
```

**`--ha=false` is not optional.** Fly's unit of scheduling is a **process group** — the set of
machines running one process (this app has just the one, the default `app` group). Against a
process group with **zero** machines, `fly deploy` creates *two* — an extra always-on "HA
spare" (a standby machine Fly starts so a deploy can roll through one at a time with zero
downtime) — which would double this app's compute cost for no benefit, since it's stateless
and already has `shopify.ts`'s 5-attempt retry and the direct-call rollback in front of it.
Later deploys preserve the existing count, so this only bites on a fresh app or a redeploy
after scaling to zero — but that is exactly when you would not notice.

## Rotating `SHOPIFY_RELAY_SECRET`

**Order: Cloudflare off → Fly rotate → Cloudflare on with the new value.** Rotating Fly first
out of habit leaves the live path pointing at a secret the relay has already stopped
accepting — read on for why, but that one line is the whole checklist.

**The relay accepts exactly one secret, so there is no overlap window.** Changing either
side alone means every request 401s until the other side catches up — and because
Cloudflare needs a redeploy to pick up a variable, that gap is minutes, not seconds.

Do not rotate in place. Use the rollback path as a maintenance window:

1. **Leave relay mode.** Delete `SHOPIFY_RELAY_URL` in Cloudflare Pages (Production and
   Preview) and redeploy. Traffic now goes directly to Shopify — flaky but functional, and
   no submission depends on the relay secret.
2. **Rotate on Fly.** Generate and set in one step, without printing it:
   ```sh
   openssl rand -hex 32 | sed 's/^/SHOPIFY_RELAY_SECRET=/' | tee /tmp/relay-secret.txt \
     | fly secrets import -a august-jones-relay
   ```
3. **Update Cloudflare.** Set `SHOPIFY_RELAY_SECRET` to the new value
   (`cut -d= -f2 /tmp/relay-secret.txt`) on both environments.
4. **Re-enter relay mode.** Restore `SHOPIFY_RELAY_URL` and redeploy.
5. **Verify** (below), then `rm /tmp/relay-secret.txt`.

If you accept a brief window of failed submissions instead, the order is Fly first, then
Cloudflare — never the reverse, which leaves the live path pointing at a secret the relay
has already stopped accepting.

## Rotating `FLY_API_TOKEN`

Deploy tokens are app-scoped but long-lived (the default expiry is ~20 years). Rotate by
revoking and reissuing — and never let the value reach a terminal:

```sh
fly tokens list -a august-jones-relay
fly tokens revoke <ID>
fly tokens create deploy -a august-jones-relay | gh secret set FLY_API_TOKEN
```

## Rotating the Shopify client secret

Only **after** a cutover is verified, and always **Fly first, Cloudflare immediately after**.
Cloudflare's copy is the live path until the relay carries traffic; rotating earlier
invalidates a credential still in the request path and takes both forms down completely.

## Verifying

```sh
# reachable, healthy
curl -fsS https://august-jones-relay.fly.dev/healthz                      # -> ok

# auth is closed
curl -s -o /dev/null -w '%{http_code}\n' -X POST -d '{}' \
  https://august-jones-relay.fly.dev/graphql                              # -> 401

# secret + credentials + Shopify reachability, end to end, no side effects —
# the safe pre-cutover check. Fill in the real SHOPIFY_RELAY_SECRET value.
curl -fsS -H 'X-Relay-Secret: <the-relay-secret>' \
  https://august-jones-relay.fly.dev/verify
                                              # -> {"data":{"shop":{"name":"..."}}}

# outbound address is the dedicated one
fly ssh console -a august-jones-relay \
  -C "sh -c 'U=https://api.ipify.org node -e \"fetch(process.env.U).then(r=>r.text()).then(console.log)\"'"
                                                                          # -> 209.71.89.37
fly ips list -a august-jones-relay        # egress v4/v6 AND public ingress v4/v6
fly machines list -a august-jones-relay   # exactly one, started, checks 1/1
```

The app needs **both** an egress IP (outbound, what Shopify sees) and a public ingress IP
(inbound, so Cloudflare can reach it). They are different products and allocating one does
not give you the other. Fly's health check passes over the private network, so a relay can
report `1/1` while being unreachable from the internet — only an external `curl` catches that.

## Rolling back

Delete `SHOPIFY_RELAY_URL` in Cloudflare Pages and redeploy. That restores direct Shopify
calls with no code change and no Fly change. The relay can keep running; it just stops
receiving traffic.

## Local development

The relay is not part of the Next.js app and is excluded from the root tsconfig.

```sh
pnpm exec tsc -p relay --noEmit   # typecheck
pnpm exec vitest run relay        # 42 tests
docker build -t aj-relay ./relay  # image builds and serves /healthz
```
