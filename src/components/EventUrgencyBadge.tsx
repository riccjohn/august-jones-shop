"use client";

import { useEffect, useState } from "react";
import { type AugustJonesEvent, getEventUrgencyLabel } from "@/data/events";

interface EventUrgencyBadgeProps {
  event: AugustJonesEvent;
}

export function EventUrgencyBadge({ event }: EventUrgencyBadgeProps) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(getEventUrgencyLabel(event, new Date()));
  }, [event]);

  if (!label) return null;

  return (
    <span className="absolute right-0 top-0 bg-[#ffb612] px-3 py-1.5 font-bebas-neue text-base tracking-widest text-[#222]">
      {label}
    </span>
  );
}
