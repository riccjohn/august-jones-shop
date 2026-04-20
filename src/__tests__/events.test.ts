import { describe, expect, it } from "vitest";
import {
  type AugustJonesEvent,
  formatEventDate,
  formatEventDateRange,
  formatEventTime,
  getEventDescription,
  getEventUrgencyLabel,
  getUpcomingEvents,
} from "@/data/events";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(
  overrides: Partial<AugustJonesEvent> & {
    sessions?: AugustJonesEvent["sessions"];
  },
): AugustJonesEvent {
  return {
    id: "test-event",
    marketName: "Test Market",
    sessions: overrides.sessions ?? [
      {
        startDate: "2026-05-02T12:00:00-05:00",
        endDate: "2026-05-02T17:00:00-05:00",
      },
    ],
    venueName: "Test Venue",
    address: {
      street: "123 Main St",
      city: "Madison",
      state: "WI",
      zip: "53703",
    },
    mapsUrl: "https://maps.google.com/",
    eventWebsiteUrl: "https://example.com",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// formatEventDate
// ---------------------------------------------------------------------------

describe("formatEventDate", () => {
  it("formats a Date to a human-readable string in America/Chicago timezone", () => {
    // 2026-05-02T17:00:00Z == 2026-05-02T12:00:00-05:00 (CDT is -05:00 in May)
    const date = new Date("2026-05-02T17:00:00Z");
    expect(formatEventDate(date)).toBe("May 2, 2026");
  });

  it("uses the Chicago timezone so a UTC midnight rolls to the previous Chicago day", () => {
    // 2026-05-03T04:00:00Z is still May 2 in Chicago (UTC-5)
    const date = new Date("2026-05-03T04:00:00Z");
    expect(formatEventDate(date)).toBe("May 2, 2026");
  });

  it("formats correctly for an early year", () => {
    const date = new Date("2026-01-15T18:00:00Z");
    expect(formatEventDate(date)).toBe("January 15, 2026");
  });
});

// ---------------------------------------------------------------------------
// formatEventTime
// ---------------------------------------------------------------------------

describe("formatEventTime", () => {
  it("omits :00 minutes for whole hours — shows '12 PM' not '12:00 PM'", () => {
    // noon Chicago
    const date = new Date("2026-05-02T17:00:00Z");
    expect(formatEventTime(date)).toBe("12 PM");
  });

  it("preserves non-zero minutes — shows '3:30 PM'", () => {
    // 3:30 PM Chicago = 20:30 UTC (CDT = UTC-5)
    const date = new Date("2026-05-02T20:30:00Z");
    expect(formatEventTime(date)).toBe("3:30 PM");
  });

  it("shows '3 PM' not '3:00 PM' for a whole hour in the afternoon", () => {
    // 3 PM Chicago (CDT) = 20:00 UTC
    const date = new Date("2026-05-02T20:00:00Z");
    expect(formatEventTime(date)).toBe("3 PM");
  });

  it("handles AM times correctly — shows '10 AM' not '10:00 AM'", () => {
    // 10 AM Chicago (CDT) = 15:00 UTC
    const date = new Date("2026-05-02T15:00:00Z");
    expect(formatEventTime(date)).toBe("10 AM");
  });

  it("preserves minutes in the morning — shows '10:15 AM'", () => {
    // 10:15 AM Chicago (CDT) = 15:15 UTC
    const date = new Date("2026-05-02T15:15:00Z");
    expect(formatEventTime(date)).toBe("10:15 AM");
  });
});

// ---------------------------------------------------------------------------
// formatEventDateRange
// ---------------------------------------------------------------------------

describe("formatEventDateRange", () => {
  it("returns a single date string for a single-session event", () => {
    const event = makeEvent({
      sessions: [
        { startDate: "2026-05-02T17:00:00Z", endDate: "2026-05-02T22:00:00Z" },
      ],
    });
    expect(formatEventDateRange(event)).toBe("May 2, 2026");
  });

  it("returns a range with en dash for same-month multi-session event", () => {
    const event = makeEvent({
      sessions: [
        { startDate: "2026-05-08T22:00:00Z", endDate: "2026-05-09T03:00:00Z" },
        { startDate: "2026-05-09T22:00:00Z", endDate: "2026-05-10T03:00:00Z" },
      ],
    });
    // May 8 and May 9 in Chicago
    expect(formatEventDateRange(event)).toBe("May 8–9, 2026");
  });

  it("uses an en dash (–) not a hyphen (-) for same-month ranges", () => {
    const event = makeEvent({
      sessions: [
        { startDate: "2026-05-02T17:00:00Z", endDate: "2026-05-03T00:00:00Z" },
        { startDate: "2026-05-04T17:00:00Z", endDate: "2026-05-05T00:00:00Z" },
      ],
    });
    const result = formatEventDateRange(event);
    expect(result).toContain("–");
    expect(result).not.toContain(" – ");
  });

  it("returns cross-month range with spaces around en dash", () => {
    // Apr 30 and May 2 in Chicago
    const event = makeEvent({
      sessions: [
        // Apr 30 Chicago (CDT = UTC-5): 2026-04-30T22:00:00-05:00 = 2026-05-01T03:00:00Z
        { startDate: "2026-05-01T03:00:00Z", endDate: "2026-05-01T08:00:00Z" },
        // May 2 Chicago
        { startDate: "2026-05-02T17:00:00Z", endDate: "2026-05-02T22:00:00Z" },
      ],
    });
    expect(formatEventDateRange(event)).toBe("April 30 – May 2, 2026");
  });
});

// ---------------------------------------------------------------------------
// getEventUrgencyLabel
// ---------------------------------------------------------------------------

describe("getEventUrgencyLabel", () => {
  it("returns 'TODAY' when the event starts on the same calendar day in Chicago", () => {
    // Event starts at noon Chicago (CDT) on May 2 2026 = 17:00 UTC
    const event = makeEvent({
      sessions: [
        { startDate: "2026-05-02T17:00:00Z", endDate: "2026-05-02T22:00:00Z" },
      ],
    });
    // "now" is 9 AM Chicago (CDT) on May 2 = 14:00 UTC
    const now = new Date("2026-05-02T14:00:00Z");
    expect(getEventUrgencyLabel(event, now)).toBe("TODAY");
  });

  it("returns 'TOMORROW' when the event starts the next calendar day in Chicago", () => {
    const event = makeEvent({
      sessions: [
        { startDate: "2026-05-03T17:00:00Z", endDate: "2026-05-03T22:00:00Z" },
      ],
    });
    // "now" is May 2 noon in Chicago
    const now = new Date("2026-05-02T17:00:00Z");
    expect(getEventUrgencyLabel(event, now)).toBe("TOMORROW");
  });

  it("returns null when the event is two or more days away", () => {
    const event = makeEvent({
      sessions: [
        { startDate: "2026-05-05T17:00:00Z", endDate: "2026-05-05T22:00:00Z" },
      ],
    });
    const now = new Date("2026-05-02T17:00:00Z");
    expect(getEventUrgencyLabel(event, now)).toBeNull();
  });

  it("returns null when the event was yesterday", () => {
    const event = makeEvent({
      sessions: [
        { startDate: "2026-05-01T17:00:00Z", endDate: "2026-05-01T22:00:00Z" },
      ],
    });
    const now = new Date("2026-05-02T17:00:00Z");
    expect(getEventUrgencyLabel(event, now)).toBeNull();
  });

  it("returns 'TODAY' for a multi-session event when any session is today", () => {
    const event = makeEvent({
      sessions: [
        // Yesterday
        { startDate: "2026-05-01T17:00:00Z", endDate: "2026-05-01T22:00:00Z" },
        // Today
        { startDate: "2026-05-02T17:00:00Z", endDate: "2026-05-02T22:00:00Z" },
      ],
    });
    const now = new Date("2026-05-02T14:00:00Z");
    expect(getEventUrgencyLabel(event, now)).toBe("TODAY");
  });

  // DST transition test: US spring-forward occurs on Mar 8 2026 at 2 AM local
  // Clocks go 2026-03-08T02:00:00 CST → 2026-03-08T03:00:00 CDT
  // The day is only 23 hours long.
  it("handles DST spring-forward day: TOMORROW is still the next calendar day", () => {
    // "now" is Mar 8 2026 at noon Chicago (CDT = UTC-5 after spring-forward)
    // 2026-03-08T12:00:00 CDT = 2026-03-08T17:00:00Z
    const now = new Date("2026-03-08T17:00:00Z");

    // Event is on Mar 9 2026 (tomorrow) at noon CDT = 17:00 UTC
    const event = makeEvent({
      sessions: [
        { startDate: "2026-03-09T17:00:00Z", endDate: "2026-03-09T22:00:00Z" },
      ],
    });
    expect(getEventUrgencyLabel(event, now)).toBe("TOMORROW");
  });

  it("handles DST fall-back day correctly (Nov 1 2026, 25-hour day)", () => {
    // Fall-back: 2026-11-01T02:00:00 CDT → 2026-11-01T01:00:00 CST
    // "now" = Nov 1 noon CST = 2026-11-01T18:00:00Z
    const now = new Date("2026-11-01T18:00:00Z");

    const event = makeEvent({
      sessions: [
        // Nov 2 noon CST = 2026-11-02T18:00:00Z
        { startDate: "2026-11-02T18:00:00Z", endDate: "2026-11-02T23:00:00Z" },
      ],
    });
    expect(getEventUrgencyLabel(event, now)).toBe("TOMORROW");
  });
});

// ---------------------------------------------------------------------------
// getUpcomingEvents
// ---------------------------------------------------------------------------

describe("getUpcomingEvents", () => {
  it("includes future events regardless of how far out they are", () => {
    const now = new Date("2026-05-02T17:00:00Z");

    const farFutureEvent = makeEvent({
      id: "far-future",
      sessions: [
        { startDate: "2026-12-25T17:00:00Z", endDate: "2026-12-25T22:00:00Z" },
      ],
    });

    const result = getUpcomingEvents([farFutureEvent], now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("far-future");
  });

  it("includes past events that ended within the last 7 days", () => {
    const now = new Date("2026-05-10T17:00:00Z");

    // Ended 3 days ago — still within the 1-week lookback
    const recentPastEvent = makeEvent({
      id: "recent-past",
      sessions: [
        { startDate: "2026-05-07T17:00:00Z", endDate: "2026-05-07T22:00:00Z" },
      ],
    });

    const result = getUpcomingEvents([recentPastEvent], now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("recent-past");
  });

  it("excludes events whose last session ended more than 7 days ago", () => {
    const now = new Date("2026-05-10T17:00:00Z");

    // Ended 8 days ago — outside the lookback window
    const oldEvent = makeEvent({
      id: "old",
      sessions: [
        { startDate: "2026-05-02T17:00:00Z", endDate: "2026-05-02T22:00:00Z" },
      ],
    });

    const result = getUpcomingEvents([oldEvent], now);
    expect(result).toHaveLength(0);
  });

  it("uses last session endDate for multi-session events", () => {
    const now = new Date("2026-05-10T17:00:00Z");

    // First session ended long ago; last session is tomorrow — should still appear
    const multiSession = makeEvent({
      id: "multi",
      sessions: [
        { startDate: "2026-04-01T17:00:00Z", endDate: "2026-04-01T22:00:00Z" },
        { startDate: "2026-05-11T17:00:00Z", endDate: "2026-05-11T22:00:00Z" },
      ],
    });

    const result = getUpcomingEvents([multiSession], now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("multi");
  });

  it("preserves input order when multiple events match", () => {
    const now = new Date("2026-05-02T17:00:00Z");

    const eventA = makeEvent({
      id: "a",
      sessions: [
        { startDate: "2026-05-03T17:00:00Z", endDate: "2026-05-03T22:00:00Z" },
      ],
    });
    const eventB = makeEvent({
      id: "b",
      sessions: [
        { startDate: "2026-05-05T17:00:00Z", endDate: "2026-05-05T22:00:00Z" },
      ],
    });

    const result = getUpcomingEvents([eventA, eventB], now);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

// ---------------------------------------------------------------------------
// getEventDescription
// ---------------------------------------------------------------------------

describe("getEventDescription", () => {
  it("returns the event's custom description when one is set", () => {
    const event = makeEvent({
      description: "Custom description for this event.",
    });
    expect(getEventDescription(event)).toBe(
      "Custom description for this event.",
    );
  });

  it("returns a generated description mentioning the market name when no custom description", () => {
    const event = makeEvent({ marketName: "Test Market" });
    const result = getEventDescription(event);
    expect(result).toContain("Test Market");
  });

  it("generated description mentions August Jones brand", () => {
    const event = makeEvent({ marketName: "Some Fest" });
    const result = getEventDescription(event);
    expect(result).toContain("August Jones");
  });

  it("returns custom description over generated when both could apply", () => {
    const event = makeEvent({
      marketName: "Should Not Appear In Output",
      description: "Specific custom text.",
    });
    expect(getEventDescription(event)).toBe("Specific custom text.");
  });
});
