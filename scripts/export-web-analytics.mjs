#!/usr/bin/env node
// Exports Cloudflare Web Analytics (RUM) pageview counts to CSV via the GraphQL
// Analytics API. The dashboard has no export button for this data, so this is
// the only way to get it into a file. Requires CLOUDFLARE_API_TOKEN with the
// "Account Analytics" Read permission (dash.cloudflare.com → My Profile →
// API Tokens → Create Token → Custom token → Permissions: Account > Account Analytics > Read).

import { writeFileSync } from "node:fs";

const ACCOUNT_ID = "e3542aa284afa340484f15e25c09dfbc";
const SITE_TAG = "266a78ece56145ea95f9fa3448c74ed7"; // augustjones.shop | www | *.pages.dev

function parseArgs(argv) {
  const args = { since: null, until: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const [key, inlineValue] = argv[i].split("=");
    const value = inlineValue ?? argv[++i];
    if (key === "--since") args.since = value;
    else if (key === "--until") args.until = value;
    else if (key === "--out") args.out = value;
  }
  return args;
}

const { since, until, out } = parseArgs(process.argv.slice(2));

const untilDate = until ? new Date(until) : new Date();
const sinceDate = since
  ? new Date(since)
  : new Date(untilDate.getTime() - 30 * 24 * 3600 * 1000);

const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  console.error(
    "Set CLOUDFLARE_API_TOKEN (see comment at top of this script).",
  );
  process.exit(1);
}

const query = `
  query ($accountTag: string!, $siteTag: string!, $since: Time!, $until: Time!, $limit: uint64!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        rumPageloadEventsAdaptiveGroups(
          limit: $limit
          filter: { siteTag: $siteTag, datetime_geq: $since, datetime_leq: $until }
          orderBy: [date_ASC]
        ) {
          count
          dimensions { date }
        }
      }
    }
  }
`;

const daySpan = Math.ceil((untilDate - sinceDate) / (24 * 3600 * 1000)) + 1;

const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query,
    variables: {
      accountTag: ACCOUNT_ID,
      siteTag: SITE_TAG,
      since: sinceDate.toISOString(),
      until: untilDate.toISOString(),
      limit: Math.min(Math.max(daySpan, 1), 1000),
    },
  }),
});

const body = await response.json();
if (!response.ok || body.errors?.length) {
  console.error(
    "GraphQL request failed:",
    JSON.stringify(body.errors ?? body, null, 2),
  );
  process.exit(1);
}

const rows = body.data.viewer.accounts[0].rumPageloadEventsAdaptiveGroups;
const csv = [
  "date,pageviews",
  ...rows.map((r) => `${r.dimensions.date},${r.count}`),
].join("\n");

if (out) {
  writeFileSync(out, csv);
  console.log(`Wrote ${rows.length} rows to ${out}`);
} else {
  console.log(csv);
}
