"use client";

import { useEffect, useState } from "react";
import { type AugustJonesEvent, getEventUrgencyLabel } from "@/data/events";
import { cn } from "@/lib/utils";

interface EventUrgencyBadgeProps {
  event: AugustJonesEvent;
  isPast?: boolean;
}

export function EventUrgencyBadge({ event, isPast }: EventUrgencyBadgeProps) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(getEventUrgencyLabel(event, new Date()));
  }, [event]);

  if (isPast) {
    return (
      <span className="absolute right-0 top-0 bg-[#888] px-3 py-1.5 font-bebas-neue text-base tracking-widest text-white">
        EVENT PASSED
      </span>
    );
  }

  if (!label) return null;

  return (
    <span
      className={cn(
        "absolute right-0 top-0 px-3 py-1.5 font-bebas-neue text-base tracking-widest",
        "bg-[#ffb612] text-[#222]",
      )}
    >
      {label}
    </span>
  );
}
