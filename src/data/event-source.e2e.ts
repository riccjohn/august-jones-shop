import { getUpcomingEvents, sortEventsByDate } from "./events";
import { fixtureEvents } from "./events.fixture";

export const allEvents = sortEventsByDate(fixtureEvents);
export const upcomingEvents = getUpcomingEvents(
  allEvents,
  new Date("2026-04-29T12:00:00-05:00"),
);
