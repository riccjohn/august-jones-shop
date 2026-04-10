"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { trackEmailClick } from "@/lib/analytics";

/**
 * Tracked email link component
 * Client component to handle click tracking for the email address link
 */
export function TrackedEmailLink() {
  return (
    <Link
      href="mailto:hello@augustjones.shop"
      className="group flex items-center gap-2"
      onClick={trackEmailClick}
    >
      <Mail
        className="h-3.5 w-3.5 shrink-0 text-foreground/40"
        aria-hidden="true"
      />
      <span className="text-sm text-foreground/60 transition-colors duration-200 group-hover:text-accent">
        hello@augustjones.shop
      </span>
    </Link>
  );
}
