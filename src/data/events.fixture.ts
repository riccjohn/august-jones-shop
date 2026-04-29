import type { AugustJonesEvent } from "./events";

// Stable fixture events used during E2E tests (E2E_TEST=true).
// Names, venues, and addresses are intentionally absurd so it's obvious
// when fixture data is being served instead of real data.
// Each event covers specific test scenarios — do not change IDs or dates.
export const fixtureEvents: AugustJonesEvent[] = [
  {
    // Covers: title-links-to-website, single-day session count, city chip (Madison), TODAY badge
    id: "fixture-single-day-event-2026-04-29",
    marketName: "FAKE Market: Single Day",
    sessions: [
      {
        startDate: "2026-04-29T12:00:00-05:00",
        endDate: "2026-04-29T17:00:00-05:00",
      },
    ],
    venueName: "Imaginary Venue Alpha",
    address: {
      street: "1 Nonexistent Blvd",
      city: "Madison",
      state: "WI",
      zip: "00001",
    },
    mapsUrl: "https://maps.google.com/?q=1+Nonexistent+Blvd,+Madison,+WI+00001",
    eventWebsiteUrl: "https://example.com/fixture-single-day",
  },
  {
    // Covers: discount code display, TOMORROW badge
    id: "fixture-discount-event-2026-04-30",
    marketName: "FAKE Market: Discount",
    sessions: [
      {
        startDate: "2026-04-30T11:00:00-05:00",
        endDate: "2026-04-30T17:00:00-05:00",
      },
    ],
    venueName: "Imaginary Venue Beta",
    address: {
      street: "2 Nonexistent Blvd",
      city: "Chicago",
      state: "IL",
      zip: "00002",
    },
    mapsUrl: "https://maps.google.com/?q=2+Nonexistent+Blvd,+Chicago,+IL+00002",
    eventWebsiteUrl: "https://example.com/fixture-discount",
    discount: { code: "FIXTURE-CODE", label: "Free General Admission" },
  },
  {
    // Covers: multi-day session count (2 sessions), single Add to Calendar button
    id: "fixture-multi-day-event-2026-05-01",
    marketName: "FAKE Market: Multi Day",
    sessions: [
      {
        startDate: "2026-05-01T17:00:00-05:00",
        endDate: "2026-05-01T22:00:00-05:00",
      },
      {
        startDate: "2026-05-02T17:00:00-05:00",
        endDate: "2026-05-02T22:00:00-05:00",
      },
    ],
    venueName: "Imaginary Venue Gamma",
    address: {
      street: "3 Nonexistent Blvd",
      city: "Chicago",
      state: "IL",
      zip: "00003",
    },
    mapsUrl: "https://maps.google.com/?q=3+Nonexistent+Blvd,+Chicago,+IL+00003",
    eventWebsiteUrl: "https://example.com/fixture-multi-day",
  },
  {
    // Covers: past event — ended 1 week before frozen E2E now (2026-04-29T12:00:00-05:00)
    // endDate is 2026-04-22T17:00:00-05:00, within the 7-day lookback window
    id: "fixture-past-event",
    marketName: "FAKE Market: Past Event",
    sessions: [
      {
        startDate: "2026-04-22T12:00:00-05:00",
        endDate: "2026-04-22T17:00:00-05:00",
      },
    ],
    venueName: "Imaginary Venue Delta",
    address: {
      street: "4 Nonexistent Blvd",
      city: "Madison",
      state: "WI",
      zip: "00004",
    },
    mapsUrl: "https://maps.google.com/?q=4+Nonexistent+Blvd,+Madison,+WI+00004",
    eventWebsiteUrl: "https://example.com/fixture-past-event",
  },
];
