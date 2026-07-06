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
}

export const allEvents: AugustJonesEvent[] = [
  {
    id: "sauced-night-market-chicago-2026-07-11",
    marketName: "Sauced Night Market Chicago",
    sessions: [
      {
        startDate: "2026-07-10T17:00:00-05:00",
        endDate: "2026-07-10T22:00:00-05:00",
      },
      {
        startDate: "2026-07-11T17:00:00-05:00",
        endDate: "2026-07-11T22:00:00-05:00",
      },
    ],
    venueName: "Ignite Glass Studios",
    address: {
      street: "401 N Armour St",
      city: "Chicago",
      state: "IL",
      zip: "60642",
    },
    mapsUrl: "https://maps.app.goo.gl/DZKQfQ4t6nMRU37g6",
    eventWebsiteUrl: "https://www.saucedmarket.com/chicago",
  },

  {
    id: "renegade-craft-chicago-2026-07-18",
    marketName: "Renegade Craft Chicago",
    sessions: [
      {
        startDate: "2026-07-18T11:00-05:00",
        endDate: "2026-07-18T18:00-05:00",
      },
      {
        startDate: "2026-07-19T11:00-05:00",
        endDate: "2026-07-19T18:00-05:00",
      },
    ],
    venueName:
      "Booth 167 - Kedzie Blvd. between W. Fullerton Ave. + W. Palmer Square",
    address: {
      street: "Kedzie Blvd. between W. Fullerton Ave. + W. Palmer Square",
      city: "Chicago",
      state: "IL",
      zip: "60647",
    },
    mapsUrl: "https://maps.app.goo.gl/TB3LeUxQWuNknjub9",
    eventWebsiteUrl: "https://www.renegadecraft.com/event/chicago-summer/",
  },
  {
    id: "rusty-bee-2026-07-23:",
    address: {
      street: "5134 E Cheryl Pkwy",
      city: "Fitchburg",
      state: "WI",
      zip: "53711",
    },
    eventWebsiteUrl: "https://www.instagram.com/therustybeelounge/",
    mapsUrl: "https://maps.app.goo.gl/hMBNM21yQBxh2adA7",
    marketName: "Rusty Bee Night Market",
    sessions: [
      {
        startDate: "2026-07-23T17:00:00-05:00",
        endDate: "2026-07-23T21:00:00-05:00",
      },
    ],
    venueName: "The Rusty Bee Lounge",
  },

  {
    id: "rusty-bee-2026-08-27:",
    address: {
      street: "5134 E Cheryl Pkwy",
      city: "Fitchburg",
      state: "WI",
      zip: "53711",
    },
    eventWebsiteUrl: "https://www.instagram.com/therustybeelounge/",
    mapsUrl: "https://maps.app.goo.gl/hMBNM21yQBxh2adA7",
    marketName: "Rusty Bee Night Market",
    sessions: [
      {
        startDate: "2026-08-27T17:00:00-05:00",
        endDate: "2026-08-27T21:00:00-05:00",
      },
    ],
    venueName: "The Rusty Bee Lounge",
  },
  {
    id: "marina-fest-door-county-2027-09-05",
    marketName: "Marina Fest - Door County",
    sessions: [
      {
        startDate: "2027-09-05T09:00-05:00",
        endDate: "2027-09-05T17:00-05:00",
      },
      {
        startDate: "2027-09-06T09:00-05:00",
        endDate: "2027-09-06T17:00-05:00",
      },
    ],
    venueName: "Sister Bay Marina",
    address: {
      street: "10708 N Bay Shore Dr.",
      city: "Sister Bay",
      state: "WI",
      zip: "54234",
    },
    mapsUrl: "https://maps.app.goo.gl/Ncz5e6YZKGGMK2hZ6",
    eventWebsiteUrl:
      "https://sisterbay.com/events/marina-fest-labor-day-weekend/",
  },
  {
    id: "milwaukee-night-market-2026-09-16",
    address: {
      street:
        "West Wisconsin Avenue between 2nd Street & Vel R. Phillips Avenue",
      city: "Milwaukee",
      state: "WI",
      zip: "53203",
    },
    mapsUrl: "https://maps.app.goo.gl/MY3NKXeRmr5wBfUD6",
    eventWebsiteUrl: "https://www.mkenightmarket.com/",
    marketName: "Milwaukee Night Market",
    sessions: [
      {
        startDate: "2026-09-16T17:00:00-05:00",
        endDate: "2026-09-16T21:00:00-05:00",
      },
    ],
    venueName:
      "West Wisconsin Avenue between 2nd Street & Vel R. Phillips Avenue",
    description:
      "Come find August Jones at Milwaukee Night Market! Browse one-of-a-kind upcycled sports fashion — hoodies, jackets, and streetwear handmade from pro sports jerseys and fan gear. Follow my instagram for updates on exactly where my tent will be!",
  },
  {
    id: "rusty-bee-2026-09-24:",
    address: {
      street: "5134 E Cheryl Pkwy",
      city: "Fitchburg",
      state: "WI",
      zip: "53711",
    },
    eventWebsiteUrl: "https://www.instagram.com/therustybeelounge/",
    mapsUrl: "https://maps.app.goo.gl/hMBNM21yQBxh2adA7",
    marketName: "Rusty Bee Night Market",
    sessions: [
      {
        startDate: "2026-09-24T17:00:00-05:00",
        endDate: "2026-09-24T21:00:00-05:00",
      },
    ],
    venueName: "The Rusty Bee Lounge",
  },
  {
    id: "chicago-artisan-market-2026-07-12",
    marketName: "Chicago Artisan Market – Fulton Market",
    description:
      "Come find August Jones at Chicago Artisan Market! Click the event name above to visit the organizer's site and use the code below for free admission",
    sessions: [
      {
        startDate: "2026-10-18T11:00-05:00",
        endDate: "2026-10-18T17:00-05:00",
      },
    ],
    venueName: "Morgan MFG",
    address: {
      street: "401 N Morgan St",
      city: "Chicago",
      state: "IL",
      zip: "60642",
    },
    discount: {
      code: "augustjones",
      label:
        "Use coupon code for free admission if you buy tickets in advance!",
    },
    mapsUrl: "https://maps.google.com/?q=401+N+Morgan+St,+Chicago,+IL+60642",
    eventWebsiteUrl: "https://chicagoartisanmarket.com/tickets-fulton-market/",
  },
  {
    id: "rusty-bee-2026-10-22:",
    address: {
      street: "5134 E Cheryl Pkwy",
      city: "Fitchburg",
      state: "WI",
      zip: "53711",
    },
    eventWebsiteUrl: "https://www.instagram.com/therustybeelounge/",
    mapsUrl: "https://maps.app.goo.gl/hMBNM21yQBxh2adA7",
    marketName: "Rusty Bee Night Market",
    sessions: [
      {
        startDate: "2026-10-22T17:00:00-05:00",
        endDate: "2026-10-22T21:00:00-05:00",
      },
    ],
    venueName: "The Rusty Bee Lounge",
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
  const minutes = new Intl.DateTimeFormat("en-US", {
    minute: "numeric",
    timeZone: EVENT_TIMEZONE,
  }).format(date);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: minutes === "0" ? undefined : "2-digit",
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

export function isEventPast(
  event: AugustJonesEvent,
  now = new Date(),
): boolean {
  const lastSession = event.sessions[event.sessions.length - 1];
  return new Date(lastSession.endDate).getTime() < now.getTime();
}

export function getUpcomingEvents(
  source: AugustJonesEvent[] = allEvents,
  now = new Date(),
): AugustJonesEvent[] {
  return source.filter((e) => {
    const lastSession = e.sessions[e.sessions.length - 1];
    const endTime = new Date(lastSession.endDate).getTime();
    return endTime + ONE_WEEK_MS > now.getTime();
  });
}
