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
      className="text-sm text-foreground/60 transition-colors duration-200 hover:text-accent"
    >
      Shop Now
    </a>
  );
}
