---
name: traffic-report
description: Build or refresh the August Jones traffic & trends dashboard — interviews the user for each data source (Umami, Shopify orders/drafts, Cloudflare, Instagram), runs the deterministic parsers in scripts/report/, and publishes/updates the Dashboard Artifact. Use when asked to build, update, or refresh the traffic report or dashboard, or to correlate web traffic with sales, custom requests, or Instagram posts.
---

# Traffic report

Builds the shareable dashboard that ties web traffic (Umami), physical
events, sales and custom requests (Shopify), and Instagram posts together —
the one published at a `claude.ai/artifact/...` URL. There's no live
connector for any of these sources (Umami Free has no API, Shopify needs a
credential nobody's set up yet, Cloudflare/Instagram are manual exports), so
every run is: gather this run's data → crunch it deterministically → author/
update the dashboard page with it.

Read `scripts/report/README.md` and `reports/traffic/inputs/README.md`
before the first run — they document exactly what each script does and
the shape of the two hand-authored JSON files (`umami.json`, `events.json`).

## 0. Resume or start fresh

Check for `reports/traffic/artifact-url.txt`. If it exists, this is an
update to an existing dashboard — reuse that URL with the `Artifact` tool
(`action: "read"` it first, per the tool's own rules for updating an
artifact from an earlier conversation) rather than creating a new one. If
it doesn't exist, this is the first run.

## 1. The interview — one piece at a time

Ask for pieces in this order, confirming each is parsed correctly before
moving to the next (don't collect everything and validate at the end — a
bad file is cheaper to fix on the piece it came from). Save each raw file
into `reports/traffic/inputs/` under the name `reports/traffic/inputs/
README.md` gives it.

1. **Umami numbers** (required). Umami Cloud has no API on the Free plan,
   so this is screenshots: ask for the dashboard's Overview, Events,
   Pages, Sources (Channels + Referrers), Environment, and Location tabs,
   for both a 6-month and a 90-day (or whatever window makes sense) range.
   Transcribe them into `reports/traffic/inputs/umami.json` yourself, in
   the shape `reports/traffic/inputs/README.md` documents. There's no
   parser for this file — the transcription *is* the deterministic-vs-
   judgment line: get the arithmetic from the screenshot right, don't
   invent numbers.
2. **Events calendar** (required, but free — no need to ask). Fetch
   `https://www.augustjones.shop/events` with WebFetch and write
   `reports/traffic/inputs/events.json` in the documented shape. Re-fetch
   it every run; the page changes as events pass and new ones get added.
3. **Shopify orders** (optional but valuable). Ask for an Orders CSV
   export covering the report's date range. Validate it immediately:
   `node scripts/report/parse-shopify-orders.mjs reports/traffic/inputs/orders.csv`
   and read the order count / revenue total back to the user as a sanity
   check before moving on.
4. **Shopify draft orders / custom requests** (optional but valuable). Ask
   for a Draft Orders export filtered to `tag:contact-form` (every contact-
   form submission creates exactly one such draft — see
   `functions/api/contact.ts`). Validate:
   `node scripts/report/parse-shopify-drafts.mjs reports/traffic/inputs/drafts.csv`
5. **Cloudflare pageviews** (optional). A `date,pageviews` CSV. Validate:
   `node scripts/report/parse-cloudflare.mjs reports/traffic/inputs/cloudflare.csv`
   — remember missing days in this export mean zero visitors, not missing
   data; the script zero-fills them, but mention this to the user if the
   zero-filled count looks surprising.
6. **Instagram posts** (optional). A Meta Business Suite content export.
   Validate: `node scripts/report/parse-instagram.mjs reports/traffic/inputs/instagram.csv`
   — if it throws or `unmatchedHeaders` isn't empty, the export's column
   names don't match the aliases in `parse-instagram.mjs`; look at the
   headers it prints and add the real ones to `FIELD_ALIASES` in that
   script rather than hand-parsing the file yourself.

Any optional piece the user doesn't have: skip it and say what the
dashboard will be missing as a result (e.g. no sales correlation without
`orders.csv`). Don't block the whole report on one missing piece.

## 2. Build

Once you have whatever pieces you're going to have:

```bash
node scripts/report/build-report-data.mjs \
  --umami reports/traffic/inputs/umami.json \
  --events reports/traffic/inputs/events.json \
  --orders reports/traffic/inputs/orders.csv \
  --drafts reports/traffic/inputs/drafts.csv \
  --cloudflare reports/traffic/inputs/cloudflare.csv \
  --instagram reports/traffic/inputs/instagram.csv \
  --out reports/traffic/report-data.json

node scripts/report/split-datasets.mjs \
  --in reports/traffic/report-data.json \
  --out-dir reports/traffic/datasets
```

Drop any `--flag` whose file doesn't exist this run — both scripts handle
missing inputs gracefully (`build-report-data.mjs` marks that section
`{"status":"missing"}`; `split-datasets.mjs` just skips the dataset file
and tells you what it skipped). Read the summary each script prints before
continuing — it's the fast way to catch a bad export before it reaches the
dashboard.

## 3. Publish to the Dashboard Artifact

This part is judgment, not a script — the data's already correct, this is
about presenting it well. Call `Artifact` with `action: "quickstart"`,
`intent: "other"` (or go straight to `type_url`
`https://claude.ai/artifact/GZLZthZ2sQjn7T16skfdeF` if you already know it)
and **read that type's own `SKILL.md`, `artifact-type/reference/
design-defaults.md`, and `artifact-type/reference/one-writer.md` fresh —
they're versioned and may have changed since this skill was written.**
What follows is this report's own accumulated decisions, not a substitute
for those files:

- **One dataset doc per file** in `reports/traffic/datasets/`: upload each
  with `Artifact` `action: "publish"`, `asset: true`, `file_path` pointing
  at it (JSON files go one at a time, per that tool's own rules), then
  write a `datasets/<id>` document via `ArtifactData` pointing at the
  resulting `/_blob/...` url, `source: {kind: "file", ...}`, `fixed: true`
  (this is point-in-time data from exports/screenshots, not a live query).
  Dataset ids match the filenames in `reports/traffic/datasets/` minus
  `.json`.
- **The page opens `<meta name="dash-one-writer">`.** Static text (headings,
  labels, analysis prose) goes directly in the HTML; only the numbers
  themselves are `data-draw` elements filled by `dash.draw(name, fn)` from
  `dash.data(datasetId)`. Don't have a script build sentences.
- **Brand touches already settled**: Bebas Neue (Google Fonts) for headings,
  everything else on the type's own `--color-*`/`--cds-*` tokens so it
  still works in dark mode. Don't reach for the site's literal hex values
  (`#222`/`#f6f4f0`/`#ffb612`) — the dashboard's tokens already adapt to
  theme, and literal colors would break that.
- **New sections this skill adds beyond the original traffic-only build**:
  a sales-over-time chart from `daily_sales`, a custom-requests chart from
  `daily_requests`, a small Cloudflare cross-check panel from
  `cloudflare_pageviews` (note where it disagrees with Umami rather than
  silently picking one), and an Instagram posts timeline from
  `instagram_posts` — ideally overlaid on the same timeline as the events
  calendar and the sales/requests charts so a reader can see a post or a
  market next to the sales bump it may have driven. Don't claim causation
  the data doesn't support; say "around the same time as" rather than
  "caused."
- Look at the rendered page once after publishing (the type's own
  `read`/`screenshot` call), fix anything genuinely broken, then stop —
  don't loop on polish the user didn't ask for.

After publishing, write the artifact's URL to
`reports/traffic/artifact-url.txt` (create the file; it's gitignored) so
the next run updates in place instead of creating a duplicate dashboard.

## Handoff

Tell the user, briefly: what's new in this version, which optional sources
were included vs. skipped and why, and the one line the Dashboard type's
own `design-defaults.md` asks you to give about where the numbers can come
from next (e.g. "sales come from a one-time CSV export — if you ever want
this live, that means a read-only Shopify Admin API token"). Don't recap
every number in chat; the dashboard is where that lives.
