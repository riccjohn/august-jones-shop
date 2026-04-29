"use client";

import { useEffect, useState } from "react";
import { EventCard } from "@/components/EventCard";
import {
  type AugustJonesEvent,
  getUpcomingEvents,
  isEventPast,
} from "@/data/events";
import { trackShopClick } from "@/lib/analytics";
import { SHOP_URL } from "@/lib/constants";

interface EventListClientProps {
  events: AugustJonesEvent[];
}

interface VisibleEvent {
  event: AugustJonesEvent;
  isPast: boolean;
}

export function EventListClient({ events }: EventListClientProps) {
  // Initial state shows all events so SSR HTML is non-empty; effect trims past ones post-hydration.
  // Past-within-7d events initially appear as upcoming (full styling, calendar button visible)
  // until useEffect corrects them — acceptable trade-off vs blank first paint.
  const [visible, setVisible] = useState<VisibleEvent[]>(
    events.map((event) => ({ event, isPast: false })),
  );

  useEffect(() => {
    const now = new Date();
    setVisible(
      getUpcomingEvents(events, now).map((event) => ({
        event,
        isPast: isEventPast(event, now),
      })),
    );
  }, [events]);

  if (visible.length === 0) {
    return (
      <div className="py-20">
        <h2 className="mb-3 font-bebas-neue text-3xl tracking-wide text-[#f6f4f0] sm:text-4xl">
          Check back soon
        </h2>
        <p className="mb-8 text-base text-[#f6f4f0]/60">
          No events scheduled right now. Follow us on Instagram for
          announcements, or shop our current pieces in our{" "}
          <a
            href={SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[#f6f4f0]"
            onClick={() => trackShopClick("events_empty_state")}
          >
            shop
          </a>
          .
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href={SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#ffb612] px-6 py-3 font-bebas-neue text-lg tracking-widest text-[#222] transition-opacity hover:opacity-90"
            onClick={() => trackShopClick("events_empty_state")}
          >
            Shop
          </a>
          <a
            href="https://instagram.com/augustjonesshop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-[#ffb612]/50 px-6 py-3 font-bebas-neue text-lg tracking-widest text-[#f6f4f0] transition-opacity hover:opacity-90"
          >
            Follow on Instagram
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {visible.map(({ event, isPast }, index) => (
        <div key={event.id}>
          {index > 0 && <div className="h-px bg-[#ffb612]" />}
          <EventCard event={event} isPast={isPast} />
        </div>
      ))}
    </div>
  );
}
