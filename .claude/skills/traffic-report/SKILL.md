---
name: traffic-report
description: Build or refresh the August Jones traffic & trends report — interviews the user for each data source (Umami, Shopify orders/drafts, Cloudflare, Instagram), runs the deterministic parsers and page generator in scripts/report/, and writes a self-contained dashboard.html. Use when asked to build, update, or refresh the traffic report or dashboard, or to correlate web traffic with sales, custom requests, or Instagram posts.
---

# Traffic report

Builds the shareable report that ties web traffic (Umami), physical events,
sales and custom requests (Shopify), and Instagram posts together — a
self-contained `dashboard.html` file (no Claude Artifact, no account needed
to view it — open it by double-click, attach it to an email, or host it
anywhere). There's no live connector for any of these sources (Umami Free
has no API, Shopify needs a credential nobody's set up yet, Cloudflare/
Instagram are manual exports), so every run is: gather this run's data →
crunch it deterministically → render the page.

Read `scripts/report/README.md` and `reports/traffic/inputs/README.md`
before the first run — they document exactly what each script does and
the shape of the two hand-authored JSON files (`umami.json`, `events.json`,
plus the short `narrative.json` for the written parts — step 3 below).

## 0. Resume or start fresh

Check for `reports/traffic/inputs/narrative.json`. If it exists, this is a
refresh of a previous report — read it back to the user as the current
narrative and ask whether it still holds or needs updating, rather than
writing it from scratch. If it doesn't exist, this is the first run.

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
```

Drop any `--flag` whose file doesn't exist this run — the script handles
missing inputs gracefully, marking that section `{"status":"missing"}`
rather than failing. Read the summary it prints before continuing — it's
the fast way to catch a bad export before it reaches the page.

## 3. Write the narrative, then render

The numbers are correct by this point; what's left is the handful of
sentences a script can't write. Create or update
`reports/traffic/inputs/narrative.json` yourself — look at
`report-data.json` and write:

- `title` — defaults to "Traffic & Trends" if omitted
- `asOf` — the report date
- `takeaway` — one sentence, the real headline number from the data (don't
  round or estimate; read it out of `report-data.json`)
- `opportunities` — a short list of concrete next steps, grounded in what
  this run's data actually shows (not boilerplate — e.g. only suggest a
  UTM-tagging fix if the events/traffic correlation in this data is
  genuinely fuzzy)
- `dataNotes` — caveats worth flagging (a discrepancy between sources, a
  short date range, anything approximate)

`reports/traffic/inputs/README.md` has the full shape and an example.
When tying sources together in `opportunities`/`dataNotes`, say "around the
same time as" rather than "caused" — the generated page already marks
Instagram-post and event days on the sales/requests/Cloudflare charts
(`buildDayMarkers` in `generate-html.mjs`), which shows correlation, not
causation.

Then render:

```bash
node scripts/report/generate-html.mjs \
  --in reports/traffic/report-data.json \
  --narrative reports/traffic/inputs/narrative.json \
  --out reports/traffic/dashboard.html
```

Every section whose source data is missing renders as a plain "not
available this run" note rather than disappearing silently, so the output
file always says what it does and doesn't cover — no need to explain that
in chat beyond a one-line summary.

`reports/traffic/dashboard.html` is gitignored (it's generated, and
usually contains real business numbers) — tell the user where it is so
they can open it, and that re-running the skill overwrites it in place.

## Handoff

Tell the user, briefly: the file's path, what's new in this version, which
optional sources were included vs. skipped and why, and — only if it's
true this run — where a skipped number could come from next (e.g. "sales
came from a one-time CSV export; a read-only Shopify Admin API token would
make that live"). Don't recap every number in chat; the page is where that
lives.
