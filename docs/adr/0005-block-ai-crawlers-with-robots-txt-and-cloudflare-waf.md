# ADR-0005: Block AI Crawlers with robots.txt and a Cloudflare WAF Rule

**Date:** 2026-10-26
**Status:** Accepted
**Author:** John Riccardi

## Context

Meta's updated commercial terms (effective 2026-11-20, moved from 2026-10-30) authorize
Meta to crawl domains linked to business accounts. The site is linked from a business bio,
so it is plausibly covered. "Train" was dropped from the permitted uses, but the crawl
authorization stayed and the terms do not promise to honor robots.txt. There is no opt-out
short of ending business use.

Before this change the site signaled no preference at all: `public/robots.txt` held only
`User-agent: *`, `Allow: /` and the sitemap line, and there were no edge rules. Pages are a
static export served from Cloudflare's CDN, so page requests never reach a Pages Function
(`functions/_routes.json` includes only `/api/*`). Any enforcement therefore has to live at
Cloudflare's edge, not in application code. Link previews (`facebookexternalhit`) drive the
Instagram/Facebook bio-link conversion path and must keep working.

## Decision

Two layers:

1. **`public/robots.txt`** (advisory): `Disallow: /` groups for `meta-externalagent`,
   `meta-externalads`, `meta-webindexer`, `GPTBot`, `ClaudeBot`, `CCBot`, `Bytespider`,
   `Google-Extended` and `Applebot-Extended`. The `*` group and Sitemap line are unchanged.
2. **One Cloudflare WAF custom rule** (enforcement), action Block, matching the user agents
   of the seven crawlers that actually fetch pages: `meta-externalagent`, `meta-externalads`,
   `meta-webindexer`, `GPTBot`, `ClaudeBot`, `CCBot`, `Bytespider`. `Google-Extended` and
   `Applebot-Extended` are robots.txt-only tokens and never appear as a request user agent,
   so they are not in the rule. The rule exempts `/robots.txt`: a 4xx there means
   "unavailable" under RFC 9309 and lets a crawler ignore the Disallow groups, which would
   make the two layers dependent instead of independent.

Deliberate exclusions:

- **`PerplexityBot` is allowed.** It cites sources and may send discovery traffic.
- **`meta-externalfetcher` and `facebookexternalhit` are never blocked.** They serve
  user-requested fetches and link previews, and are permitted to bypass robots.txt by
  design. Blocking them would break shared links.
- **`*.pages.dev` noindex is out of scope** for this decision.

This is best effort. robots.txt is advisory and not legally enforceable, and this ADR does
not assume Meta will honor it for the commercial-terms crawl. The WAF rule is spoofable
(user agent is client-supplied) but stops crawlers that identify themselves honestly. Full
rule, dashboard steps and verification are in `docs/crawler-protection.md`.

## Options Considered

- **robots.txt only** — rejected as insufficient: advisory, and nothing in Meta's terms
  commits it to honoring it. Kept as the first layer.
- **robots.txt + WAF custom rule (chosen)** — adds real enforcement against self-identifying
  crawlers at no cost on the Free plan, with no change to application code.
- **Widen `functions/_routes.json` to `/*` and block in a Function** — rejected: every page
  view becomes a billed Function invocation, to do what the edge WAF does for free.
- **`_headers` / `X-Robots-Tag`** — no effect on AI crawlers. Headers apply to static assets
  only and are a noindex signal, not an access control; a site-wide noindex would destroy
  SEO. The one plausible use, noindex on `*.pages.dev`, is out of scope here.
- **Cloudflare AI Crawl Control / managed robots.txt (optional)** — free on all plans, but
  whether Meta's crawlers are in its list is unverified, and it may consume one of the
  Free plan's WAF rule slots (undocumented). Can be enabled additionally; if so, curl
  `/robots.txt` afterward and check for duplicate or conflicting groups.

## Consequences

- **Good:** Self-identifying AI crawlers get a 403 at the edge instead of the page, with no
  application code and no Function billing.
- **Good:** Link previews, Googlebot and Bingbot are untouched.
- **Bad:** The WAF rule lives in the Cloudflare dashboard, invisible to code review and not
  carried by the repo. A new Cloudflare account or zone starts without it, silently.
  `docs/crawler-protection.md` is the record.
- **Bad:** User-agent matching is spoofable, and a crawler that does not identify itself
  honestly passes. This does not stop determined scrapers.
- **Bad:** The rule uses one of the Free plan's 5 custom rules. Open item: confirm the plan
  and whether any AI Crawl Control rules count toward that limit.
- **Open:** Real-world Meta behavior is unknown until the terms take effect. Monitor
  crawler traffic (WAF events, Umami) after 2026-11-20 and revisit if Meta crawls through
  the block or an unlisted user agent.
