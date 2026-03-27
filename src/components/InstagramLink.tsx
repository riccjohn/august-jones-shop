"use client";

import Link from "next/link";
import { trackInstagramClick } from "@/lib/analytics";

interface InstagramLinkProps {
  location: "hero" | "footer";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
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
  style,
  "aria-label": ariaLabel,
}: InstagramLinkProps) {
  return (
    <Link
      href="https://instagram.com/augustjonesshop"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={className}
      style={style}
      onClick={() => trackInstagramClick(location)}
    >
      {children}
    </Link>
  );
}
