export interface EventSession {
  startDate: string;
  endDate: string;
}

export interface AugustJonesEvent {
  id: string;
  marketName: string;
  sessions: EventSession[];
  venueName: string;
  city: string;
  address: { street: string; city: string; state: string; zip: string };
  mapsUrl: string;
  eventWebsiteUrl: string;
  description?: string;
  entryFeeDiscountCode?: string;
  image?: string;
  instagramUrl?: string;
}

const events: AugustJonesEvent[] = [
  {
    id: "madison-spring-pop-up-2026-04-17",
    marketName: "Madison Spring Pop-Up",
    sessions: [
      {
        startDate: "2026-04-17T16:00:00-05:00",
        endDate: "2026-04-17T20:00:00-05:00",
      },
      {
        startDate: "2026-04-18T12:00:00-05:00",
        endDate: "2026-04-18T20:00:00-05:00",
      },
    ],
    venueName: "The Collective MKE",
    city: "Madison, WI",
    address: {
      street: "214 W State St",
      city: "Madison",
      state: "WI",
      zip: "53703",
    },
    mapsUrl: "https://maps.google.com/?q=214+W+State+St,+Madison,+WI+53703",
    eventWebsiteUrl: "https://augustjones.shop",
    entryFeeDiscountCode: "AUGUSTJONES10",
    description:
      "Two-day spring pop-up on State Street! Stop by Friday evening after work or swing through Saturday for the full afternoon. Shop one-of-a-kind upcycled sports streetwear — every piece is handmade and won't last long.",
  },
  {
    id: "mad-city-makers-market-2026-05-10",
    marketName: "Mad City Makers Market",
    sessions: [
      {
        startDate: "2026-05-10T10:00:00-05:00",
        endDate: "2026-05-10T16:00:00-05:00",
      },
    ],
    venueName: "Olbrich Botanical Gardens",
    city: "Madison, WI",
    address: {
      street: "3330 Atwood Ave",
      city: "Madison",
      state: "WI",
      zip: "53704",
    },
    mapsUrl: "https://maps.google.com/?q=3330+Atwood+Ave,+Madison,+WI+53704",
    eventWebsiteUrl: "https://madcitymakersmarket.com",
    description:
      "Come find August Jones at the Mad City Makers Market! Browse one-of-a-kind upcycled sports fashion pieces — hoodies, jackets, and streetwear made from pro sports jerseys and fan gear. Every piece is handmade and one-of-a-kind.",
  },
  {
    id: "milwaukees-best-craft-fair-2026-05-30",
    marketName: "Milwaukee's Best Craft Fair",
    sessions: [
      {
        startDate: "2026-05-30T09:00:00-05:00",
        endDate: "2026-05-30T15:00:00-05:00",
      },
    ],
    venueName: "Walker's Point Center for the Arts",
    city: "Milwaukee, WI",
    address: {
      street: "839 S 5th St",
      city: "Milwaukee",
      state: "WI",
      zip: "53204",
    },
    mapsUrl: "https://maps.google.com/?q=839+S+5th+St,+Milwaukee,+WI+53204",
    eventWebsiteUrl: "https://milwaukeebestcraftfair.com",
    description:
      "August Jones is heading to Milwaukee for the Best Craft Fair! Shop unique upcycled streetwear — each piece is handcrafted from reclaimed pro sports jerseys and fan gear. No two pieces are alike.",
  },
  {
    id: "chicago-renegade-craft-fair-2026-06-13",
    marketName: "Renegade Craft Fair Chicago",
    sessions: [
      {
        startDate: "2026-06-13T11:00:00-05:00",
        endDate: "2026-06-13T19:00:00-05:00",
      },
      {
        startDate: "2026-06-14T11:00:00-05:00",
        endDate: "2026-06-14T18:00:00-05:00",
      },
    ],
    venueName: "Wicker Park",
    city: "Chicago, IL",
    address: {
      street: "1425 N Damen Ave",
      city: "Chicago",
      state: "IL",
      zip: "60622",
    },
    mapsUrl: "https://maps.google.com/?q=1425+N+Damen+Ave,+Chicago,+IL+60622",
    eventWebsiteUrl: "https://renegadecraft.com/chicago",
    description:
      "August Jones will be at the Renegade Craft Fair in Chicago's Wicker Park neighborhood! Find handmade upcycled sports streetwear — hoodies, sweatpants, and jackets made from upcycled pro sports jerseys. Come say hi!",
  },
  {
    id: "madison-night-market-2026-06-26",
    marketName: "Madison Night Market",
    sessions: [
      {
        startDate: "2026-06-26T17:00:00-05:00",
        endDate: "2026-06-26T22:00:00-05:00",
      },
    ],
    venueName: "State Street",
    city: "Madison, WI",
    address: {
      street: "State St",
      city: "Madison",
      state: "WI",
      zip: "53703",
    },
    mapsUrl: "https://maps.google.com/?q=State+St,+Madison,+WI+53703",
    eventWebsiteUrl: "https://madisonnightmarket.com",
    description:
      "Evening market vibes on State Street! August Jones will be showcasing the latest upcycled sports fashion pieces under the lights. Each hoodie, jacket, and set is one-of-a-kind and handmade right here in Madison, WI.",
  },
  {
    id: "brew-city-summer-market-2026-07-18",
    marketName: "Brew City Summer Market",
    sessions: [
      {
        startDate: "2026-07-18T10:00:00-05:00",
        endDate: "2026-07-18T16:00:00-05:00",
      },
    ],
    venueName: "Henry Maier Festival Park",
    city: "Milwaukee, WI",
    address: {
      street: "200 N Harbor Dr",
      city: "Milwaukee",
      state: "WI",
      zip: "53202",
    },
    mapsUrl: "https://maps.google.com/?q=200+N+Harbor+Dr,+Milwaukee,+WI+53202",
    eventWebsiteUrl: "https://brewcitysummermarket.com",
    description:
      "Join August Jones at the Brew City Summer Market on the Milwaukee lakefront! Shop upcycled sports streetwear handmade from pro sports jerseys. Limited inventory — every piece is one-of-a-kind.",
  },
];

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getEventName(event: AugustJonesEvent): string {
  return `August Jones at ${event.marketName}`;
}

export function getEventDescription(event: AugustJonesEvent): string {
  return (
    event.description ??
    `Come find August Jones at ${event.marketName}! Browse one-of-a-kind upcycled sports fashion — hoodies, jackets, and streetwear handmade from pro sports jerseys and fan gear. Every piece is handmade and one-of-a-kind.`
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
): "TODAY" | "TOMORROW" | null {
  const now = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      timeZone: EVENT_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  const todayStr = fmt(now);
  const tomorrowStr = fmt(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  for (const session of event.sessions) {
    const sessionStr = fmt(new Date(session.startDate));
    if (sessionStr === todayStr) return "TODAY";
    if (sessionStr === tomorrowStr) return "TOMORROW";
  }
  return null;
}

export function getUpcomingEvents(): AugustJonesEvent[] {
  return events.filter((e) => {
    const lastSession = e.sessions[e.sessions.length - 1];
    return new Date(lastSession.endDate).getTime() + ONE_WEEK_MS > Date.now();
  });
}
