interface Env {
  ANALYTICS: AnalyticsEngineDataset;
}

// Keep in sync with src/lib/analytics.ts
interface AnalyticsPayload {
  event: string;
  source?: string;
  page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

const ALLOWED_ORIGINS = new Set([
  "https://augustjones.shop",
  "https://www.augustjones.shop",
]);

const ALLOWED_EVENTS = new Set([
  "shopify_store_click",
  "instagram_click",
  "email_click",
]);

const MAX_BODY_BYTES = 2048;
const MAX_BLOB_LENGTH = 256;

function truncate(value: string): string {
  return value.length > MAX_BLOB_LENGTH
    ? value.slice(0, MAX_BLOB_LENGTH)
    : value;
}

// iPadOS 13+ uses a desktop-class UA — detect via Sec-CH-UA-Platform or
// Sec-CH-UA-Mobile client hints when available. Pure UA sniffing cannot
// reliably distinguish iPadOS 13+ from macOS without touch event data,
// which is not accessible server-side.
function deriveDeviceType(
  ua: string,
  headers: Headers,
): "mobile" | "tablet" | "desktop" {
  // Prefer client hints when available (more reliable than UA sniffing)
  const uaMobile = headers.get("Sec-CH-UA-Mobile");
  const uaPlatform = headers.get("Sec-CH-UA-Platform")?.toLowerCase() ?? "";

  if (uaPlatform === '"ipad"' || uaPlatform === "ipad") return "tablet";

  const s = ua.toLowerCase();

  if (/tablet|ipad|playbook|silk/.test(s)) return "tablet";
  // Android without "mobile" = tablet
  if (/android(?!.*mobile)/.test(s)) return "tablet";
  if (uaMobile === "?1") return "mobile";
  if (/mobile|iphone|ipod|blackberry|windows phone/.test(s)) return "mobile";
  return "desktop";
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Reject oversized bodies early (check Content-Length header)
  const contentLength = request.headers.get("Content-Length");
  if (contentLength !== null && Number(contentLength) > MAX_BODY_BYTES) {
    return new Response(null, { status: 400 });
  }

  // Known limitation: requests without an Origin header (e.g. server-to-server curl) bypass this check.
  // Acceptable for an append-only analytics endpoint with no auth or sensitive data.
  const origin = request.headers.get("Origin");
  if (origin !== null && !ALLOWED_ORIGINS.has(origin)) {
    return new Response(null, { status: 403 });
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    return new Response(null, { status: 415 });
  }

  let payload: AnalyticsPayload;
  try {
    payload = await request.json<AnalyticsPayload>();
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!payload.event || typeof payload.event !== "string") {
    return new Response(null, { status: 400 });
  }

  // Whitelist allowed event names
  if (!ALLOWED_EVENTS.has(payload.event)) {
    return new Response(null, { status: 400 });
  }

  const ua = request.headers.get("User-Agent") ?? "";
  const referer = request.headers.get("Referer") ?? "";
  const cf = request.cf as IncomingRequestCfProperties | undefined;

  env.ANALYTICS.writeDataPoint({
    indexes: [payload.event],
    blobs: [
      truncate(payload.event),
      truncate(payload.source ?? ""),
      truncate(payload.page ?? ""),
      truncate(referer),
      truncate(cf?.country ?? ""),
      truncate(cf?.city ?? ""),
      truncate(payload.utm_source ?? ""),
      truncate(payload.utm_medium ?? ""),
      truncate(payload.utm_campaign ?? ""),
      truncate(deriveDeviceType(ua, request.headers)),
      truncate(ua),
    ],
  });

  return new Response(null, { status: 204 });
};
