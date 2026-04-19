"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { trackNavClick, trackShopClick } from "@/lib/analytics";
import { SHOP_URL } from "@/lib/constants";

const NAV_LINKS = [
  { label: "About", href: "/about", key: "about" },
  { label: "Events", href: "/events", key: "events" },
  { label: "Contact", href: "/contact", key: "contact" },
] as const;

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useLayoutEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 32);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const solidBg = scrolled || menuOpen;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        solidBg
          ? "bg-background/95 shadow-[0_1px_0_0_oklch(0.28_0.005_264)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.77, 0, 0.175, 1)" }}
    >
      {/*
       * Desktop: [Logo] ................. [About] [Contact] [Shop]
       * Mobile:  [☰] .... [Logo] .... [Shop]
       *
       * On mobile the logo is absolutely centered between the two edge controls.
       */}
      <nav
        aria-label="Main navigation"
        className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-3 sm:px-8"
      >
        {/* ── HAMBURGER — mobile left, hidden on desktop ── */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
          className="h-11 w-11 text-foreground/85 sm:hidden"
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </Button>

        {/* ── LOGO
              Mobile: absolute center (removed from flow, centered over the bar)
              Desktop: static, left-most flex item
        ── */}
        <Link
          href="/"
          aria-label="August Jones — home"
          onClick={() => {
            trackNavClick("home");
            setMenuOpen(false);
          }}
          className="absolute left-1/2 -translate-x-1/2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:static sm:translate-x-0"
        >
          <Image
            src="/logos/August_Jones-Horitontal_Logo-transparent_white.svg"
            alt="August Jones"
            width={360}
            height={180}
            className="h-auto w-32.5 sm:w-40"
            priority
          />
        </Link>

        {/* ── RIGHT SIDE: desktop nav links + shop CTA (always) ── */}
        <ul className="flex items-center gap-1">
          {/* Desktop nav links — hidden on mobile */}
          {NAV_LINKS.map(({ label, href, key }) => (
            <li key={key} className="hidden sm:block">
              <Link
                href={href}
                onClick={() => trackNavClick(key)}
                className="group relative flex items-center rounded-sm px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="font-bebas-neue text-[15px] tracking-[0.12em] text-foreground/85 transition-colors duration-200 group-hover:text-foreground">
                  {label}
                </span>
                {/* Yellow sliding underline */}
                <span
                  className="absolute bottom-1.5 left-3 right-3 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
                  aria-hidden="true"
                  style={{
                    transitionTimingFunction: "cubic-bezier(0.77, 0, 0.175, 1)",
                  }}
                />
              </Link>
            </li>
          ))}

          {/* Shop CTA — always visible */}
          <li className="sm:ml-3">
            <a
              href={`${SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=nav`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackShopClick("nav")}
              className="group flex items-center gap-1.5 border border-accent/40 px-3.5 py-1.5 transition-all duration-200 hover:border-accent hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{
                transitionTimingFunction: "cubic-bezier(0.77, 0, 0.175, 1)",
              }}
            >
              <span className="relative top-px font-bebas-neue text-[15px] leading-none tracking-[0.14em] text-accent transition-colors duration-200 group-hover:text-[#222]">
                Shop
              </span>
              <svg
                width="9"
                height="9"
                viewBox="0 0 9 9"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-accent/60 transition-[color,translate] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#222]"
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

      {/* ── MOBILE DROPDOWN — Home + About + Contact ── */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          className="border-t border-border bg-background/95 backdrop-blur-xl sm:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="mx-auto flex max-w-7xl flex-col px-6 py-4">
            <li>
              <Link
                href="/"
                onClick={() => {
                  trackNavClick("home");
                  setMenuOpen(false);
                }}
                className="flex items-center py-3 font-bebas-neue text-2xl tracking-[0.12em] text-foreground/85 transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Home
              </Link>
            </li>
            {NAV_LINKS.map(({ label, href, key }) => (
              <li key={key}>
                <Link
                  href={href}
                  onClick={() => {
                    trackNavClick(key);
                    setMenuOpen(false);
                  }}
                  className="flex items-center py-3 font-bebas-neue text-2xl tracking-[0.12em] text-foreground/85 transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
