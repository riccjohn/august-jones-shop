"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { trackNavClick, trackShopifyClick } from "@/lib/analytics";

const ETSY_SHOP_URL = "https://www.etsy.com/shop/TheAugustJonesShop";

const NAV_LINKS = [{ label: "About", href: "/about", key: "about" }] as const;

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/96 shadow-[0_1px_0_0_rgba(34,34,34,0.08)] backdrop-blur-md"
          : "bg-background/75 backdrop-blur-sm"
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5 sm:px-8"
      >
        {/* Logo — links home */}
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
            className="h-auto w-[72px] bg-transparent sm:w-20"
            priority
          />
        </Link>

        {/* Nav links */}
        <ul className="flex items-center gap-0.5 sm:gap-1">
          {NAV_LINKS.map(({ label, href, key }) => (
            <li key={key}>
              <Link
                href={href}
                onClick={() => trackNavClick(key)}
                className="group relative flex items-center px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
              >
                <span className="font-bebas-neue text-[13px] tracking-[0.14em] text-foreground/55 transition-colors duration-200 group-hover:text-foreground sm:text-[14px]">
                  {label}
                </span>
                {/* Sliding yellow underline */}
                <span
                  className="absolute bottom-1 left-3 right-3 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}

          {/* Shop CTA — outlined pill, fills on hover */}
          <li className="ml-2 sm:ml-3">
            <a
              href={`${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=nav`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackShopifyClick("nav")}
              className="group flex items-center gap-1.5 border border-foreground/30 px-3.5 py-1.5 transition-all duration-200 hover:border-accent hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm"
            >
              <span className="font-bebas-neue text-[13px] tracking-[0.14em] text-foreground/70 transition-colors duration-200 group-hover:text-foreground sm:text-[14px]">
                Shop
              </span>
              <svg
                width="9"
                height="9"
                viewBox="0 0 9 9"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-foreground/40 transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                aria-hidden="true"
              >
                <path
                  d="M1 8L8 1M8 1H2.5M8 1V6.5"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
