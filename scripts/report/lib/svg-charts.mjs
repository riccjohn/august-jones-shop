/**
 * Zero-dependency SVG chart builders for the generated report HTML.
 *
 * Everything here is plain string-building arithmetic — no DOM, no browser,
 * no charting library — so the output HTML file is fully self-contained
 * and the same report-data.json always renders the same pixels. Native
 * SVG `<title>` elements give hover tooltips with no JavaScript.
 *
 * Colors are passed in as CSS `var(--token)` strings so the surrounding
 * page's stylesheet controls the palette (including light/dark mode) —
 * these functions never hardcode a hex value.
 */

function svgOpen(width, height, label) {
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${label}">`;
}

/**
 * A grouped bar chart over a small number of categories (e.g. months),
 * with 1-2 series per category and optional event markers above a
 * category's tallest bar.
 *
 * categories: [{ key, label, values: { seriesKey: number } }]
 * series: [{ key, label, color }]
 * markers: { [categoryKey]: string[] } — triangle + <title> tooltip per marked category
 */
export function groupedBarChart({
  categories,
  series,
  markers = {},
  width = 720,
  height = 340,
}) {
  const marginLeft = 42;
  const marginBottom = 34;
  const marginTop = 30;
  const plotWidth = width - marginLeft - 12;
  const plotHeight = height - marginTop - marginBottom;

  const maxValue = Math.max(
    1,
    ...categories.flatMap((c) => series.map((s) => c.values[s.key] ?? 0)),
  );
  const y = (v) => marginTop + plotHeight - (v / maxValue) * plotHeight;
  const catWidth = plotWidth / categories.length;
  const barGap = catWidth * 0.12;
  const groupWidth = catWidth - barGap * 2;
  const barWidth = groupWidth / series.length - 4;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const value = Math.round(maxValue * t);
    const yPos = y(value);
    return (
      `<line x1="${marginLeft}" x2="${width - 8}" y1="${yPos}" y2="${yPos}" stroke="var(--chart-grid)" stroke-width="1"/>` +
      `<text x="${marginLeft - 8}" y="${yPos + 4}" font-size="11" fill="var(--text-muted)" text-anchor="end">${value.toLocaleString("en-US")}</text>`
    );
  });

  const bars = categories
    .map((cat, ci) => {
      const groupX = marginLeft + ci * catWidth + barGap;
      const seriesBars = series
        .map((s, si) => {
          const value = cat.values[s.key] ?? 0;
          const bx = groupX + si * (barWidth + 4);
          const by = y(value);
          return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${(marginTop + plotHeight - by).toFixed(1)}" rx="3" fill="${s.color}"><title>${cat.label} · ${s.label}: ${value.toLocaleString("en-US")}</title></rect>`;
        })
        .join("");
      const labelX = groupX + groupWidth / 2;
      const marks = markers[cat.key];
      const markSvg = marks?.length
        ? (() => {
            const topY =
              Math.min(...series.map((s) => y(cat.values[s.key] ?? 0))) - 14;
            return `<path d="M ${labelX} ${topY - 8} l 6 10 l -12 0 z" fill="var(--chart-critical)"><title>${marks.map((m) => esc(m)).join(", ")}</title></path>`;
          })()
        : "";
      return `${seriesBars}${markSvg}<text x="${labelX.toFixed(1)}" y="${height - marginBottom + 18}" font-size="11" text-anchor="middle" fill="var(--text-muted)">${esc(cat.label)}</text>`;
    })
    .join("");

  const legend = series
    .map(
      (s, i) =>
        `<rect x="${marginLeft + i * 90}" y="6" width="10" height="10" fill="${s.color}"/><text x="${marginLeft + i * 90 + 14}" y="15" font-size="11" fill="var(--text-muted)">${esc(s.label)}</text>`,
    )
    .join("");
  const markerLegend = Object.keys(markers).length
    ? `<path d="M ${marginLeft + series.length * 90} 6 l 6 10 l -12 0 z" fill="var(--chart-critical)"/><text x="${marginLeft + series.length * 90 + 12}" y="15" font-size="11" fill="var(--text-muted)">Market week</text>`
    : "";

  return `${svgOpen(width, height, "Bar chart")}${gridLines.join("")}${bars}${legend}${markerLegend}</svg>`;
}

/** A horizontal bar chart ranking rows by one value (channels, custom events, referrers). */
export function horizontalBarChart({
  rows,
  labelKey,
  valueKey,
  colorFor,
  width = 640,
  rowHeight = 32,
  labelWidth = 170,
}) {
  const height = rows.length * rowHeight + 12;
  const maxValue = Math.max(1, ...rows.map((r) => r[valueKey] ?? 0));
  const barMax = width - labelWidth - 56;

  const bars = rows
    .map((r, i) => {
      const value = r[valueKey] ?? 0;
      const barW = Math.max(2, (value / maxValue) * barMax);
      const y = 6 + i * rowHeight;
      const color = colorFor ? colorFor(r) : "var(--chart-accent)";
      return (
        `<text x="0" y="${y + rowHeight * 0.42}" font-size="12" fill="var(--text-muted)">${esc(r[labelKey])}</text>` +
        `<rect x="${labelWidth}" y="${y + 2}" width="${barW.toFixed(1)}" height="${(rowHeight * 0.52).toFixed(1)}" rx="3" fill="${color}"><title>${esc(r[labelKey])}: ${value.toLocaleString("en-US")}</title></rect>` +
        `<text x="${labelWidth + barW + 8}" y="${y + rowHeight * 0.42}" font-size="12" fill="var(--text)">${value.toLocaleString("en-US")}</text>`
      );
    })
    .join("");

  return `${svgOpen(width, height, "Ranked bar chart")}${bars}</svg>`;
}

/**
 * A single-series bar chart over a (possibly long) run of dates, with
 * x-axis labels thinned to whatever fits, and optional per-date event
 * markers.
 *
 * points: [{ date, value }] — assumed already sorted and gap-filled
 * markers: { [date]: string[] }
 */
export function dailySeriesChart({
  points,
  width = 760,
  height = 240,
  markers = {},
  valueLabel = "",
}) {
  const marginLeft = 42;
  const marginBottom = 34;
  const marginTop = 22;
  const plotWidth = width - marginLeft - 8;
  const plotHeight = height - marginTop - marginBottom;

  const maxValue = Math.max(1, ...points.map((p) => p.value));
  const barWidth = plotWidth / points.length;
  const y = (v) => marginTop + plotHeight - (v / maxValue) * plotHeight;

  // Thin labels so they don't collide: show at most ~10 across the width.
  const labelEvery = Math.max(1, Math.ceil(points.length / 10));

  const gridLines = [0, 0.5, 1].map((t) => {
    const value = Math.round(maxValue * t);
    const yPos = y(value);
    return (
      `<line x1="${marginLeft}" x2="${width - 8}" y1="${yPos}" y2="${yPos}" stroke="var(--chart-grid)" stroke-width="1"/>` +
      `<text x="${marginLeft - 8}" y="${yPos + 4}" font-size="11" fill="var(--text-muted)" text-anchor="end">${value.toLocaleString("en-US")}</text>`
    );
  });

  const bars = points
    .map((p, i) => {
      const bx = marginLeft + i * barWidth;
      const by = y(p.value);
      const bw = Math.max(1, barWidth - 1);
      const mark = markers[p.date];
      const label =
        i % labelEvery === 0
          ? `<text x="${(bx + bw / 2).toFixed(1)}" y="${height - marginBottom + 16}" font-size="10" fill="var(--text-muted)" text-anchor="middle">${p.date.slice(5)}</text>`
          : "";
      const markSvg = mark?.length
        ? `<circle cx="${(bx + bw / 2).toFixed(1)}" cy="${(by - 7).toFixed(1)}" r="3.5" fill="var(--chart-critical)"><title>${mark.map((m) => esc(m)).join(", ")}</title></circle>`
        : "";
      return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${(marginTop + plotHeight - by).toFixed(1)}" fill="var(--chart-accent)"><title>${p.date}${valueLabel ? ` · ${valueLabel}` : ""}: ${p.value.toLocaleString("en-US")}</title></rect>${markSvg}${label}`;
    })
    .join("");

  return `${svgOpen(width, height, "Daily series chart")}${gridLines.join("")}${bars}</svg>`;
}

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
