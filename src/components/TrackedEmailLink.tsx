"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { trackEmailClick } from "@/lib/analytics";

/**
 * Tracked email link component
 * Client component to handle click tracking for the email address link
 */
export function TrackedEmailLink() {
  const handleClick = () => {
    trackEmailClick();
  };

  return (
    <Link
      href="mailto:hello@augustjones.shop"
      className="group flex items-center gap-2"
      onClick={handleClick}
    >
      <Mail className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
      <span className="text-sm text-background/90 transition-colors duration-200 group-hover:text-[#ffb612]">
        hello@augustjones.shop
      </span>
    </Link>
  );
}
