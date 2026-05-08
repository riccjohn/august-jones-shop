import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventCard } from "@/components/EventCard";
import type { AugustJonesEvent } from "@/data/events";

vi.mock("@/components/AddToCalendarButton", () => ({
  AddToCalendarButton: () => null,
}));

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

// Single-session event fixture
const singleSessionEvent: AugustJonesEvent = {
  id: "test-event-single",
  marketName: "Test Market",
  sessions: [
    {
      startDate: "2026-06-15T12:00:00-05:00",
      endDate: "2026-06-15T17:00:00-05:00",
    },
  ],
  venueName: "Test Venue Hall",
  address: {
    street: "123 Main St",
    city: "Madison",
    state: "WI",
    zip: "53703",
  },
  mapsUrl: "https://maps.google.com/?q=123+Main+St,+Madison,+WI+53703",
  eventWebsiteUrl: "https://testmarket.example.com",
};

// Single-session event with discount
const eventWithDiscount: AugustJonesEvent = {
  ...singleSessionEvent,
  id: "test-event-discount",
  discount: { code: "SAVE20", label: "20% Off" },
};

// Multi-session event fixture
const multiSessionEvent: AugustJonesEvent = {
  id: "test-event-multi",
  marketName: "Multi Day Market",
  sessions: [
    {
      startDate: "2026-07-10T11:00:00-05:00",
      endDate: "2026-07-10T17:00:00-05:00",
    },
    {
      startDate: "2026-07-11T11:00:00-05:00",
      endDate: "2026-07-11T17:00:00-05:00",
    },
  ],
  venueName: "Multi Venue",
  address: {
    street: "456 Oak Ave",
    city: "Chicago",
    state: "IL",
    zip: "60601",
  },
  mapsUrl: "https://maps.google.com/?q=456+Oak+Ave,+Chicago,+IL+60601",
  eventWebsiteUrl: "https://multidaymarket.example.com",
};

describe("EventCard", () => {
  describe("venue link", () => {
    it("renders venue name as a link with the event mapsUrl", () => {
      render(<EventCard event={singleSessionEvent} />);
      const venueLink = screen.getByTestId("event-venue");
      expect(venueLink.tagName).toBe("A");
      expect(venueLink).toHaveAttribute("href");
      expect(venueLink.getAttribute("href")).toMatch(/^https:\/\/maps\./);
      expect(venueLink.getAttribute("href")).toBe(singleSessionEvent.mapsUrl);
    });
  });

  describe("city chip", () => {
    it("renders a chip showing the event city and state", () => {
      render(<EventCard event={singleSessionEvent} />);
      const cityChip = screen.getByTestId("event-city");
      expect(cityChip).toHaveTextContent("Madison");
      expect(cityChip).toHaveTextContent("WI");
    });
  });

  describe("title link", () => {
    it("renders market name linking to eventWebsiteUrl", () => {
      render(<EventCard event={singleSessionEvent} />);
      const titleLink = screen.getByRole("link", {
        name: /Test Market/i,
      });
      expect(titleLink).toHaveAttribute(
        "href",
        singleSessionEvent.eventWebsiteUrl,
      );
    });
  });

  describe("discount code", () => {
    it("renders the discount code when event.discount is set", () => {
      render(<EventCard event={eventWithDiscount} />);
      expect(screen.getByText("SAVE20")).toBeInTheDocument();
    });

    it("does not render a discount code when event.discount is absent", () => {
      render(<EventCard event={singleSessionEvent} />);
      expect(screen.queryByText("SAVE20")).not.toBeInTheDocument();
    });
  });

  describe("session dates", () => {
    it("renders exactly one session date element for a single-day event", () => {
      render(<EventCard event={singleSessionEvent} />);
      const sessionDates = screen.getAllByTestId("event-session-date");
      expect(sessionDates).toHaveLength(1);
    });

    it("renders exactly two session date elements for a two-session event", () => {
      render(<EventCard event={multiSessionEvent} />);
      const sessionDates = screen.getAllByTestId("event-session-date");
      expect(sessionDates).toHaveLength(2);
    });
  });

  describe("EventUrgencyBadge", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("renders TODAY badge when current date matches the event start day", async () => {
      // Set time to the same calendar day as the event start (noon Chicago time = 17:00 UTC on June 15)
      vi.setSystemTime(new Date("2026-06-15T17:00:00.000Z"));
      await act(async () => {
        render(<EventCard event={singleSessionEvent} isPast={false} />);
      });
      expect(screen.getByText("TODAY")).toBeInTheDocument();
    });

    it("renders TOMORROW badge when current date is the day before the event start", async () => {
      // Set time to the day before the event (June 14 Chicago time)
      vi.setSystemTime(new Date("2026-06-14T17:00:00.000Z"));
      await act(async () => {
        render(<EventCard event={singleSessionEvent} isPast={false} />);
      });
      expect(screen.getByText("TOMORROW")).toBeInTheDocument();
    });

    it("renders EVENT PASSED badge when isPast is true", () => {
      render(<EventCard event={singleSessionEvent} isPast={true} />);
      expect(screen.getByText("EVENT PASSED")).toBeInTheDocument();
    });
  });

  describe("AddToCalendarButton", () => {
    it("does not render AddToCalendarButton when isPast is true", () => {
      // Since AddToCalendarButton is stubbed to return null, we verify the
      // wrapper div that conditionally renders it is absent. The component
      // only renders the calendar button wrapper when !isPast.
      const { container } = render(
        <EventCard event={singleSessionEvent} isPast={true} />,
      );
      // The conditional wrapper div only appears when !isPast
      // We check by re-rendering with isPast=false to verify contrast
      const pastHtml = container.innerHTML;

      cleanup();

      const { container: upcomingContainer } = render(
        <EventCard event={singleSessionEvent} isPast={false} />,
      );
      const upcomingHtml = upcomingContainer.innerHTML;

      // The upcoming version has the flex wrapper div for the calendar button
      expect(upcomingHtml).toContain("flex-col");
      // The past version should not contain that wrapper
      expect(pastHtml).not.toContain("flex-col");
    });

    it("renders AddToCalendarButton wrapper when isPast is false", () => {
      const { container } = render(
        <EventCard event={singleSessionEvent} isPast={false} />,
      );
      // The wrapper div with flex-col is rendered when !isPast
      expect(container.innerHTML).toContain("flex-col");
    });
  });
});
