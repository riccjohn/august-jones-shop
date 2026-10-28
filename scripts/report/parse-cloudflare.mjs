#!/usr/bin/env node
/**
 * Parses a Cloudflare pageviews export (date,pageviews CSV) into a
 * zero-filled daily series.
 *
 * Cloudflare's export omits days with zero pageviews rather than writing a
 * 0 row — left alone, a day-count or an average built from the file treats
 * "no row" as "no data" instead of "zero visitors". This script fills every
 * day in the covered range.
 *
 * Usage:
 *   node scripts/report/parse-cloudflare.mjs <path-to-cloudflare.csv>
 *
 * Writes nothing to disk by itself — it prints the normalized JSON to
 * stdout. build-report-data.mjs imports parseCloudflareCsv() directly;
 * this CLI wrapper exists for inspecting one piece on its own while
 * gathering data.
 */
import { readFile } from "node:fs/promises";
import { parseCsv } from "./lib/csv.mjs";
import { fillZeroDays, sumBy, toISODate } from "./lib/dates.mjs";

export function parseCloudflareCsv(text) {
  const rows = parseCsv(text);
  const daily = rows
    .map((r) => ({
      date: toISODate(r.date ?? r.Date),
      pageviews: Number(r.pageviews ?? r.Pageviews ?? r.views ?? 0) || 0,
    }))
    .filter((r) => r.date !== null);

  const filled = fillZeroDays(daily, { valueKeys: ["pageviews"] });
  return {
    daily: filled,
    totalPageviews: sumBy(filled, "pageviews"),
    dateRange:
      filled.length > 0
        ? { start: filled[0].date, end: filled[filled.length - 1].date }
        : null,
    daysCovered: filled.length,
  };
}

async function main() {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.error(
      "Usage: node scripts/report/parse-cloudflare.mjs <path-to-cloudflare.csv>",
    );
    process.exit(1);
  }
  const text = await readFile(filePath, "utf8");
  const result = parseCloudflareCsv(text);
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
