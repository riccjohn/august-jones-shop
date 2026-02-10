import { Mail } from "lucide-react";
import Link from "next/link";
import { FooterShopLink } from "@/components/FooterShopLink";
import InstagramIcon from "@/components/InstagramIcon";
import { InstagramLink } from "@/components/InstagramLink";

export const Footer = () => {
  return (
    <footer className="bg-foreground px-6 py-10 text-background sm:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Main footer content: two groups side by side on desktop */}
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-12">
          {/* Navigate group */}
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <p className="text-xs font-medium uppercase tracking-widest text-background/50">
              Navigate
            </p>
            <nav
              aria-label="Footer navigation"
              className="flex flex-col items-center gap-2 sm:items-start"
            >
              <FooterShopLink />
            </nav>
          </div>

          {/* Connect group */}
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <p className="text-xs font-medium uppercase tracking-widest text-background/50">
              Connect
            </p>
            <div className="flex flex-col items-center gap-2 sm:items-end">
              <InstagramLink
                location="footer"
                aria-label="August Jones on Instagram"
                className="group flex items-center gap-2"
              >
                <InstagramIcon className="h-4 w-4 shrink-0 opacity-80" />
                <span className="text-sm text-background/90 transition-colors duration-200 group-hover:text-[#ffb612]">
                  @augustjonesshop
                </span>
              </InstagramLink>
              <Link
                href="mailto:hello@augustjones.shop"
                className="group flex items-center gap-2"
              >
                <Mail
                  className="h-4 w-4 shrink-0 opacity-80"
                  aria-hidden="true"
                />
                <span className="text-sm text-background/90 transition-colors duration-200 group-hover:text-[#ffb612]">
                  hello@augustjones.shop
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-background/10" />

        {/* Copyright row */}
        <div className="flex flex-col items-center gap-1 text-center text-xs text-background/60 sm:flex-row sm:justify-between">
          <p>&copy; 2026 August Jones. All rights reserved.</p>
          <p>
            Made with <span className="text-[#ffb612]">❤️</span> in Madison, WI
          </p>
        </div>
      </div>
    </footer>
  );
};
