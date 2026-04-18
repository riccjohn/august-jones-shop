export interface EventSession {
  // Must use an explicit UTC offset (e.g. "-05:00"), never "Z". See EVENT_TIMEZONE.
  startDate: string;
  // Must use an explicit UTC offset (e.g. "-05:00"), never "Z". See EVENT_TIMEZONE.
  endDate: string;
}

export interface AugustJonesEvent {
  id: string;
  marketName: string;
  sessions: [EventSession, ...EventSession[]];
  venueName: string;
  address: { street: string; city: string; state: string; zip: string };
  mapsUrl: string;
  eventWebsiteUrl: string;
  description?: string;
  discount?: { code: string; label: string };
  image?: string; // reserved: per-event OG image override
  instagramUrl?: string; // reserved: link to event announcement post
}

const events: AugustJonesEvent[] = [
  {
    id: "madison-makers-market-2026-05-02",
    marketName: "Madison Makers Market",
    sessions: [
      {
        startDate: "2026-05-02T12:00:00-05:00",
        endDate: "2026-05-02T17:00:00-05:00",
      },
    ],
    venueName: "Vintage Brewing",
    address: {
      street: "803 E Washington Ave",
      city: "Madison",
      state: "WI",
      zip: "53703",
    },
    mapsUrl:
      "https://maps.google.com/?q=803+E+Washington+Ave,+Madison,+WI+53703",
    eventWebsiteUrl: "https://www.madisonmakersmarket.com/spring-market",
  },
  {
    id: "chicago-artisan-market-2026-05-03",
    marketName: "Chicago Artisan Market – Fulton Market",
    sessions: [
      {
        startDate: "2026-05-03T11:00:00-05:00",
        endDate: "2026-05-03T17:00:00-05:00",
      },
    ],
    venueName: "Morgan MFG",
    address: {
      street: "401 N Morgan St",
      city: "Chicago",
      state: "IL",
      zip: "60642",
    },
    mapsUrl: "https://maps.google.com/?q=401+N+Morgan+St,+Chicago,+IL+60642",
    eventWebsiteUrl: "https://chicagoartisanmarket.com/tickets-fulton-market/",
    discount: { code: "augustjones", label: "Free General Admission" },
  },
  {
    id: "sauced-night-market-2026-05-08",
    marketName: "Sauced Night Market Chicago",
    sessions: [
      {
        startDate: "2026-05-08T17:00:00-05:00",
        endDate: "2026-05-08T22:00:00-05:00",
      },
      {
        startDate: "2026-05-09T17:00:00-05:00",
        endDate: "2026-05-09T22:00:00-05:00",
      },
    ],
    venueName: "Ignite Glass Studios",
    address: {
      street: "401 N Armour St",
      city: "Chicago",
      state: "IL",
      zip: "60642",
    },
    mapsUrl: "https://maps.google.com/?q=401+N+Armour+St,+Chicago,+IL+60642",
    eventWebsiteUrl: "https://www.saucedmarket.com/next-market",
  },
  {
    id: "caplock-athletics-2026-05-16",
    marketName: "Pop-Up at Caplock Athletics",
    sessions: [
      {
        startDate: "2026-05-16T10:00:00-05:00",
        endDate: "2026-05-16T15:00:00-05:00",
      },
    ],
    venueName: "Caplock Athletics",
    address: {
      street: "2903 W Diversey Ave",
      city: "Chicago",
      state: "IL",
      zip: "60647",
    },
    mapsUrl:
      "https://maps.google.com/?q=2903+W+Diversey+Ave,+Chicago,+IL+60647",
    eventWebsiteUrl: "https://www.caplockathletics.com/",
  },
];

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getEventDescription(event: AugustJonesEvent): string {
  return (
    event.description ??
    `Come find August Jones at ${event.marketName}! Browse one-of-a-kind upcycled sports fashion — hoodies, jackets, and streetwear handmade from pro sports jerseys and fan gear.`
  );
}

export const EVENT_TIMEZONE = "America/Chicago";

export function formatEventDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: EVENT_TIMEZONE,
  });
}

export function formatEventTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: EVENT_TIMEZONE,
  });
}

export function formatEventDateRange(event: AugustJonesEvent): string {
  const first = new Date(event.sessions[0].startDate);
  const last = new Date(event.sessions[event.sessions.length - 1].startDate);

  if (event.sessions.length === 1) {
    return formatEventDate(first);
  }

  const firstMonth = first.toLocaleDateString("en-US", {
    month: "long",
    timeZone: EVENT_TIMEZONE,
  });
  const lastMonth = last.toLocaleDateString("en-US", {
    month: "long",
    timeZone: EVENT_TIMEZONE,
  });
  const firstDay = first.toLocaleDateString("en-US", {
    day: "numeric",
    timeZone: EVENT_TIMEZONE,
  });
  const lastDay = last.toLocaleDateString("en-US", {
    day: "numeric",
    timeZone: EVENT_TIMEZONE,
  });
  const year = last.toLocaleDateString("en-US", {
    year: "numeric",
    timeZone: EVENT_TIMEZONE,
  });

  if (firstMonth === lastMonth) {
    return `${firstMonth} ${firstDay}–${lastDay}, ${year}`;
  }
  return `${firstMonth} ${firstDay} – ${lastMonth} ${lastDay}, ${year}`;
}

export function getEventUrgencyLabel(
  event: AugustJonesEvent,
  now = new Date(),
): "TODAY" | "TOMORROW" | null {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      timeZone: EVENT_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  const todayStr = fmt(now);
  // Adding raw ms fails on DST transition days (23h or 25h). Instead, parse
  // today's Chicago calendar date and construct 18:00 UTC on day+1, which is
  // noon CST / 1 PM CDT — always tomorrow in Chicago regardless of DST.
  const [mm, dd, yyyy] = todayStr.split("/").map(Number);
  const tomorrowStr = fmt(new Date(Date.UTC(yyyy, mm - 1, dd + 1, 18, 0, 0)));

  for (const session of event.sessions) {
    const sessionStr = fmt(new Date(session.startDate));
    if (sessionStr === todayStr) return "TODAY";
    if (sessionStr === tomorrowStr) return "TOMORROW";
  }
  return null;
}

export function getUpcomingEvents(
  source: AugustJonesEvent[] = events,
  now = new Date(),
): AugustJonesEvent[] {
  return source.filter((e) => {
    const lastSession = e.sessions[e.sessions.length - 1];
    return (
      new Date(lastSession.endDate).getTime() + ONE_WEEK_MS > now.getTime()
    );
  });
}
