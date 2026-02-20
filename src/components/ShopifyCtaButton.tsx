"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trackShopifyClick } from "@/lib/analytics";

/**
 * Tracked CTA button for Shopify/Etsy store
 * Client component to handle click tracking
 */
export function ShopifyCtaButton() {
  return (
    <Button
      asChild
      size="lg"
      variant="brand"
      className="group h-14 w-full px-12 text-lg font-medium uppercase tracking-widest sm:h-16"
    >
      <Link
        href="https://www.etsy.com/shop/TheAugustJonesShop?utm_source=augustjones&utm_medium=website&utm_campaign=shop_cta"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackShopifyClick("hero")}
      >
        <span>Shop Now</span>
        <ArrowRight
          className="h-5 w-5 -translate-x-2 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
          aria-hidden="true"
        />
      </Link>
    </Button>
  );
}
