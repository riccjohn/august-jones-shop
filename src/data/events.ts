export interface AugustJonesEvent {
  id: string;
  marketName: string;
  startDate: string;
  endDate: string;
  venueName: string;
  city: string;
  address: { street: string; city: string; state: string; zip: string };
  mapsUrl: string;
  eventWebsiteUrl: string;
  description: string;
  image?: string;
  instagramUrl?: string;
}

const events: AugustJonesEvent[] = [
  {
    id: "mad-city-makers-market-2026-05-10",
    marketName: "Mad City Makers Market",
    startDate: "2026-05-10T10:00:00-05:00",
    endDate: "2026-05-10T16:00:00-05:00",
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
    startDate: "2026-05-30T09:00:00-05:00",
    endDate: "2026-05-30T15:00:00-05:00",
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
    id: "chicago-renegade-craft-fair-2026-06-14",
    marketName: "Renegade Craft Fair Chicago",
    startDate: "2026-06-14T11:00:00-05:00",
    endDate: "2026-06-14T18:00:00-05:00",
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
    startDate: "2026-06-26T17:00:00-05:00",
    endDate: "2026-06-26T22:00:00-05:00",
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
    startDate: "2026-07-18T10:00:00-05:00",
    endDate: "2026-07-18T16:00:00-05:00",
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

export function getUpcomingEvents(): AugustJonesEvent[] {
  return events.filter(
    (e) => new Date(e.endDate).getTime() + ONE_WEEK_MS > Date.now(),
  );
}
