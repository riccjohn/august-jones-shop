/**
 * Minimal RFC 4180 CSV parser.
 *
 * Shopify's order/draft-order exports quote fields that contain commas,
 * newlines, or quotes (addresses, notes, multi-line descriptions) — a naive
 * `line.split(",")` silently corrupts those rows. This parser handles
 * quoting, escaped quotes (`""`), and embedded newlines inside quoted
 * fields, with no dependency beyond the platform.
 *
 * Returns an array of objects keyed by the header row. Blank trailing lines
 * are skipped. Values are returned as strings — callers convert types.
 */
export function parseCsv(text) {
  const rows = parseRows(text);
  if (rows.length === 0) return [];
  const [header, ...dataRows] = rows;
  return dataRows
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) => {
      const obj = {};
      header.forEach((key, i) => {
        obj[key] = row[i] ?? "";
      });
      return obj;
    });
}

/** Splits CSV text into rows of raw string cells, honoring RFC 4180 quoting. */
function parseRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  // Normalize line endings so \r\n inside/outside quotes behaves the same.
  const src = text.replace(/\r\n/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const char = src[i];

    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  // Final field/row, if the file doesn't end with a newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Parses a money string ("$1,234.56", "1234.56", "") into a number (0 for blank/invalid). */
export function parseMoney(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Splits a Shopify-style comma-separated tag string into a trimmed, non-empty array. */
export function parseTags(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
