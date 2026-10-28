#!/usr/bin/env node
/**
 * Parses a Shopify "Draft orders" CSV export into daily custom-request
 * counts.
 *
 * Every contact-form submission (functions/api/contact.ts) creates exactly
 * one draft order tagged "contact-form", with a $0.00 line item and the
 * submission details in the note — so draft orders carrying that tag ARE
 * the custom-request log. This script filters to that tag defensively
 * (even if the export was already filtered in the Shopify UI by
 * `tag:contact-form`) so a stray non-request draft never inflates the
 * count.
 *
 * Usage:
 *   node scripts/report/parse-shopify-drafts.mjs <path-to-drafts.csv> [--tag contact-form]
 */
import { readFile } from "node:fs/promises";
import { parseCsv, parseTags } from "./lib/csv.mjs";
import { fillZeroDays, toISODate } from "./lib/dates.mjs";

const REQUIRED_COLUMNS = ["Name", "Created At"];

function findColumn(headerKeys, wanted) {
  return headerKeys.find(
    (k) => k.trim().toLowerCase() === wanted.toLowerCase(),
  );
}

export function parseShopifyDraftsCsv(text, { tag = "contact-form" } = {}) {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { requests: [], daily: [], requestCount: 0, dateRange: null };
  }

  const headerKeys = Object.keys(rows[0]);
  const columns = {};
  for (const wanted of REQUIRED_COLUMNS) {
    // Shopify's draft-order export has used both "Created At" and
    // "Created at" across versions; match case-insensitively either way.
    const found = findColumn(headerKeys, wanted);
    if (!found) {
      throw new Error(
        `parse-shopify-drafts: expected a "${wanted}" column in the drafts export, found: ${headerKeys.join(", ")}`,
      );
    }
    columns[wanted] = found;
  }
  const tagsCol = findColumn(headerKeys, "Tags");
  const statusCol = findColumn(headerKeys, "Status");
  const noteCol =
    findColumn(headerKeys, "Note") ?? findColumn(headerKeys, "Notes");

  const requests = rows
    .map((row) => ({
      draftName: row[columns.Name],
      createdAt: toISODate(row[columns["Created At"]]),
      status: statusCol ? row[statusCol] : null,
      tags: tagsCol ? parseTags(row[tagsCol]) : [],
      note: noteCol ? row[noteCol] : null,
    }))
    .filter((r) => r.createdAt !== null && (!tagsCol || r.tags.includes(tag)));

  const byDate = new Map();
  for (const r of requests) {
    const entry = byDate.get(r.createdAt) ?? { date: r.createdAt, count: 0 };
    entry.count += 1;
    byDate.set(r.createdAt, entry);
  }
  const daily = fillZeroDays(Array.from(byDate.values()), {
    valueKeys: ["count"],
  });

  return {
    requests,
    daily,
    requestCount: requests.length,
    dateRange:
      daily.length > 0
        ? { start: daily[0].date, end: daily[daily.length - 1].date }
        : null,
  };
}

async function main() {
  const [, , filePath, ...rest] = process.argv;
  if (!filePath) {
    console.error(
      "Usage: node scripts/report/parse-shopify-drafts.mjs <path-to-drafts.csv> [--tag contact-form]",
    );
    process.exit(1);
  }
  const tagFlagIndex = rest.indexOf("--tag");
  const tag = tagFlagIndex !== -1 ? rest[tagFlagIndex + 1] : "contact-form";
  const text = await readFile(filePath, "utf8");
  console.log(JSON.stringify(parseShopifyDraftsCsv(text, { tag }), null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
