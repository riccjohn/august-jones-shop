import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventsTeaser } from "@/components/EventsTeaser";
import type { AugustJonesEvent } from "@/data/events";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Freeze time to 2026-06-01T00:00:00-05:00 so fixture events in the future remain visible
const FROZEN_DATE = new Date("2026-06-01T00:00:00-05:00");

const fixtureEvents: AugustJonesEvent[] = [
  {
    id: "test-market-alpha-2026-07-10",
    marketName: "Alpha Summer Market",
    sessions: [
      {
        startDate: "2026-07-10T10:00:00-05:00",
        endDate: "2026-07-10T16:00:00-05:00",
      },
    ],
    venueName: "Alpha Venue",
    address: {
      street: "123 Main St",
      city: "Madison",
      state: "WI",
      zip: "53703",
    },
    mapsUrl: "https://maps.google.com/?q=123+Main+St",
    eventWebsiteUrl: "https://example.com/alpha",
  },
  {
    id: "test-market-beta-2026-08-15",
    marketName: "Beta Arts Festival",
    sessions: [
      {
        startDate: "2026-08-15T11:00:00-05:00",
        endDate: "2026-08-15T18:00:00-05:00",
      },
    ],
    venueName: "Beta Venue",
    address: {
      street: "456 Oak Ave",
      city: "Chicago",
      state: "IL",
      zip: "60601",
    },
    mapsUrl: "https://maps.google.com/?q=456+Oak+Ave",
    eventWebsiteUrl: "https://example.com/beta",
  },
];

describe("EventsTeaser", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a section with aria-labelledby='events-teaser-heading'", async () => {
    await act(async () => {
      render(<EventsTeaser events={fixtureEvents} />);
    });

    const section = screen.getByRole("region", { name: /upcoming pop-ups/i });
    expect(section).toHaveAttribute("aria-labelledby", "events-teaser-heading");
  });

  it("renders both event market names", async () => {
    await act(async () => {
      render(<EventsTeaser events={fixtureEvents} />);
    });

    expect(screen.getByText("Alpha Summer Market")).toBeInTheDocument();
    expect(screen.getByText("Beta Arts Festival")).toBeInTheDocument();
  });

  it("renders a 'See all events' link with href='/events/'", async () => {
    await act(async () => {
      render(<EventsTeaser events={fixtureEvents} />);
    });

    const seeAllLink = screen.getByRole("link", { name: /see all events/i });
    expect(seeAllLink).toHaveAttribute("href", "/events/");
  });

  it("renders a Details link for each event with the correct href", async () => {
    await act(async () => {
      render(<EventsTeaser events={fixtureEvents} />);
    });

    const detailsLinks = screen.getAllByRole("link", { name: /details/i });
    expect(detailsLinks).toHaveLength(2);
    expect(detailsLinks[0]).toHaveAttribute(
      "href",
      `/events/#${fixtureEvents[0].id}`,
    );
    expect(detailsLinks[1]).toHaveAttribute(
      "href",
      `/events/#${fixtureEvents[1].id}`,
    );
  });
});
