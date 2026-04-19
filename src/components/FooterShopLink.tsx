"use client";

import { trackShopClick } from "@/lib/analytics";
import { SHOP_URL } from "@/lib/constants";

/**
 * Tracked footer shop link component
 * Client component to handle click tracking from footer
 */
export function FooterShopLink() {
  return (
    <a
      href={SHOP_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackShopClick("footer")}
      className="text-sm text-foreground/60 transition-colors duration-200 hover:text-accent"
    >
      Shop Now
    </a>
  );
}
