import { getUpcomingEvents } from "./events";
import { fixtureEvents } from "./events.fixture";

export const allEvents = fixtureEvents;
export const upcomingEvents = getUpcomingEvents(
  fixtureEvents,
  new Date("2026-04-29T12:00:00-05:00"),
);
