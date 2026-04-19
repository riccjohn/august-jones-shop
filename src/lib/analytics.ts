declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string>) => void;
    };
  }
}

function track(eventName: string, eventData?: Record<string, string>) {
  if (typeof window === "undefined" || !window.umami) return;
  window.umami.track(eventName, eventData);
}

export function trackShopClick(source?: string) {
  track("shopify_store_click", source ? { source } : undefined);
}

export function trackInstagramClick(location: "hero" | "footer") {
  track("instagram_click", { source: location });
}

export function trackNavClick(destination: string) {
  track("nav_click", { destination });
}

export function trackEmailClick() {
  track("email_click");
}
