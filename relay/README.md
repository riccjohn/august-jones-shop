# Shopify egress relay

This site is a static export (see root `README.md`) with no backend of its own except two
**Cloudflare Pages Functions** — small server-side scripts Cloudflare runs on request,
living in `functions/api/`. One backs the contact form (`functions/api/contact.ts`), the
other the email/newsletter signup (`functions/api/subscribe.ts`); both write to the
Shopify Admin API to create or update a customer record.

Shopify runs a **WAF** (web application firewall — the layer that blocks or challenges
requests it judges to be automated abuse) that scores the reputation of the IP address a
request comes from. Cloudflare Pages Functions share their outbound ("egress") IP
addresses across many unrelated customers, and Shopify's WAF sometimes responds to that
shared reputation with a **bot challenge** — an HTML page instead of the JSON response the
form code expects. Full reasoning and evidence:
[ADR-0003](../docs/adr/0003-move-shopify-api-calls-to-fly-io-for-a-static-egress-ip.md).

This relay is a small always-on Node.js service on **Fly.io** (a platform for running
containers) that gives those Shopify calls a dedicated egress IP — one address used by
this service alone, so its reputation depends only on this service's own traffic. The two
Cloudflare Functions above call this relay instead of Shopify directly. The relay holds
the Shopify credentials, mints and caches its own Shopify access token, and forwards
`{query, variables}` on to exactly one configured store — it accepts no caller-supplied
target and cannot be pointed anywhere else.

**It is opt-in**, and the site runs in one of two modes depending on a single Cloudflare
Pages environment variable:

- **Direct mode** — `RELAY_URL` unset. `createShopifyClient`
  (`functions/api/_lib/shopify.ts`) calls Shopify directly, as if the relay didn't exist.
  This is the default, and what the site did before the relay existed.
- **Relay mode** — `RELAY_URL` and `RELAY_SHARED_SECRET` both set (see Credentials). The
  same calls go to the relay, which forwards them to Shopify from its dedicated IP.

Switching between them is a Cloudflare environment-variable change plus a redeploy — no
code change, and nothing to change on Fly. Turning relay mode on is the cutover (see
Enabling the relay); turning it off again is the rollback (see Rolling back). These two
terms are used throughout this document and in the code comments.

- **Fly app name:** `august-jones-relay`
- **Region:** `ord` (Fly's code for Chicago) — one always-on machine runs there
- **Public URL:** `https://august-jones-relay.fly.dev`
- **Egress IP:** `209.71.89.37` (plus IPv6 `2a09:8280:e626:1:0:184:54e7:0`) — the address
  Shopify sees

## Routes

- `GET /healthz` — unauthenticated, always `200 "ok"`. Proves only that the process is
  running: Fly's own health check runs over Fly's private network, so this can be green
  even when the relay has no public IP and is unreachable from Cloudflare (see
  Verifying). Not logged (Fly probes it every 15s).
- `POST /graphql` — requires header `X-Relay-Secret`; forwards the request body
  `{query, variables}` to Shopify.
- `GET /verify` — requires `X-Relay-Secret`; runs a read-only `{ shop { name } }` query
  through the same path as `/graphql`, with no side effects, so a cutover can be checked
  without writing a real customer record.
- Everything else — `404`.

Errors the relay originates (`401` bad or missing secret, `400` unparseable body, `404`
unknown route, `413` body over 1&nbsp;MiB, `502` the relay couldn't reach Shopify) are all
JSON, `{"errors":[{"message":"..."}]}`, matching Shopify's own error shape. A non-JSON
response from `/graphql` is Shopify's own bot-challenge page, forwarded verbatim — the
client (`functions/api/_lib/shopify.ts`) only retries a response it can't parse as JSON,
so passing the challenge through unchanged is what keeps that retry working.

Every outbound call the relay makes to Shopify has a 10-second timeout; if Shopify hangs,
the relay returns its own `502` rather than hanging in turn.

The relay writes one JSON log line per request (`fly logs -a august-jones-relay`):
`{"method","path","status","upstreamStatus","ms"}`. `status` is what the relay returned to
its caller, `upstreamStatus` what Shopify itself returned — a missing `upstreamStatus`
means the relay rejected the request before it ever reached Shopify. Deliberately metadata
only: no bodies, headers, tokens, or secrets are ever logged.

## Before you start

To do anything below, you need:

- **A Fly.io account** with a payment method attached — this service costs about
  $6/month (see ADR-0003 for the breakdown) — and the `flyctl` CLI installed and
  authenticated (`fly auth login`).
- **Access to the Shopify store's admin**, to create or read a custom app's credentials.
- **Access to the Cloudflare Pages project's dashboard** (Settings → Environment
  Variables), to set the variables that turn the relay on.
- **Write access to the GitHub repo**, to set the `FLY_API_TOKEN` secret the deploy
  workflow uses (`gh secret set`, or the repo's Settings → Secrets and variables →
  Actions).

## Credentials

If the store doesn't already have a custom app for this integration: Shopify admin →
Settings → Apps and sales channels → Develop apps → Create an app → under its
Configuration, set Admin API scopes `write_customers`, `read_customers`,
`write_draft_orders` → Install the app. Its **API credentials** page then shows the
Client ID and Client Secret used below.

| Variable | Where it comes from | Stored as |
|---|---|---|
| `SHOPIFY_STORE_DOMAIN` | the store's `.myshopify.com` address | Fly secret |
| `SHOPIFY_CLIENT_ID` | the custom app's API credentials page (above) | Fly secret |
| `SHOPIFY_CLIENT_SECRET` | same API credentials page | Fly secret |
| `RELAY_SHARED_SECRET` | you invent it — `openssl rand -hex 32` | Fly secret **and** Cloudflare Pages env var |
| `RELAY_URL` | the relay's URL, `https://august-jones-relay.fly.dev` (a trailing slash is tolerated) | Cloudflare Pages env var |

A **Fly secret** is an environment variable attached to the Fly app, set with `fly secrets
set` (below). A **Cloudflare Pages env var** is set in the Cloudflare dashboard under the
project's Settings → Environment Variables — **separately** for the Production and
Preview environments, both of which must be set for the relay to carry both live and
preview-deploy traffic.

The three `SHOPIFY_*` credentials are also kept on Cloudflare Pages, in addition to Fly:
that copy is what `createShopifyClient` uses to call Shopify directly, so it's what keeps
the rollback path (below) working even if the relay is down.

`RELAY_SHARED_SECRET` is not a Shopify credential — you invent it once and set the
identical value on both Fly and Cloudflare. Cloudflare sends it on every request as the
`X-Relay-Secret` header; the relay compares it to its own copy and rejects the request
(`401`) on a mismatch. There is no dashboard where a lost value can be looked up — if it's
lost, rotate it (see Rotating credentials).

`RELAY_URL` and `RELAY_SHARED_SECRET` must be set together on Cloudflare: `RELAY_URL` set
without `RELAY_SHARED_SECRET` makes `createShopifyClient` throw, it does not fall back to
direct calls. Leaving both unset is the only way to get direct-call behavior.

Cloudflare Pages bakes environment variables into a deployment at build time — a variable
change does nothing until the next deploy. **To redeploy without a code change:** Cloudflare
dashboard → Workers & Pages → `august-jones-shop` → Deployments → the most recent
deployment → `⋯` → **Retry deployment**. That builds again against the current variables.
(Do not push an empty commit for this — `main` is protected.) Referred to below as
"redeploy Cloudflare".

Because a missing variable silently means direct mode rather than an error, always confirm
a redeploy actually took effect by checking `fly logs` after a form submission (see
Enabling the relay, step 5) rather than assuming it did.

## Building the relay from scratch

Skip this section if the Fly app already exists (`fly apps list`) — go to Deploying.

1. **Create the Fly app.** This only reserves the name; it creates no servers or IP
   addresses yet.
   ```sh
   fly apps create august-jones-relay
   ```
2. **Set the four Fly secrets** (see Credentials above for where each value comes from).
   ```sh
   fly secrets set -a august-jones-relay \
     SHOPIFY_STORE_DOMAIN=... \
     SHOPIFY_CLIENT_ID=... \
     SHOPIFY_CLIENT_SECRET=... \
     RELAY_SHARED_SECRET="$(openssl rand -hex 32)"
   ```
   Save the `RELAY_SHARED_SECRET` value somewhere safe now. `fly secrets list` only ever
   shows that a secret is set, never its value — this is the only chance to record it
   before you need to paste the identical string into Cloudflare later.
3. **Allocate the outbound ("egress") IP** — the dedicated address this whole service
   exists to provide:
   ```sh
   fly ips allocate-egress -a august-jones-relay
   ```
4. **Allocate inbound ("ingress") IPs too.** Egress (outbound, what Shopify sees) and
   ingress (inbound, how Cloudflare reaches the relay) are separate Fly products —
   allocating one does not allocate the other. Skipping this step leaves
   `august-jones-relay.fly.dev` resolving to nothing, with no error until something tries
   to reach it (see Verifying).
   ```sh
   fly ips allocate-v4 -a august-jones-relay --shared
   fly ips allocate-v6 -a august-jones-relay
   ```
5. **Deploy the app for the first time**, from the repo root:
   ```sh
   fly deploy ./relay --ha=false
   ```
   `--ha=false` matters here. Fly's unit of scheduling is a **process group** (the set of
   machines running one process — this app has just one, the default `app` group).
   Deploying to a process group with zero machines otherwise creates *two* — an extra
   always-on standby (an "HA spare") that Fly starts so a deploy can roll through one
   machine at a time with zero downtime. That spare only doubles this stateless relay's
   monthly compute cost, since the retry logic in `functions/api/_lib/shopify.ts` and the
   direct-call rollback already cover what the spare would protect against. Later deploys
   preserve whatever machine count is already running, so this only matters on this first
   deploy, or after scaling back down to zero machines.
6. **Pin the machine count to one.** Machine count isn't set in `relay/fly.toml` — it's
   tracked in Fly's own state:
   ```sh
   fly scale count 1 -a august-jones-relay
   ```
7. **Create a deploy token scoped to only this app**, and store it as the GitHub Actions
   secret the deploy workflow (see Deploying) authenticates with:
   ```sh
   fly tokens create deploy -a august-jones-relay | gh secret set FLY_API_TOKEN
   ```

Then run through Verifying (below) before pointing any real traffic at it.

## Deploying

Once the app exists (above), pushing to `main` with changes under `relay/**` deploys it
automatically, via the GitHub Actions workflow `.github/workflows/deploy-relay.yml` (or
trigger it by hand from the repo's Actions tab). It typechecks the relay, runs its unit
tests, runs `flyctl deploy ./relay --ha=false --remote-only` (`--remote-only` builds the
container image on Fly's own builder, so the CI runner needs no Docker daemon of its own),
then curls the relay's public `/healthz` and fails the workflow if it doesn't answer — see
Verifying for why that specific check matters.

To deploy by hand instead:
```sh
fly deploy ./relay --ha=false
```
`--ha=false` still matters any time the app has scaled to zero machines — see Building the
relay from scratch, step 5, for why.

## Enabling the relay (cutover)

How to turn the relay on for an app that's already deployed and healthy.

1. **Confirm you still have the `RELAY_SHARED_SECRET` value.** `fly secrets list -a
   august-jones-relay` shows only that it's set, never its value. If it's gone, rotate it
   now, before Cloudflare depends on it — rotating later is a maintenance-window operation
   (see Rotating credentials):
   ```sh
   openssl rand -hex 32 | sed 's/^/RELAY_SHARED_SECRET=/' | tee /tmp/relay-secret.txt \
     | fly secrets import -a august-jones-relay
   ```
2. **Confirm the relay is running current code:** `fly status -a august-jones-relay`
   shows the deployed image and when it last updated.
3. **Run the `/verify` check** (see Verifying) to confirm the shared secret, the Shopify
   credentials, and Shopify itself are all reachable, without writing any data.
4. **Set `RELAY_URL` and `RELAY_SHARED_SECRET` on Cloudflare Pages** — the project's
   Settings → Environment Variables, on **both** the Production and Preview
   environments — then redeploy Cloudflare (see Credentials for how). Nothing changes
   until that redeploy finishes.
5. **Submit one real email-list signup** (the `EmailSignupForm` component), then confirm
   all three:
   - the customer appears in the Shopify admin
   - an `email_signup` event fires in Umami
   - `fly logs -a august-jones-relay` shows a line like
     `{"method":"POST","path":"/graphql","status":200,"upstreamStatus":200}` — this is
     the only proof the request actually went through the relay, rather than quietly
     taking the direct path because a variable didn't apply
6. **Watch the logs for a few days.** A dedicated IP still has to build a reputation with
   Shopify's WAF; an occasional `"upstreamStatus":403` in that window is an expected bot
   challenge, absorbed by the retry logic in `shopify.ts`, not a failed cutover. See
   ADR-0003 for the reasoning.
7. **Optional, once satisfied:** rotate the Shopify client secret (see Rotating
   credentials), and add an external uptime monitor on `/healthz` — nothing currently
   alerts if the relay goes down.

If anything looks wrong at any step, see Rolling back.

## Verifying

Three checks, in increasing order of what they prove. The first runs automatically after
every CI deploy and fails the deploy if it doesn't pass (see Deploying). Run all three by
hand after building the relay from scratch, after rotating a secret, or any time you want
to confirm the live state:

```sh
# 1. Reachable at all
curl -fsS https://august-jones-relay.fly.dev/healthz                      # -> ok

# 2. Auth is closed
curl -s -o /dev/null -w '%{http_code}\n' -X POST -d '{}' \
  https://august-jones-relay.fly.dev/graphql                              # -> 401

# 3. Secret + credentials + Shopify itself, end to end, with no side effects.
#    Replace <the-relay-secret> with the real RELAY_SHARED_SECRET value.
curl -fsS -H 'X-Relay-Secret: <the-relay-secret>' \
  https://august-jones-relay.fly.dev/verify
                                              # -> {"data":{"shop":{"name":"..."}}}
```

Check 1 passing is necessary but not sufficient. Fly's own health check runs over Fly's
private network, so it can report the app healthy even when it has no public inbound IP
and is completely unreachable from Cloudflare or anywhere else — that exact gap has caused
an outage here before (see ADR-0003). Only an external `curl`, from outside Fly, rules
that out.

To confirm the outbound address seen by Shopify is the dedicated one:
```sh
fly ssh console -a august-jones-relay \
  -C "sh -c 'U=https://api.ipify.org node -e \"fetch(process.env.U).then(r=>r.text()).then(console.log)\"'"
                                                                          # -> 209.71.89.37
fly ips list -a august-jones-relay        # egress v4/v6 AND public ingress v4/v6
fly machines list -a august-jones-relay   # exactly one, started, checks 1/1
```
`fly ips list` should show both an egress address and a public ingress address — see
Building the relay from scratch, step 4, for why both are required.

## Rolling back

Delete `RELAY_URL` in Cloudflare Pages (Settings → Environment Variables, both Production
and Preview) and redeploy. That's the entire rollback: Shopify calls go direct again, with
no code change and no change to the Fly app. The relay itself keeps running; it just stops
receiving traffic.

## Rotating credentials

**`RELAY_SHARED_SECRET`.** The relay only ever holds one valid value, so there is no
overlap window — changing it on one side before the other makes every request `401` until
both match, and because Cloudflare needs a redeploy to pick up a new value, that gap is
minutes, not seconds. Avoid it by using the rollback path as a maintenance window:

1. Delete `RELAY_URL` on Cloudflare Pages (both Production and Preview) and redeploy —
   direct calls resume (flaky, per ADR-0003, but functional).
2. Rotate the value on Fly:
   ```sh
   openssl rand -hex 32 | sed 's/^/RELAY_SHARED_SECRET=/' | tee /tmp/relay-secret.txt \
     | fly secrets import -a august-jones-relay
   ```
3. Set `RELAY_SHARED_SECRET` to that new value (`cut -d= -f2 /tmp/relay-secret.txt`) on
   both Cloudflare environments.
4. Restore `RELAY_URL` and redeploy — relay mode resumes with matching secrets.
5. Run Verifying (above), then delete the temp file: `rm /tmp/relay-secret.txt`.

If a brief window of failed submissions is acceptable instead, rotate Fly first and
Cloudflare immediately after — never the reverse order, which leaves Cloudflare sending a
secret the relay has already stopped accepting.

**`FLY_API_TOKEN`** — the GitHub Actions secret the deploy workflow authenticates with.
Revoke the old one and issue a new one in the same step, so the value never has to be
copied by hand or printed to a terminal:
```sh
fly tokens list -a august-jones-relay
fly tokens revoke <ID>
fly tokens create deploy -a august-jones-relay | gh secret set FLY_API_TOKEN
```

**The Shopify client secret** (`SHOPIFY_CLIENT_SECRET`, generated from the custom app's
API credentials page — see Credentials). Rotate it only after a cutover has been verified,
and always Fly first, Cloudflare immediately after: Cloudflare's copy is what's actually
live until the relay is carrying traffic, so rotating it first invalidates a credential
still in use, taking both forms down at once.

## Local development

The relay is a separate Node project from the Next.js site, excluded from the root
`tsconfig.json`:
```sh
pnpm exec tsc -p relay --noEmit   # typecheck
pnpm exec vitest run relay        # unit tests
docker build -t aj-relay ./relay  # confirms the image builds

# Run it locally against the real Shopify credentials. This starts the relay alone; it
# does not put your local site into relay mode. Without the credentials the process
# exits immediately, naming which ones are missing.
docker run --rm -p 8080:8080 \
  -e SHOPIFY_STORE_DOMAIN=... -e SHOPIFY_CLIENT_ID=... -e SHOPIFY_CLIENT_SECRET=... \
  -e RELAY_SHARED_SECRET=local-dev-secret aj-relay
curl -fsS localhost:8080/healthz   # -> ok
```
