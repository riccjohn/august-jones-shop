import { getUpcomingEvents } from "./events";
import { fixtureEvents } from "./events.fixture";

export const allEvents = fixtureEvents;
export const upcomingEvents = getUpcomingEvents(
  fixtureEvents,
  new Date("2099-06-15T12:00:00-05:00"),
);
