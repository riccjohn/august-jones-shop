"use client";

import Link from "next/link";
import { trackInstagramClick } from "@/lib/analytics";

interface InstagramLinkProps {
  location: "hero" | "footer";
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

/**
 * Tracked Instagram link component
 * Client component to handle click tracking with location metadata
 */
export function InstagramLink({
  location,
  children,
  className,
  "aria-label": ariaLabel,
}: InstagramLinkProps) {
  const handleClick = () => {
    trackInstagramClick(location);
  };

  return (
    <Link
      href="https://instagram.com/augustjonesshop"
      target="_blank"
      rel="noopener"
      aria-label={ariaLabel}
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
