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

## Why these are scripted and the dashboard build isn't

Summing order revenue, deduping Shopify's one-row-per-line-item export,
zero-filling Cloudflare's gap days, matching an export's actual column
names — these have one right answer, and an LLM re-deriving them by eye
from a CSV dump is exactly where arithmetic slips in. Scripting them means
the same input always produces the same output, and a wrong number is a bug
in a ~60-line function you can read, not a transcription error buried in a
chat transcript.

Writing the dashboard itself (what to chart, how to lay it out, how to
word a takeaway) stays a judgment call for whoever runs the skill — these
scripts hand that step clean, correct numbers instead of raw exports.

## `lib/`

- `csv.mjs` — a small RFC 4180 parser (quoted fields, embedded commas/
  newlines/escaped quotes — Shopify's exports need this; a bare
  `line.split(",")` corrupts rows with commas in an address or a note).
- `dates.mjs` — `toISODate`, `fillZeroDays` (see parse-cloudflare.mjs's doc
  comment for why zero-fill matters), `sumBy`.

## `examples/`

Tiny synthetic fixtures (no real customer data) used to smoke-test each
parser during development, and as a concrete reference for each file's
expected shape. Safe to run any parser against them directly.
