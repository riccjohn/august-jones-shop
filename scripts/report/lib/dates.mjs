/**
 * Date helpers shared by the report-parsing scripts. Every date in the
 * pipeline is normalized to a plain `YYYY-MM-DD` string (UTC) so that
 * aggregation by day is a string-equality check, not a timezone-sensitive
 * Date comparison.
 */

/** Parses a date-ish string (Shopify's "2026-10-18 14:32:01 -0500", ISO, etc.) into "YYYY-MM-DD". Returns null if unparseable. */
export function toISODate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Fills gaps in a sparse { date, ...values } array with zero-valued rows so
 * every day between the earliest and latest date is present. Cloudflare's
 * exported CSV, in particular, omits zero-pageview days entirely rather
 * than writing a 0 — a chart or a day-count built straight from the file
 * would silently treat "absent" as "unknown" instead of "zero".
 *
 * `valueKeys` lists which fields get 0 on a filled-in day; any other key
 * present on existing rows is left off synthetic rows.
 */
export function fillZeroDays(rows, { dateKey = "date", valueKeys }) {
  if (rows.length === 0) return [];
  const byDate = new Map(rows.map((r) => [r[dateKey], r]));
  const dates = rows.map((r) => r[dateKey]).sort();
  const start = new Date(`${dates[0]}T00:00:00Z`);
  const end = new Date(`${dates[dates.length - 1]}T00:00:00Z`);

  const filled = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (byDate.has(iso)) {
      filled.push(byDate.get(iso));
    } else {
      const zeroRow = { [dateKey]: iso };
      for (const key of valueKeys) zeroRow[key] = 0;
      filled.push(zeroRow);
    }
  }
  return filled;
}

/** Sums a numeric field across rows. */
export function sumBy(rows, key) {
  return rows.reduce((total, r) => total + (Number(r[key]) || 0), 0);
}
