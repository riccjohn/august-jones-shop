#!/usr/bin/env node
/**
 * Splits a merged report-data.json (from build-report-data.mjs) into the
 * individual per-dataset JSON files the dashboard Artifact expects — one
 * file per `datasets/<id>` document, ready to upload as an asset and point
 * a dataset doc at.
 *
 * This is the last deterministic step. What's left after it — uploading
 * each file as an asset, writing the `datasets/<id>` docs with the
 * resulting blob URLs, and authoring/updating index.html's markup and
 * charts — needs Claude's own tool calls and design judgment, so it isn't
 * scripted; see .claude/skills/traffic-report/SKILL.md for that part.
 *
 * Only datasets whose source data is actually present get written — a
 * `{ status: "missing" }` section is skipped, not written as an empty
 * file, so the directory listing itself shows what's still outstanding.
 *
 * Usage:
 *   node scripts/report/split-datasets.mjs --in reports/traffic/report-data.json --out-dir reports/traffic/datasets
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// [output filename, path into report-data.json, as dot-separated keys]
const DATASET_MAP = [
  ["monthly_trend.json", ["umami", "monthly_trend"]],
  ["kpis.json", ["umami", "kpis"]],
  ["channels.json", ["umami", "channels"]],
  ["referrers.json", ["umami", "referrers"]],
  ["custom_events.json", ["umami", "custom_events"]],
  ["top_pages.json", ["umami", "top_pages"]],
  ["audience.json", ["umami", "audience"]],
  ["events_calendar.json", ["events"]],
  ["daily_sales.json", ["sales", "daily"]],
  ["daily_requests.json", ["customRequests", "daily"]],
  ["cloudflare_pageviews.json", ["cloudflarePageviews", "daily"]],
  ["instagram_posts.json", ["instagramPosts", "posts"]],
];

function getPath(obj, path) {
  return path.reduce(
    (acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined),
    obj,
  );
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.in || !args["out-dir"]) {
    console.error(
      "Usage: node scripts/report/split-datasets.mjs --in <report-data.json> --out-dir <dir>",
    );
    process.exit(1);
  }

  const reportData = JSON.parse(await readFile(args.in, "utf8"));
  await mkdir(args["out-dir"], { recursive: true });

  const written = [];
  const skipped = [];

  for (const [filename, path] of DATASET_MAP) {
    const value = getPath(reportData, path);
    const isUsable = Array.isArray(value) && value.length > 0;
    if (!isUsable) {
      skipped.push(filename);
      continue;
    }
    await writeFile(
      join(args["out-dir"], filename),
      JSON.stringify(value, null, 2),
    );
    written.push(filename);
  }

  console.error(
    `Wrote ${written.length} dataset file(s) to ${args["out-dir"]}:`,
  );
  for (const f of written) console.error(`  ${f}`);
  if (skipped.length > 0) {
    console.error(`Skipped (no data yet): ${skipped.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
