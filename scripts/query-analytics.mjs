#!/usr/bin/env node

/**
 * Analytics Engine Query Script
 *
 * Runs named SQL queries against the Cloudflare Analytics Engine SQL HTTP API.
 *
 * Required environment variables:
 *   CF_ACCOUNT_ID  — Cloudflare account ID
 *   CF_API_TOKEN   — API token with Account Analytics: Read permission
 *   AE_DATASET_NAME — Analytics Engine dataset name (e.g. august_jones_analytics)
 *
 * Usage:
 *   node scripts/query-analytics.mjs                  # Show available queries
 *   node scripts/query-analytics.mjs event-counts     # Events in last 7 days
 *   node scripts/query-analytics.mjs shopify-sources  # Shopify click sources
 *   node scripts/query-analytics.mjs traffic-sources  # UTM / referrer breakdown
 *   node scripts/query-analytics.mjs top-countries    # Clicks by country
 *   node scripts/query-analytics.mjs all-events       # Full multi-dim breakdown
 */

const { CF_ACCOUNT_ID, CF_API_TOKEN, AE_DATASET_NAME } = process.env;

const QUERIES = {
  "event-counts": (dataset) => `
    SELECT blob1 AS event, count() AS total
    FROM ${dataset}
    WHERE timestamp > NOW() - INTERVAL '7' DAY
    GROUP BY blob1
    ORDER BY total DESC
  `,

  "shopify-sources": (dataset) => `
    SELECT blob2 AS source, count() AS total
    FROM ${dataset}
    WHERE blob1 = 'shopify_store_click'
      AND timestamp > NOW() - INTERVAL '7' DAY
    GROUP BY blob2
    ORDER BY total DESC
  `,

  "traffic-sources": (dataset) => `
    SELECT
      blob7 AS utm_source,
      blob8 AS utm_medium,
      blob4 AS referer,
      count() AS total
    FROM ${dataset}
    WHERE timestamp > NOW() - INTERVAL '7' DAY
    GROUP BY blob7, blob8, blob4
    ORDER BY total DESC
  `,

  "top-countries": (dataset) => `
    SELECT blob5 AS country, count() AS total
    FROM ${dataset}
    WHERE timestamp > NOW() - INTERVAL '7' DAY
    GROUP BY blob5
    ORDER BY total DESC
  `,

  "all-events": (dataset) => `
    SELECT
      blob1 AS event,
      blob2 AS source,
      blob3 AS page,
      blob5 AS country,
      blob7 AS utm_source,
      blob10 AS device,
      count() AS total
    FROM ${dataset}
    WHERE timestamp > NOW() - INTERVAL '7' DAY
    GROUP BY blob1, blob2, blob3, blob5, blob7, blob10
    ORDER BY total DESC
  `,
};

async function runQuery(name) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !AE_DATASET_NAME) {
    console.error(
      "Missing required environment variables: CF_ACCOUNT_ID, CF_API_TOKEN, AE_DATASET_NAME",
    );
    process.exit(1);
  }

  if (!/^[a-z_][a-z0-9_]*$/i.test(AE_DATASET_NAME)) {
    throw new Error(
      `Invalid dataset name "${AE_DATASET_NAME}". Must match /^[a-z_][a-z0-9_]*$/i (letters, digits, and underscores only, cannot start with a digit).`,
    );
  }

  const queryFn = QUERIES[name];
  if (!queryFn) {
    console.error(`Unknown query: "${name}"`);
    console.error(`Available queries: ${Object.keys(QUERIES).join(", ")}`);
    process.exit(1);
  }

  const sql = queryFn(AE_DATASET_NAME).trim();
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql`;

  console.log(`Running query: ${name}\n`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "text/plain",
    },
    body: sql,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const data = await response.json();

  if (data.data && data.data.length > 0) {
    console.table(data.data);
    console.log(`\nRows returned: ${data.data.length}`);
  } else {
    console.log("No data returned.");
  }
}

async function main() {
  const queryName = process.argv[2];

  if (!queryName) {
    console.log("Available queries:");
    for (const name of Object.keys(QUERIES)) {
      console.log(`  node scripts/query-analytics.mjs ${name}`);
    }
    return;
  }

  await runQuery(queryName);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
