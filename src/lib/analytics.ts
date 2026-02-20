const ENDPOINT = "/api/analytics";

// Keep in sync with functions/api/analytics.ts
interface AnalyticsPayload {
  event: string;
  source?: string;
  page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

function getUtmParams(): Pick<
  AnalyticsPayload,
  "utm_source" | "utm_medium" | "utm_campaign"
> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
  };
}

export function trackEvent(
  event: string,
  extra?: Omit<
    AnalyticsPayload,
    "event" | "page" | "utm_source" | "utm_medium" | "utm_campaign"
  >,
) {
  if (!event) return;
  if (typeof window === "undefined") return;

  const payload: AnalyticsPayload = {
    event,
    page: window.location.pathname,
    ...getUtmParams(),
    ...extra,
  };

  const body = JSON.stringify(payload);

  const sendViaFetch = () => {
    fetch(ENDPOINT, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  };

  try {
    const sent = navigator.sendBeacon(
      ENDPOINT,
      new Blob([body], { type: "application/json" }),
    );
    if (!sent) {
      sendViaFetch();
    }
  } catch {
    sendViaFetch();
  }
}

export function trackShopifyClick(source?: string) {
  trackEvent("shopify_store_click", source ? { source } : undefined);
}

export function trackInstagramClick(location: "hero" | "footer") {
  trackEvent("instagram_click", { source: location });
}

export function trackEmailClick() {
  trackEvent("email_click");
}
