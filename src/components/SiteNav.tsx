"use client";

import Image from "next/image";
import Link from "next/link";
import { trackNavClick, trackShopifyClick } from "@/lib/analytics";

const ETSY_SHOP_URL = "https://www.etsy.com/shop/TheAugustJonesShop";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/95 backdrop-blur-sm">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3"
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="August Jones — home"
          onClick={() => trackNavClick("home")}
          className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
        >
          <Image
            src="/logos/August_Jones_Logo.svg"
            alt="August Jones"
            width={120}
            height={120}
            className="h-auto w-20 bg-background sm:w-24"
            priority
          />
        </Link>

        {/* Nav links */}
        <ul className="flex items-center gap-1 sm:gap-2">
          <li>
            <Link
              href="/about"
              onClick={() => trackNavClick("about")}
              className="rounded-sm px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              About
            </Link>
          </li>
          <li>
            <Link
              href="/contact"
              onClick={() => trackNavClick("contact")}
              className="rounded-sm px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Contact
            </Link>
          </li>
          <li>
            <a
              href={`${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=nav`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackShopifyClick("nav")}
              className="rounded-sm bg-accent px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Shop
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
