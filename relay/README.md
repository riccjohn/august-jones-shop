# Shopify egress relay

A zero-dependency Node service on Fly.io that gives Shopify Admin API calls a
**static outbound IP**. Cloudflare Pages Functions call this relay; the relay calls
Shopify. See [ADR-0003](../docs/adr/0003-move-shopify-api-calls-to-fly-io-for-a-static-egress-ip.md)
for why.

- **App:** `august-jones-relay` (Fly, region `ord`, one always-on machine)
- **URL:** `https://august-jones-relay.fly.dev`
- **Egress IP:** `209.71.89.37` (+ `2a09:8280:e626:1:0:184:54e7:0`) — the address Shopify sees
- **Routes:** `GET /healthz` (open, 200) · `POST /graphql` (requires `X-Relay-Secret`) · everything else 404

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

**On Cloudflare Pages (Production *and* Preview):**

| Name | Value |
|---|---|
| `SHOPIFY_RELAY_URL` | `https://august-jones-relay.fly.dev` — **no trailing slash** |
| `SHOPIFY_RELAY_SECRET` | must match the relay's copy **byte for byte** |

The three `SHOPIFY_*` credentials stay on Cloudflare too. They are the rollback path.

> Cloudflare Pages bakes environment variables into a deployment at build time. Changing a
> variable does nothing until you redeploy.

## Deploying

CI does it: `.github/workflows/deploy-relay.yml` runs on pushes to `main` touching
`relay/**`, and on manual dispatch. It typechecks, runs the relay's tests, then deploys.

By hand:

```sh
fly deploy ./relay --ha=false
```

**`--ha=false` is not optional.** Against a process group with zero machines, `fly deploy`
creates *two* always-on machines. Later deploys preserve the existing count, so this only
bites on a fresh app — but that is exactly when you would not notice.

## Rotating `SHOPIFY_RELAY_SECRET`

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
pnpm exec vitest run relay        # 31 tests
docker build -t aj-relay ./relay  # image builds and serves /healthz
```
