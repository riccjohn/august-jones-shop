# Traffic report inputs

Drop the raw data pieces here while `.claude/skills/traffic-report/SKILL.md`
is gathering them. Nothing in this directory is committed (see root
`.gitignore`) — it's working storage for one report run, and it can contain
real customer/order data.

| File | Where it comes from | Parsed by |
|---|---|---|
| `umami.json` | Hand-transcribed from Umami Cloud dashboard screenshots (no API on the Free plan) | read as-is, shape below |
| `events.json` | Scraped from augustjones.shop/events (Claude does this with WebFetch, not a script) | read as-is, shape below |
| `orders.csv` | Shopify Admin → Orders → select date range → Export → CSV | `scripts/report/parse-shopify-orders.mjs` |
| `drafts.csv` | Shopify Admin → Orders → Drafts tab → search `tag:contact-form` → Export → CSV | `scripts/report/parse-shopify-drafts.mjs` |
| `cloudflare.csv` | Cloudflare dashboard → Analytics & Logs → Web Analytics → Export (optional) | `scripts/report/parse-cloudflare.mjs` |
| `instagram.csv` | Meta Business Suite → Content → Export (optional) | `scripts/report/parse-instagram.mjs` |

`umami.json` and `events.json` aren't raw exports, so there's no parser for
them — they're written directly in the shapes below. Worked, runnable
examples of every file (synthetic data) are in `scripts/report/examples/`.

## `umami.json` shape

```json
{
  "kpis": [
    { "window": "Last 6 months", "metric": "visitors", "label": "Visitors", "value": 1400, "unit": "count", "change_pct": 781, "change_good": true }
  ],
  "monthly_trend": [{ "month": "Oct 2026", "visitors": 270, "views": 410 }],
  "channels": [{ "channel": "Direct", "visitors": 604, "share": 43 }],
  "referrers": [{ "referrer": "Instagram", "visitors_6mo": 378, "visitors_90d": 253 }],
  "custom_events": [{ "event": "Shop click", "count": 464, "share": 78 }],
  "top_pages": [{ "path": "/ (home)", "visitors": 694, "views": 851, "bounce": 42, "duration_sec": 42 }],
  "audience": [{ "type": "country", "name": "United States", "visitors": 767, "share": 94 }]
}
```

- `kpis.window` is one of `"Last 6 months"`, `"Last 90 days"`, or `"Shop goal"` (for the
  shopify_store_click goal-conversion card); `unit` is `"count"`, `"percent"`, or `"seconds"`.
- `audience.type` is `"browser"` or `"country"`.
- `change_pct` / `change_good` may be `null` (no prior-period comparison, as on the Shop goal card).

## `events.json` shape

```json
[
  { "event": "Rusty Bee Night Market", "date": "Oct 22, 2026", "note": "Small bump in traffic Oct 22–26." }
]
```

`date` is free text (used for display and for matching a month abbreviation
against `monthly_trend`, not parsed as a real Date) — keep the 3-letter month
abbreviation (Jan…Dec) in it somewhere so the dashboard's event markers can
match it to a month.
