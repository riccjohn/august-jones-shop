#!/usr/bin/env node
/**
 * Parses a Shopify "Orders" CSV export into daily sales totals.
 *
 * Shopify exports one CSV row per line item, not per order: a 3-item order
 * produces 3 rows, and order-level fields (Total, Created at, Tags,
 * Financial Status) are repeated on every one of those rows. Summing
 * "Total" directly would triple-count that order's revenue — this script
 * groups rows by the order's "Name" column and takes the order-level
 * figures once per order, while still summing "Lineitem quantity" across
 * every row to get a real item count.
 *
 * Column names are matched case-insensitively against Shopify's standard
 * export headers (Name, Created at, Total, Tags, Financial Status,
 * Lineitem quantity). If Shopify changes its export shape, this will throw
 * a readable "missing column" error rather than silently reporting zeros.
 *
 * Usage:
 *   node scripts/report/parse-shopify-orders.mjs <path-to-orders.csv>
 */
import { readFile } from "node:fs/promises";
import { parseCsv, parseMoney, parseTags } from "./lib/csv.mjs";
import { fillZeroDays, sumBy, toISODate } from "./lib/dates.mjs";

const REQUIRED_COLUMNS = ["Name", "Created at", "Total"];

function findColumn(headerKeys, wanted) {
  return headerKeys.find(
    (k) => k.trim().toLowerCase() === wanted.toLowerCase(),
  );
}

export function parseShopifyOrdersCsv(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return {
      orders: [],
      daily: [],
      totalRevenue: 0,
      orderCount: 0,
      dateRange: null,
    };
  }

  const headerKeys = Object.keys(rows[0]);
  const columns = {};
  for (const wanted of REQUIRED_COLUMNS) {
    const found = findColumn(headerKeys, wanted);
    if (!found) {
      throw new Error(
        `parse-shopify-orders: expected a "${wanted}" column in the orders export, found: ${headerKeys.join(", ")}`,
      );
    }
    columns[wanted] = found;
  }
  const tagsCol = findColumn(headerKeys, "Tags");
  const financialStatusCol = findColumn(headerKeys, "Financial Status");
  const lineitemQtyCol = findColumn(headerKeys, "Lineitem quantity");

  const byOrder = new Map();
  for (const row of rows) {
    const name = row[columns.Name];
    if (!name) continue;
    const qty = lineitemQtyCol ? Number(row[lineitemQtyCol]) || 0 : 0;
    if (!byOrder.has(name)) {
      byOrder.set(name, {
        orderName: name,
        createdAt: toISODate(row[columns["Created at"]]),
        total: parseMoney(row[columns.Total]),
        tags: tagsCol ? parseTags(row[tagsCol]) : [],
        financialStatus: financialStatusCol ? row[financialStatusCol] : null,
        itemCount: 0,
      });
    }
    byOrder.get(name).itemCount += qty;
  }

  const orders = Array.from(byOrder.values()).filter(
    (o) => o.createdAt !== null,
  );

  const byDate = new Map();
  for (const o of orders) {
    const entry = byDate.get(o.createdAt) ?? {
      date: o.createdAt,
      orders: 0,
      revenue: 0,
    };
    entry.orders += 1;
    entry.revenue += o.total;
    byDate.set(o.createdAt, entry);
  }
  const daily = fillZeroDays(Array.from(byDate.values()), {
    valueKeys: ["orders", "revenue"],
  });

  return {
    orders,
    daily,
    totalRevenue: Math.round(sumBy(orders, "total") * 100) / 100,
    orderCount: orders.length,
    dateRange:
      daily.length > 0
        ? { start: daily[0].date, end: daily[daily.length - 1].date }
        : null,
  };
}

async function main() {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.error(
      "Usage: node scripts/report/parse-shopify-orders.mjs <path-to-orders.csv>",
    );
    process.exit(1);
  }
  const text = await readFile(filePath, "utf8");
  console.log(JSON.stringify(parseShopifyOrdersCsv(text), null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
