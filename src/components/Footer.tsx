import Image from "next/image";
import Link from "next/link";
import { FooterShopLink } from "@/components/FooterShopLink";
import InstagramIcon from "@/components/InstagramIcon";
import { InstagramLink } from "@/components/InstagramLink";
import { TrackedEmailLink } from "@/components/TrackedEmailLink";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background px-6 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1fr_auto_auto] sm:gap-16 lg:gap-24">
          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              aria-label="August Jones — home"
              className="shrink-0 w-fit"
            >
              <Image
                src="/logos/August_Jones_Logo-transparent.svg"
                alt="August Jones"
                width={100}
                height={100}
                className="h-auto w-[60px] opacity-70 hover:opacity-100 transition-opacity duration-200"
              />
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              Hand-made, one-of-a-kind upcycled sports fashion. Made in Madison,
              WI.
            </p>
          </div>

          {/* Navigate */}
          <div className="flex flex-col gap-3">
            <p className="font-geist-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55">
              Navigate
            </p>
            <nav aria-label="Footer navigation" className="flex flex-col gap-2">
              <FooterShopLink />
              <Link
                href="/about"
                className="text-sm text-foreground/75 transition-colors duration-200 hover:text-accent"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm text-foreground/75 transition-colors duration-200 hover:text-accent"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Connect */}
          <div className="flex flex-col gap-3">
            <p className="font-geist-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55">
              Connect
            </p>
            <div className="flex flex-col gap-2">
              <InstagramLink
                location="footer"
                aria-label="August Jones on Instagram"
                className="group flex items-center gap-2"
              >
                <InstagramIcon className="h-3.5 w-3.5 shrink-0 text-foreground/40" />
                <span className="text-sm text-foreground/75 transition-colors duration-200 group-hover:text-accent">
                  @augustjonesshop
                </span>
              </InstagramLink>
              <TrackedEmailLink />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-border pt-6 sm:mt-14">
          <div className="flex flex-col items-center gap-1 text-center text-[10px] tracking-wider text-foreground/45 sm:flex-row sm:justify-between">
            <p>&copy; 2026 August Jones. All rights reserved.</p>
            <p>Made with love in Madison, WI</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
