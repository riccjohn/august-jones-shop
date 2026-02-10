/**
 * Cloudflare Web Analytics utility
 * Provides type-safe event tracking for custom analytics events
 */

// Extend Window interface for Cloudflare beacon API
declare global {
  interface Window {
    __cfBeacon?: {
      load: (
        type: string,
        options?: { event: { name: string; [key: string]: unknown } },
      ) => void;
    };
  }
}

/**
 * Track a custom event in Cloudflare Web Analytics
 * @param eventName - Name of the event to track
 * @param metadata - Optional metadata to attach to the event
 */
export function trackEvent(
  eventName: string,
  metadata?: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined" || !window.__cfBeacon) {
    // Analytics not loaded or server-side rendering
    return;
  }

  try {
    window.__cfBeacon.load("single-page-application", {
      event: {
        name: eventName,
        ...metadata,
      },
    });
  } catch (error) {
    // Silently fail - don't break user experience for analytics
    console.warn("Analytics tracking failed:", error);
  }
}

/**
 * Track clicks to the Shopify/Etsy store
 * @param source - Where the click originated (e.g., "hero", "footer", "gallery_hoodie")
 */
export function trackShopifyClick(source?: string) {
  trackEvent("shopify_store_click", source ? { source } : undefined);
}

/**
 * Track clicks to Instagram
 * @param location - Where on the page the Instagram link was clicked
 */
export function trackInstagramClick(location: "hero" | "footer") {
  trackEvent("instagram_click", { location });
}

/**
 * Track contact form submissions (future use)
 */
export function trackContactFormSubmit() {
  trackEvent("contact_form_submit");
}
