#!/usr/bin/env node
/**
 * Renders report-data.json (+ an optional narrative.json for the written
 * parts) into one self-contained dashboard.html — no external JS, no CDN,
 * openable by double-click or attachable to an email.
 *
 * Every number on the page comes from report-data.json; this script never
 * invents one. Only the handful of sentences in narrative.json (the
 * takeaway, the opportunities list, data-quality notes) are free text —
 * see reports/traffic/inputs/README.md for that file's shape. Missing
 * optional sources (sales, custom requests, Cloudflare, Instagram) render
 * as a plain "not available this run" note instead of being silently
 * skipped, so the page always says what it does and doesn't cover.
 *
 * Usage:
 *   node scripts/report/generate-html.mjs \
 *     --in reports/traffic/report-data.json \
 *     --narrative reports/traffic/inputs/narrative.json \
 *     --out reports/traffic/dashboard.html
 */
import { readFile, writeFile } from "node:fs/promises";
import {
  esc,
  fmtChangePct,
  fmtCount,
  fmtDuration,
  fmtMoney,
  fmtPercent,
} from "./lib/format.mjs";
import {
  dailySeriesChart,
  groupedBarChart,
  horizontalBarChart,
} from "./lib/svg-charts.mjs";

const MONTH_ABBREVS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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

async function readJsonIfPresent(path, fallback) {
  if (!path) return fallback;
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

/** Best-effort single ISO date out of the free-text dates in events.json ("Oct 22, 2026", "Oct 2–3, 2026"). */
function extractFirstDate(text) {
  if (!text) return null;
  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString().slice(0, 10);
  const m = text.match(
    /([A-Z][a-z]{2})\s+(\d{1,2})(?:[–-]\d{1,2})?,?\s*(\d{4})/,
  );
  if (m) {
    const d = new Date(`${m[1]} ${m[2]}, ${m[3]}`);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

/** { [isoDate]: ["label", ...] } combining events.json and Instagram posts, for marking daily charts. */
function buildDayMarkers(events, instagramPosts) {
  const markers = {};
  const add = (date, label) => {
    if (!date) return;
    markers[date] = markers[date] ?? [];
    markers[date].push(label);
  };
  for (const ev of events ?? []) add(extractFirstDate(ev.date), ev.event);
  for (const post of instagramPosts?.posts ?? []) {
    add(
      post.date,
      post.title ? `IG: ${post.title.slice(0, 40)}` : "Instagram post",
    );
  }
  return markers;
}

/** { [monthAbbrev]: ["label", ...] } for the monthly trend chart's markers. */
function buildMonthMarkers(events) {
  const markers = {};
  for (const ev of events ?? []) {
    const abbr = MONTH_ABBREVS.find((m) => ev.date?.includes(m));
    if (abbr) {
      markers[abbr] = markers[abbr] ?? [];
      markers[abbr].push(ev.event);
    }
  }
  return markers;
}

function section(title, bodyHtml, note) {
  return `<section class="section"><h2>${esc(title)}</h2>${note ? `<p class="note">${esc(note)}</p>` : ""}<div class="card">${bodyHtml}</div></section>`;
}

function missingNote(label, statusObj) {
  const note = statusObj?.note?.replace(/\.$/, "");
  return `<p class="missing">${esc(label)} not available this run${note ? ` — ${esc(note)}` : ""}.</p>`;
}

function findKpi(kpis, win, metric) {
  return kpis.find((r) => r.window === win && r.metric === metric) ?? null;
}

function kpiValueText(row) {
  if (!row) return "—";
  if (row.unit === "percent") return fmtPercent(row.value);
  if (row.unit === "seconds") return fmtDuration(row.value);
  return fmtCount(row.value);
}

function renderKpiCard(row) {
  if (!row) return "";
  const change = fmtChangePct(row.change_pct);
  const changeHtml = change
    ? `<span class="kpi-change ${row.change_good ? "good" : "bad"}">${esc(change)} vs. prior period</span>`
    : "";
  return `<div class="kpi-card"><h3>${esc(row.label)}</h3><span class="kpi-value">${esc(kpiValueText(row))}</span>${changeHtml}</div>`;
}

function renderKpiWindow(title, kpis, win, metrics) {
  const cards = metrics
    .map((m) => renderKpiCard(findKpi(kpis, win, m)))
    .join("");
  return section(title, `<div class="kpi-grid">${cards}</div>`);
}

function renderTable(rows, columns) {
  const head = columns
    .map((c) => `<th${c.numeric ? ' class="num"' : ""}>${esc(c.label)}</th>`)
    .join("");
  const body = rows
    .map(
      (r) =>
        `<tr>${columns.map((c) => `<td${c.numeric ? ' class="num"' : ""}>${esc(c.format ? c.format(r[c.key]) : r[c.key])}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderMonthlyTrend(monthlyTrend, events) {
  if (!monthlyTrend?.length)
    return missingNote("Monthly trend", {
      note: "no umami.monthly_trend data",
    });
  const categories = monthlyTrend.map((m) => ({
    key: m.month.slice(0, 3),
    label: m.month,
    values: { views: m.views, visitors: m.visitors },
  }));
  const svg = groupedBarChart({
    categories,
    series: [
      { key: "views", label: "Views", color: "var(--chart-muted)" },
      { key: "visitors", label: "Visitors", color: "var(--chart-accent)" },
    ],
    markers: buildMonthMarkers(events),
  });
  return `<p class="note">Markers show months with a market pop-up — hover for which one.</p>${svg}`;
}

function renderEventsTimeline(events) {
  if (!events?.length)
    return missingNote("Events calendar", { note: "no events.json data" });
  const items = events
    .map(
      (e) =>
        `<li><span class="ev-date">${esc(e.date)}</span><span class="ev-name">${esc(e.event)}</span><span class="ev-note">${esc(e.note)}</span></li>`,
    )
    .join("");
  return `<ul class="timeline">${items}</ul>`;
}

function renderDailySeries(label, daily, valueKey, markers, formatter) {
  if (!daily?.length)
    return missingNote(label, { note: `no data for this source` });
  const points = daily.map((d) => ({ date: d.date, value: d[valueKey] ?? 0 }));
  const total = points.reduce((s, p) => s + p.value, 0);
  const svg = dailySeriesChart({ points, markers, valueLabel: valueKey });
  return `<p class="note">${esc(label)}: ${esc(formatter(total))} total over ${points.length} days. Dots mark a known event or Instagram post that day.</p>${svg}`;
}

function buildPage({ reportData, narrative }) {
  const umami = reportData.umami?.kpis ? reportData.umami : {};
  const kpis = umami.kpis ?? [];
  const events = Array.isArray(reportData.events) ? reportData.events : [];
  const dayMarkers = buildDayMarkers(events, reportData.instagramPosts);

  const windows = [
    { title: "Last 6 months", key: "Last 6 months" },
    { title: "Last 90 days", key: "Last 90 days" },
  ].filter((w) => kpis.some((r) => r.window === w.key));
  const metrics = [
    "visitors",
    "visits",
    "views",
    "bounce_rate",
    "visit_duration",
  ];

  const goalRow = findKpi(kpis, "Shop goal", "shop_conversion_rate");

  const audience = umami.audience ?? [];
  const browsers = audience.filter((a) => a.type === "browser");
  const countries = audience.filter((a) => a.type === "country");

  const sales = reportData.sales;
  const requests = reportData.customRequests;
  const cloudflare = reportData.cloudflarePageviews;
  const instagram = reportData.instagramPosts;

  const body = [
    `<header class="head"><p class="eyebrow">As of ${esc(narrative.asOf ?? reportData.generatedAt?.slice(0, 10) ?? "")}</p><h1>${esc(narrative.title ?? "Traffic & Trends")}</h1><p class="takeaway">${esc(narrative.takeaway ?? "")}</p></header>`,

    windows.map((w) => renderKpiWindow(w.title, kpis, w.key, metrics)).join(""),

    section("Monthly trend", renderMonthlyTrend(umami.monthly_trend, events)),

    section("Tying traffic to physical events", renderEventsTimeline(events)),

    section(
      "What’s converting",
      `<div class="two-col"><div class="kpi-card"><h3>Shop click-through</h3><span class="kpi-value">${esc(kpiValueText(goalRow))}</span><p class="note">Share of visitors who click through to the store.</p></div>${
        umami.custom_events?.length
          ? `<div><h3 class="chart-title">Custom events</h3>${horizontalBarChart(
              {
                rows: umami.custom_events,
                labelKey: "event",
                valueKey: "count",
                colorFor: (r) =>
                  r.event.startsWith("Email")
                    ? "var(--bad)"
                    : "var(--chart-accent)",
              },
            )}</div>`
          : missingNote("Custom events", {
              note: "no umami.custom_events data",
            })
      }</div>`,
    ),

    section(
      "Where traffic comes from",
      `<div class="two-col"><div><h3 class="chart-title">Channels</h3>${
        umami.channels?.length
          ? horizontalBarChart({
              rows: umami.channels,
              labelKey: "channel",
              valueKey: "visitors",
            })
          : missingNote("Channels", { note: "no umami.channels data" })
      }</div><div>${
        umami.referrers?.length
          ? renderTable(umami.referrers, [
              { key: "referrer", label: "Referrer" },
              {
                key: "visitors_6mo",
                label: "6 mo",
                numeric: true,
                format: fmtCount,
              },
              {
                key: "visitors_90d",
                label: "90 days",
                numeric: true,
                format: fmtCount,
              },
            ])
          : missingNote("Referrers", { note: "no umami.referrers data" })
      }</div></div>`,
    ),

    umami.top_pages?.length
      ? section(
          "Top pages",
          renderTable(umami.top_pages, [
            { key: "path", label: "Page" },
            {
              key: "visitors",
              label: "Visitors",
              numeric: true,
              format: fmtCount,
            },
            { key: "views", label: "Views", numeric: true, format: fmtCount },
            {
              key: "bounce",
              label: "Bounce",
              numeric: true,
              format: fmtPercent,
            },
            {
              key: "duration_sec",
              label: "Avg. time",
              numeric: true,
              format: fmtDuration,
            },
          ]),
        )
      : "",

    browsers.length || countries.length
      ? section(
          "Audience",
          `<div class="two-col"><div>${
            browsers.length
              ? renderTable(browsers, [
                  { key: "name", label: "Browser" },
                  {
                    key: "visitors",
                    label: "Visitors",
                    numeric: true,
                    format: fmtCount,
                  },
                ])
              : missingNote("Browsers", {})
          }</div><div>${
            countries.length
              ? renderTable(countries, [
                  { key: "name", label: "Country" },
                  {
                    key: "visitors",
                    label: "Visitors",
                    numeric: true,
                    format: fmtCount,
                  },
                ])
              : missingNote("Countries", {})
          }</div></div>`,
        )
      : "",

    section(
      "Sales",
      sales?.status
        ? missingNote("Sales", sales)
        : `<p class="note">${fmtCount(sales.orderCount)} orders, ${fmtMoney(sales.totalRevenue)} total revenue${sales.dateRange ? ` (${esc(sales.dateRange.start)} – ${esc(sales.dateRange.end)})` : ""}.</p>${renderDailySeries("Daily revenue", sales.daily, "revenue", dayMarkers, fmtMoney)}`,
    ),

    section(
      "Custom requests",
      requests?.status
        ? missingNote("Custom requests", requests)
        : `<p class="note">${fmtCount(requests.requestCount)} contact-form submissions${requests.dateRange ? ` (${esc(requests.dateRange.start)} – ${esc(requests.dateRange.end)})` : ""}.</p>${renderDailySeries("Daily requests", requests.daily, "count", dayMarkers, fmtCount)}`,
    ),

    section(
      "Cloudflare cross-check",
      cloudflare?.status
        ? missingNote("Cloudflare pageviews", cloudflare)
        : `<p class="note">${fmtCount(cloudflare.totalPageviews)} pageviews over ${cloudflare.daysCovered} days, per Cloudflare's own count — a rough cross-check against the Umami figures above, not the same metric.</p>${renderDailySeries("Cloudflare pageviews", cloudflare.daily, "pageviews", dayMarkers, fmtCount)}`,
    ),

    section(
      "Instagram posts",
      instagram?.status
        ? missingNote("Instagram posts", instagram)
        : renderTable(instagram.posts, [
            { key: "date", label: "Date" },
            { key: "title", label: "Post" },
            {
              key: "reach",
              label: "Reach",
              numeric: true,
              format: (v) => (v == null ? "—" : fmtCount(v)),
            },
            {
              key: "engagement",
              label: "Engagement",
              numeric: true,
              format: (v) => (v == null ? "—" : fmtCount(v)),
            },
          ]),
    ),

    narrative.opportunities?.length
      ? section(
          "Opportunities",
          `<ul class="opps">${narrative.opportunities.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>`,
        )
      : "",

    narrative.dataNotes?.length
      ? `<p class="data-notes">${narrative.dataNotes.map(esc).join(" ")}</p>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return htmlShell(narrative.title ?? "Traffic & Trends", body);
}

function htmlShell(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #f6f4f0; --panel: #ffffff; --text: #1c1c1c; --text-muted: #6b6b6b;
    --border: rgba(28,28,28,.12); --ok: #1a7f37; --bad: #b91c1c;
    --chart-accent: #222222; --chart-muted: #d8d2c4; --chart-critical: #ffb612; --chart-grid: rgba(28,28,28,.08);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #16140f; --panel: #221f1a; --text: #f6f4f0; --text-muted: #b9b4a8;
      --border: rgba(246,244,240,.14); --ok: #4ade80; --bad: #f87171;
      --chart-accent: #f6f4f0; --chart-muted: #4a463e; --chart-critical: #ffb612; --chart-grid: rgba(246,244,240,.10);
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .wrap { max-width: 1040px; margin: 0 auto; padding: 32px 16px 64px; }
  .head { padding-block: 12px 24px; }
  .eyebrow { margin: 0 0 6px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }
  h1 { font-family: "Bebas Neue", sans-serif; font-weight: 400; font-size: clamp(2.1rem, 5vw, 3.2rem); letter-spacing: .02em; margin: 0 0 8px; }
  .takeaway { font-size: 17px; color: var(--text-muted); margin: 0; max-width: 62ch; }
  .section { margin-block: 36px; }
  .section h2 { font-family: "Bebas Neue", sans-serif; font-weight: 400; font-size: 1.6rem; letter-spacing: .02em; margin: 0 0 10px; }
  .card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 20px; }
  .note { font-size: 13px; color: var(--text-muted); margin: 0 0 10px; }
  .missing { font-size: 13px; color: var(--text-muted); font-style: italic; margin: 0; }
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr)); gap: 14px; }
  .kpi-card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 18px; }
  .kpi-card h3 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); font-weight: 600; }
  .kpi-value { display: block; font-family: "Bebas Neue", sans-serif; font-size: 2rem; font-variant-numeric: tabular-nums; }
  .kpi-change { display: inline-block; margin-top: 6px; font-size: 12px; padding: 2px 8px; border-radius: 999px; }
  .kpi-change.good { color: var(--ok); background: color-mix(in srgb, var(--ok) 15%, transparent); }
  .kpi-change.bad { color: var(--bad); background: color-mix(in srgb, var(--bad) 15%, transparent); }
  .two-col { display: grid; grid-template-columns: repeat(auto-fit, minmax(21rem, 1fr)); gap: 20px; }
  .chart-title { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); font-weight: 600; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--border); font-size: 14px; }
  th { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .03em; }
  td.num, th.num { text-align: right; }
  tr:last-child td { border-bottom: none; }
  .timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
  .timeline li { display: grid; grid-template-columns: minmax(10rem, auto) 1fr; gap: 6px 16px; align-items: baseline; }
  .ev-date { font-size: 12px; color: var(--text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
  .ev-name { font-weight: 600; }
  .ev-note { color: var(--text-muted); font-size: 13px; grid-column: 2; }
  .opps { padding-left: 1.1rem; }
  .opps li { margin-bottom: 8px; }
  .data-notes { font-size: 12px; color: var(--text-muted); max-width: 80ch; }
  svg text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  @media (max-width: 480px) { .wrap { padding: 20px 12px 48px; } }
</style>
</head>
<body>
<div class="wrap">
${body}
</div>
</body>
</html>
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.in || !args.out) {
    console.error(
      "Usage: node scripts/report/generate-html.mjs --in <report-data.json> [--narrative <narrative.json>] --out <dashboard.html>",
    );
    process.exit(1);
  }
  const reportData = JSON.parse(await readFile(args.in, "utf8"));
  const narrative = await readJsonIfPresent(args.narrative, {});
  const html = buildPage({ reportData, narrative });
  await writeFile(args.out, html);
  console.error(`Wrote ${args.out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
