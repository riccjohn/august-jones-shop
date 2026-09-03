"use client";

import type { ReactNode } from "react";
import { trackEmailClick } from "@/lib/analytics";
import { CONTACT_EMAIL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface EmailFallbackNoteProps {
  /** Lead-in copy shown before the tracked mailto link. */
  children: ReactNode;
  /** Call-site-specific spacing/max-width, merged with the base styling. */
  className?: string;
}

/**
 * Fallback paragraph directing visitors to email when a signup or contact
 * flow is unavailable. Renders the caller's lead-in copy followed by a
 * tracked mailto link to CONTACT_EMAIL, matching TrackedEmailLink's click
 * tracking pattern.
 */
export function EmailFallbackNote({
  children,
  className,
}: EmailFallbackNoteProps) {
  return (
    <p className={cn("text-sm/relaxed text-foreground/55", className)}>
      {children}{" "}
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        onClick={trackEmailClick}
        className="text-foreground/60 underline underline-offset-4 transition-colors duration-200 hover:text-accent hover:no-underline"
      >
        {CONTACT_EMAIL}
      </a>
    </p>
  );
}
