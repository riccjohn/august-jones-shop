"use client";

import { trackShopifyClick } from "@/lib/analytics";

/**
 * Tracked footer shop link component
 * Client component to handle click tracking from footer
 */
export function FooterShopLink() {
  return (
    <a
      href="https://www.etsy.com/shop/TheAugustJonesShop"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackShopifyClick("footer")}
      className="text-sm text-background/90 transition-colors hover:text-[#ffb612]"
    >
      Shop Now
    </a>
  );
}
