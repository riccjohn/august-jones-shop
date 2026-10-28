# Traffic report scripts

Deterministic data-handling for the `traffic-report` skill
(`.claude/skills/traffic-report/SKILL.md`). These are plain Node scripts —
no dependencies, not part of the app's `tsc`/Biome-typed build — because
they're a reporting utility run ad hoc, not shipped code. `pnpm lint` /
`pnpm format` still cover them (Biome's `files.includes` is `**`).

Every parser is exported as a plain function (`parseShopifyOrdersCsv`,
`parseShopifyDraftsCsv`, `parseCloudflareCsv`, `parseInstagramCsv`) and also
runnable standalone for inspecting one piece of data as it arrives:

```bash
node scripts/report/parse-shopify-orders.mjs path/to/orders.csv
node scripts/report/parse-shopify-drafts.mjs path/to/drafts.csv
node scripts/report/parse-cloudflare.mjs path/to/cloudflare.csv
node scripts/report/parse-instagram.mjs path/to/instagram-export.csv
```

`build-report-data.mjs` merges everything (including the two hand-authored
JSON files, `umami.json` and `events.json` — see
`reports/traffic/inputs/README.md`) into one `report-data.json`. Every flag
is optional except `--out`, so it can be run repeatedly as pieces of data
arrive, and a key whose input wasn't given comes back
`{ "status": "missing" }` instead of failing the whole build:

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

`generate-html.mjs` renders that `report-data.json`, plus a short hand-
written `narrative.json` (the takeaway sentence, opportunities, data notes
— see `reports/traffic/inputs/README.md`), into one self-contained
`dashboard.html`. No external JS and no CDN scripts — charts are plain SVG
built by `lib/svg-charts.mjs`'s arithmetic, so the file opens by
double-click or attaches to an email with nothing else to load:

```bash
node scripts/report/generate-html.mjs \
  --in reports/traffic/report-data.json \
  --narrative reports/traffic/inputs/narrative.json \
  --out reports/traffic/dashboard.html
```

A source `build-report-data.mjs` marked `{"status":"missing"}` renders as a
plain "not available this run" note in the page rather than vanishing
silently or breaking the build.

## Why these are scripted and the page text isn't

Summing order revenue, deduping Shopify's one-row-per-line-item export,
zero-filling Cloudflare's gap days, matching an export's actual column
names, laying out a chart's bars and axis ticks — these have one right
answer, and an LLM re-deriving them by eye from a CSV dump (or a canvas) is
exactly where arithmetic slips in. Scripting them means the same input
always produces the same page, and a wrong number is a bug in a short,
readable function, not a transcription error buried in a chat transcript.

Writing the handful of sentences in `narrative.json` (the takeaway, what
to do next) stays a judgment call for whoever runs the skill — the scripts
hand that step clean, correct numbers and a finished page instead of raw
exports.

## `lib/`

- `csv.mjs` — a small RFC 4180 parser (quoted fields, embedded commas/
  newlines/escaped quotes — Shopify's exports need this; a bare
  `line.split(",")` corrupts rows with commas in an address or a note).
- `dates.mjs` — `toISODate`, `fillZeroDays` (see parse-cloudflare.mjs's doc
  comment for why zero-fill matters), `sumBy`.
- `format.mjs` — number/date/money formatting shared by the generated page.
- `svg-charts.mjs` — dependency-free SVG chart builders (`groupedBarChart`,
  `horizontalBarChart`, `dailySeriesChart`), colored entirely through CSS
  `var(--token)` strings so the page's own stylesheet (light/dark mode
  included) controls the palette — these functions never hardcode a color.

## `examples/`

Tiny synthetic fixtures (no real customer data) used to smoke-test each
parser during development, and as a concrete reference for each file's
expected shape. Safe to run any parser against them directly.
