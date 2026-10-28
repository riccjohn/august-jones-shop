/** Shared number/date formatting for the generated report HTML. */

export function fmtCount(n) {
  return Number(n ?? 0).toLocaleString("en-US");
}

export function fmtPercent(n) {
  return `${n}%`;
}

export function fmtMoney(n) {
  return Number(n ?? 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function fmtDuration(sec) {
  sec = Number(sec) || 0;
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export function fmtChangePct(changePct) {
  if (changePct === null || changePct === undefined) return null;
  const sign = changePct > 0 ? "+" : "";
  return `${sign}${changePct}%`;
}

/** Escapes text for safe insertion into HTML (this report embeds real exported data, some of it free text — e.g. Instagram captions, event notes). */
export function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
