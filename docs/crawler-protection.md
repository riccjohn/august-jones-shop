# AI Crawler Protection

## Overview

Two layers keep AI crawlers off the site, per
`docs/adr/0005-block-ai-crawlers-with-robots-txt-and-cloudflare-waf.md`:

1. **`public/robots.txt`** — advisory `Disallow: /` groups, tracked in the repo.
2. **A Cloudflare WAF custom rule** — enforcement (Block), dashboard-only config.

The WAF rule is not in the repo. It does not travel with a new Cloudflare account or zone,
so this page is the record of it. Pages are static CDN hits that never reach a Pages
Function, so the edge is the only place enforcement can live.

This is best effort. robots.txt is advisory, and nothing here assumes Meta honors it for
the crawl authorized by its commercial terms (effective 2026-11-20). The WAF rule matches
a client-supplied user agent, so it stops crawlers that identify themselves, not spoofers.

## Policy

| User agent | robots.txt | WAF block | Why |
|---|---|---|---|
| `meta-externalagent` | Disallow | Block | Meta AI training / indexing |
| `meta-externalads` | Disallow | Block | Meta ads / business products |
| `meta-webindexer` | Disallow | Block | Meta AI search |
| `GPTBot` | Disallow | Block | OpenAI training |
| `ClaudeBot` | Disallow | Block | Anthropic training |
| `CCBot` | Disallow | Block | Common Crawl |
| `Bytespider` | Disallow | Block | ByteDance |
| `Google-Extended` | Disallow | n/a | robots.txt-only token, never a request user agent |
| `Applebot-Extended` | Disallow | n/a | robots.txt-only token, never a request user agent |
| `PerplexityBot` | Allowed | Allowed | Cites sources, may send discovery traffic |
| `meta-externalfetcher` | Allowed | Never block | User-requested fetches; may bypass robots.txt by design |
| `facebookexternalhit` | Allowed | Never block | Link previews on Instagram/Facebook; the main conversion path |
| `Googlebot`, `Bingbot` | Allowed | Never block | Search traffic (SEO is critical) |

Do not block on ASN alone (Meta's ASN 32934 includes `facebookexternalhit`), and do not
block on `cf.client.bot`.

Out of scope: `noindex` on `*.pages.dev` previews.

## WAF rule

Cloudflare dashboard, the `augustjones.shop` zone: Security -> Security rules (labelled
WAF -> Custom rules in older layouts) -> Create rule.

| Field | Value |
|---|---|
| Rule name | `Block AI crawlers` |
| Action | Block |

Expression (use "Edit expression"):

```
(lower(http.user_agent) contains "meta-externalagent" or lower(http.user_agent) contains "meta-externalads" or lower(http.user_agent) contains "meta-webindexer" or lower(http.user_agent) contains "gptbot" or lower(http.user_agent) contains "claudebot" or lower(http.user_agent) contains "ccbot" or lower(http.user_agent) contains "bytespider") and not (http.request.uri.path eq "/robots.txt")
```

Steps:

1. Open the zone, then Security -> Security rules (custom rules).
2. Create rule, name it `Block AI crawlers`.
3. Click **Edit expression** and paste the expression above.
4. Set the action to **Block** and deploy.
5. Run the verification below.

`contains` is case-sensitive, so the rule lowercases the user agent first and the tokens
are written in lowercase. The `/robots.txt` exemption is deliberate: under RFC 9309 a 4xx
response means robots.txt is "unavailable", and a crawler may then crawl without
restriction. Blocked crawlers must be able to read the Disallow groups, so that the
advisory layer still works if this rule is ever disabled.

## Verify

Rule changes can take a short while to propagate. Run against production:

```sh
# Blocked agents should return 403
for ua in meta-externalagent meta-externalads meta-webindexer GPTBot ClaudeBot CCBot Bytespider; do
  printf '%s ' "$ua"
  curl -s -o /dev/null -w '%{http_code}\n' -A "$ua" https://www.augustjones.shop/
done

# Must NOT be blocked (expect 200): link previews, fetcher, search, Perplexity, browsers.
# Googlebot/Bingbot from a non-Google/Bing IP can be challenged by Cloudflare's own bot
# protection; if one is not 200, check Security Events before treating it as this rule.
for ua in facebookexternalhit meta-externalfetcher Googlebot Bingbot PerplexityBot "Mozilla/5.0"; do
  printf '%s ' "$ua"
  curl -s -o /dev/null -w '%{http_code}\n' -A "$ua" https://www.augustjones.shop/
done

# robots.txt must stay readable by blocked agents (expect 200, not 403)
for ua in meta-externalagent GPTBot ClaudeBot; do
  printf '%s ' "$ua"
  curl -s -o /dev/null -w '%{http_code}\n' -A "$ua" https://www.augustjones.shop/robots.txt
done

# Live robots.txt is Cloudflare's managed block followed by public/robots.txt.
# Expect all three Meta groups (meta-externalagent, meta-externalads, meta-webindexer);
# meta-externalagent will appear twice (managed + ours), which is harmless. Confirm
# facebookexternalhit, meta-externalfetcher and PerplexityBot have no group.
curl -s https://www.augustjones.shop/robots.txt
```

Then paste a site URL into the Facebook Sharing Debugger and confirm the preview still
renders. In the dashboard, Security -> Analytics -> Events (Security -> Events in older layouts) should show the Block hits from the curl
runs.

Note: robots.txt changes can take up to 24 hours to be picked up by crawlers.

## Rollback

Dashboard: Security -> Security rules -> `Block AI crawlers` -> disable (or delete). Takes
effect without a deploy. To drop the advisory layer, revert `public/robots.txt` and
redeploy. The two layers are independent because the rule exempts `/robots.txt`.

## Cloudflare managed robots.txt (enabled)

Cloudflare's managed robots.txt is enabled on this zone (observed 2026-10-28). It prepends
a content-signal header (`search=yes, ai-train=no`) and a long list of AI and other bot
groups to `/robots.txt`, then serves `public/robots.txt` after it. Consequences:

- It already disallows `meta-externalagent`, GPTBot, ClaudeBot, CCBot, Bytespider,
  Google-Extended and Applebot-Extended, so those groups are duplicated by ours. The
  groups agree, so this is harmless.
- It does **not** cover `meta-externalads` or `meta-webindexer`; only `public/robots.txt`
  does. Keep ours.
- It also disallows Baiduspider, PetalBot, GoogleOther and Amazonbot. That is acceptable
  here, but re-check the managed list if search traffic from a new engine matters.
- It has no group for `facebookexternalhit`, `meta-externalfetcher` or PerplexityBot. If a
  future managed-list update adds one, link previews break: re-run the verify commands.
- Because Cloudflare edits the served file, `public/robots.txt` alone is not the whole
  policy. The Vitest guard only covers our file.
- Whether AI Crawl Control rules consume a WAF rule slot is still unverified (see below).

## Limits and open items

- **Spoofable.** The user agent is client-supplied. This stops honest crawlers only.
- **Meta behavior is unverified.** Nothing in Meta's terms commits it to honoring
  robots.txt. Monitor after **2026-11-20**: check Security Events (Security -> Analytics -> Events) and Umami for
  crawler traffic, and whether any Meta agent gets through under an unlisted user agent.
- **Free plan limit.** Free allows 5 custom rules and no regex. This rule uses one. Open:
  confirm the plan, and whether AI Crawl Control rules count toward the 5.
- **Dashboard-only.** Not visible to code review; re-create it on any new zone.
- **Blocking `meta-externalfetcher` is a tradeoff** and is deliberately not done: it would
  stop Meta AI from fetching our links on a user's request.
