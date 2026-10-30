#!/usr/bin/env node
/**
 * Parses a Meta Business Suite content-performance export into a normalized
 * list of posts with their publish date and engagement numbers.
 *
 * Meta's export column names have changed across Business Suite versions
 * ("Publish time" vs. "Date", "Post" vs. "Description", etc.), so this
 * matches a handful of known aliases per field instead of one fixed header.
 * If none of a field's aliases are present, that field comes back null on
 * every row rather than the script failing outright — a date we can't
 * parse is still worth dropping (there's nothing to plot it against), but
 * missing engagement numbers shouldn't block the dates we do have.
 *
 * If this throws or everything comes back null, the real export's headers
 * don't match any alias here: run with no args to print the headers found,
 * then add the real column name to the matching alias list below.
 *
 * Usage:
 *   node scripts/report/parse-instagram.mjs <path-to-instagram-export.csv>
 */
import { readFile } from "node:fs/promises";
import { parseCsv } from "./lib/csv.mjs";
import { toISODate } from "./lib/dates.mjs";

const FIELD_ALIASES = {
  date: ["Publish time", "Date", "Created", "Post date", "Datetime"],
  title: ["Post", "Description", "Caption", "Title", "Post text"],
  permalink: ["Permalink", "Post link", "URL", "Link"],
  reach: ["Reach", "Reached audience", "Accounts reached"],
  engagement: ["Engagement", "Total engagement", "Interactions", "Engagements"],
  likes: ["Likes", "Reactions"],
  comments: ["Comments"],
  shares: ["Shares"],
};

function findColumn(headerKeys, aliases) {
  const lowerHeaders = headerKeys.map((k) => k.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = lowerHeaders.indexOf(alias.toLowerCase());
    if (idx !== -1) return headerKeys[idx];
  }
  return null;
}

export function parseInstagramCsv(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { posts: [], postCount: 0, dateRange: null, unmatchedHeaders: [] };
  }

  const headerKeys = Object.keys(rows[0]);
  const columns = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    columns[field] = findColumn(headerKeys, aliases);
  }
  if (!columns.date) {
    throw new Error(
      `parse-instagram: couldn't find a date column. Headers found: ${headerKeys.join(", ")}. ` +
        "Add the real header name to FIELD_ALIASES.date in this script.",
    );
  }

  const posts = rows
    .map((row) => ({
      date: toISODate(row[columns.date]),
      title: columns.title ? row[columns.title] : null,
      permalink: columns.permalink ? row[columns.permalink] : null,
      reach: columns.reach ? Number(row[columns.reach]) || 0 : null,
      engagement: columns.engagement
        ? Number(row[columns.engagement]) || 0
        : null,
      likes: columns.likes ? Number(row[columns.likes]) || 0 : null,
      comments: columns.comments ? Number(row[columns.comments]) || 0 : null,
      shares: columns.shares ? Number(row[columns.shares]) || 0 : null,
    }))
    .filter((p) => p.date !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    posts,
    postCount: posts.length,
    dateRange:
      posts.length > 0
        ? { start: posts[0].date, end: posts[posts.length - 1].date }
        : null,
    unmatchedHeaders: Object.entries(columns)
      .filter(([, col]) => col === null)
      .map(([field]) => field),
  };
}

async function main() {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.error(
      "Usage: node scripts/report/parse-instagram.mjs <path-to-instagram-export.csv>",
    );
    process.exit(1);
  }
  const text = await readFile(filePath, "utf8");
  const rows = parseCsv(text);
  if (rows.length > 0) {
    console.error(`Headers found: ${Object.keys(rows[0]).join(", ")}`);
  }
  console.log(JSON.stringify(parseInstagramCsv(text), null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
