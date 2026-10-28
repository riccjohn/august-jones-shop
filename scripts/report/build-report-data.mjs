#!/usr/bin/env node
/**
 * Merges every traffic-report input into one report-data.json.
 *
 * Every input is optional and independent, so this can be run repeatedly
 * as pieces of data arrive during the interview the traffic-report skill
 * runs (.claude/skills/traffic-report/SKILL.md) — a key whose source file
 * wasn't passed comes back `{ status: "missing" }` instead of the script
 * failing, so partial progress is always inspectable.
 *
 * umami.json and events.json aren't CSV exports — they're written directly
 * (by hand or, for events.json, scraped from augustjones.shop/events) in
 * the shapes documented in reports/traffic/inputs/README.md. Everything
 * else here is deterministic CSV parsing; only those two + the final
 * dashboard write are judgment calls left to whoever runs the skill.
 *
 * Usage:
 *   node scripts/report/build-report-data.mjs \
 *     --umami reports/traffic/inputs/umami.json \
 *     --events reports/traffic/inputs/events.json \
 *     --orders reports/traffic/inputs/orders.csv \
 *     --drafts reports/traffic/inputs/drafts.csv \
 *     --cloudflare reports/traffic/inputs/cloudflare.csv \
 *     --instagram reports/traffic/inputs/instagram.csv \
 *     --out reports/traffic/report-data.json
 *
 * Every flag is optional except --out.
 */
import { readFile, writeFile } from "node:fs/promises";
import { parseCloudflareCsv } from "./parse-cloudflare.mjs";
import { parseInstagramCsv } from "./parse-instagram.mjs";
import { parseShopifyDraftsCsv } from "./parse-shopify-drafts.mjs";
import { parseShopifyOrdersCsv } from "./parse-shopify-orders.mjs";

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

async function readJsonIfPresent(path, label) {
  if (!path)
    return {
      status: "missing",
      note: `No ${label} provided (--${label.toLowerCase()} flag not set).`,
    };
  try {
    const text = await readFile(path, "utf8");
    return JSON.parse(text);
  } catch (err) {
    return {
      status: "error",
      note: `Couldn't read/parse ${path}: ${err.message}`,
    };
  }
}

async function readCsvIfPresent(path, label, parseFn) {
  if (!path)
    return {
      status: "missing",
      note: `No ${label} CSV provided (--${label.toLowerCase()} flag not set).`,
    };
  try {
    const text = await readFile(path, "utf8");
    return parseFn(text);
  } catch (err) {
    return {
      status: "error",
      note: `Couldn't read/parse ${path}: ${err.message}`,
    };
  }
}

async function build(args) {
  const [umami, events, orders, drafts, cloudflare, instagram] =
    await Promise.all([
      readJsonIfPresent(args.umami, "Umami"),
      readJsonIfPresent(args.events, "Events"),
      readCsvIfPresent(args.orders, "Orders", parseShopifyOrdersCsv),
      readCsvIfPresent(args.drafts, "Drafts", parseShopifyDraftsCsv),
      readCsvIfPresent(args.cloudflare, "Cloudflare", parseCloudflareCsv),
      readCsvIfPresent(args.instagram, "Instagram", parseInstagramCsv),
    ]);

  return {
    generatedAt: new Date().toISOString(),
    umami,
    events,
    sales: orders,
    customRequests: drafts,
    cloudflarePageviews: cloudflare,
    instagramPosts: instagram,
  };
}

function summarize(reportData) {
  const lines = [];
  const note = (label, value) => {
    if (value?.status === "missing")
      lines.push(`  ${label}: missing — ${value.note}`);
    else if (value?.status === "error")
      lines.push(`  ${label}: ERROR — ${value.note}`);
    else lines.push(`  ${label}: ok`);
  };
  note("umami", reportData.umami);
  note("events", reportData.events);
  note("sales (orders)", reportData.sales);
  note("customRequests (drafts)", reportData.customRequests);
  note("cloudflarePageviews", reportData.cloudflarePageviews);
  note("instagramPosts", reportData.instagramPosts);
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.out) {
    console.error(
      "Usage: node scripts/report/build-report-data.mjs --out <path> [--umami ...] [--events ...] [--orders ...] [--drafts ...] [--cloudflare ...] [--instagram ...]",
    );
    process.exit(1);
  }
  const reportData = await build(args);
  await writeFile(args.out, JSON.stringify(reportData, null, 2));
  console.error(`Wrote ${args.out}\n${summarize(reportData)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
